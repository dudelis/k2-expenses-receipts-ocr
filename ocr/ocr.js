// const axios = require('axios');
const async = require('async');
const axios = require('axios');
const xml2js = require('xml2js');
const url = require("url");


class OCR {
    constructor(authLogin, authPassword, imageData, urlParams) {
        this.authLogin = authLogin;
        this.authPassword = authPassword;
        this.serverUrl = "http://cloud.ocrsdk.com";
        this.urlParams = urlParams;
        this.imageData = imageData;
    }

    processReceipt(callbackmain) {
        async.auto({
            startTask: done => {
                this._startTask(done);
            },
            getTaskStatus: ['startTask', (task, done) => {
                this._getTaskStatus(task.startTask.id[0], done);
            }],
            getTaskResult: ['getTaskStatus', (task, done) => {
                this._getTaskResult(task.getTaskStatus.resultUrl[0], done);
            }]
        }, (err, result) => callbackmain(err, result.getTaskResult));
    }
    async _startTask(callback) {
        var urlOptions = Object.keys(this.urlParams).map((key) => `${key}=${this.urlParams[key]}`).join('&');
        const axiosInstance = this._createAxiosInstance('POST', '/processReceipt?' + urlOptions, this.imageData);
        axiosInstance().then(resp => {
            const task = this._parseXmlResponse(resp.data, callback);
            callback(null, task);
        }).catch(err => {
            callback(err);
        });
    }

    _getTaskStatus(taskId, callback) {
        if (taskId.indexOf('00000000') > -1) {
            // A null Guid passed here usually means a logical error in the calling code
            callback(new Error('Null id passed'), null)
            return
        }
        const waitTimeout = 2000;
        const waitFunction = () => {
            const axiosInstance = this._createAxiosInstance('GET', '/getTaskStatus?taskId=' + taskId);
            axiosInstance().then(resp => {
                console.log(resp.data);
                const taskStatus = this._parseXmlResponse(resp.data, callback);
                callback(null, taskStatus);
            }).catch(err => {
                callback(err);
            })
        };
        setTimeout(waitFunction, waitTimeout)
    }

    _isTaskActive(taskData) {
        return taskData.status === 'Queued' || taskData.status === 'InProgress'
    }

    _getTaskResult(resultUrl, callback) {
        const parsedUrl = url.parse(resultUrl);
        //const axiosInstance = this._createAxiosInstance('GET', parsedUrl.href);
        axios.get(parsedUrl.href)
            .then(resp => {
                xml2js.parseString(resp.data, (err, result) => {
                    if (err) {
                        callback(err);
                    }
                    callback(null, result);
                });
            })
            .catch(err => {
                callback(err);
            });
    }

    _createAxiosInstance(method, urlPath, imageData) {
        const axiosInstance = axios.create({
            baseURL: this.serverUrl,
            url: urlPath,
            method,
            auth: {
                username: this.authLogin,
                password: this.authPassword
            },
            proxy: {
                hostname: 'localhost',
                port: 9999
            }
        });
        axiosInstance.defaults.headers.post['Content-Type'] = 'text/plain';
        axiosInstance.defaults.headers.post['User-Agent'] = 'node.js client library';

        if (imageData) {
            axiosInstance.defaults.data = imageData;
        }
        return axiosInstance;
    }
    _parseXmlResponse(data, taskDataCallback) {
        var response = null;
        var parser = new xml2js.Parser({
            explicitCharKey: false,
            trim: true,
            explicitRoot: true,
            mergeAttrs: true
        });
        parser.parseString(data, function (err, objResult) {
            if (err) {
                taskDataCallback(err, null)
                return
            }
            response = objResult
        });
        if (response == null) {
            return
        }
        if (response.response == null || response.response.task == null ||
            response.response.task[0] == null) {
            if (response.error != null) {
                taskDataCallback(new Error(response.error.message[0]['_']), null)
            } else {
                taskDataCallback(new Error("Unknown server response"), null)
            }
            return
        }
        var task = response.response.task[0]
        return task;
    }
}


exports.create = function (authLogin, authPassword, imageData, urlParams) {
    return new OCR(authLogin, authPassword, imageData, urlParams);
}
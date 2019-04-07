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
    processReceipt(callback) {
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
        }, (err, result) => {
            const response = {
                taskId: result.startTask.id[0],
                currency: result.getTaskResult.receipts.receipt[0].$.currency,
                vendor: result.getTaskResult.receipts.receipt[0].vendor[0].name[0].recognizedValue[0].text[0],
                vendorAddress: result.getTaskResult.receipts.receipt[0].vendor[0].fullAddress[0].text[0],
                date: result.getTaskResult.receipts.receipt[0].date[0].normalizedValue[0],
                total: result.getTaskResult.receipts.receipt[0].total[0].normalizedValue[0],
                tax: result.getTaskResult.receipts.receipt[0].tax[0].normalizedValue[0]
            };
            callback(err, response);
        });
    }
    async _startTask(callback) {
        try {
            var urlOptions = Object.keys(this.urlParams).map((key) => `${key}=${this.urlParams[key]}`).join('&');
            const axiosInstance = this._createAxiosInstance('POST', '/processReceipt?' + urlOptions, this.imageData);
            const resp = await axiosInstance();
            const task = this._parseXmlResponse(resp.data, callback);
            callback(null, task);
        } catch (err) {
            callback(err);
        }
    }

    _getTaskStatus(taskId, callback) {
        if (taskId.indexOf('00000000') > -1) {
            // A null Guid passed here usually means a logical error in the calling code
            callback(new Error('Null id passed'), null)
            return
        }
        const waitTimeout = 2000;
        const waitFunction = async () => {
            try {
                const axiosInstance = this._createAxiosInstance('GET', '/getTaskStatus?taskId=' + taskId);
                const resp = await axiosInstance();
                const taskData = this._parseXmlResponse(resp.data, callback);
                if (this._isTaskActive(taskData)) {
                    setTimeout(waitFunction, waitTimeout);
                    //return this._delay(waitFunction, waitTimeout);
                } else {
                    callback(null, taskData);
                }
            } catch (err) {
                callback(err);
            }
        };
        setTimeout(waitFunction, waitTimeout)
    }

    _isTaskActive(taskData) {
        return taskData.status === 'Queued' || taskData.status === 'InProgress'
    }
    async _getTaskResult(resultUrl, callback) {
        try {
            const parsedUrl = url.parse(resultUrl);
            const response = await axios.get(parsedUrl.href);
            xml2js.parseString(response.data, (err, result) => {
                if (err) {
                    callback(err);
                }
                callback(null, result);
            });
        } catch (e) {
            callback(e);
        }
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
            // proxy: {
            //     hostname: 'localhost',
            //     port: 9999
            // }
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
    _delay(v, t) {
        return new Promise(function (resolve) {
            setTimeout(resolve.bind(null, v), t);
        });
    }
}

exports.create = function (authLogin, authPassword, imageData, urlParams) {
    return new OCR(authLogin, authPassword, imageData, urlParams);
}
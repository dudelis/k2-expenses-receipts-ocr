// const axios = require('axios');
const async = require('async');
const axios = require('axios');
const xml2js = require('xml2js');
const url = require("url");
const parseString = require('xml2js').parseString;


class OCR {
    constructor(authLogin, authPassword, imageData, urlParams){
        this.authLogin = authLogin;
        this.authPassword = authPassword;
        this.serverUrl = "http://cloud.ocrsdk.com";
        this.urlParams = urlParams;
        this.imageData = imageData;
    }

    processReceipt(callbackmain){
        async.auto({
            startTask: callback => {
                console.log('Task Started');
                this._startTask(callback);
            },
            getTaskStatus: ['startTask', (result, callback) =>{
                console.log('get task result:');
                console.log(result);
                callback('');
            }]
        }, callbackmain);
    }
    async _startTask(callback) {
        var urlOptions = Object.keys(this.urlParams).map((key)=> `${key}=${this.urlParams[key]}`).join('&');
        const axiosInstance = this._createAxiosInstance('POST', '/processReceipt?' + urlOptions, this.imageData);
        axiosInstance().then(resp => {
            const task = this._parseXmlResponse(resp.data, callback);
            callback(null, task);
        }).catch(err => {
            callback(err)
        });
    }

    _getTaskStatus(){

    }

    _getResponse(){

    }

    _createAxiosInstance(method, urlPath, imageData){
        
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

        if (imageData){
            axiosInstance.defaults.data = imageData;
        }
        return axiosInstance;
    }
    _parseXmlResponse(data, taskDataCallback) {
        var response = null;
        var parser = new xml2js.Parser({
          explicitCharKey : false,
          trim : true,
          explicitRoot : true,
          mergeAttrs : true
        });
        parser.parseString(data, function(err, objResult) {
          if (err) {
             taskDataCallback(err, null)
            return
          }
          response = objResult
        });
        if (response == null) {
          return
        }
        if (response.response == null || response.response.task == null
            || response.response.task[0] == null) {
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


exports.create = function(authLogin, authPassword, imageData, urlParams){
    return new OCR(authLogin, authPassword, imageData, urlParams);
}
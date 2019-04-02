const request = require('request');
const url = require('url');
const xml2js = require('xml2js');
const async = require('async');

class SDK {

  constructor(authHeader, urlParams) {
    this.authHeader = authHeader;
    this.serverUrl = "http://cloud.ocrsdk.com";
    this.urlParams = urlParams;
  }

  processReceipt(imageBody, callback) {
    async.auto({
      sendRequest: done => {
        if (!imageBody) {
          userCallback(new Error("File cannot be empty"), null)
          return
        }       
        var urlOptions = Object.keys(this.urlParams).map((key)=> `${key}=${this.urlParams[key]}`).join('&')
        var req = _createTaskRequest('POST', this.authHeader, this.serverUrl, `/processReceipt?` + urlOptions, callback)
        req.body = imageBody
        req.end()
      },
      waitForResponse: [ 'sendRequest', (task, done) => {
        // Wait for however long it says it should be, then continue.
        // Abbyy recommends waiting at least 2 seconds.
        waitForCompletion(task.id[0], done)
      }],
      downloadResults: [ 'waitForResponse', (task, done) => {
        downloadResult(task.resultUrl[0], done)
      }]
    }, callback)
  }
}

function _createTaskRequest(method, authHeader, serverUrl, urlPath, taskDataCallback) {
  var requestOptions = url.parse(serverUrl + urlPath);
  requestOptions.auth = authHeader;
  requestOptions.method = method;
  requestOptions.headers = {
    'User-Agent' : "node.js client library"
  }
  var req = request(requestOptions,  (err, res, body) => {getServerResponse(res, taskDataCallback)})
  req.on('error', function(e) {
    taskDataCallback(e, null)
  })
  return req;
}

function parseXmlResponse(data, taskDataCallback) {
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
  taskDataCallback(null, task)
}
function getServerResponse(res, taskDataCallback) {
  res.setEncoding('utf8')
  res.on('data', (data) => {parseXmlResponse(data, taskDataCallback)});
}


const getTaskStatus = function(taskId, callback) {
  var req = this._createTaskRequest('GET', '/getTaskStatus?taskId=' + taskId,
      callback)
  req.end()
}
const isTaskActive = function(taskData) {
  return taskData.status === 'Queued' || taskData.status === 'InProgress'
}
const waitForCompletion = function(taskId, callback) {
  // Call getTaskStatus every several seconds until task is completed
  // Note: it's recommended that your application waits
  // at least 2 seconds before making the first getTaskStatus request
  // and also between such requests for the same task.
  // Making requests more often will not improve your application performance.
  // Note: if your application queues several files and waits for them
  // it's recommended that you use listFinishedTasks instead (which is described
  // at http://ocrsdk.com/documentation/apireference/listFinishedTasks/).
  if (taskId.indexOf('00000000') > -1) {
    // A null Guid passed here usually means a logical error in the calling code
    userCallback(new Error('Null id passed'), null)
    return
  }
  var recognizer = this
  var waitTimeout = 5000
  function waitFunction() {
    getTaskStatus(taskId,
      function(error, taskData) {
        if (error) {
          userCallback(error, null)
          return
        }
        console.log("Task status is " + taskData.status)
        if (isTaskActive(taskData)) {
          setTimeout(waitFunction, waitTimeout)
        } else {
          userCallback(null, taskData)
        }
      })
  }
  setTimeout(waitFunction, waitTimeout)
}
const downloadResult = function(resultUrl, callback) {
  var parsed = url.parse(resultUrl)
  request(parsed, (err, res, body) => {
    if (err) {
      return callback(err)
    }
    xml2js.parseString((err, result) => {
      callback(null, body)
    })
  })
  req.end()
}


exports.create = function(authHeader, urlParams) {
  return new SDK(authHeader, urlParams)
}
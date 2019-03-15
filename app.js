var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const multer = require('multer');
const upload = multer();

var ocrRouter = require('./routes/ocr');

var app = express();
app.use(upload.any());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//Implementing Basic auth check - for K2 REST ServiceBroker
app.use((req, res, next) => {
  const authType = (req.headers.authorization || '').split(' ')[0];
  //Verify auth is Basic
  if (authType != 'Basic') {
    res.set('WWW-Authenticate', 'Basic realm="401"') // change this
    res.status(401).send('Authentication required.') // custom message
    return
  }
  //Getting credentials and use them for MongoDB authentication.
  const base64Credentials =  req.headers.authorization.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  req.username = credentials.split(':')[0];
  req.password = credentials.split(':')[1];
  next();
});

app.use('/ocr', ocrRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

"use strict";
const express = require('express');
const router = express.Router();
const axios = require('axios');
const parseString = require('xml2js').parseString;

const ocr = require('../ocr/ocr');

const abbyyocr = require('../api/abbyyocr');
router.get('/getApplicationInfo', async function (req, res) {
    const authHeader = req.headers.authorization;
    const response = await abbyyocr.get('/getApplicationInfo', {
        headers: {
            'Authorization': authHeader
        }
    });
    res.send(response.data);

});
router.get('/getTaskStatus', async function (req, res) {
    let axiosOptions = {
        headers: {
            'Authorization': req.headers.authorization,
            'User-Agent': "node.js client library",
        },
        proxy: {
            hostname: 'localhost',
            port: 9999
        }
    };
    if (req.query.taskId) {
        axiosOptions.params = {
            taskId: req.query.taskId
        };
    }
    abbyyocr.get('/getTaskStatus', axiosOptions)
        .then(resp => {
            parseString(resp.data, (err, result) => {
                if (!err) {




                    return res.send(result);
                } else {
                    res.status(500).send(err);
                }
            });
        })
        .catch(e => {
            return res.send({
                stack: e.stack,
                message: e.message
            });
        });

});

router.post('/processReceipt', async function (req, res) {
    console.log(req.headers.authorization);
    let data;
    let pCountry = 'usa';
    if (req.files) {
        data = req.files[0].buffer;
    }
    if (req.query.country) {
        pCountry = req.query.country;
    }
    axios.post('http://cloud.ocrsdk.com/processReceipt', data, {
        auth: {
            username: req.username,
            password: req.password
        },
        headers: {
            'User-Agent': "node.js client library",
            'Content-Type': 'text/plain'
        },
        params: {
            country: pCountry
        },
        proxy: {
            hostname: 'localhost',
            port: 9999
        }
    }).then(resp => {
        parseString(resp.data, (err, result) => {
            if (!err) {
                return res.send(result);
            } else {
                res.status(500).send(err);
            }
        });
    }).catch(e => {
        return res.send({
            stack: e.stack,
            message: e.message
        });
    });
});
router.post('/processImage', async function (req, res) {
    console.log(req.headers.authorization);
    let data;
    if (req.files) {
        data = req.files[0].buffer;
    }
    axios.post('http://cloud.ocrsdk.com/processImage', data, {
        auth: {
            username: req.username,
            password: req.password
        },
        headers: {
            'User-Agent': "node.js client library",
            'Content-Type': 'text/plain'
        },
        proxy: {
            hostname: 'localhost',
            port: 9999
        }
    }).then(resp => {
        parseString(resp.data, (err, result) => {
            if (!err) {
                return res.send(result);
            } else {
                res.status(500).send(err);
            }
        });
    }).catch(e => {
        return res.send({
            stack: e.stack,
            message: e.message
        });
    });
});

router.post('/processReceipt1', async function (req, res, next) {
    let data;
    if (req.files) {
        data = req.files[0].buffer;
    }
    const ocrInstance = ocr.create(req.username, req.password, data, req.query);
    ocrInstance.processReceipt((err, result) => {
        if(err){
            next(err);
        }
        return res.status(200).send(result);
    });
});

module.exports = router;
"use strict";
const express = require('express');
const router = express.Router();
const parseString = require('xml2js').parseString;
const axios = require('axios');

const ocr = require('../ocr/ocr');

router.get('/getApplicationInfo', async function (req, res) {
    const authHeader = req.headers.authorization;
    const response = await axios.get('http://cloud.ocrsdk.com/getApplicationInfo', {
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
    axios.get('http://cloud.ocrsdk.com/getTaskStatus', axiosOptions)
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
router.post('/processReceipt', async function (req, res, next) {
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
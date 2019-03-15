const express = require('express');
const router = express.Router();
const axios = require('axios');
const parseString = require('xml2js').parseString;

const abbyyocr = require('../api/abbyyocr');
//var abbyyocr = require('../ocr/abbyyocr');
router.get('/getApplicationInfo', async function (req, res) {
    const authHeader = req.headers.authorization;
    const response = await abbyyocr.get('/getApplicationInfo', {
        headers: {
            'Authorization': authHeader
        }
    });
    res.send(response.data);

});

router.post('/processReceipt', async function (req, res, next) {
    console.log(req.headers.authorization);
    let data;
    if (req.files) {
        data = req.files[0].buffer;
    }
    axios.post('http://cloud.ocrsdk.com/processReceipt', data, {
        auth: {
            username: req.username,
            password: req.password
        },
        headers: {
            'User-Agent': "node.js client library"
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
router.post('/processImage', async function (req, res, next) {
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
            'User-Agent': "node.js client library"
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

module.exports = router;
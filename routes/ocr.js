var express = require('express');
var router = express.Router();

var abbyyocr = require('../ocr/abbyyocr');

/* GET users listing. */
router.get('/', function(req, res, next) {
    if (!req.headers.authorization){
        return res.status(401).send({ error: 'No credentials sent!' });
    }
    console.log(req.headers.authorization);
});

router.post('/processReceipt', function(req, res, next) {
    console.log(req.headers.authorization);
    if (!req.headers.authorization){
        return res.status(401).send({ error: 'No credentials sent!' });
    }
    var auth = req.headers.authorization;
    
    var sdk = new abbyyocr.create(auth, req.query);
    sdk.processReceipt(req.body, console.log('callback'));
    

    
    res.send({'auth': auth, 'type': req.query.type});
});

module.exports = router;

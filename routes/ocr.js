var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    if (!req.headers.authorization){
        return res.status(401).send({ error: 'No credentials sent!' });
    }
    console.log(req.headers.authorization);
    
});

module.exports = router;

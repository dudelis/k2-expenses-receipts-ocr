const ocr = require('../ocr/ocr');


const ocrCreator = ocr.create('k2-expenses-ocr', 'ZYX8phzEkWp8Bsy8YnADa+dI', 'image-data', 'urlparams');

const axios = ocrCreator._startTask();

console.log(axios);
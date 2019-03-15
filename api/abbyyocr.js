const axios = require('axios');

module.exports = axios.create({
    baseURL: 'http://cloud.ocrsdk.com',
    // proxy: {
    //     hostname: '127.0.0.1',
    //     port: 9999,
    //     auth:{
    //         username: 'k2-expenses-ocr',
    //         password: 'ZYX8phzEkWp8Bsy8YnADa+dI'
    //     }
    // }    
})
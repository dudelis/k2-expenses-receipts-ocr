import axios from 'axios';

export default axios.create({
    baseURL: 'http://cloud.ocrsdk.com'
})
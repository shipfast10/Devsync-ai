import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // backend URL
  withCredentials: true, // allow cookies/session
});

export default api;

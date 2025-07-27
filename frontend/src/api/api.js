import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({ //commas?
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    });

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) { // ? is used to access nested properties
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    });

export default api;
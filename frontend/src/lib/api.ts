// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // Enables sending cookies with requests (auth, sessions, etc.)
});

export default api;

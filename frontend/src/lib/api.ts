// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:47005',
    withCredentials: true, // Enables sending cookies with requests (auth, sessions, etc.)
});

export default api;

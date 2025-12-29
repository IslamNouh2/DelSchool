// src/lib/api.ts
import axios from "axios";

const api = axios.create({
    baseURL: 'https://delschool-1.onrender.com',
    withCredentials: true,
});

export default api;

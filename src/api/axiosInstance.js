// src/api/axiosInstance.js

import axios from 'axios';

// Ingat! penggunaan host ini hanya untuk run di LAN / Network lokal
const host = window.location.hostname;
const API_BASE_URL = `http://${host}:5000/api`;

const axiosInstance = axios.create({
    baseURL: API_BASE_URL, // Base URL untuk semua API
});
// -------------------------------------------------------------------

// Interceptor untuk setiap PERMINTAAN (REQUEST)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk setiap RESPONS (RESPONSE)
axiosInstance.interceptors.response.use(
    (response) => {
        // Jika respons sukses (status 2xx), langsung kembalikan
        return response;
    },
    (error) => {
        // Cek jika error adalah karena token tidak valid (401)
        if (error.response?.status === 401 && originalRequest.url !== '/api/auth/login') {
            // Hapus data yang tidak valid
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Arahkan ke halaman login
            // Beri pesan (opsional)
            alert('Sesi Anda telah berakhir. Silakan login kembali.');
            // Gunakan window.location agar halaman refresh total dan state kembali bersih
            window.location.href = '/login';
        }

        // Kembalikan error agar bisa ditangani oleh .catch() jika perlu
        return Promise.reject(error);
    }
);

export default axiosInstance;
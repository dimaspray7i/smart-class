import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rpl_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global errors
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rpl_token');
      localStorage.removeItem('rpl_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = err.response?.data?.message || err.message || 'Terjadi kesalahan koneksi';
    return Promise.reject({ status: err.response?.status, message, errors: err.response?.data?.errors });
  }
);

export default api;
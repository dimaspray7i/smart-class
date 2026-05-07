import axios from 'axios';

// ═══════════════════════════════════════════════════════════
// AXIOS INSTANCE
// ═══════════════════════════════════════════════════════════
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json' 
  },
  withCredentials: false, // Token-based auth, tidak perlu credentials
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
    return Promise.reject({ 
      status: err.response?.status, 
      message, 
      errors: err.response?.data?.errors 
    });
  }
);

// ═══════════════════════════════════════════════════════════
// AUTH API SERVICE - Named export: authAPI
// ═══════════════════════════════════════════════════════════
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ═══════════════════════════════════════════════════════════
// AUTH HELPERS - Safe localStorage handling
// ═══════════════════════════════════════════════════════════
export const saveAuth = (token, user) => {
  if (token) localStorage.setItem('rpl_token', token);
  if (user) localStorage.setItem('rpl_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('rpl_token');
  localStorage.removeItem('rpl_user');
};

export const getAuth = () => {
  try {
    const userStr = localStorage.getItem('rpl_user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (e) {
    console.warn('Failed to parse auth data from localStorage:', e);
    clearAuth();
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('rpl_token');
};

// ═══════════════════════════════════════════════════════════
// DEFAULT EXPORT (optional, for convenience)
// ═══════════════════════════════════════════════════════════
export default api;
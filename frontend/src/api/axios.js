import axios from 'axios';

// ═══════════════════════════════════════════════════════════
// CREATE AXIOS INSTANCE WITH BASE CONFIG
// ═══════════════════════════════════════════════════════════
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json',
  },
  withCredentials: false, // Token-based auth (Bearer), bukan session/cookie SPA
  timeout: 15000, 
});

// ═══════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR - Attach Bearer Token
// ═══════════════════════════════════════════════════════════
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('rpl_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
      console.log('[Axios] Token attached to request:', config.url); // Debug
    } else {
      console.warn('[Axios] No token found for request:', config.url); // Debug
    }
    
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR - Handle Errors Globally
// ═══════════════════════════════════════════════════════════
api.interceptors.response.use(
  (response) => {
    return response; // Kembalikan full response, jangan hanya response.data
  },
  
  // Error: Handle common error cases
  (error) => {
    // ═══════════════════════════════════════════════════════
    // 401 Unauthorized: Token expired or invalid
    // ═══════════════════════════════════════════════════════
    if (error.response?.status === 401) {
      console.error('[Axios 401] Unauthorized - Token invalid/expired');
      
      // Clear auth data
      localStorage.removeItem('rpl_token');
      localStorage.removeItem('rpl_user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    
    // ═══════════════════════════════════════════════════════
    // 403 Forbidden: User doesn't have permission
    // ═══════════════════════════════════════════════════════
    if (error.response?.status === 403) {
      console.warn('[Axios 403] Access denied - insufficient permissions');
    }
    
    // ═══════════════════════════════════════════════════════
    // 500 Internal Server Error
    // ═══════════════════════════════════════════════════════
    if (error.response?.status === 500) {
      console.error('[Axios 500] Server error:', error.response?.data);
    }
    
    // ═══════════════════════════════════════════════════════
    // Format error for consistent handling
    // ═══════════════════════════════════════════════════════
    const errorMessage = 
      error.response?.data?.message || 
      (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null) ||
      error.message || 
      'Terjadi kesalahan koneksi ke server';
    
    // Reject dengan structured error
    return Promise.reject({
      status: error.response?.status || 0,
      message: errorMessage,
      data: error.response?.data,
      errors: error.response?.data?.errors || null,
      code: error.response?.data?.code || null,
    });
  }
);

export default api;
import axios from 'axios'

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO CONFIG
// ═══════════════════════════════════════════════════════════
const RETRO_CONFIG = {
  // API Base URL with fallback
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  
  // Request timeout (15 seconds)
  timeout: 15000,
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Retro-Client': 'rpl-smart-v2', // Custom header for tracking
  },
  
  // Auth storage keys (must match AuthContext.jsx)
  storage: {
    token: '🔐_rpl_token',
    user: '🔐_rpl_user',
  },
  
  // Console logging (dev only)
  logging: {
    enabled: import.meta.env.DEV,
    prefix: '🚀 [RPL-API]',
    colors: {
      request: '#FF5C00',    // Orange
      response: '#10b981',   // Green
      error: '#f43f5e',      // Red
      warning: '#f59e0b',    // Yellow
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 🔧 CREATE AXIOS INSTANCE
// ═══════════════════════════════════════════════════════════
const api = axios.create({
  baseURL: RETRO_CONFIG.baseURL,
  headers: RETRO_CONFIG.headers,
  withCredentials: false, // Token-based auth (Bearer), not session cookies
  timeout: RETRO_CONFIG.timeout,
})

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO CONSOLE LOGGER (Dev Only)
// ═══════════════════════════════════════════════════════════
const retroLog = {
  request: (config) => {
    if (!RETRO_CONFIG.logging.enabled) return
    
    console.groupCollapsed(
      `%c${RETRO_CONFIG.logging.prefix} REQUEST`,
      `color: ${RETRO_CONFIG.logging.colors.request}; font-weight: bold;`
    )
    console.log('📡 Method:', config.method?.toUpperCase())
    console.log('🔗 URL:', config.url)
    console.log('📦 Params:', config.params)
    console.log('🔐 Auth:', config.headers.Authorization ? '✅ Token attached' : '❌ No token')
    console.groupEnd()
  },
  
  response: (response) => {
    if (!RETRO_CONFIG.logging.enabled) return
    
    console.groupCollapsed(
      `%c${RETRO_CONFIG.logging.prefix} RESPONSE`,
      `color: ${RETRO_CONFIG.logging.colors.response}; font-weight: bold;`
    )
    console.log('✅ Status:', response.status, response.statusText)
    console.log('🔗 URL:', response.config.url)
    console.log('⏱️ Time:', response.headers['x-request-time'] || 'N/A')
    console.groupEnd()
  },
  
  error: (error) => {
    if (!RETRO_CONFIG.logging.enabled) return
    
    const status = error.response?.status
    const color = status === 401 ? RETRO_CONFIG.logging.colors.error :
                  status === 403 ? RETRO_CONFIG.logging.colors.warning :
                  RETRO_CONFIG.logging.colors.error
    
    console.groupCollapsed(
      `%c${RETRO_CONFIG.logging.prefix} ERROR ${status || 'NETWORK'}`,
      `color: ${color}; font-weight: bold;`
    )
    console.log('❌ Message:', error.message)
    console.log('🔗 URL:', error.config?.url)
    console.log('📦 Response:', error.response?.data)
    console.groupEnd()
  }
}

// ═══════════════════════════════════════════════════════════
// 🔐 SIMPLE STORAGE ENCRYPTION (XOR-based, for obfuscation)
// ═══════════════════════════════════════════════════════════
const simpleDecrypt = (encrypted, key = 'rpl-retro-key-2024') => {
  if (!encrypted) return encrypted;
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════════════════
// 🔐 REQUEST INTERCEPTOR - Attach Bearer Token
// ═══════════════════════════════════════════════════════════
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const encryptedToken = localStorage.getItem(RETRO_CONFIG.storage.token)
    
    if (encryptedToken) {
      const token = simpleDecrypt(encryptedToken);
      if (token) {
        config.headers.Authorization = `Bearer ${token.trim()}`
      }
    }
    
    // Add timestamp header for caching/debugging
    config.headers['X-Request-Timestamp'] = Date.now().toString()
    
    // Log request (dev only)
    retroLog.request(config)
    
    return config
  },
  (error) => {
    retroLog.error(error)
    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════════════════════
// 📡 RESPONSE INTERCEPTOR - Handle Errors Globally
// ═══════════════════════════════════════════════════════════
api.interceptors.response.use(
  (response) => {
    // Log successful response (dev only)
    retroLog.response(response)
    
    // Return the data directly for cleaner usage
    return response.data
  },
  
  // Handle errors
  async (error) => {
    retroLog.error(error)
    
    const status = error.response?.status
    const data = error.response?.data
    
    // ═══════════════════════════════════════════════════════
    // 🔐 401 Unauthorized: Token expired or invalid
    // ═══════════════════════════════════════════════════════
    if (status === 401) {
      console.warn('🔐 Session expired or unauthorized')
      
      // Clear auth storage but DO NOT force redirect here
      // The AuthContext and ProtectedRoute will handle redirects
      // This prevents public pages from breaking
      localStorage.removeItem(RETRO_CONFIG.storage.token)
      localStorage.removeItem(RETRO_CONFIG.storage.user)
    }
    
    // ═══════════════════════════════════════════════════════
    // 🚫 403 Forbidden: Insufficient permissions
    // ═══════════════════════════════════════════════════════
    if (status === 403) {
      console.warn('🚫 Access denied - insufficient permissions')
    }
    
    // ═══════════════════════════════════════════════════════
    // 🔍 404 Not Found: Resource doesn't exist
    // ═══════════════════════════════════════════════════════
    if (status === 404) {
      console.warn('🔍 Resource not found:', error.config?.url)
    }
    
    // ═══════════════════════════════════════════════════════
    // 💥 500 Internal Server Error
    // ═══════════════════════════════════════════════════════
    if (status === 500) {
      console.error('💥 Server error:', data)
    }
    
    // ═══════════════════════════════════════════════════════
    // 🌐 Network Error (no response)
    // ═══════════════════════════════════════════════════════
    if (!error.response) {
      console.error('🌐 Network error - check your connection')
    }
    
    // ═══════════════════════════════════════════════════════
    // 📦 Format error for consistent handling in components
    // ═══════════════════════════════════════════════════════
    const formattedError = {
      status: status || 0,
      message: data?.message || error.message || 'Terjadi kesalahan koneksi ke server',
      code: data?.code || null,
      errors: data?.errors || null,
      data: data || null,
      // Preserve original for advanced debugging
      original: error,
    }
    
    return Promise.reject(formattedError)
  }
)

export default api
import api from './axios'

// ═══════════════════════════════════════════════════════════
// 🔐 AUTH API SERVICE
// All authentication-related API calls
// ═══════════════════════════════════════════════════════════

export const authAPI = {
  /**
   * 🔑 Login user with credentials
   * @param {Object} data - { email: string, password: string }
   * @returns {Promise} Promise with auth response (token, user, etc.)
   */
  login: (data) => api.post('/auth/login', data),
  
  /**
   * 🚪 Logout current user
   * @returns {Promise} Promise with logout response
   */
  logout: () => api.post('/auth/logout'),
  
  /**
   * 👤 Get current authenticated user profile
   * @returns {Promise} Promise with user data
   */
  me: () => api.get('/auth/me'),
  
  /**
   * ✏️ Update user profile
   * @param {Object} data - Profile fields to update
   * @returns {Promise} Promise with updated user data
   */
  updateProfile: (data) => api.put('/auth/profile', data),
  
  /**
   * 🔐 Request password reset link
   * @param {string} email - User email
   * @returns {Promise} Promise with reset status
   */
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  /**
   * 🔑 Reset password with token
   * @param {Object} data - { token, email, password, password_confirmation }
   * @returns {Promise} Promise with reset status
   */
  resetPassword: (data) => api.post('/auth/reset-password', data),
  
  /**
   * 🔄 Refresh authentication token
   * @returns {Promise} Promise with new token data
   */
  refreshToken: () => api.post('/auth/refresh-token'),
  
  /**
   * 📱 Enable two-factor authentication
   * @param {'email'|'whatsapp'|'authenticator'} method - 2FA method
   * @returns {Promise} Promise with 2FA setup data
   */
  enable2FA: (method) => api.post('/auth/2fa/enable', { method }),
  
  /**
   * 📱 Disable two-factor authentication
   * @param {string} password - Current password for verification
   * @returns {Promise} Promise with disable status
   */
  disable2FA: (password) => api.post('/auth/2fa/disable', { password }),
  
  /**
   * 🔢 Verify two-factor authentication code
   * @param {string} code - 6-digit verification code
   * @returns {Promise} Promise with verification status
   */
  verify2FA: (code) => api.post('/auth/2fa/verify', { code }),
  
  /**
   * 📱 Get list of authenticated devices
   * @returns {Promise} Promise with device list
   */
  getDevices: () => api.get('/auth/devices'),
  
  /**
   * 🗑️ Revoke a specific device session
   * @param {number} deviceId - Device ID to revoke
   * @returns {Promise} Promise with revoke status
   */
  revokeDevice: (deviceId) => api.delete(`/auth/devices/${deviceId}`),
}

// ═══════════════════════════════════════════════════════════
// 💾 AUTH STORAGE HELPERS
// Safe localStorage handling with obfuscation
// ═══════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  token: 'rpl_token',
  user: 'rpl_user',
  lastLogin: 'rpl_last_login',
}

/**
 * 🔐 Simple obfuscation for localStorage (not cryptographic, just for fun)
 * @private
 */
const obfuscate = (text, key = 'rpl-retro-2024') => {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result)
}

const deobfuscate = (obfuscated, key = 'rpl-retro-2024') => {
  try {
    const decoded = atob(obfuscated)
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
  } catch {
    return null
  }
}

/**
 * 💾 Save auth data to localStorage with obfuscation
 * @param {string} token - Auth token
 * @param {Object} user - User data object
 */
export const saveAuth = (token, user) => {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.token, obfuscate(token))
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.user, obfuscate(JSON.stringify(user)))
    }
    localStorage.setItem(STORAGE_KEYS.lastLogin, new Date().toISOString())
  } catch (error) {
    console.warn('💾 Failed to save auth data:', error)
  }
}

/**
 * 🗑️ Clear all auth data from localStorage
 */
export const clearAuth = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.warn('🗑️ Failed to clear auth data:', error)
  }
}

/**
 * 👤 Get authenticated user from localStorage
 * @returns {Object|null} User object or null
 */
export const getAuth = () => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.user)
    if (!userStr) return null
    
    const deobfuscated = deobfuscate(userStr)
    if (!deobfuscated) return null
    
    return JSON.parse(deobfuscated)
  } catch (error) {
    console.warn('👤 Failed to parse auth data:', error)
    clearAuth() // Clear corrupted data
    return null
  }
}

/**
 * 🔑 Get auth token from localStorage
 * @returns {string|null} Token string or null
 */
export const getToken = () => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.token)
    if (!token) return null
    return deobfuscate(token)
  } catch {
    return null
  }
}

/**
 * ✅ Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getToken()
}

/**
 * ⏰ Get last login timestamp
 * @returns {Date|null}
 */
export const getLastLogin = () => {
  const lastLogin = localStorage.getItem(STORAGE_KEYS.lastLogin)
  return lastLogin ? new Date(lastLogin) : null
}

/**
 * 🔄 Check if token is about to expire (within 5 minutes)
 * 
 * NOTE: Laravel Sanctum uses opaque tokens (NOT JWTs), so we cannot decode
 * an expiry timestamp from the token string itself. Instead, we use a
 * sliding-session approach based on the last login timestamp stored locally.
 * The Axios 401 interceptor also handles true server-side token expiry.
 *
 * @param {string} [token] - Token string (optional, uses stored token if not provided)
 * @returns {boolean}
 */
export const isTokenExpiring = (token) => {
  const tokenToCheck = token || getToken()
  if (!tokenToCheck) return true

  const lastLogin = getLastLogin()
  if (!lastLogin) return true

  // Sliding session: consider token "expiring" after 115 minutes (of a 2h window)
  // so we can proactively refresh or re-prompt login with 5 min to spare.
  const sessionDurationMs = 2 * 60 * 60 * 1000       // 2 hours in ms
  const fiveMinutesMs     = 5 * 60 * 1000              // 5 minutes buffer
  const expiry = lastLogin.getTime() + sessionDurationMs
  const now    = Date.now()

  return expiry - now < fiveMinutesMs
}
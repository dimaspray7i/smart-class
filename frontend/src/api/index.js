/**
 * 🚀 RPL Smart Ecosystem API Services
 * 
 * Centralized export point for all API services
 * Import from this file for clean, organized imports:
 * 
 * import { api, authAPI, adminAPI } from '@/api'
 */

// ═══════════════════════════════════════════════════════════
// 🔧 CORE
// ═══════════════════════════════════════════════════════════
export { default as api } from './axios'

// ═══════════════════════════════════════════════════════════
// 🔐 AUTH SERVICES
// ═══════════════════════════════════════════════════════════
export { 
  authAPI,
  saveAuth,
  clearAuth,
  getAuth,
  getToken,
  isAuthenticated,
  getLastLogin,
  isTokenExpiring,
} from './auth'

// ═══════════════════════════════════════════════════════════
// 🛡️ ADMIN SERVICES
// ═══════════════════════════════════════════════════════════
export { adminAPI } from './admin'

// ═══════════════════════════════════════════════════════════
// 🎨 UTILITIES
// ═══════════════════════════════════════════════════════════
export { cn } from '@/lib/utils'

// Re-export utility helpers for convenience
export {
  generateRetroId,
  formatRetroNumber,
  getRetroColor,
  debounce,
  formatRetroDate,
} from '@/lib/utils'
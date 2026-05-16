import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 🔮 Retro Utility: Merge Tailwind classes with clsx
 * 
 * Combines conditional classes (clsx) with Tailwind conflict resolution (twMerge)
 * Perfect for dynamic className composition in retro components!
 * 
 * @example
 * cn("retro-card", isActive && "border-retro-orange", className)
 * 
 * @param {...any} inputs - ClassValue inputs (strings, objects, arrays, conditionals)
 * @returns {string} Merged className string with Tailwind conflicts resolved
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO UTILITY HELPERS (Optional Add-ons)
// ═══════════════════════════════════════════════════════════

/**
 * Generate retro-style random ID for stickers/decorations
 * @param {string} [prefix='retro'] - Optional prefix for the ID
 * @returns {string} Retro-styled unique ID
 */
export const generateRetroId = (prefix = 'retro') => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Format number with retro styling (e.g., "450+" → "450✨")
 * @param {number} value - Number to format
 * @param {string} [suffix='✨'] - Optional suffix
 * @returns {string} Formatted string
 */
export const formatRetroNumber = (value, suffix = '✨') => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k${suffix}`
  return `${value}${suffix}`
}

/**
 * Get retro color based on role/type
 * @param {string} type - Role or category type
 * @returns {string} Retro color class name
 */
export const getRetroColor = (type) => {
  const colors = {
    admin: 'text-retro-orange',
    guru: 'text-retro-blue',
    siswa: 'text-retro-purple',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    default: 'text-base-black',
  }
  return colors[type] || colors.default
}

/**
 * Debounce function for search inputs (retro-style delay)
 * @param {Function} func - Function to debounce
 * @param {number} [wait=300] - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Format date with retro styling (Indonesian locale)
 * @param {string|Date} date - Date string or Date object
 * @param {'short'|'long'|'relative'} [format='short'] - Format type
 * @returns {string} Formatted date string
 */
export const formatRetroDate = (date, format = 'short') => {
  const d = new Date(date)
  
  if (format === 'relative') {
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (minutes < 1) return 'Just now ✨'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }
  
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(format === 'long' && { hour: '2-digit', minute: '2-digit' })
  })
}
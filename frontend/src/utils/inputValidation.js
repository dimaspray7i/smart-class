/**
 * Input validation and sanitization utilities
 * Prevents XSS, SQL injection patterns, and invalid data
 */

export const InputValidation = {
  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
   */
  isStrongPassword(password) {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  },

  /**
   * Validate username (alphanumeric + underscore/dash)
   */
  isValidUsername(username) {
    return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
  },

  /**
   * Validate phone number (Indonesian format)
   */
  isValidPhone(phone) {
    return /^(\+62|0)[0-9]{9,12}$/.test(phone.replace(/[\s\-()]/g, ''));
  },

  /**
   * Remove dangerous characters
   */
  sanitizeInput(input, allowedChars = 'alphanumeric') {
    if (typeof input !== 'string') return input;

    const patterns = {
      alphanumeric: /[^a-zA-Z0-9\s]/g,
      email: /[^a-zA-Z0-9@._-]/g,
      phone: /[^\d+\-()]/g,
      text: /[<>\"']/g,
    };

    const pattern = patterns[allowedChars] || patterns.alphanumeric;
    return input.replace(pattern, '');
  },

  /**
   * Validate string length
   */
  isValidLength(value, min = 1, max = 255) {
    if (typeof value !== 'string') return false;
    return value.length >= min && value.length <= max;
  },

  /**
   * Validate URL
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check for SQL injection patterns
   */
  hasSQLInjectionPattern(input) {
    if (typeof input !== 'string') return false;
    const sqlPatterns = [
      /('|"|;|--|\/\*|\*\/|xp_|sp_|union|select|insert|update|delete|drop|create|alter)/gi
    ];
    return sqlPatterns.some(pattern => pattern.test(input));
  },

  /**
   * Check for XSS patterns
   */
  hasXSSPattern(input) {
    if (typeof input !== 'string') return false;
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
    ];
    return xssPatterns.some(pattern => pattern.test(input));
  },

  /**
   * Validate file upload
   */
  isValidFile(file, { maxSize = 5 * 1024 * 1024, allowedTypes = [] }) {
    if (!file) return false;

    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds limit' };
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  },

  /**
   * Trim and normalize input
   */
  normalizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/\s+/g, ' ');
  },
};

export default InputValidation;

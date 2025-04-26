/**
 * Validation utilities for the LearnLink API
 */

/**
 * Validates an email address using RFC 5322 standard
 * @param {string} email - The email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export const isEmailValid = (email) => {
  if (!email) return false;
  
  // Simple check for basic format
  if (!email.includes('@') || !email.includes('.')) return false;
  
  // RFC 5322 compliant regex
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

/**
 * Validates a password against minimum requirements
 * @param {string} password - The password to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length (default: 8)
 * @param {boolean} options.requireUppercase - Require uppercase letters (default: true)
 * @param {boolean} options.requireLowercase - Require lowercase letters (default: true)
 * @param {boolean} options.requireNumbers - Require numbers (default: true)
 * @param {boolean} options.requireSpecial - Require special characters (default: false)
 * @returns {Object} Contains validation result and any error messages
 */
export const isPasswordValid = (password, options = {}) => {
  const defaultOptions = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: false
  };
  
  const opts = { ...defaultOptions, ...options };
  const errors = [];
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < opts.minLength) {
    errors.push(`Password must be at least ${opts.minLength} characters long`);
  }
  
  if (opts.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (opts.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (opts.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (opts.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates a username
 * @param {string} username - The username to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length (default: 3)
 * @param {number} options.maxLength - Maximum length (default: 30)
 * @param {boolean} options.allowSpaces - Allow spaces (default: false)
 * @returns {Object} Contains validation result and any error messages
 */
export const isUsernameValid = (username, options = {}) => {
  const defaultOptions = {
    minLength: 3,
    maxLength: 30,
    allowSpaces: false
  };
  
  const opts = { ...defaultOptions, ...options };
  const errors = [];
  
  if (!username) {
    return { isValid: false, errors: ['Username is required'] };
  }
  
  if (username.length < opts.minLength) {
    errors.push(`Username must be at least ${opts.minLength} characters long`);
  }
  
  if (username.length > opts.maxLength) {
    errors.push(`Username must not exceed ${opts.maxLength} characters`);
  }
  
  if (!opts.allowSpaces && /\s/.test(username)) {
    errors.push('Username cannot contain spaces');
  }
  
  // Only allow alphanumeric characters, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(username.replace(/\s/g, ''))) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes a string to prevent basic XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (str) => {
  if (!str) return '';
  
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates that a string is not empty or just whitespace
 * @param {string} str - String to validate
 * @returns {boolean} True if string is not empty or just whitespace
 */
export const isNonEmptyString = (str) => {
  return !!str && str.trim().length > 0;
};

/**
 * URL validator
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
export const isURLValid = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates a date string
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if date is valid
 */
export const isDateValid = (dateStr) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Formats validation errors into a standard object
 * @param {Array} errors - Array of error messages 
 * @returns {Object} Formatted error object
 */
export const formatValidationErrors = (errors) => {
  return {
    isValid: errors.length === 0,
    errors,
    message: errors.join('. ')
  };
};

export default {
  isEmailValid,
  isPasswordValid,
  isUsernameValid,
  sanitizeString,
  isNonEmptyString,
  isURLValid,
  isDateValid,
  formatValidationErrors
}; 
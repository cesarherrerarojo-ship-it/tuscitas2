/**
 * Utility Functions for TuCitaSegura
 */

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 */
export function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToast = document.getElementById('toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.className = 'fixed top-24 right-4 z-[60] animate-slide-in';

  // Set colors based on type
  let bgColor, icon;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-500';
      icon = 'fa-check-circle';
      break;
    case 'error':
      bgColor = 'bg-red-500';
      icon = 'fa-exclamation-circle';
      break;
    case 'warning':
      bgColor = 'bg-yellow-500';
      icon = 'fa-exclamation-triangle';
      break;
    default:
      bgColor = 'bg-blue-500';
      icon = 'fa-info-circle';
  }

  toast.innerHTML = `
    <div class="${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]">
      <i class="fas ${icon} text-xl"></i>
      <span class="font-semibold">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:opacity-75 transition">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slide-in {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `;
  if (!document.getElementById('toast-styles')) {
    style.id = 'toast-styles';
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast && toast.parentElement) {
      toast.style.animation = 'slide-in 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

/**
 * Calculate age from birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export function calculateAge(birthDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get reputation badge information
 * @param {string} reputation - Reputation level: 'BRONCE', 'PLATA', 'ORO', 'PLATINO'
 * @returns {object} Badge information with color, icon, and label
 */
export function getReputationBadge(reputation) {
  const badges = {
    'BRONCE': {
      color: 'text-amber-700 bg-amber-900/30 border border-amber-700/50',
      icon: '🥉',
      label: 'Bronce'
    },
    'PLATA': {
      color: 'text-slate-300 bg-slate-700/30 border border-slate-500/50',
      icon: '🥈',
      label: 'Plata'
    },
    'ORO': {
      color: 'text-yellow-400 bg-yellow-900/30 border border-yellow-600/50',
      icon: '🥇',
      label: 'Oro'
    },
    'PLATINO': {
      color: 'text-cyan-300 bg-cyan-900/30 border border-cyan-500/50',
      icon: '💎',
      label: 'Platino'
    }
  };

  return badges[reputation] || badges['BRONCE'];
}

/**
 * Format date to relative time (e.g., "hace 2 horas")
 * @param {Date|Timestamp} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return 'Desconocido';

  const timestamp = date.toMillis ? date.toMillis() : date.getTime();
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  if (days < 7) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  if (weeks < 4) return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
  if (months < 12) return `Hace ${months} mes${months !== 1 ? 'es' : ''}`;
  return `Hace ${years} año${years !== 1 ? 's' : ''}`;
}

/**
 * Format date to readable string
 * @param {Date|Timestamp} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return 'Fecha desconocida';

  const d = date.toDate ? date.toDate() : new Date(date);

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return d.toLocaleDateString('es-ES', options);
}

/**
 * Format date to short string
 * @param {Date|Timestamp} date - Date to format
 * @returns {string} Short formatted date string
 */
export function formatDateShort(date) {
  if (!date) return 'N/A';

  const d = date.toDate ? date.toDate() : new Date(date);

  const options = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return d.toLocaleDateString('es-ES', options);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export function validatePassword(password) {
  if (!password) {
    return { isValid: false, message: 'La contraseña es requerida' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos una mayúscula' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos una minúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un número' };
  }

  return { isValid: true, message: 'Contraseña válida' };
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get status badge color
 * @param {string} status - Status value
 * @returns {string} Tailwind CSS classes for badge
 */
export function getStatusBadge(status) {
  const badges = {
    'pending': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
    'accepted': 'bg-green-500/20 text-green-400 border border-green-500/50',
    'rejected': 'bg-red-500/20 text-red-400 border border-red-500/50',
    'completed': 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
    'cancelled': 'bg-gray-500/20 text-gray-400 border border-gray-500/50',
    'active': 'bg-green-500/20 text-green-400 border border-green-500/50',
    'inactive': 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
  };

  return badges[status] || badges['pending'];
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Generate random ID
 * @returns {string} Random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Check if user is online (based on last activity)
 * @param {Date|Timestamp} lastActivity - Last activity timestamp
 * @param {number} threshold - Threshold in minutes (default: 5)
 * @returns {boolean} True if user is considered online
 */
export function isUserOnline(lastActivity, threshold = 5) {
  if (!lastActivity) return false;

  const timestamp = lastActivity.toMillis ? lastActivity.toMillis() : lastActivity.getTime();
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);

  return minutes <= threshold;
}

/**
 * Get gender icon
 * @param {string} gender - Gender value
 * @returns {string} Font Awesome icon class
 */
export function getGenderIcon(gender) {
  const icons = {
    'masculino': 'fa-mars text-blue-400',
    'femenino': 'fa-venus text-pink-400',
    'otro': 'fa-genderless text-purple-400'
  };

  return icons[gender] || 'fa-user text-gray-400';
}

/**
 * Calculate compatibility percentage (mock implementation)
 * @param {object} user1 - First user data
 * @param {object} user2 - Second user data
 * @returns {number} Compatibility percentage
 */
export function calculateCompatibility(user1, user2) {
  // This is a mock implementation
  // In a real app, you would compare interests, location, age preferences, etc.
  let compatibility = 50; // Base compatibility

  // Age difference factor
  if (user1.age && user2.age) {
    const ageDiff = Math.abs(user1.age - user2.age);
    if (ageDiff <= 5) compatibility += 20;
    else if (ageDiff <= 10) compatibility += 10;
  }

  // Same city bonus
  if (user1.city && user2.city && user1.city.toLowerCase() === user2.city.toLowerCase()) {
    compatibility += 15;
  }

  // Reputation similarity
  const repLevels = { 'BRONCE': 1, 'PLATA': 2, 'ORO': 3, 'PLATINO': 4 };
  const rep1 = repLevels[user1.reputation || 'BRONCE'];
  const rep2 = repLevels[user2.reputation || 'BRONCE'];
  if (Math.abs(rep1 - rep2) <= 1) compatibility += 15;

  return Math.min(100, compatibility);
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copiado al portapapeles', 'success');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showToast('Error al copiar', 'error');
  }
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Export all functions as default object
export default {
  showToast,
  calculateAge,
  getReputationBadge,
  formatRelativeTime,
  formatDate,
  formatDateShort,
  isValidEmail,
  validatePassword,
  debounce,
  truncateText,
  getStatusBadge,
  formatCurrency,
  generateId,
  isUserOnline,
  getGenderIcon,
  calculateCompatibility,
  sanitizeHTML,
  copyToClipboard,
  formatFileSize
};

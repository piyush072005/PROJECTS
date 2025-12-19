/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

const API_CONFIG = {
  // API Base URL - Change this to your backend server URL
  BASE_URL: process.env.API_URL || 'http://localhost:3000/api',
  
  // API Endpoints
  ENDPOINTS: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    HISTORY: '/history',
    HISTORY_STATS: '/history/stats'
  },
  
  // Get full URL for an endpoint
  getUrl(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}


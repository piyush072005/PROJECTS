/**
 * Authentication System with API Integration
 * Handles user registration, login, and session management
 * Uses backend API with MongoDB instead of localStorage
 */

class AuthSystemAPI {
  constructor() {
    this.tokenKey = 'algo_playground_token';
    this.currentUser = null;
    this.apiBaseUrl = window.API_CONFIG?.BASE_URL || 'http://localhost:3000/api';
    this.init();
  }

  init() {
    // Check for existing token
    this.loadSession();
    
    // Update navigation based on auth status
    this.updateNavigation();
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  // Store token
  setToken(token, rememberMe = false) {
    if (rememberMe) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }

  // Remove token
  removeToken() {
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
  }

  // Make authenticated API request
  async apiRequest(endpoint, options = {}) {
    const token = this.getToken();
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Register a new user
  async register(name, email, password) {
    try {
      const response = await this.apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (response.success) {
        // Store token
        this.setToken(response.token, true); // Auto-remember on registration
        this.currentUser = response.user;
        this.updateNavigation();
        return { success: true, message: response.message, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  }

  // Login user
  async login(email, password, rememberMe = false) {
    try {
      const response = await this.apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        // Store token
        this.setToken(response.token, rememberMe);
        this.currentUser = response.user;
        this.updateNavigation();
        return { success: true, message: response.message, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  }

  // Logout user
  async logout() {
    try {
      // Call logout endpoint (optional, mainly for token blacklisting in future)
      const token = this.getToken();
      if (token) {
        try {
          await this.apiRequest('/auth/logout', {
            method: 'POST'
          });
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        }
      }
    } finally {
      // Always clear local token
      this.removeToken();
      this.currentUser = null;
      this.updateNavigation();
    }
  }

  // Get current user from API
  async getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }

    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await this.apiRequest('/auth/me');
      if (response.success) {
        this.currentUser = response.user;
        return response.user;
      }
    } catch (error) {
      // Token might be invalid, clear it
      this.removeToken();
      this.currentUser = null;
    }

    return null;
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Add history entry
  async addHistoryEntry(type, data) {
    try {
      const response = await this.apiRequest('/history', {
        method: 'POST',
        body: JSON.stringify({ type, data })
      });
      return response.success;
    } catch (error) {
      console.error('Failed to add history entry:', error);
      return false;
    }
  }

  // Get user history
  async getUserHistory(limit = 50) {
    try {
      const response = await this.apiRequest(`/history?limit=${limit}`);
      if (response.success) {
        return response.history || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await this.apiRequest('/history/stats');
      if (response.success) {
        return response.stats;
      }
      return null;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  // Load existing session
  async loadSession() {
    const token = this.getToken();
    if (token) {
      // Verify token by getting user info
      try {
        await this.getCurrentUser();
        return true;
      } catch (error) {
        // Token invalid, clear it
        this.removeToken();
        return false;
      }
    }
    return false;
  }

  // Update navigation to show user info
  updateNavigation() {
    const navLinks = document.querySelector('.site-nav__links');
    if (!navLinks) return;

    // Remove existing auth links
    const existingAuthLinks = navLinks.querySelectorAll('.auth-link, .user-menu');
    existingAuthLinks.forEach(link => link.remove());

    // Check auth status (async, but we'll update UI optimistically)
    this.isAuthenticated().then(isLoggedIn => {
      if (isLoggedIn && this.currentUser) {
        // Add user menu
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
          <a href="dashboard.html" class="user-link">
            <span>👤 ${this.currentUser.name}</span>
          </a>
          <a href="#" class="user-link logout-link">Logout</a>
        `;
        navLinks.appendChild(userMenu);

        // Add logout handler
        const logoutLink = userMenu.querySelector('.logout-link');
        if (logoutLink) {
          logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.logout();
            window.location.href = 'login.html';
          });
        }
      } else {
        // Add login/register links
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.className = 'auth-link';
        loginLink.textContent = 'Login';
        navLinks.appendChild(loginLink);
      }
    });
  }
}

// Initialize auth system
const auth = new AuthSystemAPI();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.auth = auth;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthSystemAPI, auth };
}



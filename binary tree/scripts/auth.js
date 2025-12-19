/**
 * Authentication System
 * Handles user registration, login, and session management
 * Uses localStorage for user data storage
 */

class AuthSystem {
  constructor() {
    this.storageKey = 'algo_playground_users';
    this.sessionKey = 'algo_playground_session';
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check for existing session
    this.loadSession();
    
    // Update navigation based on auth status
    this.updateNavigation();
  }

  // Get all users from storage
  getUsers() {
    try {
      const usersJson = localStorage.getItem(this.storageKey);
      return usersJson ? JSON.parse(usersJson) : {};
    } catch (error) {
      console.error('Error loading users:', error);
      return {};
    }
  }

  // Save users to storage
  saveUsers(users) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  // Register a new user
  register(name, email, password) {
    const users = this.getUsers();

    // Check if user already exists
    if (users[email]) {
      return { success: false, message: 'Email already registered' };
    }

    // Validate password
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    // Create user object
    const userId = this.generateUserId();
    const user = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: this.hashPassword(password), // Simple hash (in production, use proper hashing)
      createdAt: new Date().toISOString(),
      lastLogin: null,
      history: []
    };

    // Save user
    users[email.toLowerCase().trim()] = user;
    
    if (this.saveUsers(users)) {
      // Auto-login after registration
      this.createSession(user);
      return { success: true, message: 'Account created successfully!', user };
    } else {
      return { success: false, message: 'Failed to create account. Please try again.' };
    }
  }

  // Login user
  login(email, password, rememberMe = false) {
    const users = this.getUsers();
    const user = users[email.toLowerCase().trim()];

    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Check password (simple comparison - in production, use proper password verification)
    if (user.password !== this.hashPassword(password)) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    users[email.toLowerCase().trim()] = user;
    this.saveUsers(users);

    // Create session
    this.createSession(user, rememberMe);
    
    return { success: true, message: 'Login successful!', user };
  }

  // Create user session
  createSession(user, rememberMe = false) {
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      loginTime: new Date().toISOString(),
      rememberMe: rememberMe
    };

    if (rememberMe) {
      // Store in localStorage (persists across sessions)
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
    } else {
      // Store in sessionStorage (cleared on browser close)
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    this.currentUser = user;
    this.updateNavigation();
  }

  // Load existing session
  loadSession() {
    let sessionJson = sessionStorage.getItem(this.sessionKey) || 
                      localStorage.getItem(this.sessionKey);

    if (sessionJson) {
      try {
        const session = JSON.parse(sessionJson);
        const users = this.getUsers();
        const user = users[session.email];

        if (user) {
          this.currentUser = user;
          return true;
        } else {
          // User no longer exists, clear session
          this.logout();
        }
      } catch (error) {
        console.error('Error loading session:', error);
        this.logout();
      }
    }

    return false;
  }

  // Logout user
  logout() {
    sessionStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.sessionKey);
    this.currentUser = null;
    this.updateNavigation();
  }

  // Get current user
  getCurrentUser() {
    if (!this.currentUser) {
      this.loadSession();
    }
    return this.currentUser;
  }

  // Check if user is logged in
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  // Add history entry
  addHistoryEntry(type, data) {
    const user = this.getCurrentUser();
    if (!user) return false;

    const users = this.getUsers();
    const historyEntry = {
      id: this.generateHistoryId(),
      type: type, // 'sort', 'search', 'tree', 'graph', etc.
      data: data,
      timestamp: new Date().toISOString()
    };

    user.history = user.history || [];
    user.history.unshift(historyEntry); // Add to beginning

    // Keep only last 100 entries
    if (user.history.length > 100) {
      user.history = user.history.slice(0, 100);
    }

    users[user.email] = user;
    this.saveUsers(users);
    this.currentUser = user;

    return true;
  }

  // Get user history
  getUserHistory(limit = 50) {
    const user = this.getCurrentUser();
    if (!user) return [];

    return (user.history || []).slice(0, limit);
  }

  // Update navigation to show user info
  updateNavigation() {
    const navLinks = document.querySelector('.site-nav__links');
    if (!navLinks) return;

    const isLoggedIn = this.isAuthenticated();
    const user = this.getCurrentUser();

    // Remove existing auth links
    const existingAuthLinks = navLinks.querySelectorAll('.auth-link, .user-menu');
    existingAuthLinks.forEach(link => link.remove());

    if (isLoggedIn && user) {
      // Add user menu
      const userMenu = document.createElement('div');
      userMenu.className = 'user-menu';
      userMenu.innerHTML = `
        <a href="dashboard.html" class="user-link">
          <span>👤 ${user.name}</span>
        </a>
        <a href="#" class="user-link logout-link">Logout</a>
      `;
      navLinks.appendChild(userMenu);

      // Add logout handler
      const logoutLink = userMenu.querySelector('.logout-link');
      if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
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
  }

  // Simple password hash (for demo - use proper hashing in production)
  hashPassword(password) {
    // Simple hash function (NOT secure for production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Generate unique user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate unique history ID
  generateHistoryId() {
    return 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Initialize auth system
const auth = new AuthSystem();

// Update navigation on page load (form handlers are in separate files: login-handler.js and register-handler.js)
document.addEventListener('DOMContentLoaded', () => {
  // Update navigation on page load
  if (typeof auth !== 'undefined') {
    auth.updateNavigation();
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthSystem, auth };
}


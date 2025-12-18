/**
 * Algo Playground Utilities
 * - Dark Mode Toggle
 * - URL State Sharing
 * - Mobile Touch Support
 */

// =============================================
// DARK MODE
// =============================================

const ThemeManager = {
  STORAGE_KEY: 'algo-playground-theme',
  
  init() {
    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (prefersDark) {
      this.setTheme('dark');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  },
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  },
  
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  },
  
  get() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
};

// =============================================
// URL STATE SHARING
// =============================================

const URLState = {
  // Encode data to URL-safe base64
  encode(data) {
    try {
      const json = JSON.stringify(data);
      return btoa(encodeURIComponent(json));
    } catch (e) {
      console.error('Failed to encode state:', e);
      return null;
    }
  },
  
  // Decode URL-safe base64 to data
  decode(encoded) {
    try {
      const json = decodeURIComponent(atob(encoded));
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to decode state:', e);
      return null;
    }
  },
  
  // Save state to URL
  save(data) {
    const encoded = this.encode(data);
    if (encoded) {
      const url = new URL(window.location.href);
      url.searchParams.set('data', encoded);
      window.history.replaceState({}, '', url.toString());
      return url.toString();
    }
    return null;
  },
  
  // Load state from URL
  load() {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get('data');
    if (encoded) {
      return this.decode(encoded);
    }
    return null;
  },
  
  // Clear state from URL
  clear() {
    const url = new URL(window.location.href);
    url.searchParams.delete('data');
    window.history.replaceState({}, '', url.toString());
  },
  
  // Generate shareable link
  getShareableLink(data) {
    const encoded = this.encode(data);
    if (encoded) {
      const url = new URL(window.location.href);
      url.searchParams.set('data', encoded);
      return url.toString();
    }
    return window.location.href;
  }
};

// =============================================
// SHARE FUNCTIONALITY
// =============================================

const ShareManager = {
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch (err) {
        document.body.removeChild(textarea);
        return false;
      }
    }
  },
  
  async shareLink(data, title = 'Algo Playground') {
    const url = URLState.getShareableLink(data);
    
    // Try native share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: 'Check out this algorithm visualization!',
          url: url
        });
        return { success: true, method: 'native' };
      } catch (e) {
        if (e.name !== 'AbortError') {
          // Fall through to clipboard
        }
      }
    }
    
    // Fallback to clipboard
    const copied = await this.copyToClipboard(url);
    return { success: copied, method: 'clipboard', url };
  }
};

// =============================================
// TOAST NOTIFICATIONS
// =============================================

const Toast = {
  container: null,
  timeout: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast';
      document.body.appendChild(this.container);
    }
  },
  
  show(message, duration = 3000) {
    this.init();
    
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.container.textContent = message;
    this.container.classList.add('visible');
    
    this.timeout = setTimeout(() => {
      this.container.classList.remove('visible');
    }, duration);
  }
};

// =============================================
// MOBILE TOUCH SUPPORT
// =============================================

const TouchSupport = {
  init() {
    // Add touch-friendly class to body if touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('touch-device');
    }
    
    // Prevent double-tap zoom on buttons
    document.querySelectorAll('button, .chip-link, a').forEach(el => {
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        el.click();
      }, { passive: false });
    });
    
    // Enable smooth scrolling for step lists
    document.querySelectorAll('.list-steps, .tree-visual').forEach(el => {
      el.style.webkitOverflowScrolling = 'touch';
    });
    
    // Add touch feedback
    this.addTouchFeedback();
  },
  
  addTouchFeedback() {
    const interactiveElements = document.querySelectorAll(
      'button, .chip-link, .site-nav__links a, .theme-toggle, .share-btn'
    );
    
    interactiveElements.forEach(el => {
      el.addEventListener('touchstart', () => {
        el.style.transform = 'scale(0.97)';
      }, { passive: true });
      
      el.addEventListener('touchend', () => {
        el.style.transform = '';
      }, { passive: true });
      
      el.addEventListener('touchcancel', () => {
        el.style.transform = '';
      }, { passive: true });
    });
  }
};

// =============================================
// FORM STATE PERSISTENCE
// =============================================

const FormState = {
  // Get current form data from the page
  getCurrentData() {
    const data = {};
    
    // Common input IDs across algorithm pages
    const inputIds = [
      'graph-input', 'source-input', 'node-count-input', 'matrix-input',
      'dataset-input', 'target-input', 'inorder-input', 'preorder-input',
      'postorder-input', 'values-input', 'array-input'
    ];
    
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value) {
        data[id] = el.value;
      }
    });
    
    return Object.keys(data).length > 0 ? data : null;
  },
  
  // Restore form data from object
  restoreData(data) {
    if (!data) return false;
    
    let restored = false;
    Object.entries(data).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = value;
        restored = true;
        // Trigger input event for any listeners
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    return restored;
  }
};

// =============================================
// INITIALIZATION
// =============================================

function initUtilities() {
  // Initialize theme
  ThemeManager.init();
  
  // Initialize touch support
  TouchSupport.init();
  
  // Load URL state if present
  const urlData = URLState.load();
  if (urlData) {
    FormState.restoreData(urlData);
    Toast.show('📋 Loaded shared state from URL');
  }
}

// Create theme toggle button HTML
function createThemeToggle() {
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle dark mode');
  btn.setAttribute('title', 'Toggle dark mode');
  btn.innerHTML = `
    <svg class="sun-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
    <svg class="moon-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  `;
  
  btn.addEventListener('click', () => {
    const newTheme = ThemeManager.toggle();
    Toast.show(newTheme === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
  });
  
  return btn;
}

// Create share button HTML
function createShareButton() {
  const btn = document.createElement('button');
  btn.className = 'share-btn';
  btn.setAttribute('aria-label', 'Share current state');
  btn.setAttribute('title', 'Share link');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
    </svg>
    Share
  `;
  
  btn.addEventListener('click', async () => {
    const data = FormState.getCurrentData();
    if (!data) {
      Toast.show('⚠️ Enter some data first to share');
      return;
    }
    
    const result = await ShareManager.shareLink(data, document.title);
    if (result.success) {
      if (result.method === 'clipboard') {
        Toast.show('📋 Link copied to clipboard!');
      }
    } else {
      Toast.show('❌ Failed to share link');
    }
  });
  
  return btn;
}

// Insert controls into navigation
function insertNavControls() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  
  const controls = document.createElement('div');
  controls.className = 'nav-controls';
  controls.style.cssText = 'display: flex; gap: 0.5rem; margin-left: auto; align-items: center;';
  
  controls.appendChild(createShareButton());
  controls.appendChild(createThemeToggle());
  
  nav.appendChild(controls);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initUtilities();
    insertNavControls();
  });
} else {
  initUtilities();
  insertNavControls();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ThemeManager,
    URLState,
    ShareManager,
    Toast,
    TouchSupport,
    FormState
  };
}




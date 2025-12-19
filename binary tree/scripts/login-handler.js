/**
 * Login Page Handler
 * Handles login form submission and redirects
 */

document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth-api.js to load
  const initLogin = () => {
    if (typeof auth === 'undefined') {
      setTimeout(initLogin, 100);
      return;
    }

    // If already logged in, redirect to home
    auth.isAuthenticated().then(isAuth => {
      if (isAuth) {
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTo;
        return;
      }
    });

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me')?.checked || false;
        const statusDiv = document.getElementById('login-status');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
          const result = await auth.login(email, password, rememberMe);

          if (result.success) {
            statusDiv.textContent = result.message;
            statusDiv.className = 'status-message visible success';
            
            // Get redirect destination or default to index.html
            const redirectTo = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
            sessionStorage.removeItem('redirectAfterLogin');
            
            // Redirect after 1 second
            setTimeout(() => {
              window.location.href = redirectTo;
            }, 1000);
          } else {
            statusDiv.textContent = result.message;
            statusDiv.className = 'status-message visible error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
          }
        } catch (error) {
          statusDiv.textContent = error.message || 'Login failed. Please try again.';
          statusDiv.className = 'status-message visible error';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      });
    }

    // Update navigation
    auth.updateNavigation();
  };

  initLogin();
});


/**
 * Register Page Handler
 * Handles registration form submission and redirects
 */

document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth-api.js to load
  const initRegister = () => {
    if (typeof auth === 'undefined') {
      setTimeout(initRegister, 100);
      return;
    }

    // If already logged in, redirect to home
    auth.isAuthenticated().then(isAuth => {
      if (isAuth) {
        window.location.href = 'index.html';
        return;
      }
    });

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        const statusDiv = document.getElementById('register-status');
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        // Validate passwords match
        if (password !== confirmPassword) {
          statusDiv.textContent = 'Passwords do not match';
          statusDiv.className = 'status-message visible error';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
          return;
        }

        try {
          const result = await auth.register(name, email, password);

          if (result.success) {
            statusDiv.textContent = result.message;
            statusDiv.className = 'status-message visible success';
            
            // Redirect to home page after 1 second
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 1000);
          } else {
            statusDiv.textContent = result.message;
            statusDiv.className = 'status-message visible error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
          }
        } catch (error) {
          statusDiv.textContent = error.message || 'Registration failed. Please try again.';
          statusDiv.className = 'status-message visible error';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      });
    }

    // Update navigation
    auth.updateNavigation();
  };

  initRegister();
});


/**
 * Authentication Guard
 * Redirects unauthenticated users to login page
 * Should be loaded on protected pages
 */

document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth-api.js to load
  const checkAuth = async () => {
    if (typeof auth === 'undefined') {
      // Retry after a short delay
      setTimeout(checkAuth, 100);
      return;
    }

    // Check if user is authenticated (async)
    const isAuth = await auth.isAuthenticated();
    
    if (!isAuth) {
      // Get current page
      const currentPage = window.location.pathname.split('/').pop();
      
      // Don't redirect if already on login/register pages
      if (currentPage !== 'login.html' && currentPage !== 'register.html') {
        // Store the intended destination
        sessionStorage.setItem('redirectAfterLogin', currentPage);
        
        // Redirect to login
        window.location.href = 'login.html';
      }
    } else {
      // User is authenticated, check if there's a redirect destination
      const redirectTo = sessionStorage.getItem('redirectAfterLogin');
      if (redirectTo && redirectTo !== 'index.html' && redirectTo !== 'login.html') {
        sessionStorage.removeItem('redirectAfterLogin');
        // Don't auto-redirect, let user navigate naturally
      }
    }
  };

  // Start checking
  checkAuth();
});


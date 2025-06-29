// Auth0 Configuration
// Replace these values with your actual Auth0 application credentials
export const auth0Config = {
  domain: "dev-ba1g8igbj36ihsp7.us.auth0.com",
  clientId: "k97eF9hOKmyrb2VU0yWfOWs7Jg1TRU4K",
  authorizationParams: {
    redirect_uri: "https://f169-108-53-147-205.ngrok-free.app/dashboard",
    audience: "https://dev-ba1g8igbj36ihsp7.us.auth0.com/api/v2/",
    scope: "openid profile email offline_access"
  },
  // Additional configuration for better session handling
  cacheLocation: "localstorage", // Use localStorage for better persistence
  useRefreshTokens: true, // Enable refresh tokens for better session management
};

// Instructions for setting up Auth0:
// 1. Go to https://auth0.com and create an account
// 2. Create a new application (Single Page Application)
// 3. In your Auth0 dashboard, go to Applications > Your App > Settings
// 4. Copy the Domain and Client ID
// 5. Replace the values above with your actual credentials
// 6. Add your application URL to Allowed Callback URLs: https://97f0-108-53-147-205.ngrok-free.app/dashboard
// 7. Add your application URL to Allowed Logout URLs: https://97f0-108-53-147-205.ngrok-free.app/login
// 8. Add your application URL to Allowed Web Origins: https://97f0-108-53-147-205.ngrok-free.app
// 9. IMPORTANT: Enable "Offline Access" in OAuth settings for refresh tokens

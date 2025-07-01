// Auth0 Configuration
// Environment variables are loaded from .env file
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    scope: "openid profile email offline_access"
  },
  // Additional configuration for better session handling
  cacheLocation: "localstorage", // Use localStorage for better persistence
  useRefreshTokens: true, // Enable refresh tokens for better session management
};

// Instructions for setting up Auth0:
// 1. Copy .env.example to .env and fill in your Auth0 credentials
// 2. Go to https://auth0.com and create an account
// 3. Create a new application (Single Page Application)
// 4. In your Auth0 dashboard, go to Applications > Your App > Settings
// 5. Copy the Domain and Client ID to your .env file
// 6. Add your application URL to Allowed Callback URLs: https://your-ngrok-url.ngrok-free.app/dashboard
// 7. Add your application URL to Allowed Logout URLs: https://your-ngrok-url.ngrok-free.app/login
// 8. Add your application URL to Allowed Web Origins: https://your-ngrok-url.ngrok-free.app
// 9. IMPORTANT: Enable "Offline Access" in OAuth settings for refresh tokens
 
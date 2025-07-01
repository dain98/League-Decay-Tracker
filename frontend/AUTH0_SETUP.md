# Auth0 Setup Guide

This guide will help you set up Auth0 authentication for the League Decay Tracker application.

## Prerequisites

- An Auth0 account (free tier available at https://auth0.com)
- Your React application running locally

## Step 1: Create an Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Click "Create Application"
3. Choose "Single Page Application" as the application type
4. Give your application a name (e.g., "League Decay Tracker")
5. Click "Create"

## Step 2: Configure Your Application

1. In your Auth0 dashboard, go to **Applications** > **Your App** > **Settings**
2. Copy the following values:
   - **Domain** (e.g., `dev-xyz123.us.auth0.com`)
   - **Client ID** (e.g., `abc123def456ghi789`)

## Step 3: Update Application Settings

In your Auth0 application settings, configure the following URLs:

### Allowed Callback URLs
```
http://localhost:5173/dashboard
```

### Allowed Logout URLs
```
http://localhost:5173/login
```

### Allowed Web Origins
```
http://localhost:5173
```

### ⚠️ IMPORTANT: Enable Refresh Tokens

**This is crucial for fixing the refresh issue!**

1. In your Auth0 application settings, scroll down to **Advanced Settings**
2. Click on the **OAuth** tab
3. **Enable "Refresh Token Rotation"** and **"Refresh Token Rotation Absolute"**
4. Set **Refresh Token Rotation Absolute** to a reasonable value (e.g., 30 days)
5. **Enable "Offline Access"** (this allows refresh tokens)
6. Save your changes

## Step 4: Update Your Application Configuration

1. Open `frontend/src/config/auth0.js`
2. Replace the placeholder values with your actual Auth0 credentials:

```javascript
export const auth0Config = {
  domain: "your-actual-domain.auth0.com",        // Replace with your domain
  clientId: "your-actual-client-id",             // Replace with your client ID
  authorizationParams: {
    redirect_uri: window.location.origin + '/dashboard',
    audience: "https://your-actual-domain.auth0.com/api/v2/",  // Replace with your domain
    scope: "openid profile email offline_access"  // Add offline_access for refresh tokens
  },
  cacheLocation: "localstorage",
  useRefreshTokens: true,
};
```

## Step 5: Test Your Setup

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Click "SIGN IN WITH AUTH0"
4. You should be redirected to Auth0's login page
5. After successful authentication, you'll be redirected back to your dashboard
6. **Test the refresh issue**: Refresh the page while on the dashboard - you should stay logged in

## Troubleshooting

### Common Issues

1. **"Invalid redirect_uri" error**
   - Make sure your callback URL exactly matches what's in Auth0 settings
   - Check for trailing slashes or protocol mismatches

2. **"Invalid client_id" error**
   - Verify your Client ID is correct in the config file
   - Make sure you're using the Client ID, not the Client Secret

3. **CORS errors**
   - Ensure your Web Origins are correctly configured in Auth0
   - Check that your development server is running on the expected port

4. **User gets logged out on refresh**
   - **Most common cause**: Refresh tokens are not enabled in Auth0 application settings
   - Make sure "Offline Access" is enabled in OAuth settings
   - Verify that `offline_access` is included in the scope
   - Check that `useRefreshTokens: true` is set in your config

### Environment Variables (Optional)

For production, consider using environment variables:

1. Create a `.env` file in your frontend directory:
```
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
```

2. Update `config/auth0.js`:
```javascript
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  // ... rest of config
};
```

## Security Notes

- Never commit your Auth0 credentials to version control
- Use environment variables for production deployments
- Regularly rotate your Auth0 application secrets
- Consider implementing additional security measures like MFA for production use

## Next Steps

Once Auth0 is working, you can:

1. Customize the login experience in Auth0 Dashboard
2. Add social login providers (Google, GitHub, etc.)
3. Implement role-based access control
4. Set up user profile management
5. Configure email verification and password policies 
 
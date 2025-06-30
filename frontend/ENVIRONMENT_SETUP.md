# Environment Variables Setup

This document explains how to set up environment variables for the League Decay Tracker frontend.

## Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your actual values:
   ```bash
   nano .env
   ```

## Environment Variables

### Auth0 Configuration

- `VITE_AUTH0_DOMAIN`: Your Auth0 domain (e.g., `dev-ba1g8igbj36ihsp7.us.auth0.com`)
- `VITE_AUTH0_CLIENT_ID`: Your Auth0 client ID
- `VITE_AUTH0_REDIRECT_URI`: Your application's callback URL (e.g., `https://your-ngrok-url.ngrok-free.app/dashboard`)
- `VITE_AUTH0_AUDIENCE`: Your Auth0 API audience (e.g., `https://your-auth0-domain.auth0.com/api/v2/`)

### Backend API

- `VITE_API_BASE_URL`: Your backend API URL (e.g., `http://localhost:3001/api` for local development)

## Example .env File

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=dev-ba1g8igbj36ihsp7.us.auth0.com
VITE_AUTH0_CLIENT_ID=k97eF9hOKmyrb2VU0yWfOWs7Jg1TRU4K
VITE_AUTH0_REDIRECT_URI=https://f169-108-53-147-205.ngrok-free.app/dashboard
VITE_AUTH0_AUDIENCE=https://dev-ba1g8igbj36ihsp7.us.auth0.com/api/v2/

# Backend API URL
VITE_API_BASE_URL=http://localhost:3001/api
```

## Security Notes

- The `.env` file is automatically ignored by Git to prevent committing sensitive information
- Never commit your actual `.env` file to version control
- The `.env.example` file serves as a template and can be safely committed

## Getting Auth0 Credentials

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new application (Single Page Application)
3. Go to Applications > Your App > Settings
4. Copy the Domain and Client ID
5. Configure your callback URLs in Auth0 settings

## Development vs Production

- For local development, use `http://localhost:3001/api` as your API base URL
- For production, use your actual backend URL
- Update the redirect URI when your ngrok URL changes 

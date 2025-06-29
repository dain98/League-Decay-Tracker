import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading, error, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    // Debug logging to help diagnose authentication issues
    console.log('AuthGuard - isAuthenticated:', isAuthenticated);
    console.log('AuthGuard - isLoading:', isLoading);
    console.log('AuthGuard - error:', error);
    
    // Try to get access token silently to trigger token refresh if needed
    if (!isLoading && !isAuthenticated) {
      getAccessTokenSilently({ ignoreCache: false })
        .then(token => {
          console.log('AuthGuard - Successfully got access token');
        })
        .catch(err => {
          console.log('AuthGuard - Failed to get access token:', err);
        });
    }
  }, [isAuthenticated, isLoading, error, getAccessTokenSilently]);

  // Show loading state while Auth0 is initializing
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // Handle Auth0 errors
  if (error) {
    console.error('AuthGuard - Authentication error:', error);
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Authentication Error
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('AuthGuard - User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('AuthGuard - User authenticated, rendering children');
  return children;
};

export default AuthGuard;

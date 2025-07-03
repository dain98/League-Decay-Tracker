import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, loading, error } = useFirebaseAuth();

  useEffect(() => {
    // Debug logging to help diagnose authentication issues
    console.log('AuthGuard - isAuthenticated:', isAuthenticated);
    console.log('AuthGuard - loading:', loading);
    console.log('AuthGuard - error:', error);
  }, [isAuthenticated, loading, error]);

  // Show loading state while Firebase is initializing
  if (loading) {
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

  // Handle Firebase errors
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
          {error}
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

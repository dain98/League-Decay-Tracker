import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const AuthDebug = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    user, 
    getAccessTokenSilently,
    loginWithRedirect,
    logout 
  } = useAuth0();

  const handleTestToken = async () => {
    try {
      const token = await getAccessTokenSilently();
      console.log('Access token:', token);
      alert('Token retrieved successfully! Check console for details.');
    } catch (err) {
      console.error('Error getting token:', err);
      alert('Error getting token: ' + err.message);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Auth0 Debug Information
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}
        </Typography>
        <Typography variant="body2">
          <strong>isLoading:</strong> {isLoading ? 'true' : 'false'}
        </Typography>
        <Typography variant="body2">
          <strong>Error:</strong> {error ? error.message : 'none'}
        </Typography>
      </Box>

      {user && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            User Information:
          </Typography>
          <Typography variant="body2">
            <strong>Name:</strong> {user.name}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {user.email}
          </Typography>
          <Typography variant="body2">
            <strong>Sub:</strong> {user.sub}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleTestToken}
        >
          Test Token
        </Button>
        
        {!isAuthenticated && (
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => loginWithRedirect()}
          >
            Login
          </Button>
        )}
        
        {isAuthenticated && (
          <Button 
            variant="contained" 
            color="secondary" 
            size="small" 
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin + '/login' } })}
          >
            Logout
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default AuthDebug; 

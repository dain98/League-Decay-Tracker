import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthToken } from '../services/api.js';

// Styled components
const PageContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100%',
  padding: 0,
  margin: 0,
  backgroundColor: '#091428',
  position: 'absolute',
  top: 0,
  left: 0,
});

const LoginContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '90%',
  maxWidth: 450,
  backgroundColor: 'rgba(10, 50, 60, 0.9)',
  borderRadius: theme.spacing(2),
}));

const Auth0Button = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  backgroundColor: '#d13639',
  padding: theme.spacing(1.5, 4),
  '&:hover': {
    backgroundColor: '#b13035',
  },
}));

const Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  const handleAuth0Login = async () => {
    try {
      // Get the access token after login
      const token = await getAccessTokenSilently();
      setAuthToken(token);
      loginWithRedirect();
    } catch (error) {
      console.error('Error getting access token:', error);
      // Fallback to regular login if token retrieval fails
      loginWithRedirect();
    }
  };

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    // Ensure we have the token stored
    getAccessTokenSilently()
      .then(token => {
        setAuthToken(token);
        window.location.href = '/dashboard';
      })
      .catch(error => {
        console.error('Error getting access token:', error);
        window.location.href = '/dashboard';
      });
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <PageContainer>
        <LoginContainer elevation={6}>
          <Typography variant="h6">Loading...</Typography>
        </LoginContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <LoginContainer elevation={6}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ranked Decay Tracker
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mt: 2, mb: 4 }}>
          Keep track of your League of Legends ranked decay status across multiple accounts
        </Typography>
        
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Auth0Button 
            variant="contained" 
            size="large"
            onClick={handleAuth0Login}
            startIcon={
              <Box 
                component="img" 
                src="https://cdn.auth0.com/styleguide/components/1.0.8/media/logos/img/badge.png" 
                alt="Auth0 Logo"
                sx={{ width: 20, height: 20, filter: 'invert(1)' }}
              />
            }
            fullWidth
          >
            SIGN IN WITH AUTH0
          </Auth0Button>
          
          <Typography variant="caption" sx={{ display: 'block', mt: 2, mb: 3, color: 'grey.400' }}>
            Secure authentication powered by Auth0
          </Typography>
        </Box>
      </LoginContainer>
    </PageContainer>
  );
};

export default Login;

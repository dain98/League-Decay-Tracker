import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

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

const RiotButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  backgroundColor: '#d13639',
  padding: theme.spacing(1.5, 4),
  '&:hover': {
    backgroundColor: '#b13035',
  },
}));

const Login = () => {
  const handleRiotLogin = () => {
    // In a real implementation, redirect to Riot OAuth URL
    // Temporarily disabled until OAuth is set up
    alert('Riot OAuth login is not set up yet. Please use the admin login for development.');
    
    // Commented out until OAuth is verified
    // const riotOAuthUrl = 'https://auth.riotgames.com/authorize' + 
    //   '?client_id=YOUR_CLIENT_ID' + 
    //   '&redirect_uri=YOUR_REDIRECT_URI' + 
    //   '&response_type=code' +
    //   '&scope=openid';
    // window.location.href = riotOAuthUrl;
  };

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
          <RiotButton 
            variant="contained" 
            size="large"
            onClick={handleRiotLogin}
            startIcon={
              <Box 
                component="img" 
                src="https://cdnjs.cloudflare.com/ajax/libs/simple-icons/6.0.0/riotgames.svg" 
                alt="Riot Games Logo"
                sx={{ width: 20, height: 20, filter: 'invert(1)' }}
              />
            }
            fullWidth
          >
            SIGN IN WITH RIOT GAMES
          </RiotButton>
          
          <Typography variant="caption" sx={{ display: 'block', mt: 2, mb: 3, color: 'grey.400' }}>
            We'll only access your basic account information
          </Typography>
          
          {/* Temporary admin login for development */}
          <Button 
            variant="outlined" 
            color="secondary"
            size="medium"
            onClick={() => {
              // Set mock user data in localStorage
              localStorage.setItem('user', JSON.stringify({
                username: 'Admin',
                riot_id: 'Admin#DEV',
                isAdmin: true
              }));
              // Redirect to dashboard
              window.location.href = '/dashboard';
            }}
            fullWidth
            sx={{ mt: 1 }}
          >
            Login as Admin (Dev Only)
          </Button>
        </Box>
      </LoginContainer>
    </PageContainer>
  );
};

export default Login;
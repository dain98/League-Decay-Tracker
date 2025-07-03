import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import WarningIcon from '@mui/icons-material/Warning';

const ErrorContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#091428',
  padding: theme.spacing(2)
}));

const ErrorCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  maxWidth: 500,
  width: '100%',
  backgroundColor: 'rgba(10, 50, 60, 0.9)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.1)'
}));

const DuplicateEmailError = () => {
  const { logout } = useFirebaseAuth();

  const handleGoBack = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <ErrorContainer>
      <ErrorCard>
        <Box sx={{ mb: 3 }}>
          <WarningIcon 
            sx={{ 
              fontSize: 64, 
              color: 'warning.main',
              mb: 2
            }} 
          />
        </Box>

        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'warning.main',
            mb: 2
          }}
        >
          Account Already Exists
        </Typography>

        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3, 
            width: '100%',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)'
          }}
        >
          <AlertTitle sx={{ fontWeight: 'bold' }}>
            Email Already Registered
          </AlertTitle>
          An account with this email address already exists. Please log in using your original authentication method.
        </Alert>

        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 4, lineHeight: 1.6 }}
        >
          This typically happens when you previously signed up using a different method 
          (like Google, Facebook, or another email provider) and are now trying to 
          create a new account with the same email address.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleGoBack}
          sx={{
            backgroundColor: '#d13639',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#b13035',
            }
          }}
        >
          Go Back to Login
        </Button>

        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 3, opacity: 0.7 }}
        >
          You will be logged out and redirected to the login page
        </Typography>
      </ErrorCard>
    </ErrorContainer>
  );
};

export default DuplicateEmailError; 

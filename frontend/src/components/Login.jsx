import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  TextField,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import GoogleIcon from '@mui/icons-material/Google';

// Styled components
const PageContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
  width: '100%',
  padding: 0,
  margin: 0,
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

const AuthButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5, 4),
  '&:hover': {
    backgroundColor: '#b13035',
  },
}));

const GoogleButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: '#4285f4',
  color: 'white',
  padding: theme.spacing(1.5, 4),
  '&:hover': {
    backgroundColor: '#357abd',
  },
}));

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  
  const { 
    signIn, 
    signUp, 
    signInWithGoogle, 
    isAuthenticated, 
    loading: authLoading, 
    error: authError 
  } = useFirebaseAuth();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        // Show verification message and redirect to verification page
        setShowVerificationMessage(true);
        setTimeout(() => {
          window.location.href = '/verify-email';
        }, 2000); // Show message for 2 seconds before redirecting
      } else {
        await signIn(email, password);
        // Redirect to dashboard on sign in success
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    window.location.href = '/dashboard';
    return null;
  }

  // Show loading state
  if (authLoading) {
    return (
      <PageContainer>
        <LoginContainer elevation={6}>
          <CircularProgress color="primary" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </LoginContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <LoginContainer elevation={6}>
        <Typography variant="h4" component="h1" gutterBottom>
          LoL Decay Tracker
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mt: 2, mb: 4 }}>
          Keep track of your League of Legends ranked decay status across multiple accounts
        </Typography>

        {authError && (
          <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
            {authError}
          </Alert>
        )}

        {showVerificationMessage && (
          <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
            Account created successfully! Verification email sent. Redirecting to verification page...
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleEmailAuth} sx={{ width: '100%' }}>
          {isSignUp && (
                      <TextField
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            disabled={isLoading || showVerificationMessage}
          />
          )}
          
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            required
            disabled={isLoading || showVerificationMessage}
          />
          
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            required
            disabled={isLoading || showVerificationMessage}
          />
          
          <AuthButton
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading || showVerificationMessage}
            sx={{ backgroundColor: '#d13639' }}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              isSignUp ? 'Sign Up' : 'Sign In'
            )}
          </AuthButton>
        </Box>

        <Divider sx={{ width: '100%', my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <GoogleButton
          variant="contained"
          size="large"
          onClick={handleGoogleSignIn}
          disabled={isLoading || showVerificationMessage}
          startIcon={<GoogleIcon />}
          fullWidth
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Continue with Google'
          )}
        </GoogleButton>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Typography>
          <Button
            variant="text"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={isLoading || showVerificationMessage}
            sx={{ mt: 1 }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Button>
        </Box>

        {isSignUp && (
          <Alert severity="info" sx={{ mt: 3, width: '100%' }}>
            <Typography variant="body2">
              We'll send you an email verification link. Please verify your email to continue.
            </Typography>
          </Alert>
        )}
      </LoginContainer>
    </PageContainer>
  );
};

export default Login;

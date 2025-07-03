import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { Email, Refresh, Logout } from '@mui/icons-material';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';

const EmailNotVerified = () => {
  const { user, logout } = useFirebaseAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResendVerification = async () => {
    if (!user) return;
    
    setIsResending(true);
    setResendError('');
    setResendSuccess(false);
    
    try {
      await user.sendEmailVerification();
      setResendSuccess(true);
    } catch (error) {
      console.error('Error sending verification email:', error);
      setResendError('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Email sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        
        <Typography variant="h4" gutterBottom>
          Email Verification Required
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please verify your email address ({user?.email}) to use League Decay Tracker.
        </Typography>

        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Verification email sent! Please check your inbox and spam folder.
          </Alert>
        )}

        {resendError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {resendError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={isResending ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleResendVerification}
            disabled={isResending}
            sx={{ minWidth: 200 }}
          >
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ minWidth: 120 }}
          >
            Logout
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          After verifying your email, please refresh this page or log in again.
        </Typography>
      </Paper>
    </Container>
  );
};

export default EmailNotVerified; 

import React from 'react';
import {
  Container,
  CircularProgress,
  Typography,
  Alert,
  Button
} from '@mui/material';

const LoadingState = () => (
  <Container sx={{ mt: 10, textAlign: 'center' }}>
    <CircularProgress color="primary" />
    <Typography variant="h6" sx={{ mt: 2 }}>
      Loading your accounts...
    </Typography>
  </Container>
);

const ErrorState = ({ error, onRetry, onLogout }) => (
  <Container sx={{ mt: 10, textAlign: 'center' }}>
    <Alert severity="error" sx={{ mb: 2 }}>
      {error}
    </Alert>
    <Button 
      variant="contained" 
      color="primary" 
      onClick={onRetry}
      sx={{ mr: 2 }}
    >
      Retry
    </Button>
    <Button 
      variant="outlined" 
      onClick={onLogout}
    >
      Logout
    </Button>
  </Container>
);

const NoUserState = ({ onLogout }) => (
  <Container sx={{ mt: 10, textAlign: 'center' }}>
    <Typography variant="h5">No user data available</Typography>
    <Button 
      variant="contained" 
      color="primary" 
      onClick={onLogout}
      sx={{ mt: 2 }}
    >
      Return to Login
    </Button>
  </Container>
);

const EmptyAccountsState = ({ onAddAccount }) => (
  <Container sx={{ mt: 10, textAlign: 'center' }}>
    <Typography variant="h6" gutterBottom>
      No League accounts yet
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Add your first League of Legends account to start tracking decay
    </Typography>
    <Button 
      variant="contained" 
      color="primary" 
      onClick={onAddAccount}
    >
      Add Your First Account
    </Button>
  </Container>
);

export { LoadingState, ErrorState, NoUserState, EmptyAccountsState }; 

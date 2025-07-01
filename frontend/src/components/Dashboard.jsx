import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { styled } from '@mui/material/styles';
import { useAuth0 } from '@auth0/auth0-react';
import apiClient, { userAPI, accountsAPI, handleAPIError, clearAuthToken } from '../services/api.js';

// Import custom components
import AccountList from './AccountList';
import AddAccountDialog from './AddAccountDialog';
import GlobalDecayCountdown from './GlobalDecayCountdown';
import UserMenu from './UserMenu';
import { LoadingState, ErrorState, NoUserState, EmptyAccountsState } from './DashboardStates';

// Styled components
const DashboardContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(10),
  marginBottom: theme.spacing(4),
}));

const WelcomeCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  backgroundColor: 'rgba(10, 50, 60, 0.8)',
}));

const UserMenuButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  transition: 'background-color 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user, logout, getAccessTokenSilently } = useAuth0();
  const [missingNameDialogOpen, setMissingNameDialogOpen] = useState(false);
  const [fallbackName, setFallbackName] = useState('');
  const [pendingLoad, setPendingLoad] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Default to dark theme
  
  const loadData = async (fallbackNameParam) => {
    try {
      setIsLoading(true);
      setError(null);
      // Ensure we have the latest token
      const token = await getAccessTokenSilently();
      localStorage.setItem('auth0_token', token);
      // Load user's league accounts
      let url = '/users/me/accounts';
      if (fallbackNameParam) {
        url += `?fallbackName=${encodeURIComponent(fallbackNameParam)}`;
      }
      const response = await apiClient.get(url);
      setAccounts(response.data.data || []);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error === 'MISSING_NAME') {
        setMissingNameDialogOpen(true);
        setPendingLoad(true);
        return;
      }
      if (error.response && error.response.data && error.response.data.error === 'DUPLICATE_EMAIL') {
        setError('An account with this email already exists. Please log in using your original provider.');
        return;
      }
      setError(handleAPIError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !missingNameDialogOpen && !pendingLoad) {
      loadData();
    }
    // eslint-disable-next-line
  }, [user, getAccessTokenSilently]);
  
  const handleAddAccount = async (newAccount) => {
    try {
      setIsLoading(true);
      const response = await accountsAPI.add(newAccount);
      
      // Add the new account to the list
      setAccounts(prevAccounts => [...prevAccounts, response.data]);
      setIsAddDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'League account added successfully!',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error adding account:', error);
      setSnackbar({
        open: true,
        message: handleAPIError(error),
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAccount = async (accountId) => {
    try {
      await accountsAPI.delete(accountId);
      
      // Remove the account from the list
      setAccounts(prevAccounts => prevAccounts.filter(account => account._id !== accountId));
      
      setSnackbar({
        open: true,
        message: 'Account deleted successfully!',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error deleting account:', error);
      setSnackbar({
        open: true,
        message: handleAPIError(error),
        severity: 'error'
      });
    }
  };

  const handleRefreshAccount = async (accountId) => {
    try {
      const response = await accountsAPI.refresh(accountId);
      
      // Update the account in the list
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account._id === accountId ? response.data : account
        )
      );
      
      setSnackbar({
        open: true,
        message: 'Account data refreshed successfully!',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error refreshing account:', error);
      setSnackbar({
        open: true,
        message: handleAPIError(error),
        severity: 'error'
      });
    }
  };
  
  const handleLogout = () => {
    clearAuthToken();
    logout({ logoutParams: { returnTo: window.location.origin + '/login' } });
  };

  const handleUserMenuClick = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    // TODO: Implement profile page/modal
    setSnackbar({
      open: true,
      message: 'Profile feature coming soon!',
      severity: 'info'
    });
  };

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
    // TODO: Implement theme switching
    setSnackbar({
      open: true,
      message: `Switched to ${!isDarkTheme ? 'dark' : 'light'} theme!`,
      severity: 'info'
    });
  };

  const getMostUrgentAccount = () => {
    return accounts.reduce((urgent, account) => {
      if (!urgent || account.remainingDecayDays < urgent.remainingDecayDays) {
        return account;
      }
      return urgent;
    }, null);
  };

  const urgentAccount = getMostUrgentAccount();
  
  // Handler for submitting fallback name
  const handleFallbackNameSubmit = async () => {
    setMissingNameDialogOpen(false);
    setPendingLoad(false);
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for dialog close
      await loadData(fallbackName);
    } catch (error) {
      setError(handleAPIError(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state
  if (isLoading && accounts.length === 0) {
    return <LoadingState />;
  }
  
  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} onLogout={handleLogout} />;
  }
  
  // Show error state if no user
  if (!user) {
    return <NoUserState onLogout={handleLogout} />;
  }
  
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Ranked Decay Tracker
          </Typography>
          
          <UserMenu 
            user={user}
            onLogout={handleLogout}
            onProfileClick={handleProfileClick}
            onThemeToggle={handleThemeToggle}
            isDarkTheme={isDarkTheme}
          />
        </Toolbar>
      </AppBar>
      
      <DashboardContainer>
        {urgentAccount && (
          <GlobalDecayCountdown 
            daysRemaining={urgentAccount.remainingDecayDays} 
            accountName={urgentAccount.gameName}
          />
        )}
        
        <WelcomeCard elevation={3}>
          <Typography variant="h5" gutterBottom>
            Welcome back, {user?.name || user?.email || 'Summoner'}!
          </Typography>
          <Typography variant="body1">
            Track your League of Legends ranked decay across multiple accounts.
          </Typography>
        </WelcomeCard>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Your Accounts ({accounts.length})</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddCircleIcon />}
            onClick={() => setIsAddDialogOpen(true)}
            disabled={isLoading}
          >
            Add Account
          </Button>
        </Box>
        
        {accounts.length === 0 ? (
          <EmptyAccountsState onAddAccount={() => setIsAddDialogOpen(true)} />
        ) : (
          <AccountList 
            accounts={accounts} 
            onDelete={handleDeleteAccount}
            onRefresh={handleRefreshAccount}
            isLoading={isLoading}
          />
        )}
        
        <AddAccountDialog 
          open={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAddAccount}
          isLoading={isLoading}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Dialog open={missingNameDialogOpen} disableEscapeKeyDown>
          <DialogTitle>Please enter your name</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              value={fallbackName}
              onChange={e => setFallbackName(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleFallbackNameSubmit}
              variant="contained"
              disabled={!fallbackName.trim()}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardContainer>
    </>
  );
};

export default Dashboard;

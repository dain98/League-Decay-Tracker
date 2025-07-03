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
import { useUserProfile } from '../context/UserProfileContext.jsx';

// Import custom components
import AccountList from './AccountList';
import AddAccountDialog from './AddAccountDialog';
import GlobalDecayCountdown from './GlobalDecayCountdown';
import UserMenu from './UserMenu';
import Profile from './Profile';
import { LoadingState, ErrorState, NoUserState, EmptyAccountsState } from './DashboardStates';
import DuplicateEmailError from './DuplicateEmailError';

// Styled components
const DashboardContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(10),
  marginBottom: theme.spacing(4),
}));

const WelcomeCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
}));

const UserMenuButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  transition: 'background-color 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { logout } = useAuth0();
  const { profile, loading: profileLoading, error: profileError, refresh: refreshProfile, apiClient } = useUserProfile();
  const [missingNameDialogOpen, setMissingNameDialogOpen] = useState(false);
  const [fallbackName, setFallbackName] = useState('');
  const [pendingLoad, setPendingLoad] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showDuplicateEmailError, setShowDuplicateEmailError] = useState(false);

  const loadData = async (fallbackNameParam) => {
    if (!apiClient) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
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
        setIsLoading(false);
        return;
      }
      if (error.response && error.response.data && error.response.data.error === 'DUPLICATE_EMAIL') {
        setShowDuplicateEmailError(true);
        setIsLoading(false);
        return;
      }
      setError(error.response?.data?.message || 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile && !missingNameDialogOpen && !pendingLoad) {
      loadData();
    }
  }, [profile, missingNameDialogOpen, pendingLoad]);
  
  const handleAddAccount = async (newAccount) => {
    if (!apiClient) {
      setSnackbar({
        open: true,
        message: 'Not authenticated',
        severity: 'error'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiClient.post('/accounts', newAccount);
      
      // Add the new account to the list
      setAccounts(prevAccounts => [...prevAccounts, response.data.data]);
      setIsAddDialogOpen(false);
      setAccountToEdit(null);
      
      setSnackbar({
        open: true,
        message: 'League account added successfully!',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error adding account:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to add account',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAccount = async (accountId, updatedAccount) => {
    if (!apiClient) {
      setSnackbar({
        open: true,
        message: 'Not authenticated',
        severity: 'error'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiClient.put(`/accounts/${accountId}`, updatedAccount);
      
      // Update the account in the list
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account._id === accountId ? response.data.data : account
        )
      );
      setIsAddDialogOpen(false);
      setAccountToEdit(null);
      
      setSnackbar({
        open: true,
        message: 'League account updated successfully!',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error updating account:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update account',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAccount = async (accountId) => {
    if (!apiClient) {
      setSnackbar({
        open: true,
        message: 'Not authenticated',
        severity: 'error'
      });
      return;
    }
    
    try {
      await apiClient.delete(`/accounts/${accountId}`);
      
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
        message: error.response?.data?.message || 'Failed to delete account',
        severity: 'error'
      });
    }
  };

  const handleRefreshAccount = async (accountId) => {
    if (!apiClient) {
      setSnackbar({
        open: true,
        message: 'Not authenticated',
        severity: 'error'
      });
      return;
    }
    
    try {
      const response = await apiClient.post(`/accounts/${accountId}/refresh`);
      
      // Update the account in the list
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account._id === accountId ? response.data.data : account
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
        message: error.response?.data?.message || 'Failed to refresh account',
        severity: 'error'
      });
    }
  };
  
  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin + '/login' } });
  };

  const handleUserMenuClick = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleEditAccountClick = (account) => {
    setAccountToEdit(account);
    setIsAddDialogOpen(true);
  };

  const handleProfileClose = () => {
    setShowProfile(false);
  };

  const getMostUrgentAccount = () => {
    return accounts.reduce((urgent, account) => {
      // If current account is immune (-1), it should be shown if no other urgent account exists
      if (account.remainingDecayDays === -1) {
        if (!urgent || urgent.remainingDecayDays === -1) {
          return account;
        }
        return urgent;
      }
      
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
  
  // Show duplicate email error page
  if (showDuplicateEmailError) {
    return <DuplicateEmailError />;
  }
  
  // Check for DUPLICATE_EMAIL error in profile loading
  if (profileError === 'DUPLICATE_EMAIL') {
    return <DuplicateEmailError />;
  }
  
  // Show loading state
  if (isLoading && accounts.length === 0) {
    return <LoadingState />;
  }
  if (profileLoading) {
    return <LoadingState />;
  }
  
  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} onLogout={handleLogout} />;
  }
  if (profileError) {
    return <ErrorState error={profileError} onRetry={handleRetry} onLogout={handleLogout} />;
  }
  
  // Show error state if no user
  if (!profile) {
    return <NoUserState onLogout={handleLogout} />;
  }

  // Show Profile page
  if (showProfile) {
    return <Profile onClose={handleProfileClose} />;
  }
  
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LoL Decay Tracker
          </Typography>
          
          <UserMenu 
            user={profile}
            onLogout={handleLogout}
            onProfileClick={handleProfileClick}
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
            Welcome back, {profile?.name || profile?.email || 'Summoner'}!
          </Typography>
          <Typography variant="body1">
            Track your League of Legends ranked decay across multiple accounts.
          </Typography>
        </WelcomeCard>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">
            Your Accounts ({accounts.length})
          </Typography>
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
          onEdit={handleEditAccountClick}
          isLoading={isLoading}
        />
        )}
        
        <AddAccountDialog 
          open={isAddDialogOpen} 
          onClose={() => {
            setIsAddDialogOpen(false);
            setAccountToEdit(null);
          }}
          onAdd={handleAddAccount}
          onEdit={handleEditAccount}
          accountToEdit={accountToEdit}
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

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
  CircularProgress
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { styled } from '@mui/material/styles';

// Import custom components
import AccountList from './AccountList';
import AddAccountDialog from './AddAccountDialog';
import GlobalDecayCountdown from './GlobalDecayCountdown';

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

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // Load user data from localStorage
  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    console.log('User data from localStorage:', userDataString);
    
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUser(userData);
        
        // Mock data for development - replace with real API calls later
        if (userData.isAdmin) {
          setAccounts([
            {
              id: 1,
              riot_id: 'RiotUser1#NA1',
              game_name: 'RiotUser1',
              tag_line: 'NA1',
              region: 'NA',
              decay_days_remaining: 28,
              last_updated: new Date().toISOString()
            },
            {
              id: 2,
              riot_id: 'RiotUser2#EUW',
              game_name: 'RiotUser2',
              tag_line: 'EUW',
              region: 'EUW',
              decay_days_remaining: 3,
              last_updated: new Date().toISOString()
            }
          ]);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);
  
  const handleAddAccount = (newAccount) => {
    // In a real app, this would make an API call to your backend
    const accountWithId = {
      ...newAccount,
      id: accounts.length + 1, // This would be handled by the DB
      last_updated: new Date().toISOString()
    };
    
    setAccounts([...accounts, accountWithId]);
    setIsAddDialogOpen(false);
  };
  
  const handleDeleteAccount = (accountId) => {
    // In a real app, make an API call to delete from backend
    setAccounts(accounts.filter(account => account.id !== accountId));
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  // Find account with most urgent decay
  const getMostUrgentAccount = () => {
    if (accounts.length === 0) return null;
    return accounts.reduce((prev, current) => 
      (prev.decay_days_remaining < current.decay_days_remaining) ? prev : current
    );
  };
  
  const urgentAccount = getMostUrgentAccount();
  
  // For debugging - remove in production
  console.log('User state:', user);
  console.log('Accounts state:', accounts);
  console.log('Urgent account:', urgentAccount);
  
  if (!user) {
    return (
      <Container sx={{ mt: 10, textAlign: 'center' }}>
        <Typography variant="h5">Loading user data...</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleLogout}
          sx={{ mt: 2 }}
        >
          Return to Login
        </Button>
      </Container>
    );
  }
  
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Ranked Decay Tracker
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountCircleIcon sx={{ mr: 1 }} />
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user?.username || 'Summoner'}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <DashboardContainer>
        {urgentAccount && (
          <GlobalDecayCountdown 
            daysRemaining={urgentAccount.decay_days_remaining} 
            accountName={urgentAccount.game_name}
          />
        )}
        
        <WelcomeCard elevation={3}>
          <Typography variant="h5" gutterBottom>
            Welcome back, {user?.username || 'Summoner'}!
          </Typography>
          <Typography variant="body1">
            Track your League of Legends ranked decay across multiple accounts.
          </Typography>
        </WelcomeCard>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Your Accounts</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddCircleIcon />}
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Account
          </Button>
        </Box>
        
        <AccountList 
          accounts={accounts} 
          onDelete={handleDeleteAccount} 
        />
        
        <AddAccountDialog 
          open={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAddAccount}
        />
      </DashboardContainer>
    </>
  );
};

export default Dashboard;
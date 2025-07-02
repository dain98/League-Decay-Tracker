import React from 'react';
import { 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton, 
  Chip,
  Box,
  Typography,
  Tooltip,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { styled } from '@mui/material/styles';
import { getSummonerIconUrlSync } from '../services/ddragon.js';

// Styled components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(10, 50, 60, 0.1)',
  },
  '&:hover': {
    backgroundColor: 'rgba(10, 50, 60, 0.2)',
  },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

const DecayChip = styled(Chip)(({ theme, severity }) => ({
  backgroundColor: severity === 'immune' ? theme.palette.success.main :
                   severity === 'critical' ? theme.palette.error.main : 
                   severity === 'warning' ? theme.palette.warning.main : 
                   severity === 'info' ? theme.palette.info.main : theme.palette.success.main,
  color: theme.palette.getContrastText(
    severity === 'immune' ? theme.palette.success.main :
    severity === 'critical' ? theme.palette.error.main : 
    severity === 'warning' ? theme.palette.warning.main : 
    severity === 'info' ? theme.palette.info.main : theme.palette.success.main
  ),
  fontWeight: 'bold',
}));

const AccountList = ({ accounts, onDelete, onRefresh, isLoading }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [accountToDelete, setAccountToDelete] = React.useState(null);
  const [refreshCooldowns, setRefreshCooldowns] = React.useState({});
  const [tooltipTime, setTooltipTime] = React.useState({});

  // 5 minutes in milliseconds
  const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;

  // Initialize cooldowns based on account lastUpdated timestamps
  React.useEffect(() => {
    const initialCooldowns = {};
    accounts.forEach(account => {
      if (account.lastUpdated) {
        const lastUpdateTime = new Date(account.lastUpdated).getTime();
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime;
        
        // If the account was updated less than 5 minutes ago, set a cooldown
        if (timeSinceLastUpdate < REFRESH_COOLDOWN_MS) {
          initialCooldowns[account._id] = lastUpdateTime;
        }
      }
    });
    setRefreshCooldowns(initialCooldowns);
  }, [accounts]);

  // Update tooltip time every second for accounts on cooldown
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTooltipTime = {};
      
      Object.keys(refreshCooldowns).forEach(accountId => {
        const lastRefresh = refreshCooldowns[accountId];
        const timeSinceLastRefresh = now - lastRefresh;
        
        if (timeSinceLastRefresh < REFRESH_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil((REFRESH_COOLDOWN_MS - timeSinceLastRefresh) / 1000);
          const remainingMinutes = Math.floor(remainingSeconds / 60);
          const remainingSecondsOnly = remainingSeconds % 60;
          
          if (remainingMinutes > 0) {
            newTooltipTime[accountId] = `Refresh available in ${remainingMinutes}m ${remainingSecondsOnly}s`;
          } else {
            newTooltipTime[accountId] = `Refresh available in ${remainingSecondsOnly}s`;
          }
        } else {
          // Remove from cooldowns if time has passed
          setRefreshCooldowns(prev => {
            const newCooldowns = { ...prev };
            delete newCooldowns[accountId];
            return newCooldowns;
          });
        }
      });
      
      setTooltipTime(newTooltipTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshCooldowns]);

  const handleDeleteClick = (accountId) => {
    setAccountToDelete(accountId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (accountToDelete) {
      onDelete(accountToDelete);
    }
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleRefreshClick = (accountId) => {
    const now = Date.now();
    const lastRefresh = refreshCooldowns[accountId] || 0;
    const timeSinceLastRefresh = now - lastRefresh;

    if (timeSinceLastRefresh < REFRESH_COOLDOWN_MS) {
      const remainingTime = Math.ceil((REFRESH_COOLDOWN_MS - timeSinceLastRefresh) / 1000 / 60);
      alert(`Please wait ${remainingTime} more minute(s) before refreshing this account again.`);
      return;
    }

    // Set cooldown and call refresh
    setRefreshCooldowns(prev => ({
      ...prev,
      [accountId]: now
    }));
    onRefresh(accountId);
  };

  const isRefreshDisabled = (accountId) => {
    const now = Date.now();
    const lastRefresh = refreshCooldowns[accountId] || 0;
    const timeSinceLastRefresh = now - lastRefresh;
    return timeSinceLastRefresh < REFRESH_COOLDOWN_MS;
  };

  const getRefreshTooltip = (accountId) => {
    if (isLoading) return "Refreshing...";
    
    if (isRefreshDisabled(accountId)) {
      return tooltipTime[accountId] || "Calculating...";
    }
    
    return "Refresh account data";
  };

  const getDecaySeverity = (daysRemaining) => {
    if (daysRemaining === -1) return 'immune';
    if (daysRemaining <= 3) return 'critical';
    if (daysRemaining <= 7) return 'warning';
    if (daysRemaining <= 14) return 'info';
    return 'success';
  };

  const getDecayLabel = (daysRemaining) => {
    if (daysRemaining === -1) return '∞ IMMUNE';
    if (daysRemaining <= 0) return 'DECAYED';
    if (daysRemaining === 1) return '1 DAY';
    return `${daysRemaining} DAYS`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRank = (account) => {
    // Try to use the virtual rankDisplay field first
    if (account.rankDisplay && account.rankDisplay !== 'Unranked') {
      return `${account.rankDisplay} (${account.lp || 0} LP)`;
    }
    
    // Fallback to manual formatting
    if (!account.tier || !account.division) return 'Unranked';
    return `${account.tier} ${account.division} (${account.lp || 0} LP)`;
  };

  if (accounts.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No accounts found
        </Typography>
      </Paper>
    );
  }

  return (
    <StyledTableContainer component={Paper} elevation={3}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Account</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Region</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Current Rank</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Decay Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((account) => {
            const severity = getDecaySeverity(account.remainingDecayDays);
            const decayLabel = getDecayLabel(account.remainingDecayDays);
            const iconUrl = getSummonerIconUrlSync(account.summonerIcon);
            
            return (
              <StyledTableRow key={account._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={iconUrl}
                      alt="Summoner Icon"
                      sx={{ width: 32, height: 32, mr: 1 }}
                    />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {account.gameName}#{account.tagLine}
                      </Typography>
                      <Typography variant="caption">
                        {account.riotId}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={account.region} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell>
                  {formatRank(account)}
                </TableCell>
                <TableCell>
                  <DecayChip label={decayLabel} severity={severity} size="small" />
                </TableCell>
                <TableCell>
                  {formatDate(account.lastUpdated)}
                </TableCell>
                <TableCell>
                  <Tooltip title={getRefreshTooltip(account._id)}>
                    <span>
                      <IconButton
                        onClick={() => handleRefreshClick(account._id)}
                        disabled={isLoading || isRefreshDisabled(account._id)}
                        size="small"
                        color="primary"
                      >
                        <RefreshIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <IconButton
                    onClick={() => handleDeleteClick(account._id)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </StyledTableRow>
            );
          })}
        </TableBody>
      </Table>
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this account? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </StyledTableContainer>
  );
};

export default AccountList;

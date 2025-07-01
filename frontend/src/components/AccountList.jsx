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

const DecayChip = styled(Chip)(({ theme, severity }) => ({
  backgroundColor: severity === 'critical' ? '#d32f2f' : 
                   severity === 'warning' ? '#ed6c02' : 
                   severity === 'info' ? '#0288d1' : '#2e7d32',
  color: 'white',
  fontWeight: 'bold',
}));

const AccountList = ({ accounts, onDelete, onRefresh, isLoading }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [accountToDelete, setAccountToDelete] = React.useState(null);

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

  const getDecaySeverity = (daysRemaining) => {
    if (daysRemaining <= 3) return 'critical';
    if (daysRemaining <= 7) return 'warning';
    if (daysRemaining <= 14) return 'info';
    return 'success';
  };

  const getDecayLabel = (daysRemaining) => {
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
    if (!account.tier || !account.rank) return 'Unranked';
    return `${account.tier} ${account.rank} (${account.leaguePoints || 0} LP)`;
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
    <TableContainer component={Paper} elevation={3}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'rgba(10, 50, 60, 0.3)' }}>
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
            console.log('SummonerIcon:', account.summonerIcon, 'IconURL:', iconUrl);
            
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
                      <Typography variant="caption" color="text.secondary">
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
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {formatRank(account)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <DecayChip 
                    label={decayLabel}
                    severity={severity}
                        size="small" 
                  />
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(account.lastUpdated)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh account data">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => onRefresh(account._id)}
                        disabled={isLoading}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete account">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(account._id)}
                        disabled={isLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
    </TableContainer>
  );
};

export default AccountList;

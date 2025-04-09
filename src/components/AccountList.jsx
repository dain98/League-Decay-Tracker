import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  ListItemSecondaryAction,
  Avatar, 
  IconButton, 
  Chip,
  Paper,
  Typography,
  Grid,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import GamepadIcon from '@mui/icons-material/Gamepad';
import { format } from 'date-fns';

const AccountList = ({ accounts, onDelete }) => {
  // Debug
  console.log('AccountList received accounts:', accounts);

  if (!accounts || accounts.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">
          No accounts added yet. Click "Add Account" to get started!
        </Typography>
      </Paper>
    );
  }

  const getDecayStatusColor = (daysRemaining) => {
    if (daysRemaining <= 3) return 'error';
    if (daysRemaining <= 7) return 'warning';
    return 'success';
  };

  return (
    <Paper sx={{ mb: 4 }}>
      <List>
        {accounts.map((account, index) => (
          <React.Fragment key={account.id}>
            {index > 0 && <Divider variant="inset" component="li" />}
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getDecayStatusColor(account.decay_days_remaining) }}>
                  {account.decay_days_remaining <= 3 ? <WarningIcon /> : <GamepadIcon />}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Typography variant="subtitle1" component="span">
                    {account.game_name}
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'grey.500' }}>
                      #{account.tag_line}
                    </Typography>
                  </Typography>
                }
                secondary={
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item>
                      <Chip 
                        size="small" 
                        label={`Region: ${account.region}`} 
                        variant="outlined" 
                      />
                    </Grid>
                    <Grid item>
                      <Chip 
                        size="small" 
                        label={`Updated: ${format(new Date(account.last_updated), 'MMM d, yyyy')}`}
                        variant="outlined" 
                      />
                    </Grid>
                    <Grid item>
                      <Chip 
                        size="small" 
                        color={getDecayStatusColor(account.decay_days_remaining)}
                        label={`${account.decay_days_remaining} days until decay`}
                      />
                    </Grid>
                  </Grid>
                }
              />
              
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete" onClick={() => onDelete(account.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default AccountList;
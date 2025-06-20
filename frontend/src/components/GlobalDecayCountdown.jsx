import React from 'react';
import { Paper, Typography, Box, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const CountdownContainer = styled(Paper)(({ theme, urgency }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  backgroundColor: urgency === 'high' 
    ? 'rgba(211, 47, 47, 0.15)' 
    : urgency === 'medium' 
      ? 'rgba(237, 108, 2, 0.15)' 
      : 'rgba(46, 125, 50, 0.15)',
  borderLeft: `6px solid ${
    urgency === 'high' 
      ? theme.palette.error.main 
      : urgency === 'medium' 
        ? theme.palette.warning.main 
        : theme.palette.success.main
  }`,
}));

const GlobalDecayCountdown = ({ daysRemaining, accountName }) => {
  let urgency = 'low';
  if (daysRemaining <= 3) urgency = 'high';
  else if (daysRemaining <= 7) urgency = 'medium';
  
  const progressValue = (daysRemaining / 30) * 100;
  
  return (
    <CountdownContainer elevation={3} urgency={urgency}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {urgency === 'high' && (
          <WarningAmberIcon color="error" sx={{ mr: 1 }} />
        )}
        
        <Typography variant="h5" component="h2" color={urgency === 'high' ? 'error' : 'textPrimary'}>
          {urgency === 'high' 
            ? 'Urgent: Ranked Decay Imminent!'
            : 'Next Ranked Decay Countdown'}
        </Typography>
      </Box>
      
      <Typography variant="body1" gutterBottom>
        {accountName} has <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong> until ranked decay begins.
        {urgency === 'high' && ' Play a game soon to prevent LP loss!'}
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption">Decay Imminent</Typography>
          <Typography variant="caption">Safe</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressValue} 
          color={
            urgency === 'high' 
              ? 'error' 
              : urgency === 'medium' 
                ? 'warning' 
                : 'success'
          }
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
    </CountdownContainer>
  );
};

export default GlobalDecayCountdown;
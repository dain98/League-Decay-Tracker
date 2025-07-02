import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

const regions = [
  { value: 'NA1', label: 'North America (NA1)' },
  { value: 'EUW1', label: 'Europe West (EUW1)' },
  { value: 'KR', label: 'Korea (KR)' },
  // { value: 'EUN1', label: 'Europe Nordic & East (EUN1)' },
  // { value: 'BR1', label: 'Brazil (BR1)' },
  // { value: 'LA1', label: 'Latin America North (LA1)' },
  // { value: 'LA2', label: 'Latin America South (LA2)' },
  // { value: 'OC1', label: 'Oceania (OC1)' },
  // { value: 'TR1', label: 'Turkey (TR1)' },
  // { value: 'RU', label: 'Russia (RU)' },
  // { value: 'JP1', label: 'Japan (JP1)' },
  // { value: 'PH2', label: 'Philippines (PH2)' },
  // { value: 'SG2', label: 'Singapore (SG2)' },
  // { value: 'TH2', label: 'Thailand (TH2)' },
  // { value: 'TW2', label: 'Taiwan (TW2)' },
  // { value: 'VN2', label: 'Vietnam (VN2)' },
];

const AddAccountDialog = ({ open, onClose, onAdd, isLoading }) => {
  const [formData, setFormData] = useState({
    gameName: '',
    tagLine: '',
    region: 'NA1',
    remainingDecayDays: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Game name validation
    if (!formData.gameName.trim()) {
      newErrors.gameName = 'Game name is required';
    } else if (formData.gameName.length < 3) {
      newErrors.gameName = 'Game name must be at least 3 characters';
    } else if (formData.gameName.length > 16) {
      newErrors.gameName = 'Game name must be 16 characters or less';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(formData.gameName)) {
      newErrors.gameName = 'Game name can only contain letters, numbers, and spaces';
    }
    
    // Tag line validation
    if (!formData.tagLine.trim()) {
      newErrors.tagLine = 'Tag line is required';
    } else if (formData.tagLine.length < 3) {
      newErrors.tagLine = 'Tag line must be at least 3 characters';
    } else if (formData.tagLine.length > 5) {
      newErrors.tagLine = 'Tag line must be 5 characters or less';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.tagLine)) {
      newErrors.tagLine = 'Tag line can only contain letters and numbers';
    }
    
    // Remaining Decay Days validation
    const decay = Number(formData.remainingDecayDays);
    if (isNaN(decay) || decay < -1 || decay > 28) {
      newErrors.remainingDecayDays = 'Enter a number between -1 (immune) and 28';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the account data in the format expected by the backend
      const accountData = {
        gameName: formData.gameName.trim(),
        tagLine: formData.tagLine.trim(),
        region: formData.region,
        riotId: `${formData.gameName.trim()}#${formData.tagLine.trim()}`,
        remainingDecayDays: Number(formData.remainingDecayDays)
      };

      await onAdd(accountData);
      
      // Reset form
      setFormData({
        gameName: '',
        tagLine: '',
        region: 'NA1',
        remainingDecayDays: ''
      });
      setErrors({});
      
    } catch (error) {
      console.error('Error adding account:', error);
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        gameName: '',
        tagLine: '',
        region: 'NA1',
        remainingDecayDays: ''
      });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isSubmitting}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Add League Account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your League of Legends account details to start tracking decay
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
      <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Game Name"
              value={formData.gameName}
              onChange={handleInputChange('gameName')}
              error={!!errors.gameName}
              helperText={errors.gameName || 'Your in-game name (3-16 characters)'}
              disabled={isSubmitting}
              fullWidth
              required
            />
            
            <TextField
              label="Tag Line"
              value={formData.tagLine}
              onChange={handleInputChange('tagLine')}
              error={!!errors.tagLine}
              helperText={errors.tagLine || 'Your tag line (3-5 characters)'}
              disabled={isSubmitting}
              fullWidth
              required
            />
            
            <FormControl fullWidth disabled={isSubmitting}>
              <InputLabel>Region</InputLabel>
              <Select
                value={formData.region}
                onChange={handleInputChange('region')}
                label="Region"
              >
                {regions.map((region) => (
                  <MenuItem key={region.value} value={region.value}>
                    {region.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          
            <TextField
              label="Remaining Decay Days"
              type="number"
              value={formData.remainingDecayDays}
              onChange={handleInputChange('remainingDecayDays')}
              error={!!errors.remainingDecayDays}
              helperText={errors.remainingDecayDays || 'Enter a number between -1 (immune) and 28'}
              disabled={isSubmitting}
              fullWidth
              required
              inputProps={{ min: -1, max: 28 }}
            />
            
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Note:</strong> The system will automatically fetch your current rank and decay status from Riot Games API.
              </Typography>
            </Alert>
          </Box>
      </DialogContent>
      
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={isSubmitting}
            variant="outlined"
          >
            Cancel
          </Button>
        <Button 
            type="submit" 
          variant="contained" 
            disabled={isSubmitting || isLoading}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
            {isSubmitting ? 'Adding Account...' : 'Add Account'}
        </Button>
      </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddAccountDialog;

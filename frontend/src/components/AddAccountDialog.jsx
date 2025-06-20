import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Grid
} from '@mui/material';

const regions = [
  { value: 'NA', label: 'North America' },
  { value: 'EUW', label: 'Europe West' },
  { value: 'EUN', label: 'Europe Nordic & East' },
  { value: 'KR', label: 'Korea' },
  { value: 'BR', label: 'Brazil' },
  { value: 'JP', label: 'Japan' },
  { value: 'RU', label: 'Russia' },
  { value: 'OCE', label: 'Oceania' },
  { value: 'TR', label: 'Turkey' },
  { value: 'LAS', label: 'Latin America South' },
  { value: 'LAN', label: 'Latin America North' },
];

const AddAccountDialog = ({ open, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    game_name: '',
    tag_line: '',
    region: '',
    decay_days_remaining: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.game_name.trim()) {
      newErrors.game_name = 'Game name is required';
    }
    
    if (!formData.tag_line.trim()) {
      newErrors.tag_line = 'Tag line is required';
    }
    
    if (!formData.region) {
      newErrors.region = 'Region is required';
    }
    
    const decayDays = parseInt(formData.decay_days_remaining);
    if (isNaN(decayDays) || decayDays < 1 || decayDays > 30) {
      newErrors.decay_days_remaining = 'Enter a valid number between 1-30';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onAdd({
        ...formData,
        decay_days_remaining: parseInt(formData.decay_days_remaining),
        riot_id: `${formData.game_name}#${formData.tag_line}`
      });
      
      // Reset form
      setFormData({
        game_name: '',
        tag_line: '',
        region: '',
        decay_days_remaining: '',
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Account</DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={7}>
            <TextField
              fullWidth
              label="Game Name"
              name="game_name"
              value={formData.game_name}
              onChange={handleChange}
              error={!!errors.game_name}
              helperText={errors.game_name}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Tag Line"
              name="tag_line"
              value={formData.tag_line}
              onChange={handleChange}
              error={!!errors.tag_line}
              helperText={errors.tag_line}
              margin="normal"
              placeholder="NA1"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errors.region}>
              <InputLabel>Region</InputLabel>
              <Select
                name="region"
                value={formData.region}
                onChange={handleChange}
                label="Region"
              >
                {regions.map(region => (
                  <MenuItem key={region.value} value={region.value}>
                    {region.label} ({region.value})
                  </MenuItem>
                ))}
              </Select>
              {errors.region && <FormHelperText>{errors.region}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Days Until Decay"
              name="decay_days_remaining"
              type="number"
              value={formData.decay_days_remaining}
              onChange={handleChange}
              error={!!errors.decay_days_remaining}
              helperText={errors.decay_days_remaining || "Enter days until ranked decay"}
              margin="normal"
              InputProps={{ inputProps: { min: 1, max: 30 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
        >
          Add Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAccountDialog;
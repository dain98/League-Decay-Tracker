import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  AppBar,
  Toolbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/material/styles';
import { useAuth0 } from '@auth0/auth0-react';
import { userAPI, handleAPIError } from '../services/api.js';
import { useUserProfile } from '../context/UserProfileContext.jsx';

// Styled components
const ProfileContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(10),
  marginBottom: theme.spacing(4),
}));

const ProfileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'rgba(10, 50, 60, 0.8)',
}));

const InfoSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const InfoContent = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const Profile = ({ onClose }) => {
  const { user, logout } = useAuth0();
  const { profile, updateProfile, loading: profileLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [localProfile, setLocalProfile] = useState(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditClick = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const updateData = {};
      updateData[editingField] = editValue;
      const response = await updateProfile(updateData);
      console.log('Profile update response:', response);
      if (response.success && response.data) {
        setLocalProfile(response.data);
      }
      setSnackbar({
        open: true,
        message: `${getFieldLabel(editingField)} updated successfully!`,
        severity: 'success'
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setSnackbar({
        open: true,
        message: `Failed to update ${getFieldLabel(editingField)}: ${handleAPIError(error)}`,
        severity: 'error'
      });
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingField(null);
    setEditValue('');
  };

  const getFieldLabel = (field) => {
    switch (field) {
      case 'name': return 'Name';
      case 'email': return 'Email Address';
      case 'picture': return 'Profile Picture';
      default: return field;
    }
  };

  const getFieldType = (field) => {
    switch (field) {
      case 'email': return 'email';
      case 'picture': return 'url';
      default: return 'text';
    }
  };

  const getFieldPlaceholder = (field) => {
    switch (field) {
      case 'name': return 'Enter your name';
      case 'email': return 'Enter your email address';
      case 'picture': return 'Enter profile picture URL';
      default: return `Enter your ${field}`;
    }
  };

  const validateField = (field, value) => {
    if (!value.trim()) return `${getFieldLabel(field)} cannot be empty`;
    
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Please enter a valid email address';
    }
    
    if (field === 'picture') {
      try {
        new URL(value);
      } catch {
        return 'Please enter a valid URL';
      }
    }
    
    return null;
  };

  const handleEditSaveWithValidation = () => {
    const error = validateField(editingField, editValue);
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
      return;
    }
    handleEditSave();
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Profile Settings
          </Typography>
        </Toolbar>
      </AppBar>
      
      <ProfileContainer maxWidth="md">
        <ProfileCard elevation={3}>
          <Typography variant="h4" gutterBottom>
            Profile Settings
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab 
                icon={<PersonIcon />} 
                label="General" 
                iconPosition="start"
              />
              <Tab 
                icon={<SettingsIcon />} 
                label="Settings" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            
            {/* Profile Picture */}
            <InfoSection>
              <InfoContent>
                <Avatar
                  src={localProfile?.picture || editValue}
                  alt={localProfile?.name || 'User'}
                  sx={{ width: 64, height: 64 }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Profile Picture
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {localProfile?.picture ? 'Custom profile picture' : 'No profile picture set'}
                  </Typography>
                </Box>
              </InfoContent>
              <IconButton 
                onClick={() => handleEditClick('picture', localProfile?.picture)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
            </InfoSection>

            {/* Name */}
            <InfoSection>
              <InfoContent>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Name
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {localProfile?.name || 'No name set'}
                  </Typography>
                </Box>
              </InfoContent>
              <IconButton 
                onClick={() => handleEditClick('name', localProfile?.name)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
            </InfoSection>

            {/* Email */}
            <InfoSection>
              <InfoContent>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Email Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {localProfile?.email || 'No email set'}
                  </Typography>
                </Box>
              </InfoContent>
              <IconButton 
                onClick={() => handleEditClick('email', localProfile?.email)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
            </InfoSection>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Account Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Settings page coming soon...
            </Typography>
          </TabPanel>
        </ProfileCard>
      </ProfileContainer>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit {getFieldLabel(editingField)}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={getFieldLabel(editingField)}
            type={getFieldType(editingField)}
            fullWidth
            variant="outlined"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={getFieldPlaceholder(editingField)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>
            Cancel
          </Button>
          <Button onClick={handleEditSaveWithValidation} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};

export default Profile; 

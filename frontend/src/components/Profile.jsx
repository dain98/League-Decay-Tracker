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
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { useAuth0 } from '@auth0/auth0-react';
import { userAPI, handleAPIError } from '../services/api.js';
import { useUserProfile } from '../context/UserProfileContext.jsx';
import { useTheme } from '@mui/material/styles';

// Styled components
const ProfileContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(10),
  marginBottom: theme.spacing(4),
}));

const ProfileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const InfoSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const theme = useTheme();

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
      // Robust email regex
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

  // Delete account logic
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Call backend to delete account
      await userAPI.deleteMe();
      setSnackbar({
        open: true,
        message: 'Account deleted successfully. Logging out...',
        severity: 'success'
      });
      setTimeout(() => {
        logout({ logoutParams: { returnTo: window.location.origin + '/login' } });
      }, 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to delete account: ${handleAPIError(error)}`,
        severity: 'error'
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
            Profile Settings
          </Typography>
        </Toolbar>
      </AppBar>
      
      <ProfileContainer maxWidth="md">
        <ProfileCard elevation={3}>
          <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary }}>
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
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
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
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                    Profile Picture
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
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
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                    Name
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
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
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                    Email Address
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
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

            {/* Delete Account Button */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                sx={{ fontWeight: 'bold', letterSpacing: 1, fontSize: 16, p: 2, textTransform: 'uppercase' }}
                onClick={() => setDeleteDialogOpen(true)}
              >
                DELETE ACCOUNT
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Account Settings
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main', mb: 2 }}>
            THIS ACTION CANNOT BE UNDONE.
          </Typography>
          <Typography variant="body2">
            Are you sure you want to <b>permanently delete</b> your account and all associated data? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'DELETE ACCOUNT'}
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

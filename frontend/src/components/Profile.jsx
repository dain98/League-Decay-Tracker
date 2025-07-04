import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar
} from '@mui/material';
import { Save, Cancel, Edit } from '@mui/icons-material';
import { useUserProfile } from '../context/UserProfileContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import UserMenu from './UserMenu';

const Profile = ({ onClose }) => {
  const { profile, updateProfile, loading, error } = useUserProfile();
  const { user, logout } = useFirebaseAuth();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    picture: profile?.picture || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  

  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Check if user has a password (not OAuth-only)
  const hasPassword = user?.providerData?.some(provider => 
    provider.providerId === 'password'
  ) || false;



  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };





  const handlePasswordChange = (field) => (event) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setPasswordError('');
    setPasswordSuccess('');
  };





  const handleImageClick = () => {
    setShowImageDialog(true);
  };

  const handleImageSave = () => {
    setShowImageDialog(false);
  };

  const handleImageCancel = () => {
    setFormData(prev => ({
      ...prev,
      picture: profile?.picture || ''
    }));
    setShowImageDialog(false);
  };



  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setIsPasswordSubmitting(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      // If user has a password, require re-authentication
      if (hasPassword) {
        if (!passwordData.currentPassword) {
          setPasswordError('Current password is required');
          setIsPasswordSubmitting(false);
          return;
        }
        
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
    } catch (error) {
      console.error('Error updating password:', error);
      let errorMessage = 'Failed to update password';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'For security reasons, please log out and log back in before changing your password';
          break;
        default:
          errorMessage = error.message;
      }
      
      setPasswordError(errorMessage);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateProfile(formData);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      picture: profile?.picture || ''
    });
    onClose();
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    // Already on profile page, do nothing
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={onClose}
          >
            LoL Decay Tracker
          </Typography>
          
          <UserMenu 
            user={profile}
            onLogout={handleLogout}
            onProfileClick={handleProfileClick}
          />
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Profile Settings
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box sx={{ position: 'relative', mr: 3 }}>
              <Avatar
                src={formData.picture || profile?.picture || user?.photoURL}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  cursor: 'pointer',
                  border: '3px solid #e0e0e0'
                }}
                onClick={handleImageClick}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }}
                size="small"
                onClick={handleImageClick}
              >
                <Edit />
              </IconButton>
            </Box>
            
            <Box>
              <Typography variant="h6">
                {profile?.name || user?.displayName || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile?.email || user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email {profile?.emailVerified || user?.emailVerified ? '✓ Verified' : '✗ Not Verified'}
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Display Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              margin="normal"
              required
            />

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Box>
          </form>

          <Divider sx={{ my: 4 }} />

          {/* Password Change Section */}
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}

          <form onSubmit={handlePasswordUpdate}>
            {hasPassword && (
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange('currentPassword')}
                margin="normal"
                required
                helperText="Required to verify your identity"
              />
            )}
            
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange('newPassword')}
              margin="normal"
              required
              helperText="Password must be at least 6 characters long"
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
              margin="normal"
              required
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isPasswordSubmitting || (hasPassword && !passwordData.currentPassword) || !passwordData.newPassword || !passwordData.confirmPassword}
                startIcon={isPasswordSubmitting ? <CircularProgress size={20} /> : <Save />}
              >
                {isPasswordSubmitting ? 'Updating...' : hasPassword ? 'Update Password' : 'Set Password'}
              </Button>
            </Box>
          </form>
        </Paper>

        {/* Image URL Dialog */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: showImageDialog ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300
          }}
          onClick={() => setShowImageDialog(false)}
        >
          <Paper
            sx={{ p: 3, maxWidth: 400, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" gutterBottom>
              Update Profile Picture
            </Typography>
            
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                src={formData.picture || profile?.picture || user?.photoURL}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Image URL"
              value={formData.picture}
              onChange={handleInputChange('picture')}
              placeholder="https://example.com/avatar.jpg"
              helperText="Enter a URL to your profile picture"
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={handleImageCancel}>
                Cancel
              </Button>
              <Button onClick={handleImageSave} variant="contained">
                Save
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default Profile; 

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
  DialogActions
} from '@mui/material';
import { Save, Cancel, Edit } from '@mui/icons-material';
import { useUserProfile } from '../context/UserProfileContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const Profile = ({ onClose }) => {
  const { profile, updateProfile, loading, error } = useUserProfile();
  const { user } = useFirebaseAuth();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    picture: profile?.picture || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  
  // Email change state
  const [emailData, setEmailData] = useState({
    newEmail: ''
  });
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
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

  const handleEmailChange = (field) => (event) => {
    setEmailData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setEmailError('');
    setEmailSuccess('');
  };



  const handlePasswordChange = (field) => (event) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsEmailSubmitting(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      // Check if user is OAuth-only (no password)
      const isOAuthOnly = !hasPassword;
      
      if (isOAuthOnly) {
        // For OAuth users, we can't change email through Firebase
        // Instead, we'll update the backend profile and inform the user
        await updateProfile({ email: emailData.newEmail });
        
        setEmailSuccess('Email updated in your profile! Note: For OAuth accounts, the email change is only reflected in this app. Your Google/Twitter account email remains unchanged.');
        setEmailData({ newEmail: '' });
      } else {
        // For email/password users, try Firebase email change
        await updateEmail(user, emailData.newEmail);
        await updateProfile({ email: emailData.newEmail });
        
        setEmailSuccess('Email updated successfully! Please check your inbox for a verification email.');
        setEmailData({ newEmail: '' });
      }
      
    } catch (error) {
      console.error('Error updating email:', error);
      let errorMessage = 'Failed to update email';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use by another account';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email change not allowed for OAuth accounts. The email will be updated in your profile only.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'For security reasons, please log out and log back in before changing your email.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setEmailError(errorMessage);
    } finally {
      setIsEmailSubmitting(false);
    }
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

  return (
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

        {/* Email Change Section */}
        <Typography variant="h6" gutterBottom>
          Change Email Address
        </Typography>
        
        {emailError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {emailError}
          </Alert>
        )}
        
        {emailSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {emailSuccess}
          </Alert>
        )}

        <form onSubmit={handleEmailUpdate}>
          <TextField
            fullWidth
            label="New Email Address"
            type="email"
            value={emailData.newEmail}
            onChange={handleEmailChange('newEmail')}
            margin="normal"
            required
            helperText="A verification email will be sent to the new address"
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isEmailSubmitting || !emailData.newEmail}
              startIcon={isEmailSubmitting ? <CircularProgress size={20} /> : <Save />}
            >
              {isEmailSubmitting ? 'Sending...' : 'Send Verification Email'}
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
  );
};

export default Profile; 

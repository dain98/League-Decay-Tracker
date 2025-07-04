import React, { useState } from 'react';
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
  IconButton
} from '@mui/material';
import { Save, Cancel, Edit } from '@mui/icons-material';
import { useUserProfile } from '../context/UserProfileContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';

const Profile = ({ onClose }) => {
  const { profile, updateProfile, loading, error } = useUserProfile();
  const { user } = useFirebaseAuth();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    nickname: profile?.nickname || '',
    picture: profile?.picture || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
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
      nickname: profile?.nickname || '',
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
          
          <TextField
            fullWidth
            label="Nickname (Optional)"
            value={formData.nickname}
            onChange={handleInputChange('nickname')}
            margin="normal"
            helperText="A shorter name or alias"
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

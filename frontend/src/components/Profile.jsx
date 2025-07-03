import React, { useState, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { PhotoCamera, Save, Cancel, Edit } from '@mui/icons-material';
import { useUserProfile } from '../context/UserProfileContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const Profile = ({ onClose }) => {
  const { profile, updateProfile, loading, error } = useUserProfile();
  const { user } = useFirebaseAuth();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    nickname: profile?.nickname || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const fileInputRef = useRef();

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleImageClick = () => {
    setShowImageDialog(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!fileInputRef.current?.files[0] || !user) return;

    const file = fileInputRef.current.files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `avatars/${user.uid}_${Date.now()}.${fileExtension}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, fileName);
      
      // Simulate upload progress (Firebase doesn't provide progress for uploadBytes)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await uploadBytes(storageRef, file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update profile with new avatar URL
      await updateProfile({ picture: downloadURL });
      
      setShowImageDialog(false);
      setPreviewImage(null);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
      nickname: profile?.nickname || ''
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
              src={profile?.picture || user?.photoURL}
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

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onClose={() => setShowImageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {previewImage ? (
              <Avatar
                src={previewImage}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              />
            ) : (
              <Avatar
                src={profile?.picture || user?.photoURL}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              />
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 2 }}
            >
              Choose Image
            </Button>
            
            {isUploading && (
              <Box sx={{ mt: 2 }}>
                <CircularProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Uploading... {uploadProgress}%
                </Typography>
              </Box>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Supported formats: JPG, PNG, GIF (max 5MB)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImageDialog(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleImageUpload}
            variant="contained"
            disabled={!previewImage || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 

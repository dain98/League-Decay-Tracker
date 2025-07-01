import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import { styled } from '@mui/material/styles';

const UserMenuButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  transition: 'background-color 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const UserMenu = ({ user, onLogout, onProfileClick, onThemeToggle, isDarkTheme }) => {
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const handleUserMenuClick = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    onProfileClick();
  };

  const handleThemeToggle = () => {
    handleUserMenuClose();
    onThemeToggle();
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  return (
    <>
      <UserMenuButton onClick={handleUserMenuClick}>
        {user?.picture ? (
          <Avatar 
            src={user.picture} 
            alt={user?.name || user?.email || 'User'}
            sx={{ mr: 1, width: 32, height: 32 }}
          />
        ) : (
          <AccountCircleIcon sx={{ mr: 1 }} />
        )}
        <Typography variant="body1" sx={{ mr: 1 }}>
          {user?.name || user?.email || 'Summoner'}
        </Typography>
        <KeyboardArrowDownIcon />
      </UserMenuButton>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            backgroundColor: 'rgba(10, 50, 60, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {isDarkTheme ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{isDarkTheme ? 'Light Theme' : 'Dark Theme'}</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu; 

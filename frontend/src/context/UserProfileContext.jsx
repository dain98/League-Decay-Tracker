import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userAPI, handleAPIError } from '../services/api';
import { useAuth0 } from '@auth0/auth0-react';

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError('Failed to load user profile');
      }
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, fetchProfile]);

  // Update profile in context after edit
  const updateProfile = async (updateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.updateProfile(updateData);
      if (response.success && response.data) {
        setProfile(response.data);
        return { success: true, data: response.data };
      } else {
        setError('Failed to update user profile');
        return { success: false, error: 'Failed to update user profile' };
      }
    } catch (err) {
      const errMsg = handleAPIError(err);
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserProfileContext.Provider value={{ profile, loading, error, refresh: fetchProfile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext); 

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { createAuthenticatedApiClient } from '../services/authApi';

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, getIdToken } = useFirebaseAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create authenticated API client with memoized token getter
  const apiClient = useMemo(() => {
    if (!isAuthenticated) return null;
    
    const getToken = async () => {
      try {
        const token = await getIdToken();
        return token;
      } catch (error) {
        console.error('Error getting token:', error);
        throw error;
      }
    };
    
    return createAuthenticatedApiClient(getToken);
  }, [isAuthenticated, getIdToken]);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !apiClient) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Call backend API to get/create user profile
      const response = await apiClient.get('/users/me');
      
      if (response.data.success) {
        setProfile(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load user profile');
      }
    } catch (err) {
      // Handle specific error types
      if (err.response?.data?.error === 'DUPLICATE_EMAIL') {
        setError('DUPLICATE_EMAIL');
      } else {
        setError(err.response?.data?.message || 'Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, apiClient]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, fetchProfile]);

  // Update profile in context after edit
  const updateProfile = async (updateData) => {
    if (!apiClient) {
      return { success: false, error: 'Not authenticated' };
    }
    
    setLoading(true);
    setError(null);
    try {
      // Call backend API to update profile
      const response = await apiClient.put('/users/me', updateData);
      
      if (response.data.success) {
        // Update local profile with response data
        const updatedProfile = { ...profile, ...response.data.data };
        setProfile(updatedProfile);
        return { success: true, data: updatedProfile };
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update user profile';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserProfileContext.Provider value={{ profile, loading, error, refresh: fetchProfile, updateProfile, apiClient }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext); 

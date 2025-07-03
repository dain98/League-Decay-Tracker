import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createAuthenticatedApiClient } from '../services/authApi';

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently } = useAuth0();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create authenticated API client with memoized token getter
  const apiClient = useMemo(() => {
    if (!isAuthenticated) return null;
    
    const getToken = async () => {
      try {
        return await getAccessTokenSilently({ cacheMode: 'on' });
      } catch (error) {
        console.error('Error getting token:', error);
        throw error;
      }
    };
    
    return createAuthenticatedApiClient(getToken);
  }, [isAuthenticated, getAccessTokenSilently]);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !apiClient) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/users/me');
      if (response.data.success && response.data.data) {
        setProfile(response.data.data);
      } else {
        setError('Failed to load user profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user profile');
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
      const response = await apiClient.put('/users/me', updateData);
      if (response.data.success && response.data.data) {
        setProfile(response.data.data);
        return { success: true, data: response.data.data };
      } else {
        setError('Failed to update user profile');
        return { success: false, error: 'Failed to update user profile' };
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

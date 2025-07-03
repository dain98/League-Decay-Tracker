import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { createAuthenticatedApiClient } from '../services/authApi';

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, getIdToken, user: firebaseUser } = useFirebaseAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create authenticated API client with memoized token getter
  const apiClient = useMemo(() => {
    if (!isAuthenticated) return null;
    
    const getToken = async () => {
      try {
        return await getIdToken();
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
      // Create user profile from Firebase user data
      const userProfile = {
        id: firebaseUser.uid,
        auth0Id: firebaseUser.uid, // Keep for backend compatibility
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email,
        picture: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        nickname: firebaseUser.displayName,
        createdAt: new Date(firebaseUser.metadata.creationTime),
        updatedAt: new Date(firebaseUser.metadata.lastSignInTime)
      };
      
      setProfile(userProfile);
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
  }, [isAuthenticated, apiClient, firebaseUser]);

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
      // For now, just update the local profile
      // In a real app, you might want to update Firebase user profile too
      const updatedProfile = { ...profile, ...updateData };
      setProfile(updatedProfile);
      return { success: true, data: updatedProfile };
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

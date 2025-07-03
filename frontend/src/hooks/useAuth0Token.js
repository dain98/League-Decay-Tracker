import { useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * Custom hook for efficient Auth0 token management
 * This hook provides a cached token that's only refreshed when necessary
 */
export const useAuth0Token = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // Memoized token getter that uses Auth0's built-in caching
  const getToken = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Use Auth0's built-in caching - it will only make API calls when necessary
      const token = await getAccessTokenSilently({ 
        cacheMode: 'on' // Enable caching to reduce API calls
      });
      return token;
    } catch (error) {
      console.error('Error getting Auth0 token:', error);
      throw error;
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  return { getToken, isAuthenticated };
}; 

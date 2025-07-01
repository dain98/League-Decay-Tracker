import { useEffect, useState } from 'react';
import { getLatestVersion, clearVersionCache } from '../services/ddragon.js';

export const useDataDragon = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    const initializeDataDragon = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the latest version
        const latestVersion = await getLatestVersion();
        setVersion(latestVersion);
        
        console.log('Data Dragon initialized with version:', latestVersion);
      } catch (err) {
        console.error('Failed to initialize Data Dragon:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDataDragon();
  }, []);

  const refreshVersion = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear cache and fetch fresh version
      clearVersionCache();
      const latestVersion = await getLatestVersion();
      setVersion(latestVersion);
      
      console.log('Data Dragon version refreshed:', latestVersion);
    } catch (err) {
      console.error('Failed to refresh Data Dragon version:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    version,
    isLoading,
    error,
    refreshVersion
  };
}; 

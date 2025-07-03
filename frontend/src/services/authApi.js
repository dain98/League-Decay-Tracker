import axios from 'axios';

// API base URL - loaded from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Creates an authenticated API client that automatically handles Auth0 tokens
 * @param {Function} getToken - Function to get the current Auth0 token
 * @returns {Object} Axios instance with authentication
 */
export const createAuthenticatedApiClient = (getToken) => {
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        if (getToken) {
          const token = await getToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
        // Don't block the request, let it proceed without token
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// Health check (no auth required)
export const checkHealth = async () => {
  const response = await axios.get(`${API_BASE_URL}/health`);
  return response.data;
}; 

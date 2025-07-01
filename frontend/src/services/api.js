import axios from 'axios';

// API base URL - loaded from environment variables
// For local development: 'http://localhost:3001/api'
// For production: 'https://ldbackend.dain.cafe/api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from Auth0
    const token = localStorage.getItem('auth0_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('auth0_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth0 token management
export const setAuthToken = (token) => {
  localStorage.setItem('auth0_token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('auth0_token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth0_token');
};

// Health check
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

// User API
export const userAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/me', profileData);
    return response.data;
  },

  // Get user's league accounts
  getAccounts: async () => {
    const response = await apiClient.get('/users/me/accounts');
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    const response = await apiClient.get('/users/me/stats');
    return response.data;
  },

  // Delete user account
  deleteMe: async () => {
    const response = await apiClient.delete('/users/me');
    return response.data;
  },
};

// League Accounts API
export const accountsAPI = {
  // Get all league accounts
  getAll: async () => {
    const response = await apiClient.get('/accounts');
    return response.data;
  },

  // Get specific league account
  getById: async (accountId) => {
    const response = await apiClient.get(`/accounts/${accountId}`);
    return response.data;
  },

  // Add new league account
  add: async (accountData) => {
    const response = await apiClient.post('/accounts', accountData);
    return response.data;
  },

  // Update league account
  update: async (accountId, updateData) => {
    const response = await apiClient.put(`/accounts/${accountId}`, updateData);
    return response.data;
  },

  // Delete league account
  delete: async (accountId) => {
    const response = await apiClient.delete(`/accounts/${accountId}`);
    return response.data;
  },

  // Refresh account data from Riot API
  refresh: async (accountId) => {
    const response = await apiClient.post(`/accounts/${accountId}/refresh`);
    return response.data;
  },
};

// Error handling helper
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return `Bad Request: ${data.message || 'Invalid data provided'}`;
      case 401:
        return 'Unauthorized: Please log in again';
      case 403:
        return 'Forbidden: You don\'t have permission to perform this action';
      case 404:
        return 'Not Found: The requested resource was not found';
      case 409:
        return `Conflict: ${data.message || 'Resource already exists'}`;
      case 429:
        return 'Too Many Requests: Please wait before trying again';
      case 500:
        return 'Server Error: Something went wrong on our end';
      default:
        return `Error ${status}: ${data.message || 'An unexpected error occurred'}`;
    }
  } else if (error.request) {
    // Network error
    return 'Network Error: Unable to connect to the server';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

export default apiClient;

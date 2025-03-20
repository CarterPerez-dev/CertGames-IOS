// src/api/apiClient.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Depending on your environment:
const apiClient = axios.create({
  baseURL: 'https://certgames.com/api', // Or your local dev URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Request interceptor to include userId in "X-User-Id"
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      
      if (userId) {
        // This is the fallback header your Flask code checks
        config.headers['X-User-Id'] = userId;
      }

      // If you do not need or want cookies from server:
      config.withCredentials = false;

      // If you wanted session cookies, you'd do:
      // config.withCredentials = true;
      // ...and handle CORS settings for your domain

      return config;
    } catch (error) {
      console.error('API interceptor error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling, optional
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Example: handle 401
    if (error.response && error.response.status === 401) {
      // Possibly clear secure store?
      // await SecureStore.deleteItemAsync('userId');
      // or navigate to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;


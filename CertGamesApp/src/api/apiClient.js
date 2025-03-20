// src/api/apiClient.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Create an axios instance
const apiClient = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to include auth info and cookies
// CertGamesApp/src/api/apiClient.js - modify the request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      
      if (userId) {
        // Only add userId for endpoints that don't already have it in the URL
        // Test finish endpoint already has userId in the URL, so don't add it to data
        if (config.method === 'post' && !config.url.includes(`/attempts/${userId}/`)) {
          if (!config.data) {
            config.data = {};
          }
          
          // Only add userId if it's not already in the data
          if (typeof config.data === 'object' && !config.data.userId) {
            config.data.userId = userId;
          }
        }
        
        // Handle cookie-based auth for your backend
        config.withCredentials = true;
        
        // Some APIs might need userId in headers
        config.headers.userId = userId;
      }
      
      return config;
    } catch (error) {
      console.error('API interceptor error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear stored credentials
      await SecureStore.deleteItemAsync('userId');
      
      // You could dispatch a logout action here if needed
      // Or redirect to login screen
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

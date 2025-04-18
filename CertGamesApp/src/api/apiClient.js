// src/api/apiClient.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { setOfflineStatus, setServerError } from '../store/slices/networkSlice';


const apiClient = axios.create({
  baseURL: 'https://certgames.com/api', 
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
      // Check network state first
      const netInfoState = await NetInfo.fetch();
      
      // Only reject if BOTH conditions are false (completely offline)
      if (!netInfoState.isConnected && !netInfoState.isInternetReachable) {
        // Dispatch offline status to Redux if available
        if (global.store) {
          global.store.dispatch(setOfflineStatus(true));
        }
        
        // Return a rejected promise with meaningful offline error
        return Promise.reject({
          response: {
            status: 0,
            data: { error: 'Network unavailable. Please check your connection.' }
          },
          isOffline: true // Custom flag to identify offline errors
        });
      } else if (global.store) {
        // Set online status in Redux
        global.store.dispatch(setOfflineStatus(false));
      }
      
      // Get userId from SecureStore
      let userId;
      try {
        userId = await SecureStore.getItemAsync('userId');
      } catch (secureStoreError) {
        console.error('SecureStore error:', secureStoreError);
      }
      
      if (userId) {
        // This is the fallback header my Flask code checks
        config.headers['X-User-Id'] = userId;
      }

      // nah
      config.withCredentials = false;

      return config;
    } catch (error) {
      console.error('API interceptor error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Already identified as offline in request interceptor
    if (error.isOffline) {
      return Promise.reject(error);
    }
    
    // Network error (no response received)
    if (!error.response) {
      console.error('Network error - no response:', error);
      
      if (global.store) {
        global.store.dispatch(setServerError(true));
      }
      
      return Promise.reject({
        response: {
          status: 0,
          data: { error: 'Network error. Please check your connection or try again later.' }
        }
      });
    }
    
    // Handle specific status codes
    if (error.response.status === 401) {
      // Possibly clear secure store?
      // await SecureStore.deleteItemAsync('userId');
      // or navigate to login
    }
    
    // Server errors
    if (error.response.status >= 500) {
      console.error('Server error:', error.response.status);
      
      if (global.store) {
        global.store.dispatch(setServerError(true));
      }
      
      return Promise.reject({
        response: {
          status: error.response.status,
          data: { error: 'Server error. Please try again later.' }
        }
      });
    }
    
    // If the request times out
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
      return Promise.reject({
        response: {
          status: 408,
          data: { error: 'Request timed out. Please try again.' }
        }
      });
    }
    
    return Promise.reject(error);
  }
);

// Make Redux store available to the interceptors
export const injectStore = (store) => {
  global.store = store;
};

export default apiClient;

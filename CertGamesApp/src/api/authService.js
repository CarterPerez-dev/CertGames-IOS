// src/api/authService.js
import apiClient from './apiClient';
import { API } from './apiConfig';
import * as SecureStore from 'expo-secure-store';
import { fetchWithRetry } from '../utils/networkUtils';

export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post(API.AUTH.LOGIN, credentials);
    
    if (response.data && response.data.user_id) {
      // Store user ID securely
      await SecureStore.setItemAsync('userId', response.data.user_id);
    }
    
    return response.data;
  } catch (error) {
    // Check if this is an authentication error (401)
    if (error.response && error.response.status === 401) {
      // Return a structured error object instead of throwing
      return { 
        success: false, 
        error: error.response?.data?.error || 'Invalid username or password'
      };
    }
    
    // For network errors or unexpected server errors, still throw
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post(API.AUTH.REGISTER, userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchUserData = async (userId) => {
  return fetchWithRetry(async () => {
    try {
      const response = await apiClient.get(API.USER.DETAILS(userId));
      return response.data;
    } catch (error) {
      console.error('Fetch user error:', error.response?.data || error.message);
      
      // Check if this is a "User not found" error
      if (error.response?.data?.error === "User not found") {
        // Clear stored userId since it's invalid
        await SecureStore.deleteItemAsync('userId');
        
        // Return a special error object that our components can check for
        throw {
          isUserNotFound: true,
          message: "User account not found. Please log in again."
        };
      }
      
      // For other errors, just rethrow
      throw error;
    }
  });
};


export const logoutUser = async () => {
  try {
    await SecureStore.deleteItemAsync('userId');
    // No need to call backend logout endpoint if you're using stateless JWT auth
    // If you want to invalidate server-side session, uncomment:
    // await apiClient.post('/api/logout');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const claimDailyBonus = async (userId) => {
  try {
    const response = await apiClient.post(API.USER.DAILY_BONUS(userId));
    return response.data;
  } catch (error) {
    console.error('Daily bonus error:', error.response?.data || error.message);
    throw error;
  }
};




export const deleteUserAccount = async (userId) => {
  try {
    const response = await apiClient.delete(API.USER.DELETE_ACCOUNT(userId));
    
    // Ensure you clear any stored tokens or user data
    await SecureStore.deleteItemAsync('userId');
    
    return response.data;
  } catch (error) {
    console.error('Account deletion error:', error.response?.data || error.message);
    throw error;
  }
};

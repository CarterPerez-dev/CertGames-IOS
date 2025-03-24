// src/api/passwordResetService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post(API.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  } catch (error) {
    // Check for expected errors like email not found
    if (error.response && error.response.status === 404) {
      // Return a structured error instead of throwing
      return { 
        success: false, 
        error: 'No account found with this email address.'
      };
    }
    
    // For other errors, still throw
    console.error('Password reset error:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyResetToken = async (token) => {
  try {
    const response = await apiClient.get(API.AUTH.VERIFY_TOKEN(token));
    return response.data;
  } catch (error) {
    console.error('Token verification error:', error.response?.data || error.message);
    throw error;
  }
};

export const resetPassword = async (token, newPassword, confirmPassword) => {
  try {
    const response = await apiClient.post(API.AUTH.RESET_PASSWORD, {
      token,
      newPassword,
      confirmPassword
    });
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error.response?.data || error.message);
    throw error;
  }
};

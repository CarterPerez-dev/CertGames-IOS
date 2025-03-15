// src/api/passwordResetService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post(API.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};

export const verifyResetToken = async (token) => {
  try {
    const response = await apiClient.get(API.AUTH.VERIFY_TOKEN(token));
    return response.data;
  } catch (error) {
    console.error('Error verifying reset token:', error);
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
    console.error('Error resetting password:', error);
    throw error;
  }
};

// src/api/profileService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

/**
 * Change the user's username
 * @param {string} userId - The user's ID
 * @param {string} newUsername - The new username
 * @returns {Promise} - Resolution of the API call
 */
export const changeUsername = async (userId, newUsername) => {
  try {
    const response = await apiClient.post(API.USER.CHANGE_USERNAME, {
      userId,
      newUsername
    });
    return response.data;
  } catch (error) {
    console.error('Username change error:', error);
    throw new Error(error.response?.data?.error || 'Failed to change username');
  }
};

/**
 * Change the user's email address
 * @param {string} userId - The user's ID
 * @param {string} newEmail - The new email address
 * @returns {Promise} - Resolution of the API call
 */
export const changeEmail = async (userId, newEmail) => {
  try {
    const response = await apiClient.post(API.USER.CHANGE_EMAIL, {
      userId,
      newEmail
    });
    return response.data;
  } catch (error) {
    console.error('Email change error:', error);
    throw new Error(error.response?.data?.error || 'Failed to change email');
  }
};

/**
 * Change the user's password
 * @param {string} userId - The user's ID
 * @param {string} oldPassword - The current password
 * @param {string} newPassword - The new password
 * @param {string} confirmPassword - Confirmation of the new password
 * @returns {Promise} - Resolution of the API call
 */
export const changePassword = async (userId, oldPassword, newPassword, confirmPassword) => {
  try {
    const response = await apiClient.post(API.USER.CHANGE_PASSWORD, {
      userId,
      oldPassword,
      newPassword,
      confirmPassword
    });
    return response.data;
  } catch (error) {
    console.error('Password change error:', error);
    throw new Error(error.response?.data?.error || 'Failed to change password');
  }
};

/**
 * Upload a profile image
 * @param {string} userId - The user's ID
 * @param {object} imageData - The image data to upload
 * @returns {Promise} - Resolution of the API call
 */
export const uploadProfileImage = async (userId, imageData) => {
  try {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('profileImage', imageData);
    
    const response = await apiClient.post(API.USER.UPLOAD_PROFILE_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Profile image upload error:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload profile image');
  }
};

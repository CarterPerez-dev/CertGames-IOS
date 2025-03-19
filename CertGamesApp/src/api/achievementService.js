// src/api/achievementService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

/**
 * Fetch all achievements
 * @returns {Promise} - Resolution of the API call
 */
export const fetchAchievements = async () => {
  try {
    const response = await apiClient.get(API.ACHIEVEMENTS);
    return response.data;
  } catch (error) {
    console.error('Achievements fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch achievements');
  }
};

/**
 * Get achievement details by ID
 * @param {string} achievementId - The achievement's ID
 * @returns {Promise} - Resolution of the API call
 */
export const getAchievementById = async (achievementId) => {
  try {
    const response = await apiClient.get(`${API.ACHIEVEMENTS}/${achievementId}`);
    return response.data;
  } catch (error) {
    console.error('Achievement details fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch achievement details');
  }
};

/**
 * Get unlocked achievements for a user
 * @param {string} userId - The user's ID
 * @returns {Promise} - Resolution of the API call
 */
export const getUserAchievements = async (userId) => {
  try {
    const response = await apiClient.get(`${API.USER.DETAILS(userId)}`);
    return response.data.achievements || [];
  } catch (error) {
    console.error('User achievements fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch user achievements');
  }
};

/**
 * Export all functions for consistent usage
 */
export default {
  fetchAchievements,
  getAchievementById,
  getUserAchievements
};

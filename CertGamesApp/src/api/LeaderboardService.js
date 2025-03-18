// src/api/leaderboardService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

/**
 * Fetch the global leaderboard data
 * @param {number} skip - Number of items to skip (for pagination)
 * @param {number} limit - Number of items to fetch per page
 * @returns {Promise} - Resolution of the API call
 */
export const fetchLeaderboard = async (skip = 0, limit = 20) => {
  try {
    const response = await apiClient.get(`${API.LEADERBOARD.USER}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch leaderboard');
  }
};

/**
 * Fetch the public leaderboard data (no authorization required)
 * @param {number} skip - Number of items to skip (for pagination)
 * @param {number} limit - Number of items to fetch per page
 * @returns {Promise} - Resolution of the API call
 */
export const fetchPublicLeaderboard = async (skip = 0, limit = 20) => {
  try {
    const response = await apiClient.get(`${API.LEADERBOARD.PUBLIC}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Public leaderboard fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch public leaderboard');
  }
};

/**
 * Fetch user's current rank and nearby users
 * @param {string} userId - The user's ID
 * @returns {Promise} - Resolution of the API call
 */
export const fetchUserRanking = async (userId) => {
  try {
    const response = await apiClient.get(`${API.LEADERBOARD.USER}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('User ranking fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch user ranking');
  }
};

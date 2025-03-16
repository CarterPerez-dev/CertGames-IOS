// src/api/dailyStationService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

/**
 * Claim the daily bonus
 * @param {string} userId - The user's ID
 * @returns {Promise} - Resolution of the API call
 */
export const claimDailyBonus = async (userId) => {
  try {
    const response = await apiClient.post(API.USER.DAILY_BONUS(userId));
    return response.data;
  } catch (error) {
    console.error('Daily bonus claim error:', error);
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to claim daily bonus');
  }
};

/**
 * Get the daily question
 * @param {string} userId - The user's ID
 * @returns {Promise} - Resolution of the API call
 */
export const getDailyQuestion = async (userId) => {
  try {
    const response = await apiClient.get(`${API.DAILY.GET_QUESTION}?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Daily question fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to get daily question');
  }
};

/**
 * Submit an answer to the daily question
 * @param {string} userId - The user's ID
 * @param {number} dayIndex - The day index of the question
 * @param {number} selectedIndex - The selected answer index
 * @returns {Promise} - Resolution of the API call
 */
export const submitDailyAnswer = async (userId, dayIndex, selectedIndex) => {
  try {
    const response = await apiClient.post(API.DAILY.SUBMIT_ANSWER, {
      userId,
      dayIndex,
      selectedIndex
    });
    return response.data;
  } catch (error) {
    console.error('Daily answer submission error:', error);
    throw new Error(error.response?.data?.error || 'Failed to submit daily answer');
  }
};

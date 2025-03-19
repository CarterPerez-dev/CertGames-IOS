// src/api/leaderboardService.js
import apiClient from './apiClient';
import { API, BASE_URL } from './apiConfig';

// Helper to format image URLs
const formatImageUrl = (url) => {
  if (!url) return null;
  
  // If it's already a complete URL, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Fix relative URLs
  if (!url.startsWith('/') && !url.startsWith('./')) {
    url = '/' + url;
  }
  
  // Extract the domain without the "/api" path
  const apiIndex = BASE_URL.indexOf('/api');
  const domain = apiIndex !== -1 ? 
    BASE_URL.substring(0, apiIndex) : 
    BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes
    
  url = url.replace(/^\/+/, '/'); // Ensure only one leading slash
  return domain + url;
};

/**
 * Fetch the global leaderboard data
 * @param {number} skip - Number of items to skip (for pagination)
 * @param {number} limit - Number of items to fetch per page
 * @returns {Promise} - Resolution of the API call
 */
export const fetchLeaderboard = async (skip = 0, limit = 20) => {
  try {
    const response = await apiClient.get(`${API.LEADERBOARD.USER}?skip=${skip}&limit=${limit}`);
    
    // Process the data to ensure all fields are present and image URLs are properly formatted
    if (response.data && response.data.data) {
      response.data.data = response.data.data.map((item, index) => {
        if (item.avatarUrl) {
          item.avatarUrl = formatImageUrl(item.avatarUrl);
        }
        
        // Ensure rank is calculated if not provided
        if (!item.rank) {
          item.rank = skip + index + 1;
        }
        
        return item;
      });
    }
    
    return response.data || { data: [], total: 0 };
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
 * @param {string} username - The user's username to look up
 * @returns {Promise} - Resolution of the API call
 */
export const fetchUserRanking = async (username) => {
  if (!username) {
    console.warn('No username provided to fetchUserRanking');
    return null;
  }
  
  try {
    // Get the full leaderboard to find user's position
    const response = await apiClient.get(`${API.LEADERBOARD.USER}?skip=0&limit=1000`);
    const leaderboardData = response.data?.data || [];
    
    // Find the user's entry in the leaderboard by username
    const userIndex = leaderboardData.findIndex(item => 
      item.username === username
    );
    
    if (userIndex >= 0) {
      const userEntry = leaderboardData[userIndex];
      return {
        rank: userIndex + 1, // Calculate rank based on position in array
        username: userEntry.username,
        level: userEntry.level,
        xp: userEntry.xp,
        avatarUrl: userEntry.avatarUrl ? formatImageUrl(userEntry.avatarUrl) : null
      };
    } else {
      // If user not found in leaderboard, return null
      console.warn(`User ${username} not found in leaderboard data`);
      return null;
    }
  } catch (error) {
    console.error('User ranking fetch error:', error);
    // Return null instead of throwing, so the app can continue functioning
    return null;
  }
};

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
    
    // Return default achievements data when API fails
    if (error.message.includes('Network Error') || (error.response && error.response.status === 404)) {
      console.log('Using fallback achievement data');
      return getDefaultAchievements();
    }
    
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
    
    // Return a default achievement when API fails
    if (error.message.includes('Network Error') || (error.response && error.response.status === 404)) {
      console.log('Using fallback achievement data for ID:', achievementId);
      const allDefault = getDefaultAchievements();
      return allDefault.find(a => a.achievementId === achievementId) || {
        achievementId: achievementId,
        title: 'Achievement',
        description: 'Complete specific tasks to unlock this achievement.',
        criteria: {}
      };
    }
    
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
    
    // Return empty achievements array when API fails
    if (error.message.includes('Network Error') || (error.response && error.response.status === 404)) {
      console.log('Returning empty achievements array due to network issue');
      return [];
    }
    
    throw new Error(error.response?.data?.error || 'Failed to fetch user achievements');
  }
};

/**
 * Provides fallback achievement data when API is unavailable
 * @returns {Array} Default achievement objects
 */
const getDefaultAchievements = () => {
  return [
    {
      achievementId: 'test_rookie',
      title: 'Test Rookie',
      description: 'Complete your first practice test',
      criteria: { testCount: 1 }
    },
    {
      achievementId: 'accuracy_king',
      title: 'Accuracy King',
      description: 'Score 90% or higher on any practice test',
      criteria: { minScore: 90 }
    },
    {
      achievementId: 'bronze_grinder',
      title: 'Bronze Grinder',
      description: 'Complete 5 practice tests',
      criteria: { testCount: 5 }
    },
    {
      achievementId: 'silver_scholar',
      title: 'Silver Scholar',
      description: 'Complete 10 practice tests',
      criteria: { testCount: 10 }
    },
    {
      achievementId: 'gold_god',
      title: 'Gold God',
      description: 'Complete 25 practice tests',
      criteria: { testCount: 25 }
    },
    {
      achievementId: 'platinum_pro',
      title: 'Platinum Pro',
      description: 'Complete 50 practice tests',
      criteria: { testCount: 50 }
    },
    {
      achievementId: 'walking_encyclopedia',
      title: 'Walking Encyclopedia',
      description: 'Answer a total of 500 questions',
      criteria: { totalQuestions: 500 }
    },
    {
      achievementId: 'redemption_arc',
      title: 'Redemption Arc',
      description: 'Score below 60% on a test, then later score above 90% on the same test',
      criteria: { minScoreBefore: 60, minScoreAfter: 90 }
    },
    {
      achievementId: 'coin_collector_5000',
      title: 'Coin Collector',
      description: 'Earn 5,000 coins',
      criteria: { coins: 5000 }
    },
    {
      achievementId: 'perfectionist_1',
      title: 'Perfectionist',
      description: 'Get a perfect score on any practice test',
      criteria: { perfectTests: 1 }
    },
    {
      achievementId: 'level_up_5',
      title: 'Getting Started',
      description: 'Reach level 5',
      criteria: { level: 5 }
    },
    {
      achievementId: 'answer_machine_1000',
      title: 'Answer Machine',
      description: 'Answer 1,000 questions correctly',
      criteria: { totalQuestions: 1000 }
    }
  ];
};

export default {
  fetchAchievements,
  getAchievementById,
  getUserAchievements
};

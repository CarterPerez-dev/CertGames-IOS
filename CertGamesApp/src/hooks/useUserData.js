// src/hooks/useUserData.js
import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserData } from '../store/slices/userSlice';
import { fetchShopItems } from '../store/slices/shopSlice';
import { fetchAchievements } from '../store/slices/achievementsSlice';

/**
 * Custom hook for accessing user data with auto-refresh capabilities
 * This makes it easy to access user data in any component
 * and ensures that data is always up-to-date
 */
const useUserData = (options = {}) => {
  const { autoFetch = true } = options;
  const dispatch = useDispatch();
  
  // Get all user-related data from Redux
  const userData = useSelector(state => state.user);
  const { 
    userId, 
    username, 
    email,
    xp, 
    level, 
    coins, 
    achievements, 
    xpBoost,
    currentAvatar,
    nameColor,
    purchasedItems,
    subscriptionActive,
    status,
    error,
    lastDailyClaim
  } = userData;
  
  // Get shop items (for avatar display)
  const { items: shopItems, status: shopStatus } = useSelector(state => state.shop);
  
  // Get all achievements
  const { all: allAchievements, status: achievementsStatus } = useSelector(state => state.achievements);
  
  // Auto-fetch data when component mounts if userId is available
  useEffect(() => {
    if (autoFetch && userId) {
      // Fetch user data if needed
      if (status === 'idle') {
        dispatch(fetchUserData(userId));
      }
      
      // Fetch shop items if needed
      if (shopStatus === 'idle') {
        dispatch(fetchShopItems());
      }
      
      // Fetch achievements if needed
      if (achievementsStatus === 'idle') {
        dispatch(fetchAchievements());
      }
    }
  }, [autoFetch, userId, status, shopStatus, achievementsStatus, dispatch]);
  
  // Function to manually refresh data
  const refreshData = useCallback(() => {
    if (userId) {
      dispatch(fetchUserData(userId));
      dispatch(fetchAchievements());
      dispatch(fetchShopItems());
    }
  }, [userId, dispatch]);
  
  // Get avatar URL helper
  const getAvatarUrl = useCallback(() => {
    if (currentAvatar && shopItems && shopItems.length > 0) {
      const avatarItem = shopItems.find(item => item._id === currentAvatar);
      if (avatarItem && avatarItem.imageUrl) {
        // If you have a format helper in your testService, use it:
        // return testService.formatImageUrl(avatarItem.imageUrl);
        return avatarItem.imageUrl;
      }
    }
    return null; // Will use the default local asset
  }, [currentAvatar, shopItems]);
  
  // Get unlocked achievements
  const getUnlockedAchievements = useCallback(() => {
    if (!achievements || !allAchievements) return [];
    
    return allAchievements.filter(achievement => 
      achievements.includes(achievement.achievementId)
    );
  }, [achievements, allAchievements]);
  
  // Check if a specific achievement is unlocked
  const isAchievementUnlocked = useCallback((achievementId) => {
    return achievements && achievements.includes(achievementId);
  }, [achievements]);
  
  return {
    // User data
    userId,
    username,
    email,
    xp,
    level,
    coins,
    achievements,
    xpBoost,
    currentAvatar,
    nameColor,
    purchasedItems,
    subscriptionActive,
    lastDailyClaim,
    
    // Shop items
    shopItems,
    
    // Achievements
    allAchievements,
    
    // Status
    isLoading: status === 'loading',
    error,
    
    // Helper functions
    refreshData,
    getAvatarUrl,
    getUnlockedAchievements,
    isAchievementUnlocked
  };
};

export default useUserData;

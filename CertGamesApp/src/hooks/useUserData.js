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
  console.log("useUserData hook called");
  const { autoFetch = true } = options;
  const dispatch = useDispatch();
  
  // Get all user-related data from Redux
  const userData = useSelector(state => state.user || {});
  
  // Safely destructure userData with fallbacks
  const { 
    userId = null, 
    username = '', 
    email = '',
    xp = 0, 
    level = 1, 
    coins = 0, 
    achievements = [], 
    xpBoost = 1.0,
    currentAvatar = null,
    nameColor = null,
    purchasedItems = [],
    subscriptionActive = false,
    status = 'idle',
    error = null,
    lastDailyClaim = null,
    subscriptionStatus = null,
    subscriptionPlatform = null,
    appleTransactionId = null,
    subscriptionStartDate = null,
    subscriptionEndDate = null
  } = userData || {};
  
  console.log("useUserData extracted:", { 
    userId, 
    coins: coins || 0, 
    xp: xp || 0, 
    lastDailyClaim: lastDailyClaim || null 
  });
  
  // Get shop items (for avatar display)
  const { items: shopItems = [], status: shopStatus = 'idle' } = useSelector(state => state.shop || { items: [], status: 'idle' });
  
  // Get all achievements
  const { all: allAchievements = [], status: achievementsStatus = 'idle' } = useSelector(state => state.achievements || { all: [], status: 'idle' });
  
  // Auto-fetch data when component mounts if userId is available
  useEffect(() => {
    if (autoFetch && userId) {
      // Fetch user data if needed
      if (status === 'idle') {
        console.log("useUserData auto-fetching user data");
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
      console.log("useUserData manually refreshing data");
      dispatch(fetchUserData(userId));
      dispatch(fetchAchievements());
      dispatch(fetchShopItems());
    } else {
      console.log("useUserData refresh called but no userId");
    }
  }, [userId, dispatch]);
  
  // Get avatar URL helper
  const getAvatarUrl = useCallback(() => {
    if (!currentAvatar || !shopItems || !Array.isArray(shopItems) || shopItems.length === 0) {
      return null;
    }
    
    try {
      const avatarItem = shopItems.find(item => item && item._id === currentAvatar);
      if (avatarItem && avatarItem.imageUrl) {
        return avatarItem.imageUrl;
      }
    } catch (error) {
      console.error("Error getting avatar URL:", error);
    }
    
    return null; // Will use the default local asset
  }, [currentAvatar, shopItems]);
  
  // Get unlocked achievements
  const getUnlockedAchievements = useCallback(() => {
    if (!achievements || !allAchievements) return [];
    
    try {
      return allAchievements.filter(achievement => 
        achievements.includes(achievement.achievementId)
      );
    } catch (error) {
      console.error("Error getting unlocked achievements:", error);
      return [];
    }
  }, [achievements, allAchievements]);
  
  // Check if a specific achievement is unlocked
  const isAchievementUnlocked = useCallback((achievementId) => {
    if (!achievements || !Array.isArray(achievements)) return false;
    return achievements.includes(achievementId);
  }, [achievements]);
  
  return {
    // User data with explicit fallbacks
    userId: userId || null,
    username: username || '',
    email: email || '',
    xp: xp || 0,
    level: level || 1,
    coins: coins || 0,
    achievements: achievements || [],
    xpBoost: xpBoost || 1.0,
    currentAvatar: currentAvatar || null,
    nameColor: nameColor || null,
    purchasedItems: purchasedItems || [],
    subscriptionActive: subscriptionActive || false,
    lastDailyClaim: lastDailyClaim || null,
    subscriptionStatus: subscriptionStatus || null,
    subscriptionPlatform: subscriptionPlatform || null,
    appleTransactionId: appleTransactionId || null,
    
    // Shop items
    shopItems: shopItems || [],
    
    // Achievements
    allAchievements: allAchievements || [],
    
    // Status
    isLoading: status === 'loading',
    error: error || null,
    
    // Helper functions
    refreshData,
    getAvatarUrl,
    getUnlockedAchievements,
    isAchievementUnlocked
  };
};

export default useUserData;

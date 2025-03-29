// src/hooks/useUserData.js - FIXED VERSION
import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserData } from '../store/slices/userSlice';
import { fetchShopItems } from '../store/slices/shopSlice';
import { fetchAchievements } from '../store/slices/achievementsSlice';

const useUserData = (options = {}) => {
  const { autoFetch = true } = options;
  const dispatch = useDispatch();
  
  // Safely get data from Redux with null checks at every level
  const userData = useSelector(state => state?.user || {});
  const shopState = useSelector(state => state?.shop || {});
  const achievementsState = useSelector(state => state?.achievements || {});
  
  // Safely destructure with fallbacks
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
    subscriptionPlatform = null
  } = userData;
  
  // Safe access to shop and achievements
  const shopItems = shopState?.items || [];
  const shopStatus = shopState?.status || 'idle';
  const allAchievements = achievementsState?.all || [];
  const achievementsStatus = achievementsState?.status || 'idle';
  
  // Auto-fetch data when component mounts if userId is available
  useEffect(() => {
    if (autoFetch && userId) {
      try {
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
      } catch (error) {
        console.error("Error in useUserData effect:", error);
      }
    }
  }, [autoFetch, userId, status, shopStatus, achievementsStatus, dispatch]);
  
  // Function to manually refresh data with error handling
  const refreshData = useCallback(() => {
    if (userId) {
      try {
        dispatch(fetchUserData(userId));
        dispatch(fetchAchievements());
        dispatch(fetchShopItems());
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }
  }, [userId, dispatch]);
  
  // Get avatar URL helper with thorough error handling
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
    
    return null;
  }, [currentAvatar, shopItems]);
  
  // Get unlocked achievements with error handling
  const getUnlockedAchievements = useCallback(() => {
    if (!achievements || !allAchievements || !Array.isArray(achievements) || !Array.isArray(allAchievements)) {
      return [];
    }
    
    try {
      return allAchievements.filter(achievement => 
        achievement && achievements.includes(achievement.achievementId)
      );
    } catch (error) {
      console.error("Error getting unlocked achievements:", error);
      return [];
    }
  }, [achievements, allAchievements]);
  
  // Check if a specific achievement is unlocked with error handling
  const isAchievementUnlocked = useCallback((achievementId) => {
    if (!achievementId || !achievements || !Array.isArray(achievements)) {
      return false;
    }
    
    try {
      return achievements.includes(achievementId);
    } catch (error) {
      console.error("Error checking achievement:", error);
      return false;
    }
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

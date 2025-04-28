// src/hooks/useUserData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserData, fetchUsageLimits } from '../store/slices/userSlice';

// Create module-level singleton to track initialization across all components
const globalState = {
  initializedUserIds: new Set(),
  pendingFetches: {},
  lastFetchTimes: {
    userData: {},
    usageLimits: {},
  }
};

/**
 * Custom hook for accessing and refreshing user data
 * @param {Object} options - Configuration options
 * @returns {Object} User data and utility functions
 */
const useUserData = (options = {}) => {
  const { autoFetch = true } = options;
  const dispatch = useDispatch();
  
  // Local states for component
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wasInitializedRef = useRef(false);
  
  // Get data from Redux with optimized selector
  const userData = useSelector(state => state.user || {});
  const { shopItems = [] } = useSelector(state => state.shop || {});
  const { achievements: allAchievements = [] } = useSelector(state => state.achievements || {});
  
  // Destructure user data with defaults
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
    lastDailyClaim = null,
    subscriptionStatus = null,
    subscriptionPlatform = null,
    lastUpdated = null,
    practiceQuestionsRemaining = 0,
    subscriptionType = 'free',
    status
  } = userData;
  
  // FIX: Function to fetch specific data type
  const fetchData = useCallback(async (dataType) => {
    if (!userId) return;
    
    // Create a fetch key to prevent duplicate fetches
    const fetchKey = `${dataType}-${userId}`;
    
    // Check if this data is already being fetched
    if (globalState.pendingFetches[fetchKey]) {
      console.log(`[useUserData] Already fetching ${dataType} for ${userId}, skipping duplicate`);
      return;
    }
    
    try {
      // Set fetch flag to prevent duplicates
      globalState.pendingFetches[fetchKey] = true;
      
      if (dataType === 'userData') {
        console.log(`[useUserData] Fetching user data for ${userId}`);
        setLoading(true);
        
        // Small delay before fetch to prevent UI flickering
        await new Promise(resolve => setTimeout(resolve, 50));
        
        await dispatch(fetchUserData(userId)).unwrap();
        globalState.lastFetchTimes.userData[userId] = Date.now();
      }
      else if (dataType === 'usageLimits') {
        console.log(`[useUserData] Fetching usage limits for ${userId}`);
        await dispatch(fetchUsageLimits(userId)).unwrap();
        globalState.lastFetchTimes.usageLimits[userId] = Date.now();
      }
    } catch (err) {
      console.error(`[useUserData] Error fetching ${dataType}:`, err);
      setError(err.message || `Failed to fetch ${dataType}`);
    } finally {
      // Clear pending flag
      delete globalState.pendingFetches[fetchKey];
      setLoading(false);
    }
  }, [userId, dispatch]);
  
  // Effect for initialization
  useEffect(() => {
    if (!autoFetch || !userId || wasInitializedRef.current) {
      return;
    }
    
    // Set loading state only once during initial load
    setLoading(true);
    
    // Sequential fetching with delays to prevent rate limiting
    const loadInitialData = async () => {
      try {
        // Always fetch user data first
        await fetchData('userData');
        
        // Wait before fetching next data
        setTimeout(() => {
          // Only fetch usage limits for free users
          if (!subscriptionActive) {
            fetchData('usageLimits');
          }
        }, 500);
      } finally {
        setLoading(false);
        wasInitializedRef.current = true;
      }
    };
    
    loadInitialData();
  }, [userId, autoFetch, fetchData, subscriptionActive]);
  
  // Manual refresh with debouncing
  const refreshData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First fetch user data
      await fetchData('userData');
      
      // Then fetch usage limits if needed
      if (!subscriptionActive) {
        await fetchData('usageLimits');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, fetchData, subscriptionActive]);
  
  // FIX: Get avatar URL helper with thorough error handling
  const getAvatarUrl = useCallback(() => {
    if (!currentAvatar) return null;
    
    try {
      if (!shopItems || !Array.isArray(shopItems) || shopItems.length === 0) {
        return null;
      }
      
      const avatarItem = shopItems.find(item => 
        item && item._id === currentAvatar
      );
      
      return avatarItem?.imageUrl || null;
    } catch (error) {
      console.error("[useUserData] Error getting avatar URL:", error);
      return null;
    }
  }, [currentAvatar, shopItems]);
  
  // Get unlocked achievements with error handling
  const getUnlockedAchievements = useCallback(() => {
    if (!achievements || !allAchievements) return [];
    
    try {
      if (!Array.isArray(achievements) || !Array.isArray(allAchievements)) {
        return [];
      }
      
      return allAchievements.filter(achievement => 
        achievement && achievements.includes(achievement.achievementId)
      );
    } catch (error) {
      console.error("[useUserData] Error getting unlocked achievements:", error);
      return [];
    }
  }, [achievements, allAchievements]);
  
  // Check if a specific achievement is unlocked
  const isAchievementUnlocked = useCallback((achievementId) => {
    if (!achievementId || !achievements) return false;
    
    try {
      if (!Array.isArray(achievements)) return false;
      
      return achievements.includes(achievementId);
    } catch (error) {
      console.error("[useUserData] Error checking achievement:", error);
      return false;
    }
  }, [achievements]);
  
  // Has access to premium features check
  const hasPremiumAccess = useCallback(() => {
    return subscriptionActive === true;
  }, [subscriptionActive]);
  
  // Check if user has practice questions remaining
  const hasPracticeQuestionsRemaining = useCallback(() => {
    return subscriptionActive || practiceQuestionsRemaining > 0;
  }, [subscriptionActive, practiceQuestionsRemaining]);
  
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
    lastUpdated: lastUpdated || null,
    
    // Freemium properties
    practiceQuestionsRemaining: practiceQuestionsRemaining || 0,
    subscriptionType: subscriptionType || 'free',
    
    // Shop items
    shopItems: shopItems || [],
    
    // Achievements
    allAchievements: allAchievements || [],
    
    // Status
    isLoading: loading || status === 'loading',
    error: error || null,
    
    // Helper functions
    refreshData,
    getAvatarUrl,
    getUnlockedAchievements,
    isAchievementUnlocked,
    
    // Freemium helper functions
    hasPremiumAccess,
    hasPracticeQuestionsRemaining
  };
};

export default useUserData;

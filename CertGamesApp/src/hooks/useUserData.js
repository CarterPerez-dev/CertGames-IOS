// src/hooks/useUserData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserData } from '../store/slices/userSlice';
import { fetchShopItems } from '../store/slices/shopSlice';
import { fetchAchievements } from '../store/slices/achievementsSlice';
import { fetchUsageLimits } from '../store/slices/userSlice';

// Create module-level singleton to track initialization across all components
const globalState = {
  initializedUserIds: new Set(),
  pendingFetches: {},
  lastFetchTimes: {
    userData: {},
    usageLimits: {},
    achievements: {},
    shopItems: {}
  },
  // Track backoff multipliers to implement exponential backoff
  backoffMultipliers: {}
};

// Utility for staggered fetching
const staggeredFetch = async (dispatch, action, userId, delayMs = 100) => {
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return dispatch(action);
};

// Main hook implementation
const useUserData = (options = {}) => {
  const { autoFetch = true } = options;
  const dispatch = useDispatch();
  
  // Local refs for component state
  const initialFetchDoneRef = useRef(false);
  
  // Get data from Redux with optimized selector
  const userData = useSelector(state => state?.user || {}, (prev, next) => {
    return prev.lastUpdated === next.lastUpdated;
  });
  
  const shopState = useSelector(state => state?.shop || {});
  const achievementsState = useSelector(state => state?.achievements || {});
  
  // Component state
  const [loading, setLoading] = useState(true);
  
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
  } = userData;
  
  // Fetch initial data with guards and staggering
  const fetchInitialData = useCallback(async () => {
    if (!userId) return;
    
    // Create a unique key for this fetch operation
    const fetchKey = `init-${userId}`;
    
    // Check if this user is already being fetched
    if (globalState.pendingFetches[fetchKey]) {
      console.log(`[useUserData] Already fetching data for ${userId}, skipping duplicate`);
      return;
    }
    
    // Check if this user has already been initialized
    if (globalState.initializedUserIds.has(userId)) {
      console.log(`[useUserData] User ${userId} already initialized, skipping`);
      initialFetchDoneRef.current = true;
      setLoading(false);
      return;
    }
    
    // Set flag to prevent concurrent fetches
    globalState.pendingFetches[fetchKey] = true;
    
    try {
      setLoading(true);
      
      // Fetch core user data first
      if (status === 'idle') {
        console.log(`[useUserData] Fetching user data for ${userId}`);
        await dispatch(fetchUserData(userId));
        globalState.lastFetchTimes.userData[userId] = Date.now();
      }
      
      // Stagger shop items fetch with delay
      if (shopState.status === 'idle') {
        console.log(`[useUserData] Fetching shop items with 150ms delay`);
        await staggeredFetch(dispatch, fetchShopItems(), userId, 150);
        globalState.lastFetchTimes.shopItems[userId] = Date.now();
      }
      
      // Stagger achievements fetch with delay
      if (achievementsState.status === 'idle') {
        console.log(`[useUserData] Fetching achievements with 300ms delay`);
        await staggeredFetch(dispatch, fetchAchievements(), userId, 300);
        globalState.lastFetchTimes.achievements[userId] = Date.now();
      }
      
      // Fetch usage limits only for free users
      if (!subscriptionActive) {
        console.log(`[useUserData] Fetching usage limits with 450ms delay`);
        await staggeredFetch(dispatch, fetchUsageLimits(userId), userId, 450);
        globalState.lastFetchTimes.usageLimits[userId] = Date.now();
      }
      
      // Mark this user as initialized
      globalState.initializedUserIds.add(userId);
      initialFetchDoneRef.current = true;
      
    } catch (error) {
      console.error(`[useUserData] Error in fetchInitialData: ${error.message}`);
    } finally {
      // Clear the pending flag when done
      delete globalState.pendingFetches[fetchKey];
      setLoading(false);
    }
  }, [userId, status, shopState.status, achievementsState.status, subscriptionActive, dispatch]);
  
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
          
          // Low priority data - delay even more
          setTimeout(() => fetchData('shopItems'), 500);
          setTimeout(() => fetchData('achievements'), 1000);
        }, 500);
      } finally {
        setLoading(false);
        wasInitializedRef.current = true;
      }
    };
    
    loadInitialData();
  }, [userId, autoFetch, fetchData, subscriptionActive]);
  
  // Manual refresh with exponential backoff
  const refreshData = useCallback(() => {
    if (!userId) return;
    
    setLoading(true);
    
    fetchData('userData')
      .then(() => {
        if (!subscriptionActive) {
          return fetchData('usageLimits');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, fetchData, subscriptionActive]);
  
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
      console.error("[useUserData] Error getting avatar URL:", error);
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
      console.error("[useUserData] Error getting unlocked achievements:", error);
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
      console.error("[useUserData] Error checking achievement:", error);
      return false;
    }
  }, [achievements]);
  
  // Freemium: Has access to premium features check
  const hasPremiumAccess = useCallback(() => {
    return subscriptionActive === true;
  }, [subscriptionActive]);
  
  // Freemium: Check if user has practice questions remaining
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
    isLoading: loading,
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

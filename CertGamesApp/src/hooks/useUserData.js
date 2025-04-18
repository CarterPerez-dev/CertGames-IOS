// src/hooks/useUserData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserData } from '../store/slices/userSlice';
import { fetchShopItems } from '../store/slices/shopSlice';
import { fetchAchievements } from '../store/slices/achievementsSlice';
import { fetchUsageLimits } from '../store/slices/userSlice';

// Debounce function to prevent excessive API calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const useUserData = (options = {}) => {
  const { autoFetch = true } = options;
  const dispatch = useDispatch();
  
  // Use refs to track initialization and prevent duplicate API calls
  const initialFetchDoneRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const usageLimitsFetchedRef = useRef(false);
  
  // Safely get data from Redux with null checks at every level
  const userData = useSelector(state => state?.user || {}, (prev, next) => {
    // Optimize re-renders - only update if these specific fields change
    return (
      prev.userId === next.userId &&
      prev.subscriptionActive === next.subscriptionActive &&
      prev.practiceQuestionsRemaining === next.practiceQuestionsRemaining &&
      prev.lastUpdated === next.lastUpdated
    );
  });
  
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
    subscriptionPlatform = null,
    lastUpdated = null,
    practiceQuestionsRemaining = 0,
    subscriptionType = 'free',
  } = userData;
  
  // Safe access to shop and achievements
  const shopItems = shopState?.items || [];
  const shopStatus = shopState?.status || 'idle';
  const allAchievements = achievementsState?.all || [];
  const achievementsStatus = achievementsState?.status || 'idle';
  
  const [loading, setLoading] = useState(true);
  
  // Create debounced versions of our API calls
  const debouncedFetchUserData = useRef(
    debounce((id) => {
      console.log("[useUserData] Debounced fetchUserData call for:", id);
      dispatch(fetchUserData(id));
    }, 2000)
  ).current;
  
  const debouncedFetchUsageLimits = useRef(
    debounce((id) => {
      console.log("[useUserData] Debounced fetchUsageLimits call for:", id);
      dispatch(fetchUsageLimits(id));
      usageLimitsFetchedRef.current = true;
    }, 5000) // Higher debounce time for limits
  ).current;
  
  // Auto-fetch data when component mounts if userId is available
  useEffect(() => {
    if (!autoFetch || !userId) {
      setLoading(false);
      return;
    }
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // Initial data load - only runs once
    if (!initialFetchDoneRef.current) {
      console.log("[useUserData] Initial data load for:", userId);
      
      setLoading(true);
      
      // Fetch core user data first
      const fetchInitialData = async () => {
        try {
          if (status === 'idle') {
            await dispatch(fetchUserData(userId));
          }
          
          // Fetch shop items if needed - only once
          if (shopStatus === 'idle') {
            dispatch(fetchShopItems());
          }
          
          // Fetch achievements if needed - only once
          if (achievementsStatus === 'idle') {
            dispatch(fetchAchievements());
          }
          
          // Fetch usage limits for freemium model - only fetch once initially
          if (!subscriptionActive && !usageLimitsFetchedRef.current) {
            dispatch(fetchUsageLimits(userId));
            usageLimitsFetchedRef.current = true;
          }
          
          lastFetchTimeRef.current = Date.now();
          initialFetchDoneRef.current = true;
        } finally {
          setLoading(false);
        }
      };
      
      fetchInitialData();
      return;
    }
    
    // For subsequent updates, only fetch if it's been a while or status changes
    if (timeSinceLastFetch > 30000 && status === 'idle') { // 30 second minimum between refreshes
      console.log("[useUserData] Refreshing data after timeout for:", userId);
      debouncedFetchUserData(userId);
      lastFetchTimeRef.current = now;
    }
    
    // Always set loading to false for subsequent renders
    setLoading(false);
  }, [userId, status, shopStatus, achievementsStatus, subscriptionActive, dispatch, autoFetch]);
  
  // Only refresh usage limits when subscription status changes or after significant time
  useEffect(() => {
    if (!userId || subscriptionActive) return;
    
    // Only refresh usage limits if subscription status changed to false
    // or if it's been a while since last fetch
    const now = Date.now();
    if (now - lastFetchTimeRef.current > 60000) { // 1 minute between usage limit refreshes
      console.log("[useUserData] Refreshing usage limits for:", userId);
      debouncedFetchUsageLimits(userId);
    }
  }, [userId, subscriptionActive]);
  
  // Function to manually refresh data with error handling and rate limiting
  const refreshData = useCallback(() => {
    if (!userId) return;
    
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      console.log("[useUserData] Refresh request ignored - too soon");
      return; // Prevent refreshes more frequent than every 5 seconds
    }
    
    console.log("[useUserData] Manual refresh requested for:", userId);
    setLoading(true);
    
    try {
      // Update last fetch time immediately to prevent duplicates
      lastFetchTimeRef.current = now;
      
      // Dispatch core data fetches
      dispatch(fetchUserData(userId));
      
      // For free users, update usage limits immediately
      // This is critical for accurate question counting
      if (!subscriptionActive) {
        dispatch(fetchUsageLimits(userId));
      }
      
      // Stagger other fetches to reduce API load
      setTimeout(() => {
        dispatch(fetchAchievements());
      }, 1000);
      
      setTimeout(() => {
        dispatch(fetchShopItems());
      }, 2000);
    } catch (error) {
      console.error("[useUserData] Error refreshing data:", error);
    } finally {
      // Ensure loading state is reset after a maximum time
      // This prevents UI getting stuck in loading state
      setTimeout(() => {
        setLoading(false);
      }, 5000);
    }
  }, [userId, subscriptionActive, dispatch]);
  
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

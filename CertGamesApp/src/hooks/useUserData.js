// src/hooks/useUserData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserData, fetchUsageLimits } from '../store/slices/userSlice';

// Create module-level singleton to track initialization across all components
// NOTE: This global state might cause unexpected behavior if multiple instances
// of the hook run concurrently with different user IDs. Consider if this is necessary.
const globalState = {
  initializedUserIds: new Set(), // This doesn't seem to be used?
  pendingFetches: {},
  lastFetchTimes: {
    userData: {},
    usageLimits: {},
  }
};

/**
 * Custom hook for accessing and refreshing user data
 * @param {Object} options - Configuration options
 * @param {boolean} [options.autoFetch=true] - Automatically fetch data on mount if userId exists.
 * @returns {Object} User data and utility functions
 */
const useUserData = (options = {}) => {
  const { autoFetch = true } = options;
  const dispatch = useDispatch();

  // Local states for component using the hook
  const [loading, setLoading] = useState(false); // Local loading state for manual refreshes?
  const [error, setError] = useState(null); // Local error state for manual refreshes?
  const wasInitializedRef = useRef(false); // Tracks if initial fetch completed for this instance

  // Get data from Redux state
  // Using a single selector for the whole user slice is generally fine unless performance becomes an issue
  const userData = useSelector(state => state.user || {}); // Ensure state.user exists
  const shopItems = useSelector(state => state.shop?.items || []); // Safer access
  const allAchievements = useSelector(state => state.achievements?.achievements || []); // Safer access

  // Destructure user data with defaults from Redux state
  const {
    userId = null,
    username = '',
    email = '',
    xp = 0,
    level = 1,
    coins = 0,
    achievements = [], // User's achieved IDs
    xpBoost = 1.0,
    currentAvatar = null,
    nameColor = null,
    purchasedItems = [],
    subscriptionActive = false,
    lastDailyClaim = null,
    subscriptionStatus = null,
    subscriptionPlatform = null,
    lastUpdated = null, // Timestamp from Redux state
    practiceQuestionsRemaining = 0,
    subscriptionType = 'free',
    status // Overall status from Redux state ('idle', 'loading', 'succeeded', 'failed')
    // Add other destructured fields if needed by components using the hook
  } = userData;

  // Function to fetch specific data type, with debouncing via globalState
  const fetchData = useCallback(async (dataType) => {
    if (!userId) {
       console.log(`[useUserData] Skipping fetch (${dataType}): No userId.`);
       return; // No user ID, cannot fetch
    }

    const fetchKey = `${dataType}-${userId}`;

    // Check global pending fetches
    if (globalState.pendingFetches[fetchKey]) {
      console.log(`[useUserData] Already fetching ${dataType} for ${userId.substring(0,8)}..., skipping duplicate.`);
      return;
    }

    // Check throttling based on last fetch time for this user/dataType
    const lastFetch = globalState.lastFetchTimes[dataType]?.[userId] || 0;
    const throttleTime = dataType === 'userData' ? 10 : 10; // Example: Fetch user data max every 5s, limits every 30s
    if (Date.now() - lastFetch < throttleTime) {
        console.log(`[useUserData] Throttled fetch for ${dataType} for ${userId.substring(0,8)}...`);
        // Optionally return existing data or indicate throttled status
        return;
    }


    try {
      globalState.pendingFetches[fetchKey] = true; // Mark as pending globally
      console.log(`[useUserData] Fetching ${dataType} for ${userId.substring(0,8)}...`);
      setLoading(true); // Set local loading for this hook instance

      // Optional small delay (consider if necessary)
      // await new Promise(resolve => setTimeout(resolve, 50));

      if (dataType === 'userData') {
        await dispatch(fetchUserData(userId)).unwrap(); // Use unwrap to catch rejection here
        globalState.lastFetchTimes.userData[userId] = Date.now();
      } else if (dataType === 'usageLimits') {
        // Only fetch usage limits if the user is NOT subscribed
         if (!subscriptionActive) {
             await dispatch(fetchUsageLimits(userId)).unwrap();
             globalState.lastFetchTimes.usageLimits[userId] = Date.now();
         } else {
             console.log(`[useUserData] Skipping usageLimits fetch for subscribed user ${userId.substring(0,8)}...`);
         }
      }
      setError(null); // Clear local error on successful fetch
    } catch (err) {
      // Error from dispatch(action).unwrap() or other issues
      console.error(`[useUserData] Error fetching ${dataType} for ${userId.substring(0,8)}...:`, err);
      // Set local error state for this hook instance
      setError(err.message || (typeof err === 'string' ? err : `Failed to fetch ${dataType}`));
      // NOTE: The global Redux state (state.user.error) will also hold the error from the rejected thunk
    } finally {
      delete globalState.pendingFetches[fetchKey]; // Clear global pending flag
      setLoading(false); // Clear local loading for this hook instance
    }
  }, [userId, dispatch, subscriptionActive]); // Add subscriptionActive dependency

  // Effect for initial data fetch on mount (if autoFetch is true)
  useEffect(() => {
    // Ensure this runs only once per mount per valid userId
    if (!autoFetch || !userId || wasInitializedRef.current) {
      return;
    }

    console.log(`[useUserData] Initial fetch effect running for ${userId.substring(0,8)}...`);
    setLoading(true); // Indicate initial loading for this instance
    wasInitializedRef.current = true; // Mark as initialized for this instance

    const loadInitialData = async () => {
      try {
        // Fetch user data first
        await fetchData('userData');

        // Fetch usage limits slightly later if needed
        // No need for setTimeout here if fetchData handles throttling/logic
        await fetchData('usageLimits');

      } catch (initError) {
          // Catch potential errors from fetchData itself if needed, though it has internal try/catch
          console.error(`[useUserData] Error during initial data load for ${userId.substring(0,8)}...:`, initError);
          setError(initError.message || 'Initial data load failed');
      } finally {
          setLoading(false); // Clear initial loading indicator
      }
    };

    loadInitialData();

  }, [userId, autoFetch, fetchData]); // Dependencies for the initial fetch effect

  // Manual refresh function exposed by the hook
  const refreshData = useCallback(async () => {
    if (!userId) {
        console.warn("[useUserData] refreshData skipped: No userId.");
        return;
    }
    console.log(`[useUserData] Manual refresh triggered for ${userId.substring(0,8)}...`);
    setError(null); // Clear previous local error
    setLoading(true);
    try {
      // Force fetch both data types on manual refresh, respecting throttling within fetchData
      await fetchData('userData');
      await fetchData('usageLimits');
    } catch (refreshError) {
        // This catch might be redundant if fetchData handles errors, but acts as a fallback
        console.error(`[useUserData] Error during manual refresh for ${userId.substring(0,8)}...:`, refreshError);
        setError(refreshError.message || 'Refresh failed');
    } finally {
        setLoading(false);
    }
  }, [userId, fetchData]); // Dependencies for the refresh function

  // Helper function to get avatar URL
  const getAvatarUrl = useCallback(() => {
    if (!currentAvatar || !Array.isArray(shopItems) || shopItems.length === 0) {
      return null; // Return null if no avatar ID or no shop items
    }
    try {
      const avatarItem = shopItems.find(item => item?._id === currentAvatar);
      return avatarItem?.imageUrl || null; // Return URL or null if not found/no URL
    } catch (error) {
      console.error("[useUserData] Error in getAvatarUrl:", error);
      return null;
    }
  }, [currentAvatar, shopItems]); // Dependencies for avatar URL calculation

  // Helper function to get detailed achievement objects for unlocked IDs
  const getUnlockedAchievements = useCallback(() => {
    if (!Array.isArray(achievements) || achievements.length === 0 || !Array.isArray(allAchievements) || allAchievements.length === 0) {
      return []; // Return empty array if no user achievements or no definition list
    }
    try {
      // Filter the master list based on the user's achievement IDs
      return allAchievements.filter(achievement => achievement?.achievementId && achievements.includes(achievement.achievementId));
    } catch (error) {
      console.error("[useUserData] Error in getUnlockedAchievements:", error);
      return [];
    }
  }, [achievements, allAchievements]); // Dependencies

  // Helper function to check if a specific achievement is unlocked
  const isAchievementUnlocked = useCallback((achievementId) => {
    if (!achievementId || !Array.isArray(achievements)) {
      return false;
    }
    try {
      return achievements.includes(achievementId);
    } catch (error) {
      console.error("[useUserData] Error in isAchievementUnlocked:", error);
      return false;
    }
  }, [achievements]); // Dependency

  // Helper function to check premium access (derived from Redux state)
  const hasPremiumAccess = useCallback(() => {
    return subscriptionActive === true;
  }, [subscriptionActive]); // Dependency

  // Helper function to check if practice questions are available
  const hasPracticeQuestionsRemaining = useCallback(() => {
    // Premium users always have access, free users depend on the counter
    return subscriptionActive === true || practiceQuestionsRemaining > 0;
  }, [subscriptionActive, practiceQuestionsRemaining]); // Dependencies

  // Return value of the hook
  return {
    // Raw user data fields from Redux state
    userId,
    username,
    email,
    xp,
    level,
    coins,
    achievements, // Array of achieved IDs
    xpBoost,
    currentAvatar,
    nameColor,
    purchasedItems,
    subscriptionActive,
    lastDailyClaim,
    subscriptionStatus,
    subscriptionPlatform,
    lastUpdated, // Timestamp of last Redux update for user data
    practiceQuestionsRemaining,
    subscriptionType,

    // Related data from other slices
    shopItems, // Full shop items list
    allAchievements, // Full achievements definition list

    // Status indicators
    // isLoading combines local loading (manual refresh) OR Redux loading status
    isLoading: loading || status === 'loading',
    // error combines local error (manual refresh) OR Redux error status
    error: error || userData.error, // Prefer local error if set, otherwise use Redux error
    // Provide direct access to Redux status if needed
    reduxStatus: status,

    // Helper functions / Derived data
    refreshData,
    getAvatarUrl,
    getUnlockedAchievements, // Returns array of full achievement objects
    isAchievementUnlocked, // Takes achievementId, returns boolean
    hasPremiumAccess, // Returns boolean
    hasPracticeQuestionsRemaining // Returns boolean
  };
};

export default useUserData;

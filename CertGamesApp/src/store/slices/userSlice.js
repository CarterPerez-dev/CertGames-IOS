// src/store/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as AuthService from '../../api/authService'; // Assuming this service exists and works
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import apiClient from '../../api/apiClient';
import { API } from '../../api/apiConfig';
import AppleSubscriptionService from '../../api/AppleSubscriptionService';

// --- Async Thunks (Keep As Provided Originally) ---
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      // NOTE: Ensure AuthService.loginUser returns the full user object expected by the fulfilled reducer
      const response = await AuthService.loginUser(credentials);
      if (response && response.success === false) {
        return rejectWithValue(response.error || 'Login failed');
      }
      return response; // Should contain user_id, username, email, etc.
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Network error during login.');
    }
  }
);

export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('No userId provided to fetchUserData');
    try {
      // NOTE: Ensure AuthService.fetchUserData returns the full user object expected by the fulfilled reducer
      const response = await AuthService.fetchUserData(userId);
      return response; // Should contain _id, username, email, etc.
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch user data');
    }
  }
);

export const claimDailyBonus = createAsyncThunk(
  'user/claimDailyBonus',
  async (userId, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('No userId provided to claimDailyBonus');
    try {
      const response = await AuthService.claimDailyBonus(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to claim daily bonus');
    }
  }
);

export const verifyAppleSubscription = createAsyncThunk(
  'user/verifyAppleSubscription',
  async ({ userId, receiptData }, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('No userId provided to verifyAppleSubscription');
    try {
      const response = await apiClient.post(API.SUBSCRIPTION.VERIFY_RECEIPT, {
        userId,
        receiptData,
        platform: 'apple'
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to verify Apple subscription');
    }
  }
);

export const restoreAppleSubscription = createAsyncThunk(
  'user/restoreAppleSubscription',
  async (userId, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('No userId provided to restoreAppleSubscription');
    try {
      const purchaseResult = await AppleSubscriptionService.restorePurchases(userId);
      if (!purchaseResult.success) {
        return rejectWithValue(purchaseResult.message || 'No purchases to restore');
      }
      return purchaseResult; // Contains { success: true, ... }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to restore purchases');
    }
  }
);

export const checkSubscription = createAsyncThunk(
  'user/checkSubscription',
  async (userId, { rejectWithValue, dispatch }) => {
    if (!userId) return rejectWithValue('No userId provided to checkSubscription');
    try {
      const response = await apiClient.get(`${API.SUBSCRIPTION.CHECK_STATUS}?userId=${userId}`);
      if (Platform.OS === 'ios') {
        try {
          // This checks local device status, response might not be directly used here
          await AppleSubscriptionService.checkSubscriptionStatus(userId);
        } catch (error) {
          console.log('Local receipt verification during checkSubscription failed (non-fatal):', error.message);
        }
      }
      return response.data; // Backend status is the source of truth here
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to check subscription status');
    }
  }
);

export const fetchUsageLimits = createAsyncThunk(
  'user/fetchUsageLimits',
  async (userId, { rejectWithValue, getState }) => {
    if (!userId) return rejectWithValue('No userId provided to fetchUsageLimits');
    const state = getState();
    const lastUsageLimitsFetch = state.user.lastUsageLimitsUpdate || 0;
    const now = Date.now();
    if (now - lastUsageLimitsFetch < 500) { // Throttle check
      console.log("Skipping usage limits fetch - throttled");
      // Return current state values to avoid disrupting things
      return {
        practiceQuestionsRemaining: state.user.practiceQuestionsRemaining,
        subscriptionType: state.user.subscriptionType
      };
    }
    try {
      console.log("Fetching usage limits for:", userId ? userId.substring(0,8) + '...' : 'null');
      const response = await apiClient.get(`${API.USER.USAGE_LIMITS(userId)}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching usage limits:", error.message);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch usage limits');
    }
  }
);

export const decrementQuestions = createAsyncThunk(
  'user/decrementQuestions',
  async (userId, { rejectWithValue, getState, dispatch }) => {
    if (!userId) return rejectWithValue('No userId provided to decrementQuestions');
    const state = getState();
    const currentRemaining = state.user.practiceQuestionsRemaining;

    if (!state.user.subscriptionActive && currentRemaining > 0) {
        // Immediately update local state for responsiveness
        dispatch(decrementPracticeQuestions());

        const lastUpdate = state.user.lastUsageLimitsUpdate || 0;
        const now = Date.now();
        if (now - lastUpdate < 1000) { // Debounce server call
            console.log("Skipping server decrement - throttled");
            return { practiceQuestionsRemaining: currentRemaining - 1 };
        }
        try {
            console.log("Decrementing practice questions count on server for:", userId ? userId.substring(0,8) + '...' : 'null');
            const response = await apiClient.post(`${API.USER.DECREMENT_QUESTIONS(userId)}`);
            return response.data; // Contains updated practiceQuestionsRemaining
        } catch (error) {
            console.error("Error decrementing questions on server:", error.message);
            // NOTE: Local state was already decremented. Consider if you need to revert it on error.
            return rejectWithValue(error.response?.data?.error || error.message || 'Failed to update question count on server');
        }
    } else {
        console.log("Decrement skipped: User is subscribed or no questions remaining.");
        // Return current state if no decrement happens
        return { practiceQuestionsRemaining: currentRemaining };
    }
  }
);
// --- End Async Thunks ---


// Initial state definition
const initialState = {
  userId: null,
  username: '',
  email: '',
  xp: 0,
  level: 1,
  coins: 0,
  achievements: [],
  needsUsername: false, // Important for navigation flow
  oauth_provider: null, // Store provider if coming from OAuth needing username
  xpBoost: 1.0,
  currentAvatar: null,
  nameColor: null,
  purchasedItems: [],
  subscriptionActive: false,
  subscriptionStatus: null, // e.g., 'active', 'expired', 'trial'
  subscriptionPlatform: null, // 'apple', 'google', 'stripe'
  lastDailyClaim: null,
  appleTransactionId: null,
  lastUpdated: null, // Timestamp for general data updates
  practiceQuestionsRemaining: 100, // Default for free users
  subscriptionType: 'free', // 'free', 'premium' etc.
  lastUsageLimitsUpdate: null, // Timestamp for throttling usage limit checks
  usageLimitsStatus: 'idle', // 'idle', 'loading', 'failed' for usage limit fetches
  usageLimitsError: null,
  status: 'idle', // Overall status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null, // General error message
};

// Helper function to calculate level from XP
function calculateLevelFromXP(xp) {
  xp = Number(xp) || 0; // Ensure xp is a number
  if (xp <= 0) return 1; // Changed from < 0 to <= 0 for clarity
  if (xp < 500) return 1;
  if (xp < 1000) return 2;
  if (xp < 14500) return Math.floor((xp - 500) / 500) + 2;
  if (xp < 37000) return Math.floor((xp - 14500) / 750) + 30;
  if (xp < 77000) return Math.floor((xp - 37000) / 1000) + 60;
  return Math.floor((xp - 77000) / 1500) + 100;
}

// Slice Definition
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // --- MODIFIED setUser Reducer ---
    // Use this for direct, synchronous state updates (like after registration/free choice)
    setUser: (state, action) => {
      const userData = action.payload || {}; // Ensure payload exists
      console.log('[userSlice] setUser reducer executing. Payload:', userData);

      // Update state fields based on payload, keeping existing state if payload field is undefined
      state.userId = userData.user_id || userData._id || state.userId;
      state.username = userData.username !== undefined ? userData.username : state.username;
      state.email = userData.email !== undefined ? userData.email : state.email;
      state.needsUsername = userData.needsUsername !== undefined ? userData.needsUsername : (userData.needs_username !== undefined ? userData.needs_username : state.needsUsername);
      state.oauth_provider = userData.oauth_provider || state.oauth_provider; // Keep existing if not provided
      state.xp = userData.xp !== undefined ? Number(userData.xp) : state.xp;
      state.level = userData.level !== undefined ? Number(userData.level) : calculateLevelFromXP(state.xp);
      state.coins = userData.coins !== undefined ? Number(userData.coins) : state.coins;
      state.achievements = userData.achievements || state.achievements;
      state.xpBoost = userData.xpBoost !== undefined ? Number(userData.xpBoost) : state.xpBoost;
      state.currentAvatar = userData.currentAvatar !== undefined ? userData.currentAvatar : state.currentAvatar;
      state.nameColor = userData.nameColor !== undefined ? userData.nameColor : state.nameColor;
      state.purchasedItems = userData.purchasedItems || state.purchasedItems;
      state.subscriptionActive = userData.subscriptionActive !== undefined ? Boolean(userData.subscriptionActive) : state.subscriptionActive;
      state.lastDailyClaim = userData.lastDailyClaim || state.lastDailyClaim;
      state.practiceQuestionsRemaining = userData.practiceQuestionsRemaining !== undefined ? Number(userData.practiceQuestionsRemaining) : state.practiceQuestionsRemaining;
      state.subscriptionType = userData.subscriptionType || state.subscriptionType;
      // Avoid overwriting detailed status from thunks if not explicitly provided
      state.subscriptionStatus = userData.subscriptionStatus !== undefined ? userData.subscriptionStatus : state.subscriptionStatus;
      state.subscriptionPlatform = userData.subscriptionPlatform !== undefined ? userData.subscriptionPlatform : state.subscriptionPlatform;
      state.appleTransactionId = userData.appleTransactionId !== undefined ? userData.appleTransactionId : state.appleTransactionId;

      // -- Start Atomic State Update for Readiness --
      // Set status to 'idle' signifying the user data is set and potentially ready for navigation
      // Only change status if it's not already 'loading' from a thunk
      if (state.status !== 'loading') {
          state.status = 'idle';
      }
      state.error = null; // Clear general errors when user data is successfully set
      // Optionally reset usage limit status as well, assuming setUser means a fresh state
      state.usageLimitsStatus = 'idle';
      state.usageLimitsError = null;
      // -- End Atomic State Update --

      state.lastUpdated = Date.now();
      console.log('[userSlice] setUser reducer finished. New state snippet:', { userId: state.userId, needsUsername: state.needsUsername, status: state.status });
    },
    // --- End MODIFIED setUser Reducer ---

    // Set only the current user ID, used during initial OAuth checks maybe
    setCurrentUserId: (state, action) => {
        console.log(`[userSlice] setCurrentUserId reducer executing. Payload: ${action.payload}`);
        if (action.payload) {
            state.userId = action.payload;
            // Potentially reset needsUsername if only ID is being set? Depends on flow.
            // state.needsUsername = false;
            // Set status to idle if not loading, as we now have an ID
             if (state.status !== 'loading') {
               state.status = 'idle';
             }
        } else {
            // If payload is null/undefined, treat as logout? Or just clear ID?
             state.userId = null;
        }
    },

    logout: (state) => {
      console.log('[userSlice] logout reducer executing.');
      const defaultState = { ...initialState }; // Get a fresh copy of initial state
      Object.keys(defaultState).forEach(key => { // Reset each key
        state[key] = defaultState[key];
      });
      SecureStore.deleteItemAsync('userId').catch(e => console.error("Failed to clear userId on logout", e));
      console.log('[userSlice] State reset to initial.');
    },

    updateCoins: (state, action) => {
      if (typeof action.payload === 'number') {
        state.coins = action.payload;
        state.lastUpdated = Date.now();
      }
    },

    updateXp: (state, action) => {
      if (typeof action.payload === 'number') {
        state.xp = action.payload;
        state.level = calculateLevelFromXP(action.payload);
        state.lastUpdated = Date.now();
      }
    },

    setXPAndCoins: (state, action) => {
      const { xp, coins, newlyUnlocked } = action.payload || {};
      let levelChanged = false;

      if (typeof xp === 'number') {
        const newLevel = calculateLevelFromXP(xp);
        if (newLevel !== state.level) {
          state.level = newLevel;
          levelChanged = true;
        }
        state.xp = xp;
      }
      if (typeof coins === 'number') {
        state.coins = coins;
      }
      if (Array.isArray(newlyUnlocked) && newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(achievementId => {
          if (!state.achievements.includes(achievementId)) {
            state.achievements.push(achievementId);
          }
        });
      }
      // Only update timestamp if something actually changed
      if (typeof xp === 'number' || typeof coins === 'number' || (Array.isArray(newlyUnlocked) && newlyUnlocked.length > 0) || levelChanged) {
         state.lastUpdated = Date.now();
      }
    },

    clearAuthErrors: (state) => {
      state.error = null;
      // Reset status only if failed, otherwise leave loading/succeeded intact
      if (state.status === 'failed') {
        state.status = 'idle';
      }
    },

    decrementPracticeQuestions: (state) => {
      // This reducer only handles the synchronous state update
      if (!state.subscriptionActive && state.practiceQuestionsRemaining > 0) {
        state.practiceQuestionsRemaining -= 1;
        state.lastUsageLimitsUpdate = Date.now(); // Track time of local decrement
      }
    },

    resetApiStatus: (state) => {
      console.log('[userSlice] resetApiStatus reducer executing.');
      state.status = 'idle';
      state.usageLimitsStatus = 'idle';
      state.error = null;
      state.usageLimitsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- LOGIN ---
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear previous error
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const payload = action.payload || {};
        // Map ALL relevant fields, falling back to current state or initial state if needed
        state.userId = payload.user_id || state.userId; // Keep existing if somehow missing in payload
        state.username = payload.username !== undefined ? payload.username : state.username;
        state.email = payload.email !== undefined ? payload.email : state.email;
        state.needsUsername = payload.needsUsername !== undefined ? payload.needsUsername : (payload.needs_username !== undefined ? payload.needs_username : false); // Default to false on login
        state.oauth_provider = payload.oauth_provider || null; // Reset on manual login
        state.coins = payload.coins !== undefined ? Number(payload.coins) : state.coins;
        state.xp = payload.xp !== undefined ? Number(payload.xp) : state.xp;
        state.level = payload.level !== undefined ? Number(payload.level) : calculateLevelFromXP(state.xp);
        state.achievements = payload.achievements || state.achievements;
        state.xpBoost = payload.xpBoost !== undefined ? Number(payload.xpBoost) : state.xpBoost;
        state.currentAvatar = payload.currentAvatar !== undefined ? payload.currentAvatar : state.currentAvatar;
        state.nameColor = payload.nameColor !== undefined ? payload.nameColor : state.nameColor;
        state.purchasedItems = payload.purchasedItems || state.purchasedItems;
        state.subscriptionActive = payload.subscriptionActive !== undefined ? Boolean(payload.subscriptionActive) : state.subscriptionActive;
        state.lastDailyClaim = payload.lastDailyClaim || state.lastDailyClaim;
        state.practiceQuestionsRemaining = payload.practiceQuestionsRemaining !== undefined ? Number(payload.practiceQuestionsRemaining) : initialState.practiceQuestionsRemaining;
        state.subscriptionType = payload.subscriptionType || 'free'; // Default to free if missing
        state.subscriptionStatus = payload.subscriptionStatus !== undefined ? payload.subscriptionStatus : state.subscriptionStatus;
        state.subscriptionPlatform = payload.subscriptionPlatform !== undefined ? payload.subscriptionPlatform : state.subscriptionPlatform;
        state.appleTransactionId = payload.appleTransactionId !== undefined ? payload.appleTransactionId : state.appleTransactionId;

        state.lastUpdated = Date.now();
        state.error = null; // Clear error on success
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed'; // Use payload error or a generic one
        // Optional: Reset userId if login fails?
        // state.userId = null;
      })

      // --- FETCH USER DATA ---
      .addCase(fetchUserData.pending, (state) => {
         // Set loading only if not already loading/succeeded to prevent UI flicker if data is already present
        if (state.status !== 'loading' && state.status !== 'succeeded') {
            state.status = 'loading';
        }
        // Do not clear error here, let fulfilled/rejected handle it
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const userData = action.payload || {};
        // Map ALL fields from payload
        state.userId = userData._id || state.userId; // Prefer _id from fetch
        state.username = userData.username !== undefined ? userData.username : state.username;
        state.email = userData.email !== undefined ? userData.email : state.email;
        state.needsUsername = userData.needs_username === true; // Explicitly check boolean
        state.oauth_provider = userData.oauth_provider || state.oauth_provider; // Preserve if set
        state.xp = userData.xp !== undefined ? Number(userData.xp) : state.xp;
        state.level = userData.level !== undefined ? Number(userData.level) : calculateLevelFromXP(state.xp);
        state.coins = userData.coins !== undefined ? Number(userData.coins) : state.coins;
        state.achievements = userData.achievements || state.achievements;
        state.xpBoost = userData.xpBoost !== undefined ? Number(userData.xpBoost) : state.xpBoost;
        state.currentAvatar = userData.currentAvatar !== undefined ? userData.currentAvatar : state.currentAvatar;
        state.nameColor = userData.nameColor !== undefined ? userData.nameColor : state.nameColor;
        state.purchasedItems = userData.purchasedItems || state.purchasedItems;
        state.subscriptionActive = userData.subscriptionActive === true; // Explicitly check boolean
        state.subscriptionStatus = userData.subscriptionStatus || state.subscriptionStatus;
        state.subscriptionPlatform = userData.subscriptionPlatform || state.subscriptionPlatform;
        state.lastDailyClaim = userData.lastDailyClaim || state.lastDailyClaim;
        state.appleTransactionId = userData.appleTransactionId || state.appleTransactionId;
        // These might come from subscription checks rather than user data fetch?
        // state.subscriptionStartDate = userData.subscriptionStartDate || state.subscriptionStartDate;
        // state.subscriptionEndDate = userData.subscriptionEndDate || state.subscriptionEndDate;
        state.practiceQuestionsRemaining = userData.practiceQuestionsRemaining !== undefined ? Number(userData.practiceQuestionsRemaining) : state.practiceQuestionsRemaining;
        state.subscriptionType = userData.subscriptionType || state.subscriptionType;

        state.lastUpdated = Date.now();
        state.error = null; // Clear error on success
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch data';
        state.lastUpdated = Date.now(); // Still update timestamp
      })

      // --- Other extraReducers ---
      .addCase(claimDailyBonus.fulfilled, (state, action) => {
        if (action.payload?.success) { // Check payload structure
          state.coins = action.payload.newCoins !== undefined ? action.payload.newCoins : state.coins;
          state.xp = action.payload.newXP !== undefined ? action.payload.newXP : state.xp;
          state.level = calculateLevelFromXP(state.xp); // Recalculate level
          state.lastDailyClaim = action.payload.newLastDailyClaim || state.lastDailyClaim;
          if (Array.isArray(action.payload.newlyUnlocked) && action.payload.newlyUnlocked.length > 0) {
            action.payload.newlyUnlocked.forEach(id => {
              if (!state.achievements.includes(id)) state.achievements.push(id);
            });
          }
          state.lastUpdated = Date.now();
        }
        // Don't change overall 'status' for daily bonus
      })
      .addCase(verifyAppleSubscription.fulfilled, (state, action) => {
        if (action.payload?.success) {
          state.subscriptionActive = Boolean(action.payload.subscriptionActive);
          state.subscriptionStatus = action.payload.subscriptionStatus || null;
          state.subscriptionPlatform = 'apple';
          state.appleTransactionId = action.payload.transaction_id || state.appleTransactionId;
          state.subscriptionType = state.subscriptionActive ? 'premium' : 'free'; // Update type based on status
        }
        // Don't change overall 'status'
      })
      .addCase(restoreAppleSubscription.fulfilled, (state, action) => {
        if (action.payload?.success) {
          state.subscriptionActive = true;
          state.subscriptionStatus = 'active'; // Assume active on successful restore
          state.subscriptionPlatform = 'apple';
          state.subscriptionType = 'premium';
        }
        // Don't change overall 'status'
      })
      .addCase(checkSubscription.fulfilled, (state, action) => {
        state.subscriptionActive = Boolean(action.payload?.subscriptionActive);
        state.subscriptionStatus = action.payload?.subscriptionStatus || null;
        state.subscriptionPlatform = action.payload?.subscriptionPlatform || state.subscriptionPlatform; // Keep if already set
        state.subscriptionType = state.subscriptionActive ? 'premium' : 'free';
        // Set status to idle only if not already succeeded (e.g., after login)
        if (state.status !== 'succeeded') {
          state.status = 'idle';
        }
      })
      .addCase(fetchUsageLimits.pending, (state) => {
        state.usageLimitsStatus = 'loading';
        state.usageLimitsError = null;
      })
      .addCase(fetchUsageLimits.fulfilled, (state, action) => {
        state.practiceQuestionsRemaining = action.payload?.practiceQuestionsRemaining !== undefined ? action.payload.practiceQuestionsRemaining : state.practiceQuestionsRemaining;
        state.subscriptionType = action.payload?.subscriptionType || state.subscriptionType;
        state.usageLimitsStatus = 'idle';
        state.lastUsageLimitsUpdate = Date.now();
      })
      .addCase(fetchUsageLimits.rejected, (state, action) => {
        state.usageLimitsError = action.payload || 'Failed to fetch limits';
        state.usageLimitsStatus = 'failed';
        // Reset overall status only if it was specifically waiting for this
        // if (state.status === 'loading' && state.usageLimitsStatus === 'failed') state.status = 'idle'; // Might be too aggressive
      })
      .addCase(decrementQuestions.pending, (state) => {
        // Local state already updated, maybe indicate server update?
        // state.usageLimitsStatus = 'loading'; // Or maybe 'updating'?
      })
      .addCase(decrementQuestions.fulfilled, (state, action) => {
        // Server confirmed the update, update from server response if needed
        state.practiceQuestionsRemaining = action.payload?.practiceQuestionsRemaining !== undefined ? action.payload.practiceQuestionsRemaining : state.practiceQuestionsRemaining;
        state.lastUsageLimitsUpdate = Date.now(); // Record server confirmation time
        state.usageLimitsStatus = 'idle';
        state.usageLimitsError = null;
      })
      .addCase(decrementQuestions.rejected, (state, action) => {
        // Server update failed. Local state is already decremented.
        // Log error, maybe show a warning to the user?
        state.usageLimitsError = action.payload || 'Failed to sync question count';
        state.usageLimitsStatus = 'failed';
        // Consider if local state should be reverted? Depends on requirements.
      });
  },
});

// Export actions and reducer
export const {
  setUser,
  setCurrentUserId, // Export the new action if needed elsewhere
  logout,
  updateCoins,
  updateXp,
  setXPAndCoins,
  clearAuthErrors,
  decrementPracticeQuestions,
  resetApiStatus
} = userSlice.actions;

export default userSlice.reducer;

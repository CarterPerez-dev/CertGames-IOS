// src/store/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as AuthService from '../../api/authService';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import apiClient from '../../api/apiClient';
import { API } from '../../api/apiConfig';
import AppleSubscriptionService from '../../api/AppleSubscriptionService';

// Async thunks
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.loginUser(credentials);
      
      // Check if it's an auth error response
      if (response && response.success === false) {
        return rejectWithValue(response.error);
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Network error. Please try again.');
    }
  }
);

export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await AuthService.fetchUserData(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user data');
    }
  }
);

export const claimDailyBonus = createAsyncThunk(
  'user/claimDailyBonus',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await AuthService.claimDailyBonus(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to claim daily bonus');
    }
  }
);

export const verifyAppleSubscription = createAsyncThunk(
  'user/verifyAppleSubscription',
  async ({ userId, receiptData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API.SUBSCRIPTION.VERIFY_RECEIPT, {
        userId,
        receiptData,
        platform: 'apple'
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to verify Apple subscription');
    }
  }
);

export const restoreAppleSubscription = createAsyncThunk(
  'user/restoreAppleSubscription',
  async (userId, { rejectWithValue }) => {
    try {
      // First try to get available purchases from device
      const purchaseResult = await AppleSubscriptionService.restorePurchases(userId);
      
      if (!purchaseResult.success) {
        return rejectWithValue(purchaseResult.message || 'No purchases to restore');
      }
      
      return purchaseResult;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to restore purchases');
    }
  }
);

export const checkSubscription = createAsyncThunk(
  'user/checkSubscription',
  async (userId, { rejectWithValue, dispatch }) => {
    try {
      // Check subscription status with backend
      const response = await apiClient.get(`${API.SUBSCRIPTION.CHECK_STATUS}?userId=${userId}`);
      
      // On iOS, also verify with local receipt if available
      if (Platform.OS === 'ios') {
        try {
          await AppleSubscriptionService.checkSubscriptionStatus(userId);
        } catch (error) {
          console.log('Local receipt verification failed:', error);
          // This isn't fatal, continue with backend status
        }
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check subscription status');
    }
  }
);

// NEW: Fetch usage limits for freemium model
export const fetchUsageLimits = createAsyncThunk(
  'user/fetchUsageLimits',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`${API.USER.USAGE_LIMITS(userId)}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch usage limits');
    }
  }
);

// NEW: Decrement practice questions count for free users
export const decrementQuestions = createAsyncThunk(
  'user/decrementQuestions',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`${API.USER.DECREMENT_QUESTIONS(userId)}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update question count');
    }
  }
);

// Initial state
const initialState = {
  userId: null,
  username: '',
  email: '',
  xp: 0,
  level: 1,
  coins: 0,
  achievements: [],
  needsUsername: false,
  xpBoost: 1.0,
  currentAvatar: null,
  nameColor: null,
  purchasedItems: [],
  subscriptionActive: false,
  subscriptionStatus: null,
  subscriptionPlatform: null,
  lastDailyClaim: null,
  appleTransactionId: null,
  lastUpdated: null, // Added for sync tracking
  // Added freemium fields
  practiceQuestionsRemaining: 100,
  subscriptionType: 'free',  
  // Status flags
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Helper function to calculate level from XP
// Note: This should match your backend logic for calculating levels
function calculateLevelFromXP(xp) {
  // Basic level calculation
  if (xp < 0) return 1;
  
  if (xp < 500) return 1;
  if (xp < 1000) return 2;
  
  // For levels 3-30: 500 XP per level
  if (xp < 14500) { // 500 + 14000 (29*500 for levels 3-30)
    return Math.floor((xp - 500) / 500) + 2;
  }
  
  // For levels 31-60: 750 XP per level
  if (xp < 37000) { // 14500 + 22500 (30*750 for levels 31-60)
    return Math.floor((xp - 14500) / 750) + 30;
  }
  
  // For levels 61-100: 1000 XP per level
  if (xp < 77000) { // 37000 + 40000 (40*1000 for levels 61-100)
    return Math.floor((xp - 37000) / 1000) + 60;
  }
  
  // For levels 101+: 1500 XP per level
  return Math.floor((xp - 77000) / 1500) + 100;
}

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Synchronous reducers
    setUser: (state, action) => {
      const userData = action.payload;
      state.userId = userData.user_id || userData._id;
      state.username = userData.username || '';
      state.email = userData.email || '';
      state.needsUsername = userData.needsUsername || userData.needs_username || false;
      state.xp = userData.xp || 0;
      state.level = userData.level || 1;
      state.coins = userData.coins || 0;
      state.achievements = userData.achievements || [];
      state.xpBoost = userData.xpBoost || 1.0;
      state.currentAvatar = userData.currentAvatar || null;
      state.nameColor = userData.nameColor || null;
      state.purchasedItems = userData.purchasedItems || [];
      state.subscriptionActive = userData.subscriptionActive || false;
      state.lastDailyClaim = userData.lastDailyClaim || null;
      state.practiceQuestionsRemaining = userData.practiceQuestionsRemaining || 100;
      state.subscriptionType = userData.subscriptionType || 'free';
    },
    
    logout: (state) => {
      // Reset to initial state
      Object.assign(state, initialState);
      // Clear storage
      SecureStore.deleteItemAsync('userId');
    },
    
    updateCoins: (state, action) => {
      state.coins = action.payload;
      state.lastUpdated = Date.now(); // Add timestamp
    },
    
    updateXp: (state, action) => {
      state.xp = action.payload;
      // Recalculate level based on new XP
      state.level = calculateLevelFromXP(action.payload);
      state.lastUpdated = Date.now(); // Add timestamp
    },
    
    setXPAndCoins: (state, action) => {
      const { xp, coins, newlyUnlocked } = action.payload;
      
      // Update XP and coins directly
      if (typeof xp === 'number') {
        state.xp = xp;
        // Recalculate level based on new XP
        const newLevel = calculateLevelFromXP(xp);
        if (newLevel !== state.level) {
          state.level = newLevel;
        }
      }
      
      if (typeof coins === 'number') state.coins = coins;
      
      // Add any new achievements to the array
      if (newlyUnlocked && Array.isArray(newlyUnlocked) && newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(achievementId => {
          if (!state.achievements.includes(achievementId)) {
            state.achievements.push(achievementId);
          }
        });
      }
      
      // Add timestamp to trigger subscription updates
      state.lastUpdated = Date.now();
    },
    
    // Add this new reducer
    clearAuthErrors: (state) => {
      state.error = null;
      state.status = 'idle';
    },
    
    // NEW: Update practice questions remaining manually
    decrementPracticeQuestions: (state) => {
      if (state.practiceQuestionsRemaining > 0) {
        state.practiceQuestionsRemaining -= 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userId = action.payload.user_id || null;
        state.username = action.payload.username || '';
        state.email = action.payload.email || '';
        state.needsUsername = action.payload.needsUsername || action.payload.needs_username || false;
        state.coins = action.payload.coins || 0;
        state.xp = action.payload.xp || 0;
        state.level = action.payload.level || 1;
        state.achievements = action.payload.achievements || [];
        state.xpBoost = action.payload.xpBoost || 1.0;
        state.currentAvatar = action.payload.currentAvatar || null;
        state.nameColor = action.payload.nameColor || null;
        state.purchasedItems = action.payload.purchasedItems || [];
        state.subscriptionActive = action.payload.subscriptionActive || false;
        state.lastDailyClaim = action.payload.lastDailyClaim || null;
        state.lastUpdated = Date.now(); // Add timestamp
        state.practiceQuestionsRemaining = action.payload.practiceQuestionsRemaining || 100;
        state.subscriptionType = action.payload.subscriptionType || 'free';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // FETCH USER DATA
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const userData = action.payload;
        state.userId = userData._id || null;
        state.username = userData.username || '';
        state.email = userData.email || '';
        state.needsUsername = action.payload.needs_username === true;
        state.xp = userData.xp || 0;
        state.level = userData.level || 1;
        state.coins = userData.coins || 0;
        state.achievements = userData.achievements || [];
        state.xpBoost = userData.xpBoost || 1.0;
        state.currentAvatar = userData.currentAvatar || null;
        state.nameColor = userData.nameColor || null;
        state.purchasedItems = userData.purchasedItems || [];
        state.subscriptionActive = userData.subscriptionActive === true;
        state.subscriptionStatus = userData.subscriptionStatus || null;
        state.subscriptionPlatform = userData.subscriptionPlatform || null;
        state.lastDailyClaim = userData.lastDailyClaim || null;
        state.appleTransactionId = userData.appleTransactionId || null;
        state.subscriptionStartDate = userData.subscriptionStartDate || null;
        state.subscriptionEndDate = userData.subscriptionEndDate || null;
        state.lastUpdated = Date.now(); // Add timestamp
        state.practiceQuestionsRemaining = userData.practiceQuestionsRemaining || 100;
        state.subscriptionType = userData.subscriptionType || 'free';
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // DAILY BONUS
      .addCase(claimDailyBonus.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.coins = action.payload.newCoins || state.coins;
          state.xp = action.payload.newXP || state.xp;
          state.lastDailyClaim = action.payload.newLastDailyClaim || state.lastDailyClaim;
          
          // Recalculate level based on new XP
          const newLevel = calculateLevelFromXP(action.payload.newXP || state.xp);
          if (newLevel !== state.level) {
            state.level = newLevel;
          }
          
          // If there are newly unlocked achievements
          if (action.payload.newlyUnlocked && action.payload.newlyUnlocked.length > 0) {
            // Add the new achievements to the array if they don't already exist
            action.payload.newlyUnlocked.forEach(achievementId => {
              if (!state.achievements.includes(achievementId)) {
                state.achievements.push(achievementId);
              }
            });
          }
          
          state.lastUpdated = Date.now(); // Add timestamp
        }
      })
      
      // APPLE SUBSCRIPTION VERIFICATION
      .addCase(verifyAppleSubscription.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.subscriptionActive = Boolean(action.payload.subscriptionActive);
          state.subscriptionStatus = action.payload.subscriptionStatus || null;
          state.subscriptionPlatform = 'apple';
          state.appleTransactionId = action.payload.transaction_id || null;
        }
      })
      
      // RESTORE APPLE SUBSCRIPTION
      .addCase(restoreAppleSubscription.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.subscriptionActive = true;
          state.subscriptionStatus = 'active';
          state.subscriptionPlatform = 'apple';
        }
      })
      
      // CHECK SUBSCRIPTION STATUS
      .addCase(checkSubscription.fulfilled, (state, action) => {
        state.subscriptionActive = Boolean(action.payload.subscriptionActive);
        state.subscriptionStatus = action.payload.subscriptionStatus || null;
        state.subscriptionPlatform = action.payload.subscriptionPlatform || null;
        state.status = 'idle';
      })
      
      // NEW: Fetch usage limits
      .addCase(fetchUsageLimits.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsageLimits.fulfilled, (state, action) => {
        state.practiceQuestionsRemaining = action.payload.practiceQuestionsRemaining;
        state.subscriptionType = action.payload.subscriptionType;
        state.status = 'idle';
      })
      .addCase(fetchUsageLimits.rejected, (state, action) => {
        state.error = action.payload;
        state.status = 'failed';
      })
      
      // NEW: Decrement questions
      .addCase(decrementQuestions.fulfilled, (state, action) => {
        state.practiceQuestionsRemaining = action.payload.practiceQuestionsRemaining;
      })
      .addCase(decrementQuestions.rejected, (state, action) => {
        // Handle error but don't change question count if API call fails
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { 
  setUser, 
  logout, 
  updateCoins, 
  updateXp, 
  setXPAndCoins, 
  clearAuthErrors,
  decrementPracticeQuestions 
} = userSlice.actions;

export default userSlice.reducer;

// src/store/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as AuthService from '../../api/authService';
import * as SecureStore from 'expo-secure-store';

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

// Initial state
const initialState = {
  userId: null,
  username: '',
  email: '',
  xp: 0,
  level: 1,
  coins: 0,
  achievements: [],
  xpBoost: 1.0,
  currentAvatar: null,
  nameColor: null,
  purchasedItems: [],
  subscriptionActive: false,
  lastDailyClaim: null,
  
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
      state.username = userData.username;
      state.email = userData.email || '';
      state.xp = userData.xp || 0;
      state.level = userData.level || 1;
      state.coins = userData.coins || 0;
      state.achievements = userData.achievements || [];
      state.xpBoost = userData.xpBoost || 1.0;
      state.currentAvatar = userData.currentAvatar;
      state.nameColor = userData.nameColor;
      state.purchasedItems = userData.purchasedItems || [];
      state.subscriptionActive = userData.subscriptionActive || false;
    },
    
    logout: (state) => {
      // Reset to initial state
      Object.assign(state, initialState);
      // Clear storage
      SecureStore.deleteItemAsync('userId');
    },
    
    updateCoins: (state, action) => {
      state.coins = action.payload;
    },
    
    updateXp: (state, action) => {
      state.xp = action.payload;
      // Recalculate level based on new XP
      state.level = calculateLevelFromXP(action.payload);
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
    },
    
    // Add this new reducer
    clearAuthErrors: (state) => {
      state.error = null;
      state.status = 'idle';
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
        state.userId = action.payload.user_id;
        state.username = action.payload.username;
        state.email = action.payload.email || '';
        state.coins = action.payload.coins || 0;
        state.xp = action.payload.xp || 0;
        state.level = action.payload.level || 1;
        state.achievements = action.payload.achievements || [];
        state.xpBoost = action.payload.xpBoost || 1.0;
        state.currentAvatar = action.payload.currentAvatar;
        state.nameColor = action.payload.nameColor;
        state.purchasedItems = action.payload.purchasedItems || [];
        state.subscriptionActive = action.payload.subscriptionActive || false;
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
        state.userId = userData._id;
        state.username = userData.username;
        state.email = userData.email || '';
        state.xp = userData.xp || 0;
        state.level = userData.level || 1;
        state.coins = userData.coins || 0;
        state.achievements = userData.achievements || [];
        state.xpBoost = userData.xpBoost || 1.0;
        state.currentAvatar = userData.currentAvatar;
        state.nameColor = userData.nameColor;
        state.purchasedItems = userData.purchasedItems || [];
        state.subscriptionActive = userData.subscriptionActive || false;
        state.lastDailyClaim = userData.lastDailyClaim;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // DAILY BONUS
      .addCase(claimDailyBonus.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.coins = action.payload.newCoins;
          state.xp = action.payload.newXP;
          state.lastDailyClaim = action.payload.newLastDailyClaim;
          
          // Recalculate level based on new XP
          const newLevel = calculateLevelFromXP(action.payload.newXP);
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
        }
      });
  },
});

// Export actions and reducer
export const { setUser, logout, updateCoins, updateXp, setXPAndCoins, clearAuthErrors } = userSlice.actions;
export default userSlice.reducer;

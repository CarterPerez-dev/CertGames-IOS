// src/store/slices/networkSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchUserData, checkSubscription } from './userSlice';
import { fetchShopItems } from './shopSlice';
import { fetchAchievements } from './achievementsSlice';

// Define the refreshAppData thunk
export const refreshAppData = createAsyncThunk(
  'network/refreshAppData',
  async (_, { dispatch, getState }) => {
    const { user } = getState();
    const userId = user.userId;
    
    // Create an array of promises to track all refresh operations
    const refreshPromises = [];
    
    // Only fetch user-specific data if there's a logged in user
    if (userId) {
      // Core user data
      refreshPromises.push(dispatch(fetchUserData(userId)));
      
      // Check subscription status
      refreshPromises.push(dispatch(checkSubscription(userId)));
    }
    
    // Always refresh these global data sources regardless of login status
    refreshPromises.push(dispatch(fetchShopItems()));
    refreshPromises.push(dispatch(fetchAchievements()));
    
    // Wait for all refresh operations to complete
    await Promise.allSettled(refreshPromises);
    
    return { success: true };
  }
);

// Your existing slice definition
const networkSlice = createSlice({
  name: 'network',
  initialState: {
    isOffline: false,
    serverError: false,
    lastOnlineTimestamp: Date.now(),
    refreshing: false, // Add this to track refresh state
  },
  reducers: {
    setOfflineStatus: (state, action) => {
      state.isOffline = action.payload;
      if (!action.payload) {
        state.lastOnlineTimestamp = Date.now();
      }
    },
    setServerError: (state, action) => {
      state.serverError = action.payload;
    },
    clearErrors: (state) => {
      state.serverError = false;
    }
  },
  // Add extraReducers to handle the thunk action states
  extraReducers: (builder) => {
    builder
      .addCase(refreshAppData.pending, (state) => {
        state.refreshing = true;
      })
      .addCase(refreshAppData.fulfilled, (state) => {
        state.refreshing = false;
        state.isOffline = false; // Successfully refreshed, so we're online
        state.serverError = false; // Clear server errors on successful refresh
      })
      .addCase(refreshAppData.rejected, (state) => {
        state.refreshing = false;
        // Don't change error states here - let the API calls set those if they fail
      });
  }
});

// Export all actions
export const { setOfflineStatus, setServerError, clearErrors } = networkSlice.actions;

// Export the reducer
export default networkSlice.reducer;

// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import shopReducer from './slices/shopSlice';
import achievementsReducer from './slices/achievementsSlice';
import networkReducer from './slices/networkSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    shop: shopReducer,
    achievements: achievementsReducer,
    network: networkReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the Redux state
        ignoredActions: [
          'user/fetchUserData/fulfilled',
          'user/claimDailyBonus/fulfilled',
          'user/setXPAndCoins'  // Add this to support our real-time updates
        ],
        ignoredPaths: [
          'user.lastDailyClaim',
        ],
      },
    }),
});

export default store;

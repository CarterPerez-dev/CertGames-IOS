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
        ignoredActions: [
          'user/fetchUserData/fulfilled',
          'user/claimDailyBonus/fulfilled',
          'user/setXPAndCoins',  
          'user/checkSubscription/fulfilled',
          'network/setOfflineStatus',
          'network/setServerError'
        ],
        ignoredPaths: [
          'user.lastDailyClaim',
          'user.subscriptionStartDate',
          'user.subscriptionEndDate',
        ],
      },
    }),
});

export default store;

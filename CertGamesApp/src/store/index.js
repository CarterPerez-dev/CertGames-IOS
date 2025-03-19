// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import shopReducer from './slices/shopSlice';
import achievementsReducer from './slices/achievementsSlice';
// Import other reducers as you create them
// import testReducer from './slices/testSlice';
// import achievementsReducer from './slices/achievementsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    shop: shopReducer,
    achievements: achievementsReducer
    // Add other reducers here
    // tests: testReducer,
    // achievements: achievementsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the Redux state
        ignoredActions: ['user/fetchUserData/fulfilled'],
        ignoredPaths: ['user.lastDailyClaim'],
      },
    }),
});

export default store;

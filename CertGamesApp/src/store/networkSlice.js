// src/store/slices/networkSlice.js
import { createSlice } from '@reduxjs/toolkit';

const networkSlice = createSlice({
  name: 'network',
  initialState: {
    isOffline: false,
    serverError: false,
    lastOnlineTimestamp: Date.now(),
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
  }
});

export const { setOfflineStatus, setServerError, clearErrors } = networkSlice.actions;
export default networkSlice.reducer;

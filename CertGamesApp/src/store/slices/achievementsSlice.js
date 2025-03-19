// src/store/slices/achievementsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as achievementService from '../../api/achievementService';

/**
 * Async thunk to fetch all achievements
 */
export const fetchAchievements = createAsyncThunk(
  'achievements/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      // Ensure we're calling the correct method
      const response = await achievementService.fetchAchievements();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Achievements slice for Redux store
 */
const achievementsSlice = createSlice({
  name: 'achievements',
  initialState: {
    all: [],
    status: 'idle',
    error: null
  },
  reducers: {
    // Any additional reducers needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.all = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default achievementsSlice.reducer;

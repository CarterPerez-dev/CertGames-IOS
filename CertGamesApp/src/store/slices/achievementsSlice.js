// src/store/slices/achievementsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import achievementService from '../../api/achievementService';

export const fetchAchievements = createAsyncThunk(
  'achievements/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await achievementService.fetchAchievements();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const achievementsSlice = createSlice({
  name: 'achievements',
  initialState: {
    all: [],
    status: 'idle',
    error: null
  },
  reducers: {
    // Add this reducer to handle direct updates to achievements (e.g. from WebSocket)
    updateAchievements: (state, action) => {
      state.all = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.all = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { updateAchievements } = achievementsSlice.actions;
export default achievementsSlice.reducer;

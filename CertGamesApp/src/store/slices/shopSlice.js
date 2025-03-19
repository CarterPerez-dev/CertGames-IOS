// src/store/slices/shopSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as shopService from '../../api/shopService';

export const fetchShopItems = createAsyncThunk(
  'shop/fetchShopItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await shopService.getShopItems();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    // Any additional reducers needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopItems.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchShopItems.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchShopItems.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default shopSlice.reducer;

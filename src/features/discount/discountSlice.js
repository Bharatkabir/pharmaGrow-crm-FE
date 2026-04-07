import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

// const API_URL = "http://127.0.0.1:8000/api/discount-rule";
const API_URL = import.meta.env.VITE_API_URL_LIVE + "/discount-rule";

// Fetch discount rule
export const fetchDiscountRule = createAsyncThunk(
  "discount/fetchRule",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(API_URL);
      return data.rule || null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load discount rule"
      );
    }
  }
);

// Save or update discount rule
export const saveDiscountRule = createAsyncThunk(
  "discount/saveRule",
  async (ruleData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(API_URL, ruleData);
      return data.rule;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save discount rule"
      );
    }
  }
);

const discountSlice = createSlice({
  name: "discount",
  initialState: {
    rule: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearDiscountError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDiscountRule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscountRule.fulfilled, (state, action) => {
        state.loading = false;
        state.rule = action.payload;
      })
      .addCase(fetchDiscountRule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save
      .addCase(saveDiscountRule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveDiscountRule.fulfilled, (state, action) => {
        state.loading = false;
        state.rule = action.payload;
      })
      .addCase(saveDiscountRule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDiscountError } = discountSlice.actions;
export default discountSlice.reducer;
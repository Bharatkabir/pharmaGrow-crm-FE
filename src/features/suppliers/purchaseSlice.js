import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

// const API = "http://127.0.0.1:8000/api";
const API =  import.meta.env.VITE_API_URL_LIVE ;

// ✅ Get all purchases
export const fetchPurchases = createAsyncThunk(
  "purchases/fetchPurchases",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API}/purchases`);
      return Array.isArray(response.data) ? response.data : response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch purchases");
    }
  }
);

// ✅ Get single purchase by ID
export const fetchPurchaseById = createAsyncThunk(
  "purchases/fetchPurchaseById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API}/purchases/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch purchase");
    }
  }
);

// ✅ Create a new purchase
export const createPurchase = createAsyncThunk(
  "purchases/createPurchase",
  async (purchaseData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API}/purchases`, purchaseData);
      return response.data.purchase;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to create purchase");
    }
  }
);

// ✅ Update purchase
export const updatePurchase = createAsyncThunk(
  "purchases/updatePurchase",
  async ({ id, purchaseData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API}/purchases/${id}`, purchaseData);
      return response.data.purchase;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update purchase");
    }
  }
);

// ✅ Delete purchase
export const deletePurchase = createAsyncThunk(
  "purchases/deletePurchase",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API}/purchases/${id}`);
      return id; // return deleted purchase ID
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to delete purchase");
    }
  }
);

const purchaseSlice = createSlice({
  name: "purchases",
  initialState: {
    data: [],
    single: null, // ✅ for fetchPurchaseById
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch all purchases
      .addCase(fetchPurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Fetch purchase by ID
      .addCase(fetchPurchaseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseById.fulfilled, (state, action) => {
        state.loading = false;
        state.single = action.payload;
      })
      .addCase(fetchPurchaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Create purchase
      .addCase(createPurchase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchase.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(createPurchase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Update purchase
      .addCase(updatePurchase.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // ✅ Delete purchase
      .addCase(deletePurchase.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((p) => p.id !== action.payload);
      });
  },
});

export const { clearError } = purchaseSlice.actions;
export default purchaseSlice.reducer;
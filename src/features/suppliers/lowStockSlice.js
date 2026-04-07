import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

// const API = "http://127.0.0.1:8000/api";
const API =  import.meta.env.VITE_API_URL_LIVE ;



// ✅ Fetch all Low Stock Items
export const fetchLowStockItems = createAsyncThunk(
  "lowStockItems/fetchAll",
  async () => {
    const res = await axios.get(`${API}/low-stock-items`);
    return Array.isArray(res.data) ? res.data : [];
  }
);

// ✅ Auto-generate Low Stock Items
export const generateLowStockItems = createAsyncThunk(
  "lowStockItems/generateLowStock",
  async () => {
    const res = await axios.post(`${API}/low-stock-items/auto-generate`);
    return res.data.item_ids || [];
  }
);

// ✅ Send Low Stock Items (Bulk → Multiple suppliers + items)
export const sendLowStockItems = createAsyncThunk(
  "lowStockItems/send",
  async (payload) => {
    const res = await axios.post(`${API}/low-stock-items/send`, payload);
    return res.data.orders || [];
  }
);

const lowStockSlice = createSlice({
  name: "lowStockItems",
  initialState: { data: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchLowStockItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLowStockItems.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchLowStockItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.data = [];
      })

      // Auto Generate
      .addCase(generateLowStockItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateLowStockItems.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generateLowStockItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Send Low Stock Items
      .addCase(sendLowStockItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendLowStockItems.fulfilled, (state, action) => {
        state.loading = false;
        const newOrders = action.payload;

        // Merge into state.data
        newOrders.forEach((order) => {
          const index = state.data.findIndex((item) => item.id === order.id);
          if (index >= 0) {
            state.data[index] = order;
          } else {
            state.data.push(order);
          }
        });
      })
      .addCase(sendLowStockItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default lowStockSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from "../../utils/axiosInstance";

// const API = 'http://127.0.0.1:8000/api';
const API =  import.meta.env.VITE_API_URL_LIVE ;

const initialState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
};

// Fetch all purchase orders
export const fetchPurchaseOrders = createAsyncThunk(
  'purchaseOrders/fetchPurchaseOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API}/purchase-orders`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch purchase orders');
    }
  }
);

// Fetch single purchase order by ID
export const fetchPurchaseOrderById = createAsyncThunk(
  'purchaseOrders/fetchPurchaseOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API}/purchase-orders/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch purchase order');
    }
  }
);

// Delete purchase order
export const deletePurchaseOrder = createAsyncThunk(
  'purchaseOrders/deletePurchaseOrder',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API}/purchase-orders/${id}`);
      return { id }; // Return the deleted ID to update state
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete purchase order');
    }
  }
);

const purchaseOrderSlice = createSlice({
  name: 'purchaseOrders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch by ID
      .addCase(fetchPurchaseOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchPurchaseOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deletePurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter(order => order.id !== action.payload.id);
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = null; // Clear if deleted order was selected
        }
      })
      .addCase(deletePurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default purchaseOrderSlice.reducer;
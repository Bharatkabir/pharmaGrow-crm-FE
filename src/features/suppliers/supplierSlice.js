import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from "../../utils/axiosInstance";

// const API = 'http://127.0.0.1:8000/api';
const API =  import.meta.env.VITE_API_URL_LIVE ;

// Fetch all suppliers
export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async () => {
  const res = await axios.get(`${API}/suppliers`);
  return res.data.data;
});

// Create a supplier
export const createSupplier = createAsyncThunk(
  'suppliers/create',
  async (supplierData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/suppliers`, supplierData);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Update a supplier
export const updateSupplier = createAsyncThunk(
  'suppliers/update',
  async ({ id, supplierData }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API}/suppliers/${id}`, supplierData);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Delete a supplier
export const deleteSupplier = createAsyncThunk(
  'suppliers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API}/suppliers/${id}`);
      return id;
    } catch (error) {     
      return rejectWithValue(error.response.data);
    }
  }
);

// Fetch suppliers for a specific product
export const fetchSuppliersByProduct = createAsyncThunk(
  'suppliers/fetchSuppliersByProduct',
  async (productId) => {
    const response = await axios.get(`${API}/products/${productId}/suppliers`);
    return { productId, suppliers: response.data.data };
  }
);

// Assign suppliers to a product
export const assignSuppliersToProduct = createAsyncThunk(
  'suppliers/assignSuppliersToProduct',
  async ({ productId, supplierIds }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API}/products/${productId}/suppliers`, { supplier_ids: supplierIds });
      return { productId, suppliers: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const supplierSlice = createSlice({
  name: 'suppliers',
  initialState: {
    data: [],
    productSuppliers: {},
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all suppliers
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create supplier
      .addCase(createSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
        state.success = 'Supplier created successfully!';
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create supplier';
      })

      // Update supplier
      .addCase(updateSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.map((s) => (s.id === action.payload.id ? action.payload : s));
        state.success = 'Supplier updated successfully!';
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update supplier';
      })

      // Delete supplier
      .addCase(deleteSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((s) => s.id !== action.payload);
        state.success = 'Supplier deleted successfully!';
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete supplier';
      })

      // Fetch suppliers by product
      .addCase(fetchSuppliersByProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliersByProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.productSuppliers[action.payload.productId] = action.payload.suppliers;
      })
      .addCase(fetchSuppliersByProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Assign suppliers to product
      .addCase(assignSuppliersToProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(assignSuppliersToProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.productSuppliers[action.payload.productId] = action.payload.suppliers;
        state.success = 'Suppliers assigned successfully!';
      })
      .addCase(assignSuppliersToProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to assign suppliers';
      });
  },
});

export const { clearMessages } = supplierSlice.actions;
export default supplierSlice.reducer;
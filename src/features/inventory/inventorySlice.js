import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

// const API_URL = "http://127.0.0.1:8000/api";
const API_URL = import.meta.env.VITE_API_URL_LIVE ;

// ==================== Categories ====================
export const fetchCategories = createAsyncThunk("inventory/fetchCategories", async () => {
  const res = await axios.get(`${API_URL}/categories`);
  return res.data;
});
export const addCategory = createAsyncThunk("inventory/addCategory", async (category) => {
  const res = await axios.post(`${API_URL}/categories`, category);
  return res.data.category ?? res.data;
});

// ==================== Suppliers ====================
export const fetchSuppliers = createAsyncThunk("inventory/fetchSuppliers", async () => {
  const res = await axios.get(`${API_URL}/suppliers`);
  return res.data;
});
export const addSupplier = createAsyncThunk("inventory/addSupplier", async (supplier) => {
  const res = await axios.post(`${API_URL}/suppliers`, supplier);
  return res.data.supplier ?? res.data;
});

// ==================== Products ====================
export const fetchProducts = createAsyncThunk("inventory/fetchProducts", async () => {
  const res = await axios.get(`${API_URL}/products`);
  return res.data;
});
export const fetchAllProducts = createAsyncThunk("inventory/fetchAllProducts", async () => {
  const res = await axios.get(`${API_URL}/products/all`);
  return res.data;
});
export const addProduct = createAsyncThunk("inventory/addProduct", async (product) => {
  const res = await axios.post(`${API_URL}/products`, product);
  return res.data.product ?? res.data;
});

// Update Product
export const updateProduct = createAsyncThunk(
  "inventory/updateProduct",
  async ({ id, product }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_URL}/products/${id}`, product);
      return res.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Update failed" });
    }
  }
);

// Set or Update Product Price
export const setProductPrice = createAsyncThunk(
  "inventory/setProductPrice",
  async ({ id, priceData, priceId }, { rejectWithValue }) => {
    try {
      let res;
      if (priceId) {
        // Update existing price
        res = await axios.put(`${API_URL}/products/${id}/update-price`, priceData);
      } else {
        // Create new price
        res = await axios.post(`${API_URL}/products/${id}/set-price`, priceData);
      }
      return res.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to set price" });
    }
  }
);


// Delete Product
export const deleteProduct = createAsyncThunk("inventory/deleteProduct", async (id) => {
  await axios.delete(`${API_URL}/products/${id}`);
  return id;
});

// ==================== Batches ====================
export const fetchBatches = createAsyncThunk("inventory/fetchBatches", async () => {
  const res = await axios.get(`${API_URL}/batches`);
  return res.data;
});
export const addBatch = createAsyncThunk("inventory/addBatch", async (batch) => {
  const res = await axios.post(`${API_URL}/batches`, batch);
  return res.data.batch ?? res.data;
});

// ==================== Slice ====================
const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    categories: [],
    suppliers: [],
    products: [],
    allProducts: [],
    batches: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.suppliers = action.payload;
      })
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.suppliers.push(action.payload);
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.allProducts = action.payload;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.allProducts.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.products[index] = action.payload;
        const allIndex = state.allProducts.findIndex((p) => p.id === action.payload.id);
        if (allIndex !== -1) state.allProducts[allIndex] = action.payload;
      })
      .addCase(setProductPrice.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p.id === action.payload.id);
        if (index === -1) state.products.push(action.payload);
        else state.products[index] = action.payload;
        const allIndex = state.allProducts.findIndex((p) => p.id === action.payload.id);
        if (allIndex !== -1) state.allProducts[allIndex] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p.id !== action.payload);
        state.allProducts = state.allProducts.filter((p) => p.id !== action.payload);
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.batches = action.payload;
      })
      .addCase(addBatch.fulfilled, (state, action) => {
        state.batches.push(action.payload);
      });
  },
});

export default inventorySlice.reducer;
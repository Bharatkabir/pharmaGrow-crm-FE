import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL_LIVE + "/customers";


// Fetch all customers
export const fetchCustomers = createAsyncThunk(
  "customers/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch customers"
      );
    }
  }
);

// Fetch single customer by ID
export const fetchCustomerById = createAsyncThunk(
  "customers/fetchById",
  async (id, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch customer"
      );
    }
  }
);

// Add a new customer
export const addCustomer = createAsyncThunk(
  "customers/addCustomer",
  async (customerData, thunkAPI) => {
    try {
      const response = await axios.post(API_URL, customerData);
      return { customer: response.data, message: "Customer created successfully!" };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to add customer"
      );
    }
  }
);

// Update existing customer
export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return { customer: response.data, message: "Customer updated successfully!" };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update customer"
      );
    }
  }
);

export const fetchSingleCustomer = createAsyncThunk(
  "customers/fetchSingleCustomer",
  async (id, thunkAPI) => {
    try {
      const res = await axios.get(`${API_URL}/${id}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Error fetching customer");
    }
  }
);

// Delete customer
export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id, thunkAPI) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return { id, message: "Customer deleted successfully!" };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete customer"
      );
    }
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState: {
    customers: [],
    selectedCustomer: null,
    isLoading: false,
    isError: false,
    message: "",
  },
  reducers: {
    resetCustomerState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCustomers
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // fetchCustomerById
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCustomer = action.payload;
      })

      // addCustomer
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers.push(action.payload.customer);
        state.message = action.payload.message;
      })

      // updateCustomer
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.customers.findIndex(
          (c) => c.id === action.payload.customer.id
        );
        if (index !== -1) state.customers[index] = action.payload.customer;
        state.message = action.payload.message;
      })

      // deleteCustomer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = state.customers.filter(
          (c) => c.id !== action.payload.id
        );
        state.message = action.payload.message;
      });
  },
});

export const { resetCustomerState } = customerSlice.actions;
export default customerSlice.reducer;
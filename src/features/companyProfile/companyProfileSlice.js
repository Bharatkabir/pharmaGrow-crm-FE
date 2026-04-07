import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from "../../utils/axiosInstance";

const API_URL =  import.meta.env.VITE_API_URL_LIVE;

// ✅ Company Profile fetch
export const fetchCompanyProfile = createAsyncThunk(
  'companyProfile/fetchCompanyProfile',
  async () => {
    const response = await axios.get(`${API_URL}/company-profile`);
    return response.data;
  }
);

// ✅ Company Profile update
export const updateCompanyProfile = createAsyncThunk(
  'companyProfile/updateCompanyProfile',
  async (data) => {
    const response = await axios.put(`${API_URL}/company-profile/1`, data);
    return response.data;
  }
); 

// ✅ Slice
const companyProfileSlice = createSlice({
  name: 'companyProfile',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCompanyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateCompanyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompanyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateCompanyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default companyProfileSlice.reducer;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

// const API_URL = "http://127.0.0.1:8000/api/types";
const API_URL = import.meta.env.VITE_API_URL_LIVE + "/types";

export const fetchTypes = createAsyncThunk(
  "types/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(API_URL);
      return Array.isArray(response.data) ? response.data : response.data.types || [];
    } catch (error) {
      return thunkAPI.rejectWithValue("Failed to load customer types");
    }
  }
);

const typesSlice = createSlice({
  name: "types",
  initialState: {
    types: [],
    isLoading: false,
    isError: false,
    message: "",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTypes.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.types = action.payload;
      })
      .addCase(fetchTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export default typesSlice.reducer;
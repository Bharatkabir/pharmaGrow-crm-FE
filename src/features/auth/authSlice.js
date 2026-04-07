import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

// 🔹 Register
export const register = createAsyncThunk("auth/register", async (userData, thunkAPI) => {
  try {
    return await authService.register(userData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Register failed");
  }
});

// 🔹 Login
export const login = createAsyncThunk("auth/login", async (userData, thunkAPI) => {
  try {
    return await authService.login(userData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
  }
});

// 🔹 Get user
export const getUser = createAsyncThunk("auth/getUser", async (_, thunkAPI) => {
  try {
    return await authService.getUser();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Get user failed");
  }
});

// 🔹 Logout
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    await authService.logout();
    return {};
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Logout failed");
  }
});

// 🔹 Theme: Get
export const getTheme = createAsyncThunk("auth/getTheme", async (_, thunkAPI) => {
  try {
    return await authService.getTheme();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Get theme failed");
  }
});

// 🔹 Theme: Update
export const updateTheme = createAsyncThunk("auth/updateTheme", async (theme, thunkAPI) => {
  try {
    return await authService.updateTheme(theme);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Update theme failed");
  }
});

// 🔹 Initial State (Now loads theme from localStorage)
const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("userToken") || null,
  theme: localStorage.getItem("theme") || "light",
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    // Optional manual theme switcher (if needed)
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.theme = action.payload.user?.theme || "light";
        localStorage.setItem("theme", state.theme);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // 🔹 Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.theme = action.payload.user?.theme || "light";
        localStorage.setItem("theme", state.theme);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // 🔹 Get User
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // 🔹 Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.theme = "light";
        localStorage.removeItem("theme");
      })

      // 🔹 Get Theme
      .addCase(getTheme.fulfilled, (state, action) => {
        const theme = action.payload.theme || "light";
        state.theme = theme;
        localStorage.setItem("theme", theme);
      })

      // 🔹 Update Theme
      .addCase(updateTheme.fulfilled, (state, action) => {
        const theme = action.payload.theme || "light";
        state.theme = theme;
        localStorage.setItem("theme", theme);
      });
  },
});

export const { reset, setTheme } = authSlice.actions;
export default authSlice.reducer;

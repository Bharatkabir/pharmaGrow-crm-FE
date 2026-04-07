// src/features/roles/rolesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

// const BASE_URL = "http://localhost:8000/api";
const BASE_URL =  import.meta.env.VITE_API_URL_LIVE ;

/* ============================================================
   1️⃣ Fetch all roles and grouped permissions
============================================================ */
export const fetchRolesAndPermissions = createAsyncThunk(
  "roles/fetchRolesAndPermissions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/roles-permissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch roles and permissions"
      );
    }
  }
);

/* ============================================================
   2️⃣ Create new role
============================================================ */
export const createRole = createAsyncThunk(
  "roles/createRole",
  async (roleName, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/roles`,
        { name: roleName },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      return response.data.role;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create role"
      );
    }
  }
);

/* ============================================================
   3️⃣ Update role
============================================================ */
export const updateRole = createAsyncThunk(
  "roles/updateRole",
  async ({ roleId, name, permissions }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/roles/${roleId}`,
        { name, permissions },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      return response.data.role;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update role"
      );
    }
  }
);

/* ============================================================
   4️⃣ Delete role
============================================================ */
export const deleteRole = createAsyncThunk(
  "roles/deleteRole",
  async (roleId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return { id: roleId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to delete role. It may be assigned to users."
      );
    }
  }
);

/* ============================================================
   5️⃣ Roles Slice
============================================================ */
const rolesSlice = createSlice({
  name: "roles",
  initialState: {
    roles: [],
    permissionsGrouped: {},
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    reset: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------------- Fetch Roles ---------------- */
      .addCase(fetchRolesAndPermissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRolesAndPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload.roles;
        state.permissionsGrouped = action.payload.permissions_grouped;
      })
      .addCase(fetchRolesAndPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------------- Create Role ---------------- */
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
        state.message = "Role created successfully";
      })
      .addCase(createRole.rejected, (state, action) => {
        state.error = action.payload;
      })

      /* ---------------- Update Role ---------------- */
      .addCase(updateRole.fulfilled, (state, action) => {
        const index = state.roles.findIndex(
          (role) => role.id === action.payload.id
        );
        if (index !== -1) state.roles[index] = action.payload;
        state.message = "Role updated successfully";
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.error = action.payload;
      })

      /* ---------------- Delete Role ---------------- */
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter((r) => r.id !== action.payload.id);
        state.message = action.payload.message || "Role deleted successfully";
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { reset } = rolesSlice.actions;
export default rolesSlice.reducer;
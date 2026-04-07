import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

const base = import.meta.env.VITE_API_URL_LIVE;
const API_URL = base.endsWith("/") ? base : base + "/";
// const API_URL = "http://127.0.0.1:8000/api/";

// 🔹 Fetch all notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(`${API_URL}notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 🔹 Mark all as read
export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(
        `${API_URL}notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 🔹 Mark single as read
export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.post(
        `${API_URL}notifications/mark-read/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.notification; // updated notification
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    // 🔹 Add new notification instantly (for Pusher)
    addNotification: (state, action) => {
      const newNotification = action.payload;

      // Prevent duplicate notifications
      const exists = state.items.some((n) => n.id === newNotification.id);
      if (!exists) {
        state.items.unshift(newNotification);
        if (!newNotification.is_read) {
          state.unreadCount += 1;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.unreadCount = state.items.filter((n) => !n.is_read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark all
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => (n.is_read = true));
        state.unreadCount = 0;
      })

      // Mark single
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex((n) => n.id === updated.id);
        if (idx !== -1) {
          state.items[idx] = updated;
          if (updated.is_read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
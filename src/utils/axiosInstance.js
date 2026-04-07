// src/utils/axiosInstance.js
import axios from "axios";

// ✅ Base API URL
const API_URL = import.meta.env.VITE_API_URL_LIVE;

// ✅ Axios instance create karo
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Har request ke sath user token aur user details send karne ke liye interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 👇 Extra user info backend ko send karenge
    if (user) {
      config.headers["x-user-id"] = user.id;
      config.headers["x-user-name"] = user.name;
      config.headers["x-user-email"] = user.email;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;

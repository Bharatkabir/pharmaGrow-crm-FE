import axios from "../../utils/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL_LIVE + "/auth/";

// ✅ Helper: Get user details from localStorage
const getUserDetails = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user || null;
  } catch {
    return null;
  }
};

// ✅ Helper: Get token + user info in headers
const getAuthHeader = () => {
  const token = localStorage.getItem("userToken");
  const user = getUserDetails();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-User-ID": user?.id || "",
      "X-User-Name": user?.name || "",
    },
  };
};

// ✅ Register user
const register = async (userData) => {
  const response = await axios.post(API_URL + "register", userData);
  if (response.data.token) {
    localStorage.setItem("userToken", response.data.token);
  }
  return response.data;
};

// ✅ Login user
const login = async (userData) => {
  const response = await axios.post(API_URL + "login", userData);

  if (response.data.token) {
    localStorage.setItem("userToken", response.data.token);
  }

  // Save user roles and details for frontend use
  localStorage.setItem("user", JSON.stringify(response.data.user));
  return response.data;
};

// ✅ Get logged-in user from backend
const getUser = async () => {
  const response = await axios.get(API_URL + "user", getAuthHeader());
  return response.data;
};

// ✅ Logout
const logout = async () => {
  await axios.post(API_URL + "logout", {}, getAuthHeader());
  localStorage.removeItem("userToken");
  localStorage.removeItem("user");
};

// ✅ Theme APIs
const getTheme = async () => {
  const response = await axios.get(API_URL + "theme", getAuthHeader());
  return response.data;
};

const updateTheme = async (theme) => {
  const response = await axios.post(API_URL + "theme", { theme }, getAuthHeader());
  return response.data;
};

// ✅ User Management APIs
const getUsers = async () => {
  const response = await axios.get(API_URL + "users", getAuthHeader());
  return response.data;
};

const createUser = async (userData) => {
  const response = await axios.post(API_URL + "users", userData, getAuthHeader());
  return response.data;
};

const updateUser = async (id, userData) => {
  const response = await axios.put(API_URL + `users/${id}`, userData, getAuthHeader());
  return response.data;
};

const deleteUser = async (id) => {
  const response = await axios.delete(API_URL + `users/${id}`, getAuthHeader());
  return response.data;
};

const authService = {
  register,
  login,
  getUser,
  logout,
  getTheme,
  updateTheme,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserDetails,
};

export default authService;

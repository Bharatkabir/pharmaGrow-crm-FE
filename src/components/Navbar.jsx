// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Bell,
  Settings,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";

import { logout, reset, updateTheme } from "../features/auth/authSlice";
import { fetchNotifications } from "../features/notifications/notificationSlice";
import NotificationList from "./NotificationList";
import usePusher from "../hooks/usePusher.jsx";

export default function Navbar({ theme, onToggleSidebar }) {
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const isDark = theme === "dark";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token && user) {
      dispatch(fetchNotifications());
    }
  }, [user, dispatch]);

  usePusher();

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(reset());
    navigate("/login");
  };

  const handleToggleTheme = () => {
    dispatch(updateTheme(isDark ? "light" : "dark"));
  };

  return (
    <>
      <header
        className={`h-20 px-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          isDark
            ? "bg-gray-900/80 border-b-2 border-gray-700"
            : "bg-white/80 border-b-2 border-gray-200"
        } backdrop-blur-lg`}
      >
        {/* Left */}
        <div className="flex items-center space-x-3 md:space-x-6">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onToggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>

          <NavLink to="/dashboard" className="hidden lg:flex items-center space-x-3 group">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white font-bold rounded-xl shadow-lg group-hover:scale-105 transition-transform">
              PG
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                PharmaGrow CRM
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pharmaceutical Management
              </p>
            </div>
          </NavLink>
        </div>

        {/* Search Removed (Desktop + Mobile) */}

        {/* Right */}
        <div className="flex items-center space-x-4 md:space-x-6">

          {/* Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDark ? <Sun className="text-yellow-400 h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            >
              <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full text-[10px] ring-2 ring-white dark:ring-gray-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-14 mt-2 w-80 z-50">
                <NotificationList />
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full shadow-md">
                {initials}
              </div>

              <div className="hidden lg:block text-left">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-gray-500 hidden lg:block transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div
                className={`absolute right-0 top-14 w-60 rounded-xl shadow-xl py-2 z-50 ${
                  isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                }`}
              >
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  My Account
                </div>

                <NavLink
                  to="/profile"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User className="mr-2 h-4 w-4" /> Profile Settings
                </NavLink>

                <NavLink
                  to="/settings"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </NavLink>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-700 dark:hover:text-white"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Inventory from "./pages/inventory/Inventory";
import Invoicing from "./pages/Invoicing";
import Reports from "./pages/Reports";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Loader from "./components/Loader";
import CustomerOrders from "./pages/CustomerOrders";
import InvoiceDetail from "./components/InvoiceDetail";
import SuppliersList from "./pages/SuppliersList";
import LowStockItems from "./pages/LowStockItems";
import PurchaseOrderList from "./pages/PurchaseOrderList";
import PurchaseList from "./pages/PurchaseList";
import ProductsSuppliersList from "./pages/inventory/ProductsSuppliersList";
import ProductPriceList from "./pages/inventory/ProductPriceList";
import RoleAndPermissionPage from "./pages/RoleAndPermissionPage";
import EmployeeManagementPage from "./pages/EmployeeManagementPage";
import axios from "./utils/axiosInstance";
import { getUser, getTheme } from "./features/auth/authSlice";
import { fetchNotifications } from "./features/notifications/notificationSlice";
import usePusher from "./hooks/usePusher";

function App() {
  const dispatch = useDispatch();
  const { user, isLoading, theme } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

 useEffect(() => {
    axios.get("http://127.0.0.1:8000/sanctum/csrf-cookie")
      .catch(() => {}); // ignore if already set
  }, []);

  usePusher();

  // IMMEDIATE FETCH ON LOGIN - NO DELAY
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token && !user) {
      dispatch(getUser());
      dispatch(getTheme());
    }
    // FETCH NOTIFICATIONS AS SOON AS USER IS AVAILABLE
    if (token && user) {
      dispatch(fetchNotifications()); // ← INSTANT LOAD
    }
  }, [dispatch, user]);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  if (isLoading) return <Loader />;

  const hasPermission = (permission) =>
    user?.permissions_list?.includes(permission) || false;

  if (!user) {
    return (
      <div className={theme}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className={theme}>
      <div className="dark:bg-gray-900 min-h-screen">
        <Navbar theme={theme} onToggleSidebar={() => setSidebarOpen(true)} />
        <Sidebar theme={theme} sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="lg:ml-64 mt-20 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto h-[calc(100vh-5rem)]">
          <Routes>
            <Route path="/dashboard" element={hasPermission("dashboard-view") ? <Dashboard theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/customers" element={hasPermission("customers-view") ? <Customers theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/orders" element={hasPermission("orders-view") ? <Orders theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/inventory" element={hasPermission("inventory-view") ? <Inventory theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/inventory/set-prices" element={hasPermission("product-price-list-view") ? <ProductPriceList theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/inventory-supplier" element={hasPermission("products-suppliers-view") ? <ProductsSuppliersList theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/suppliers" element={hasPermission("suppliers-view") ? <SuppliersList theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/purchase-orders" element={hasPermission("purchase-orders-view") ? <PurchaseOrderList theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/purchase" element={hasPermission("purchase-table-view") ? <PurchaseList theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/low-stock-items" element={hasPermission("low-stock-items-view") ? <LowStockItems theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/invoicing" element={hasPermission("invoicing-view") ? <Invoicing theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/invoices/:id" element={hasPermission("invoicing-view") ? <InvoiceDetail theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/reports" element={hasPermission("reports-view") ? <Reports theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/subscription" element={hasPermission("subscription-view") ? <Subscription theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/help" element={hasPermission("help-view") ? <Help theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/settings" element={hasPermission("settings-view") ? <Settings theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/customers/:id/orders" element={hasPermission("customers-view") ? <CustomerOrders theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/role-permissions" element={hasPermission("role-permissions-view") ? <RoleAndPermissionPage theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="/employee-management" element={hasPermission("employee-management-view") ? <EmployeeManagementPage theme={theme} /> : <Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
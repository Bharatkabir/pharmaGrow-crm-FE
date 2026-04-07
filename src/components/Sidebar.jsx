import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  LayoutDashboard, Users, ShoppingCart, Package, FileText, 
  BarChart2, Settings, X, HelpCircle, ChevronDown, ChevronRight 
} from "lucide-react";
import { MdOutlineInventory } from "react-icons/md";
import { Shield, UserPlus } from "lucide-react"; // Added icons for role and employee management

export default function Sidebar({ theme, sidebarOpen, onClose }) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const { user } = useSelector((state) => state.auth || {});

  const isDark = theme === "dark";

  const menuItems = [
    { name: "Customers", icon: <Users size={18} />, path: "/customers", permission: "customers-view" },
    { name: "Orders", icon: <ShoppingCart size={18} />, path: "/orders", permission: "orders-view" },
    { name: "Inventory", icon: <Package size={18} />, path: "/inventory", permission: "inventory-view" },
    { name: "Invoicing", icon: <FileText size={18} />, path: "/invoicing", permission: "invoicing-view" },
    { name: "Reports", icon: <BarChart2 size={18} />, path: "/reports", permission: "reports-view" },
    { name: "Subscription", icon: <FileText size={18} />, path: "/subscription", permission: "subscription-view" },
    { name: "Role & Permissions", icon: <Shield size={18} />, path: "/role-permissions", permission: "role-permissions-view" },
    { name: "Employee Management", icon: <UserPlus size={18} />, path: "/employee-management", permission: "employee-management-view" },
  ];

  const hasPermission = (permission) => user?.permissions_list?.includes(permission) || false;

  // Check if user has permission for any supplier-related sub-item
  const hasSupplierSubPermission = [
    "suppliers-view",
    "products-suppliers-view",
    "product-price-list-view",
    "low-stock-items-view",
    "purchase-orders-view",
    "purchase-table-view",
  ].some((perm) => hasPermission(perm));

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>

      <aside
        className={`fixed top-0 left-0 w-64 h-full flex flex-col justify-between border-r transition-transform duration-300 z-50
        ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:top-20 lg:h-[calc(100vh-5rem)]`}
      >
        {/* Logo + Close Button for mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-700 text-white flex items-center justify-center font-bold rounded-lg">PG</div>
            <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-100">PharmaGrow</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
            <X size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Menu */}
        <nav className="mt-8 space-y-1 flex-1">
          {/* Dashboard */}
          {hasPermission("dashboard-view") && (
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${
                  isActive
                    ? isDark
                      ? "bg-gray-800 text-white"
                      : "bg-blue-50 text-blue-700"
                    : isDark
                    ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* Suppliers with dropdown */}
          {hasSupplierSubPermission && (
            <div>
              <button
                onClick={() => setOpenDropdown(!openDropdown)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isDark ? "text-gray-300 hover:bg-gray-800 hover:text-white" : "text-gray-600 hover:bg-gray-50"}
                `}
              >
                <span className="flex items-center gap-3">
                  <MdOutlineInventory size={18} />
                  <span>Suppliers</span>
                </span>
                {openDropdown ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {openDropdown && (
                <div className="ml-10 mt-1 space-y-1">
                  {hasPermission("suppliers-view") && (
                    <NavLink
                      to="/suppliers"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-sm rounded-lg transition-colors
                        ${
                          isActive
                            ? isDark
                              ? "bg-gray-800 text-white"
                              : "bg-blue-50 text-blue-700"
                            : isDark
                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`
                      }
                    >
                      Supplier Table
                    </NavLink>
                  )}
                  {hasPermission("products-suppliers-view") && (
                    <NavLink
                      to="/inventory-supplier"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-sm rounded-lg transition-colors
                        ${
                          isActive
                            ? isDark
                              ? "bg-gray-800 text-white"
                              : "bg-blue-50 text-blue-700"
                            : isDark
                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`
                      }
                    >
                      Products & Suppliers
                    </NavLink>
                  )}
                  {hasPermission("product-price-list-view") && (
                    <NavLink
                      to="/inventory/set-prices"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-sm rounded-lg transition-colors
                        ${
                          isActive
                            ? isDark
                              ? "bg-gray-800 text-white"
                              : "bg-blue-50 text-blue-700"
                            : isDark
                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`
                      }
                    >
                      Product Price List
                    </NavLink>
                  )}
                  {hasPermission("low-stock-items-view") && (
                    <NavLink
                      to="/low-stock-items"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-sm rounded-lg transition-colors
                        ${
                          isActive
                            ? isDark
                              ? "bg-gray-800 text-white"
                              : "bg-blue-50 text-blue-700"
                            : isDark
                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`
                      }
                    >
                      Low Stock Items
                    </NavLink>
                  )}
                  {hasPermission("purchase-orders-view") && (
                    <NavLink
                      to="/purchase-orders"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-sm rounded-lg transition-colors
                        ${
                          isActive
                            ? isDark
                              ? "bg-gray-800 text-white"
                              : "bg-blue-50 text-blue-700"
                            : isDark
                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`
                      }
                    >
                      Purchase Orders
                    </NavLink>
                  )}
                  {hasPermission("purchase-table-view") && (
                    <NavLink
                      to="/purchase"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-sm rounded-lg transition-colors
                        ${
                          isActive
                            ? isDark
                              ? "bg-gray-800 text-white"
                              : "bg-blue-50 text-blue-700"
                            : isDark
                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`
                      }
                    >
                      Purchase Table
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Other Menu Items */}
          {menuItems.map((item) =>
            hasPermission(item.permission) && (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${
                    isActive
                      ? isDark
                        ? "bg-gray-800 text-white"
                        : "bg-blue-50 text-blue-700"
                      : isDark
                      ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            )
          )}

        </nav>

        {/* Bottom Section */}
        <div className={`p-4 border-t ${isDark ? "border-gray-800" : "border-gray-200"} space-y-2`}>
          {hasPermission("help-view") && (
            <NavLink
              to="/help"
              onClick={onClose}
              className={`flex items-center gap-3 text-sm font-medium transition-colors
                ${isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              <HelpCircle size={18} /> <span>Help</span>
            </NavLink>
          )}
          {hasPermission("settings-view") && (
            <NavLink
              to="/settings"
              onClick={onClose}
              className={`flex items-center gap-3 text-sm font-medium transition-colors
                ${isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              <Settings size={18} /> <span>Settings</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
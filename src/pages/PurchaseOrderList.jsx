import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPurchaseOrders, fetchPurchaseOrderById, deletePurchaseOrder } from "../features/suppliers/purchaseOrderSlice";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Package, AlertTriangle, Clock, Eye, Trash2, Search, Calendar, Download, RefreshCw, Truck, CheckCircle, X } from "lucide-react";

const PurchaseOrderList = ({ theme }) => {
  const dispatch = useDispatch();
  const { orders, selectedOrder, loading, error } = useSelector((state) => state.purchaseOrders || { orders: [], selectedOrder: null, loading: false, error: null });
  const isDark = theme === "dark";

  // Filter and search states
  const [filters, setFilters] = useState({
    search: "",
    dateRange: "",
  });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false); // Separate state for fetching order details

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
  }, [dispatch]);

  // Safe orders array
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Update filtered orders when filters or orders change
  useEffect(() => {
    let filtered = safeOrders;
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(order =>
        order.po_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.supplier?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.items?.some(item => item.product?.name?.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }
    // Date range filter
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange.split(' to ');
      if (startDate && endDate) {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.created_at);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return orderDate >= start && orderDate <= end;
        });
      }
    }
    setFilteredOrders(filtered);
  }, [safeOrders, filters]);

  // Dynamic metrics
  const metrics = {
    totalPOs: safeOrders.length,
    overduePOs: 0, // Placeholder; update if overdue logic is provided
    completedPOs: filteredOrders.filter(order => order.status === "Completed" || order.status === "Delivered").length,
    orderCreatedPOs: filteredOrders.filter(order => order.status === "Order Created").length,
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      dateRange: "",
    });
  };

  // Handle view button click
  const handleViewOrder = (id) => {
    setLoadingDetails(true);
    dispatch(fetchPurchaseOrderById(id))
      .unwrap()
      .then(() => {
        setIsModalOpen(true);
        setLoadingDetails(false);
      })
      .catch((err) => {
        toast.error(`Failed to fetch PO: ${err}`, {
          position: "top-right",
          autoClose: 3000,
          theme: isDark ? "dark" : "light",
        });
        setLoadingDetails(false);
      });
  };

  // Handle delete button click
  const handleDeleteOrder = (id, po_number) => {
    dispatch(deletePurchaseOrder(id))
      .unwrap()
      .then(() => {
        toast.success(`PO #${po_number || id} deleted successfully`, {
          position: "top-right",
          autoClose: 3000,
          theme: isDark ? "dark" : "light",
        });
      })
      .catch((err) => {
        toast.error(`Failed to delete PO: ${err}`, {
          position: "top-right",
          autoClose: 3000,
          theme: isDark ? "dark" : "light",
        });
      });
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setLoadingDetails(false);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
      switch (status?.toLowerCase()) {
        case "order created":
          return { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100", icon: Clock };
        case "sent":
          return { color: "bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-blue-100", icon: Truck };
        case "completed":
        case "delivered":
          return { color: "bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-100", icon: CheckCircle };
        case "cancelled":
          return { color: "bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-100", icon: X };
        default:
          return { color: "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100", icon: Package };
      }
    };
    const { color, icon: Icon } = getStatusConfig(status);
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status || "Order Created"}
      </span>
    );
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-20">
      <div className="flex flex-col items-center">
        <div
          className={`w-12 h-12 border-4 ${
            isDark ? "border-blue-400" : "border-blue-600"
          } border-t-transparent rounded-full animate-spin mb-4`}
        ></div>
        <p className={`text-lg font-medium ${isDark ? "text-blue-300" : "text-blue-600"}`}>
          Loading purchase orders...
        </p>
      </div>
    </div>
  );

  // Items display component
  const ItemsDisplay = ({ items, isDark }) => {
    if (!Array.isArray(items) || items.length === 0) {
      return <span className={`${isDark ? "text-gray-500" : "text-gray-500"}`}>No items</span>;
    }
    return (
      <div className="space-y-2">
        <div className="max-h-24 overflow-y-auto">
          {items.slice(0, 3).map((item, index) => {
            const qty = Number(item.requested_qty || 0);
            const price = Number(item.buy_price || 0);
            return (
              <div key={item.id || index} className={`flex justify-between items-center p-2 rounded-lg ${
                isDark ? "bg-gray-700/50" : "bg-gray-50"
              }`}>
                <div className="flex-1 truncate">
                  <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    {item.product?.name || "Unnamed Product"}
                  </span>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {item.product?.sku || item.product?.product_code || "N/A"} - {qty} pcs
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    ₹{price.toFixed(2)}
                  </div>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Buy Price
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {items.length > 3 && (
          <div className={`text-xs italic ${isDark ? "text-gray-500" : "text-gray-500"} text-center`}>
            +{items.length - 3} more items
          </div>
        )}
      </div>
    );
  };

  // Modal for displaying purchase order details
  const PurchaseOrderModal = ({ order, isOpen, onClose, isDark, loadingDetails }) => {
    if (!isOpen) return null;
    if (loadingDetails) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl ${isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"} animate-fade-in`}>
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 border-4 ${
                    isDark ? "border-blue-400" : "border-blue-600"
                  } border-t-transparent rounded-full animate-spin mb-4`}
                ></div>
                <p className={`text-lg font-medium ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                  Loading purchase order details...
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (!order) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl ${isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"} animate-fade-in`}>
            <div className="text-center py-12">
              <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-red-400" : "text-red-600"}`} />
              <p className={`text-lg font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>
                No purchase order data available
              </p>
              <button
                onClick={onClose}
                className={`mt-6 px-4 py-2 rounded-lg ${isDark ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`rounded-xl p-8 w-full max-w-3xl ${isDark ? "bg-gray-800 text-gray-100 shadow-2xl" : "bg-white text-gray-900 shadow-lg"} animate-fade-in`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Purchase Order #{order.po_number || order.id}</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-200 text-gray-600"}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-8">
            {/* Details Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold mb-4">Order Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Supplier</p>
                  <p className="text-base font-medium">{order.supplier?.name || "N/A"}</p>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{order.supplier?.email || "No email"}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Status</p>
                  <StatusBadge status={order.status || "Order Created"} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Created</p>
                  <p className="text-base">{order.created_at ? new Date(order.created_at).toLocaleDateString() : "No date"}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Deadline</p>
                  <p className="text-base">{order.delivery_deadline ? new Date(order.delivery_deadline).toLocaleDateString() : "No deadline"}</p>
                </div>
              </div>
            </div>
            {/* Items Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Items</h3>
              {Array.isArray(order.items) && order.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                      <tr>
                        {["Product", "SKU", "Quantity", "Buy Price"].map((header) => (
                          <th
                            key={header}
                            className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              isDark ? "text-gray-300" : "text-gray-500"
                            }`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? "bg-gray-800" : "bg-white"} divide-y divide-gray-200 dark:divide-gray-700`}>
                      {order.items.map((item, index) => {
                        const qty = Number(item.requested_qty || 0);
                        const price = Number(item.buy_price || 0);
                        return (
                          <tr key={item.id || index} className={`${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`}>
                            <td className="px-4 py-3 text-sm font-medium">{item.product?.name || "Unnamed Product"}</td>
                            <td className="px-4 py-3 text-sm">{item.product?.sku || item.product?.product_code || "N/A"}</td>
                            <td className="px-4 py-3 text-sm">{qty} pcs</td>
                            <td className="px-4 py-3 text-sm">₹{price.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>No items</p>
              )}
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isDark ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && safeOrders.length === 0) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
        <ToastContainer position="top-right" autoClose={3000} theme={isDark ? "dark" : "light"} />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
        <ToastContainer position="top-right" autoClose={3000} theme={isDark ? "dark" : "light"} />
        <div className="text-center py-12">
          <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-red-400" : "text-red-600"}`} />
          <p className={`text-lg font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>
            Error loading purchase orders: {error}
          </p>
          <button
            onClick={() => dispatch(fetchPurchaseOrders())}
            className={`mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
              isDark ? "hover:bg-blue-500" : ""
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <ToastContainer position="top-right" autoClose={3000} theme={isDark ? "dark" : "light"} />
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
            Purchase Orders
          </h1>
          <p className={`mt-1 text-xs md:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Manage and track your purchase orders for inventory replenishment
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => dispatch(fetchPurchaseOrders())}
            className={`flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ${
              isDark ? "bg-gray-700 hover:bg-gray-600" : ""
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={resetFilters}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total POs",
            value: metrics.totalPOs,
            icon: Package,
            color: "text-blue-600",
            bgColor: isDark ? "bg-blue-900/20" : "bg-blue-50",
          },
          {
            label: "Order Created",
            value: metrics.orderCreatedPOs,
            icon: Calendar,
            color: "text-purple-600",
            bgColor: isDark ? "bg-purple-900/20" : "bg-purple-50",
          },
          {
            label: "Overdue",
            value: metrics.overduePOs,
            icon: AlertTriangle,
            color: "text-red-600",
            bgColor: isDark ? "bg-red-900/20" : "bg-red-50",
          },
          {
            label: "Completed",
            value: metrics.completedPOs,
            icon: Clock,
            color: "text-green-600",
            bgColor: isDark ? "bg-green-900/20" : "bg-green-50",
          },
        ].map(({ label, value, icon: Icon, color, bgColor }) => (
          <div
            key={label}
            className={`rounded-xl p-6 flex items-center justify-between transform hover:scale-105 transition-all duration-300 ${bgColor} ${
              isDark ? "shadow-lg hover:shadow-2xl" : "shadow-sm hover:shadow-md"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {label}
              </p>
              <h2 className="text-2xl font-bold mt-1">{value}</h2>
            </div>
            <Icon className={`h-10 w-10 ${color}`} />
          </div>
        ))}
      </div>
      {/* Filters Section */}
      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 md:p-6 mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`} />
            <input
              type="text"
              name="search"
              placeholder="Search POs, suppliers, products..."
              value={filters.search}
              onChange={handleFilterChange}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
              }`}
            />
          </div>
          {/* Date Range Filter */}
          <div className="relative">
            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`} />
            <input
              type="text"
              name="dateRange"
              placeholder="Date range (YYYY-MM-DD to YYYY-MM-DD)"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
              }`}
            />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredOrders.length} of {safeOrders.length} purchase orders
        </div>
      </div>
      {/* Purchase Orders Table */}
      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm overflow-hidden`}>
        <div className={`${isDark ? "bg-gray-700" : "bg-gray-50"} p-4 md:p-6`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className={`text-base md:text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              Purchase Orders ({filteredOrders.length})
            </h2>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <button
                className={`px-3 py-1 text-xs rounded-md ${
                  isDark ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => {
                  toast.info("Export to CSV/Excel coming soon!", {
                    position: "top-right",
                    autoClose: 3000,
                    theme: isDark ? "dark" : "light",
                  });
                }}
              >
                <Download className="w-3 h-3 mr-1 inline" />
                Export
              </button>
            </div>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {filters.search || filters.dateRange
                ? "No purchase orders match your filters"
                : "No purchase orders found"
              }
            </p>
            {(filters.search || filters.dateRange) && (
              <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Try adjusting your filters or create a new purchase order
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  {["PO #", "Supplier", "Status", "Deadline", "Items", "Actions"].map((header) => (
                    <th
                      key={header}
                      className={`px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-500"
                      } whitespace-nowrap`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${isDark ? "bg-gray-800" : "bg-white"} divide-y divide-gray-200 dark:divide-gray-700`}>
                {filteredOrders.map((order) => {
                  const totalItems = Array.isArray(order.items) ? order.items.length : 0;
                  const isOverdue = order.delivery_deadline &&
                    new Date(order.delivery_deadline) < new Date();
                  return (
                    <tr
                      key={order.id}
                      className={`${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`}
                    >
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          #{order.po_number || order.id}
                        </div>
                        <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : "No date"}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {order.supplier?.name || "N/A"}
                        </div>
                        <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {order.supplier?.email || "No email"}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status || "Order Created"} />
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {order.delivery_deadline ?
                              new Date(order.delivery_deadline).toLocaleDateString() :
                              "No deadline"
                            }
                          </span>
                          {isOverdue && (
                            <AlertTriangle className={`w-4 h-4 ml-2 ${isDark ? "text-red-400" : "text-red-600"}`} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <ItemsDisplay items={order.items || []} isDark={isDark} />
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? "text-gray-300 border border-gray-600 hover:bg-gray-700"
                                : "text-gray-600 border border-gray-300 hover:bg-gray-100"
                            }`}
                            onClick={() => handleViewOrder(order.id)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? "text-red-300 border border-red-600 hover:bg-red-700"
                                : "text-red-600 border border-red-300 hover:bg-red-100"
                            }`}
                            onClick={() => handleDeleteOrder(order.id, order.po_number)}
                            title="Delete PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal for viewing purchase order details */}
      <PurchaseOrderModal order={selectedOrder} isOpen={isModalOpen} onClose={closeModal} isDark={isDark} loadingDetails={loadingDetails} />
    </div>
  );
};

export default PurchaseOrderList;
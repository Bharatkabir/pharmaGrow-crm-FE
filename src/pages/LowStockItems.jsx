import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLowStockItems, generateLowStockItems, sendLowStockItems } from "../features/suppliers/lowStockSlice";
import { fetchSuppliersByProduct } from "../features/suppliers/supplierSlice";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Send, X } from "lucide-react";

const LowStockItems = ({ theme }) => {
  const dispatch = useDispatch();
  const { data: lowStockItems, loading, error } = useSelector(
    (state) => state.lowStock || { data: [], loading: false, error: null } // Changed from state.lowStockSlice to state.lowStock
  );
  const { productSuppliers } = useSelector(
    (state) => state.suppliers || { productSuppliers: {} }
  );
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_email: "",
    supplier_name: "",
    requested_quantities: {},
    delivery_deadline: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchLowStockItems())
      .unwrap()
      .catch((err) => {
        console.error("Fetch error:", err); // Debug log
        toast.error(err.message || "Failed to fetch low stock items", {
          position: "top-right",
          autoClose: 3000,
          theme: isDark ? "dark" : "light",
        });
      });
  }, [dispatch, isDark]);

  useEffect(() => {
    const safeData = Array.isArray(lowStockItems) ? lowStockItems : [];
    console.log("LowStockItems data:", safeData); // Debug log

    const supplierSet = new Set();
    const suppliers = safeData
      .filter((item) => item.supplier)
      .map((item) => ({
        id: item.supplier.id,
        name: item.supplier.name,
        email: item.supplier.email,
        priority: item.supplier.priority || "N/A",
        contact: item.supplier.contact || "N/A",
        address: item.supplier.address || "N/A",
      }))
      .filter((supplier) => {
        if (supplierSet.has(supplier.id)) return false;
        supplierSet.add(supplier.id);
        return true;
      });

    console.log("=== Low Stock Suppliers Data ===");
    console.table(suppliers);

    const productSet = new Set();
    const products = safeData
      .filter((item) => item.product)
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku || "N/A",
        product_code: item.product.product_code || "N/A",
        unit_price: item.product.unit_price || 0,
        max_stock: item.product.max_stock || 0,
        category_id: item.product.category_id || "N/A",
        supplier_ids: item.product.suppliers?.map((s) => s.id) || [item.supplier?.id] || [],
        hsn_code: item.product.hsn_code || "N/A",
        gst_rate: item.product.gst_rate || "N/A",
        batches: JSON.stringify(item.product.batches || []),
      }))
      .filter((product) => {
        if (productSet.has(product.id)) return false;
        productSet.add(product.id);
        return true;
      });

    console.log("=== Low Stock Products Data ===");
    console.table(products);
  }, [lowStockItems]);

  const handleGenerateLowStockItems = async () => {
    try {
      await dispatch(generateLowStockItems()).unwrap();
      toast.success("Low stock items generated successfully", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });
    } catch (err) {
      toast.error(err?.message || "Failed to generate low stock items", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });
    }
  };

  const handleSelectItem = (item) => {
    if (item.status !== "Pending") return;
    setSelectedItems((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i.id !== item.id);
      }
      if (prev.length === 0) {
        return [item];
      }
      const currentSupplierId = prev[0].supplier?.id;
      if (item.supplier?.id === currentSupplierId) {
        return [...prev, item];
      }
      toast.warn("Can only select items with the same supplier", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });
      return prev;
    });
  };

  const getSuppliersForProduct = (productId) => {
    return productSuppliers[productId] || [];
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.supplier_id) {
      errors.supplier_id = "Supplier is required";
    }
    if (!formData.supplier_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplier_email)) {
      errors.supplier_email = "Valid email is required";
    }
    if (!formData.supplier_name) {
      errors.supplier_name = "Supplier name is required";
    }
    if (!formData.delivery_deadline) {
      errors.delivery_deadline = "Delivery deadline is required";
    } else {
      const today = new Date().toISOString().split("T")[0]; // 2025-10-01
      if (formData.delivery_deadline < today) {
        errors.delivery_deadline = "Delivery deadline must be today or in the future";
      }
    }
    Object.entries(formData.requested_quantities).forEach(([itemId, qty]) => {
      if (!qty || Number(qty) <= 0 || !Number.isInteger(Number(qty))) {
        errors[`qty_${itemId}`] = "Quantity must be a positive whole number";
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = async (items) => {
    const itemsToSend = Array.isArray(items) ? items : [items];
    if (itemsToSend.some((item) => item.status !== "Pending")) {
      toast.warn("Some selected items have already been sent", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });
      return;
    }
    if (itemsToSend.length > 1 && new Set(itemsToSend.map((item) => item.supplier?.id)).size > 1) {
      toast.warn("Selected items must have the same supplier", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });
      return;
    }

    setSelectedItems(itemsToSend);
    try {
      await Promise.all(
        itemsToSend.map((item) => dispatch(fetchSuppliersByProduct(item.product.id)).unwrap())
      );
      const defaultSupplier = itemsToSend[0]?.supplier || {};
      const initialQuantities = {};
      itemsToSend.forEach((item) => {
        initialQuantities[item.id] = item.requested_qty || item.threshold_stock || "1";
      });
      setFormData({
        supplier_id: defaultSupplier.id || "",
        supplier_email: defaultSupplier.email || "",
        supplier_name: defaultSupplier.name || "",
        requested_quantities: initialQuantities,
        delivery_deadline: "",
      });
      setFormErrors({});
      setIsModalOpen(true);
    } catch (err) {
      toast.error("Failed to load suppliers for products", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItems([]);
    setFormData({ supplier_id: "", supplier_email: "", supplier_name: "", requested_quantities: {}, delivery_deadline: "" });
    setFormErrors({});
    setIsSending(false);
  };

  const handleInputChange = (e, itemId) => {
    const { name, value } = e.target;
    if (name === "requested_qty" && itemId) {
      setFormData((prev) => ({
        ...prev,
        requested_quantities: { ...prev.requested_quantities, [itemId]: value },
      }));
      setFormErrors((prev) => ({ ...prev, [`qty_${itemId}`]: "" }));
    } else if (name === "supplier_id") {
      const selectedSupplier = getSuppliersForProduct(selectedItems[0].product.id).find((s) => s.id === Number(value)) || {};
      setFormData((prev) => ({
        ...prev,
        supplier_id: value,
        supplier_email: selectedSupplier.email || prev.supplier_email,
        supplier_name: selectedSupplier.name || prev.supplier_name,
      }));
      setFormErrors((prev) => ({ ...prev, supplier_id: "", supplier_email: "", supplier_name: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSendOrder = async () => {
    if (!validateForm()) {
      toast.error("Please fix the form errors", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        suppliers: [
          {
            supplier_id: Number(formData.supplier_id),
            supplier_name: formData.supplier_name,
            supplier_email: formData.supplier_email,
            delivery_deadline: formData.delivery_deadline,
            subject: `Low Stock Order for ${formData.supplier_name}`,
            items: selectedItems.map((item) => ({
              product_id: item.product?.id,
              product_name: item.product?.name,
              requested_qty: Number(formData.requested_quantities[item.id]),
              buy_price: item.buy_price || 0,
            })),
          },
        ],
      };

      await dispatch(sendLowStockItems(payload)).unwrap();
      toast.success(
        `Order${selectedItems.length > 1 ? "s" : ""} for ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} sent to ${formData.supplier_email}`,
        {
          position: "top-right",
          autoClose: 3000,
          theme: isDark ? "dark" : "light",
        }
      );
      toast.success("Purchase order is also sent", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });

      dispatch(fetchLowStockItems()).unwrap().catch((err) => {
        toast.error(err?.message || "Failed to refresh low stock items", {
          position: "top-right",
          autoClose: 3000,
          theme: isDark ? "dark" : "light",
        });
      });
      closeModal();
    } catch (err) {
      toast.error(err?.message || "Failed to send order", {
        position: "top-right",
        autoClose: 3000,
        theme: isDark ? "dark" : "light",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority?.toLowerCase()) {
      case "primary":
        return isDark
          ? "bg-green-600 text-green-100"
          : "bg-green-100 text-green-800";
      case "normal":
        return isDark
          ? "bg-blue-600 text-blue-100"
          : "bg-blue-100 text-blue-800";
      case "low":
        return isDark
          ? "bg-gray-600 text-gray-100"
          : "bg-gray-100 text-gray-800";
      default:
        return isDark
          ? "bg-gray-500 text-gray-100"
          : "bg-gray-200 text-gray-700";
    }
  };

  const safeData = Array.isArray(lowStockItems) ? lowStockItems : [];

  return (
    <div className={`p-4 md:p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"} min-h-screen`}>
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Low Stock Items</h1>
          <p className={`mt-1 text-xs md:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Manage and reorder low stock inventory items
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={handleGenerateLowStockItems}
            className={`flex items-center px-4 py-2 rounded-lg shadow-sm transition-colors ${
              isDark ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Generate Low Stock Orders
          </button>
          <button
            onClick={() => openModal(selectedItems)}
            disabled={selectedItems.length === 0 || selectedItems.some((item) => item.status !== "Pending")}
            className={`flex items-center px-4 py-2 rounded-lg shadow-sm transition-colors ${
              selectedItems.length === 0 || selectedItems.some((item) => item.status !== "Pending")
                ? "bg-gray-500 text-white cursor-not-allowed"
                : isDark
                ? "bg-green-700 text-white hover:bg-green-800"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            <Send className="w-5 h-5 mr-2" />
            Send Selected Orders
          </button>
        </div>
      </div>

      {loading && safeData.length === 0 ? (
        <div className="text-center py-10">
          <div className="flex justify-center items-center">
            <div
              className={`w-10 h-10 border-4 ${isDark ? "border-blue-500" : "border-blue-600"} border-t-transparent rounded-full animate-spin`}
            ></div>
            <p className={`ml-4 text-lg ${isDark ? "text-blue-400" : "text-blue-600"}`}>Loading low stock items...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className={`text-lg ${isDark ? "text-red-400" : "text-red-600"}`}>Error: {error}</p>
        </div>
      ) : safeData.length === 0 ? (
        <div className="text-center py-10">
          <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-500"}`}>No low stock items found</p>
        </div>
      ) : (
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 md:p-6 overflow-x-auto`}>
          <h2 className={`text-base md:text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Low Stock Items ({safeData.length})
          </h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"} sticky top-0 z-10`}>
              <tr>
                <th className={`px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-500"} whitespace-nowrap`}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        const firstSupplierId = selectedItems[0]?.supplier?.id;
                        const itemsToSelect = firstSupplierId
                          ? safeData.filter((item) => item.status === "Pending" && item.supplier?.id === firstSupplierId)
                          : safeData.filter((item) => item.status === "Pending");
                        setSelectedItems(itemsToSelect);
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    checked={selectedItems.length > 0 && selectedItems.length === safeData.filter((item) => item.status === "Pending" && (!selectedItems[0]?.supplier?.id || item.supplier?.id === selectedItems[0]?.supplier?.id)).length}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600"
                  />
                </th>
                {["#", "Product", "Supplier", "Supplier Email", "Requested Qty", "Status", "Actions"].map((header) => (
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
              {safeData.map((item, index) => (
                <tr key={item.id} className={`animate-fade-in ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item)}
                      onChange={() => handleSelectItem(item)}
                      disabled={item.status !== "Pending" || (selectedItems.length > 0 && selectedItems[0].supplier?.id !== item.supplier?.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">{index + 1}</td>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                    <div className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                      {item.product?.name || "N/A"}
                    </div>
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {item.product?.product_code || "N/A"}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                    {item.supplier ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getPriorityStyles(item.supplier.priority)}`}>
                        {item.supplier.name} ({item.supplier.priority || "N/A"})
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">{item.supplier?.email || "N/A"}</td>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">{item.requested_qty || "N/A"}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100"
                          : "bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-100"
                      }`}
                    >
                      {item.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <button
                      onClick={() => openModal(item)}
                      className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                        isDark ? "text-blue-300 border-blue-600 hover:bg-blue-700" : "text-blue-600 border-blue-400 hover:bg-blue-100"
                      } ${item.status !== "Pending" ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={item.status !== "Pending"}
                      title={item.status !== "Pending" ? "Order already sent" : ""}
                    >
                      <Send className="w-4 h-4" />
                      Send Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedItems.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`${
              isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
            } p-6 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-95 hover:scale-100 relative animate-fade-in`}
          >
            {isSending && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 border-4 ${isDark ? "border-blue-400" : "border-blue-600"} border-t-transparent rounded-full animate-spin`}
                  ></div>
                  <p className={`mt-2 text-sm ${isDark ? "text-blue-400" : "text-blue-600"}`}>Sending order...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Order{selectedItems.length > 1 ? "s" : ""} for {selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-red-500 transition"
                disabled={isSending}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Supplier</label>
                {selectedItems.length === 1 ? (
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"
                    } ${formErrors.supplier_id ? "border-red-500" : ""}`}
                    required
                    disabled={isSending}
                  >
                    <option value="">Select a supplier</option>
                    {getSuppliersForProduct(selectedItems[0].product.id).map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.email}, {supplier.priority || "N/A"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={`${formData.supplier_name} (${formData.supplier_email}, ${selectedItems[0]?.supplier?.priority || "N/A"})`}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                      isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"
                    }`}
                    disabled
                  />
                )}
                {formErrors.supplier_id && <p className="text-xs text-red-500 mt-1">{formErrors.supplier_id}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Items</label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"} sticky top-0 z-10`}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-500"}`}>Product</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-500"}`}>Requested Qty</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? "bg-gray-800" : "bg-white"} divide-y divide-gray-200 dark:divide-gray-700`}>
                      {selectedItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.product?.name || "N/A"}</td>
                          <td className="px-4 py-2 text-sm">
                            <input
                              type="number"
                              name="requested_qty"
                              value={formData.requested_quantities[item.id] || ""}
                              onChange={(e) => handleInputChange(e, item.id)}
                              className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"
                              } ${formErrors[`qty_${item.id}`] ? "border-red-500" : ""}`}
                              min="1"
                              step="1"
                              required
                              disabled={isSending}
                            />
                            {formErrors[`qty_${item.id}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`qty_${item.id}`]}</p>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Delivery Deadline</label>
                <input
                  type="date"
                  name="delivery_deadline"
                  value={formData.delivery_deadline}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"
                    } ${formErrors.delivery_deadline ? "border-red-500" : ""}`}
                  min={new Date().toISOString().split("T")[0]} // 2025-10-01
                  required
                  disabled={isSending}
                />
                {formErrors.delivery_deadline && <p className="text-xs text-red-500 mt-1">{formErrors.delivery_deadline}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                } ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendOrder}
                className={`px-4 py-2 rounded-lg shadow-md transition-colors ${
                  isDark ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-blue-600 text-white hover:bg-blue-700"
                } ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={
                  !formData.supplier_id ||
                  !formData.supplier_email ||
                  !formData.supplier_name ||
                  !formData.delivery_deadline ||
                  Object.values(formData.requested_quantities).some((qty) => !qty || Number(qty) <= 0) ||
                  isSending
                }
              >
                Send Order{selectedItems.length > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockItems;
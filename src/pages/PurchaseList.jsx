import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPurchases, fetchPurchaseById, createPurchase, updatePurchase, deletePurchase, clearError } from "../features/suppliers/purchaseSlice";
import { fetchSuppliers } from "../features/suppliers/supplierSlice";
import { fetchProducts } from "../features/inventory/inventorySlice";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Package, AlertTriangle, Clock, Plus, Search, Calendar, ChevronLeft, X, RefreshCw, Eye, Edit } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiTrash2 } from "react-icons/fi";

// StatusBadge component for consistent status display
const StatusBadge = ({ status }) => {
  const statusStyles = {
    "Order Created": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };
  const style = statusStyles[status] || statusStyles.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
};

const PurchaseList = ({ theme }) => {
  const isDark = theme === "dark";
  const dispatch = useDispatch();

  // Redux state
  const purchases = useSelector((state) => state.purchases?.data || []);
  const { loading, error, single } = useSelector((state) => ({
    loading: state.purchases?.loading || false,
    error: state.purchases?.error || null,
    single: state.purchases?.single || null,
  }));
  const suppliers = useSelector((state) => state.suppliers?.data || []);
  const products = useSelector((state) => state.inventory?.products || []);

  // State for filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // State for form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [editPurchaseId, setEditPurchaseId] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: "",
    party_name: "",
    po_number: "",
    invoice_number: "",
    goods_category: "",
    cgst: "",
    sgst: "",
    igst: "",
    rate: "",
    round_off: "",
    product_description: "",
    vehicle_number: "",
    delivery_deadline: null,
    receiving_date: null,
    items: [{ product_id: "", quantity: "", buy_price: "" }],
  });
  const [formErrors, setFormErrors] = useState({});

  // State for view
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Memoize safePurchases
  const safePurchases = useMemo(() => {
    return Array.isArray(purchases) ? purchases : [];
  }, [purchases]);

  // Fetch data on mount
  useEffect(() => {
    const fetchWithRetry = async (action, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          await dispatch(action).unwrap();
          break;
        } catch (err) {
          console.error(`Fetch attempt ${i + 1} failed:`, err);
          if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, delay));
          else toast.error(`Failed to fetch data: ${err.message || err}`);
        }
      }
    };
    fetchWithRetry(fetchPurchases());
    fetchWithRetry(fetchSuppliers());
    fetchWithRetry(fetchProducts());
  }, [dispatch]);

  // Populate form data for edit
  useEffect(() => {
    if (formMode === "edit" && single && single.id === editPurchaseId) {
      setFormData({
        supplier_id: single.supplier_id || "",
        party_name: single.party_name || single.supplier?.name || "",
        po_number: single.po_number || "",
        invoice_number: single.invoice_number || "",
        goods_category: single.goods_category || "",
        cgst: single.cgst || "",
        sgst: single.sgst || "",
        igst: single.igst || "",
        rate: single.rate || "",
        round_off: single.round_off || "",
        product_description: single.product_description || "",
        vehicle_number: single.vehicle_number || "",
        delivery_deadline: single.delivery_deadline ? new Date(single.delivery_deadline) : null,
        receiving_date: single.receiving_date ? new Date(single.receiving_date) : null,
        items: Array.isArray(single.items) && single.items.length > 0
          ? single.items.map(item => ({
              product_id: item.product_id || item.product?.id || "",
              quantity: item.quantity || "",
              buy_price: item.buy_price || "",
            }))
          : [{ product_id: "", quantity: "", buy_price: "" }],
      });
      setFormErrors({});
    }
  }, [single, formMode, editPurchaseId]);

  // Memoize filtered purchases
  const filteredPurchases = useMemo(() => {
    let filtered = safePurchases;
    if (search) {
      filtered = filtered.filter((purchase) => {
        const poMatch = (purchase.po_number || "").toLowerCase().includes(search.toLowerCase());
        const invoiceMatch = (purchase.invoice_number || "").toLowerCase().includes(search.toLowerCase());
        const supplierMatch = (purchase.supplier?.name || "").toLowerCase().includes(search.toLowerCase());
        const partyMatch = (purchase.party_name || "").toLowerCase().includes(search.toLowerCase());
        const itemsMatch = Array.isArray(purchase.items) && purchase.items.some(item =>
          (item.product?.name || "").toLowerCase().includes(search.toLowerCase())
        );
        return poMatch || invoiceMatch || supplierMatch || partyMatch || itemsMatch;
      });
    }
    if (startDate && endDate) {
      filtered = filtered.filter((purchase) => {
        if (!purchase.receiving_date) return false;
        const purchaseDate = new Date(purchase.receiving_date);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return !isNaN(purchaseDate.getTime()) && purchaseDate >= start && purchaseDate <= end;
      });
    }
    return filtered;
  }, [safePurchases, search, startDate, endDate]);

  // Memoize metrics
  const metrics = useMemo(() => ({
    totalPurchases: safePurchases.length,
    highValuePurchases: filteredPurchases.filter((purchase) =>
      Array.isArray(purchase.items) &&
      purchase.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.buy_price || 0), 0) > 1000
    ).length,
    recentPurchases: filteredPurchases.filter((purchase) => {
      if (!purchase.receiving_date) return false;
      const date = new Date(purchase.receiving_date);
      const now = new Date();
      return (now - date) / (1000 * 60 * 60 * 24) <= 30;
    }).length,
  }), [safePurchases, filteredPurchases]);

  // Handle filter changes
  const handleFilterChange = (e) => setSearch(e.target.value);

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setStartDate(null);
    setEndDate(null);
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "supplier_id") {
      const selectedSupplier = suppliers.find(s => s.id === Number(value));
      setFormData(prev => ({
        ...prev,
        supplier_id: value,
        party_name: selectedSupplier?.name || prev.party_name,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Handle item changes
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [name]: value };
      return { ...prev, items: updatedItems };
    });
    setFormErrors(prev => ({
      ...prev,
      items: prev.items ? prev.items.map((item, i) => (i === index ? { ...item, [name]: "" } : item)) : prev.items,
    }));
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: "", quantity: "", buy_price: "", description: "" }],
    }));
  };

  // Remove item
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setFormErrors(prev => ({
      ...prev,
      items: prev.items ? prev.items.filter((_, i) => i !== index) : prev.items,
    }));
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Handle delivery date change
  const handleDeliveryDateChange = (date) => {
    setFormData(prev => ({ ...prev, delivery_deadline: date }));
    setFormErrors(prev => ({ ...prev, delivery_deadline: "" }));
  };

  // Handle receiving date change
  const handleReceivingDateChange = (date) => {
    setFormData(prev => ({ ...prev, receiving_date: date }));
    setFormErrors(prev => ({ ...prev, receiving_date: "" }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    if (!formData.supplier_id) {
      errors.supplier_id = "Supplier is required";
    }
    if (formData.items.length === 0) {
      errors.items = "At least one item is required";
    } else {
      const itemErrors = formData.items.map((item, index) => {
        const itemError = {};
        if (!item.product_id) {
          itemError.product_id = "Product ID is required";
        }
        if (!item.quantity || Number(item.quantity) <= 0 || !Number.isInteger(Number(item.quantity))) {
          itemError.quantity = "Quantity must be a positive whole number";
        }
        if (item.buy_price === "" || Number(item.buy_price) < 0) {
          itemError.buy_price = "Buy price must be non-negative";
        }
        return itemError;
      });
      if (itemErrors.some(error => Object.keys(error).length > 0)) {
        errors.items = itemErrors;
      }
    }
    if (formData.cgst !== "" && Number(formData.cgst) < 0) {
      errors.cgst = "CGST cannot be negative";
    }
    if (formData.sgst !== "" && Number(formData.sgst) < 0) {
      errors.sgst = "SGST cannot be negative";
    }
    if (formData.igst !== "" && Number(formData.igst) < 0) {
      errors.igst = "IGST cannot be negative";
    }
    if (formData.rate !== "" && Number(formData.rate) < 0) {
      errors.rate = "Rate cannot be negative";
    }
    return errors;
  };

  // Handle create or update purchase
  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMessages = [];
      if (errors.supplier_id) errorMessages.push(errors.supplier_id);
      if (errors.items && typeof errors.items === "string") {
        errorMessages.push(errors.items);
      } else if (errors.items) {
        errors.items.forEach((item, index) => {
          if (Object.keys(item).length > 0) {
            errorMessages.push(`Item ${index + 1}: ${Object.values(item).join(", ")}`);
          }
        });
      }
      if (errors.cgst) errorMessages.push(errors.cgst);
      if (errors.sgst) errorMessages.push(errors.sgst);
      if (errors.igst) errorMessages.push(errors.igst);
      if (errors.rate) errorMessages.push(errors.rate);
      toast.error(errorMessages.join("; "));
      return;
    }

    const payload = {
      supplier_id: Number(formData.supplier_id),
      party_name: formData.party_name || null,
      po_number: formData.po_number || null,
      invoice_number: formData.invoice_number || null,
      goods_category: formData.goods_category || null,
      cgst: formData.cgst ? Number(formData.cgst) : null,
      sgst: formData.sgst ? Number(formData.sgst) : null,
      igst: formData.igst ? Number(formData.igst) : null,
      rate: formData.rate ? Number(formData.rate) : null,
      round_off: formData.round_off ? Number(formData.round_off) : null,
      product_description: formData.product_description || null,
      vehicle_number: formData.vehicle_number || null,
      delivery_deadline: formData.delivery_deadline ? formatDate(formData.delivery_deadline) : null,
      receiving_date: formData.receiving_date ? formatDate(formData.receiving_date) : null,
      items: formData.items.map(item => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        buy_price: Number(item.buy_price),
        description: item.description || null,
      })),
    };

    try {
      const action = formMode === "edit" ? updatePurchase({ id: editPurchaseId, purchaseData: payload }) : createPurchase(payload);
      await dispatch(action).unwrap();
      toast.success(`Purchase ${formMode === "edit" ? "updated" : "created"} successfully`);
      setIsFormOpen(false);
      setFormMode("add");
      setEditPurchaseId(null);
      setFormData({
        supplier_id: "",
        party_name: "",
        po_number: "",
        invoice_number: "",
        goods_category: "",
        cgst: "",
        sgst: "",
        igst: "",
        rate: "",
        round_off: "",
        product_description: "",
        vehicle_number: "",
        delivery_deadline: null,
        receiving_date: null,
        items: [{ product_id: "", quantity: "", buy_price: "", description: "" }],
      });
      setFormErrors({});
      dispatch(fetchPurchases());
      setSelectedPurchase(null);
    } catch (err) {
      const errorMessage = err?.message || err?.response?.data?.message || `Failed to ${formMode === "edit" ? "update" : "create"} purchase`;
      const backendErrors = err?.response?.data?.errors || {};
      setFormErrors(backendErrors);
      toast.error(errorMessage);
    }
  };

  // Handle view action
  const handleView = async (id) => {
    try {
      await dispatch(fetchPurchaseById(id)).unwrap();
      setSelectedPurchase(id);
      setIsFormOpen(false);
    } catch (err) {
      toast.error("Failed to fetch purchase details");
    }
  };

  // Handle edit action
  const handleEdit = async (id) => {
    try {
      await dispatch(fetchPurchaseById(id)).unwrap();
      setEditPurchaseId(id);
      setFormMode("edit");
      setIsFormOpen(true);
      setSelectedPurchase(null);
      setFormErrors({});
    } catch (err) {
      toast.error("Failed to fetch purchase for editing");
    }
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this purchase?")) return;
    try {
      await dispatch(deletePurchase(id)).unwrap();
      toast.success("Purchase deleted successfully");
      if(selectedPurchase === id) {
        setSelectedPurchase(null);
      }
      dispatch(fetchPurchases());
    } catch (err) {
      toast.error("Failed to delete purchase");
    }
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setFormMode("add");
    setEditPurchaseId(null);
    setFormData({
      supplier_id: "",
      party_name: "",
      po_number: "",
      invoice_number: "",
      goods_category: "",
      cgst: "",
      sgst: "",
      igst: "",
      rate: "",
      round_off: "",
      product_description: "",
      vehicle_number: "",
      delivery_deadline: null,
      receiving_date: null,
      items: [{ product_id: "", quantity: "", buy_price: "", description: "" }],
    });
    setFormErrors({});
    dispatch(clearError());
  };

  // Handle back to list
  const handleBackClick = () => {
    setSelectedPurchase(null);
    setIsFormOpen(false);
    dispatch(clearError());
  };

  // Calculate total amount
  const calculateTotalAmount = (items) => {
    return items
      .reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.buy_price || 0), 0)
      .toFixed(2);
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-20">
      <div className="flex flex-col items-center">
        <div
          className={`w-12 h-12 border-4 ${isDark ? "border-blue-400" : "border-blue-600"} border-t-transparent rounded-full animate-spin mb-4`}
        ></div>
        <p className={`text-lg font-medium ${isDark ? "text-blue-300" : "text-blue-600"}`}>Loading purchases...</p>
      </div>
    </div>
  );

  if (loading && safePurchases.length === 0) {
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
          <p className={`text-lg font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>Error: {error.message || error}</p>
          <button
            onClick={() => dispatch(fetchPurchases())}
            className={`mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
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
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border: 1px solid ${isDark ? '#4B5563' : '#D1D5DB'};
          border-radius: 8px;
          background: ${isDark ? '#374151' : '#FFFFFF'};
          color: ${isDark ? '#F3F4F6' : '#111827'};
          outline: none;
        }
        .react-datepicker__input-container input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {selectedPurchase ? `Purchase #${single?.po_number || single?.id}` : "Purchases"}
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {selectedPurchase ? "Purchase details" : "Manage your purchase records"}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-wrap">
          {selectedPurchase && (
            <button
              onClick={handleBackClick}
              className={`flex items-center px-4 py-2 rounded-lg shadow-sm border transition-colors w-full sm:w-auto justify-center
                ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"}`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Purchases
            </button>
          )}
          {!selectedPurchase && (
            <>
              <button
                onClick={() => dispatch(fetchPurchases())}
                className={`flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ${
                  isDark ? "bg-gray-700 hover:bg-gray-600" : ""
                }`}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              {search || startDate || endDate ? (
                <button
                  onClick={resetFilters}
                  className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                    isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              ) : null}
              <button
                onClick={() => {
                  setFormMode("add");
                  setIsFormOpen(true);
                  setSelectedPurchase(null);
                  setFormErrors({});
                }}
                className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  isDark ? "hover:bg-blue-500" : ""
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Purchase
              </button>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {isFormOpen && !selectedPurchase && (
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-6 mb-6 animate-fade-in`}>
          <h2 className="text-lg font-semibold mb-4">{formMode === "edit" ? "Edit Purchase" : "Create New Purchase"}</h2>
          <form onSubmit={handleSubmitPurchase} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Supplier *</label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}
                    ${formErrors.supplier_id ? "border-red-500" : ""}`}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
                {formErrors.supplier_id && <p className="text-red-500 text-xs mt-1">{formErrors.supplier_id}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Party Name</label>
                <input
                  type="text"
                  name="party_name"
                  value={formData.party_name}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter party name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>PO Number</label>
                <input
                  type="text"
                  name="po_number"
                  value={formData.po_number}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter PO number"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Invoice Number</label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Goods Category</label>
                <input
                  type="text"
                  name="goods_category"
                  value={formData.goods_category}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter goods category"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>CGST (%)</label>
                <input
                  type="number"
                  name="cgst"
                  value={formData.cgst}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}
                    ${formErrors.cgst ? "border-red-500" : ""}`}
                  placeholder="Enter CGST"
                  min="0"
                  step="0.01"
                />
                {formErrors.cgst && <p className="text-red-500 text-xs mt-1">{formErrors.cgst}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>SGST (%)</label>
                <input
                  type="number"
                  name="sgst"
                  value={formData.sgst}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}
                    ${formErrors.sgst ? "border-red-500" : ""}`}
                  placeholder="Enter SGST"
                  min="0"
                  step="0.01"
                />
                {formErrors.sgst && <p className="text-red-500 text-xs mt-1">{formErrors.sgst}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>IGST (%)</label>
                <input
                  type="number"
                  name="igst"
                  value={formData.igst}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}
                    ${formErrors.igst ? "border-red-500" : ""}`}
                  placeholder="Enter IGST"
                  min="0"
                  step="0.01"
                />
                {formErrors.igst && <p className="text-red-500 text-xs mt-1">{formErrors.igst}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Rate</label>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}
                    ${formErrors.rate ? "border-red-500" : ""}`}
                  placeholder="Enter rate"
                  min="0"
                  step="0.01"
                />
                {formErrors.rate && <p className="text-red-500 text-xs mt-1">{formErrors.rate}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Round Off</label>
                <input
                  type="number"
                  name="round_off"
                  value={formData.round_off}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter round off"
                  step="0.01"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Product Description</label>
                <input
                  type="text"
                  name="product_description"
                  value={formData.product_description}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Vehicle Number</label>
                <input
                  type="text"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleFormChange}
                  className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter vehicle number"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Receiving Date</label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                  <DatePicker
                    selected={formData.receiving_date}
                    onChange={handleReceivingDateChange}
                    placeholderText="Select receiving date"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}
                      ${formErrors.receiving_date ? "border-red-500" : ""}`}
                    wrapperClassName="w-full"
                  />
                </div>
                {formErrors.receiving_date && <p className="text-red-500 text-xs mt-1">{formErrors.receiving_date}</p>}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-2">Purchase Items</h3>
              {formErrors.items && typeof formErrors.items === "string" && (
                <p className="text-red-500 text-xs mb-2">{formErrors.items}</p>
              )}
              {formData.items.map((item, index) => (
                <div key={index} className="mb-4 border-b pb-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Product *</label>
                      <select
                        name="product_id"
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, e)}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}
                          ${formErrors.items?.[index]?.product_id ? "border-red-500" : ""}`}
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                      {formErrors.items?.[index]?.product_id && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.items[index].product_id}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}
                          ${formErrors.items?.[index]?.quantity ? "border-red-500" : ""}`}
                        placeholder="Quantity"
                        min="1"
                        step="1"
                        required
                      />
                      {formErrors.items?.[index]?.quantity && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.items[index].quantity}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Buy Price *</label>
                      <input
                        type="number"
                        name="buy_price"
                        value={item.buy_price}
                        onChange={(e) => handleItemChange(index, e)}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}
                          ${formErrors.items?.[index]?.buy_price ? "border-red-500" : ""}`}
                        placeholder="Buy Price"
                        min="0"
                        step="0.01"
                        required
                      />
                      {formErrors.items?.[index]?.buy_price && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.items[index].buy_price}</p>
                      )}
                    </div>
                  </div>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <FiTrash2 className="inline w-4 h-4 mr-1" />
                      Remove Item
                    </button>
                  )}
                  <div className="mt-2">
                    <p className="text-sm">
                      Item Total: ₹{(Number(item.quantity || 0) * Number(item.buy_price || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                  isDark ? "hover:bg-green-500" : ""
                }`}
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Add Item
              </button>
              <div className="mt-4">
                <p className="text-sm font-semibold">
                  Total Amount: ₹{calculateTotalAmount(formData.items)}
                </p>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCancelForm}
                className={`px-4 py-2 rounded-lg border transition-colors
                  ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {formMode === "edit" ? "Update Purchase" : "Create Purchase"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Purchase Details */}
      {selectedPurchase && single && single.id === selectedPurchase && (
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-6 mb-6 animate-fade-in`}>
          <h2 className="text-lg font-semibold mb-4">Purchase #{single.po_number || single.id}</h2>
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 border-4 ${isDark ? "border-blue-400" : "border-blue-600"} border-t-transparent rounded-full animate-spin mb-4`}
                ></div>
                <p className={`text-lg font-medium ${isDark ? "text-blue-300" : "text-blue-600"}`}>Loading purchase details...</p>
              </div>
            </div>
          )}
          {!loading && (
            <div className="space-y-8">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold mb-4">Purchase Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Supplier</p>
                    <p className="text-base font-medium">{single.supplier?.name || "N/A"}</p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{single.supplier?.email || "No email"}</p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{single.supplier?.address || "No address"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>PO Number</p>
                    <p className="text-base">{single.po_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Invoice Number</p>
                    <p className="text-base">{single.invoice_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Party Name</p>
                    <p className="text-base">{single.party_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Goods Category</p>
                    <p className="text-base">{single.goods_category || "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>CGST</p>
                    <p className="text-base">{single.cgst ? `${single.cgst}%` : "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>SGST</p>
                    <p className="text-base">{single.sgst ? `${single.sgst}%` : "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>IGST</p>
                    <p className="text-base">{single.igst ? `${single.igst}%` : "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Rate</p>
                    <p className="text-base">{single.rate ? `₹${single.rate}` : "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Round Off</p>
                    <p className="text-base">{single.round_off ? `₹${single.round_off}` : "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Product Description</p>
                    <p className="text-base">{single.product_description || "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Vehicle Number</p>
                    <p className="text-base">{single.vehicle_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Created</p>
                    <p className="text-base">{single.created_at ? new Date(single.created_at).toLocaleDateString() : "No date"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Receiving Date</p>
                    <p className="text-base">{single.receiving_date ? new Date(single.receiving_date).toLocaleDateString() : "No date"}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Items</h3>
                {Array.isArray(single.items) && single.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                        <tr>
                          {["Product", "SKU", "Quantity", "Buy Price", "Total"].map((header) => (
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
                        {single.items.map((item, index) => (
                          <tr key={item.id || index} className={`${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`}>
                            <td className="px-4 py-3 text-sm font-medium">{item.product?.name || "Unknown Product"}</td>
                            <td className="px-4 py-3 text-sm">{item.product?.sku || "N/A"}</td>
                            <td className="px-4 py-3 text-sm">{Number(item.quantity)} pcs</td>
                            <td className="px-4 py-3 text-sm">₹{Number(item.buy_price).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm">₹{(Number(item.quantity) * Number(item.buy_price)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">
                        Total Amount: ₹{calculateTotalAmount(single.items)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>No items</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Cards */}
      {!selectedPurchase && !isFormOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total Purchases",
              value: metrics.totalPurchases,
              icon: Package,
              color: "text-blue-600",
              bgColor: isDark ? "bg-blue-900/20" : "bg-blue-50",
            },
            {
              label: "High Value",
              value: metrics.highValuePurchases,
              icon: Package,
              color: "text-purple-600",
              bgColor: isDark ? "bg-purple-900/20" : "bg-purple-50",
            },
            {
              label: "Recent (30 days)",
              value: metrics.recentPurchases,
              icon: Calendar,
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
                <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                <h2 className="text-2xl font-bold mt-1">{value}</h2>
              </div>
              <Icon className={`h-10 w-10 ${color}`} />
            </div>
          ))}
        </div>
      )}

      {/* Filters Section */}
      {!selectedPurchase && !isFormOpen && (
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 mb-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
              <input
                type="text"
                placeholder="Search POs, invoices, suppliers, products..."
                value={search}
                onChange={handleFilterChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              />
            </div>
            <div className="relative">
              <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateRangeChange}
                placeholderText="Select date range"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                wrapperClassName="w-full"
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredPurchases.length} of {safePurchases.length} purchases
          </div>
        </div>
      )}

      {/* Purchases Table */}
      {!selectedPurchase && !isFormOpen && (
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-4 md:p-6 overflow-x-auto`}>
          <h2 className="text-base md:text-lg font-semibold mb-4">Purchases ({filteredPurchases.length})</h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <tr>
                {["PO #", "Invoice #", "Supplier", "Items", "Total Quantity", "Total Cost", "Receiving Date", "Actions"].map((head) => (
                  <th
                    key={head}
                    scope="col"
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    {search || startDate || endDate ? "No purchases match your filters" : "No purchases found"}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const totalQuantity = Array.isArray(purchase.items) ? purchase.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0;
                  const totalCost = Array.isArray(purchase.items) ? purchase.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.buy_price || 0), 0) : 0;
                  return (
                    <tr key={purchase.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                        #{purchase.po_number || purchase.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{purchase.invoice_number || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{purchase.supplier?.name || "N/A"}</div>
                        <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{purchase.party_name || "No party name"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {Array.isArray(purchase.items) && purchase.items.length > 0 ? (
                          <ul className="space-y-3">
                            {purchase.items.map((item, idx) => (
                              <li
                                key={idx}
                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm hover:shadow-md transition duration-200 border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <Package size={16} className="text-blue-500 dark:text-blue-400" />
                                    <div>
                                      <p className="font-semibold text-gray-900 dark:text-gray-100">{item.product?.name || "Unknown Product"}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.description || "No description"}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Qty: {item.quantity || "-"}</p>
                                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                      ₹{(Number(item.quantity || 0) * Number(item.buy_price || 0)).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 italic">No items</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{totalQuantity} pcs</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">₹{totalCost.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{purchase.receiving_date ? new Date(purchase.receiving_date).toLocaleDateString() : "No date"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(purchase.id)}
                            className={`p-2 border rounded-lg ${isDark ? "text-blue-300 border-blue-600 hover:bg-blue-700" : "text-blue-600 border-blue-300 hover:bg-blue-100"}`}
                            aria-label={`View purchase ${purchase.id}`}
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => handleEdit(purchase.id)}
                            className={`p-2 border rounded-lg ${isDark ? "text-yellow-300 border-yellow-600 hover:bg-yellow-700" : "text-yellow-600 border-yellow-300 hover:bg-yellow-100"}`}
                            aria-label={`Edit purchase ${purchase.id}`}
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(purchase.id)}
                            className={`p-2 border rounded-lg ${isDark ? "text-red-300 border-red-600 hover:bg-red-700" : "text-red-600 border-red-300 hover:bg-red-100"}`}
                            aria-label={`Delete purchase ${purchase.id}`}
                          >
                            <FiTrash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseList;
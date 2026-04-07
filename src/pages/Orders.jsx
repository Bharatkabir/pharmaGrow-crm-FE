import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGroupedOrders,
  fetchOrders,
  createOrder,
  deleteOrder,
} from "../features/orders/orderSlice";
import { fetchCustomers } from "../features/customers/customerSlice";
import { fetchProducts, fetchBatches } from "../features/inventory/inventorySlice";
import {
  fetchDiscountRule,
  saveDiscountRule,
} from "../features/discount/discountSlice";
import {
  Search,
  Package,
  Clock,
  Truck,
  CheckCircle,
  Eye,
  ChevronLeft,
  Hash,
  Percent,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiTrash2 } from "react-icons/fi";

const calcFinalPrice = (base, type, value) => {
  if (!type || value == null || value <= 0) return base;
  const val = Number(value);
  if (isNaN(val)) return base;
  return type === "percentage" ? base * (1 - val / 100) : base - val;
};

const applyOrderDiscount = (subtotal, type, value) => {
  if (!type || value == null || value <= 0) return { discounted: subtotal, discountAmount: 0 };
  const val = Number(value);
  if (isNaN(val)) return { discounted: subtotal, discountAmount: 0 };
  const discount = type === "percentage" ? subtotal * (val / 100) : val;
  return { discounted: Math.max(0, subtotal - discount), discountAmount: discount };
};

const formatPrice = (value) => {
  const num = Number(value);
  if (isNaN(num) || num <= 0) return "—";
  return `₹${num.toFixed(2)}`;
};

export default function Orders({ theme }) {
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const toastShown = useRef(false); // Prevent duplicate toast

  // Redux selectors
  const { orders = [], groupedOrders = [], loading: ordersLoading, error: ordersError } = useSelector(
    (state) => state.orders || {}
  );
  const { customers = [], loading: customersLoading } = useSelector(
    (state) => state.customers || {}
  );
  const { products = [], batches = [], loading: inventoryLoading } = useSelector(
    (state) => state.inventory || {}
  );
  const { user } = useSelector((state) => state.auth || {});
  const { rule: discountRule, loading: discountLoading } = useSelector(
    (state) => state.discount || {}
  );

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState("grouped");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All Years");
  const [monthFilter, setMonthFilter] = useState("All Months");

  // Form data
  const [formData, setFormData] = useState({
    customer_id: "",
    date: new Date().toISOString().split("T")[0],
    payment: "Pending",
    status: "Processing",
    billing: { name: "", email: "", phone: "", address_line1: "", city: "", state: "", postal_code: "", country: "" },
    shipping: { name: "", email: "", phone: "", address_line1: "", city: "", state: "", postal_code: "", country: "" },
    gst_number: "",
  });

  // Line items
  const [newItems, setNewItems] = useState([
    { product_id: "", batch_id: "", quantity: 1, hsn_code: "", gst_rate: 0 },
  ]);

  // Manual discount
  const [orderDiscountType, setOrderDiscountType] = useState("none");
  const [orderDiscountValue, setOrderDiscountValue] = useState(0);
  const [manualOverride, setManualOverride] = useState(false);

  // Discount modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempThreshold, setTempThreshold] = useState("20000");
  const [tempType, setTempType] = useState("percentage");
  const [tempValue, setTempValue] = useState("5");

  // Filters & years
  const uniqueYears = useMemo(() => {
    const years = [...new Set(orders.map((o) => o.date?.split("-")[0] || ""))].filter(Boolean);
    return years.sort((a, b) => b - a);
  }, [orders]);

  const months = [
    { value: "All Months", label: "All Months" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Data fetching
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchBatches());
    dispatch(fetchGroupedOrders());
    dispatch(fetchOrders());
    dispatch(fetchCustomers());
    dispatch(fetchDiscountRule());
  }, [dispatch]);

  // Sync modal with current rule
  useEffect(() => {
    if (isDiscountModalOpen && discountRule) {
      setTempThreshold(discountRule.min_order_amount?.toString() || "20000");
      setTempType(discountRule.discount_type || "percentage");
      setTempValue(discountRule.discount_value?.toString() || "5");
    }
  }, [isDiscountModalOpen, discountRule]);

  // Auto-fill customer
  useEffect(() => {
    if (formData.customer_id) {
      const customer = customers.find((c) => c.id === parseInt(formData.customer_id));
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          billing: { ...customer },
          shipping: { ...customer },
          gst_number: customer.gst_number || "",
        }));
        setNewItems([{ product_id: "", batch_id: "", quantity: 1, hsn_code: "", gst_rate: 0 }]);
      } else {
        resetFormData();
      }
    } else {
      resetFormData();
    }
  }, [formData.customer_id, customers]);

  const resetFormData = () => {
    setFormData({
      customer_id: "",
      date: new Date().toISOString().split("T")[0],
      payment: "Pending",
      status: "Processing",
      billing: { name: "", email: "", phone: "", address_line1: "", city: "", state: "", postal_code: "", country: "" },
      shipping: { name: "", email: "", phone: "", address_line1: "", city: "", state: "", postal_code: "", country: "" },
      gst_number: "",
    });
    setNewItems([{ product_id: "", batch_id: "", quantity: 1, hsn_code: "", gst_rate: 0 }]);
    setOrderDiscountType("none");
    setOrderDiscountValue(0);
    setManualOverride(false);
    toastShown.current = false;
  };

  // TOTALS — IMPROVED DISCOUNT LOGIC
  const calculateTotals = useMemo(() => {
    const lineDetails = newItems.map((item) => {
      const product = products.find((p) => p.id === parseInt(item.product_id));
      if (!product?.current_price) return { afterProduct: 0, qty: 0, lineSubtotal: 0, gstRate: 0 };

      const sellPrice = Number(product.current_price.sell_price) || 0;
      const afterProduct = calcFinalPrice(sellPrice, product.current_price.discount_type, product.current_price.discount_value);
      const qty = Number(item.quantity) || 0;
      const gstRate = Number(item.gst_rate) || 0;

      return { afterProduct, qty, lineSubtotal: qty * afterProduct, gstRate };
    });

    const subtotal = lineDetails.reduce((acc, l) => acc + l.lineSubtotal, 0);

    let appliedType = null;
    let appliedValue = null;
    let source = "none";

    // Manual override
    if (manualOverride && orderDiscountType !== "none") {
      appliedType = orderDiscountType;
      appliedValue = orderDiscountValue;
      source = "manual";
    }
    // Auto discount
    else if (discountRule && subtotal >= Number(discountRule.min_order_amount)) {
      appliedType = discountRule.discount_type;
      appliedValue = discountRule.discount_value;
      source = "auto";

      // Show toast only once
      if (!toastShown.current) {
        toast.info(
          `${appliedValue}${appliedType === "percentage" ? "%" : " ₹"} auto discount applied!`,
          { theme: isDark ? "dark" : "light" }
        );
        toastShown.current = true;
      }
    }

    const { discounted: afterOrder, discountAmount } = applyOrderDiscount(subtotal, appliedType, appliedValue);
    const discountRatio = subtotal > 0 ? afterOrder / subtotal : 1;

    let totalGst = 0;
    let grandTotal = 0;

    const finalLines = lineDetails.map((line, idx) => {
      const discountedLine = line.lineSubtotal * discountRatio;
      const lineGst = discountedLine * (line.gstRate / 100);
      const lineTotal = discountedLine + lineGst;

      totalGst += lineGst;
      grandTotal += lineTotal;

      return {
        unitPriceExGst: line.qty > 0 ? (discountedLine / line.qty).toFixed(2) : "0.00",
        lineTotal: lineTotal.toFixed(2),
      };
    });

    return {
      subtotal: subtotal.toFixed(2),
      subtotalAfterOrderDiscount: afterOrder.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalGst: totalGst.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      hasDiscount: discountAmount > 0,
      discountLabel: appliedType === "percentage" ? `${appliedValue}%` : `₹${appliedValue}`,
      source,
      finalLines,
    };
  }, [
    newItems,
    products,
    discountRule,
    manualOverride,
    orderDiscountType,
    orderDiscountValue,
    isDark,
  ]);

  const {
    subtotal,
    subtotalAfterOrderDiscount,
    discountAmount,
    totalGst,
    grandTotal,
    hasDiscount,
    discountLabel,
    source,
    finalLines = [],
  } = calculateTotals;

  // Handlers
  const handleInputChange = (e, addressType = null) => {
    const { name, value } = e.target;
    if (addressType) {
      setFormData((prev) => ({
        ...prev,
        [addressType]: { ...prev[addressType], [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNewItemChange = (index, e) => {
    const { name, value } = e.target;
    setNewItems((prev) => {
      const updated = [...prev];
      if (name === "product_id") {
        const product = products.find((p) => p.id === parseInt(value));
        updated[index] = {
          product_id: value,
          batch_id: "",
          quantity: 1,
          hsn_code: product?.hsn_code || "",
          gst_rate: product?.gst_rate ? parseFloat(product.gst_rate) : 0,
        };
      } else if (name === "batch_id") {
        updated[index] = { ...updated[index], batch_id: value };
      } else {
        updated[index] = { ...updated[index], [name]: value };
      }
      return updated;
    });
  };

  const handleAddItem = () =>
    setNewItems((prev) => [
      ...prev,
      { product_id: "", batch_id: "", quantity: 1, hsn_code: "", gst_rate: 0 },
    ]);

  const handleRemoveItem = (index) => {
    if (newItems.length === 1) return;
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDiscountRule = async () => {
    const threshold = Number(tempThreshold);
    const value = Number(tempValue);

    if (!threshold || threshold <= 0) {
      toast.error("Minimum order amount is required.", { theme: isDark ? "dark" : "light" });
      return;
    }
    if (!tempType) {
      toast.error("Discount type is required.", { theme: isDark ? "dark" : "light" });
      return;
    }
    if (!value || value <= 0 || (tempType === "percentage" && value > 100)) {
      toast.error(
        tempType === "percentage"
          ? "Percentage must be 0.01–100."
          : "Fixed amount must be > 0.",
        { theme: isDark ? "dark" : "light" }
      );
      return;
    }

    try {
      const payload = {
        min_order_amount: threshold,
        discount_type: tempType,
        discount_value: value,
      };

      const savedRule = await dispatch(saveDiscountRule(payload)).unwrap();

      toast.success(
        `${savedRule.discount_value}${savedRule.discount_type === "percentage" ? "%" : " ₹"} off on orders ≥ ₹${savedRule.min_order_amount}`,
        { theme: isDark ? "dark" : "light" }
      );
      setIsDiscountModalOpen(false);
    } catch (err) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(" ")
        : err?.message || "Failed to save discount rule";
      toast.error(msg, { theme: isDark ? "dark" : "light" });
    }
  };

  const handleDiscountTypeChange = (type) => {
    setOrderDiscountType(type);
    setManualOverride(type !== "none");
    if (type === "none") setOrderDiscountValue(0);
    toastShown.current = false; // Reset toast on manual change
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (
      !formData.customer_id ||
      !formData.date ||
      !formData.billing.name ||
      !formData.billing.address_line1 ||
      !formData.billing.city ||
      !formData.billing.state ||
      !formData.billing.postal_code ||
      !formData.billing.country ||
      !formData.shipping.name ||
      !formData.shipping.address_line1 ||
      !formData.shipping.city ||
      !formData.shipping.state ||
      !formData.shipping.postal_code ||
      !formData.shipping.country
    ) {
      toast.error("Fill all required fields.", { theme: isDark ? "dark" : "light" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.billing.email && !emailRegex.test(formData.billing.email)) {
      toast.error("Invalid billing email.", { theme: isDark ? "dark" : "light" });
      return;
    }
    if (formData.shipping.email && !emailRegex.test(formData.shipping.email)) {
      toast.error("Invalid shipping email.", { theme: isDark ? "dark" : "light" });
      return;
    }

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      if (
        !item.product_id ||
        item.quantity < 1 ||
        !item.hsn_code ||
        item.gst_rate < 0 ||
        item.gst_rate > 28
      ) {
        toast.error(`Item ${i + 1}: Invalid details.`, { theme: isDark ? "dark" : "light" });
        return;
      }
    }

    const keys = newItems.map((i) => `${i.product_id}-${i.batch_id || "null"}`);
    if (new Set(keys).size !== keys.length) {
      toast.error("Duplicate product-batch not allowed.", { theme: isDark ? "dark" : "light" });
      return;
    }

    try {
      const payload = {
        customer_id: parseInt(formData.customer_id),
        date: formData.date,
        payment: formData.payment,
        status: formData.status,
        billing: formData.billing,
        shipping: formData.shipping,
        gst_number: formData.gst_number,
        subtotal: parseFloat(subtotal),
        order_discount_type: source === "auto" ? discountRule.discount_type : (manualOverride ? orderDiscountType : null),
        order_discount_value: source === "auto" ? discountRule.discount_value : (manualOverride ? Number(orderDiscountValue) : null),
        items: newItems.map((item, idx) => ({
          product_id: parseInt(item.product_id),
          batch_id: parseInt(item.batch_id) || null,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(finalLines[idx]?.unitPriceExGst || 0),
          hsn_code: item.hsn_code,
          gst_rate: parseFloat(item.gst_rate),
        })),
      };

      await dispatch(createOrder(payload)).unwrap();

      resetFormData();
      setIsFormOpen(false);
      dispatch(fetchGroupedOrders());
      dispatch(fetchOrders());
      toast.success("Order created!", { theme: isDark ? "dark" : "light" });
    } catch (err) {
      toast.error(err?.message || "Failed to create order.", { theme: isDark ? "dark" : "light" });
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await dispatch(deleteOrder(id)).unwrap();
      toast.success("Order deleted.", { theme: isDark ? "dark" : "light" });
      if (selectedGroup) {
        const updated = selectedGroup.records.filter((o) => o.id !== id);
        setSelectedGroup(updated.length ? { ...selectedGroup, records: updated } : null);
      }
      await Promise.all([dispatch(fetchGroupedOrders()), dispatch(fetchOrders())]);
    } catch (err) {
      toast.error(err?.message || "Delete failed.", { theme: isDark ? "dark" : "light" });
    }
  };

  const handleCreateOrderClick = () => setIsFormOpen(true);
  const handleCancelClick = () => {
    setIsFormOpen(false);
    resetFormData();
    setFormError(null);
  };
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedGroup(null);
  };
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setSelectedGroup(null);
  };
  const handleYearFilterChange = (e) => {
    setYearFilter(e.target.value);
    setSelectedGroup(null);
  };
  const handleMonthFilterChange = (e) => {
    setMonthFilter(e.target.value);
    setSelectedGroup(null);
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedGroup(null);
  };
  const handleViewClick = (group) => setSelectedGroup(group);
  const handleBackClick = () => setSelectedGroup(null);

  // Filtering
  const filteredGroupedOrders = useMemo(() => {
    return groupedOrders.filter((g) => {
      const [y, m] = g.date.split("-");
      return (
        (statusFilter === "All Status" || g.records.some((r) => r.status === statusFilter)) &&
        (g.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || g.date.includes(searchQuery)) &&
        (yearFilter === "All Years" || y === yearFilter) &&
        (monthFilter === "All Months" || m === monthFilter)
      );
    });
  }, [groupedOrders, statusFilter, searchQuery, yearFilter, monthFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const [y, m] = o.date.split("-");
      return (
        (o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.id.toString().includes(searchQuery) ||
          o.date.includes(searchQuery)) &&
        (yearFilter === "All Years" || y === yearFilter) &&
        (monthFilter === "All Months" || m === monthFilter)
      );
    });
  }, [orders, searchQuery, yearFilter, monthFilter]);

  const totalOrders = filteredOrders.length;
  const processingOrders = filteredOrders.filter((o) => o.status === "Processing").length;
  const shippedOrders = filteredOrders.filter((o) => o.status === "Shipped").length;
  const deliveredOrders = filteredOrders.filter((o) => o.status === "Delivered").length;

  const getPaymentStatus = (records) => {
    const payments = records.map((r) => r.payment);
    const unique = [...new Set(payments)];
    if (unique.length === 1) return unique[0];
    const counts = {};
    payments.forEach((p) => (counts[p] = (counts[p] || 0) + 1));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = sorted[0][1];
    const top = sorted.filter(([_, c]) => c === max).map(([s]) => s);
    return top.length > 1 || !["Paid", "Pending"].includes(top[0])
      ? "Partial"
      : top[0] === "Paid"
      ? "Partial Paid"
      : "Partial Pending";
  };

const getStatusDots = (records) => {
    const map = { Processing: "🟠", Shipped: "🔵", Delivered: "🟢", Cancelled: "🟣", Returned: "🔴" };
    const unique = [...new Set(records.map((r) => r.status))];
    return unique.map((s) => map[s] || "").join("") || "🟤";
  };

  const getStatusPill = (s) => {
    const map = {
      Processing: "bg-yellow-100 text-yellow-800",
      Shipped: "bg-indigo-100 text-indigo-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-gray-200 text-gray-800",
      Returned: "bg-red-100 text-red-800",
    };
    return map[s] || "bg-gray-100 text-gray-800";
  };

  const getPaymentPill = (p) => {
    const map = {
      Paid: "bg-blue-100 text-blue-800",
      "Partial Paid": "bg-blue-100 text-blue-800",
      Pending: "bg-red-100 text-red-800",
      "Partial Pending": "bg-red-100 text-red-800",
      Refund: "bg-purple-100 text-purple-800",
      Failed: "bg-orange-100 text-orange-800",
      COD: "bg-teal-100 text-teal-800",
      Partial: "bg-gray-100 text-gray-800",
    };
    return map[p] || "bg-gray-100 text-gray-800";
  };

  const filteredProducts = products?.filter((p) => p.hsn_code && p.gst_rate != null) || [];
  const hasPermission = (p) => user?.permissions_list?.includes(p) || false;

  return (
    <div className={`p-4 md:p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <ToastContainer position="top-right" autoClose={3000} theme={isDark ? "dark" : "light"} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {selectedGroup
              ? `Orders for ${selectedGroup.customer_name}`
              : viewMode === "grouped"
              ? "Grouped Orders"
              : "All Orders"}
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {selectedGroup ? `Date: ${selectedGroup.date}` : "Manage customer orders"}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-wrap">
          {hasPermission("orders-set-auto-discount") && (
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              disabled={discountLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Percent className="w-5 h-5" />
              Set Auto Discount
            </button>
          )}

          {!selectedGroup && (
            <>
              <select
                value={yearFilter}
                onChange={handleYearFilterChange}
                className={`border rounded-lg px-3 py-2 text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              >
                <option value="All Years">All Years</option>
                {uniqueYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={monthFilter}
                onChange={handleMonthFilterChange}
                className={`border rounded-lg px-3 py-2 text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </>
          )}
          {selectedGroup && (
            <button
              onClick={handleBackClick}
              className={`flex items-center px-4 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"}`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </button>
          )}
          {hasPermission("orders-create") && (
            <button
              onClick={handleCreateOrderClick}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create Order
            </button>
          )}
        </div>
      </div>

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg p-6 w-96 shadow-xl`}>
            <h2 className="text-xl font-bold mb-4">Set Auto Discount Rule</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Minimum Order Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(e.target.value)}
                  className={`mt-1 p-2 border rounded-lg w-full ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                  placeholder="e.g. 20000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Discount Type *</label>
                <select
                  value={tempType}
                  onChange={(e) => setTempType(e.target.value)}
                  className={`mt-1 p-2 border rounded-lg w-full ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Discount Value * {tempType === "percentage" ? "(0.01–100)" : "(₹)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={tempType === "percentage" ? "100" : undefined}
                  step={tempType === "percentage" ? "0.01" : "1"}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className={`mt-1 p-2 border rounded-lg w-full ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                  placeholder={tempType === "percentage" ? "e.g. 5" : "e.g. 500"}
                />
              </div>
              <div className="text-sm text-gray-500">
                Current: {discountRule ? `${discountRule.discount_value}${discountRule.discount_type === "percentage" ? "%" : " ₹"} off ≥ ₹${discountRule.min_order_amount}` : "No rule set"}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className={`px-4 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-gray-50 border-gray-300 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiscountRule}
                disabled={discountLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {discountLoading ? "Saving..." : "Save Rule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Form */}
      {isFormOpen && hasPermission("orders-create") && (
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-6 mb-6`}>
          <h2 className="text-lg font-semibold mb-4">Create New Order</h2>
          {formError && <p className="text-red-500 mb-4">{formError}</p>}

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer, GST, Date, Payment, Status */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Customer</label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleInputChange}
                className={`mt-1 p-2 border rounded-lg w-full text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                required
                disabled={customersLoading}
              >
                <option value="">Select Customer</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>GST Number</label>
              <input
                type="text"
                value={formData.gst_number || "N/A"}
                readOnly
                className={`mt-1 p-2 border rounded-lg w-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Order Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`mt-1 p-2 border rounded-lg w-full text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Payment</label>
              <select
                name="payment"
                value={formData.payment}
                onChange={handleInputChange}
                className={`mt-1 p-2 border rounded-lg w-full text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              >
                {["Pending", "Paid", "Refund", "Failed", "COD"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`mt-1 p-2 border rounded-lg w-full text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              >
                {["Processing", "Shipped", "Delivered", "Cancelled", "Returned"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>         

            {/* Billing & Shipping */}
            {["billing", "shipping"].map((type) => (
              <div key={type} className="md:col-span-2">
                <h3 className="font-semibold mb-2">{type.charAt(0).toUpperCase() + type.slice(1)} Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["name", "email", "phone", "address_line1", "city", "state", "postal_code", "country"].map((field) => (
                    <div key={field}>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} capitalize`}>
                        {field.replace(/_/g, " ")} {["name", "address_line1", "city", "state", "postal_code", "country"].includes(field) ? "*" : ""}
                      </label>
                      <input
                        type={field === "email" ? "email" : "text"}
                        name={field}
                        value={formData[type][field]}
                        onChange={(e) => handleInputChange(e, type)}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                        required={["name", "address_line1", "city", "state", "postal_code", "country"].includes(field)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Order Items */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-2">Order Items</h3>
              {newItems.map((item, index) => {
                const product = products.find((p) => p.id === parseInt(item.product_id));
                const price = product?.current_price || {};
                const sellPrice = Number(price.sell_price) || 0;
                const finalPrice = calcFinalPrice(sellPrice, price.discount_type, price.discount_value);
                const hasDiscount = price.discount_type && price.discount_value > 0 && finalPrice < sellPrice;
                const lineTotal = finalLines[index]?.lineTotal || "0.00";

                return (
                  <div key={index} className="mb-4 border-b pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <select
                        name="product_id"
                        value={item.product_id}
                        onChange={(e) => handleNewItemChange(index, e)}
                        className={`p-2 border rounded-lg ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                        disabled={inventoryLoading}
                      >
                        <option value="">Select Product</option>
                        {filteredProducts.map((p) => {
                          const fp = calcFinalPrice(p.current_price.sell_price, p.current_price.discount_type, p.current_price.discount_value);
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatPrice(fp)}, HSN: {p.hsn_code})
                            </option>
                          );
                        })}
                      </select>
                      <select
                        name="batch_id"
                        value={item.batch_id}
                        onChange={(e) => handleNewItemChange(index, e)}
                        className={`p-2 border rounded-lg ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                        disabled={!item.product_id}
                      >
                        <option value="">Select Batch</option>
                        {batches
                          ?.filter((b) => b.product_id === parseInt(item.product_id))
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              Batch {b.batch_number} (Stock: {b.stock_level})
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleNewItemChange(index, e)}
                        className={`p-2 border rounded-lg ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={newItems.length === 1}
                        className={`p-2 border rounded-lg ${isDark ? "text-red-300 border-red-600 hover:bg-red-700" : "text-red-600 border-red-300 hover:bg-red-100"} ${newItems.length === 1 ? "opacity-50" : ""}`}
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>
                        Price: {hasDiscount ? (
                          <>
                            <span className="text-green-600 font-bold">{formatPrice(finalPrice)}</span>
                            <span className="text-gray-500 line-through ml-1">{formatPrice(sellPrice)}</span>
                          </>
                        ) : formatPrice(finalPrice)}
                      </span>
                      <span className="font-semibold">Total: {formatPrice(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleAddItem}
                className={`px-4 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              >
                Add Another Item
              </button>

              {/* Totals */}
              <div className="mt-6 border-t pt-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="space-y-2 text-lg">
                    <div className="flex justify-between"><span>Subtotal:</span> <span>{formatPrice(subtotal)}</span></div>
                    {hasDiscount && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({discountLabel}) {source === "auto" ? "(Auto)" : "(Manual)"}:</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                        <div className="flex justify-between"><span>After Discount:</span> <span>{formatPrice(subtotalAfterOrderDiscount)}</span></div>
                      </>
                    )}
                    <div className="flex justify-between"><span>Total GST:</span> <span>{formatPrice(totalGst)}</span></div>
                    <div className="flex justify-between font-bold text-xl border-t pt-2">
                      <span>Grand Total:</span> <span className="text-blue-600">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                  {discountRule && (
                    <p className="text-sm text-green-600 mt-2">
                      Auto {discountRule.discount_value}{discountRule.discount_type === "percentage" ? "%" : " ₹"} off applies on orders ≥ ₹{discountRule.min_order_amount}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCancelClick}
                className={`px-4 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard Metrics */}
      {!selectedGroup && hasPermission("orders-view") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { title: "Total Orders", value: totalOrders, icon: <Package className="h-10 w-10 text-blue-600" /> },
            { title: "Processing", value: processingOrders, icon: <Clock className="h-10 w-10 text-yellow-500" /> },
            { title: "Shipped", value: shippedOrders, icon: <Truck className="h-10 w-10 text-indigo-600" /> },
            { title: "Delivered", value: deliveredOrders, icon: <CheckCircle className="h-10 w-10 text-green-600" /> },
          ].map((metric, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-6 flex items-center justify-between transform hover:scale-105 transition-all duration-300 ${
                isDark
                  ? "bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-2xl"
                  : "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl"
              }`}
            >
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {metric.title}
                </p>
                <h2 className="text-2xl font-bold mt-1">{metric.value}</h2>
              </div>
              {metric.icon}
            </div>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      {!selectedGroup && hasPermission("orders-view") && (
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 mb-6`}>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-1/3">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={`pl-10 pr-3 py-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"}`}
              />
            </div>
            {viewMode === "grouped" && (
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto
                  ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              >
                <option value="All Status">All Status</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
            )}
            <button
              className={`flex items-center px-4 py-2 rounded-lg shadow-sm border hover:bg-gray-100 transition-colors w-full md:w-auto
                ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-gray-50 border-gray-300 text-gray-700"}`}
            >
              Export Orders
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-4 md:p-6 overflow-x-auto`}>
        <h2 className="text-base md:text-lg font-semibold mb-4">
          {selectedGroup ? "Order Details" : viewMode === "grouped" ? `Grouped Orders (${filteredGroupedOrders.length} groups)` : `All Orders (${filteredOrders.length})`}
        </h2>

        {ordersLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading orders...</p>}
        {ordersError && <p className="text-red-500 text-sm">{ordersError}</p>}

        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <tr>
              {selectedGroup ? (
                <>
                  {["Order ID", "Date", "Items", "Payment", "Status", hasPermission("orders-delete") && "Actions"].filter(Boolean).map((head) => (
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
                </>
              ) : viewMode === "grouped" ? (
                <>
                  {["Order Date", "Customer", "Total Orders", "Total Amount", "Payment", "Order Status", "Actions"].map((head) => (
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
                </>
              ) : (
                <>
                  {["Order ID", "Order Date", "Customer", "Amount", "Payment", "Status"].map((head) => (
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
                </>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
            {selectedGroup ? (
              selectedGroup.records.length > 0 && hasPermission("orders-view") ? (
                selectedGroup.records.map((order, index) => (
                  <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                      {order.items?.length > 0 ? (
                        <ul className="space-y-3">
                          {order.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm hover:shadow-md transition duration-200 border border-gray-200 dark:border-gray-600"
                              role="listitem"
                              aria-label={`Item ${idx + 1}: ${item.product?.name || "Unknown Product"}`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <Package size={16} className="text-blue-500 dark:text-blue-400" />
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                      {item.product?.name || "Unknown Product"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Batch: {item.batch?.batch_number || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="flex items-center gap-1 font-semibold text-gray-900 dark:text-gray-100">
                                    <Hash size={14} className="text-blue-500 dark:text-blue-400" />
                                    Qty: {item.quantity || "-"}
                                  </p>
                                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                    ₹{(item.total || item.quantity * item.unit_price || 0).toLocaleString("en-IN")}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-lg shadow-sm ${getPaymentPill(order.payment)}`}
                      >
                        {order.payment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-lg shadow-sm ${getStatusPill(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    {hasPermission("orders-delete") && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className={`p-2 border rounded-lg ${
                            isDark ? "text-red-300 border-red-600 hover:bg-red-700" : "text-red-600 border-red-300 hover:bg-red-100"
                          }`}
                          aria-label={`Delete order ${order.id}`}
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasPermission("orders-delete") ? 6 : 5} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    No orders found for this customer.
                  </td>
                </tr>
              )
            ) : viewMode === "grouped" ? (
              filteredGroupedOrders.length > 0 && hasPermission("orders-view") ? (
                filteredGroupedOrders.map((group, index) => {
                  const totalAmount = group.records.reduce((sum, r) => sum + Number(r.amount), 0);
                  const paymentStatus = getPaymentStatus(group.records);
                  const statusDots = getStatusDots(group.records);

                  return (
                    <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{group.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">{group.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{group.total_orders} orders</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">₹{totalAmount.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-lg shadow-sm ${getPaymentPill(paymentStatus)}`}>
                          {paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex text-lg">{statusDots}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {hasPermission("orders-view") && (
                          <button
                            onClick={() => handleViewClick(group)}
                            className={`flex items-center gap-1 p-2 border rounded-lg ${
                              isDark
                                ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                                : "text-gray-600 border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            <Eye className="w-5 h-5" /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    No grouped orders found.
                  </td>
                </tr>
              )
            ) : filteredOrders.length > 0 && hasPermission("orders-view") ? (
              filteredOrders.map((order, index) => (
                <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">{order.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">₹{Number(order.amount).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-lg shadow-sm ${getPaymentPill(order.payment)}`}>
                      {order.payment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-lg shadow-sm ${getStatusPill(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Note Section */}
      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 md:p-6 mt-6`}>
        <h2 className="text-lg font-semibold mb-4">Note: Status Indicators</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-2">Order Status</h3>
            <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              In <b>All Orders</b> and <b>Order Details</b>, each order shows a colored label. In <b>Grouped Orders</b>, a consolidated status is shown as colored dots. Multiple dots mean multiple statuses exist within that group:
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm">
              <li>🟠 Processing – Orders being prepared</li>
              <li>🔵 Shipped – Orders shipped</li>
              <li>🟢 Delivered – Orders delivered</li>
              <li>🟣 Cancelled – Orders cancelled</li>
              <li>🔴 Returned – Orders returned</li>
              <li>🟤 No Status – No orders / Unknown (Grouped view only)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
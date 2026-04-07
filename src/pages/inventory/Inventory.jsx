import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  fetchCategories,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../../features/inventory/inventorySlice";
import { fetchSuppliers } from "../../features/suppliers/supplierSlice";
import { Package, AlertTriangle, TrendingUp, TrendingDown, Pencil, Trash2, Plus, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

export default function Inventory({ theme }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products = [], categories = [], loading: inventoryLoading, error: inventoryError } = useSelector(
    (state) => state.inventory || {}
  );
  const { data: suppliers = [], loading: suppliersLoading, error: suppliersError } = useSelector(
    (state) => state.suppliers || {}
  );
  const { user = {} } = useSelector((state) => state.auth || {});

  const isDark = theme === "dark";

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    product_code: "",
    max_stock: "",
    category_id: "",
    supplier_id: "",
    hsn_code: "",
    gst_rate: "",
    batches: [
      {
        batch_number: "",
        stock_level: "",
        expiry_date: "",
        has_expiry: true,
      },
    ],
  });

  const [formErrors, setFormErrors] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);

  const hasPermission = (permission) => user?.permissions_list?.includes(permission) || false;

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  // Helper: Calculate final price
  const calcFinalPrice = (base, type, value) => {
    if (!type || value == null) return base;
    const val = Number(value);
    if (isNaN(val) || val <= 0) return base;
    return type === "percentage" ? base * (1 - val / 100) : base - val;
  };

  // Format Price: Hide .00
  const formatPrice = (value) => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) return "—";
    return num % 1 === 0 ? `₹${num}` : `₹${num.toFixed(2)}`;
  };

  // Dashboard calculations
  const totalProducts = products.length;
  const lowStock = products.filter((p) => {
    const batches = Array.isArray(p.batches) ? p.batches : [];
    const totalStock = batches.reduce((s, b) => s + Number(b.stock_level || 0), 0);
    return totalStock > 0 && totalStock < (p.max_stock || 0) * 0.2;
  }).length;

  const outOfStock = products.filter((p) => {
    const batches = Array.isArray(p.batches) ? p.batches : [];
    const totalStock = batches.reduce((s, b) => s + Number(b.stock_level || 0), 0);
    return totalStock === 0;
  }).length;

  const inventoryValue = products.reduce((acc, p) => {
    const batches = Array.isArray(p.batches) ? p.batches : [];
    const totalStock = batches.reduce((s, b) => s + Number(b.stock_level || 0), 0);
    const price = p.current_price || {};
    const sellPrice = Number(price.sell_price) || 0;
    const finalPrice = calcFinalPrice(sellPrice, price.discount_type, price.discount_value);
    return acc + totalStock * finalPrice;
  }, 0);

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Product name is required";
    if (!formData.sku.trim()) errors.sku = "SKU is required";
    if (products.some((p) => p.sku === formData.sku && p.id !== editingProduct))
      errors.sku = "SKU must be unique";
    if (!formData.product_code.trim()) errors.product_code = "Product code is required";
    if (products.some((p) => p.product_code === formData.product_code && p.id !== editingProduct))
      errors.product_code = "Product code must be unique";
    if (!formData.max_stock || Number(formData.max_stock) <= 0)
      errors.max_stock = "Max stock must be a positive number";
    if (!formData.category_id) errors.category_id = "Category is required";
    if (!formData.supplier_id) errors.supplier_id = "Supplier is required";
    if (!formData.hsn_code.trim()) errors.hsn_code = "HSN code is required";
    if (!formData.gst_rate || Number(formData.gst_rate) < 0)
      errors.gst_rate = "GST rate must be non-negative";

    formData.batches.forEach((batch, index) => {
      if (!batch.batch_number?.trim())
        errors[`batch_number_${index}`] = "Batch number is required";
      if (!batch.stock_level || Number(batch.stock_level) < 0)
        errors[`stock_level_${index}`] = "Stock level must be non-negative";

      if (batch.has_expiry === true) {
        if (!batch.expiry_date)
          errors[`expiry_date_${index}`] = "Expiry date is required";
        else if (batch.expiry_date < new Date().toISOString().split("T")[0])
          errors[`expiry_date_${index}`] = "Expiry date must be in the future";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategoryChange = (categoryId) => {
    const selectedCategory = categories.find((c) => c.id === Number(categoryId));
    setFormData({
      ...formData,
      category_id: categoryId,
      hsn_code: selectedCategory?.hsn_code?.hsn_code || "",
      gst_rate: selectedCategory?.hsn_code?.gst_rate || "",
    });
  };

  const handleOpenForm = (product = null) => {
    if (product && hasPermission("inventory-edit")) {
      const selectedCategory = categories.find((c) => c.id === product.category?.id);
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        product_code: product.product_code || "",
        max_stock: product.max_stock?.toString() || "",
        category_id: product.category?.id?.toString() || "",
        supplier_id: product.supplier?.id?.toString() || "",
        hsn_code: selectedCategory?.hsn_code?.hsn_code || product.hsn_code || "",
        gst_rate: selectedCategory?.hsn_code?.gst_rate?.toString() || product.gst_rate?.toString() || "",
        batches: Array.isArray(product.batches) && product.batches.length > 0
          ? product.batches.map((b) => ({
              id: b.id,
              batch_number: b.batch_number || "",
              stock_level: b.stock_level?.toString() || "",
              expiry_date: b.expiry_date || "",
              has_expiry: b.has_expiry === 1 || b.has_expiry === true,
            }))
          : [{
              batch_number: "",
              stock_level: "",
              expiry_date: "",
              has_expiry: true,
            }],
      });
      setEditingProduct(product.id);
    } else if (!product && hasPermission("inventory-create")) {
      setFormData({
        name: "",
        sku: "",
        product_code: "",
        max_stock: "",
        category_id: "",
        supplier_id: "",
        hsn_code: "",
        gst_rate: "",
        batches: [{
          batch_number: "",
          stock_level: "",
          expiry_date: "",
          has_expiry: true,
        }],
      });
      setEditingProduct(null);
    }
    setFormErrors({});
    setShowForm(true);
  };

  const handleAddBatch = () => {
    setFormData({
      ...formData,
      batches: [...formData.batches, {
        batch_number: "",
        stock_level: "",
        expiry_date: "",
        has_expiry: true,
      }],
    });
  };

  const handleRemoveBatch = (index) => {
    if (formData.batches.length === 1) {
      toast.error("At least one batch is required", { theme: isDark ? "dark" : "light" });
      return;
    }
    setFormData({
      ...formData,
      batches: formData.batches.filter((_, i) => i !== index),
    });
  };

  const handleBatchChange = (index, field, value) => {
    const updatedBatches = [...formData.batches];
    if (field === "has_expiry") {
      updatedBatches[index] = {
        ...updatedBatches[index],
        has_expiry: value,
        expiry_date: value ? updatedBatches[index].expiry_date : "",
      };
    } else {
      updatedBatches[index] = { ...updatedBatches[index], [field]: value };
    }
    setFormData({ ...formData, batches: updatedBatches });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors", { theme: isDark ? "dark" : "light" });
      return;
    }

    const payload = {
      ...formData,
      max_stock: Number(formData.max_stock),
      category_id: Number(formData.category_id),
      supplier_id: Number(formData.supplier_id),
      gst_rate: Number(formData.gst_rate) || 0,
      batches: formData.batches.map((batch) => ({
        id: batch.id || undefined,
        batch_number: batch.batch_number,
        stock_level: Number(batch.stock_level),
        has_expiry: batch.has_expiry === true ? 1 : 0,
        expiry_date: batch.has_expiry ? batch.expiry_date : null,
      })),
    };

    try {
      if (editingProduct) {
        await dispatch(updateProduct({ id: editingProduct, product: payload })).unwrap();
        toast.success("Product updated successfully", { theme: isDark ? "dark" : "light" });
      } else {
        await dispatch(addProduct(payload)).unwrap();
        toast.success("Product added successfully", { theme: isDark ? "dark" : "light" });
      }
      setShowForm(false);
      dispatch(fetchProducts());
    } catch (err) {
      toast.error(err?.message || "Failed to save product", { theme: isDark ? "dark" : "light" });
    }
  };

  const handleDelete = async (id) => {
    if (hasPermission("inventory-delete") && window.confirm("Delete this product?")) {
      try {
        await dispatch(deleteProduct(id)).unwrap();
        toast.success("Product deleted", { theme: isDark ? "dark" : "light" });
      } catch (err) {
        toast.error(err?.message || "Failed to delete", { theme: isDark ? "dark" : "light" });
      }
    }
  };

  if ((inventoryLoading || suppliersLoading) && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (inventoryError || suppliersError) {
    return <p className="text-center text-red-500">{inventoryError || suppliersError}</p>;
  }

  return (
    <div className={`p-4 md:p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"} min-h-screen`}>
      <ToastContainer position="top-right" autoClose={3000} theme={isDark ? "dark" : "light"} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Inventory Management</h1>
          <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Track and manage your pharmaceutical inventory
          </p>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0">
          {hasPermission("inventory-create") && (
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </button>
          )}
          {hasPermission("inventory-setPrice") && (
            <button
              onClick={() => navigate("/inventory/set-prices")}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors"
            >
              Set Prices
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: totalProducts, icon: Package, color: "text-blue-600" },
          { label: "Low Stock Alerts", value: lowStock, icon: AlertTriangle, color: "text-yellow-500" },
          { label: "Out of Stock", value: outOfStock, icon: TrendingDown, color: "text-red-600" },
          {
            label: "Inventory Value",
            value: `₹${inventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-green-600"
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`rounded-xl p-6 flex items-center justify-between transform hover:scale-105 transition-all duration-300 ${
              isDark ? "bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-2xl" : "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl"
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

      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 md:p-6`}>
        <h2 className="text-base md:text-lg font-semibold mb-4">Product Inventory ({products.length} products)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"} sticky top-0 z-10`}>
              <tr>
                {["Product", "SKU", "Category", "Supplier", "Stock Level", "Price", "Expiry", "Status", hasPermission("inventory-edit") || hasPermission("inventory-delete") ? "Actions" : null]
                  .filter(Boolean)
                  .map((header) => (
                    <th
                      key={header}
                      className={`px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-500"} whitespace-nowrap`}
                    >
                      {header}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className={`${isDark ? "bg-gray-800" : "bg-white"} divide-y divide-gray-200 dark:divide-gray-700`}>
              {products.map((p) => {
                const batches = Array.isArray(p.batches) ? p.batches : [];
                const totalStock = batches.reduce((s, b) => s + Number(b.stock_level || 0), 0);
                const latestBatch = batches[0] || {};
                const stockPercentage = p.max_stock ? (totalStock / p.max_stock) * 100 : 0;
                const status =
                  totalStock === 0
                    ? "Out of Stock"
                    : totalStock < (p.max_stock || 0) * 0.2
                    ? "Low Stock"
                    : "In Stock";

                const price = p.current_price || {};
                const sellPrice = Number(price.sell_price) || 0;
                const finalPrice = calcFinalPrice(sellPrice, price.discount_type, price.discount_value);
                const hasDiscount = price.discount_type && price.discount_value > 0 && finalPrice < sellPrice;

                return (
                  <tr key={p.id} className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{p.name || "N/A"}</div>
                      <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{p.product_code || "N/A"}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">{p.sku || "N/A"}</td>
                    <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">{p.category?.name || "N/A"}</td>
                    <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">{p.supplier?.name || "N/A"}</td>
                    <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                      <div className="relative w-32 bg-gray-200 rounded h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(stockPercentage, 100)}%` }} />
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300">
                          {totalStock} / {p.max_stock || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm font-medium whitespace-nowrap">
                      {sellPrice > 0 ? (
                        hasDiscount ? (
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 font-bold">{formatPrice(finalPrice)}</span>
                            <span className="text-gray-500 line-through">{formatPrice(sellPrice)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-900 dark:text-gray-100">{formatPrice(sellPrice)}</span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                      {latestBatch.has_expiry === 0 ? "No Expiry" : (latestBatch.expiry_date || "N/A")}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${
                          status === "Low Stock"
                            ? "bg-yellow-200 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100"
                            : status === "Out of Stock"
                            ? "bg-red-200 text-red-900 dark:bg-red-600 dark:text-red-100"
                            : "bg-green-200 text-green-900 dark:bg-green-600 dark:text-green-100"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    {(hasPermission("inventory-edit") || hasPermission("inventory-delete")) && (
                      <td className="px-4 md:px-6 py-4 text-sm font-medium whitespace-nowrap flex gap-2">
                        {hasPermission("inventory-edit") && (
                          <button
                            onClick={() => handleOpenForm(p)}
                            className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                              isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-600 border-gray-300 hover:bg-gray-100"
                            }`}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission("inventory-delete") && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                              isDark ? "text-red-400 border-red-600 hover:bg-red-700" : "text-red-600 border-red-400 hover:bg-red-100"
                            }`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-50">
          <form
            onSubmit={handleSubmit}
            className={`relative p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-y-auto ${isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
          >
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-semibold mb-6">{editingProduct ? "Edit Product" : "Add New Product"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {["name", "sku", "product_code", "max_stock"].map((field) => (
                <div key={field}>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {field.replace("_", " ").charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
                  </label>
                  <input
                    type={field.includes("stock") ? "number" : "text"}
                    value={formData[field] || ""}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    } ${formErrors[field] ? "border-red-500" : ""}`}
                    required
                  />
                  {formErrors[field] && <p className="text-xs text-red-500 mt-1">{formErrors[field]}</p>}
                </div>
              ))}

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                  } ${formErrors.category_id ? "border-red-500" : ""}`}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {formErrors.category_id && <p className="text-xs text-red-500 mt-1">{formErrors.category_id}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Supplier</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                  } ${formErrors.supplier_id ? "border-red-500" : ""}`}
                  required
                >
                  <option value="">Select Supplier</option>
                  {safeSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {formErrors.supplier_id && <p className="text-xs text-red-500 mt-1">{formErrors.supplier_id}</p>}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Batch Details</h3>
                <button
                  type="button"
                  onClick={handleAddBatch}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add Batch
                </button>
              </div>

              {formData.batches.map((batch, index) => (
                <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4 relative">
                  {formData.batches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBatch(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Batch Number</label>
                      <input
                        type="text"
                        value={batch.batch_number || ""}
                        onChange={(e) => handleBatchChange(index, "batch_number", e.target.value)}
                        className={`w-full border rounded-md px-3 py-2 text-sm ${isDark ? "bg-gray-700 border-gray-600" : "border-gray-300"} ${formErrors[`batch_number_${index}`] ? "border-red-500" : ""}`}
                        required
                      />
                      {formErrors[`batch_number_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`batch_number_${index}`]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Stock Level</label>
                      <input
                        type="number"
                        min="0"
                        value={batch.stock_level || ""}
                        onChange={(e) => handleBatchChange(index, "stock_level", e.target.value)}
                        className={`w-full border rounded-md px-3 py-2 text-sm ${isDark ? "bg-gray-700 border-gray-600" : "border-gray-300"} ${formErrors[`stock_level_${index}`] ? "border-red-500" : ""}`}
                        required
                      />
                      {formErrors[`stock_level_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`stock_level_${index}`]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Date</label>

                      {!editingProduct ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`has_expiry_${index}`}
                              checked={batch.has_expiry === true}
                              onChange={(e) => handleBatchChange(index, "has_expiry", e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`has_expiry_${index}`} className="text-sm cursor-pointer">
                              Has Expiry Date?
                            </label>
                          </div>

                          {batch.has_expiry && (
                            <input
                              type="date"
                              value={batch.expiry_date || ""}
                              onChange={(e) => handleBatchChange(index, "expiry_date", e.target.value)}
                              className={`w-full border rounded-md px-3 py-2 text-sm ${
                                isDark ? "bg-gray-700 border-gray-600" : "border-gray-300"
                              } ${formErrors[`expiry_date_${index}`] ? "border-red-500" : ""}`}
                              required
                            />
                          )}

                          {batch.has_expiry && formErrors[`expiry_date_${index}`] && (
                            <p className="text-xs text-red-500 -mt-2">{formErrors[`expiry_date_${index}`]}</p>
                          )}
                        </div>
                      ) : batch.has_expiry === false ? (
                        <div className="flex items-center h-10">
                          <span className="text-green-600 font-semibold text-lg">No Expiry</span>
                        </div>
                      ) : (
                        <input
                          type="date"
                          value={batch.expiry_date || ""}
                          onChange={(e) => handleBatchChange(index, "expiry_date", e.target.value)}
                          className={`w-full border rounded-md px-3 py-2 text-sm ${
                            isDark ? "bg-gray-700 border-gray-600" : "border-gray-300"
                          } ${formErrors[`expiry_date_${index}`] ? "border-red-500" : ""}`}
                          required
                        />
                      )}

                      {editingProduct && batch.has_expiry && formErrors[`expiry_date_${index}`] && (
                        <p className="text-xs text-red-500 mt-1">{formErrors[`expiry_date_${index}`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={inventoryLoading}
              >
                {editingProduct ? "Update Product" : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
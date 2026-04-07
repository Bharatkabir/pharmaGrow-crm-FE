import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../features/inventory/inventorySlice";
import {
  fetchSuppliers,
  assignSuppliersToProduct,
} from "../../features/suppliers/supplierSlice";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProductSupplierMapping = ({ theme }) => {
  const dispatch = useDispatch();
  const isDark = theme === "dark";

  const { products, loading: productsLoading, error: productsError } = useSelector(
    (state) => state.inventory || { products: [], loading: false, error: null }
  );

  const {
    data: allSuppliers,
    loading: suppliersLoading,
    error: suppliersError,
  } = useSelector((state) => state.suppliers || { data: [], loading: false, error: null });

  const [mappings, setMappings] = useState({});
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [saving, setSaving] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [sortByPriority, setSortByPriority] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Fetch products + all suppliers
  useEffect(() => {
    dispatch(fetchProducts()).unwrap().catch((err) => showToast(err?.message || "Failed to fetch products"));
    dispatch(fetchSuppliers()).unwrap().catch((err) => showToast(err?.message || "Failed to fetch suppliers"));
  }, [dispatch]);

  // Initialize mappings from product.suppliers (already in product data)
  useEffect(() => {
    const initialMappings = {};
    products.forEach((product) => {
      initialMappings[product.id] = product.suppliers?.map((s) => s.id) || [];
    });
    setMappings(initialMappings);
  }, [products]);

  const toggleDropdown = (productId) => {
    setOpenDropdowns((prev) => ({ ...prev, [productId]: !prev[productId] }));
    if (!openDropdowns[productId]) {
      setSearchTerms((prev) => ({ ...prev, [productId]: "" }));
    }
  };

  const handleCheckboxChange = (productId, supplierId) => {
    setMappings((prev) => {
      const selected = prev[productId] || [];
      const updated = selected.includes(supplierId)
        ? selected.filter((id) => id !== supplierId)
        : [...selected, supplierId];
      return { ...prev, [productId]: updated };
    });
  };

  const handleClearSelection = (productId) => {
    setMappings((prev) => ({ ...prev, [productId]: [] }));
  };

  const handleSearchChange = (productId, value) => {
    setSearchTerms((prev) => ({ ...prev, [productId]: value }));
  };

  const handleSave = async (productId) => {
    setSaving((prev) => ({ ...prev, [productId]: true }));
    try {
      const supplierIds = mappings[productId] || [];
      await dispatch(assignSuppliersToProduct({ productId, supplierIds })).unwrap();
      showToast("Suppliers updated successfully", "success");
      setOpenDropdowns((prev) => ({ ...prev, [productId]: false }));
    } catch (err) {
      showToast(err?.message || "Failed to update suppliers", "error");
    } finally {
      setSaving((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleBulkSave = async () => {
    setBulkSaving(true);
    try {
      const promises = Object.keys(mappings).map((productId) => {
        const supplierIds = mappings[productId] || [];
        return dispatch(assignSuppliersToProduct({ productId: Number(productId), supplierIds })).unwrap();
      });
      await Promise.all(promises);
      showToast("All mappings saved successfully", "success");
      setOpenDropdowns({});
    } catch (err) {
      showToast("Some mappings failed to save", "error");
    } finally {
      setBulkSaving(false);
    }
  };

  const showToast = (message, type = "error") => {
    toast[type](message, {
      position: "top-right",
      autoClose: 3000,
      theme: isDark ? "dark" : "light",
    });
  };

  const getPriorityStyles = (priority) => {
    const p = priority?.toLowerCase();
    if (p === "primary") return isDark ? "bg-green-600 text-green-100" : "bg-green-100 text-green-800";
    if (p === "normal") return isDark ? "bg-blue-600 text-blue-100" : "bg-blue-100 text-blue-800";
    if (p === "low") return isDark ? "bg-gray-600 text-gray-100" : "bg-gray-100 text-gray-800";
    return isDark ? "bg-gray-500 text-gray-100" : "bg-gray-200 text-gray-700";
  };

  const getFilteredSuppliers = (productId) => {
    const search = searchTerms[productId]?.toLowerCase() || "";
    let filtered = allSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search)
    );

    if (sortByPriority) {
      const order = { primary: 1, normal: 2, low: 3 };
      filtered.sort((a, b) => {
        const pa = order[a.priority?.toLowerCase()] || 4;
        const pb = order[b.priority?.toLowerCase()] || 4;
        return pa - pb;
      });
    }

    return filtered;
  };

  const hasChanges = () => {
    return products.some((product) => {
      const current = (mappings[product.id] || []).sort();
      const initial = (product.suppliers?.map((s) => s.id) || []).sort();
      return JSON.stringify(current) !== JSON.stringify(initial);
    });
  };

  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
    return result;
  };

  const isLoading = productsLoading || suppliersLoading;
  const hasError = productsError || suppliersError;

  return (
    <div className={`p-4 md:p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"} min-h-screen`}>
      <ToastContainer />
      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-animate { animation: fadeInDown 0.2s ease-out; }
        .tooltip { visibility: hidden; opacity: 0; transition: all 0.2s; }
        .tooltip-parent:hover .tooltip { visibility: visible; opacity: 1; }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Product Supplier Mapping</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Assign multiple suppliers to products. Changes are saved per product.
          </p>
        </div>
        <button
          onClick={handleBulkSave}
          disabled={bulkSaving || !hasChanges()}
          className={`mt-4 sm:mt-0 px-5 py-2 rounded-lg font-medium transition-colors ${
            bulkSaving || !hasChanges()
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {bulkSaving ? "Saving All..." : "Save All Changes"}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-3 text-lg">Loading products and suppliers...</p>
        </div>
      ) : hasError ? (
        <div className="text-center py-12 text-red-500">
          <p className="text-lg">Error: {hasError}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No products found</p>
        </div>
      ) : (
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Current Suppliers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Assign Suppliers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product, index) => {
                  const currentSuppliers = product.suppliers || [];
                  const selectedCount = mappings[product.id]?.length || 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{product.sku}</td>

                      {/* Current Suppliers */}
                      <td className="px-6 py-4 text-sm">
                        {currentSuppliers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {currentSuppliers.map((s) => (
                              <span
                                key={s.id}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityStyles(
                                  s.priority
                                )}`}
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Dropdown */}
                      <td className="px-6 py-4 text-sm">
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(product.id)}
                            className={`w-full px-4 py-2 border rounded-lg text-left text-sm font-medium flex justify-between items-center transition-colors ${
                              isDark
                                ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                                : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            <span>{selectedCount ? `${selectedCount} selected` : "Select suppliers"}</span>
                            <span className="ml-2">{openDropdowns[product.id] ? "Up" : "Down"}</span>
                          </button>

                          {openDropdowns[product.id] && (
                            <div
                              className={`absolute z-30 mt-2 w-80 ${isDark ? "bg-gray-800" : "bg-white"} border ${
                                isDark ? "border-gray-700" : "border-gray-200"
                              } rounded-lg shadow-xl max-h-96 overflow-y-auto dropdown-animate`}
                            >
                              {/* Search + Controls */}
                              <div className="sticky top-0 p-3 border-b border-gray-200 dark:border-gray-700 bg-inherit">
                                <input
                                  type="text"
                                  placeholder="Search name or email..."
                                  value={searchTerms[product.id] || ""}
                                  onChange={(e) => handleSearchChange(product.id, e.target.value)}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isDark
                                      ? "bg-gray-700 border-gray-600 text-gray-100"
                                      : "bg-white border-gray-300 text-gray-900"
                                  }`}
                                />
                                <div className="flex justify-between mt-2 text-xs">
                                  <button
                                    onClick={() => setSortByPriority((p) => !p)}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                  >
                                    {sortByPriority ? "Sort by Name" : "Sort by Priority"}
                                  </button>
                                  <button
                                    onClick={() => handleClearSelection(product.id)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              {/* Supplier List */}
                              <div className="p-2">
                                {getFilteredSuppliers(product.id).length === 0 ? (
                                  <p className="text-center text-gray-500 py-4">No suppliers found</p>
                                ) : (
                                  getFilteredSuppliers(product.id).map((supplier) => {
                                    const isChecked = mappings[product.id]?.includes(supplier.id);

                                    return (
                                      <label
                                        key={supplier.id}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-blue-50 dark:hover:bg-gray-700 tooltip-parent ${
                                          isChecked ? "bg-blue-50 dark:bg-gray-700" : ""
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleCheckboxChange(product.id, supplier.id)}
                                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="ml-3 flex-1">
                                          <div className="text-sm font-medium">{supplier.name}</div>
                                          <div className="text-xs text-gray-500">{supplier.email}</div>
                                        </div>
                                        <span
                                          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyles(
                                            supplier.priority
                                          )}`}
                                        >
                                          {supplier.priority || "N/A"}
                                        </span>

                                        {/* Tooltip */}
                                        <div
                                          className={`tooltip absolute left-full ml-3 w-56 p-3 rounded-lg text-xs shadow-lg z-40 ${
                                            isDark ? "bg-gray-700 text-gray-100" : "bg-white text-gray-800"
                                          } border ${isDark ? "border-gray-600" : "border-gray-300"}`}
                                        >
                                          <div><strong>Contact:</strong> {supplier.contact || "N/A"}</div>
                                          <div><strong>Address:</strong> {supplier.address || "N/A"}</div>
                                        </div>
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Save Button */}
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleSave(product.id)}
                          disabled={saving[product.id]}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            saving[product.id]
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {saving[product.id] ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSupplierMapping;
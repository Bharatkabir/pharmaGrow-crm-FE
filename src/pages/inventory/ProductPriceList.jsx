import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllProducts, setProductPrice } from "../../features/inventory/inventorySlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ProductPriceList({ theme }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { allProducts, loading, error } = useSelector((state) => state.inventory);
  const isDark = theme === "dark";

  const [priceForm, setPriceForm] = useState({});
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  // ✅ Handle Input Change
  const handleChange = (productId, field, value) => {
    setPriceForm((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));

    setFormErrors((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: undefined },
    }));
  };

  // ✅ Validation (Buy and Sell Price Required)
  const validate = (productId) => {
    const errors = {};
    const edited = priceForm[productId] || {};
    const current = allProducts.find((p) => p.id === productId)?.current_price || {};

    const buyPrice =
      edited.buy_price !== undefined ? Number(edited.buy_price) : current.buy_price;
    const sellPrice =
      edited.sell_price !== undefined ? Number(edited.sell_price) : current.sell_price;

    // ✅ Buy Price Required
    if (buyPrice === undefined || buyPrice === "" || isNaN(buyPrice) || buyPrice < 0) {
      errors.buy_price = "Buy price is required and must be ≥ 0";
    }

    // ✅ Sell Price Required
    if (sellPrice === undefined || sellPrice === "" || isNaN(sellPrice) || sellPrice <= 0) {
      errors.sell_price = "Sell price is required and must be > 0";
    }

    // Discount Validation
    if (edited.discount_type && edited.discount_type !== "") {
      const val = Number(edited.discount_value);
      if (isNaN(val) || val <= 0) errors.discount_value = "Discount must be > 0";
    }

    setFormErrors((prev) => ({ ...prev, [productId]: errors }));
    return Object.keys(errors).length === 0;
  };

  // ✅ Save Price
  const handleSave = async (productId) => {
    if (!validate(productId)) {
      toast.error("Please fix validation errors.", { theme: isDark ? "dark" : "light" });
      return;
    }

    const product = allProducts.find((p) => p.id === productId);
    const current = product.current_price || {};
    const edited = priceForm[productId] || {};

    const payload = {
      buy_price: edited.buy_price !== undefined ? Number(edited.buy_price) : current.buy_price || 0,
      sell_price: edited.sell_price !== undefined ? Number(edited.sell_price) : current.sell_price || 0,
      discount_type: edited.discount_type || null,
      discount_value:
        edited.discount_value !== undefined
          ? Number(edited.discount_value)
          : current.discount_value || 0,
    };

    try {
      await dispatch(
        setProductPrice({
          id: productId,
          priceData: payload,
          priceId: current.id,
        })
      ).unwrap();

      toast.success(current.id ? "Price updated successfully" : "Price set successfully", {
        theme: isDark ? "dark" : "light",
      });

      setPriceForm((prev) => ({ ...prev, [productId]: undefined }));
      dispatch(fetchAllProducts());
    } catch (err) {
      toast.error(err?.message || "Failed to save", { theme: isDark ? "dark" : "light" });
    }
  };

  // ✅ Calculate Final Price (Sell − Discount)
  const calcFinalPrice = (sellPrice, discountType, discountValue) => {
    const sell = Number(sellPrice) || 0;
    if (!discountType || !discountValue) return sell;
    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) return sell;
    return discountType === "percentage" ? sell * (1 - val / 100) : sell - val;
  };

  const formatPrice = (value) => {
    const num = Number(value);
    if (isNaN(num)) return "—";
    return num % 1 === 0 ? `₹${num}` : `₹${num.toFixed(2)}`;
  };

  const inputCls = (hasError) =>
    `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? "border-red-500 focus:ring-red-500"
        : isDark
        ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500"
        : "bg-white border-gray-300 text-gray-900 focus:ring-indigo-500"
    }`;

  const selectCls = `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
    isDark
      ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500"
      : "bg-white border-gray-300 text-gray-900 focus:ring-indigo-500"
  }`;

  const btnCls = (isUpdate) =>
    `px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
      isUpdate
        ? "bg-green-600 hover:bg-green-700 text-white"
        : "bg-indigo-600 hover:bg-indigo-700 text-white"
    }`;

  if (loading && allProducts.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
      </div>
    );

  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Product Price List</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Final Price = Sell Price − Discount
          </p>
        </div>
        <button
          onClick={() => navigate("/inventory")}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </button>
      </div>

      {/* Table */}
      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-xl shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
              <tr>
                {["Product", "SKU", "Buy Price", "Sell Price", "Discount", "Final Price", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {allProducts.map((p) => {
                const current = p.current_price || {};
                const form = {
                  buy_price: current.buy_price?.toString() || "",
                  sell_price: current.sell_price?.toString() || "",
                  discount_type: current.discount_type || "",
                  discount_value: current.discount_value?.toString() || "",
                  ...(priceForm[p.id] || {}),
                };

                const errors = formErrors[p.id] || {};
                const finalPrice = calcFinalPrice(form.sell_price, form.discount_type, form.discount_value);

                return (
                  <tr
                    key={p.id}
                    className={`transition-all duration-200 ${
                      isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Product Name */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{p.product_code}</div>
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4 text-sm">{p.sku || "—"}</td>

                    {/* Buy Price */}
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={form.buy_price}
                        onChange={(e) => handleChange(p.id, "buy_price", e.target.value)}
                        placeholder="Required"
                        className={inputCls(errors.buy_price)}
                      />
                      {errors.buy_price && (
                        <p className="text-xs text-red-500 mt-1">{errors.buy_price}</p>
                      )}
                    </td>

                    {/* Sell Price */}
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={form.sell_price}
                        onChange={(e) => handleChange(p.id, "sell_price", e.target.value)}
                        placeholder="Required"
                        className={inputCls(errors.sell_price)}
                      />
                      {errors.sell_price && (
                        <p className="text-xs text-red-500 mt-1">{errors.sell_price}</p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={form.discount_type}
                          onChange={(e) => handleChange(p.id, "discount_type", e.target.value)}
                          className={selectCls}
                        >
                          <option value="">None</option>
                          <option value="percentage">%</option>
                          <option value="fixed">₹</option>
                        </select>
                        {form.discount_type && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.discount_value}
                            onChange={(e) => handleChange(p.id, "discount_value", e.target.value)}
                            placeholder="0"
                            className={`${inputCls(errors.discount_value)} w-20`}
                          />
                        )}
                      </div>
                      {errors.discount_value && (
                        <p className="text-xs text-red-500 mt-1">{errors.discount_value}</p>
                      )}
                    </td>

                    {/* Final Price */}
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatPrice(finalPrice)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSave(p.id)}
                        disabled={loading}
                        className={btnCls(!!current.id)}
                      >
                        {current.id ? "Update" : "Set Price"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>Both Buy Price and Sell Price are required. Final price updates instantly.</p>
      </div>
    </div>
  );
}
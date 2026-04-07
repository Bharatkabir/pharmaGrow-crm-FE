import React from "react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchSingleCustomer } from "../features/customers/customerSlice";
import { ShoppingBag, Package, Hash } from "lucide-react";

export default function CustomerOrders({ theme }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const result = await dispatch(fetchSingleCustomer(id)).unwrap();
        setCustomer(result);
      } catch (err) {
        console.error("Failed to load customer", err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomer();
  }, [id, dispatch]);

  if (loading) return <p className="p-6 text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!customer) return <p className="p-6 text-gray-500 dark:text-gray-400">Customer not found.</p>;

  const orders = customer.orders || [];

  // Calculate paid & unpaid amounts
  const paidAmount = orders
    .filter((o) => o.payment === "Paid")
    .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

  const unpaidAmount = orders
    .filter((o) => o.payment !== "Paid")
    .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="p-6 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-500 dark:text-blue-400" /> Orders for {customer.name}
          </h2>
          <Link
            to="/customers"
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition duration-300"
          >
            ← Back
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 transform hover:scale-105 transition duration-200">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
            <p className="text-lg font-bold">{orders.length}</p>
          </div>
          <div className="p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 transform hover:scale-105 transition duration-200">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="text-lg font-bold">
              ₹{orders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 transform hover:scale-105 transition duration-200">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid Amount</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              ₹{paidAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 transform hover:scale-105 transition duration-200">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unpaid Amount</p>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              ₹{unpaidAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-lg shadow-lg">
          {orders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  {["Order ID", "Date", "Items", "Amount", "Payment", "Status"].map((head) => (
                    <th
                      key={head}
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200">
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
                              aria-label={`Item ${idx + 1}: ${item.product?.name || "Unnamed Product"}`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <Package size={16} className="text-blue-500 dark:text-blue-400" />
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                      {item.product?.name || "Unnamed Product"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Batch: {item.batch?.batch_number || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="flex items-center gap-1 font-semibold text-gray-900 dark:text-gray-100">
                                    <Hash size={14} className="text-blue-500 dark:text-blue-400" />
                                    Qty: {item.quantity}
                                  </p>
                                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                    ₹{(item.subtotal || item.quantity * item.unit_price || 0).toLocaleString("en-IN")}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                      ₹{(parseFloat(order.amount) || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-lg shadow-sm ${
                          order.payment === "Paid"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : order.payment === "Pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : order.payment === "Refund"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {order.payment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-lg shadow-sm ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : order.status === "Shipped"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : order.status === "Processing"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : order.status === "Cancelled"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 p-6 text-center">
              No orders found for this customer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
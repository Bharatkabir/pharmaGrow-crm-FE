import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchOrders } from "../features/orders/orderSlice";
import { fetchProducts } from "../features/inventory/inventorySlice";
import { fetchCustomers } from "../features/customers/customerSlice";
import { Tag, Banknote, Calendar as CalendarIcon, Receipt, Building2, AlertTriangle, Plus, X, RefreshCw, CheckCircle, Loader2 } from "lucide-react";

export default function Dashboard({ theme }) {
  const dispatch = useDispatch();
  
  // Selectors
  const { orders = [], loading: ordersLoading, error: ordersError } = useSelector((state) => state.orders || {});
  const { products = [], loading: productsLoading, error: productsError } = useSelector((state) => state.inventory || {});
  const { customers = [], isLoading: customersLoading, isError: customersError } = useSelector((state) => state.customers || {});

  const [timeInterval, setTimeInterval] = useState("Half-Year");

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([dispatch(fetchOrders()), dispatch(fetchProducts()), dispatch(fetchCustomers())]);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };
    fetchData();
  }, [dispatch]);

  // DYNAMIC DATE LOGIC (Fixes the 2025 vs 2026 issue)
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Helper to get previous month and year correctly (e.g., Jan 2026 -> Dec 2025)
  const getPrevPeriod = (m, y) => (m === 0 ? { m: 11, y: y - 1 } : { m: m - 1, y: y });
  const prevPeriod = getPrevPeriod(currentMonth, currentYear);

  const getMonthOrders = (month, year) =>
    orders.filter((order) => {
      if (!order.date) return false;
      const orderDate = new Date(order.date);
      return !isNaN(orderDate) && orderDate.getMonth() === month && orderDate.getFullYear() === year;
    });

  // Dynamic Data Sets
  const currentMonthOrders = getMonthOrders(currentMonth, currentYear);
  const lastMonthOrders = getMonthOrders(prevPeriod.m, prevPeriod.y);

  // Stats for Current Month
  const totalSalesRaw = currentMonthOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
  const outstandingPaymentsRaw = currentMonthOrders
    .filter((o) => o.payment !== "Paid")
    .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

  const totalSales = totalSalesRaw.toLocaleString("en-IN", { style: "currency", currency: "INR" });
  const outstandingPayments = outstandingPaymentsRaw.toLocaleString("en-IN", { style: "currency", currency: "INR" });
  const totalOrders = currentMonthOrders.length;
  const activeCustomers = new Set(currentMonthOrders.map((o) => o.customer_id)).size;

  // Stats for Previous Month (for Comparison)
  const totalSalesPrev = lastMonthOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
  const outstandingPrev = lastMonthOrders.filter((o) => o.payment !== "Paid").reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
  const totalOrdersPrev = lastMonthOrders.length;
  const activeCustomersPrev = new Set(lastMonthOrders.map((o) => o.customer_id)).size;

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const salesChange = calculateChange(totalSalesRaw, totalSalesPrev);
  const outstandingChange = calculateChange(outstandingPaymentsRaw, outstandingPrev);
  const ordersChange = calculateChange(totalOrders, totalOrdersPrev);
  const customersChange = calculateChange(activeCustomers, activeCustomersPrev);

  // CHART LOGIC
  const getSalesData = () => {
    let startDate, dataArray;
    if (timeInterval === "yearly") {
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
      dataArray = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(today.getFullYear() - 1, today.getMonth() + i + 1, 1).toLocaleString("en-US", { month: "short" }),
        sales: 0,
      }));
    } else {
      // Default / Half-Year
      startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      dataArray = Array.from({ length: 6 }, (_, i) => ({
        month: new Date(today.getFullYear(), today.getMonth() - 5 + i, 1).toLocaleString("en-US", { month: "short" }),
        sales: 0,
      }));
    }

    return orders.reduce((acc, order) => {
      if (!order.date) return acc;
      const orderDate = new Date(order.date);
      if (orderDate >= startDate && !isNaN(orderDate)) {
        const month = orderDate.toLocaleString("en-US", { month: "short" });
        const index = acc.findIndex((m) => m.month === month || m.week === month);
        if (index !== -1) acc[index].sales += parseFloat(order.amount) || 0;
      }
      return acc;
    }, dataArray);
  };

  const salesData = getSalesData();

  // Inventory Logic
  const calculateTotalStock = (product) => (product.batches || []).reduce((sum, b) => sum + (parseInt(b.stock_level) || 0), 0);
  const productsWithStock = products.map((p) => ({ ...p, totalStock: calculateTotalStock(p) }));

  const getProductUnitsSold = (ordersForMonth) =>
    ordersForMonth.flatMap((o) => o.items || []).reduce((acc, item) => {
      acc[item.product_id] = (acc[item.product_id] || 0) + (item.quantity || 0);
      return acc;
    }, {});

  const currentUnitsSold = getProductUnitsSold(currentMonthOrders);
  const prevUnitsSold = getProductUnitsSold(lastMonthOrders);

  const productQuantities = orders.flatMap((o) => o.items || []).reduce((acc, item) => {
    const product = productsWithStock.find((p) => p.id === item.product_id);
    if (!product) return acc;
    if (!acc[item.product_id]) acc[item.product_id] = { id: product.id, name: product.name, units: 0, totalStock: product.totalStock };
    acc[item.product_id].units += item.quantity || 0;
    return acc;
  }, {});

  const productData = Object.values(productQuantities).sort((a, b) => b.units - a.units).slice(0, 5).map((p) => ({
    ...p,
    change: calculateChange(currentUnitsSold[p.id] || 0, prevUnitsSold[p.id] || 0),
  }));

  const maxUnits = productData.length > 0 ? Math.max(...productData.map((p) => p.units)) : 1;

  // Recent Activity Fix
  const recentActivities = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map((o) => {
      const customer = customers.find((c) => c.id === o.customer_id);
      const diffMins = (today - new Date(o.created_at)) / 1000 / 60;
      let timeText = diffMins < 60 ? `${Math.round(diffMins)} min ago` : diffMins < 1440 ? `${Math.round(diffMins / 60)} hrs ago` : `${Math.round(diffMins / 1440)} days ago`;
      return { text: `New order #${o.id} from ${customer?.name || "Unknown Customer"}`, time: timeText, type: "success" };
    });

  const lowStockAlerts = productsWithStock.filter(p => p.totalStock < 30).map(p => ({ name: p.name, totalStock: p.totalStock, status: "Low Stock" }));

  const stats = [
    { title: "Total Sales", value: totalSales, change: salesChange },
    { title: "Outstanding Payments", value: outstandingPayments, change: outstandingChange },
    { title: "Total Orders", value: totalOrders.toString(), change: ordersChange },
    { title: "Active Customers", value: activeCustomers.toString(), change: customersChange },
  ];

  const mobileStats = [
    { label: "Active Field Reps", value: 12, color: "text-blue-600 dark:text-blue-400" },
    { label: "Today's Field Sales", value: "₹8,450", color: "text-green-600 dark:text-green-400" },
    { label: "Customer Visits", value: 24, color: "text-pink-600 dark:text-pink-400" },
  ];

  return (
    <div className="p-6 flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight dark:text-gray-100">Dashboard</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 my-2">
        Welcome back! Here's what's happening with your pharma business today.
      </p>

      {/* Error & Loading States */}
      {(ordersError || productsError || customersError) && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">Some data failed to load.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.title} className="rounded-xl p-6 flex items-center justify-between transform hover:scale-105 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-2xl">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.title}</p>
              <h2 className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{s.value}</h2>
              <p className={`text-sm mt-1 ${s.change.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {s.change} from last month
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Sales Growth Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Sales Growth</h3>
            <select value={timeInterval} onChange={(e) => setTimeInterval(e.target.value)} className="p-2 text-sm border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              <option value="Half-Year">Half-Year</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#4B5563" : "#E5E7EB"} />
              <XAxis dataKey="month" stroke={theme === "dark" ? "#D1D5DB" : "#374151"} />
              <YAxis stroke={theme === "dark" ? "#D1D5DB" : "#374151"} />
              <Tooltip contentStyle={{ backgroundColor: theme === "dark" ? "#1F2937" : "#fff", color: theme === "dark" ? "#F9FAFB" : "#111827", border: "none", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Top 5 Products</h3>
          <div className="space-y-4">
            {productData.map((p, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.units} units sold | {p.totalStock} in stock</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${p.change.startsWith("-") ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"}`}>
                    {p.change}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${(p.units / maxUnits) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mt-6">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Activities</h3>
        <ul className="space-y-3">
          {recentActivities.map((a, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-100">{a.text}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{a.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mt-6">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Low Stock Alerts</h3>
        <ul className="space-y-3">
          {lowStockAlerts.map((alert, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-gray-800 dark:text-gray-100">{alert.name} - {alert.totalStock} units ({alert.status})</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Sales App */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mt-7 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Mobile Sales App - Real-time Stats</h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Coming Soon</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {mobileStats.map((stat, idx) => (
            <div key={idx} className="opacity-60">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
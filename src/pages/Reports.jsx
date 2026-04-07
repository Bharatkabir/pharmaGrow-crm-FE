import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TrendingUp, BarChart2, Users, FileText, Calendar, Download, Users as UsersIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchOrders } from "../features/orders/orderSlice";
import { fetchProducts, fetchCategories } from "../features/inventory/inventorySlice";
import { fetchCustomers } from "../features/customers/customerSlice";

export default function ReportsAnalytics({ theme }) {
  const dispatch = useDispatch();
  const { orders = [], loading: ordersLoading } = useSelector((state) => state.orders || {});
  const { products = [], categories = [], loading: productsLoading } = useSelector((state) => state.inventory || {});
  const { customers = [], isLoading: customersLoading } = useSelector((state) => state.customers || {});
  const isDark = theme === "dark";

  const [timeInterval, setTimeInterval] = useState("Half-Year");
  const COLORS = ['#1D4ED8', '#059669', '#F59E0B', '#8B5CF6', '#6B7280'];

  // REAL TODAY — Auto updates!
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 10 = November

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const getMonthOrders = (month, year) =>
    orders.filter((o) => {
      if (!o.date) return false;
      const d = new Date(o.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

  // Current & Last Month
  const thisMonthOrders = getMonthOrders(currentMonth, currentYear);     // Nov
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthOrders = getMonthOrders(lastMonth, lastYear);          // Oct

  // Sales Trend Data
  const salesData = useMemo(() => {
    const months = timeInterval === "yearly" ? 12 : timeInterval === "Half-Year" ? 6 : 6;
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const m = (currentMonth - i + 12) % 12;
      const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const sales = getMonthOrders(m, y).reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
      data.push({
        month: new Date(y, m).toLocaleString("en-US", { month: "short" }),
        sales: Math.round(sales),
      });
    }
    return data;
  }, [orders, timeInterval, currentMonth, currentYear]);

  // Sales by Category
  const salesByCategoryData = useMemo(() => {
    const map = {};
    thisMonthOrders.forEach(order => {
      order.items?.forEach(item => {
        const p = products.find(p => p.id === item.product_id);
        const cat = categories.find(c => c.id === p?.category_id)?.name || "Others";
        if (!map[cat]) map[cat] = 0;
        const price = parseFloat(item.unit_price || p?.current_price?.sell_price || 0);
        const qty = item.quantity || 0;
        const gst = (parseFloat(item.gst_rate || p?.gst_rate || 0) / 100);
        map[cat] += price * qty * (1 + gst);
      });
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [thisMonthOrders, products, categories]);

  // Metrics
  const metrics = useMemo(() => {
    const revenue = thisMonthOrders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    const revenueLast = lastMonthOrders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    const ordersNow = thisMonthOrders.length;
    const ordersLast = lastMonthOrders.length;
    const customersNow = new Set(thisMonthOrders.map(o => o.customer_id)).size;
    const customersLast = new Set(lastMonthOrders.map(o => o.customer_id)).size;

    const cost = thisMonthOrders.reduce((sum, o) => {
      return sum + (o.items || []).reduce((isum, item) => {
        const p = products.find(p => p.id === item.product_id);
        const buy = p?.current_price?.buy_price ? parseFloat(p.current_price.buy_price) : 0;
        return isum + buy * (item.quantity || 0);
      }, 0);
    }, 0);

    const margin = revenue > 0 ? ((revenue - cost) / revenue * 100).toFixed(1) : "0";

    const change = (now, then) => {
      if (then === 0) return now > 0 ? "+100%" : "0%";
      const diff = ((now - then) / then) * 100;
      return `${diff > 0 ? "+" : ""}${diff.toFixed(1)}% vs last month`;
    };

    return [
      { title: "Total Revenue", value: `₹${revenue.toLocaleString("en-IN")}`, change: change(revenue, revenueLast), changeColor: revenue >= revenueLast ? "text-green-600" : "text-red-600", icon: <TrendingUp className="h-10 w-10 text-green-600" /> },
      { title: "Orders Processed", value: ordersNow, change: change(ordersNow, ordersLast), changeColor: ordersNow >= ordersLast ? "text-blue-600" : "text-red-600", icon: <BarChart2 className="h-10 w-10 text-blue-600" /> },
      { title: "Active Customers", value: customersNow, change: change(customersNow, customersLast), changeColor: customersNow >= customersLast ? "text-purple-600" : "text-red-600", icon: <Users className="h-10 w-10 text-purple-600" /> },
      { title: "Profit Margin", value: `${margin}%`, change: change(parseFloat(margin), 0), changeColor: parseFloat(margin) >= 40 ? "text-orange-600" : "text-red-600", icon: <FileText className="h-10 w-10 text-orange-600" /> },
    ];
  }, [thisMonthOrders, lastMonthOrders, products]);

  // Report Templates — Updated today
  const reportTemplates = [
    { icon: <TrendingUp className="h-6 w-6 text-blue-700" />, title: "Sales Summary Report", description: "Monthly sales performance and trends", lastUpdated: today.toISOString().split("T")[0] },
    { icon: <UsersIcon className="h-6 w-6 text-blue-700" />, title: "Customer Analysis Report", description: "Customer behavior and purchase patterns", lastUpdated: "2025-11-04" },
    { icon: <BarChart2 className="h-6 w-6 text-blue-700" />, title: "Inventory Status Report", description: "Stock levels and inventory valuation", lastUpdated: "2025-11-03" },
    { icon: <FileText className="h-6 w-6 text-blue-700" />, title: "Financial Statement", description: "Revenue, expenses, and profit analysis", lastUpdated: "2025-11-02" },
  ];

  if (ordersLoading || productsLoading || customersLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
          <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Generate insights and track business performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0 w-full sm:w-auto items-center">
          <div className="relative w-full sm:w-auto">
            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="text"
              value="Nov 1 - Nov 5, 2025"
              readOnly
              className={`pl-10 pr-3 py-2 border rounded-lg w-full text-sm cursor-default ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
            />
          </div>
          <select
            value={timeInterval}
            onChange={(e) => setTimeInterval(e.target.value)}
            className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="Half-Year">Half-Year</option>
            <option value="yearly">Yearly</option>
          </select>
          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-5 flex items-center justify-between`}>
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{metric.title}</p>
              <h2 className="text-2xl font-bold mt-1">{metric.value}</h2>
              <p className={`mt-1 text-xs font-medium ${metric.changeColor}`}>{metric.change}</p>
            </div>
            {metric.icon}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 md:p-6`}>
          <h3 className="text-base md:text-lg font-semibold mb-4">Sales Trend ({timeInterval.charAt(0).toUpperCase() + timeInterval.slice(1)})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#4B5563" : "#E5E7EB"} />
              <XAxis dataKey="month" stroke={isDark ? "#D1D5DB" : "#374151"} />
              <YAxis stroke={isDark ? "#D1D5DB" : "#374151"} />
              <Tooltip 
                formatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                contentStyle={{ backgroundColor: isDark ? "#1F2937" : "#fff", color: isDark ? "#fff" : "#000", border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}` }} 
              />
              <Bar dataKey="sales" fill="#1D4ED8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
       
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 md:p-6`}>
          <h3 className="text-base md:text-lg font-semibold mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesByCategoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={70}
                label={({ name, value }) => `${name}: ₹${value}`}
              >
                {salesByCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report Templates */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template, index) => (
            <div key={index} className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-6`}>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
                  {template.icon}
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-semibold">{template.title}</h4>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{template.description}</p>
                </div>
              </div>
              <p className={`mt-4 text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Last: {template.lastUpdated}</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                <button className={`flex items-center justify-center px-3 py-1 rounded-md text-sm transition-colors w-full sm:w-auto ${isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                  <Download className="h-3 w-3 mr-1" /> PDF
                </button>
                <button className={`flex items-center justify-center px-3 py-1 rounded-md text-sm transition-colors w-full sm:w-auto ${isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                  <Download className="h-3 w-3 mr-1" /> Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
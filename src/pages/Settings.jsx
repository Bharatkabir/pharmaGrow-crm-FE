// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../features/notifications/notificationSlice";
import { fetchProducts } from "../features/inventory/inventorySlice";
import { fetchOrders } from "../features/orders/orderSlice";
import { formatDistanceToNow, format } from "date-fns";
import {
  Bell,
  Mail,
  MessageCircle,
  Phone,
  Package,
  User,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  CheckCircle,
  Trash2,
  Wifi,
  Activity,
  DollarSign,
  Users,
  Edit2,
  Save,
  Camera,
  ChevronRight,
  FileText,
  Download,
  UserPlus,
  // UserEdit,          // ← NEW
  UserMinus,
  Link,
  Plus,
  Edit,
  X,
} from "lucide-react";
import { logout } from "../features/auth/authSlice";

export default function Settings({ theme = "light" }) {
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user } = useSelector((state) => state.auth);
  const { items: allNotifications, unreadCount, loading: notifLoading } = useSelector(
    (state) => state.notifications
  );
  const { products = [] } = useSelector((state) => state.inventory);
  const { orders = [] } = useSelector((state) => state.orders);

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [lastSync, setLastSync] = useState(new Date());

  // ── MODAL STATE ───────────────────────
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── 1. URL → TAB ───────────────────────
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["profile", "notifications", "sync"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ── 2. LOAD DATA ───────────────────────
  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchProducts());
    dispatch(fetchOrders());
  }, [dispatch]);

  // ── 3. LIVE SYNC LABEL ─────────────────
  useEffect(() => {
    const timer = setInterval(() => setLastSync(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const syncLabel = `Synced ${formatDistanceToNow(lastSync, { addSuffix: true })}`;

  // ── 4. ICON MAPPER (ALL TYPES) ────────
  const getIcon = (type) => {
    const cls = "w-5 h-5";
    switch (type) {
      // Orders
      case "order_created":      return <Package className={`${cls} text-green-600`} />;
      case "order_updated":      return <CheckCircle className={`${cls} text-blue-600`} />;
      case "order_deleted":      return <Trash2 className={`${cls} text-red-600`} />;

      // Products
      case "product_created":    return <Plus className={`${cls} text-green-600`} />;
      case "product_updated":    return <Edit className={`${cls} text-blue-600`} />;
      case "product_deleted":    return <Trash2 className={`${cls} text-red-600`} />;
      case "product_price_set":
      case "product_price_updated": return <DollarSign className={`${cls} text-yellow-600`} />;

      // Suppliers
      case "product_suppliers_assigned": return <Link className={`${cls} text-indigo-600`} />;

      // Invoices
      case "invoice_created":    return <FileText className={`${cls} text-blue-600`} />;
      case "invoice_sent":       return <Mail className={`${cls} text-green-600`} />;
      case "invoice_downloaded": return <Download className={`${cls} text-indigo-600`} />;

      // Customers
      case "customer_created":   return <UserPlus className={`${cls} text-green-600`} />;
      // case "customer_updated":   return <UserEdit className={`${cls} text-blue-600`} />;   // ← NEW
      case "customer_deleted":   return <UserMinus className={`${cls} text-red-600`} />;

      default:                   return <Bell className={`${cls} text-purple-600`} />;
    }
  };

  const getTimeAgo = (date) => {
    try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
    catch { return "Just now"; }
  };

  // ── 5. OPEN MODAL + MARK READ ────────
  const openNotificationModal = (notif) => {
    setSelectedNotif(notif);
    setIsModalOpen(true);
    // ALWAYS mark as read (even if already read – safe)
    dispatch(markNotificationRead(notif.id));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotif(null);
  };

  // ── ESC & OUTSIDE CLICK ───────────────
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") closeModal(); };
    if (isModalOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isModalOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  // ── 6. DYNAMIC STATS ───────────────────
  const today = new Date();
  const ordersToday = orders.filter((o) => {
    const d = new Date(o.date);
    return d.toDateString() === today.toDateString();
  });

  const activeReps = new Set(ordersToday.map((o) => o.customer?.initials)).size;
  const salesToday = ordersToday.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
  const lowStockCount = products.filter((p) =>
    p.batches?.some((b) => b.stock_level < 100)
  ).length;

  const stats = [
    { label: "Active Reps", value: activeReps, icon: Users, color: "text-blue-500" },
    { label: "Orders Today", value: ordersToday.length, icon: Package, color: "text-green-500" },
    { label: "Sales Today", value: `₹${salesToday.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-yellow-500" },
    { label: "Low Stock", value: lowStockCount, icon: Activity, color: lowStockCount ? "text-red-500" : "text-gray-500" },
  ];

  // ── 7. TABS ───────────────────────────
  const tabs = [
    { id: "profile", label: "Profile & Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "sync", label: "Sync & Stats", icon: SettingsIcon },
  ];

  // ── 8. RENDER ────────────────────────
  return (
    <div
      className={`min-h-screen p-6 transition-all duration-300 ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-gray-100"
          : "bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-800"
      }`}
    >
      {/* ── HEADER ── */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Settings Center
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage your account, team, and notifications
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all shadow-lg"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* ── TABS ── */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-300 dark:border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              navigate(`/settings?tab=${tab.id}`);
            }}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all rounded-t-lg ${
              activeTab === tab.id
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-gray-800"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="space-y-8">

        {/* ── PROFILE ── */}
        {activeTab === "profile" && (
          <div className={`p-6 rounded-2xl backdrop-blur-xl border shadow-xl ${
            isDark ? "bg-white/5 border-gray-700" : "bg-white/80 border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <User className="text-indigo-500" />
                Profile & Account
              </h2>
              <button
                onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-indigo-600">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700">
                      <Camera size={16} />
                    </button>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-400">Click to upload</p>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {["name", "email", "phone", "company"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                      {field === "company" ? "Business Name" : field}
                    </label>
                    <input
                      type="text"
                      value={editedUser?.[field] ?? ""}
                      onChange={(e) => setEditedUser({ ...editedUser, [field]: e.target.value })}
                      disabled={!isEditing}
                      className={`mt-1 w-full px-4 py-2 rounded-lg border transition focus:outline-none focus:ring-2 ${
                        isEditing
                          ? isDark
                            ? "bg-gray-800 border-gray-600 text-white focus:ring-indigo-500"
                            : "bg-white border-gray-300 text-gray-900 focus:ring-indigo-400"
                          : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 cursor-not-allowed"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            {/* All Notifications */}
            <div className={`p-6 rounded-2xl backdrop-blur-xl border shadow-xl ${
              isDark ? "bg-white/5 border-gray-700" : "bg-white/80 border-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Bell className="text-yellow-500" />
                  All Notifications
                </h2>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(markAllNotificationsRead())}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    We'll notify you when something happens
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {allNotifications.map((n, i) => (
                    <li
                      key={n.id}
                      onClick={() => openNotificationModal(n)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer group animate-fadeInUp ${
                        !n.is_read
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700"
                      } hover:shadow-md`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          !n.is_read ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-600"
                        }`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {n.data?.title || "Notification"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                {n.data?.message || "No message"}
                              </p>
                            </div>
                            {!n.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {getTimeAgo(n.created_at)}
                            {!n.is_read && " • Unread"}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Preferences */}
            <div className={`p-6 rounded-2xl backdrop-blur-xl border shadow-xl ${
              isDark ? "bg-white/5 border-gray-700" : "bg-white/80 border-gray-200"
            }`}>
              <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { key: "email", label: "Email Updates", icon: Mail, desc: "Daily reports & summaries" },
                  { key: "whatsapp", label: "WhatsApp Alerts", icon: MessageCircle, desc: "Instant payment reminders" },
                  { key: "sms", label: "SMS Notifications", icon: Phone, desc: "Critical order updates" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                      isDark ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="text-yellow-500" size={20} />
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-6 w-6 text-yellow-500 rounded focus:ring-yellow-400"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SYNC & STATS ── */}
        {activeTab === "sync" && (
          <div className={`p-6 rounded-2xl backdrop-blur-xl border shadow-xl ${
            isDark ? "bg-white/5 border-gray-700" : "bg-white/80 border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 classinName="text-2xl font-bold flex items-center gap-2">
                <SettingsIcon className="text-blue-500" />
                Sync & Real‑time Stats
              </h2>
              <div className="flex items-center gap-2 text-green-500">
                <Wifi size={18} />
                <span className="text-sm">{syncLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-xl text-center border transition hover:scale-105 ${
                    isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={28} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-xl transition-all flex items-center gap-2">
                <Activity size={18} />
                Force Sync Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── NOTIFICATION MODAL ── */}
      {isModalOpen && selectedNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleIn ${
              isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()} 
          >
            <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedNotif.is_read ? "bg-gray-100 dark:bg-gray-700" : "bg-blue-100 dark:bg-blue-800"
                  }`}>
                    {getIcon(selectedNotif.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{selectedNotif.data?.title || "Notification"}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(selectedNotif.created_at), "dd MMM yyyy, h:mm a")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {selectedNotif.data?.message || "No message available."}
              </p>
            </div>

            <div className={`p-4 border-t flex justify-end gap-2 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
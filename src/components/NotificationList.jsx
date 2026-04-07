// src/components/NotificationList.jsx
import { useDispatch, useSelector } from "react-redux";
import { markNotificationRead, markAllNotificationsRead } from "../features/notifications/notificationSlice";
import { formatDistanceToNow } from "date-fns";
import { getNotificationIcon } from "../utils/notificationIcons";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

const NotificationList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const unreadNotifications = items.filter((n) => !n.is_read);

  const getTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Just now";
    }
  };

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleViewAll = () => {
    navigate("/settings?tab=notifications");
  };

  return (
    <div className="w-96 max-w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-5 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 animate-pulse" />
            <h3 className="text-xl font-bold">Notifications</h3>
      
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => dispatch(markAllNotificationsRead())}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {unreadNotifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="bg-gray-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              You're all caught up!
            </p>
          </div>
        ) : (
          <ul className="divide-y grise-gray-200 dark:divide-gray-700">
            {unreadNotifications.map((n, i) => {
              const Icon = getNotificationIcon(n.type);
              return (
                <li
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center ring-4 ring-blue-100 dark:ring-blue-900/50">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {n.data?.title || "Notification"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {n.data?.message || "No message"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getTimeAgo(n.created_at)}
                      </p>
                    </div>
                    <div className="self-start">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t text-center">
        <button
          onClick={handleViewAll}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationList;
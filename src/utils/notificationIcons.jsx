// src/utils/notificationIcons.jsx
import {
  Package, CheckCircle, Trash2,
  Plus, Edit, DollarSign,
  Link, FileText, Mail, Download,
  UserPlus, UserMinus,
  Bell,
} from "lucide-react";

export const getNotificationIcon = (type) => {
  switch (type) {
    case "order_created":      return Package;
    case "order_updated":      return CheckCircle;
    case "order_deleted":      return Trash2;
    case "product_created":    return Plus;
    case "product_updated":    return Edit;
    case "product_deleted":    return Trash2;
    case "product_price_set":
    case "product_price_updated": return DollarSign;
    case "product_suppliers_assigned": return Link;
    case "invoice_created":    return FileText;
    case "invoice_sent":       return Mail;
    case "invoice_downloaded": return Download;
    case "customer_created":   return UserPlus;
    case "customer_updated":   return Edit;  // ← Use Edit
    case "customer_deleted":   return UserMinus;
    default:                   return Bell;
  }
};
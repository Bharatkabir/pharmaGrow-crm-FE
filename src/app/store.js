import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import rolesReducer from "../features/roles/rolesSlice";
import customerReducer from "../features/customers/customerSlice";
import orderReducer from "../features/orders/orderSlice";
import inventoryReducer from "../features/inventory/inventorySlice";
import invoiceReducer from "../features/invoice/invoiceSlice";
import supplierReducer from "../features/suppliers/supplierSlice";
import lowStockReducer from "../features/suppliers/lowStockSlice";
import purchaseOrdersReducer from "../features/suppliers/purchaseOrderSlice";
import purchaseReducer from "../features/suppliers/purchaseSlice";
import companyProfileReducer from "../features/companyProfile/companyProfileSlice";
import employeeReducer from "../features/employee/employeeSlice";
import discountReducer from "../features/discount/discountSlice";
import notificationReducer from "../features/notifications/notificationSlice";
import typesReducer from "../features/customers/customerTypesSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customerReducer,
    roles: rolesReducer,
    orders: orderReducer,
    inventory: inventoryReducer,
    invoice: invoiceReducer,
    suppliers: supplierReducer,
    lowStock: lowStockReducer,
    purchaseOrders: purchaseOrdersReducer,
    purchases: purchaseReducer,
    companyProfile: companyProfileReducer,
    employees: employeeReducer,
    discount : discountReducer,
    notifications: notificationReducer,
    types: typesReducer,
  },
});

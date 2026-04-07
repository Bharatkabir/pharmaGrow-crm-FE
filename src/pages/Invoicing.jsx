import React, { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, DollarSign, Download, Eye, Send, X, Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvoices, exportInvoicesExcel, exportInvoicePDF, fetchInvoice, createInvoice, sendInvoice } from "../features/invoice/invoiceSlice";
import { fetchCustomers } from "../features/customers/customerSlice";
import { fetchProducts, fetchBatches } from "../features/inventory/inventorySlice";

export default function Invoicing({ theme }) {
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const { user = {} } = useSelector((state) => state.auth || {}); // Assuming auth state contains user with permissions_list
  const hasPermission = (permission) => user?.permissions_list?.includes(permission) || false;

  // Ensure fallback for state to prevent undefined errors
  const { invoices = [], loading: invoiceLoading = false, error: invoiceError = null } = useSelector((state) => state.invoice || {});
  const { customers = [], loading: customersLoading = false, error: customersError = null } = useSelector((state) => state.customers || {});
  const { products = [], batches = [], loading: inventoryLoading = false, error: inventoryError = null } = useSelector((state) => state.inventory || {});
  
  const [page, setPage] = useState(1);
  const [modalType, setModalType] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_email: "",
    date: new Date("2025-10-03T13:23:00+05:30").toISOString().split("T")[0], // Updated to 06:53 PM IST
    status: "Draft",
    address: "",
    gst_number: "",
    items: [{ product_id: "", batch_id: "", quantity: 1, price: 0, hsn_code: "", gst_rate: 0 }],
  });
  const [sendEmail, setSendEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (hasPermission("invoicing-view")) {
      dispatch(fetchInvoices(`page=${page}`));
    }
  }, [dispatch, page]);

  useEffect(() => {
    if (modalType === "create" && hasPermission("invoicing-create")) {
      dispatch(fetchCustomers()).unwrap().catch((error) => console.error("Fetch Customers Error:", error));
      dispatch(fetchProducts());
      dispatch(fetchBatches());
    }
  }, [dispatch, modalType]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: "", type: "success" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleViewInvoice = async (id) => {
    if (hasPermission("invoicing-view")) {
      setModalType("view");
      setModalLoading(true);
      setModalError(null);
      setIsModalOpen(true);
      try {
        const result = await dispatch(fetchInvoice(id)).unwrap();
        setSelectedInvoice(result);
      } catch (err) {
        setModalError(err.message || "Failed to fetch invoice");
      } finally {
        setModalLoading(false);
      }
    }
  };

  const handleCreateInvoice = () => {
    if (hasPermission("invoicing-create")) {
      setModalType("create");
      setFormData({
        customer_id: "",
        customer_email: "",
        date: new Date("2025-10-03T13:23:00+05:30").toISOString().split("T")[0], // Updated to 06:53 PM IST
        status: "Draft",
        address: "",
        gst_number: "",
        items: [{ product_id: "", batch_id: "", quantity: 1, price: 0, hsn_code: "", gst_rate: 0 }],
      });
      dispatch(fetchCustomers());
      setModalError(null);
      setIsModalOpen(true);
    }
  };

  const handleSendInvoice = (invoice) => {
    if (hasPermission("invoicing-send-invoice")) {
      setModalType("send");
      setSelectedInvoice(invoice);
      setSendEmail(invoice.customer?.contact || "");
      setCcEmail("");
      setModalError(null);
      setIsModalOpen(true);
    }
  };

  const handleFormChange = (e, index) => {
    const { name, value } = e.target;

    if (name.startsWith("item_")) {
      const field = name.split("_").slice(1).join("_");
      const updatedItems = [...formData.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      if (field === "product_id") {
        const selectedProduct = products.find((p) => p.id.toString() === value.toString());
        if (selectedProduct && selectedProduct.current_price) {
          updatedItems[index].price = parseFloat(selectedProduct.current_price.sell_price) || 0;
          updatedItems[index].batch_id = "";
          updatedItems[index].hsn_code = selectedProduct.hsn_code || "";
          updatedItems[index].gst_rate = parseFloat(selectedProduct.gst_rate || 0);
        } else {
          updatedItems[index].price = 0;
          updatedItems[index].batch_id = "";
          updatedItems[index].hsn_code = "";
          updatedItems[index].gst_rate = 0;
        }
      } else if (field === "quantity") {
        updatedItems[index].quantity = Math.max(1, parseInt(value) || 1);
      }

      setFormData({ ...formData, items: updatedItems });
    } else if (name === "customer_id") {
      const selectedCustomer = customers.find((c) => c.id.toString() === value.toString());
      setFormData({
        ...formData,
        customer_id: value.toString(),
        customer_email: selectedCustomer ? selectedCustomer.contact || "" : "",
        address: selectedCustomer ? selectedCustomer.address || "" : "",
        gst_number: selectedCustomer ? selectedCustomer.gst_number || "" : "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: "", batch_id: "", quantity: 1, price: 0, hsn_code: "", gst_rate: 0 }],
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const calculateTotalAmount = () => {
    return formData.items
      .reduce((total, item) => {
        const lineSubtotal = Number(item.quantity) * Number(item.price);
        const totalTax = (lineSubtotal * Number(item.gst_rate)) / 100;
        return total + lineSubtotal + totalTax;
      }, 0)
      .toFixed(2);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (hasPermission("invoicing-create")) {
      setModalLoading(true);
      setModalError(null);

      if (!formData.customer_id || !formData.date || !formData.address || !formData.gst_number) {
        setModalError("Please fill in all required fields: customer, date, address, and GST number.");
        setModalLoading(false);
        setToast({ show: true, message: "Please fill in all required fields.", type: "error" });
        return;
      }

      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (!item.product_id || item.quantity < 1 || item.price <= 0) {
          setModalError(`Item ${i + 1}: Please fill in all required fields (product, quantity, and price).`);
          setModalLoading(false);
          setToast({ show: true, message: `Item ${i + 1}: Please fill in all required fields.`, type: "error" });
          return;
        }
      }

      try {
        const payload = {
          customer_id: parseInt(formData.customer_id),
          issue_date: formData.date,
          status: formData.status,
          address: formData.address,
          gst_number: formData.gst_number,
          items: formData.items.map((item) => ({
            product_id: parseInt(item.product_id),
            batch_id: item.batch_id ? parseInt(item.batch_id) : null,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.price), // Mapped from sell_price via price
            hsn_code: item.hsn_code,
            gst_rate: parseFloat(item.gst_rate),
          })),
        };
        console.log("Sending payload:", payload); // Debug payload
        await dispatch(createInvoice(payload)).unwrap();
        setIsModalOpen(false);
        setToast({ show: true, message: "Invoice created successfully!", type: "success" });
        dispatch(fetchInvoices(`page=${page}`));
      } catch (err) {
        setModalError(err.message || "Failed to create invoice");
        setToast({ show: true, message: err.message || "Failed to create invoice", type: "error" });
      } finally {
        setModalLoading(false);
      }
    }
  };

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    if (hasPermission("invoicing-send-invoice")) {
      setModalLoading(true);
      setModalError(null);

      if (!sendEmail || !sendEmail.includes("@")) {
        setModalError("Please enter a valid recipient email.");
        setModalLoading(false);
        setToast({ show: true, message: "Please enter a valid recipient email.", type: "error" });
        return;
      }

      try {
        const res = await dispatch(
          sendInvoice({
            id: selectedInvoice.id,
            email: sendEmail,
            cc_email: ccEmail || null,
          })
        ).unwrap();
        setIsModalOpen(false);
        setToast({
          show: true,
          message: res.message || "Invoice sent successfully!",
          type: res.success ? "success" : "error",
        });
      } catch (err) {
        const errorMessage = err?.message || err?.error || "Failed to send invoice";
        setModalError(errorMessage);
        setToast({ show: true, message: errorMessage, type: "error" });
      } finally {
        setModalLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedInvoice(null);
    setModalError(null);
    setSendEmail("");
    setCcEmail("");
    setFormData({
      customer_id: "",
      customer_email: "",
      date: new Date("2025-10-03T13:23:00+05:30").toISOString().split("T")[0], // Updated to 06:53 PM IST
      status: "Draft",
      address: "",
      gst_number: "",
      items: [{ product_id: "", batch_id: "", quantity: 1, price: 0, hsn_code: "", gst_rate: 0 }],
    });
  };

  if (invoiceLoading && !isModalOpen) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (invoiceError && !isModalOpen) {
    const errMsg = typeof invoiceError === "string" ? invoiceError : JSON.stringify(invoiceError);
    return <div className="p-6 text-red-600">Error: {errMsg}</div>;
  }

  const list = Array.isArray(invoices) ? invoices : invoices?.data ?? [];
  const getAmount = (inv) => Number(inv?.total_amount ?? inv?.amount ?? 0);
  const totalInvoices = list.length;
  const paidInvoices = list.filter((inv) => (inv?.status || "").toString() === "Paid").length;
  const pendingAmount = list
    .filter((inv) => (inv?.status || "").toString() === "Pending")
    .reduce((acc, inv) => acc + getAmount(inv), 0);
  const overdueAmount = list
    .filter((inv) => (inv?.status || "").toString() === "Overdue")
    .reduce((acc, inv) => acc + getAmount(inv), 0);
  const meta = invoices?.meta ?? null;

  const handlePrevPage = () => {
    if (!meta) return;
    if (meta.current_page > 1) setPage(meta.current_page - 1);
  };

  const handleNextPage = () => {
    if (!meta) return;
    if (meta.current_page < meta.last_page) setPage(meta.current_page + 1);
  };

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <div className={`p-4 md:p-6 min-h-screen ${isDark ? "bg-gradient-to-br from-gray-900 to-gray-800 text-white" : "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900"} transition-all duration-300`}>
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform ${
            toast.type === "success"
              ? isDark
                ? "bg-green-800 text-green-100 border-green-700"
                : "bg-green-100 text-green-800 border-green-300"
              : isDark
              ? "bg-red-800 text-red-100 border-red-700"
              : "bg-red-100 text-red-800 border-red-300"
          } animate-slide-in`}
        >
          <div className="flex items-center">
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <X className="w-5 h-5 mr-2" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: "", type: "success" })}
              className="ml-4 text-sm hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Invoicing Dashboard</h1>
          <p className={`mt-2 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Manage and track your invoices with ease</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0 w-full sm:w-auto">
          <button
            onClick={() => dispatch(exportInvoicesExcel())}
            className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md border transition-all duration-200 transform hover:scale-105
              ${isDark ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
          >
            <Download className="h-5 w-5 mr-2" />
            Export Excel
          </button>
          {hasPermission("invoicing-create") && (
            <button
              onClick={handleCreateInvoice}
              className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Invoice
            </button>
          )}
        </div>
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Invoices", value: totalInvoices, icon: FileText, color: "text-blue-500" },
          { label: "Paid Invoices", value: paidInvoices, icon: CheckCircle, color: "text-green-500" },
          { label: "Pending Amount", value: `₹${pendingAmount.toLocaleString("en-IN")}`, icon: Clock, color: "text-yellow-500" },
          { label: "Overdue Amount", value: `₹${overdueAmount.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-red-500" },
        ].map((metric, index) => (
          <div
            key={index}
            className={`${
              isDark ? "bg-gray-800/80 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm"
            } rounded-xl shadow-lg p-6 flex items-center justify-between transform hover:scale-105 transition-all duration-200`}
          >
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>{metric.label}</p>
              <h2 className="text-2xl font-extrabold mt-1">{metric.value}</h2>
            </div>
            <metric.icon className={`h-12 w-12 ${metric.color}`} />
          </div>
        ))}
      </div>
      {/* Invoice Table */}
      <div className={`${
        isDark ? "bg-gray-800/80 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm"
      } rounded-xl shadow-lg p-4 md:p-6 transition-all duration-200`}>
        <h2 className="text-lg md:text-xl font-semibold mb-4">Invoice List ({list.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? "bg-gray-700/80" : "bg-gray-50/80"}>
              <tr>
                {["Invoice #", "Customer", "Date", "Amount", "Status", "Actions"].map((header) => (
                  <th
                    key={header}
                    className={`px-3 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`${isDark ? "bg-gray-800/80" : "bg-white/80"} divide-y divide-gray-200 dark:divide-gray-700`}>
              {list.map((invoice) => {
                const invoiceNumber = invoice.invoice_number ?? invoice.id;
                const customerName = invoice.customer?.name ?? "-";
                const date = invoice.date ?? invoice.issue_date ?? invoice.issueDate ?? "";
                const amount = getAmount(invoice);
                return (
                  <tr key={invoiceNumber} className={`transition-all duration-200 ${isDark ? "hover:bg-gray-700/80" : "hover:bg-gray-50/80"}`}>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">{invoiceNumber}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm">{customerName}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm">{formatDate(date)}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm">₹{amount.toLocaleString("en-IN")}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === "Paid"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : invoice.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                            : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 flex gap-2">
                      {hasPermission("invoicing-view") && (
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className={`p-2 border rounded-lg transition-all duration-200 transform hover:scale-110 ${
                            isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                          }`}
                          title="View"
                        >
                          <Eye className="w-5 h-5 text-blue-500" />
                        </button>
                      )}
                      {hasPermission("invoicing-download-invoice") && (
                        <button
                          onClick={() => dispatch(exportInvoicePDF(invoice.id))}
                          className={`p-2 border rounded-lg transition-all duration-200 transform hover:scale-110 ${
                            isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                          }`}
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5 text-green-500" />
                        </button>
                      )}
                      {hasPermission("invoicing-send-invoice") && (
                        <button
                          onClick={() => handleSendInvoice(invoice)}
                          className={`p-2 border rounded-lg transition-all duration-200 transform hover:scale-110 ${
                            isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                          }`}
                          title="Send"
                        >
                          <Send className="w-5 h-5 text-indigo-500" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {meta && (
          <div className="mt-4 flex items-center justify-between">
            <div className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Page {meta.current_page} of {meta.last_page} — {meta.total} invoices
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={meta.current_page <= 1}
                className={`px-4 py-2 border rounded-lg transition-all duration-200 ${
                  isDark
                    ? "border-gray-600 hover:bg-gray-700 disabled:bg-gray-800"
                    : "border-gray-300 hover:bg-gray-100 disabled:bg-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Prev
              </button>
              <button
                onClick={handleNextPage}
                disabled={meta.current_page >= meta.last_page}
                className={`px-4 py-2 border rounded-lg transition-all duration-200 ${
                  isDark
                    ? "border-gray-600 hover:bg-gray-700 disabled:bg-gray-800"
                    : "border-gray-300 hover:bg-gray-100 disabled:bg-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div
            className={`relative ${
              isDark ? "bg-gray-800/95 backdrop-blur-md text-white" : "bg-white/95 backdrop-blur-md text-gray-900"
            } rounded-2xl shadow-2xl w-full max-w-4xl p-6 md:p-8 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100`}
          >
            <button
              onClick={closeModal}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <X className="w-6 h-6" />
            </button>
            {modalLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4">Loading...</p>
              </div>
            ) : modalError ? (
              <div className="text-center py-10 text-red-600">{modalError}</div>
            ) : customersError || inventoryError ? (
              <div className="text-center py-10 text-red-600">
                {customersError || inventoryError || "Unknown error"}
              </div>
            ) : modalType === "view" && selectedInvoice && hasPermission("invoicing-view") ? (
              <div>
                <h2 className="text-2xl font-bold mb-6">Invoice #{selectedInvoice.invoice_number ?? selectedInvoice.id}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>Customer</p>
                    <p className="text-lg font-semibold">{selectedInvoice.customer?.name ?? "-"}</p>
                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Address: {selectedInvoice.customer?.address ?? "-"}</p>
                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>GST Number: {selectedInvoice.customer.gst_number ?? "-"}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>Date</p>
                    <p className="text-lg font-semibold">{formatDate(selectedInvoice.date ?? selectedInvoice.issue_date ?? selectedInvoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>Amount</p>
                    <p className="text-lg font-semibold">₹{getAmount(selectedInvoice).toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>Status</p>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedInvoice.status === "Paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : selectedInvoice.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                          : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-3">Items</h3>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className={isDark ? "bg-gray-700/80" : "bg-gray-50/80"}>
                        <tr>
                          {["Description", "HSN Code", "GST Rate", "Quantity", "Unit Price", "Total"].map((header) => (
                            <th
                              key={header}
                              className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody
                        className={`${isDark ? "bg-gray-800/80" : "bg-white/80"} divide-y divide-gray-200 dark:divide-gray-700`}
                      >
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">{item.description ?? item.product?.name ?? "-"}</td>
                            <td className="px-3 py-2 text-sm">{item.hsn_code ?? "-"}</td>
                            <td className="px-3 py-2 text-sm">
                              {item.tax_rate ? `${parseFloat(item.tax_rate).toFixed(2)}%` : "-"}
                            </td>
                            <td className="px-3 py-2 text-sm">{item.quantity ?? 1}</td>
                            <td className="px-3 py-2 text-sm">
                              ₹{Number(item.unit_price ?? item.price ?? 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              ₹{(
                                (Number(item.quantity ?? 1) * Number(item.unit_price ?? item.price ?? 0) * (1 + Number(item.gst_rate || 0) / 100))
                              ).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>No items available.</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  {hasPermission("invoicing-download-invoice") && (
                    <button
                      onClick={() => dispatch(exportInvoicePDF(selectedInvoice.id))}
                      className={`flex items-center px-4 py-2 border rounded-lg transition-all duration-200 transform hover:scale-105 ${
                        isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <Download className="w-4 h-4 mr-2 text-green-500" />
                      Download PDF
                    </button>
                  )}
                  {hasPermission("invoicing-send-invoice") && (
                    <button
                      onClick={() => handleSendInvoice(selectedInvoice)}
                      className={`flex items-center px-4 py-2 border rounded-lg transition-all duration-200 transform hover:scale-105 ${
                        isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <Send className="w-4 h-4 mr-2 text-indigo-500" />
                      Send Invoice
                    </button>
                  )}
                </div>
              </div>
            ) : modalType === "create" && hasPermission("invoicing-create") ? (
              <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-6`}>
                <h2 className="text-lg font-semibold mb-4">Create New Invoice</h2>
                {modalError && <p className="text-red-500 mb-4">{modalError}</p>}
                {customersError && <p className="text-red-500 mb-4">{customersError}</p>}
                {inventoryError && <p className="text-red-500 mb-4">{inventoryError}</p>}
                {customersLoading || inventoryLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Loading data...</p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Customer
                      </label>
                      <select
                        name="customer_id"
                        value={formData.customer_id}
                        onChange={handleFormChange}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                        required
                        disabled={customersLoading || !customers.length}
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id.toString()} value={customer.id.toString()}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Customer Email
                      </label>
                      <input
                        type="email"
                        name="customer_email"
                        value={formData.customer_email}
                        readOnly
                        className={`mt-1 p-2 border rounded-lg w-full text-sm bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleFormChange}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleFormChange}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        GST Number
                      </label>
                      <input
                        type="text"
                        name="gst_number"
                        value={formData.gst_number}
                        onChange={handleFormChange}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleFormChange}
                        className={`mt-1 p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                        required
                      >
                        <option value="Draft">Draft</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="font-semibold mb-2">Invoice Items</h3>
                      {formData.items.map((item, index) => {
                        const selectedProduct = products.find((p) => p.id.toString() === (item.product_id?.toString() || ""));
                        return (
                          <div key={index} className="mb-4 border-b pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <select
                                name="item_product_id"
                                value={item.product_id?.toString() || ""}
                                onChange={(e) => handleFormChange(e, index)}
                                className={`p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                  ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                                required
                                disabled={inventoryLoading || !products.length}
                              >
                                <option value="">Select Product</option>
                                {products.map((p) => (
                                  <option key={p.id.toString()} value={p.id.toString()}>
                                    {p.name} (₹{p.current_price ? parseFloat(p.current_price.sell_price).toFixed(2) : 0})
                                  </option>
                                ))}
                              </select>
                              <select
                                name="item_batch_id"
                                value={item.batch_id?.toString() || ""}
                                onChange={(e) => handleFormChange(e, index)}
                                className={`p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                  ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                                disabled={!item.product_id || inventoryLoading || !batches.length}
                              >
                                <option value="">Select Batch</option>
                                {selectedProduct?.batches && selectedProduct.batches.length > 0 ? (
                                  selectedProduct.batches.map((b) => (
                                    <option key={b.id.toString()} value={b.id.toString()}>
                                      Batch {b.batch_number} (Stock: {b.stock_level || "N/A"}, ₹{parseFloat(selectedProduct.current_price.sell_price || 0).toFixed(2)})
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>
                                    No batches available
                                  </option>
                                )}
                              </select>
                              <input
                                type="number"
                                name="item_quantity"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleFormChange(e, index)}
                                className={`p-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                  ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                                placeholder="Quantity"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                disabled={formData.items.length === 1}
                                className={`p-2 border rounded-lg ${
                                  isDark
                                    ? "text-red-300 border-red-600 hover:bg-red-700"
                                    : "text-red-600 border-red-300 hover:bg-red-100"
                                } ${formData.items.length === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                                aria-label={`Remove item ${index + 1}`}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm">
                                Item Total: ₹{(Number(item.quantity) * Number(item.price) * (1 + (item.gst_rate / 100))).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={addItem}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                            : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Plus className="w-4 h-4 mr-2 inline" />
                        Add Another Item
                      </button>
                      <div className="mt-4">
                        <p className="text-sm font-semibold">Total Amount: ₹{calculateTotalAmount()}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg border transition-colors
                          ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading || customersLoading || inventoryLoading || !products.length || !customers.length || formData.items.some(item => !item.product_id || item.quantity < 1 || item.price <= 0)}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Create Invoice
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : modalType === "send" && selectedInvoice && hasPermission("invoicing-send-invoice") ? (
              <div>
                <h2 className="text-2xl font-bold mb-6">Send Invoice #{selectedInvoice.invoice_number ?? selectedInvoice.id}</h2>
                <form onSubmit={handleSendSubmit} className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>Recipient Email</label>
                    <input
                      type="email"
                      value={sendEmail}
                      onChange={(e) => setSendEmail(e.target.value)}
                      className={`mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>CC Email (optional)</label>
                    <input
                      type="email"
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      className={`mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter CC email"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className={`px-4 py-2 border rounded-lg transition-all duration-200 ${
                        isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Send Invoice
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-10">No data available.</div>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
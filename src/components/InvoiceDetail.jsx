import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchInvoice, exportInvoicePDF } from "../features/invoice/invoiceSlice";
import { ChevronLeft, Download, Send } from "lucide-react";

export default function InvoiceDetail({ theme }) {
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedInvoice, loading, error } = useSelector((state) => state.invoice);

  useEffect(() => {
    dispatch(fetchInvoice(id));
  }, [dispatch, id]);

  const handleBack = () => {
    navigate("/invoices");
  };

  const handleDownloadPDF = () => {
    dispatch(exportInvoicePDF(id)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        const blob = new Blob([result.payload], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${selectedInvoice?.invoice_number || id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    });
  };

  const handleSendInvoice = () => {
    // Placeholder for sending invoice (e.g., trigger email API)
    alert("Send invoice functionality not implemented yet.");
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <p className="text-red-500 font-medium">Error: {error}</p>
      </div>
    );
  }

  if (!selectedInvoice) {
    return (
      <div className={`p-6 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <p>No invoice data available.</p>
      </div>
    );
  }

  const { invoice_number, customer, issue_date, due_date, total_amount, status, items } = selectedInvoice;

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className={`min-h-screen p-6 md:p-8 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"} transition-colors duration-300`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Invoice #{invoice_number || id}
          </h1>
          <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Details for invoice issued to {customer?.name || "-"}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button
            onClick={handleBack}
            className={`flex items-center px-5 py-2.5 rounded-xl shadow-sm border transition-all duration-300 transform hover:scale-105
              ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Invoices
          </button>
          <button
            onClick={handleDownloadPDF}
            className={`flex items-center px-5 py-2.5 rounded-xl shadow-sm border transition-all duration-300 transform hover:scale-105
              ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            <Download className="h-5 w-5 mr-2" />
            Download PDF
          </button>
          <button
            onClick={handleSendInvoice}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
          >
            <Send className="h-5 w-5 mr-2" />
            Send Invoice
          </button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className={`${isDark ? "bg-gray-800 shadow-xl" : "bg-white shadow-md"} rounded-2xl p-6 md:p-8 mb-8 transition-all duration-300`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
              Customer Information
            </h2>
            <p><strong>Name:</strong> {customer?.name || "-"}</p>
            <p><strong>Email:</strong> {customer?.email || "-"}</p>
            <p><strong>Address:</strong> {customer?.address || "-"}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
              Invoice Information
            </h2>
            <p><strong>Invoice #:</strong> {invoice_number || id}</p>
            <p><strong>Issue Date:</strong> {formatDate(issue_date)}</p>
            <p><strong>Due Date:</strong> {formatDate(due_date)}</p>
            <p><strong>Status:</strong> <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-md ${getStatusColor(status)}`}>{status || "-"}</span></p>
            <p><strong>Total Amount:</strong> ${Number(total_amount || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Items Table */}
        <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
          Invoice Items
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <tr>
                {["Description", "Quantity", "Unit Price", "Total"].map((head) => (
                  <th
                    key={head}
                    className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index} className={`transition-all duration-200 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.quantity || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">${Number(item.unit_price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">${Number(item.total || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-sm text-center">No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
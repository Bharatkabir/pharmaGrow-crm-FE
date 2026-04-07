import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Filter, ShoppingBag } from "lucide-react";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, clearMessages } from "../features/suppliers/supplierSlice";

export default function SuppliersList({ theme }) {
  const dispatch = useDispatch();
  const { data: suppliers, loading, error, success } = useSelector((state) => state.suppliers);
  const { user } = useSelector((state) => state.auth || {});
  const [showForm, setShowForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    priority: "normal",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    priority: "",
  });
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const isDark = theme === "dark";

  useEffect(() => {
    dispatch(fetchSuppliers());
    if (error || success) {
      const timer = setTimeout(() => dispatch(clearMessages()), 3000);
      return () => clearTimeout(timer);
    }
  }, [dispatch, error, success]);

  useEffect(() => {
    applyFilters();
  }, [suppliers, filters]);

  const applyFilters = () => {
    const supplierList = Array.isArray(suppliers) ? suppliers : [];
    let filtered = supplierList;
    if (filters.search) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          supplier.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
          supplier.contact?.includes(filters.search)
      );
    }
    if (filters.priority) {
      filtered = filtered.filter((supplier) => supplier.priority === filters.priority);
    }
    setFilteredSuppliers(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (supplier) => {
    setNewSupplier({
      name: supplier.name,
      email: supplier.email,
      contact: supplier.contact,
      address: supplier.address || "",
      priority: supplier.priority || "normal",
    });
    setEditingSupplierId(supplier.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleViewClick = (supplier) => {
    setSelectedSupplier({
      ...supplier,
      initials: supplier.name ? supplier.name.slice(0, 2).toUpperCase() : "NA",
    });
    setShowModal(true);
    toast.info(`Viewing: ${supplier.name}`);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await dispatch(deleteSupplier(id)).unwrap();
      toast.success("Supplier deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete supplier.");
    }
  };

  const handleSubmitSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.email || !newSupplier.contact) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSupplier.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    const supplierData = {
      name: newSupplier.name,
      email: newSupplier.email,
      contact: newSupplier.contact,
      address: newSupplier.address,
      priority: newSupplier.priority || "normal",
    };
    try {
      if (isEditing) {
        await dispatch(updateSupplier({ id: editingSupplierId, supplierData })).unwrap();
        toast.success("Supplier updated successfully");
      } else {
        await dispatch(createSupplier(supplierData)).unwrap();
        toast.success("Supplier created successfully");
      }
      resetForm();
      setShowForm(false);
      setIsEditing(false);
      setEditingSupplierId(null);
    } catch (err) {
      toast.error(err.message || "Failed to save supplier.");
    }
  };

  const resetForm = () => {
    setNewSupplier({
      name: "",
      email: "",
      contact: "",
      address: "",
      priority: "normal",
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSupplier(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: "", priority: "" });
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "primary":
        return isDark
          ? "bg-blue-600 text-blue-100 dark:bg-blue-700 dark:text-blue-100"
          : "bg-blue-100 text-blue-800";
      case "normal":
        return isDark
          ? "bg-yellow-600 text-yellow-100 dark:bg-yellow-700 dark:text-yellow-100"
          : "bg-yellow-100 text-yellow-800";
      case "low":
        return isDark
          ? "bg-gray-600 text-gray-100 dark:bg-gray-700 dark:text-gray-100"
          : "bg-gray-100 text-gray-800";
      default:
        return isDark
          ? "bg-gray-600 text-gray-100 dark:bg-gray-700 dark:text-gray-100"
          : "bg-gray-100 text-gray-800";
    }
  };

  const hasPermission = (permission) => user?.permissions_list?.includes(permission) || false;

  return (
    <div className={`p-4 md:p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Suppliers</h1>
          <p className={`mt-1 text-xs md:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Manage your supplier relationships
          </p>
        </div>
        {hasPermission("suppliers-create") && (
          <button
            onClick={() => {
              setShowForm(true);
              setIsEditing(false);
              resetForm();
            }}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Supplier
          </button>
        )}
      </div>
      {/* Supplier Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 animate-fade-in ${
              isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
            }`}
          >
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit Supplier" : "Add New Supplier"}</h2>
            <form onSubmit={handleSubmitSupplier} className="flex flex-col gap-3">
              <input
                type="text"
                name="name"
                placeholder="Supplier Name"
                value={newSupplier.name}
                onChange={handleInputChange}
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
                }`}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={newSupplier.email}
                onChange={handleInputChange}
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
                }`}
                required
              />
              <input
                type="text"
                name="contact"
                placeholder="Contact Number"
                value={newSupplier.contact}
                onChange={handleInputChange}
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
                }`}
                required
              />
              <textarea
                name="address"
                placeholder="Address"
                value={newSupplier.address}
                onChange={handleInputChange}
                rows="3"
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
                }`}
              />
              <select
                name="priority"
                value={newSupplier.priority}
                onChange={handleInputChange}
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
                }`}
              >
                <option value="primary">Primary</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg shadow-md transition-colors ${
                    isDark ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isEditing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Supplier View Modal */}
      {showModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-95 hover:scale-100 animate-fade-in ${
              isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">👤 Supplier Details</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-red-500 transition">✖</button>
            </div>
            <div className="space-y-3">
              <p><strong>Name:</strong> {selectedSupplier.name}</p>
              <p><strong>Initials:</strong> {selectedSupplier.initials}</p>
              <p><strong>Email:</strong> {selectedSupplier.email}</p>
              <p><strong>Contact:</strong> {selectedSupplier.contact}</p>
              <p><strong>Address:</strong> {selectedSupplier.address || "N/A"}</p>
              <p><strong>Priority:</strong> {selectedSupplier.priority ? selectedSupplier.priority.charAt(0).toUpperCase() + selectedSupplier.priority.slice(1) : "Normal"}</p>
              <p><strong>Since:</strong> {new Date(selectedSupplier.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Search & Filter Section */}
      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 mb-6`}>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-1/3">
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-300" : "text-gray-400"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
              </svg>
            </div>
            <input
              type="text"
              name="search"
              placeholder="Search suppliers..."
              value={filters.search}
              onChange={handleFilterChange}
              className={`pl-10 pr-3 py-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-black"
              }`}
            />
          </div>
          <div className="relative w-full md:w-1/3">
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className={`px-3 py-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
              }`}
            >
              <option value="">All Priorities</option>
              <option value="primary">Primary</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={resetFilters}
              className={`px-4 py-2 rounded-lg shadow-sm border transition-colors ${
                isDark ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600" : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      {/* Supplier Table */}
      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 md:p-6 mt-4`}>
        <h2 className={`text-base md:text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
          Supplier List ({loading ? "Loading..." : `${filteredSuppliers.length} suppliers`})
        </h2>
        {error && <p className={`text-sm mb-4 ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {["Supplier", "Email", "Contact", "Address", "Priority", "Actions"].map((head) => (
                  <th
                    key={head}
                    className={`px-3 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={isDark ? "bg-gray-800 divide-y divide-gray-700" : "bg-white divide-y divide-gray-200"}>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="animate-fade-in">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 flex items-center justify-center text-white font-bold rounded-full mr-4 text-xs flex-shrink-0 ${
                          supplier.name.startsWith("A") ? "bg-blue-600" : "bg-yellow-500"
                        }`}
                      >
                        {supplier.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{supplier.name}</div>
                        <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          Since {new Date(supplier.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-blue-600">{supplier.email}</div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{supplier.contact}</div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{supplier.address || "N/A"}</div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${getPriorityBadgeClass(
                        supplier.priority
                      )}`}
                    >
                      {supplier.priority ? supplier.priority.charAt(0).toUpperCase() + supplier.priority.slice(1) : "Normal"}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewClick(supplier)}
                        className={`p-2 border rounded-lg ${isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                      >
                        <FiEye size={20} />
                      </button>
                      {hasPermission("suppliers-edit") && (
                        <button
                          onClick={() => handleEditClick(supplier)}
                          className={`p-2 border rounded-lg ${isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                        >
                          <FiEdit size={20} />
                        </button>
                      )}
                      {hasPermission("suppliers-delete") && (
                        <button
                          onClick={() => handleDeleteClick(supplier.id)}
                          className={`p-2 border rounded-lg ${isDark ? "text-red-300 border-red-600 hover:bg-red-700" : "text-red-600 border-red-300 hover:bg-red-100"}`}
                        >
                          <FiTrash2 size={20} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
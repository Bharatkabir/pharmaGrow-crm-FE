import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ShoppingBag } from "lucide-react";
import {
  fetchCustomers,
  resetCustomerState,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  fetchCustomerById,
} from "../features/customers/customerSlice";
import { fetchTypes } from "../features/customers/customerTypesSlice";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Customers({ theme }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { customers, isLoading, isError, message } = useSelector((state) => state.customers);
  const { types, isLoading: typesLoading, isError: typesError } = useSelector((state) => state.types); // ← From typesSlice
  const { user } = useSelector((state) => state.auth || {});

  const [showForm, setShowForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    phone: "",
    type_id: "",
    status: "Active",
    address: "",
    gst_number: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "All Status",
    type: "All Types",
  });
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const isDark = theme === "dark";

  // Fetch customers + types via Redux
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchTypes()); // ← Now fully managed by Redux

    return () => dispatch(resetCustomerState());
  }, [dispatch]);

  // Re-apply filters when customers or filters change
  useEffect(() => {
    applyFilters();
  }, [customers, filters]);

  // Show error if types failed to load
  useEffect(() => {
    if (typesError) {
      toast.error("Failed to load customer types.");
    }
  }, [typesError]);

  const calculateCustomerMetrics = (customer) => {
    const orders = Array.isArray(customer.orders) ? customer.orders : [];
    const total_orders = orders.length;
    const total_amount = orders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0);
    const paid_amount = orders.reduce((sum, order) =>
      order.payment === "Paid" ? sum + (parseFloat(order.amount) || 0) : sum, 0);
    const unpaid_amount = orders.reduce((sum, order) =>
      order.payment === "Pending" ? sum + (parseFloat(order.amount) || 0) : sum, 0);
    return { ...customer, total_orders, total_amount, paid_amount, unpaid_amount };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (customer) => {
    setNewCustomer({
      name: customer.name,
      initials: customer.initials,
      contact: customer.contact,
      phone: customer.phone,
      type_id: customer.type_id || "",
      status: customer.status,
      address: customer.address || "",
      gst_number: customer.gst_number || "",
    });
    setEditingCustomerId(customer.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleViewClick = async (id) => {
    try {
      const result = await dispatch(fetchCustomerById(id)).unwrap();
      setSelectedCustomer(calculateCustomerMetrics(result));
      setShowModal(true);
      toast.info(`Viewing: ${result.name}`);
    } catch (err) {
      toast.error(err.message || "Failed to fetch customer.");
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      const result = await dispatch(deleteCustomer(id)).unwrap();
      toast.success(result.message || "Customer deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete customer.");
    }
  };

  const handleSubmitCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.contact || !newCustomer.phone || !newCustomer.type_id) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.contact)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const customerData = {
      name: newCustomer.name,
      contact: newCustomer.contact,
      phone: newCustomer.phone,
      type_id: newCustomer.type_id,
      status: newCustomer.status,
      address: newCustomer.address,
      gst_number: newCustomer.gst_number,
    };

    try {
      if (isEditing) {
        await dispatch(updateCustomer({ id: editingCustomerId, data: customerData })).unwrap();
        toast.success("Customer updated successfully");
      } else {
        await dispatch(addCustomer(customerData)).unwrap();
        toast.success("Customer created successfully");
      }
      resetForm();
      setShowForm(false);
      setIsEditing(false);
      setEditingCustomerId(null);
    } catch (err) {
      toast.error(err.message || "Failed to save customer.");
    }
  };

  const resetForm = () => {
    setNewCustomer({
      name: "",
      contact: "",
      phone: "",
      type_id: "",
      status: "Active",
      address: "",
      gst_number: "",
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const customerList = Array.isArray(customers) ? customers : [];
    let filtered = customerList.map(calculateCustomerMetrics);

    if (filters.search) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.contact?.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.phone?.includes(filters.search)
      );
    }
    if (filters.status !== "All Status") {
      filtered = filtered.filter((c) => c.status === filters.status);
    }
    if (filters.type !== "All Types") {
      filtered = filtered.filter((c) => c.type?.type === filters.type);
    }
    setFilteredCustomers(filtered);
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "All Status", type: "All Types" });
  };

  const hasPermission = (permission) => user?.permissions_list?.includes(permission) || false;

  return (
    <div className={`p-4 md:p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Customers</h1>
          <p className={`mt-1 text-xs md:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Manage your customer relationships and view their activity
          </p>
        </div>
        {hasPermission("customers-create") && (
          <button
            onClick={() => {
              setShowForm(true);
              setIsEditing(false);
              resetForm();
            }}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Customer
          </button>
        )}
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 ${isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}>
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit Customer" : "Add New Customer"}</h2>
            <form onSubmit={handleSubmitCustomer} className="flex flex-col gap-3">
              <input type="text" name="name" placeholder="Customer Name" value={newCustomer.name} onChange={handleInputChange}
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"}`} required />
              <input type="email" name="contact" placeholder="Email" value={newCustomer.contact} onChange={handleInputChange}
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"}`} required />
              <input type="text" name="phone" placeholder="Phone" value={newCustomer.phone} onChange={handleInputChange}
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"}`} required />
              
              <select name="type_id" value={newCustomer.type_id} onChange={handleInputChange} required
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-600" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"}`}>
                <option value="">Select Type</option>
                {typesLoading ? (
                  <option>Loading types...</option>
                ) : (
                  types.map((type) => (
                    <option key={type.id} value={type.id}>{type.type}</option>
                  ))
                )}
              </select>

              <select name="status" value={newCustomer.status} onChange={handleInputChange}
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-600" : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"}`}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>

              <textarea name="address" placeholder="Full Address" value={newCustomer.address} onChange={handleInputChange} rows="3"
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"}`} />

              <input type="text" name="gst_number" placeholder="GST Number" value={newCustomer.gst_number} onChange={handleInputChange} maxLength="20"
                className={`px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${isDark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500"}`} />

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className={`px-4 py-2 border rounded-lg transition-colors ${isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
                  Cancel
                </button>
                <button type="submit"
                  className={`px-4 py-2 rounded-lg shadow-md transition-colors ${isDark ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {isEditing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer View Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-95 hover:scale-100 ${isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">Customer Details</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-red-500 transition">Close</button>
            </div>
            <div className="space-y-3">
              <p><strong>Name:</strong> {selectedCustomer.name}</p>
              <p><strong>Initials:</strong> {selectedCustomer.initials}</p>
              <p><strong>Email:</strong> {selectedCustomer.contact}</p>
              <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
              <p><strong>Address:</strong> {selectedCustomer.address || "N/A"}</p>
              <p><strong>GST Number:</strong> {selectedCustomer.gst_number || "N/A"}</p>
              <p><strong>Type:</strong> <span className="px-2 py-1 text-sm rounded-md bg-blue-100 text-blue-700">{selectedCustomer.type?.type || "N/A"}</span></p>
              <p><strong>Status:</strong> <span className={`px-2 py-1 text-sm rounded-md ${selectedCustomer.status === "Active" ? "bg-green-100 text-green-700" : selectedCustomer.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{selectedCustomer.status}</span></p>
              <p><strong>Total Orders:</strong> {selectedCustomer.total_orders}</p>
              <p><strong>Total Amount:</strong> ₹{(selectedCustomer.total_amount || 0).toLocaleString("en-IN")}</p>
              <p><strong>Since:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => navigate(`/customers/${selectedCustomer.id}/orders`)} disabled={selectedCustomer.total_orders === 0}
                className={`px-5 py-2 rounded-lg shadow-md transition ${selectedCustomer.total_orders === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700"}`}>
                {selectedCustomer.total_orders === 0 ? "No Orders" : "View Orders"}
              </button>
              <button onClick={closeModal} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition">
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
            <input type="text" name="search" placeholder="Search customers..." value={filters.search} onChange={handleFilterChange}
              className={`pl-10 pr-3 py-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-black"}`} />
          </div>

          <select name="status" value={filters.status} onChange={handleFilterChange}
            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}>
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select name="type" value={filters.type} onChange={handleFilterChange}
            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}>
            <option value="All Types">All Types</option>
            {types.map((type) => (
              <option key={type.id} value={type.type}>{type.type}</option>
            ))}
          </select>

          <button onClick={resetFilters}
            className={`px-4 py-2 rounded-lg shadow-sm border transition-colors ${isDark ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600" : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"}`}>
            Clear
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm p-4 md:p-6 mt-4`}>
        <h2 className={`text-base md:text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
          Customer List ({isLoading ? "Loading..." : `${filteredCustomers.length} customers`})
        </h2>
        {isError && <p className={`text-sm mb-4 ${isDark ? "text-red-400" : "text-red-600"}`}>{message}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {["Customer", "Type", "Contact", "Total Orders", "Total Amount", "Status", "Actions"].map((head) => (
                  <th key={head} className={`px-3 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-500"}`}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={isDark ? "bg-gray-800 divide-y divide-gray-700" : "bg-white divide-y divide-gray-200"}>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 flex items-center justify-center text-white font-bold rounded-full mr-4 text-xs flex-shrink-0 ${customer.name.startsWith("Apollo") ? "bg-blue-600" : customer.name.startsWith("Medicare") ? "bg-green-600" : "bg-yellow-500"}`}>
                        {customer.initials}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{customer.name}</div>
                        <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Since {new Date(customer.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${customer.type?.type === "Retail" ? "bg-blue-100 text-blue-800" : customer.type?.type === "Wholesale" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {customer.type?.type || "N/A"}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-blue-600">{customer.contact}</div>
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{customer.phone}</div>
                  </td>
                  <td className={`px-3 md:px-6 py-4 whitespace-nowrap text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}>
                    {customer.total_orders > 0 ? customer.total_orders : "N/A"}
                  </td>
                  <td className={`px-3 md:px-6 py-4 whitespace-nowrap text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}>
                    ₹{(customer.total_amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${customer.status === "Active" ? "bg-green-100 text-green-800" : customer.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button onClick={() => handleViewClick(customer.id)} className={`p-2 border rounded-lg ${isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-600 border-gray-300 hover:bg-gray-100"}`}>
                        <FiEye size={20} />
                      </button>
                      {hasPermission("customers-edit") && (
                        <button onClick={() => handleEditClick(customer)} className={`p-2 border rounded-lg ${isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-600 border-gray-300 hover:bg-gray-100"}`}>
                          <FiEdit size={20} />
                        </button>
                      )}
                      {hasPermission("customers-delete") && (
                        <button onClick={() => customer.total_orders > 0 ? navigate(`/customers/${customer.id}/orders`) : null} disabled={customer.total_orders === 0}
                          className={`p-2 border rounded-lg ${customer.total_orders === 0 ? "text-gray-400 border-gray-300 cursor-not-allowed" : isDark ? "text-teal-300 border-teal-600 hover:bg-teal-700" : "text-teal-600 border-teal-300 hover:bg-teal-100"}`}>
                          <ShoppingBag size={20} />
                        </button>
                      )}
                      {hasPermission("customers-delete") && (
                        <button onClick={() => handleDeleteClick(customer.id)} className={`p-2 border rounded-lg ${isDark ? "text-red-300 border-red-600 hover:bg-red-700" : "text-red-600 border-red-300 hover:bg-red-100"}`}>
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
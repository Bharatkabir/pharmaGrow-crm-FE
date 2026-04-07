import { useEffect, useState } from "react";
import { Plus, Edit, Trash, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../features/employee/employeeSlice";
import { fetchRolesAndPermissions } from "../features/roles/rolesSlice";
import { toast } from "react-toastify";

export default function EmployeeManagementPage({ theme }) {
  const isDark = theme === "dark";
  const dispatch = useDispatch();

  // ---- Redux state ----
  const {
    employees = [],
    loading: empLoading,
    error: empError,
  } = useSelector((state) => state.employees || {});

  const {
    roles = [],
    loading: rolesLoading,
    error: rolesError,
  } = useSelector((state) => state.roles || {});

  // ---- Local UI state ----
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  });

  /* -------------------------------------------------
     Load BOTH employees AND roles on mount
  ------------------------------------------------- */
  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchRolesAndPermissions());
  }, [dispatch]);

  /* -------------------------------------------------
     Toast for role errors (optional)
  ------------------------------------------------- */
  useEffect(() => {
    if (rolesError) {
      toast.error(rolesError, { autoClose: 3000 });
    }
  }, [rolesError]);

  /* -------------------------------------------------
     Save / Update employee
  ------------------------------------------------- */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.warn("Please select a role");

    try {
      if (editing) {
        await dispatch(
          updateEmployee({
            id: editing.id,
            updatedData: {
              name: form.name,
              email: form.email,
              role: form.role,
              ...(form.password && { password: form.password }),
            },
          })
        ).unwrap();
        toast.success("Employee updated");
      } else {
        await dispatch(
          createEmployee({
            name: form.name,
            email: form.email,
            role: form.role,
            password: form.password || "123456",
          })
        ).unwrap();
        toast.success("Employee created");
      }

      closeModal();
    } catch (err) {
      toast.error(err?.message || "Failed to save employee");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: "", email: "", role: "", password: "" });
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      name: emp.name,
      email: emp.email,
      role: emp.roles?.[0]?.name || "",
      password: "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await dispatch(deleteEmployee(id)).unwrap();
      toast.success("Employee deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  /* -------------------------------------------------
     Render
  ------------------------------------------------- */
  return (
    <div
      className={`min-h-screen p-6 md:p-8 transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100"
          : "bg-gradient-to-br from-gray-50 to-white text-gray-800"
      }`}
    >
      {/* ------- LIST VIEW ------- */}
      {!showModal && (
        <>
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Employee Management
            </h1>
            <p className="text-lg text-gray-400">Manage your team members</p>
          </header>

          <section
            className={`p-6 rounded-2xl shadow-lg border transition-transform hover:scale-[1.01] ${
              isDark
                ? "bg-gray-800/70 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center border-b-2 border-green-500/30 pb-4 mb-6">
              <h2 className="text-2xl font-semibold text-green-500">Employees</h2>
              <button
                onClick={() => setShowModal(true)}
                disabled={empLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Plus size={18} /> Add Employee
              </button>
            </div>

            {empLoading ? (
              <p className="text-center py-8 text-gray-400">Loading employees...</p>
            ) : empError ? (
              <p className="text-center text-red-500">{empError}</p>
            ) : employees.length === 0 ? (
              <p className="text-center py-8 text-gray-400">No employees yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className={`p-5 rounded-lg border transition-all hover:shadow-md ${
                      isDark
                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <h3 className="font-semibold text-lg">{emp.name}</h3>
                    <p className="text-sm text-gray-400">Email: {emp.email}</p>
                    <p className="text-sm text-gray-400">
                      Role: {emp.roles?.[0]?.name || "—"}
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(emp)}
                        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                        title="Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ------- MODAL (Add / Edit) ------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${
              isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editing ? "Edit Employee" : "Add New Employee"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full p-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-gray-50 border-gray-300 text-gray-800"
                  } focus:ring-2 focus:ring-green-500`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full p-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-gray-50 border-gray-300 text-gray-800"
                  } focus:ring-2 focus:ring-green-500`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={`w-full p-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-gray-50 border-gray-300 text-gray-800"
                  } focus:ring-2 focus:ring-green-500`}
                  required
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {editing ? "New Password (optional)" : "Password"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? "Leave blank to keep current" : ""}
                  className={`w-full p-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-gray-50 border-gray-300 text-gray-800"
                  } focus:ring-2 focus:ring-green-500`}
                  required={!editing}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={empLoading}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {empLoading ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
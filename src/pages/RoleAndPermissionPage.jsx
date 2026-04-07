import { useEffect, useState } from "react";
import { Plus, Edit, Trash, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRolesAndPermissions,
  createRole,
  updateRole,
  deleteRole,
  reset as resetRoles,
} from "../features/roles/rolesSlice";
import { toast } from "react-toastify";

export default function RoleAndPermissionPage({ theme }) {
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const {
    roles,
    permissionsGrouped,
    loading: rolesLoading,
    error: rolesError,
    message: rolesMessage,
  } = useSelector((state) => state.roles || {});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    dispatch(fetchRolesAndPermissions());
  }, [dispatch]);

  useEffect(() => {
    if(rolesError) {
      alert(rolesMessage || "An error occurred while managing roles");
      dispatch(resetRoles());
    }
  }, [rolesError, rolesMessage, dispatch]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.warn("Role name is required");
      return;
    }
    try {
      await dispatch(createRole(newRoleName)).unwrap();
      setNewRoleName("");
      setShowAddForm(false);
      toast.success("Role created successfully");
      window.location.reload()
    } catch (err) {
      toast.error(err || "Failed to create role");
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedRole || !selectedRole.id) {
      toast.warn("Please select a role to update");
      return;
    }
    try {
      await dispatch(updateRole({ roleId: selectedRole.id, name: selectedRole.name, permissions: selectedPermissions })).unwrap();
      setSelectedRole(null);
      setSelectedPermissions([]);
      setShowEditForm(false);
      toast.success("Role updated successfully");
    } catch (err) {
      toast.error(err || "Failed to update role");
    }
  };

  const handleDeleteRole = async (roleId) => {
  if (window.confirm("Are you sure you want to delete this role?")) {
    try {
      await dispatch(deleteRole(roleId)).unwrap();
      toast.success("Role deleted successfully");
    } catch (err) {
      toast.error(err || "Failed to delete role");
    }
  }
};

  const togglePermission = (permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div
      className={`min-h-screen p-6 md:p-8 transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100"
          : "bg-gradient-to-br from-gray-50 to-white text-gray-800"
      }`}
    >
      {!showAddForm && !showEditForm && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Role & Permission Management
            </h1>
            <p className="text-md md:text-lg text-gray-400">Manage roles and their permissions</p>
          </div>
          <div
            className={`w-full p-6 rounded-2xl shadow-lg border ${
              isDark ? "bg-gray-800/70 border-gray-700" : "bg-white border-gray-200"
            } transform hover:scale-[1.02] transition-all duration-300`}
          >
            <div className="mb-6 flex justify-between items-center border-b-2 border-purple-500/30 pb-4">
              <h2 className="text-2xl font-semibold text-purple-500">Roles</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all flex items-center"
                disabled={rolesLoading}
              >
                <Plus size={18} className="mr-2" /> Add Role
              </button>
            </div>
            {rolesLoading ? (
              <p className="text-center text-gray-400">Loading roles...</p>
            ) : rolesError ? (
              <p className="text-center text-red-500">Error: {rolesMessage}</p>
            ) : roles.length === 0 ? (
              <p className="text-center text-gray-400">No roles found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-4 rounded-lg border ${
                      isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                    } hover:bg-gray-100/20 transition-colors`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-lg">{role.name} ({role.users_count || 0})</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRole(role);
                            setSelectedPermissions(role.permissions.map((p) => p.name));
                            setShowEditForm(true);
                          }}
                          className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                          title="Edit Role"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                          title="Delete Role"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showAddForm && (
        <div className={`min-h-screen p-6 md:p-8 ${isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"}`}>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-3xl font-bold">Add New Role</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 hover:bg-gray-200/20 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleCreateRole} className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-2">Role Name</label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className={`w-full p-3 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-800"} focus:ring-2 focus:ring-purple-500`}
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rolesLoading}
                className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {rolesLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && selectedRole && (
        <div className={`min-h-screen p-6 md:p-8 ${isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"}`}>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-3xl font-bold">Edit Role: {selectedRole.name}</h2>
            <button
              onClick={() => {
                setShowEditForm(false);
                setSelectedRole(null);
                setSelectedPermissions([]);
              }}
              className="p-2 hover:bg-gray-200/20 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleUpdateRole} className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-2">Role Name</label>
              <input
                type="text"
                value={selectedRole.name}
                onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                className={`w-full p-3 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-800"} focus:ring-2 focus:ring-purple-500`}
                required
              />
            </div>
            <div>
              <label className="block text-lg font-medium mb-4">Permissions</label>
              <div className="max-h-[70vh] overflow-y-auto">
                {Object.entries(permissionsGrouped).map(([group, perms]) => (
                  <div key={group} className="mb-6">
                    <h4 className="font-medium text-md text-gray-500 dark:text-gray-400 mb-3 capitalize">
                      {group}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50/10 hover:bg-gray-100/20 transition-colors cursor-pointer"
                        >
                          <span className="text-md">{perm.name}</span>
                          <button
                            type="button"
                            onClick={() => togglePermission(perm.name)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              selectedPermissions.includes(perm.name)
                                ? "bg-purple-600"
                                : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                selectedPermissions.includes(perm.name)
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedRole(null);
                  setSelectedPermissions([]);
                }}
                className="px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rolesLoading}
                className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {rolesLoading ? "Updating..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
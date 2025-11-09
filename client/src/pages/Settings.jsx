import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import Toast from "../components/Toast.jsx";
import api from "../api/axios";

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    newRole: null,
    currentRole: null,
    userName: null,
  });
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success',
  });

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ isVisible: false, message: '', type: 'success' });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError(error.response?.data?.msg || "Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole, currentRole, userName) => {
    // Don't show modal if role hasn't changed
    if (newRole === currentRole) {
      return;
    }

    // Open confirmation modal
    setConfirmModal({
      isOpen: true,
      userId,
      newRole,
      currentRole,
      userName,
    });
  };

  const handleConfirmRoleChange = async () => {
    const { userId, newRole, userName } = confirmModal;

    try {
      setUpdatingUserId(userId);
      const response = await api.put(`/admin/users/${userId}/role`, { role: newRole });

      // Update local state with the updated user
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, role: newRole };
          }
          return user;
        })
      );
      
      // Close modal
      setConfirmModal({ isOpen: false, userId: null, newRole: null, currentRole: null, userName: null });
      
      // Show success toast
      showToast(`${userName}'s role has been updated successfully!`, 'success');
    } catch (error) {
      console.error("Failed to update role:", error);
      const errorMsg = error.response?.data?.msg || "Failed to update role. Please try again.";
      
      // Show error toast
      showToast(errorMsg, 'error');
      
      // Refresh users to revert the UI change if it failed
      fetchUsers();
      
      // Close modal
      setConfirmModal({ isOpen: false, userId: null, newRole: null, currentRole: null, userName: null });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCancelRoleChange = () => {
    // Close modal and revert dropdown
    setConfirmModal({ isOpen: false, userId: null, newRole: null, currentRole: null, userName: null });
    // Trigger a re-render to reset the dropdown
    setUsers([...users]);
  };

  const roles = [
    { value: "employee", label: "Employee" },
    { value: "hr", label: "HR" },
    { value: "payroll", label: "Payroll Officer" },
    { value: "admin", label: "Admin" },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#A24689] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-500">Loading users...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-[#A24689] text-white rounded-lg hover:bg-[#8a3a73] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage user roles and permissions</p>
      </div>

      {/* Settings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  User name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.employee_id || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value, user.role, user.name)}
                        disabled={updatingUserId === user.id}
                        className="px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all text-sm text-center appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          width: "180px",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        {roles.map((role) => (
                          <option 
                            key={role.value} 
                            value={role.value}
                            className="text-center py-2"
                          >
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelRoleChange}
        onConfirm={handleConfirmRoleChange}
        title="Confirm Role Change"
        message={confirmModal.userName && confirmModal.currentRole && confirmModal.newRole ? 
          `Are you sure you want to change ${confirmModal.userName}'s role from ${
            roles.find(r => r.value === confirmModal.currentRole)?.label
          } to ${
            roles.find(r => r.value === confirmModal.newRole)?.label
          }?\n\nThis will immediately affect their access permissions.` : 
          ''
        }
        confirmText="Change Role"
        cancelText="Cancel"
        isLoading={updatingUserId === confirmModal.userId}
      />

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </DashboardLayout>
  );
}

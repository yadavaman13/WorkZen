import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:5000/api/admin/users');
      // const data = await response.json();
      
      // Mock data for now
      const mockData = [
        {
          id: 1,
          username: "John Doe",
          loginId: "john.doe",
          email: "john@workzen.com",
          role: "employee",
        },
        {
          id: 2,
          username: "Jane Smith",
          loginId: "jane.smith",
          email: "jane@workzen.com",
          role: "hr",
        },
        {
          id: 3,
          username: "Admin User",
          loginId: "admin",
          email: "admin@workzen.com",
          role: "admin",
        },
      ];
      
      setUsers(mockData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // TODO: Implement API call to update role
      // await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ role: newRole })
      // });

      // Update local state
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, role: newRole };
          }
          return user;
        })
      );
      
      alert("User role updated successfully!");
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role");
    }
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
          <div className="text-gray-500">Loading users...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
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
                  Login id
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.loginId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 flex justify-center">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all text-sm text-center appearance-none bg-white"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
    </DashboardLayout>
  );
}

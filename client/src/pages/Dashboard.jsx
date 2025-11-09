// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import axios from "axios";

function EmployeeCard({ employee }) {
  // Function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'on leave':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all group">
      {/* Employee Avatar */}
      <div className="flex flex-col items-center">
        {/* Avatar Circle with Status Indicator */}
        <div className="relative mb-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: "#A24689" }}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {/* Status Dot */}
          <div className={`absolute bottom-0 right-0 w-5 h-5 ${getStatusColor(employee.status)} border-2 border-white rounded-full`}></div>
        </div>

        {/* Employee Info */}
        <div className="text-center w-full">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {employee.name}
          </h3>
          <p className="text-xs text-gray-500 mb-2">{employee.email}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-700">
              {employee.employee_id}
            </span>
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 capitalize">
              {employee.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const filterRef = useRef(null);
  const navigate = useNavigate();

  // Fetch employees from API
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/employees', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) || 
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employees</h1>
            <p className="text-sm text-gray-500">
              Manage your team and employee information
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/onboarding')}
            className="px-4 py-2.5 text-white text-sm font-medium rounded-lg hover:opacity-90 active:opacity-80 transition-all shadow-sm flex items-center gap-2"
            style={{ backgroundColor: "#A24689" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Employee
          </button>
        </div>

        {/* Search and Filter Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`px-4 py-2.5 border rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
                statusFilter !== "all"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Filter</span>
            </button>

            {/* Filter Dropdown */}
            {showFilter && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Status
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2.5 p-2.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="status"
                        value="all"
                        checked={statusFilter === "all"}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        All Status
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={statusFilter === "active"}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-4 h-4 focus:ring-2"
                        style={{ accentColor: "#A24689" }}
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={statusFilter === "inactive"}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-4 h-4 focus:ring-2"
                        style={{ accentColor: "#A24689" }}
                      />
                      <span className="text-sm text-gray-700">Inactive</span>
                    </label>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowFilter(false)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-all"
                      style={{ backgroundColor: "#A24689" }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#A24689" }}></div>
        </div>
      )}

      {/* Employee Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filteredEmployees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredEmployees.length === 0 && employees.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new employee.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/dashboard/onboarding')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white hover:opacity-90"
              style={{ backgroundColor: "#A24689" }}
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Employee
            </button>
          </div>
        </div>
      )}

      {/* No search results */}
      {!loading && filteredEmployees.length === 0 && employees.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No employees found matching "{searchQuery}". Try adjusting your search or filter.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}

// src/pages/Employees.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

function EmployeeCard({ employee, onClick }) {
  // Determine status indicator based on employee status
  const getStatusIndicator = () => {
    const status = employee.status?.toLowerCase() || "active";

    if (status === "on leave" || status === "leave") {
      // Airplane icon for on leave
      return (
        <div
          className="absolute top-3 right-3 bg-blue-100 p-1.5 rounded-full"
          title="On Leave"
        >
          <svg
            className="w-3.5 h-3.5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
      );
    } else if (status === "inactive" || status === "absent") {
      // Red dot for inactive/absent
      return (
        <div
          className="absolute top-3 right-3 w-3 h-3 bg-red-400 rounded-full border-2 border-white shadow-sm"
          title="Inactive"
        ></div>
      );
    } else {
      // Green dot for active (default)
      return (
        <div
          className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"
          title="Active"
        ></div>
      );
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all group cursor-pointer relative"
    >
      {/* Status Indicator */}
      {getStatusIndicator()}

      {/* Employee Avatar */}
      <div className="flex flex-col items-center">
        {/* Avatar Circle */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors bg-gray-100">
          <svg
            className="w-10 h-10 text-gray-600"
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

function EmployeeModal({ employee, onClose }) {
  if (!employee) return null;

  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            Employee Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-gray-100">
              <svg
                className="w-12 h-12 text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {employee.name ||
                `${employee.first_name} ${employee.last_name}` ||
                "N/A"}
            </h3>
            <p className="text-sm text-gray-500">
              {employee.email || "No email available"}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem
              label="Employee ID"
              value={employee.employee_id || "N/A"}
            />
            <DetailItem
              label="Company Name"
              value={employee.company_name || "N/A"}
            />
            <DetailItem label="Phone" value={employee.phone || "N/A"} />
            <DetailItem label="Role" value={employee.role || "N/A"} />
            <DetailItem label="Status" value={employee.status || "Active"} />
            <DetailItem
              label="Profile Completion"
              value={
                employee.profile_completion
                  ? `${employee.profile_completion}%`
                  : "N/A"
              }
            />
            <DetailItem
              label="Join Date"
              value={formatDate(employee.created_at)}
            />
          </div>

          {/* No Additional Info Message */}
          {!employee.company_name &&
            !employee.phone &&
            !employee.role &&
            !employee.created_at && (
              <div className="mt-6 text-center py-8">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">
                  No additional information available
                </p>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function Employees() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const filterRef = useRef(null);

  // Fetch employees from API
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/users/employees', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setEmployees(response.data.employees);
        console.log('✅ Fetched employees:', response.data.employees.length);
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      console.error('Error details:', error.response?.data);
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

    const empStatus = emp.status?.toLowerCase() || "active";
    const matchesStatus =
      statusFilter === "all" || empStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Header Section */}
      <div className="mb-4">
        {/* Title with Search and Filter on same line */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>

            {/* Search Bar with Filter */}
            <div className="w-80 relative" ref={filterRef}>
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
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                />
                {/* Filter Icon Button */}
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gray-100 transition-colors ${
                    statusFilter !== "all"
                      ? "text-gray-900 bg-gray-100"
                      : "text-gray-400"
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
                </button>
              </div>

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
                          className="w-4 h-4 text-gray-900 focus:ring-gray-900"
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
                          className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2 mx-0 mb-0">
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-md border border-gray-300 transition-colors bg-white"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowFilter(false)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Employee Button */}
            <button 
              onClick={() => navigate('/dashboard/onboarding')}
              className="px-6 py-2.5 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 brand-btn"
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

          {/* Placeholder for right side if needed */}
          <div></div>
        </div>

        {/* Quick Filter Cards */}
        <div className="flex items-center gap-3 mt-8">
          <span className="text-sm font-medium text-gray-600">
            Quick Filter:
          </span>
          <button
            onClick={() => setAttendanceFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              attendanceFilter === "all"
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setAttendanceFilter("present")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              attendanceFilter === "present"
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Present
          </button>
          <button
            onClick={() => setAttendanceFilter("on_leave")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              attendanceFilter === "on_leave"
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            On Leave
          </button>
          <button
            onClick={() => setAttendanceFilter("absent")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              attendanceFilter === "absent"
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            Absent
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Employee Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onClick={() => setSelectedEmployee(employee)}
            />
          ))}
        </div>
      )}

      {/* Empty state - No employees at all */}
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
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
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

      {/* Empty state - No search results */}
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
            No employees found matching your search criteria. Try adjusting your search or filter.
          </p>
        </div>
      )}

      {/* Employee Modal */}
      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </>
  );
}

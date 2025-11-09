// src/pages/Employees.jsx
import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import { employees } from "../data/hrms.js";

function EmployeeCard({ employee }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all group">
      {/* Employee Avatar */}
      <div className="flex flex-col items-center">
        {/* Avatar Circle */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors"
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

        {/* Employee Info */}
        <div className="text-center w-full">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-xs text-gray-500">{employee.email}</p>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = `${emp.first_name} ${emp.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesSearch;
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

        {/* Search Row */}
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
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A24689] focus:border-transparent transition-all placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {filteredEmployees.map((employee) => (
          <EmployeeCard key={employee.employee_id} employee={employee} />
        ))}
      </div>

      {/* Empty state */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No employees found matching "{searchQuery}"
        </div>
      )}
    </DashboardLayout>
  );
}

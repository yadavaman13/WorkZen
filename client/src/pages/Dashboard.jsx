// src/pages/Employees.jsx
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import { employees, departments } from "../data/hrms.js";

function EmployeeCard({ employee }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all group">
      {/* Employee Avatar */}
      <div className="flex flex-col items-center">
        {/* Avatar Circle */}
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
          <svg
            className="w-10 h-10 text-gray-400"
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
          <p className="text-xs text-gray-500 mb-3">
            {employee.email}
          </p>
          
          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              employee.status === 'active' 
                ? 'bg-gray-100 text-gray-700' 
                : 'bg-gray-50 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                employee.status === 'active' ? 'bg-gray-600' : 'bg-gray-400'
              }`}></span>
              {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
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
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const filterRef = useRef(null);

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
    const matchesSearch = `${emp.first_name} ${emp.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || emp.department_id === parseInt(departmentFilter);
    
    return matchesSearch && matchesDepartment;
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
          <button className="px-4 py-2.5 text-white text-sm font-medium rounded-lg hover:opacity-90 active:opacity-80 transition-all shadow-sm flex items-center gap-2" style={{ backgroundColor: '#A24689' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
                departmentFilter !== "all" 
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
              <span>
                Filter
              </span>
            </button>

            {/* Filter Dropdown */}
            {showFilter && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Department
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2.5 p-2.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="department"
                        value="all"
                        checked={departmentFilter === "all"}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700 font-medium">All Departments</span>
                    </label>
                    {departments.map((dept) => (
                      <label key={dept.department_id} className="flex items-center gap-2.5 p-2.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="department"
                          value={dept.department_id.toString()}
                          checked={departmentFilter === dept.department_id.toString()}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          className="w-4 h-4 focus:ring-2"
                          style={{ accentColor: '#A24689' }}
                        />
                        <span className="text-sm text-gray-700">{dept.department_name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => {
                        setDepartmentFilter("all");
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowFilter(false)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-all"
                      style={{ backgroundColor: '#A24689' }}
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
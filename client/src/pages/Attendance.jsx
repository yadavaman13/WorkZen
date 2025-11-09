import { useState, useMemo } from "react";
import { employees, departments, roles } from "../data/hrms.js";
import { useAuth } from "../context/AuthProvider";

export default function Attendance() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 22));
  const [selectedView, setSelectedView] = useState("monthly");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Helper function to get employee details
  const getEmployeeDetails = (employeeId) => {
    const employee = employees.find((e) => e.employee_id === employeeId);
    if (!employee)
      return { name: "Unknown", jobTitle: "N/A", department: "N/A" };

    const department = departments.find(
      (d) => d.department_id === employee.department_id
    );
    const role = roles.find((r) => r.role_id === employee.role_id);

    return {
      employeeId: employee.employee_id,
      name: `${employee.first_name} ${employee.last_name}`,
      jobTitle: role?.role_name || "N/A",
      department: department?.department_name || "N/A",
      email: employee.email,
    };
  };

  // Enhanced attendance data with status, late flags, and department info
  const attendanceRecords = [
    {
      employee_id: 1,
      date: "22/10/2025",
      checkIn: "10:00",
      checkOut: "19:00",
      workHours: "09:00",
      extraHours: "01:00",
      status: "present",
      isLate: true,
      lateBy: "30 mins",
      location: "Office",
    },
    {
      employee_id: 2,
      date: "22/10/2025",
      checkIn: "09:30",
      checkOut: "18:30",
      workHours: "09:00",
      extraHours: "00:00",
      status: "present",
      isLate: false,
      location: "Office",
    },
    {
      employee_id: 3,
      date: "22/10/2025",
      checkIn: "09:00",
      checkOut: "18:00",
      workHours: "09:00",
      extraHours: "00:00",
      status: "present",
      isLate: false,
      location: "Office",
    },
    {
      employee_id: 1,
      date: "23/10/2025",
      checkIn: "10:00",
      checkOut: "19:00",
      workHours: "09:00",
      extraHours: "01:00",
      status: "present",
      isLate: true,
      lateBy: "30 mins",
      location: "Remote",
    },
    {
      employee_id: 5,
      date: "22/10/2025",
      checkIn: "09:15",
      checkOut: "18:45",
      workHours: "09:30",
      extraHours: "00:30",
      status: "present",
      isLate: false,
      location: "Office",
    },
    {
      employee_id: 7,
      date: "22/10/2025",
      checkIn: "-",
      checkOut: "-",
      workHours: "00:00",
      extraHours: "00:00",
      status: "absent",
      isLate: false,
      location: "-",
    },
    {
      employee_id: 2,
      date: "23/10/2025",
      checkIn: "09:00",
      checkOut: "14:00",
      workHours: "05:00",
      extraHours: "00:00",
      status: "half_day",
      isLate: false,
      location: "Office",
    },
  ];

  // Filter and search functionality
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      const empDetails = getEmployeeDetails(record.employee_id);

      // Department filter
      if (
        filterDepartment !== "all" &&
        empDetails.department !== filterDepartment
      ) {
        return false;
      }

      // Status filter
      if (filterStatus !== "all" && record.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          empDetails.name.toLowerCase().includes(searchLower) ||
          empDetails.employeeId.toString().includes(searchLower) ||
          empDetails.email.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [filterDepartment, filterStatus, searchQuery]);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const uniqueEmployees = new Set(filteredRecords.map((r) => r.employee_id))
      .size;
    const present = filteredRecords.filter(
      (r) => r.status === "present"
    ).length;
    const absent = filteredRecords.filter((r) => r.status === "absent").length;
    const halfDay = filteredRecords.filter(
      (r) => r.status === "half_day"
    ).length;
    const late = filteredRecords.filter((r) => r.isLate).length;
    const onTime = filteredRecords.filter(
      (r) => r.status === "present" && !r.isLate
    ).length;

    return {
      total: filteredRecords.length,
      uniqueEmployees,
      present,
      absent,
      halfDay,
      late,
      onTime,
      attendanceRate:
        filteredRecords.length > 0
          ? (
              ((present + halfDay * 0.5) / filteredRecords.length) *
              100
            ).toFixed(1)
          : 0,
    };
  }, [filteredRecords]);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      half_day: "bg-yellow-100 text-yellow-800",
      on_leave: "bg-blue-100 text-blue-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const handleCheckIn = () => {
    setShowCheckInModal(true);
  };

  const handleExport = () => {
    alert("Export functionality will be implemented");
  };

  return (
    <div className="-m-6 p-6">
      {/* Header with Actions */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <div className="flex gap-2">
            <button
              onClick={handleCheckIn}
              className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-sm brand-btn"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Check In/Out
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Attendance Rate Card */}
        <div className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Attendance Rate
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.attendanceRate}%
              </p>
            </div>
            <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#A24689] h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.attendanceRate}%` }}
            ></div>
          </div>
        </div>

        {/* Present Today Card */}
        <div className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Present Today
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.present}
              </p>
            </div>
            <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-600"
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
            </div>
          </div>
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-700">{stats.onTime}</span>{" "}
            on time arrivals
          </p>
        </div>

        {/* Late Arrivals Card */}
        <div className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Late Arrivals
              </p>
              <p className="text-3xl font-bold text-gray-900">{stats.late}</p>
            </div>
            <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-600">Requires attention</p>
        </div>

        {/* Absent Card */}
        <div className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Absent
              </p>
              <p className="text-3xl font-bold text-gray-900">{stats.absent}</p>
            </div>
            <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-700">{stats.halfDay}</span>{" "}
            half day leaves
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A24689] focus:border-transparent"
                />
              </div>
            </div>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A24689] font-medium text-gray-700"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_name}>
                  {dept.department_name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A24689] font-medium text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="on_leave">On Leave</option>
            </select>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setSelectedView("daily")}
                className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                  selectedView === "daily"
                    ? "bg-[#A24689] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSelectedView("weekly")}
                className={`px-4 py-2.5 text-xs font-medium border-x border-gray-300 transition-colors ${
                  selectedView === "weekly"
                    ? "bg-[#A24689] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSelectedView("monthly")}
                className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                  selectedView === "monthly"
                    ? "bg-[#A24689] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate("prev")}
                className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="px-4 py-2.5 bg-gray-700 text-white rounded-lg text-xs font-semibold min-w-[160px] text-center">
                {formatDate(currentDate)}
              </div>
              <button
                onClick={() => navigateDate("next")}
                className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-600">
              Showing{" "}
              <span className="text-gray-900 font-bold">
                {filteredRecords.length}
              </span>{" "}
              of{" "}
              <span className="text-gray-900 font-bold">
                {attendanceRecords.length}
              </span>{" "}
              records
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Present</span>
              <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div>
              <span className="text-xs text-gray-600">Absent</span>
              <div className="w-2 h-2 bg-yellow-500 rounded-full ml-2"></div>
              <span className="text-xs text-gray-600">Late</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Work Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <svg
                      className="mx-auto h-10 w-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="mt-2 text-sm">No attendance records found</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const employeeDetails = getEmployeeDetails(
                    record.employee_id
                  );
                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">
                            EMP-{String(record.employee_id).padStart(3, "0")}
                          </span>
                          {record.isLate && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800"
                              title={`Late by ${record.lateBy}`}
                            >
                              Late
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold mr-3">
                            {employeeDetails.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {employeeDetails.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {employeeDetails.jobTitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {employeeDetails.department}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(
                            record.status
                          )}`}
                        >
                          {record.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.checkIn}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.checkOut}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="text-gray-900 font-semibold">
                          {record.workHours}
                        </div>
                        {record.extraHours !== "00:00" && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            +{record.extraHours} OT
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          {record.location === "Remote" ? (
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          )}
                          <span className="text-xs">{record.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-700">
            Showing <span className="font-bold text-gray-900">1</span> to{" "}
            <span className="font-bold text-gray-900">
              {filteredRecords.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-900">
              {attendanceRecords.length}
            </span>{" "}
            results
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1.5 bg-[#A24689] text-white rounded-lg text-xs font-semibold">
              1
            </button>
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Check In/Out Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Check In/Out</h3>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-1">
                Current Time
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date().toLocaleTimeString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 brand-btn">
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Check In
              </button>
              <button className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2">
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
    if (!employee) return { name: "Unknown", jobTitle: "N/A", department: "N/A" };

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
      if (filterDepartment !== "all" && empDetails.department !== filterDepartment) {
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
    const uniqueEmployees = new Set(filteredRecords.map(r => r.employee_id)).size;
    const present = filteredRecords.filter(r => r.status === "present").length;
    const absent = filteredRecords.filter(r => r.status === "absent").length;
    const halfDay = filteredRecords.filter(r => r.status === "half_day").length;
    const late = filteredRecords.filter(r => r.isLate).length;
    const onTime = filteredRecords.filter(r => r.status === "present" && !r.isLate).length;
    
    return {
      total: filteredRecords.length,
      uniqueEmployees,
      present,
      absent,
      halfDay,
      late,
      onTime,
      attendanceRate: filteredRecords.length > 0 
        ? ((present + halfDay * 0.5) / filteredRecords.length * 100).toFixed(1) 
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 -m-6 p-6">
      {/* Header with Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
            <p className="text-gray-600">Track and manage employee attendance with real-time insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              className="px-6 py-3 bg-gradient-to-r from-[#A24689] to-[#8a3a73] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check In/Out
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-white border-2 border-[#A24689] text-[#A24689] rounded-xl hover:bg-[#A24689] hover:text-white transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Attendance Rate Card */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#A24689] to-[#8a3a73] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Attendance Rate</p>
          <p className="text-3xl font-bold text-gray-900">{stats.attendanceRate}%</p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-[#A24689] to-[#8a3a73] h-2 rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
          </div>
        </div>

        {/* Present Today Card */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Present Today</p>
          <p className="text-3xl font-bold text-gray-900">{stats.present}</p>
          <p className="text-sm text-emerald-600 mt-2 font-medium">On time: {stats.onTime}</p>
        </div>

        {/* Late Arrivals Card */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Late Arrivals</p>
          <p className="text-3xl font-bold text-gray-900">{stats.late}</p>
          <p className="text-sm text-amber-600 mt-2 font-medium">Requires attention</p>
        </div>

        {/* Absent Card */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Absent</p>
          <p className="text-3xl font-bold text-gray-900">{stats.absent}</p>
          <p className="text-sm text-rose-600 mt-2 font-medium">Half day: {stats.halfDay}</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A24689]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A24689] focus:ring-2 focus:ring-[#A24689]/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-5 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#A24689] focus:ring-2 focus:ring-[#A24689]/20 transition-all duration-200 font-medium text-gray-700"
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
              className="px-5 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#A24689] focus:ring-2 focus:ring-[#A24689]/20 transition-all duration-200 font-medium text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="on_leave">On Leave</option>
            </select>

            {/* View Toggle */}
            <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setSelectedView("daily")}
                className={`px-5 py-3 text-sm font-medium transition-all duration-200 ${selectedView === "daily" ? "bg-gradient-to-r from-[#A24689] to-[#8a3a73] text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Daily
              </button>
              <button
                onClick={() => setSelectedView("weekly")}
                className={`px-5 py-3 text-sm font-medium border-x-2 border-gray-200 transition-all duration-200 ${selectedView === "weekly" ? "bg-gradient-to-r from-[#A24689] to-[#8a3a73] text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSelectedView("monthly")}
                className={`px-5 py-3 text-sm font-medium transition-all duration-200 ${selectedView === "monthly" ? "bg-gradient-to-r from-[#A24689] to-[#8a3a73] text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Monthly
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateDate("prev")}
                className="p-3 border-2 border-gray-200 rounded-xl hover:border-[#A24689] hover:bg-[#A24689]/5 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-[#A24689]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="px-6 py-3 bg-gradient-to-r from-[#A24689] to-[#8a3a73] text-white rounded-xl text-sm font-semibold shadow-md min-w-[180px] text-center">
                {formatDate(currentDate)}
              </div>
              <button
                onClick={() => navigateDate("next")}
                className="p-3 border-2 border-gray-200 rounded-xl hover:border-[#A24689] hover:bg-[#A24689]/5 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-[#A24689]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">
              Showing <span className="text-[#A24689] font-bold">{filteredRecords.length}</span> of <span className="text-gray-900 font-bold">{attendanceRecords.length}</span> records
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Present</span>
              <div className="w-2 h-2 bg-rose-500 rounded-full ml-3"></div>
              <span className="text-xs text-gray-600">Absent</span>
              <div className="w-2 h-2 bg-amber-500 rounded-full ml-3"></div>
              <span className="text-xs text-gray-600">Late</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-[#A24689]/10 to-[#8a3a73]/10 border-b-2 border-[#A24689]/20">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Work Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#A24689] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 text-sm">No attendance records found</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const employeeDetails = getEmployeeDetails(record.employee_id);
                  return (
                    <tr key={index} className="hover:bg-[#A24689]/5 transition-all duration-150 border-b border-gray-100">
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">EMP-{String(record.employee_id).padStart(3, "0")}</span>
                          {record.isLate && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200" title={`Late by ${record.lateBy}`}>
                              Late
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#A24689] to-[#8a3a73] flex items-center justify-center text-white text-sm font-bold mr-3 shadow-md">
                            {employeeDetails.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{employeeDetails.name}</div>
                            <div className="text-xs text-gray-500 font-medium">{employeeDetails.jobTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-700">
                        {employeeDetails.department}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusBadge(record.status)}`}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.checkIn}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.checkOut}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <div className="text-gray-900 font-bold">{record.workHours}</div>
                        {record.extraHours !== "00:00" && (
                          <div className="text-xs font-semibold text-emerald-600 mt-1">+{record.extraHours} OT</div>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          {record.location === "Remote" ? (
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-[#A24689]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                          <span>{record.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button className="p-2 text-[#A24689] hover:bg-[#A24689]/10 rounded-lg transition-all duration-200" title="View Details">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200" title="Edit">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-t-2 border-gray-100 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            Showing <span className="font-bold text-[#A24689]">1</span> to <span className="font-bold text-[#A24689]">{filteredRecords.length}</span> of{" "}
            <span className="font-bold text-gray-900">{attendanceRecords.length}</span> results
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#A24689] hover:text-[#A24689] transition-all duration-200">
              Previous
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-[#A24689] to-[#8a3a73] text-white rounded-xl text-sm font-semibold shadow-md">
              1
            </button>
            <button className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#A24689] hover:text-[#A24689] transition-all duration-200">
              2
            </button>
            <button className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#A24689] hover:text-[#A24689] transition-all duration-200">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Check In/Out Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Check In/Out</h3>
              <button onClick={() => setShowCheckInModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gradient-to-r from-[#A24689]/10 to-[#8a3a73]/10 rounded-xl p-4 mb-6 border-2 border-[#A24689]/20">
              <p className="text-sm font-medium text-gray-600 mb-1">Current Time</p>
              <p className="text-3xl font-bold text-[#A24689]">{new Date().toLocaleTimeString()}</p>
              <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Check In
              </button>
              <button className="flex-1 px-6 py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

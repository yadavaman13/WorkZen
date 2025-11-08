import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function Attendance() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 22)); // October 22, 2025
  const [selectedView, setSelectedView] = useState("Oct");

  // Sample attendance data
  const attendanceRecords = [
    {
      date: "22/10/2025",
      checkIn: "10:00",
      checkOut: "19:00",
      workHours: "09:00",
      extraHours: "01:00",
    },
    {
      date: "23/10/2025",
      checkIn: "10:00",
      checkOut: "19:00",
      workHours: "09:00",
      extraHours: "01:00",
    },
  ];

  // Calculate stats
  const totalDaysPresent = attendanceRecords.length;
  const totalWorkingDays = 22; // Example for the month

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

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            For Employees
          </h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button className="px-6 py-4 text-sm font-medium text-white bg-blue-500 border-b-2 border-blue-500">
                Attendance
              </button>
              <button className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Time Off
              </button>
              <button className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Payroll
              </button>
              <button className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Reports
              </button>
              <button className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Settings
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate("prev")}
                  className="p-2 border border-gray-300 rounded hover:bg-white hover:border-gray-400 transition-colors"
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
                <button
                  onClick={() => navigateDate("next")}
                  className="p-2 border border-gray-300 rounded hover:bg-white hover:border-gray-400 transition-colors"
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

                {/* View Selector */}
                <select
                  value={selectedView}
                  onChange={(e) => setSelectedView(e.target.value)}
                  className="ml-2 px-3 py-2 border border-gray-300 rounded bg-white text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Oct">Oct</option>
                  <option value="Nov">Nov</option>
                  <option value="Dec">Dec</option>
                </select>

                {/* Current Date Display */}
                <div className="ml-4 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700">
                  {formatDate(currentDate)}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="text-gray-600">Count of days present: </span>
                  <span className="font-semibold text-gray-900">
                    {totalDaysPresent}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Leave count: </span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Total working days: </span>
                  <span className="font-semibold text-gray-900">
                    {totalWorkingDays}
                  </span>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Work Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Extra hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkIn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.workHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.extraHours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

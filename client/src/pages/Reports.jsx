import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";

export default function Reports() {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showError, setShowError] = useState(false);

  // Sample employee data - replace with API call later
  const employees = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Michael Johnson" },
    { id: 4, name: "Sarah Williams" },
  ];

  // Generate years from 2020 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);

  const handlePrint = () => {
    if (!selectedEmployee || !selectedYear) {
      setShowError(true);
      // Hide error message after 3 seconds
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    setShowError(false);
    // TODO: Implement print functionality
    console.log("Printing report for:", selectedEmployee, selectedYear);
    alert(`Generating Salary Statement Report for ${selectedEmployee} - ${selectedYear}`);
  };

  const isFormValid = selectedEmployee && selectedYear;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-left">Reports</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {/* Report Header */}
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-xl font-semibold text-gray-900 text-center">
              Salary Statement Report
            </h2>
          </div>

          {/* Form Fields */}
          <div className="px-8 py-8 space-y-6">
            {/* Employee Name Dropdown */}
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Employee Name :
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full max-w-md px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all bg-white appearance-none bg-no-repeat bg-right"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: '1.5rem',
                  backgroundPosition: 'right 0.75rem center',
                }}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full max-w-md px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all bg-white appearance-none bg-no-repeat bg-right"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: '1.5rem',
                  backgroundPosition: 'right 0.75rem center',
                }}
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Print Button */}
            <div className="flex flex-col items-center mt-6">
              <div className="relative">
                <button
                  onClick={handlePrint}
                  className={`px-8 py-2.5 rounded-lg transition-all font-medium ${
                    isFormValid
                      ? "text-white hover:opacity-90"
                      : "bg-gray-300 text-gray-500"
                  }`}
                  style={
                    isFormValid
                      ? { backgroundColor: "#A24689" }
                      : {}
                  }
                >
                  Print
                </button>

                {/* Error Message */}
                {showError && (
                  <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-4 py-2 bg-red-50 border border-red-200 rounded-lg shadow-md">
                    <p className="text-sm text-red-600">
                      Please select the Employee and Year
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-6 px-4">
          <p className="text-sm text-gray-600 text-center">
            To print the Salary Statement report, select the employee and the year for which you want to generate the report.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

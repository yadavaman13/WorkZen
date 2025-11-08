import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";

export default function Payroll() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMonth, setSelectedMonth] = useState("Oct 2025");
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showPayrunSubTab, setShowPayrunSubTab] = useState("payrun");
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showPayslipDetail, setShowPayslipDetail] = useState(false);
  const [payslipDetailTab, setPayslipDetailTab] = useState("workedDays");

  // Sample payroll data
  const payrollData = {
    month: "Oct 2025",
    totalEmployerCost: "₹ 50,000",
    totalGross: "₹ 50,000",
    totalNet: "₹ 43,800.00",
  };

  // Sample employee payroll records
  const employeePayrolls = [
    {
      id: 1,
      employee: "John Doe",
      payPeriod: "[Oct 2025][Employee]",
      payrun: "Payrun Oct 2025",
      salaryStructure: "Regular Pay",
      period: "01 Oct To 31 Oct",
      employerCost: "₹ 50,000",
      basicWage: "₹ 25,000",
      grossWage: "₹ 50,000",
      netWage: "₹ 43,800.00",
      status: "Done",
      workedDays: {
        attendance: { days: 20, amount: "₹ 45833.333326" },
        paidTimeOff: { days: 2, amount: "₹ 4166.666666" },
        total: { days: 22, amount: "₹ 50000.00" },
      },
      salaryComputation: {
        gross: [
          { ruleName: "Basic Salary", rate: 100, amount: "₹ 25000.00" },
          { ruleName: "House Rent Allowance", rate: 100, amount: "₹ 12500.00" },
          { ruleName: "Standard Allowance", rate: 100, amount: "₹ 4167.00" },
          { ruleName: "Performance Bonus", rate: 100, amount: "₹ 2082.50" },
          { ruleName: "Leave Travel Allowance", rate: 100, amount: "₹ 2082.50" },
          { ruleName: "Fixed Allowance", rate: 100, amount: "₹ 4168.00" },
        ],
        grossTotal: { rate: 100, amount: "₹ 50000.00" },
        deductions: [
          { ruleName: "PF Employee", rate: 100, amount: "- ₹ 3000.00" },
          { ruleName: "PF Employer", rate: 100, amount: "- ₹ 3000.00" },
          { ruleName: "Professional Tax", rate: 100, amount: "- ₹ 200.00" },
        ],
        netAmount: { rate: 100, amount: "₹ 43800.00" },
      },
    },
  ];

  const handleViewPayslip = (payroll) => {
    setSelectedPayslip(payroll);
    setShowPayslipDetail(true);
  };

  const handleBackToPayrun = () => {
    setShowPayslipDetail(false);
    setSelectedPayslip(null);
  };

  const handleNewPayslip = () => {
    alert("New Payslip functionality will be implemented");
  };

  const handleCompute = () => {
    if (selectedPayslip) {
      alert("Computing payslip...");
    }
  };

  const handleValidatePayslip = () => {
    if (selectedPayslip) {
      alert("Validating payslip...");
    }
  };

  const handleCancelPayslip = () => {
    if (selectedPayslip) {
      alert("Cancelling payslip...");
    }
  };

  const handlePrintPayslip = () => {
    if (selectedPayslip) {
      alert("Printing payslip...");
      // TODO: Implement actual print functionality
    }
  };

  const handleValidate = () => {
    setShowValidateModal(true);
  };

  const handleConfirmValidate = () => {
    // TODO: Implement validation logic
    alert("Payroll validated successfully!");
    setShowValidateModal(false);
  };

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-3 px-1 font-medium transition-all ${
              activeTab === "dashboard"
                ? "border-b-2 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={
              activeTab === "dashboard" ? { borderBottomColor: "#A24689" } : {}
            }
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("payrun")}
            className={`pb-3 px-1 font-medium transition-all ${
              activeTab === "payrun"
                ? "border-b-2 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={
              activeTab === "payrun" ? { borderBottomColor: "#A24689" } : {}
            }
          >
            Payrun
          </button>
        </div>
      </div>

      {/* Dashboard Tab Content */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm text-gray-700">
              The Payroll Dashboard contains warnings, pay run information, and statistics related to employee and employer costs.
            </p>
          </div>

          {/* Warning and Payrun Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warning Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Warning
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      1 Employee without Bank A/c
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      1 Employee without Manager
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payrun Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payrun
              </h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <p className="text-sm font-medium text-purple-900">
                    Payrun for Oct 2025 (3 Payslip)
                  </p>
                </a>
                <a
                  href="#"
                  className="block p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <p className="text-sm font-medium text-purple-900">
                    Payrun for Sept 2025 (3 Payslip)
                  </p>
                </a>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employer Cost Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Employer cost
                </h3>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md">
                    Annually
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md">
                    Monthly
                  </button>
                </div>
              </div>
              <div className="h-64 flex items-end justify-around gap-4">
                {["Jan 2025", "Feb 2025", "Mar 2025"].map((month, index) => (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-linear-to-t from-blue-300 to-blue-100 rounded-t-lg" style={{ height: `${(index + 1) * 30}%` }}></div>
                    <p className="text-xs text-gray-600 mt-2">{month}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Employee Count Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Employee Count
                </h3>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md">
                    Annually
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md">
                    Monthly
                  </button>
                </div>
              </div>
              <div className="h-64 flex items-end justify-around gap-4">
                {["Jan 2025", "Feb 2025", "Mar 2025"].map((month, index) => (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-linear-to-t from-blue-400 to-blue-200 rounded-t-lg" style={{ height: `${(index + 1) * 35}%` }}></div>
                    <p className="text-xs text-gray-600 mt-2">{month}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payrun Tab Content */}
      {activeTab === "payrun" && (
        <div className="space-y-6">
          {/* Show Payslip Detail View */}
          {showPayslipDetail && selectedPayslip ? (
            <div className="space-y-6">
              {/* Back Button and Header */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToPayrun}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="font-medium">Go Back</span>
                </button>
              </div>

              {/* Employee Name Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">[Employee]</h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleNewPayslip}
                  className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#A24689" }}
                >
                  New Payslip
                </button>
                <button
                  onClick={handleCompute}
                  className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#A24689" }}
                >
                  Compute
                </button>
                <button
                  onClick={handleValidatePayslip}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Validate
                </button>
                <button
                  onClick={handleCancelPayslip}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrintPayslip}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Print
                </button>
              </div>

              {/* Employee Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payrun
                  </label>
                  <p className="text-blue-600 text-sm">{selectedPayslip.payrun}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Structure
                  </label>
                  <p className="text-blue-600 text-sm">{selectedPayslip.salaryStructure}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period
                  </label>
                  <p className="text-sm text-gray-900">{selectedPayslip.period}</p>
                </div>
              </div>

              {/* Tabs for Worked Days and Salary Computation */}
              <div className="border-b border-gray-200">
                <div className="flex gap-6">
                  <button
                    onClick={() => setPayslipDetailTab("workedDays")}
                    className={`pb-3 px-1 font-medium transition-all ${
                      payslipDetailTab === "workedDays"
                        ? "border-b-2 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    style={
                      payslipDetailTab === "workedDays" ? { borderBottomColor: "#A24689" } : {}
                    }
                  >
                    Worked Days
                  </button>
                  <button
                    onClick={() => setPayslipDetailTab("salaryComputation")}
                    className={`pb-3 px-1 font-medium transition-all ${
                      payslipDetailTab === "salaryComputation"
                        ? "border-b-2 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    style={
                      payslipDetailTab === "salaryComputation" ? { borderBottomColor: "#A24689" } : {}
                    }
                  >
                    Salary Computation
                  </button>
                </div>
              </div>

              {/* Worked Days Tab Content */}
              {payslipDetailTab === "workedDays" && (
                <div>
                  {/* Salary Computation Header */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Salary Computation</h4>
                  </div>

                  {/* Worked Days Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                            Type
                          </th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 border-b border-gray-200">
                            Days
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 border-b border-gray-200">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Attendance</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">
                            {selectedPayslip.workedDays.attendance.days}.00 (5 working days in week)
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">
                            {selectedPayslip.workedDays.attendance.amount}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-900">Paid Time off</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">
                            {selectedPayslip.workedDays.paidTimeOff.days}.00 (2 Paid leaves/Month)
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">
                            {selectedPayslip.workedDays.paidTimeOff.amount}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-6 py-4 text-sm text-gray-900"></td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">
                            {selectedPayslip.workedDays.total.days}.00
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">
                            {selectedPayslip.workedDays.total.amount}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Salary Computation Note */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      Salary is calculated based on the employee's monthly attendance. Paid leaves are included in the total payable days, while unpaid leaves are deducted from the salary.
                    </p>
                  </div>
                </div>
              )}

              {/* Salary Computation Tab Content */}
              {payslipDetailTab === "salaryComputation" && (
                <div>
                  {/* Salary Computation Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                            Rule Name
                          </th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 border-b border-gray-200">
                            Rate %
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 border-b border-gray-200">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Gross Section */}
                        {selectedPayslip.salaryComputation.gross.map((item, index) => (
                          <tr key={`gross-${index}`}>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.ruleName}</td>
                            <td className="px-6 py-4 text-center text-sm text-gray-900">{item.rate}</td>
                            <td className="px-6 py-4 text-right text-sm text-gray-900">{item.amount}</td>
                          </tr>
                        ))}
                        {/* Gross Total */}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-6 py-4 text-sm text-gray-900">Gross</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">
                            {selectedPayslip.salaryComputation.grossTotal.rate}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900 relative">
                            {selectedPayslip.salaryComputation.grossTotal.amount}
                            <span className="absolute -right-16 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                              Gross
                            </span>
                          </td>
                        </tr>
                        {/* Deductions Section */}
                        {selectedPayslip.salaryComputation.deductions.map((item, index) => (
                          <tr key={`deduction-${index}`}>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.ruleName}</td>
                            <td className="px-6 py-4 text-center text-sm text-gray-900">{item.rate}</td>
                            <td className="px-6 py-4 text-right text-sm text-gray-900">{item.amount}</td>
                          </tr>
                        ))}
                        {/* Net Amount */}
                        <tr className="bg-gray-100 font-bold">
                          <td className="px-6 py-4 text-sm text-gray-900">Net Amount</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">
                            {selectedPayslip.salaryComputation.netAmount.rate}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900 relative">
                            {selectedPayslip.salaryComputation.netAmount.amount}
                            <span className="absolute -right-24 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                              Deductions
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Show Payrun List View */
            <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <p className="text-sm text-gray-700">
              The payslip of an individual employee is generated on the basis of attendance of that employee in a particular month.
            </p>
          </div>

          {/* Payrun Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Payrun {payrollData.month}
                  </h2>
                  <div className="flex items-center gap-6 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Employer Cost</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {payrollData.totalEmployerCost}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Gross</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {payrollData.totalGross}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Net</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {payrollData.totalNet}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  className="px-6 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Payroll Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                      Pay Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                      Employer Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                      Basic Wage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                      Gross Wage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                      Net Wage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {employeePayrolls.map((payroll) => (
                    <tr
                      key={payroll.id}
                      onClick={() => handleViewPayslip(payroll)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payroll.payPeriod}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payroll.employee}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payroll.employerCost}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payroll.basicWage}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payroll.grossWage}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payroll.netWage}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {payroll.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Information Footer */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Employer cost</span> represents the employee's monthly wage
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Basic wage</span> refers to the employee's basic salary
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Gross wage</span> is the total of the basic salary + all allowances
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Net wage</span> is the total of gross - deductions
            </p>
          </div>
            </div>
          )}
        </div>
      )}

      {/* Validate Confirmation Modal */}
      {showValidateModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          onClick={() => setShowValidateModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Validation
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to validate the payroll for {payrollData.month}? This action will finalize all payslips.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowValidateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmValidate}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  style={{ backgroundColor: "#A24689" }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

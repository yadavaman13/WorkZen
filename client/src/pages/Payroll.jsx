import { useState, useEffect } from "react";
import api from "../api/axios";
import Toast from "../components/Toast";

export default function Payroll() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMonth, setSelectedMonth] = useState("Oct 2025");
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showPayrunSubTab, setShowPayrunSubTab] = useState("payrun");
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showPayslipDetail, setShowPayslipDetail] = useState(false);
  const [payslipDetailTab, setPayslipDetailTab] = useState("workedDays");
  
  // Backend data states
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [payrunDetails, setPayrunDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Fetch payrun details when switching to payrun tab
  useEffect(() => {
    if (activeTab === "payrun" && dashboardData?.recentPayruns?.length > 0) {
      // Auto-select the first payrun
      const firstPayrun = dashboardData.recentPayruns[0];
      fetchPayrunDetails(firstPayrun.id);
    }
  }, [activeTab, dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payroll/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrunDetails = async (payrunId) => {
    try {
      setLoading(true);
      const response = await api.get(`/payroll/payruns/${payrunId}`);
      if (response.data.success) {
        setPayrunDetails(response.data.data);
        setSelectedPayrun(payrunId);
      }
    } catch (error) {
      console.error('Error fetching payrun details:', error);
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch payrun details'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslipDetails = async (payslipId) => {
    try {
      setLoading(true);
      const response = await api.get(`/payroll/payslips/${payslipId}`);
      if (response.data.success) {
        const payslip = response.data.data;
        
        // Transform backend data to match frontend structure
        const transformedPayslip = {
          id: payslip.id,
          employee: payslip.employee_name,
          payPeriod: `[${getMonthName(payslip.month)} ${payslip.year}][Employee]`,
          payrun: `Payrun ${getMonthName(payslip.month)} ${payslip.year}`,
          salaryStructure: "Regular Pay",
          period: `${formatDate(payslip.period_start)} To ${formatDate(payslip.period_end)}`,
          employerCost: `₹ ${parseFloat(payslip.gross).toFixed(2)}`,
          basicWage: `₹ ${(payslip.components?.find(c => c.component === 'Basic Salary')?.amount || 0).toFixed(2)}`,
          grossWage: `₹ ${parseFloat(payslip.gross).toFixed(2)}`,
          netWage: `₹ ${parseFloat(payslip.net).toFixed(2)}`,
          status: payslip.status === 'validated' ? 'Done' : payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1),
          workedDays: {
            attendance: {
              days: payslip.attendance_data?.presentDays || 0,
              amount: `₹ ${((payslip.gross / payslip.attendance_data?.totalDays) * payslip.attendance_data?.presentDays || 0).toFixed(2)}`
            },
            paidTimeOff: {
              days: payslip.attendance_data?.paidLeaveDays || 0,
              amount: `₹ ${((payslip.gross / payslip.attendance_data?.totalDays) * payslip.attendance_data?.paidLeaveDays || 0).toFixed(2)}`
            },
            total: {
              days: payslip.attendance_data?.workedDays || 0,
              amount: `₹ ${parseFloat(payslip.gross).toFixed(2)}`
            }
          },
          salaryComputation: {
            gross: (payslip.components || []).map(comp => ({
              ruleName: comp.component,
              rate: 100,
              amount: `₹ ${parseFloat(comp.amount).toFixed(2)}`
            })),
            grossTotal: {
              rate: 100,
              amount: `₹ ${parseFloat(payslip.gross).toFixed(2)}`
            },
            deductions: (payslip.deductions || []).map(ded => ({
              ruleName: ded.component,
              rate: 100,
              amount: `- ₹ ${parseFloat(ded.amount).toFixed(2)}`
            })),
            netAmount: {
              rate: 100,
              amount: `₹ ${parseFloat(payslip.net).toFixed(2)}`
            }
          }
        };
        
        setSelectedPayslip(transformedPayslip);
        setShowPayslipDetail(true);
      }
    } catch (error) {
      console.error('Error fetching payslip details:', error);
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch payslip details'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || '';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = getMonthName(date.getMonth() + 1);
    return `${day} ${month}`;
  };

  // Sample payroll data (for backward compatibility)
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
    // If payroll has an id (from backend), fetch detailed data
    if (payroll.id && !payroll.salaryComputation) {
      fetchPayslipDetails(payroll.id);
    } else {
      setSelectedPayslip(payroll);
      setShowPayslipDetail(true);
    }
  };

  const handleBackToPayrun = () => {
    setShowPayslipDetail(false);
    setSelectedPayslip(null);
  };

  const handleNewPayslip = () => {
    setToast({
      type: 'info',
      message: 'New Payslip functionality will be implemented'
    });
  };

  const handleCompute = async () => {
    if (selectedPayslip && selectedPayslip.id) {
      try {
        setLoading(true);
        const response = await api.post(`/payroll/payslips/${selectedPayslip.id}/compute`);
        if (response.data.success) {
          setToast({
            type: 'success',
            message: 'Payslip computed successfully'
          });
          // Refresh payslip details
          fetchPayslipDetails(selectedPayslip.id);
        }
      } catch (error) {
        console.error('Error computing payslip:', error);
        setToast({
          type: 'error',
          message: error.response?.data?.message || 'Failed to compute payslip'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleValidatePayslip = async () => {
    if (selectedPayslip && selectedPayslip.id) {
      try {
        setLoading(true);
        const response = await api.post(`/payroll/payslips/${selectedPayslip.id}/validate`);
        if (response.data.success) {
          setToast({
            type: 'success',
            message: 'Payslip validated successfully'
          });
          // Refresh payslip details
          fetchPayslipDetails(selectedPayslip.id);
        }
      } catch (error) {
        console.error('Error validating payslip:', error);
        setToast({
          type: 'error',
          message: error.response?.data?.message || 'Failed to validate payslip'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelPayslip = async () => {
    if (selectedPayslip && selectedPayslip.id) {
      try {
        setLoading(true);
        const response = await api.post(`/payroll/payslips/${selectedPayslip.id}/cancel`, {
          reason: 'Cancelled by user'
        });
        if (response.data.success) {
          setToast({
            type: 'success',
            message: 'Payslip cancelled successfully'
          });
          // Refresh payslip details
          fetchPayslipDetails(selectedPayslip.id);
        }
      } catch (error) {
        console.error('Error cancelling payslip:', error);
        setToast({
          type: 'error',
          message: error.response?.data?.message || 'Failed to cancel payslip'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrintPayslip = () => {
    if (selectedPayslip) {
      setToast({
        type: 'info',
        message: 'Print functionality will be implemented'
      });
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
    <>
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
                {loading && !dashboardData ? (
                  <p className="text-sm text-gray-500">Loading warnings...</p>
                ) : dashboardData?.warnings ? (
                  <>
                    {dashboardData.warnings.missing_bank_account?.count > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {dashboardData.warnings.missing_bank_account.count} {dashboardData.warnings.missing_bank_account.message}
                          </p>
                        </div>
                      </div>
                    )}
                    {dashboardData.warnings.missing_manager?.count > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {dashboardData.warnings.missing_manager.count} {dashboardData.warnings.missing_manager.message}
                          </p>
                        </div>
                      </div>
                    )}
                    {dashboardData.warnings.unapproved_leaves?.count > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {dashboardData.warnings.unapproved_leaves.count} {dashboardData.warnings.unapproved_leaves.message}
                          </p>
                        </div>
                      </div>
                    )}
                    {dashboardData.warnings.missing_attendance?.count > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {dashboardData.warnings.missing_attendance.count} {dashboardData.warnings.missing_attendance.message}
                          </p>
                        </div>
                      </div>
                    )}
                    {!dashboardData.warnings.missing_bank_account?.count && 
                     !dashboardData.warnings.missing_manager?.count && 
                     !dashboardData.warnings.unapproved_leaves?.count && 
                     !dashboardData.warnings.missing_attendance?.count && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-green-900">No warnings</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No warnings available</p>
                )}
              </div>
            </div>

            {/* Payrun Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payrun
              </h3>
              <div className="space-y-3">
                {loading && !dashboardData ? (
                  <p className="text-sm text-gray-500">Loading payruns...</p>
                ) : dashboardData?.recentPayruns?.length > 0 ? (
                  dashboardData.recentPayruns.map((payrun) => (
                    <button
                      key={payrun.id}
                      onClick={() => {
                        setActiveTab('payrun');
                        fetchPayrunDetails(payrun.id);
                      }}
                      className="block w-full text-left p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <p className="text-sm font-medium text-purple-900">
                        Payrun for {getMonthName(payrun.month)} {payrun.year} ({payrun.employee_count} Payslip{payrun.employee_count !== 1 ? 's' : ''})
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent payruns</p>
                )}
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
                    {payrunDetails ? `Payrun ${getMonthName(payrunDetails.month)} ${payrunDetails.year}` : 'Payrun'}
                  </h2>
                  <div className="flex items-center gap-6 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Employer Cost</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹ {payrunDetails ? parseFloat(payrunDetails.total_gross || 0).toFixed(2) : payrollData.totalEmployerCost}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Gross</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹ {payrunDetails ? parseFloat(payrunDetails.total_gross || 0).toFixed(2) : payrollData.totalGross}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Net</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹ {payrunDetails ? parseFloat(payrunDetails.total_net || 0).toFixed(2) : payrollData.totalNet}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  className="px-6 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  {payrunDetails?.status === 'validated' ? 'Done' : (payrunDetails?.status || 'Draft').charAt(0).toUpperCase() + (payrunDetails?.status || 'draft').slice(1)}
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
                  {loading && !payrunDetails ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                        Loading payslips...
                      </td>
                    </tr>
                  ) : payrunDetails?.payslips?.length > 0 ? (
                    payrunDetails.payslips.map((payslip) => {
                      const basicSalary = payslip.components?.find(c => c.component === 'Basic Salary')?.amount || 0;
                      return (
                        <tr
                          key={payslip.id}
                          onClick={() => handleViewPayslip(payslip)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            [{getMonthName(payrunDetails.month)} {payrunDetails.year}][Employee]
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {payslip.employee_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹ {parseFloat(payslip.gross || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹ {parseFloat(basicSalary).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹ {parseFloat(payslip.gross || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹ {parseFloat(payslip.net || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              payslip.status === 'validated' ? 'bg-green-100 text-green-800' :
                              payslip.status === 'computed' ? 'bg-blue-100 text-blue-800' :
                              payslip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payslip.status === 'validated' ? 'Done' : payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (employeePayrolls.map((payroll) => (
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
                  )))}
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

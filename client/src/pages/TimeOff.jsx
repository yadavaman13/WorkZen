import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import SmartSchedulingAssistant from "../components/SmartSchedulingAssistant.jsx";
import axios from "../api/axios";

export default function TimeOff() {
  const [activeTab, setActiveTab] = useState("timeOff");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({
    paid_leave_balance: 24,
    sick_leave_balance: 7
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    durationType: "",
    description: "",
    contactNumber: "",
    document: null,
  });

  // Fetch time off requests and leave balance on mount
  useEffect(() => {
    fetchTimeOffRequests();
    fetchLeaveBalance();
  }, []);

  const fetchTimeOffRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/timeoff", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTimeOffRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching time off requests:", error);
      alert("Failed to fetch time off requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/timeoff/balance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLeaveBalance(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error);
    }
  };

  const handleNewRequest = () => {
    setShowNewRequestModal(true);
  };

  const handleCloseNewRequestModal = () => {
    setShowNewRequestModal(false);
    setFormData({
      leaveType: "",
      fromDate: "",
      toDate: "",
      durationType: "",
      description: "",
      contactNumber: "",
      document: null,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      document: e.target.files[0],
    }));
  };

  const handleApplySuggestion = (suggestedDates) => {
    setFormData((prev) => ({
      ...prev,
      fromDate: suggestedDates.fromDate,
      toDate: suggestedDates.toDate
    }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    // Validate sick leave attachment
    if (formData.leaveType === 'Sick' && !formData.document) {
      alert('Medical certificate is mandatory for sick leave');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('leaveType', formData.leaveType);
      submitData.append('fromDate', formData.fromDate);
      submitData.append('toDate', formData.toDate);
      submitData.append('durationType', formData.durationType);
      submitData.append('description', formData.description);
      submitData.append('contactNumber', formData.contactNumber);
      if (formData.document) {
        submitData.append('document', formData.document);
      }
      
      const response = await axios.post("/api/timeoff", submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        alert("Time off request submitted successfully!");
        handleCloseNewRequestModal();
        fetchTimeOffRequests();
        fetchLeaveBalance();
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert(error.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `/api/timeoff/${selectedRequest.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert("Request Approved");
        handleCloseModal();
        fetchTimeOffRequests();
        fetchLeaveBalance();
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.response?.data?.message || "Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `/api/timeoff/${selectedRequest.id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert("Request Rejected");
        handleCloseModal();
        fetchTimeOffRequests();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error.response?.data?.message || "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Filter requests based on search query
  const filteredRequests = timeOffRequests.filter(request =>
    request.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.leave_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">{loading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A24689]"></div>
            </div>
          </div>
        )}

        {/* Header with Tabs and Actions */}
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("timeOff")}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === "timeOff"
                  ? "border-b-2 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={
                activeTab === "timeOff"
                  ? { borderBottomColor: "#A24689" }
                  : {}
              }
            >
              Time Off
            </button>
            <button
              onClick={() => setActiveTab("allocation")}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === "allocation"
                  ? "border-b-2 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={
                activeTab === "allocation"
                  ? { borderBottomColor: "#A24689" }
                  : {}
              }
            >
              Allocation
            </button>
          </div>
        </div>

        {/* NEW Button and Search Bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewRequest}
            className="px-6 py-2 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-all"
            style={{ backgroundColor: "#A24689" }}
          >
            NEW
          </button>
          <input
            type="text"
            placeholder="Searchbar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>

        {/* Time Off Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paid Time Off Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-3">
              Available paid time off
            </h3>
            <p className="text-4xl font-bold text-gray-900">
              {leaveBalance.paid_leave_balance} <span className="text-2xl font-semibold">Days</span>
            </p>
          </div>

          {/* Sick Time Off Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-3">
              Available sick time off
            </h3>
            <p className="text-4xl font-bold text-gray-900">
              {leaveBalance.sick_leave_balance} <span className="text-2xl font-semibold">Days</span>
            </p>
          </div>
        </div>

        {/* Time Off Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-[15%] px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  Name
                </th>
                <th className="w-[15%] px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  Start Date
                </th>
                <th className="w-[15%] px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  End Date
                </th>
                <th className="w-[20%] px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  Time off Type
                </th>
                <th className="w-[15%] px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="w-[20%] px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No time off requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">
                      {request.employee_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">
                      {formatDate(request.from_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">
                      {formatDate(request.to_date)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-blue-600 font-medium">
                        {request.leave_type} Time Off
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className={`capitalize px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="text-sm font-medium hover:underline"
                          style={{ color: "#A24689" }}
                        >
                          View details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for viewing request details */}
      {showModal && selectedRequest && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                Time Off Request Details
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Modal Body */}
            <div className="grid grid-cols-2 gap-8 px-8 py-6">
              {/* Left Column - Employee Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Employee Information
                </h3>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Employee Name</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRequest.employeeName}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(selectedRequest.from_date)}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(selectedRequest.to_date)}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Time off Type</p>
                  <p className="text-base font-medium text-blue-600">
                    {selectedRequest.leave_type} Time Off
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Duration Type</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRequest.duration_type}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`text-base font-medium capitalize ${
                    selectedRequest.status === 'approved' ? 'text-green-600' :
                    selectedRequest.status === 'rejected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {selectedRequest.status}
                  </p>
                </div>

                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="text-base font-medium text-gray-900 text-right max-w-[250px]">
                    {selectedRequest.reason}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRequest.contact_number}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Time off Balance</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Before</p>
                      <p className="text-base font-semibold text-gray-900">
                        {selectedRequest.balance_before}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">After</p>
                      <p className="text-base font-semibold text-gray-900">
                        {selectedRequest.balance_after}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Impact Analysis */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Impact Analysis
                </h3>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Team Members on Leave</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRequest.team_members_on_leave || 0}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Workload Risk</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRequest.workload_risk || 'Low'}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Productivity Impact</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRequest.productivity_impact || 'N/A'}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Payroll Impact</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRequest.payroll_impact || 'N/A'}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Critical Role Flag</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRequest.critical_role_flag || 'No'}
                  </p>
                </div>

                {selectedRequest.approved_by_name && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Approved By</p>
                      <p className="text-base font-medium text-green-600">
                        {selectedRequest.approved_by_name}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">Approved At</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedRequest.approved_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRequest.rejected_by_name && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Rejected By</p>
                      <p className="text-base font-medium text-red-600">
                        {selectedRequest.rejected_by_name}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">Rejected At</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedRequest.rejected_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 px-8 py-6 border-t border-gray-200">
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={handleReject}
                    className="px-6 py-2.5 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    style={{ backgroundColor: "#A24689" }}
                  >
                    Approve
                  </button>
                </>
              )}
              {selectedRequest.status !== 'pending' && (
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Request Form Modal */}
      {showNewRequestModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          onClick={handleCloseNewRequestModal}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-2xl font-semibold text-gray-900">
                Apply for Leave
              </h2>
              <button
                onClick={handleCloseNewRequestModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Form */}
            <form onSubmit={handleSubmitRequest} className="px-8 py-6">
              <div className="space-y-5">
                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Select Leave Type</option>
                    <option value="Paid">Paid</option>
                    <option value="Sick">Sick</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                {/* From Date and To Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fromDate"
                      value={formData.fromDate}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="toDate"
                      value={formData.toDate}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* AI Smart Scheduling Assistant */}
                <SmartSchedulingAssistant 
                  formData={formData}
                  onApplySuggestion={handleApplySuggestion}
                />

                {/* Duration Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="durationType"
                    value={formData.durationType}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Select Duration Type</option>
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                    rows="4"
                    placeholder="Please provide a description for your leave request..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter your contact number"
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 10 digits</p>
                </div>

                {/* Attach Document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Document{" "}
                    {formData.leaveType === 'Sick' ? (
                      <span className="text-red-500">*</span>
                    ) : (
                      <span className="text-gray-500 text-xs">(Optional)</span>
                    )}
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    required={formData.leaveType === 'Sick'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#A24689] file:text-white hover:file:bg-[#8a3a72] file:cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.leaveType === 'Sick' 
                      ? '⚠️ Medical certificate required for sick leave (PDF, JPG, PNG, DOC - Max 5MB)'
                      : 'Medical proof, etc. (PDF, JPG, PNG, DOC - Max 5MB)'}
                  </p>
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseNewRequestModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  style={{ backgroundColor: "#A24689" }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


import axios from 'axios';

// API Base URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export the api instance
export default api;

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.post('/auth/verify-token'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // OTP Verification
  registerWithOtp: (data) => api.post('/auth/register-with-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data)
};

// Users endpoints
export const usersAPI = {
  getAllUsers: (page = 1, limit = 10) => api.get(`/manage/users?page=${page}&limit=${limit}`),
  getUserById: (id) => api.get(`/manage/users/${id}`),
  createUser: (data) => api.post('/manage/users', data),
  updateUser: (id, data) => api.put(`/manage/users/${id}`, data),
  deleteUser: (id) => api.delete(`/manage/users/${id}`),
  getUserStats: () => api.get('/manage/users/stats'),
  getAllRoles: () => api.get('/manage/roles'),
  resetUserPassword: (id, data) => api.post(`/manage/users/${id}/reset-password`, data)
};

// Email endpoints
export const emailAPI = {
  sendCredentials: (userId, data) => api.post(`/manage/send-credentials/${userId}`, data),
  sendResetLink: (userId, data) => api.post(`/manage/send-reset-link/${userId}`, data),
  sendBulkCredentials: (data) => api.post('/manage/send-bulk-credentials', data),
  getEmailTemplates: () => api.get('/manage/email-templates')
};

// Employees endpoints
export const employeesAPI = {
  getAllEmployees: () => api.get('/employees'),
  getEmployeeById: (id) => api.get(`/employees/${id}`),
  generateEmployeeId: (data) => api.post('/employees/generate-id', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data)
};

// Onboarding endpoints
export const onboardingAPI = {
  // HR creates invite
  createInvite: (data) => api.post('/onboarding/invite', data),
  
  // Validate token (public)
  validateToken: (token) => api.get(`/onboarding/validate/${token}`),
  
  // Candidate actions
  savePersonalInfo: (token, data) => api.put(`/onboarding/personal/${token}`, data),
  saveBankInfo: (token, data) => api.put(`/onboarding/bank/${token}`, data),
  uploadDocuments: (token, formData) => api.post(`/onboarding/upload/${token}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submitOnboarding: (token) => api.post(`/onboarding/submit/${token}`),
  getOnboardingDetails: (token) => api.get(`/onboarding/details/${token}`),
  
  // HR actions
  getPendingReviews: () => api.get('/onboarding/reviews/pending'),
  approveOnboarding: (id) => api.put(`/onboarding/approve/${id}`),
  requestChanges: (id, data) => api.put(`/onboarding/request-changes/${id}`, data),
  rejectOnboarding: (id, data) => api.put(`/onboarding/reject/${id}`, data)
};

// Attendance endpoints
export const attendanceAPI = {
  markAttendance: (data) => api.post('/attendance/mark', data),
  getAttendance: (id) => api.get(`/attendance/${id}`),
  getAttendanceReport: (params) => api.get('/attendance/report', { params })
};

// Leave endpoints
export const leavesAPI = {
  requestLeave: (data) => api.post('/leaves/request', data),
  getLeaveBalance: (id) => api.get(`/leaves/balance/${id}`),
  getLeaveRequests: () => api.get('/leaves/requests'),
  approveLeave: (id, data) => api.post(`/leaves/${id}/approve`, data),
  rejectLeave: (id, data) => api.post(`/leaves/${id}/reject`, data)
};

// Analytics endpoints
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getEmployeeStats: () => api.get('/analytics/employees'),
  getAttendanceStats: () => api.get('/analytics/attendance'),
  getPayrollStats: () => api.get('/analytics/payroll')
};

// Payroll endpoints
export const payrollAPI = {
  generatePayslip: (id, data) => api.post(`/payroll/${id}/generate`, data),
  getPayslips: (id) => api.get(`/payroll/${id}`),
  getPayrollReport: (params) => api.get('/payroll/report', { params })
};

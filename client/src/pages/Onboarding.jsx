import { useState } from 'react';
import axios from '../api/axios';
import DashboardLayout from '../components/layout/DashboardLayout';

function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'employee'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({
          type: 'error',
          text: 'Authentication required. Please log in again.'
        });
        setLoading(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      // Create employee account
      const response = await axios.post('/user/create-employee', {
        email: employeeForm.email,
        name: employeeForm.name,
        phone: employeeForm.phone,
        role: employeeForm.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Employee account created successfully! Password reset link has been sent to ${employeeForm.email}`
        });

        // Reset form
        setEmployeeForm({
          email: '',
          name: '',
          phone: '',
          role: 'employee'
        });
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', JSON.stringify(error.response, null, 2));
      
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage({
          type: 'error',
          text: 'Your session has expired. Please log in again.'
        });
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || error.response?.data?.error || 'Failed to create employee account'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Onboarding</h1>
          <p className="text-gray-600">Add a new employee and send them login credentials</p>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
              <div className="flex-1">
                <p className="font-medium">{message.text}</p>
              </div>
              <button
                onClick={() => setMessage({ type: '', text: '' })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Invite New Employee</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email and Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={employeeForm.email}
                  onChange={handleInputChange}
                  required
                  placeholder="employee@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={employeeForm.name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone and Role Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={employeeForm.phone}
                  onChange={handleInputChange}
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={employeeForm.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A24689] focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                  <option value="payroll">Payroll</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                style={{ backgroundColor: '#A24689' }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending Invite...
                  </span>
                ) : (
                  'Send Onboarding Invite'
                )}
              </button>
            </div>

            {/* Info Text */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Note:</span> An email will be sent to the employee with a password reset link to set up their account.
              </p>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Onboarding;

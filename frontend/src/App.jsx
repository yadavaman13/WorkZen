import { useState, useEffect } from 'react';
import './App.css';
import EmployeeIDGenerator from './components/EmployeeIDGenerator';
import UserManagement from './components/UserManagement';
import OnboardingManagement from './components/OnboardingManagement';
import api, { authAPI } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));

        // Verify token with backend
        try {
          await authAPI.verifyToken();
        } catch (err) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }

      // Check backend and database status
      try {
        const response = await api.get('/health', { baseURL: 'http://localhost:5000' });
        setSystemStatus({
          backend: 'connected',
          database: response.data.database === 'connected' ? 'connected' : 'disconnected'
        });
      } catch (err) {
        setSystemStatus({
          backend: 'disconnected',
          database: 'disconnected'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('dashboard');
  };

  // Get available tabs based on user role
  const getAvailableTabs = () => {
    if (!user) return ['Dashboard'];

    const allTabs = {
      admin: ['Dashboard', 'Employee ID', 'Users', 'Onboarding', 'Employees', 'Attendance', 'Leaves', 'Payroll', 'Analytics'],
      hr_officer: ['Dashboard', 'Employee ID', 'Users', 'Onboarding', 'Employees', 'Attendance', 'Leaves', 'Payroll'],
      manager: ['Dashboard', 'Employees', 'Attendance', 'Leaves'],
      employee: ['Dashboard', 'Attendance', 'Leaves'],
      contractor: ['Dashboard', 'Attendance']
    };

    return allTabs[user.role] || ['Dashboard'];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing system...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">WorkZen HRMS</h1>
              <span className="ml-3 text-sm text-gray-500">Human Resource Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button className="px-4 py-2 text-gray-700 hover:text-blue-600">
                Notifications
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {getAvailableTabs().map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === tab.toLowerCase()
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Employee ID Generator Tab */}
        {activeTab === 'employee id' && (
          <EmployeeIDGenerator />
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <UserManagement />
        )}

        {/* Onboarding Tab */}
        {activeTab === 'onboarding' && (
          <OnboardingManagement />
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to WorkZen HRMS
          </h2>
          <p className="text-gray-600 mb-6">
            Role: <span className="font-semibold text-blue-600">{user.role.replace('_', ' ').toUpperCase()}</span>
          </p>
          
          {/* Dashboard Cards - shown for admin, hr_officer, manager */}
          {(user.role === 'admin' || user.role === 'hr_officer' || user.role === 'manager') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <DashboardCard
                title="Total Employees"
                value="0"
                icon="👥"
                color="blue"
              />
              {(user.role === 'admin' || user.role === 'hr_officer') && (
                <DashboardCard
                  title="Pending Onboarding"
                  value="0"
                  icon="📝"
                  color="yellow"
                />
              )}
              <DashboardCard
                title="Active Leaves"
                value="0"
                icon="🏖️"
                color="green"
              />
              {(user.role === 'admin' || user.role === 'hr_officer') && (
                <DashboardCard
                  title="Payroll This Month"
                  value="₹0"
                  icon="💰"
                  color="purple"
                />
              )}
            </div>
          )}

          {/* Quick Actions - Role-based */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(user.role === 'admin' || user.role === 'hr_officer') && (
                <ActionButton
                  title="Send Onboarding Invite"
                  description="Invite new candidate to complete onboarding"
                  icon="✉️"
                />
              )}
              <ActionButton
                title="Mark Attendance"
                description="Record daily attendance for employees"
                icon="✓"
              />
              {user.role === 'employee' && (
                <ActionButton
                  title="Request Leave"
                  description="Submit a leave request"
                  icon="📅"
                />
              )}
              {(user.role === 'admin' || user.role === 'hr_officer') && (
                <ActionButton
                  title="Process Payroll"
                  description="Calculate and process monthly payroll"
                  icon="💳"
                />
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-2">
              <StatusItem label="Backend API" status={systemStatus.backend} url="http://localhost:5000" />
              <StatusItem label="Database" status={systemStatus.database} note={systemStatus.database === 'disconnected' ? 'PostgreSQL database not configured' : 'PostgreSQL connected'} />
              <StatusItem label="Frontend" status="connected" url="http://localhost:5173" />
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Create PostgreSQL database: <code className="bg-gray-100 px-2 py-1 rounded">CREATE DATABASE workzen_hrms;</code></li>
              <li>Configure environment variables in <code className="bg-gray-100 px-2 py-1 rounded">backend/.env</code></li>
              <li>Run database migrations: <code className="bg-gray-100 px-2 py-1 rounded">npm run migrate</code></li>
              <li>Create admin user and start using the system</li>
            </ol>
          </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            WorkZen HRMS v1.0.0 - Production Ready Human Resource Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

function DashboardCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ title, description, icon }) {
  return (
    <button className="text-left p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
      <div className="flex items-start">
        <span className="text-2xl mr-3">{icon}</span>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

function StatusItem({ label, status, url, note }) {
  const statusColors = {
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center space-x-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
        {url && <span className="text-xs text-gray-500">{url}</span>}
        {note && <span className="text-xs text-gray-500">({note})</span>}
      </div>
    </div>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import TimeOff from './pages/TimeOff'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import EmployeeDashboard from './pages/DashboardEmployee'
import HRDashboard from './pages/DashboardHR'
import PayrollDashboard from './pages/DashboardPayroll'
import AdminDashboard from './pages/DashboardAdmin'
import LandingPage from './pages/LandingPage'
import { AuthProvider, useAuth } from './context/AuthProvider'
import './App.css'

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <div className="p-6">Forbidden</div>;
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Redirect based on user role
  const roleRoutes = {
    admin: '/dashboard',
    hr: '/dashboard',
    payroll: '/dashboard',
    employee: '/dashboard'
  };

  return <Navigate to={roleRoutes[user.role] || '/dashboard/employee'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* General dashboard route - redirects based on role */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/timeoff" element={<TimeOff />} />
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/profile" element={<Profile />} />

          <Route path="/dashboard/employee" element={<Protected roles={["employee", "hr", "payroll", "admin"]}><EmployeeDashboard /></Protected>} />
          <Route path="/dashboard/hr" element={<Protected roles={["hr", "admin"]}><HRDashboard /></Protected>} />
          <Route path="/dashboard/payroll" element={<Protected roles={["payroll", "admin"]}><PayrollDashboard /></Protected>} />
          <Route path="/dashboard/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

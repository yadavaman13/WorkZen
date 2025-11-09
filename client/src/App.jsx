import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/DashboardEmployee";
import HRDashboard from "./pages/DashboardHR";
import PayrollDashboard from "./pages/DashboardPayroll";
import AdminDashboard from "./pages/DashboardAdmin";
import LandingPage from "./pages/LandingPage";
import Attendance from "./pages/Attendance";
import Employees from "./pages/Employees";
import DashboardLayout from "./components/layout/DashboardLayout";
import { AuthProvider, useAuth } from "./context/AuthProvider";
import "./App.css";
import VerifyOtp from "./pages/VerifyOtp";
import TimeOff from "./pages/TimeOff";
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'
import OnboardingWizard from './pages/onboarding/OnboardingWizard'
import HROnboardingReview from './pages/HROnboardingReview'
import Payroll from './pages/Payroll'
import Settings from './pages/Settings'

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500">Your role: <span className="font-semibold">{user.role || 'Not assigned'}</span></p>
          <p className="text-sm text-gray-500">Required roles: <span className="font-semibold">{roles.join(', ')}</span></p>
        </div>
      </div>
    );
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Redirect based on user role
  const roleRoutes = {
    admin: "/dashboard/admin",
    hr: "/dashboard/hr",
    payroll: "/dashboard/payroll",
    employee: "/dashboard/employee",
  };

  return (
    <Navigate to={roleRoutes[user.role] || "/dashboard/employee"} replace />
  );
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
          <Route path="/onboarding" element={<Protected><OnboardingWizard /></Protected>} />

          {/* Dashboard Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <Protected>
                <DashboardLayout>
                  <Navigate to="/dashboard/attendance" replace />
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/employees"
            element={
              <Protected roles={["hr", "admin", "employee"]}>
                <DashboardLayout>
                  <Employees />
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/attendance"
            element={
              <Protected roles={["employee", "hr", "payroll", "admin"]}>
                <DashboardLayout>
                  <Attendance />
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/timeoff"
            element={
              <Protected roles={["employee", "hr", "payroll", "admin"]}>
                <DashboardLayout>
                  <TimeOff />
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/payroll"
            element={
              <Protected roles={["payroll", "admin"]}>
                <DashboardLayout>
                  <Payroll />
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/reports"
            element={
              <Protected roles={["payroll", "admin"]}>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/profile"
            element={
              <Protected roles={["employee", "hr", "payroll", "admin"]}>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/settings"
            element={
              <Protected roles={["admin"]}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </Protected>
            }
          />

          {/* Role-specific dashboard routes */}
          <Route
            path="/dashboard/employee"
            element={
              <Protected roles={["employee", "hr", "payroll", "admin"]}>
                <DashboardLayout>
                  <EmployeeDashboard />
                </DashboardLayout>
              </Protected>
            }
          />
          <Route
            path="/dashboard/hr"
            element={
              <Protected roles={["hr", "admin"]}>
                <DashboardLayout>
                  <HRDashboard />
                </DashboardLayout>
              </Protected>
            }
          />
          <Route
            path="/dashboard/hr/onboarding-review"
            element={
              <Protected roles={["hr", "admin"]}>
                <DashboardLayout>
                  <HROnboardingReview />
                </DashboardLayout>
              </Protected>
            }
          />
          <Route
            path="/dashboard/payroll-dashboard"
            element={
              <Protected roles={["payroll", "admin"]}>
                <DashboardLayout>
                  <PayrollDashboard />
                </DashboardLayout>
              </Protected>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <Protected roles={["admin"]}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </Protected>
            }
          />

          {/* Legacy routes - redirect to new structure */}
          <Route
            path="/employees"
            element={<Navigate to="/dashboard/employees" replace />}
          />
          <Route
            path="/attendance"
            element={<Navigate to="/dashboard/attendance" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

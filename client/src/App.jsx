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

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <div className="p-6">Forbidden</div>;
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/timeoff" element={<TimeOff />} />
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/profile" element={<Profile />} />

          {/* <Route path="/dashboard/employee" element={<Protected roles={["employee", "hr", "payroll", "admin"]}><EmployeeDashboard /></Protected>} />
          <Route path="/dashboard/hr" element={<Protected roles={["hr", "admin"]}><HRDashboard /></Protected>} />
          <Route path="/dashboard/payroll" element={<Protected roles={["payroll", "admin"]}><PayrollDashboard /></Protected>} />
          <Route path="/dashboard/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} /> */}
          {/* Dashboard Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <Protected>
                <DashboardLayout>
                  <Navigate to="/dashboard/employees" replace />
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/employees"
            element={
              <Protected roles={["employee", "hr", "payroll", "admin"]}>
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
            path="/dashboard/time-off"
            element={
              <Protected roles={["employee", "hr", "payroll", "admin"]}>
                <DashboardLayout>
                  <div>
                    <h1 className="text-2xl font-bold mb-4">Time Off</h1>
                    <p className="text-gray-600">
                      Time Off management coming soon...
                    </p>
                  </div>
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/payroll"
            element={
              <Protected roles={["payroll", "admin"]}>
                <DashboardLayout>
                  <div>
                    <h1 className="text-2xl font-bold mb-4">Payroll</h1>
                    <p className="text-gray-600">
                      Payroll management coming soon...
                    </p>
                  </div>
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/reports"
            element={
              <Protected roles={["hr", "payroll", "admin"]}>
                <DashboardLayout>
                  <div>
                    <h1 className="text-2xl font-bold mb-4">Reports</h1>
                    <p className="text-gray-600">
                      Reports and analytics coming soon...
                    </p>
                  </div>
                </DashboardLayout>
              </Protected>
            }
          />

          <Route
            path="/dashboard/settings"
            element={
              <Protected roles={["employee", "hr", "payroll", "admin"]}>
                <DashboardLayout>
                  <div>
                    <p className="text-gray-600">
                      Settings page coming soon...
                    </p>
                  </div>
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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard/employee" element={<Protected roles={["employee","hr","payroll","admin"]}><EmployeeDashboard /></Protected>} />
          <Route path="/dashboard/hr" element={<Protected roles={["hr","admin"]}><HRDashboard /></Protected>} />
          <Route path="/dashboard/payroll" element={<Protected roles={["payroll","admin"]}><PayrollDashboard /></Protected>} />
          <Route path="/dashboard/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

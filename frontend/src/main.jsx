import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import Login from './components/Login.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import CandidateOnboarding from './components/CandidateOnboarding.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login onLogin={(userData) => {
          // userData is already the user object from Login.jsx
          window.location.href = '/';
        }} />} />
        <Route path="/forgot-password" element={<ForgotPassword onBack={() => window.location.href = '/login'} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboard" element={<CandidateOnboarding />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

import { useState, useEffect } from 'react';
import { authAPI } from '../services/api.js';
import api from '../services/api.js';

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@workzen.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      // Health endpoint is at the server root, not under /api
      const response = await api.get('/health', { baseURL: 'http://localhost:5000' });
      // response should be JSON like { status: 'OK', database: 'connected' }
      if (response.status === 200 && (response.data?.status === 'OK' || response.data?.database === 'connected')) {
        setServerStatus('connected');
      } else {
        setServerStatus('disconnected');
      }
    } catch (err) {
      setServerStatus('disconnected');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Call login API
      const response = await authAPI.login({ email, password });

      if (response.data.token && response.data.user) {
        // Store token and user in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Call parent callback
        onLogin(response.data.user);
      }
    } catch (err) {
      // Handle different error types
      if (err.response?.status === 401) {
        setError(err.response.data?.error || 'Invalid credentials');
      } else if (err.response?.status === 403) {
        setError(err.response.data?.error || 'Account is deactivated');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please ensure backend is running on port 5000');
        setServerStatus('disconnected');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('admin@workzen.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">WorkZen</h1>
          <p className="text-gray-600">Human Resource Management System</p>
          <p className="text-xs text-gray-500 mt-2">Version 1.0.0</p>
        </div>

        {/* Server Status */}
        <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${
          serverStatus === 'connected'
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            serverStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
          }`}></span>
          <span className={`text-xs font-medium ${
            serverStatus === 'connected' ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {serverStatus === 'connected'
              ? 'Server Connected'
              : serverStatus === 'checking'
              ? 'Checking server...'
              : 'Server Disconnected'}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="admin@workzen.com"
              disabled={loading}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => window.location.href = '/forgot-password'}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || serverStatus === 'disconnected'}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-gray-800 mb-3">📝 Demo Credentials</p>
          <div className="space-y-2 mb-4">
            <div>
              <p className="text-xs text-gray-600">Email:</p>
              <code className="text-sm bg-white px-3 py-2 rounded border border-blue-100 font-mono block">
                admin@workzen.com
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-600">Password:</p>
              <code className="text-sm bg-white px-3 py-2 rounded border border-blue-100 font-mono block">
                admin123
              </code>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition"
          >
            Use Demo Credentials
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-600">
            Make sure the backend server is running on <code className="font-mono">port 5000</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

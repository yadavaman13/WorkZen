import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthProvider';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [showEmailInput, setShowEmailInput] = useState(!location.state?.email);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0) setResendDisabled(false);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/verify-otp`, { email, otp });
      login(res.data.user, res.data.token);
      alert('✅ Email verified successfully! Welcome to WorkZen!');
      navigate(res.data.redirect || '/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        err.response?.data?.message ||
        'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return setError('Please enter your email address first');
    setError('');
    setResending(true);
    setResendDisabled(true);
    try {
      await axios.post(`${API}/api/auth/resend-otp`, { email });
      alert('✅ A new verification code has been sent to your email!');
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to resend OTP. Please try again.');
      setResendDisabled(false);
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) setOtp(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-[#A24689] mb-2">WorkZen</h1>
          <p className="text-gray-600 text-sm">Verify Your Email Address</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleVerify} className="space-y-6">
          {showEmailInput && (
            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Verification Code</label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              maxLength={6}
              placeholder="000000"
              required
              className="w-full text-center text-2xl tracking-widest border rounded-lg px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6 || !email}
            className="w-full py-3 rounded-lg font-semibold text-white bg-[#A24689] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Didn’t receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resending || resendDisabled}
            className="text-sm font-semibold underline text-[#A24689] disabled:text-gray-400"
          >
            {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </button>
        </div>

        <div className="text-xs text-gray-600 border-l-4 border-yellow-500 bg-yellow-50 p-3 rounded">
          <strong>Security Tips:</strong>
          <ul className="mt-1">
            <li>Never share your OTP with anyone.</li>
            <li>OTP expires in 10 minutes.</li>
            <li>If you didn’t request it, ignore this email.</li>
          </ul>
        </div>

        <div className="text-center text-sm">
          Want to use a different email?{' '}
          <Link to="/register" className="text-[#A24689] font-semibold underline">
            Go back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}

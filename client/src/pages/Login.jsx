import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

export default function Login(){
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {}
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async (e)=>{
    e.preventDefault()
    setServerError('')
    
    if (!validateForm()) {
      return
    }
    
    try{
      await login(email, password)
    }catch(error){
      setServerError(error.response?.data?.msg || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 
            className="text-5xl font-bold mb-2"
            style={{ color: '#A24689' }}
          >
            WorkZen
          </h1>
          <p className="text-gray-600 text-sm">Welcome back! Please login to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-95 animate-slide-down">
          <h2 
            className="text-2xl font-bold mb-6 text-center"
            style={{ color: '#A24689' }}
          >
            Login
          </h2>
          
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700 text-sm animate-fade-in">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span className="font-medium">{serverError}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={submit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                  </svg>
                </div>
                <input 
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'
                  }`}
                  placeholder="Enter your email" 
                  type="email"
                  value={email} 
                  onChange={e=>{setEmail(e.target.value); setErrors({...errors, email:''})}}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input 
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'
                  }`}
                  placeholder="Enter your password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e=>{setPassword(e.target.value); setErrors({...errors, password:''})}}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm font-medium hover:underline transition-all"
                style={{ color: '#A24689' }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button 
              type="submit"
              className="w-full py-3.5 rounded-lg text-white font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-in-out"
              style={{ backgroundColor: '#A24689' }}
            >
              Login
            </button>
          </form>
          
          {/* Register Link
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-semibold hover:underline transition-all"
                style={{ color: '#A24689' }}
              >
                Create Account
              </Link>
            </p>
          </div> */}

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-xs text-gray-500 font-medium">OR</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-sm text-gray-600 hover:text-gray-800 font-medium inline-flex items-center transition-all"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2025 WorkZen. All rights reserved.
        </p>
      </div>
    </div>
  )
}

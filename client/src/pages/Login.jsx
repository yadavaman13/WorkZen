import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

export default function Login(){
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{color:'#A24689'}}>WorkZen Login</h2>
        {serverError && <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-bold">{serverError}</div>}
        
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input 
              className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your email" 
              type="email"
              value={email} 
              onChange={e=>{setEmail(e.target.value); setErrors({...errors, email:''})}}
            />
            {errors.email && <p className="text-red-600 text-xs mt-1 font-bold">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input 
              className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your password" 
              type="password" 
              value={password} 
              onChange={e=>{setPassword(e.target.value); setErrors({...errors, password:''})}}
            />
            {errors.password && <p className="text-red-600 text-xs mt-1 font-bold">{errors.password}</p>}
          </div>

          <button className="w-full p-3 rounded brand-btn font-medium text-white hover:opacity-90 transition">
            Login
          </button>
        </form>
        
        <p className="mt-4 text-sm text-center text-gray-600">
          No account? <Link to="/register" className="font-medium" style={{color:'#A24689'}}>Register</Link>
        </p>
      </div>
    </div>
  )
}

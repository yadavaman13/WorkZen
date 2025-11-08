import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

export default function Register(){
  const { register } = useAuth()
  const [companyName, setCompanyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  const validateForm = () => {
    const newErrors = {}
    
    // Company Name validation
    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }
    
    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Phone validation
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    // Confirm Password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
      await register({ companyName, name, email, phone, password })
    }catch(error){
      setServerError(error.response?.data?.msg || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-8">
      <div className="card" style={{maxWidth: '500px'}}>
        <h2 className="text-2xl font-bold mb-6 text-center" style={{color:'#A24689'}}>Create Account</h2>
        {serverError && <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-bold">{serverError}</div>}
        
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Company Name</label>
            <input 
              className={`w-full p-2 border rounded ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter company name" 
              value={companyName} 
              onChange={e=>{setCompanyName(e.target.value); setErrors({...errors, companyName:''})}}
            />
            {errors.companyName && <p className="text-red-600 text-xs mt-1 font-bold">{errors.companyName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
            <input 
              className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your full name" 
              value={name} 
              onChange={e=>{setName(e.target.value); setErrors({...errors, name:''})}}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1 font-bold">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input 
              className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter email address" 
              type="email"
              value={email} 
              onChange={e=>{setEmail(e.target.value); setErrors({...errors, email:''})}}
            />
            {errors.email && <p className="text-red-600 text-xs mt-1 font-bold">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
            <input 
              className={`w-full p-2 border rounded ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter phone number" 
              value={phone} 
              onChange={e=>{setPhone(e.target.value); setErrors({...errors, phone:''})}}
            />
            {errors.phone && <p className="text-red-600 text-xs mt-1 font-bold">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input 
              className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter password" 
              type="password" 
              value={password} 
              onChange={e=>{setPassword(e.target.value); setErrors({...errors, password:''})}}
            />
            {errors.password && <p className="text-red-600 text-xs mt-1 font-bold">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
            <input 
              className={`w-full p-2 border rounded ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Re-enter password" 
              type="password" 
              value={confirmPassword} 
              onChange={e=>{setConfirmPassword(e.target.value); setErrors({...errors, confirmPassword:''})}}
            />
            {errors.confirmPassword && <p className="text-red-600 text-xs mt-1 font-bold">{errors.confirmPassword}</p>}
          </div>

          <button className="w-full p-3 rounded brand-btn font-medium text-white hover:opacity-90 transition">
            Register
          </button>
        </form>
        
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account? <Link to="/login" className="font-medium" style={{color:'#A24689'}}>Login</Link>
        </p>
      </div>
    </div>
  )
}

import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    // redirect to role dashboard
    navigate(data.redirect)
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload)
    // No longer auto-login after registration - OTP verification required first
    // Return the email so Register.jsx can pass it to VerifyOtp page
    return { email: payload.email, msg: data.msg }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

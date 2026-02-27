import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ── Bootstrap: load user from stored token ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('echo_access_token')
    if (token) {
      fetchProfile(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async (token) => {
    try {
      const { data } = await authAPI.getProfile()
      setUser(data)
      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem('echo_access_token')
      localStorage.removeItem('echo_refresh_token')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  // ── Register ──────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData)
    localStorage.setItem('echo_access_token',  data.tokens.access)
    localStorage.setItem('echo_refresh_token', data.tokens.refresh)
    setUser(data.user)
    setIsAuthenticated(true)
    toast.success(data.message || `Welcome, ${data.user.first_name}! 🎉`)
    return data
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('echo_access_token',  data.tokens.access)
    localStorage.setItem('echo_refresh_token', data.tokens.refresh)
    setUser(data.user)
    setIsAuthenticated(true)
    toast.success(data.message || `Welcome back, ${data.user.first_name}! 👋`)
    return data
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('echo_refresh_token')
      if (refresh) await authAPI.logout({ refresh })
    } catch { /* ignore */ }
    localStorage.removeItem('echo_access_token')
    localStorage.removeItem('echo_refresh_token')
    setUser(null)
    setIsAuthenticated(false)
    toast('Goodbye! See you next time. 👋', { icon: '✨' })
  }, [])

  // ── Update profile ────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    const { data } = await authAPI.updateProfile(updates)
    setUser(data)
    return data
  }, [])

  // ── Update accessibility settings ─────────────────────────────────────
  const updateAccessibility = useCallback(async (settings) => {
    const { data } = await authAPI.updateAccessibility(settings)
    setUser(prev => ({ ...prev, ...settings }))
    return data
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      register,
      login,
      logout,
      updateProfile,
      updateAccessibility,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

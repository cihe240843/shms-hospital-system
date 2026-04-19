import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function fetchProfile(accessToken) {
  const { data } = await axios.get(`${BASE}/api/audit/me/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('shms_user')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      setRole(u.role)
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const { data } = await axios.post(`${BASE}/api/token/`, { username, password })
    const profile = await fetchProfile(data.access)
    const userObj = {
      username: profile.username || username,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      email: profile.email || '',
      role: profile.role || 'gp',
      access: data.access,
      refresh: data.refresh,
    }
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('shms_user', JSON.stringify(userObj))
    setUser(userObj)
    setRole(userObj.role)
    return userObj
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
    setRole(null)
  }

  // For demo: allow role switch without re-login
  const switchRole = (newRole) => {
    if (!user) return
    const updated = { ...user, role: newRole }
    localStorage.setItem('shms_user', JSON.stringify(updated))
    setUser(updated)
    setRole(newRole)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

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
    const hydrateAuth = async () => {
      const token = localStorage.getItem('access_token')
      const stored = localStorage.getItem('shms_user')

      if (!token || !stored) {
        setLoading(false)
        return
      }

      try {
        const cached = JSON.parse(stored)
        const profile = await fetchProfile(token)
        const userObj = {
          username: profile.username || cached.username || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          role: profile.role || cached.role || 'gp',
          access: token,
          refresh: localStorage.getItem('refresh_token') || cached.refresh,
        }
        localStorage.setItem('shms_user', JSON.stringify(userObj))
        setUser(userObj)
        setRole(userObj.role)
      } catch {
        localStorage.clear()
        setUser(null)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    hydrateAuth()
  }, [])

  const finalizeLogin = async (username, data) => {
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

  const initiateLogin = async (username, password) => {
    const { data } = await axios.post(`${BASE}/api/auth/login/initiate/`, { username, password })
    return data
  }

  const verifyLogin = async (username, challengeToken, otp) => {
    const { data } = await axios.post(`${BASE}/api/auth/login/verify/`, {
      username,
      challenge_token: challengeToken,
      otp,
    })
    return finalizeLogin(username, data)
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, initiateLogin, verifyLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

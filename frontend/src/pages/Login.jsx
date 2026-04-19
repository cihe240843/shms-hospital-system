import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('dr.smith')
  const [password, setPassword]   = useState('password123')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      navigate(user?.role === 'patient' ? '/portal' : '/dashboard')
    } catch {
      setError('Invalid credentials. Try: dr.smith / password123')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (u) => {
    setUsername(u)
    setLoading(true)
    try {
      const user = await login(u, 'password123')
      navigate(user?.role === 'patient' ? '/portal' : '/dashboard')
    }
    catch { setError('Start Docker first: docker-compose up -d') }
    finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="orb orb1" /><div className="orb orb2" />
        <div className="login-grid" />
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <span className="logo-icon">🏥</span>
            <div>
              <h1 className="login-title">SHMS</h1>
              <p className="login-sub">Secure Hospital Management System</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="lf-group">
              <label>Username</label>
              <input value={username} onChange={e=>setUsername(e.target.value)}
                placeholder="dr.smith" required />
            </div>
            <div className="lf-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In Securely →'}
            </button>
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 }}>Forgot password?</Link>
            </div>
          </form>

          <div className="quick-logins">
            <p className="ql-label">Quick Login (Demo)</p>
            <div className="ql-grid">
              {['dr.smith','nurse.jones','admin.lee','superadmin'].map(u=>(
                <button key={u} className="ql-btn" onClick={()=>quickLogin(u)}>
                  {u === 'dr.smith' ? '👨‍⚕️ GP' : u === 'nurse.jones' ? '👩‍⚕️ Nurse' : u === 'admin.lee' ? '🖥 Admin' : '🛡 Superadmin'}
                </button>
              ))}
            </div>
          </div>

          <div className="login-badge">🔒 TLS 1.3 · JWT · OPA · FHIR R4</div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import '../components/ui.css'
import './Login.css'

export default function ActivateAccount() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!token) {
      setErrorMsg('Activation token is missing from this link.')
      return
    }
    if (!username || !password) {
      setErrorMsg('Username and password are required.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/patients/activate/', { token, username, password })
      setSuccessMsg('Account activated successfully. You can now sign in.')
      setTimeout(() => navigate('/patient-login'), 1200)
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to activate account.')
    } finally {
      setLoading(false)
    }
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
            <span className="logo-icon">🔐</span>
            <div>
              <h1 className="login-title">Activate Account</h1>
              <p className="login-sub">Create your patient portal credentials</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="lf-group">
              <label>Username</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="patient.username" required />
            </div>
            <div className="lf-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" required />
            </div>
            <div className="lf-group">
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
            </div>

            {errorMsg && <div className="login-error">{errorMsg}</div>}
            {successMsg && <div className="notice notice-success">{successMsg}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Activating...' : 'Activate Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

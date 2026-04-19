import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import '../components/ui.css'
import './Login.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
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
      setErrorMsg('Reset token is missing from this link.')
      return
    }
    if (!password) {
      setErrorMsg('New password is required.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/patients/reset-password/', { token, password })
      setSuccessMsg('Password reset successful. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to reset password.')
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
            <span className="logo-icon">🔒</span>
            <div>
              <h1 className="login-title">Reset Password</h1>
              <p className="login-sub">Set a new password for your patient account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="lf-group">
              <label>New Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" required />
            </div>
            <div className="lf-group">
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            {successMsg && <div className="notice notice-success">{successMsg}</div>}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

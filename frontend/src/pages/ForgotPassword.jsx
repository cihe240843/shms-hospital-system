import { useState } from 'react'
import api from '../api/client'
import '../components/ui.css'
import './Login.css'

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!identifier) {
      setErrorMsg('Enter your username or email.')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/patients/request-password-reset/', { identifier })
      setSuccessMsg('If an account exists, a reset link has been sent.')
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to request password reset.')
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
            <span className="logo-icon">🔁</span>
            <div>
              <h1 className="login-title">Forgot Password</h1>
              <p className="login-sub">Request a patient password reset link</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="lf-group">
              <label>Username or Email</label>
              <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="patient username or email" required />
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            {successMsg && <div className="notice notice-success">{successMsg}</div>}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

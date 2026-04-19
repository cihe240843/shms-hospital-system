import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import '../components/ui.css'
import './Login.css'

export default function UnlockAccount() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const userId = params.get('user') || ''
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token || !userId) {
      setErrorMsg('Invalid unlock link. Missing token or user ID.')
      return
    }
  }, [token, userId])

  const handleVerify = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!token || !userId) {
      setErrorMsg('Invalid unlock link.')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/audit/unlock/verify/', {
        token,
        user_id: parseInt(userId, 10)
      })
      setSuccessMsg('Your account has been unlocked successfully!')
      setVerified(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      const detail = e.response?.data?.detail || 'Unable to unlock account. Please try again.'
      setErrorMsg(detail)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setErrorMsg('')
    setSuccessMsg('')

    if (!userId) {
      setErrorMsg('Invalid unlock link.')
      return
    }

    setResending(true)
    try {
      const { data } = await api.post('/api/audit/unlock/resend/', {
        user_id: parseInt(userId, 10)
      })
      setSuccessMsg(data?.detail || 'Unlock verification email resent.')
    } catch (e) {
      const retry = e.response?.data?.retry_seconds
      const detail = e.response?.data?.detail || 'Unable to resend unlock email.'
      setErrorMsg(retry ? `${detail} Try again in ${retry}s.` : detail)
    } finally {
      setResending(false)
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
            <span className="logo-icon">🔓</span>
            <div>
              <h1 className="login-title">Unlock Account</h1>
              <p className="login-sub">Verify your identity to regain access</p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="login-form">
            <div className="unlock-info">
              <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
              <p>Click the button below to verify and unlock your account.</p>
            </div>

            {errorMsg && <div className="login-error">{errorMsg}</div>}
            {successMsg && <div className="notice notice-success">{successMsg}</div>}

            <button
              type="submit"
              disabled={loading || verified || !token || !userId}
              className="login-btn"
            >
              {loading ? '🔄 Verifying...' : verified ? '✓ Account Unlocked' : '🔓 Unlock My Account'}
            </button>

            <button
              type="button"
              disabled={resending || verified || !userId}
              className="login-btn"
              style={{ marginTop: '10px', background: '#2b3c52' }}
              onClick={handleResend}
            >
              {resending ? '📨 Sending...' : '📨 Resend Unlock Link'}
            </button>

            <div className="login-footer">
              <p>Didn't request this? Your account is still locked and can only be unlocked by our support team.</p>
              <a href="/login" className="login-link">Back to Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

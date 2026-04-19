import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('dr.smith')
  const [password, setPassword]   = useState('password123')
  const [otp, setOtp] = useState('')
  const [challengeToken, setChallengeToken] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const { initiateLogin, verifyLogin } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!mfaStep) {
        const data = await initiateLogin(username, password)
        setChallengeToken(data.challenge_token)
        setMfaStep(true)
      } else {
        const user = await verifyLogin(username, challengeToken, otp)
        navigate(user?.role === 'patient' ? '/portal' : '/dashboard')
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Please try again.')
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
            <span className="logo-icon">🏥</span>
            <div>
              <h1 className="login-title">SHMS</h1>
              <p className="login-sub">Secure Hospital Management System</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {!mfaStep && (
              <>
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
              </>
            )}
            {mfaStep && (
              <>
                <div className="notice notice-success" style={{ marginBottom: 12 }}>
                  MFA code sent to your registered email.
                </div>
                <div className="lf-group">
                  <label>OTP Code</label>
                  <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="6-digit code" required />
                </div>
              </>
            )}
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Signing in…' : mfaStep ? 'Verify & Sign In' : 'Sign In Securely →'}
            </button>
            {mfaStep && (
              <div style={{ marginTop: 10, textAlign: 'left' }}>
                <button type="button" className="ql-btn" onClick={() => { setMfaStep(false); setOtp(''); setChallengeToken('') }}>
                  Back
                </button>
              </div>
            )}
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 }}>Forgot password?</Link>
            </div>
          </form>

          <div className="quick-logins">
            <p className="ql-label">MFA Enabled</p>
            <div className="login-badge">Enter username/password, then verify email OTP.</div>
          </div>

          <div className="login-badge">🔒 TLS 1.3 · JWT · OPA · FHIR R4</div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login({ audience = 'staff' }) {
  const isPatientPortal = audience === 'patient'
  const [username, setUsername] = useState(isPatientPortal ? '' : 'dr.smith')
  const [password, setPassword]   = useState(isPatientPortal ? '' : 'password123')
  const [otp, setOtp] = useState('')
  const [challengeToken, setChallengeToken] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const { initiateLogin, verifyLogin, logout } = useAuth()
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
        const loggedInAsPatient = user?.role === 'patient'

        if (isPatientPortal && !loggedInAsPatient) {
          logout()
          setMfaStep(false)
          setOtp('')
          setChallengeToken('')
          setError('This portal is for patient accounts only. Please use Staff Login.')
          return
        }

        if (!isPatientPortal && loggedInAsPatient) {
          logout()
          setMfaStep(false)
          setOtp('')
          setChallengeToken('')
          setError('This portal is for staff accounts only. Please use Patient Login.')
          return
        }

        navigate(loggedInAsPatient ? '/portal' : '/dashboard')
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`login-page ${isPatientPortal ? 'patient-portal' : 'staff-portal'}`}>
      <div className="login-bg">
        <div className="orb orb1" /><div className="orb orb2" />
        {isPatientPortal && <div className="patient-wave" />}
        <div className="login-grid" />
      </div>
      <div className={`login-container ${isPatientPortal ? 'patient-layout' : ''}`}>
        {isPatientPortal && (
          <section className="patient-brand-panel">
            <p className="patient-eyebrow">Patient Services</p>
            <h2>Your care, one secure portal.</h2>
            <p>
              View upcoming appointments, review clinical updates, and receive important
              account alerts from SHMS in one place.
            </p>
            <div className="patient-feature-list">
              <span>Appointment reminders</span>
              <span>Secure OTP sign-in</span>
              <span>FHIR-backed records</span>
            </div>
          </section>
        )}
        <div className="login-card">
          <div className="login-logo">
            <span className="logo-icon">🏥</span>
            <div>
              <h1 className="login-title">{isPatientPortal ? 'SHMS Patient Portal' : 'SHMS Staff Login'}</h1>
              <p className="login-sub">{isPatientPortal ? 'Access your appointments, records, and updates' : 'Secure Hospital Management System'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {!mfaStep && (
              <>
                <div className="lf-group">
                  <label>Username</label>
                  <input value={username} onChange={e=>setUsername(e.target.value)}
                    placeholder={isPatientPortal ? 'patient.username' : 'dr.smith'} required />
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
              {isPatientPortal && (
                <Link to="/forgot-password" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 }}>Forgot password?</Link>
              )}
            </div>
          </form>

          <div className="quick-logins">
            <p className="ql-label">{isPatientPortal ? 'Patient Access' : 'Staff Access'}</p>
            <div className="login-badge">Enter username/password, then verify email OTP.</div>
            <div className="portal-switch-link">
              {isPatientPortal ? (
                <Link to="/staff-login">
                  Staff login
                </Link>
              ) : (
                <Link to="/patient-login">
                  Patient login
                </Link>
              )}
            </div>
          </div>

          <div className="login-badge">🔒 TLS 1.3 · JWT · OPA · FHIR R4</div>
        </div>
      </div>
    </div>
  )
}

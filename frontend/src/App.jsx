import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Vitals from './pages/Vitals'
import Billing from './pages/Billing'
import Inventory from './pages/Inventory'
import AdminPanel from './pages/AdminPanel'
import ActivateAccount from './pages/ActivateAccount'
import PatientPortal from './pages/PatientPortal'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import UnlockAccount from './pages/UnlockAccount'

const PAGE_ROLES = {
  dashboard: ['gp', 'nurse', 'admin', 'superadmin'],
  portal: ['patient'],
  patients: ['gp', 'nurse', 'admin'],
  appointments: ['gp', 'nurse', 'admin'],
  vitals: ['gp', 'nurse'],
  billing: ['admin'],
  inventory: ['admin'],
  admin: ['superadmin'],
}

function ProtectedRoute({ page, children }) {
  const { user, role } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const allowed = PAGE_ROLES[page]
  if (allowed && !allowed.includes(role)) {
    return <Navigate to={role === 'patient' ? '/portal' : '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  const { user, role } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/activate" element={<ActivateAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unlock-account" element={<UnlockAccount />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route element={<Layout />}>
        <Route path="/dashboard"   element={<ProtectedRoute page="dashboard">{role === 'patient' ? <Navigate to="/portal" /> : <Dashboard />}</ProtectedRoute>} />
        <Route path="/portal"      element={<ProtectedRoute page="portal"><PatientPortal /></ProtectedRoute>} />
        <Route path="/patients"    element={<ProtectedRoute page="patients"><Patients /></ProtectedRoute>} />
        <Route path="/appointments"element={<ProtectedRoute page="appointments"><Appointments /></ProtectedRoute>} />
        <Route path="/vitals"      element={<ProtectedRoute page="vitals"><Vitals /></ProtectedRoute>} />
        <Route path="/billing"     element={<ProtectedRoute page="billing"><Billing /></ProtectedRoute>} />
        <Route path="/inventory"   element={<ProtectedRoute page="inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/admin"       element={<ProtectedRoute page="admin"><AdminPanel /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

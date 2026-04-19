import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const NAV = [
  { path:'/dashboard',    icon:'⊞', label:'Dashboard',    roles:['gp','nurse','admin','superadmin'] },
  { path:'/portal',       icon:'🧾', label:'My Portal',    roles:['patient'] },
  { path:'/patients',     icon:'👤', label:'Patients',     roles:['gp','nurse','admin'] },
  { path:'/appointments', icon:'📅', label:'Appointments', roles:['gp','nurse','admin'] },
  { path:'/vitals',       icon:'💓', label:'Vitals', roles:['gp','nurse'] },
  { path:'/billing',      icon:'💳', label:'Billing',      roles:['admin'] },
  { path:'/inventory',    icon:'📦', label:'Inventory',    roles:['admin'] },
  { path:'/admin',        icon:'🛡', label:'Admin Panel',  roles:['superadmin'] },
]

const ROLE_NAMES = { gp:'General Practitioner', nurse:'Nurse', admin:'Admin', superadmin:'Super Admin', patient:'Patient' }

function prettyUsername(username) {
  if (!username) return ''
  return username
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getDisplayName(user, role) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  if (user?.username) return prettyUsername(user.username)
  return ROLE_NAMES[role] || 'User'
}

function getInitials(username, role) {
  if (username) {
    const parts = username.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase()
  }
  return (ROLE_NAMES[role] || 'U').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function Layout() {
  const { user, role, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const displayName = getDisplayName(user, role)
  const initials = getInitials(user?.username, role)

  const visibleNav = NAV.filter(n => n.roles.includes(role))

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="app-shell">
      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">🏥</span>
            <div>
              <div className="sidebar-title">SHMS</div>
              <div className="sidebar-sub">Secure · v2.0</div>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role-badge">{role?.toUpperCase()}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">// Navigation</div>
          {visibleNav.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>⏻</span> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <div className="topbar-brand">SHMS</div>
          </div>
          <div className="topbar-right">
            <div className="topbar-role">{(role || 'user').toUpperCase()}</div>
            <div className="topbar-user">{displayName}</div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import '../components/ui.css'
import './Dashboard.css'

const STATS = {
  gp:         [{icon:'👤',color:'teal',label:'Total Patients',key:'patients'},{icon:'📅',color:'blue',label:"Today's Appointments",val:'12'},{icon:'💓',color:'green',label:'Vitals Recorded',val:'34'},{icon:'⚠️',color:'amber',label:'Follow-ups Due',val:'3'}],
  nurse:      [{icon:'💓',color:'teal',label:'Vitals Today',val:'18'},{icon:'📅',color:'blue',label:'Appointments',val:'12'},{icon:'👤',color:'green',label:'Active Patients',key:'patients'},{icon:'⚠️',color:'red',label:'High BP Alerts',val:'2'}],
  admin:      [{icon:'💳',color:'teal',label:'Monthly Revenue',val:'$48K'},{icon:'📋',color:'amber',label:'Unpaid Invoices',key:'invoices'},{icon:'⚠️',color:'red',label:'Low Stock Items',val:'3'},{icon:'📦',color:'blue',label:'Inventory Items',key:'inventory'}],
  superadmin: [{icon:'👤',color:'teal',label:'Total Patients',key:'patients'},{icon:'👥',color:'blue',label:'Active Users',val:'5'},{icon:'📋',color:'green',label:'Audit Entries',key:'audit'},{icon:'🛡',color:'amber',label:'Chain Integrity',val:'PASS'}],
}

export default function Dashboard() {
  const { role } = useAuth()
  const navigate  = useNavigate()
  const [counts, setCounts] = useState({})

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [p, i, a, au] = await Promise.allSettled([
          api.get('/api/patients/'), api.get('/api/inventory/'),
          api.get('/api/billing/'),  api.get('/api/audit/'),
        ])
        setCounts({
          patients:  p.status==='fulfilled'  ? p.value.data.count  ?? p.value.data.length : '—',
          inventory: i.status==='fulfilled'  ? i.value.data.count  ?? i.value.data.length : '—',
          invoices:  a.status==='fulfilled'  ? a.value.data.count  ?? a.value.data.length : '—',
          audit:     au.status==='fulfilled' ? au.value.data.count ?? au.value.data.length : '—',
        })
      } catch {}
    }
    fetchCounts()
  }, [])

  const stats = STATS[role] || STATS.gp

  return (
    <div className="module-page dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-desc">Welcome back. Here's your overview.</p>
        </div>
      </div>

      <div className="stat-cards">
        {stats.map((s,i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon si-${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-number">{s.key ? (counts[s.key] ?? '…') : s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-hd">
            <h3>Recent Patients</h3>
            <button className="link-btn" onClick={()=>navigate('/patients')}>View All →</button>
          </div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>DOB</th><th>Status</th></tr></thead>
            <tbody>
              {[['Jane Cooper','12 Mar 1985','Active'],['Robert Fox','03 Sep 1972','Active'],['Emily Walsh','27 Jul 1990','Follow-up'],['Mark Johnson','15 Jan 1968','Admitted']].map(([n,d,s])=>(
                <tr key={n}><td>{n}</td><td>{d}</td><td><span className={`badge badge-${s==='Active'?'green':s==='Admitted'?'blue':'amber'}`}>{s}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dash-card">
          <div className="dash-card-hd">
            <h3>Today's Appointments</h3>
            <button className="link-btn" onClick={()=>navigate('/appointments')}>View All →</button>
          </div>
          <div className="appt-list">
            {[['09:00','Jane Cooper','GP Consult'],['10:30','Robert Fox','Check-up'],['11:00','Emily Walsh','Follow-up'],['14:00','Sara Lee','GP Consult'],['15:30','Tom Hall','Results']].map(([t,n,type])=>(
              <div key={t} className="appt-row">
                <span className="appt-time">{t}</span>
                <span className="appt-name">{n}</span>
                <span className="badge badge-blue">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

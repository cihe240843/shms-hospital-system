import { useEffect, useState } from 'react'
import api from '../api/client'
import { PageHeader, Spinner, Badge } from '../components/ui'
import '../components/ui.css'

export default function PatientPortal() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const load = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await api.get('/api/patients/my-portal/')
      setData(res.data)
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to load patient portal data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const payInvoice = async (id) => {
    try {
      await api.post(`/api/billing/${id}/mark_paid/`)
      load()
    } catch {
      setErrorMsg('Unable to process payment for invoice.')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="module-page">
      <PageHeader title="My Portal" desc="View your appointments, reports, and bills" />
      {errorMsg && <div className="notice notice-error">{errorMsg}</div>}

      <div className="card">
        <h3 style={{ marginBottom: 10 }}>Profile</h3>
        {data?.patient ? (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{data.patient.first_name} {data.patient.last_name}</span></div>
            <div className="detail-row"><span className="detail-label">DOB</span><span className="detail-value">{data.patient.dob}</span></div>
            <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{data.patient.email || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Doctor</span><span className="detail-value">{data.patient.primary_doctor_name || '-'}</span></div>
          </div>
        ) : <div className="empty-state">No profile found.</div>}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Appointment</th><th>Doctor</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {(data?.appointments || []).length === 0
              ? <tr><td colSpan={4}><div className="empty-state">No appointments yet.</div></td></tr>
              : data.appointments.map(a => (
                <tr key={a.id}>
                  <td>{a.appointment_type}</td>
                  <td>{a.doctor_name || '-'}</td>
                  <td>{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '-'}</td>
                  <td><Badge type={a.status === 'done' ? 'blue' : a.status === 'cancelled' ? 'red' : 'green'}>{a.status}</Badge></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Description</th><th>Amount</th><th>Issued</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {(data?.invoices || []).length === 0
              ? <tr><td colSpan={5}><div className="empty-state">No invoices yet.</div></td></tr>
              : data.invoices.map(i => (
                <tr key={i.id}>
                  <td>{i.description}</td>
                  <td>${parseFloat(i.amount || 0).toFixed(2)}</td>
                  <td>{i.issued_at ? new Date(i.issued_at).toLocaleDateString() : '-'}</td>
                  <td><Badge type={i.status === 'paid' ? 'green' : 'amber'}>{i.status}</Badge></td>
                  <td>{i.status === 'unpaid' ? <button className="act-btn act-edit" onClick={() => payInvoice(i.id)}>Pay Now</button> : '-'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

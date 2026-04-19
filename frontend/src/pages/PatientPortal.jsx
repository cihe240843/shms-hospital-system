import { useEffect, useState } from 'react'
import api from '../api/client'
import { PageHeader, Spinner, Badge } from '../components/ui'
import '../components/ui.css'
import './PatientPortal.css'

export default function PatientPortal() {
  const [data, setData] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [requestForm, setRequestForm] = useState({ doctor_id: '', scheduled_at: '', appointment_type: 'GP Consult', notes: '' })
  const [rescheduleForm, setRescheduleForm] = useState({ appointmentId: '', scheduled_at: '', reason: '' })
  const [cancelForm, setCancelForm] = useState({ appointmentId: '', reason: '' })

  const appointmentTypes = ['GP Consult', 'Check-up', 'Follow-up', 'Results', 'Specialist Referral']

  const extractError = (e, fallback) => {
    const detail = e?.response?.data?.detail
    if (typeof detail === 'string' && detail) return detail
    const payload = e?.response?.data
    if (payload && typeof payload === 'object') {
      const first = Object.values(payload)[0]
      if (Array.isArray(first) && first.length) return String(first[0])
      if (typeof first === 'string') return first
    }
    return fallback
  }

  const load = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [portalRes, doctorsRes] = await Promise.all([
        api.get('/api/patients/my-portal/'),
        api.get('/api/audit/doctors/'),
      ])
      setData(portalRes.data)
      setDoctors(Array.isArray(doctorsRes.data) ? doctorsRes.data : [])
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to load patient portal data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetMessages = () => {
    setErrorMsg('')
    setSuccessMsg('')
  }

  const bookedAppointments = (data?.appointments || []).filter(a => a.status === 'booked')

  const requestAppointment = async () => {
    if (!requestForm.doctor_id || !requestForm.scheduled_at) {
      setErrorMsg('Doctor and date/time are required for appointment request.')
      return
    }
    setSubmitting(true)
    resetMessages()
    try {
      await api.post('/api/appointments/patient-request/', {
        doctor_id: requestForm.doctor_id,
        scheduled_at: new Date(requestForm.scheduled_at).toISOString(),
        appointment_type: requestForm.appointment_type,
        notes: requestForm.notes,
      })
      setRequestForm({ doctor_id: '', scheduled_at: '', appointment_type: 'GP Consult', notes: '' })
      setSuccessMsg('Appointment request submitted successfully.')
      await load()
    } catch (e) {
      setErrorMsg(extractError(e, 'Unable to request appointment.'))
    } finally {
      setSubmitting(false)
    }
  }

  const rescheduleAppointment = async () => {
    if (!rescheduleForm.appointmentId || !rescheduleForm.scheduled_at) {
      setErrorMsg('Select a booked appointment and new date/time to reschedule.')
      return
    }
    setSubmitting(true)
    resetMessages()
    try {
      await api.post(`/api/appointments/${rescheduleForm.appointmentId}/patient-reschedule/`, {
        scheduled_at: new Date(rescheduleForm.scheduled_at).toISOString(),
        reason: rescheduleForm.reason,
      })
      setRescheduleForm({ appointmentId: '', scheduled_at: '', reason: '' })
      setSuccessMsg('Reschedule request submitted.')
      await load()
    } catch (e) {
      setErrorMsg(extractError(e, 'Unable to reschedule appointment.'))
    } finally {
      setSubmitting(false)
    }
  }

  const cancelAppointment = async () => {
    if (!cancelForm.appointmentId) {
      setErrorMsg('Select a booked appointment to cancel.')
      return
    }
    setSubmitting(true)
    resetMessages()
    try {
      await api.post(`/api/appointments/${cancelForm.appointmentId}/patient-cancel/`, {
        reason: cancelForm.reason,
      })
      setCancelForm({ appointmentId: '', reason: '' })
      setSuccessMsg('Appointment cancelled successfully.')
      await load()
    } catch (e) {
      setErrorMsg(extractError(e, 'Unable to cancel appointment.'))
    } finally {
      setSubmitting(false)
    }
  }

  const payInvoice = async (id) => {
    setSubmitting(true)
    resetMessages()
    try {
      await api.post(`/api/billing/${id}/mark_paid/`)
      setSuccessMsg('Invoice marked as paid.')
      await load()
    } catch (e) {
      setErrorMsg(extractError(e, 'Unable to process payment for invoice.'))
    } finally {
      setSubmitting(false)
    }
  }

  const openInvoice = async (id) => {
    resetMessages()
    try {
      const res = await api.get(`/api/billing/${id}/`)
      setSelectedInvoice(res.data)
    } catch (e) {
      setErrorMsg(extractError(e, 'Unable to load invoice details.'))
    }
  }

  const downloadInvoice = async (id) => {
    resetMessages()
    try {
      const res = await api.get(`/api/billing/${id}/download/`, { responseType: 'blob' })
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'text/plain' }))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `invoice-${id}.txt`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (e) {
      setErrorMsg(extractError(e, 'Unable to download invoice summary.'))
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="module-page patient-portal-page">
      <PageHeader title="My Portal" desc="View your appointments, reports, and bills" />
      {errorMsg && <div className="notice notice-error">{errorMsg}</div>}
      {successMsg && <div className="notice notice-success">{successMsg}</div>}

      <div className="card portal-profile-card">
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

      <div className="portal-actions-grid">
        <div className="card">
          <h3>Request Appointment</h3>
          <div className="portal-form-grid">
            <label>Doctor
              <select value={requestForm.doctor_id} onChange={e => setRequestForm({ ...requestForm, doctor_id: e.target.value })}>
                <option value="">Select doctor...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.display_name}</option>)}
              </select>
            </label>
            <label>Date & Time
              <input type="datetime-local" value={requestForm.scheduled_at} onChange={e => setRequestForm({ ...requestForm, scheduled_at: e.target.value })} />
            </label>
            <label>Appointment Type
              <select value={requestForm.appointment_type} onChange={e => setRequestForm({ ...requestForm, appointment_type: e.target.value })}>
                {appointmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>Notes
              <textarea rows={2} value={requestForm.notes} onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })} placeholder="Optional message for clinic" />
            </label>
          </div>
          <button className="act-btn act-edit" disabled={submitting} onClick={requestAppointment}>Request Appointment</button>
        </div>

        <div className="card">
          <h3>Reschedule / Cancel</h3>
          <div className="portal-form-grid">
            <label>Booked Appointment
              <select value={rescheduleForm.appointmentId} onChange={e => setRescheduleForm({ ...rescheduleForm, appointmentId: e.target.value })}>
                <option value="">Select appointment...</option>
                {bookedAppointments.map(a => (
                  <option key={a.id} value={a.id}>
                    {(a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '-') + ' - ' + (a.appointment_type || 'Appointment')}
                  </option>
                ))}
              </select>
            </label>
            <label>New Date & Time
              <input type="datetime-local" value={rescheduleForm.scheduled_at} onChange={e => setRescheduleForm({ ...rescheduleForm, scheduled_at: e.target.value })} />
            </label>
            <label>Reschedule Reason
              <textarea rows={2} value={rescheduleForm.reason} onChange={e => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })} placeholder="Optional reason" />
            </label>
          </div>
          <div className="portal-inline-actions">
            <button className="act-btn act-edit" disabled={submitting} onClick={rescheduleAppointment}>Reschedule</button>
            <select value={cancelForm.appointmentId} onChange={e => setCancelForm({ ...cancelForm, appointmentId: e.target.value })}>
              <option value="">Select to cancel...</option>
              {bookedAppointments.map(a => (
                <option key={a.id} value={a.id}>
                  {(a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '-') + ' - ' + (a.appointment_type || 'Appointment')}
                </option>
              ))}
            </select>
            <input value={cancelForm.reason} onChange={e => setCancelForm({ ...cancelForm, reason: e.target.value })} placeholder="Cancellation reason (optional)" />
            <button className="act-btn act-del" disabled={submitting} onClick={cancelAppointment}>Cancel Appointment</button>
          </div>
        </div>
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
                  <td>
                    <div className="portal-inline-actions compact">
                      <button className="act-btn act-view" onClick={() => openInvoice(i.id)}>View</button>
                      <button className="act-btn" onClick={() => downloadInvoice(i.id)}>Download</button>
                      {i.status === 'unpaid' ? <button className="act-btn act-edit" onClick={() => payInvoice(i.id)}>Pay Now</button> : null}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <div className="card">
          <div className="portal-card-header">
            <h3>Invoice Detail</h3>
            <button className="act-btn" onClick={() => setSelectedInvoice(null)}>Close</button>
          </div>
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">Invoice ID</span><span className="detail-value">{selectedInvoice.id}</span></div>
            <div className="detail-row"><span className="detail-label">Description</span><span className="detail-value">{selectedInvoice.description}</span></div>
            <div className="detail-row"><span className="detail-label">Amount</span><span className="detail-value">${parseFloat(selectedInvoice.amount || 0).toFixed(2)}</span></div>
            <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{selectedInvoice.status}</span></div>
            <div className="detail-row"><span className="detail-label">Issued</span><span className="detail-value">{selectedInvoice.issued_at ? new Date(selectedInvoice.issued_at).toLocaleString() : '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Paid</span><span className="detail-value">{selectedInvoice.paid_at ? new Date(selectedInvoice.paid_at).toLocaleString() : '-'}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

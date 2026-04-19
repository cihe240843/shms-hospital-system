import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Badge, PageHeader, Modal, FormGroup, Input, BtnPrimary, BtnSecondary, Spinner, Select, Textarea } from '../components/ui'
import '../components/ui.css'
import './Appointments.css'

export default function Appointments() {
  const { role } = useAuth()
  const [appts, setAppts]     = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm]         = useState({ patient:'', doctor:'', scheduled_at:'', appointment_type:'GP Consult', notes:'' })

  const load = async () => {
    setLoading(true)
    try {
      const [a, p, d] = await Promise.all([
        api.get('/api/appointments/'),
        api.get('/api/patients/'),
        api.get('/api/audit/doctors/'),
      ])
      setAppts(Array.isArray(a.data) ? a.data : a.data.results ?? [])
      setPatients(Array.isArray(p.data) ? p.data : p.data.results ?? [])
      setDoctors(Array.isArray(d.data) ? d.data : [])
    } catch {
      setErrorMsg('Failed to load appointments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const statusBadge = s => ({ booked:<Badge type="green">Booked</Badge>, done:<Badge type="blue">Done</Badge>, cancelled:<Badge type="red">Cancelled</Badge> }[s] || <Badge>{s}</Badge>)
  const bookedCount = appts.filter(a => a.status === 'booked').length
  const doneCount = appts.filter(a => a.status === 'done').length

  const resetMessages = () => {
    setErrorMsg('')
    setSuccessMsg('')
  }

  const asLocalInputDate = (value) => {
    if (!value) return ''
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  }

  const handleAdd = async () => {
    if (!form.patient || !form.scheduled_at) {
      setErrorMsg('Patient and date/time are required.')
      return
    }
    if (['admin', 'superadmin'].includes(role) && !form.doctor) {
      setErrorMsg('Please select a doctor for this appointment.')
      return
    }
    setSaving(true)
    resetMessages()
    try {
      const dt = form.scheduled_at ? new Date(form.scheduled_at).toISOString() : ''
      await api.post('/api/appointments/', { ...form, scheduled_at: dt })
      setModal(false)
      setForm({ patient:'', doctor:'', scheduled_at:'', appointment_type:'GP Consult', notes:'' })
      setSuccessMsg('Appointment created successfully.')
      load()
    } catch {
      setErrorMsg('Unable to save appointment.')
    } finally {
      setSaving(false)
    }
  }

  const openView = (appt) => {
    setSelected(appt)
    setViewModal(true)
    resetMessages()
  }

  const openEdit = (appt) => {
    setSelected(appt)
    setForm({
      patient: appt.patient || '',
      doctor: appt.doctor || '',
      scheduled_at: asLocalInputDate(appt.scheduled_at),
      appointment_type: appt.appointment_type || 'GP Consult',
      notes: appt.notes || '',
      status: appt.status || 'booked',
    })
    setEditModal(true)
    resetMessages()
  }

  const handleUpdate = async () => {
    if (!selected) return
    if (!form.patient || !form.scheduled_at) {
      setErrorMsg('Patient and date/time are required.')
      return
    }
    if (['admin', 'superadmin'].includes(role) && !form.doctor) {
      setErrorMsg('Please select a doctor for this appointment.')
      return
    }
    setSaving(true)
    resetMessages()
    try {
      const dt = form.scheduled_at ? new Date(form.scheduled_at).toISOString() : ''
      await api.put(`/api/appointments/${selected.id}/`, {
        ...selected,
        patient: form.patient,
        doctor: form.doctor || null,
        scheduled_at: dt,
        appointment_type: form.appointment_type,
        notes: form.notes || '',
        status: form.status || 'booked',
      })
      setEditModal(false)
      setSelected(null)
      setSuccessMsg('Appointment updated successfully.')
      load()
    } catch {
      setErrorMsg('Unable to update appointment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-page appointments-page">
      <PageHeader title="Appointments" desc="Schedule and manage appointments"
        action={<BtnPrimary onClick={()=>setModal(true)}>+ Book Appointment</BtnPrimary>} />

      <div className="appts-highlights">
        <div className="ah-card">
          <div className="ah-label">Total Appointments</div>
          <div className="ah-value">{appts.length}</div>
        </div>
        <div className="ah-card">
          <div className="ah-label">Booked</div>
          <div className="ah-value">{bookedCount}</div>
        </div>
        <div className="ah-card">
          <div className="ah-label">Completed</div>
          <div className="ah-value">{doneCount}</div>
        </div>
      </div>

      {errorMsg && <div className="notice notice-error">{errorMsg}</div>}
      {successMsg && <div className="notice notice-success">{successMsg}</div>}

      <div className="table-wrap appts-table-wrap">
        {loading ? <Spinner /> : (
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Date & Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {appts.length===0
                ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📅</div>No appointments yet</div></td></tr>
                : appts.map(a=>(
                  <tr key={a.id}>
                    <td><strong>{a.patient_name || '—'}</strong></td>
                    <td>{a.doctor_name || 'Unassigned'}</td>
                    <td>{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '-'}</td>
                    <td>{a.appointment_type}</td>
                    <td>{statusBadge(a.status)}</td>
                    <td><div className="action-btns"><button className="act-btn act-view" onClick={() => openView(a)}>View</button><button className="act-btn act-edit" onClick={() => openEdit(a)}>Edit</button></div></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Book Appointment"
        footer={<><BtnSecondary onClick={()=>setModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Book'}</BtnPrimary></>}>
        <FormGroup label="Patient">
          <Select value={form.patient} onChange={e=>setForm({...form,patient:e.target.value})}>
            <option value="">Select patient...</option>
            {patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Doctor">
          <Select value={form.doctor} onChange={e=>setForm({...form,doctor:e.target.value})}>
            <option value="">{role === 'gp' ? 'Auto assign current GP' : 'Select doctor...'}</option>
            {doctors.map(d=><option key={d.id} value={d.id}>{d.display_name}</option>)}
          </Select>
        </FormGroup>
        <div className="form-row">
          <FormGroup label="Date & Time"><Input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm({...form,scheduled_at:e.target.value})} /></FormGroup>
          <FormGroup label="Type">
            <Select value={form.appointment_type} onChange={e=>setForm({...form,appointment_type:e.target.value})}>
              {['GP Consult','Check-up','Follow-up','Results','Specialist Referral'].map(t=><option key={t}>{t}</option>)}
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Notes"><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes..." /></FormGroup>
      </Modal>

      <Modal
        open={viewModal}
        onClose={() => { setViewModal(false); setSelected(null) }}
        title="Appointment Details"
        footer={<BtnSecondary onClick={() => { setViewModal(false); setSelected(null) }}>Close</BtnSecondary>}
      >
        {selected && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">Patient</span><span className="detail-value">{selected.patient_name || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Doctor</span><span className="detail-value">{selected.doctor_name || 'Unassigned'}</span></div>
            <div className="detail-row"><span className="detail-label">Date & Time</span><span className="detail-value">{selected.scheduled_at ? new Date(selected.scheduled_at).toLocaleString() : '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value">{selected.appointment_type || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{selected.status || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Notes</span><span className="detail-value">{selected.notes || '-'}</span></div>
          </div>
        )}
      </Modal>

      <Modal
        open={editModal}
        onClose={() => { setEditModal(false); setSelected(null) }}
        title="Edit Appointment"
        footer={<><BtnSecondary onClick={() => { setEditModal(false); setSelected(null) }}>Cancel</BtnSecondary><BtnPrimary onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</BtnPrimary></>}
      >
        <FormGroup label="Patient">
          <Select value={form.patient} onChange={e=>setForm({...form,patient:e.target.value})}>
            <option value="">Select patient...</option>
            {patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Doctor">
          <Select value={form.doctor} onChange={e=>setForm({...form,doctor:e.target.value})}>
            <option value="">{role === 'gp' ? 'Auto assign current GP' : 'Select doctor...'}</option>
            {doctors.map(d=><option key={d.id} value={d.id}>{d.display_name}</option>)}
          </Select>
        </FormGroup>
        <div className="form-row">
          <FormGroup label="Date & Time"><Input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm({...form,scheduled_at:e.target.value})} /></FormGroup>
          <FormGroup label="Type">
            <Select value={form.appointment_type} onChange={e=>setForm({...form,appointment_type:e.target.value})}>
              {['GP Consult','Check-up','Follow-up','Results','Specialist Referral'].map(t=><option key={t}>{t}</option>)}
            </Select>
          </FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Status">
            <Select value={form.status || 'booked'} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="booked">Booked</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </FormGroup>
          <div />
        </div>
        <FormGroup label="Notes"><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes..." /></FormGroup>
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { Badge, PageHeader, Modal, FormGroup, Input, BtnPrimary, BtnSecondary, Spinner, Select } from '../components/ui'
import '../components/ui.css'
import './Patients.css'

const EMPTY_FORM = {
  first_name:'',
  last_name:'',
  dob:'',
  medicare_number:'',
  phone:'',
  email:'',
  primary_doctor:'',
}

export default function Patients() {
  const { role } = useAuth()
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const canWrite = ['gp', 'admin', 'superadmin'].includes(role)

  const resetMessages = () => {
    setErrorMsg('')
    setSuccessMsg('')
  }

  const load = async (q='') => {
    setLoading(true)
    try {
      const [p, d] = await Promise.all([
        api.get(`/api/patients/?search=${q}`),
        api.get('/api/audit/doctors/'),
      ])
      setPatients(Array.isArray(p.data) ? p.data : p.data.results ?? [])
      setDoctors(Array.isArray(d.data) ? d.data : [])
    } catch {
      setPatients([])
      setErrorMsg('Failed to load patients.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSearch = e => { setSearch(e.target.value); load(e.target.value) }

  const handleAdd = async () => {
    if (!form.first_name || !form.last_name || !form.dob) {
      setErrorMsg('First name, last name, and date of birth are required.')
      return
    }
    setSaving(true)
    resetMessages()
    try {
      await api.post('/api/patients/', form)
      setModal(false)
      setForm(EMPTY_FORM)
      setSuccessMsg('Patient created successfully.')
      load(search)
    } catch(e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to save patient. Check required fields.')
    } finally {
      setSaving(false)
    }
  }

  const openView = (patient) => {
    setSelected(patient)
    setViewModal(true)
    resetMessages()
  }

  const openEdit = (patient) => {
    setSelected(patient)
    setForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      dob: patient.dob || '',
      medicare_number: patient.medicare_number || '',
      phone: patient.phone || '',
      email: patient.email || '',
      primary_doctor: patient.primary_doctor || '',
    })
    setEditModal(true)
    resetMessages()
  }

  const handleUpdate = async () => {
    if (!selected) return
    if (!form.first_name || !form.last_name || !form.dob) {
      setErrorMsg('First name, last name, and date of birth are required.')
      return
    }
    setSaving(true)
    resetMessages()
    try {
      await api.put(`/api/patients/${selected.id}/`, { ...selected, ...form })
      setEditModal(false)
      setSelected(null)
      setSuccessMsg('Patient updated successfully.')
      load(search)
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to update patient.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this patient?')) return
    resetMessages()
    try {
      await api.delete(`/api/patients/${id}/`)
      setSuccessMsg('Patient deleted successfully.')
      load(search)
    } catch {
      setErrorMsg('Unable to delete patient.')
    }
  }

  const handleSendInvite = async (patient) => {
    resetMessages()
    try {
      await api.post(`/api/patients/${patient.id}/send-invite/`)
      setSuccessMsg(`Invite sent to ${patient.email}.`)
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to send patient invitation.')
    }
  }

  const statusBadge = p => p.is_active ? <Badge type="green">Active</Badge> : <Badge type="gray">Inactive</Badge>
  const activeCount = patients.filter(p => p.is_active).length

  return (
    <div className="module-page patients-page">
      <PageHeader
        title="Patients" desc="Manage patient records"
        action={canWrite && <BtnPrimary onClick={()=>{ setForm(EMPTY_FORM); setModal(true); resetMessages() }}>+ New Patient</BtnPrimary>}
      />

      <div className="patients-highlights">
        <div className="ph-card">
          <div className="ph-label">Total Records</div>
          <div className="ph-value">{patients.length}</div>
        </div>
        <div className="ph-card">
          <div className="ph-label">Active Patients</div>
          <div className="ph-value">{activeCount}</div>
        </div>
      </div>

      <div className="table-toolbar patients-toolbar">
        <input className="search-input" placeholder="Search by name..." value={search} onChange={handleSearch} />
      </div>

      {errorMsg && <div className="notice notice-error">{errorMsg}</div>}
      {successMsg && <div className="notice notice-success">{successMsg}</div>}

      <div className="table-wrap patients-table-wrap">
        {loading ? <Spinner /> : (
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>DOB</th><th>Medicare</th><th>Doctor</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {patients.length === 0
                ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">👤</div>No patients found</div></td></tr>
                : patients.map(p => (
                  <tr key={p.id}>
                    <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text3)'}}>{String(p.id).slice(0,8)}...</td>
                    <td><strong>{p.first_name} {p.last_name}</strong></td>
                    <td>{p.dob}</td>
                    <td>{p.medicare_number || '-'}</td>
                    <td>{p.primary_doctor_name || '-'}</td>
                    <td>{statusBadge(p)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="act-btn act-view" onClick={() => openView(p)}>View</button>
                        {canWrite && <button className="act-btn act-edit" onClick={() => openEdit(p)}>Edit</button>}
                        {['admin', 'superadmin'].includes(role) && <button className="act-btn act-edit" onClick={() => handleSendInvite(p)}>Invite</button>}
                        {role==='superadmin' && <button className="act-btn act-delete" onClick={()=>handleDelete(p.id)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Register New Patient"
        footer={<><BtnSecondary onClick={()=>setModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Register Patient'}</BtnPrimary></>}>
        <div className="form-row">
          <FormGroup label="First Name"><Input value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} placeholder="Jane" /></FormGroup>
          <FormGroup label="Last Name"><Input value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} placeholder="Cooper" /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Date of Birth"><Input type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})} /></FormGroup>
          <FormGroup label="Medicare No."><Input value={form.medicare_number} onChange={e=>setForm({...form,medicare_number:e.target.value})} placeholder="1234 56789 0" /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Phone"><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0400 000 000" /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="patient@email.com" /></FormGroup>
        </div>
        <FormGroup label="Primary Doctor">
          <Select value={form.primary_doctor} onChange={e=>setForm({...form,primary_doctor:e.target.value})}>
            <option value="">Auto assign</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.display_name}</option>)}
          </Select>
        </FormGroup>
      </Modal>

      <Modal
        open={viewModal}
        onClose={() => { setViewModal(false); setSelected(null) }}
        title="Patient Details"
        footer={<BtnSecondary onClick={() => { setViewModal(false); setSelected(null) }}>Close</BtnSecondary>}
      >
        {selected && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{selected.first_name} {selected.last_name}</span></div>
            <div className="detail-row"><span className="detail-label">Date of Birth</span><span className="detail-value">{selected.dob || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Medicare</span><span className="detail-value">{selected.medicare_number || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{selected.phone || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{selected.email || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Primary Doctor</span><span className="detail-value">{selected.primary_doctor_name || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{selected.is_active ? 'Active' : 'Inactive'}</span></div>
          </div>
        )}
      </Modal>

      <Modal
        open={editModal}
        onClose={() => { setEditModal(false); setSelected(null) }}
        title="Edit Patient"
        footer={<><BtnSecondary onClick={() => { setEditModal(false); setSelected(null) }}>Cancel</BtnSecondary><BtnPrimary onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</BtnPrimary></>}
      >
        <div className="form-row">
          <FormGroup label="First Name"><Input value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} placeholder="Jane" /></FormGroup>
          <FormGroup label="Last Name"><Input value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} placeholder="Cooper" /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Date of Birth"><Input type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})} /></FormGroup>
          <FormGroup label="Medicare No."><Input value={form.medicare_number} onChange={e=>setForm({...form,medicare_number:e.target.value})} placeholder="1234 56789 0" /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Phone"><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0400 000 000" /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="patient@email.com" /></FormGroup>
        </div>
        <FormGroup label="Primary Doctor">
          <Select value={form.primary_doctor} onChange={e=>setForm({...form,primary_doctor:e.target.value})}>
            <option value="">Unassigned</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.display_name}</option>)}
          </Select>
        </FormGroup>
      </Modal>
    </div>
  )
}

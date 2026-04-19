import { useEffect, useState } from 'react'
import api from '../api/client'
import { Badge, PageHeader, Spinner, Modal, FormGroup, Input, Select, BtnPrimary, BtnSecondary } from '../components/ui'
import '../components/ui.css'
import './AdminPanel.css'

const EMPTY_USER = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  role: 'gp',
  password: 'password123',
}

const EMPTY_PATIENT = {
  first_name: '',
  last_name: '',
  dob: '',
  medicare_number: '',
  phone: '',
  email: '',
  address: '',
  primary_doctor: '',
}

export default function AdminPanel() {
  const [tab, setTab] = useState('staff')
  const [users, setUsers] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [audit, setAudit] = useState([])
  const [security, setSecurity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [integrity, setIntegrity] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [patientModal, setPatientModal] = useState(false)
  const [patientEditModal, setPatientEditModal] = useState(false)
  const [patientViewModal, setPatientViewModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState(EMPTY_USER)
  const [patientForm, setPatientForm] = useState(EMPTY_PATIENT)

  const resetMessages = () => {
    setErrorMsg('')
    setSuccessMsg('')
  }

  const loadUsers = async () => {
    const { data } = await api.get('/api/audit/users/')
    setUsers(Array.isArray(data) ? data : [])
  }

  const loadPatients = async () => {
    const [patientsResp, doctorsResp] = await Promise.all([
      api.get('/api/patients/'),
      api.get('/api/audit/doctors/'),
    ])
    setPatients(Array.isArray(patientsResp.data) ? patientsResp.data : patientsResp.data.results ?? [])
    setDoctors(Array.isArray(doctorsResp.data) ? doctorsResp.data : [])
  }

  const loadAudit = async () => {
    const { data } = await api.get('/api/audit/')
    setAudit(Array.isArray(data) ? data : data.results ?? [])
  }

  const loadSecurity = async () => {
    const { data } = await api.get('/api/audit/security/')
    setSecurity(data)
  }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      resetMessages()
      try {
        if (tab === 'staff') {
          await loadUsers()
        } else if (tab === 'patients') {
          await loadPatients()
        } else if (tab === 'audit') {
          await loadAudit()
        } else {
          await loadSecurity()
        }
      } catch (e) {
        setErrorMsg(e.response?.data?.detail || 'Failed to load admin data.')
      }
      setLoading(false)
    }
    fetchAll()
  }, [tab])

  const verifyChain = async () => {
    setVerifying(true)
    setIntegrity(null)
    try {
      const { data } = await api.get('/api/audit/verify/')
      setIntegrity(data.status)
    } catch {
      setIntegrity('ERROR')
    }
    setVerifying(false)
  }

  const handleCreateUser = async () => {
    if (!form.username || !form.password || !form.role) {
      setErrorMsg('Username, role, and password are required.')
      return
    }

    setSaving(true)
    resetMessages()
    try {
      await api.post('/api/audit/users/', form)
      setCreateModal(false)
      setForm(EMPTY_USER)
      setSuccessMsg('User created successfully.')
      await loadUsers()
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to create user.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePatient = async () => {
    if (!patientForm.first_name || !patientForm.last_name || !patientForm.dob) {
      setErrorMsg('First name, last name, and date of birth are required.')
      return
    }

    setSaving(true)
    resetMessages()
    try {
      await api.post('/api/patients/', {
        ...patientForm,
        primary_doctor: patientForm.primary_doctor || null,
      })
      setPatientModal(false)
      setPatientForm(EMPTY_PATIENT)
      setSuccessMsg('Patient created successfully.')
      await loadPatients()
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to create patient.')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (user) => {
    setSelected(user)
    setForm({
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || 'gp',
      password: '',
      is_active: user.is_active,
    })
    setEditModal(true)
    resetMessages()
  }

  const openPatientEdit = (patient) => {
    setSelectedPatient(patient)
    setPatientForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      dob: patient.dob || '',
      medicare_number: patient.medicare_number || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      primary_doctor: patient.primary_doctor || '',
    })
    setPatientEditModal(true)
    resetMessages()
  }

  const openPatientView = (patient) => {
    setSelectedPatient(patient)
    setPatientViewModal(true)
    resetMessages()
  }

  const handleUpdateUser = async () => {
    if (!selected) return
    setSaving(true)
    resetMessages()
    try {
      await api.patch(`/api/audit/users/${selected.id}/`, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
        ...(form.password ? { password: form.password } : {}),
      })
      setEditModal(false)
      setSelected(null)
      setSuccessMsg('User updated successfully.')
      await loadUsers()
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to update user.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return
    if (!patientForm.first_name || !patientForm.last_name || !patientForm.dob) {
      setErrorMsg('First name, last name, and date of birth are required.')
      return
    }

    setSaving(true)
    resetMessages()
    try {
      await api.put(`/api/patients/${selectedPatient.id}/`, {
        ...selectedPatient,
        ...patientForm,
        primary_doctor: patientForm.primary_doctor || null,
      })
      setPatientEditModal(false)
      setSelectedPatient(null)
      setSuccessMsg('Patient updated successfully.')
      await loadPatients()
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to update patient.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePatient = async (id) => {
    if (!confirm('Delete this patient record?')) return
    resetMessages()
    try {
      await api.delete(`/api/patients/${id}/`)
      setSuccessMsg('Patient deleted successfully.')
      await loadPatients()
    } catch {
      setErrorMsg('Unable to delete patient.')
    }
  }

  const handleSendPatientInvite = async (patient) => {
    resetMessages()
    try {
      await api.post(`/api/patients/${patient.id}/send-invite/`)
      setSuccessMsg(`Invite sent to ${patient.email || patient.first_name}.`)
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to send patient invitation.')
    }
  }

  const handleUnlockAccount = async (lockedAccount) => {
    resetMessages()
    if (!window.confirm(`Unlock account for ${lockedAccount.username}?`)) {
      return
    }
    try {
      setSaving(true)
      const response = await api.post('/api/audit/unlock/request/', {
        user_id: lockedAccount.user_id || lockedAccount.id,
      })
      
      if (response.data.message?.includes('patient') || response.data.detail?.includes('patient')) {
        // Patient unlock - email sent
        setSuccessMsg(`Verification email sent to ${lockedAccount.username}. They must verify to unlock.`)
      } else {
        // Staff unlock - instant
        setSuccessMsg(`Account ${lockedAccount.username} unlocked successfully.`)
      }
      
      // Reload security data
      await loadSecurity()
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Unable to unlock account.')
    } finally {
      setSaving(false)
    }
  }

  const handleResendUnlock = async (lockedAccount) => {
    resetMessages()
    try {
      setSaving(true)
      const { data } = await api.post('/api/audit/unlock/resend/', {
        user_id: lockedAccount.id,
      })
      setSuccessMsg(data?.detail || `Unlock verification email resent to ${lockedAccount.username}.`)
    } catch (e) {
      const retry = e.response?.data?.retry_seconds
      const detail = e.response?.data?.detail || 'Unable to resend unlock email.'
      setErrorMsg(retry ? `${detail} Try again in ${retry}s.` : detail)
    } finally {
      setSaving(false)
    }
  }

  const roleBadge = r => {
    const role = (r || '').toLowerCase()
    const map = { gp:'blue', nurse:'blue', admin:'amber', superadmin:'red', patient:'gray' }
    return <Badge type={map[role] || 'gray'}>{role.toUpperCase()}</Badge>
  }

  return (
    <div className="module-page admin-page">
      <PageHeader
        title="Admin Panel"
        desc="User management · Audit log · System integrity"
        action={tab === 'staff' ? <BtnPrimary onClick={() => { setCreateModal(true); setForm(EMPTY_USER); resetMessages() }}>+ Create Staff</BtnPrimary> : tab === 'patients' ? <BtnPrimary onClick={() => { setPatientModal(true); setPatientForm(EMPTY_PATIENT); resetMessages() }}>+ New Patient</BtnPrimary> : null}
      />

      <div className="admin-tabs">
        {['staff','patients','audit','security'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'staff' ? 'Staff' : t === 'patients' ? 'Patients' : t === 'audit' ? 'Audit Log' : 'Security Analysis'}
          </button>
        ))}
      </div>

      {errorMsg && <div className="notice notice-error">{errorMsg}</div>}
      {successMsg && <div className="notice notice-success">{successMsg}</div>}

      {tab === 'staff' && (
        <div className="table-wrap">
          {loading ? <Spinner /> : (
            <table className="data-table">
              <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.length === 0
                  ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">👥</div>No users found</div></td></tr>
                  : users.map(u => (
                    <tr key={u.id}>
                      <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text3)'}}>#{u.id}</td>
                      <td><strong>{u.username}</strong></td>
                      <td>{u.email || '-'}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td><Badge type={u.is_active ? 'green' : 'gray'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td><div className="action-btns"><button className="act-btn act-edit" onClick={() => openEdit(u)}>Edit</button></div></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'patients' && (
        <div className="table-wrap">
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
                      <td><Badge type={p.is_active ? 'green' : 'gray'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td>
                        <div className="action-btns">
                          <button className="act-btn act-view" onClick={() => openPatientView(p)}>View</button>
                          <button className="act-btn act-edit" onClick={() => openPatientEdit(p)}>Edit</button>
                          <button className="act-btn act-edit" onClick={() => handleSendPatientInvite(p)}>Invite</button>
                          <button className="act-btn act-delete" onClick={() => handleDeletePatient(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <>
          <div className="audit-toolbar">
            <div className="integrity-block">
              <span className="integrity-label">Hash Chain Integrity:</span>
              {integrity === null && <span className="integrity-unknown">- not verified</span>}
              {integrity === 'PASS' && <span className="integrity-pass"><span className="dot dot-green" />PASS</span>}
              {integrity === 'TAMPERED' && <span className="integrity-fail"><span className="dot dot-red" />TAMPERED</span>}
              {integrity === 'ERROR' && <span className="integrity-fail">Connection error</span>}
            </div>
            <button className="btn-verify" onClick={verifyChain} disabled={verifying}>
              {verifying ? 'Verifying...' : 'Verify Chain'}
            </button>
          </div>

          <div className="table-wrap">
            {loading ? <Spinner /> : (
              <table className="data-table audit-tbl">
                <thead>
                  <tr><th>ID</th><th>User</th><th>Action</th><th>Resource</th><th>Resource ID</th><th>Timestamp</th><th>Row Hash</th></tr>
                </thead>
                <tbody>
                  {audit.length === 0
                    ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📋</div>No audit entries yet. Actions will appear here.</div></td></tr>
                    : audit.map(log => (
                      <tr key={log.id}>
                        <td style={{fontFamily:'monospace',fontSize:11}}>{log.id}</td>
                        <td>{log.username || '-'}</td>
                        <td>
                          <Badge type={log.action==='READ'?'blue':log.action==='WRITE'?'amber':'red'}>
                            {log.action}
                          </Badge>
                        </td>
                        <td>{log.resource}</td>
                        <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text3)'}}>{log.resource_id || '-'}</td>
                        <td style={{fontSize:12,whiteSpace:'nowrap'}}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                        <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text3)'}}>{log.row_hash?.slice(0,12)}...</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'security' && (
        <>
          <div className="security-summary-grid">
            <div className="security-summary-card"><span className="ssc-label">Status</span><span className={`ssc-value ${security?.status === 'PASS' ? 'pass' : 'warn'}`}>{security?.status || 'N/A'}</span></div>
            <div className="security-summary-card"><span className="ssc-label">Recent Events</span><span className="ssc-value">{security?.totals?.events ?? 0}</span></div>
            <div className="security-summary-card"><span className="ssc-label">Login Failures</span><span className="ssc-value warn">{security?.totals?.login_fail ?? 0}</span></div>
            <div className="security-summary-card"><span className="ssc-label">Locked Accounts</span><span className="ssc-value warn">{security?.totals?.locked_accounts ?? 0}</span></div>
          </div>

          <div className="security-grid">
            <div className="card">
              <h3 className="card-title">Suspicious Users</h3>
              {loading ? <Spinner /> : (
                <div className="security-list">
                  {(security?.suspicious_users || []).length === 0
                    ? <div className="empty-state"><div className="empty-icon">✅</div>No suspicious login patterns detected.</div>
                    : security.suspicious_users.map(item => (
                      <div key={item.username} className="security-item">
                        <div>
                          <strong>{item.username}</strong>
                          <div className="security-item-sub">Failed attempts in the last 24h</div>
                        </div>
                        <Badge type={item.risk === 'HIGH' ? 'red' : item.risk === 'MEDIUM' ? 'amber' : 'blue'}>{item.failures} · {item.risk}</Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="card-title">Top IP Addresses</h3>
              {loading ? <Spinner /> : (
                <div className="security-list">
                  {(security?.top_ips || []).length === 0
                    ? <div className="empty-state"><div className="empty-icon">🌐</div>No IP activity recorded.</div>
                    : security.top_ips.map(item => (
                      <div key={item.ip_address} className="security-item">
                        <div>
                          <strong>{item.ip_address}</strong>
                          <div className="security-item-sub">Recent events</div>
                        </div>
                        <Badge type="gray">{item.events}</Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="card security-locks-card">
            <h3 className="card-title">Locked Accounts</h3>
            {loading ? <Spinner /> : (
              <div className="security-list">
                {(security?.locked_accounts_list || []).length === 0
                  ? <div className="empty-state"><div className="empty-icon">🔓</div>No locked accounts.</div>
                  : security.locked_accounts_list.map(item => (
                    <div key={item.username} className="security-item">
                      <div>
                        <strong>{item.username}</strong>
                        <div className="security-item-sub">Locked until {item.locked_until ? new Date(item.locked_until).toLocaleString() : '-'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge type="red">{item.failed_attempts} failed</Badge>
                        {item.is_patient && (
                          <button className="btn-small btn-primary" onClick={() => handleResendUnlock(item)} disabled={saving}>
                            📨 Resend
                          </button>
                        )}
                        <button className="btn-small btn-primary" onClick={() => handleUnlockAccount(item)} disabled={saving}>
                          🔓 Unlock
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create User"
        footer={<><BtnSecondary onClick={() => setCreateModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleCreateUser} disabled={saving}>{saving ? 'Saving...' : 'Create User'}</BtnPrimary></>}
      >
        <FormGroup label="Username"><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="dr.jones / nurse.kim / admin.khan" /></FormGroup>
        <div className="form-row">
          <FormGroup label="First Name"><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></FormGroup>
          <FormGroup label="Last Name"><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Email"><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" /></FormGroup>
          <FormGroup label="Role">
            <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="gp">GP</option>
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
              <option value="patient">Patient</option>
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Password"><Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" placeholder="Share this password with the new user" /></FormGroup>
      </Modal>

      <Modal
        open={editModal}
        onClose={() => { setEditModal(false); setSelected(null) }}
        title="Edit User"
        footer={<><BtnSecondary onClick={() => { setEditModal(false); setSelected(null) }}>Cancel</BtnSecondary><BtnPrimary onClick={handleUpdateUser} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</BtnPrimary></>}
      >
        <FormGroup label="Username"><Input value={form.username} disabled /></FormGroup>
        <div className="form-row">
          <FormGroup label="First Name"><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></FormGroup>
          <FormGroup label="Last Name"><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Email"><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" /></FormGroup>
          <FormGroup label="Role">
            <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="gp">GP</option>
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
              <option value="patient">Patient</option>
            </Select>
          </FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Set New Password (optional)"><Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" /></FormGroup>
          <FormGroup label="Status">
            <Select value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm({ ...form, is_active: e.target.value === 'active' })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormGroup>
        </div>
      </Modal>

      <Modal
        open={patientModal}
        onClose={() => setPatientModal(false)}
        title="Create Patient"
        footer={<><BtnSecondary onClick={() => setPatientModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleCreatePatient} disabled={saving}>{saving ? 'Saving...' : 'Create Patient'}</BtnPrimary></>}
      >
        <div className="form-row">
          <FormGroup label="First Name"><Input value={patientForm.first_name} onChange={e => setPatientForm({ ...patientForm, first_name: e.target.value })} /></FormGroup>
          <FormGroup label="Last Name"><Input value={patientForm.last_name} onChange={e => setPatientForm({ ...patientForm, last_name: e.target.value })} /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Date of Birth"><Input type="date" value={patientForm.dob} onChange={e => setPatientForm({ ...patientForm, dob: e.target.value })} /></FormGroup>
          <FormGroup label="Medicare No."><Input value={patientForm.medicare_number} onChange={e => setPatientForm({ ...patientForm, medicare_number: e.target.value })} /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Phone"><Input value={patientForm.phone} onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })} /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={patientForm.email} onChange={e => setPatientForm({ ...patientForm, email: e.target.value })} /></FormGroup>
        </div>
        <FormGroup label="Address"><Input value={patientForm.address} onChange={e => setPatientForm({ ...patientForm, address: e.target.value })} /></FormGroup>
        <FormGroup label="Primary Doctor">
          <Select value={patientForm.primary_doctor} onChange={e => setPatientForm({ ...patientForm, primary_doctor: e.target.value })}>
            <option value="">Auto assign</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.display_name}</option>)}
          </Select>
        </FormGroup>
      </Modal>

      <Modal
        open={patientViewModal}
        onClose={() => { setPatientViewModal(false); setSelectedPatient(null) }}
        title="Patient Details"
        footer={<BtnSecondary onClick={() => { setPatientViewModal(false); setSelectedPatient(null) }}>Close</BtnSecondary>}
      >
        {selectedPatient && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{selectedPatient.first_name} {selectedPatient.last_name}</span></div>
            <div className="detail-row"><span className="detail-label">Date of Birth</span><span className="detail-value">{selectedPatient.dob || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Medicare</span><span className="detail-value">{selectedPatient.medicare_number || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{selectedPatient.phone || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{selectedPatient.email || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Address</span><span className="detail-value">{selectedPatient.address || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Primary Doctor</span><span className="detail-value">{selectedPatient.primary_doctor_name || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{selectedPatient.is_active ? 'Active' : 'Inactive'}</span></div>
          </div>
        )}
      </Modal>

      <Modal
        open={patientEditModal}
        onClose={() => { setPatientEditModal(false); setSelectedPatient(null) }}
        title="Edit Patient"
        footer={<><BtnSecondary onClick={() => { setPatientEditModal(false); setSelectedPatient(null) }}>Cancel</BtnSecondary><BtnPrimary onClick={handleUpdatePatient} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</BtnPrimary></>}
      >
        <div className="form-row">
          <FormGroup label="First Name"><Input value={patientForm.first_name} onChange={e => setPatientForm({ ...patientForm, first_name: e.target.value })} /></FormGroup>
          <FormGroup label="Last Name"><Input value={patientForm.last_name} onChange={e => setPatientForm({ ...patientForm, last_name: e.target.value })} /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Date of Birth"><Input type="date" value={patientForm.dob} onChange={e => setPatientForm({ ...patientForm, dob: e.target.value })} /></FormGroup>
          <FormGroup label="Medicare No."><Input value={patientForm.medicare_number} onChange={e => setPatientForm({ ...patientForm, medicare_number: e.target.value })} /></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Phone"><Input value={patientForm.phone} onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })} /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={patientForm.email} onChange={e => setPatientForm({ ...patientForm, email: e.target.value })} /></FormGroup>
        </div>
        <FormGroup label="Address"><Input value={patientForm.address} onChange={e => setPatientForm({ ...patientForm, address: e.target.value })} /></FormGroup>
        <FormGroup label="Primary Doctor">
          <Select value={patientForm.primary_doctor} onChange={e => setPatientForm({ ...patientForm, primary_doctor: e.target.value })}>
            <option value="">Auto assign</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.display_name}</option>)}
          </Select>
        </FormGroup>
      </Modal>
    </div>
  )
}

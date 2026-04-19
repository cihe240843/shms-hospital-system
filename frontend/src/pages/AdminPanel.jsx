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

export default function AdminPanel() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [integrity, setIntegrity] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState(EMPTY_USER)

  const resetMessages = () => {
    setErrorMsg('')
    setSuccessMsg('')
  }

  const loadUsers = async () => {
    const { data } = await api.get('/api/audit/users/')
    setUsers(Array.isArray(data) ? data : [])
  }

  const loadAudit = async () => {
    const { data } = await api.get('/api/audit/')
    setAudit(Array.isArray(data) ? data : data.results ?? [])
  }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      resetMessages()
      try {
        if (tab === 'users') {
          await loadUsers()
        } else {
          await loadAudit()
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
        action={tab === 'users' ? <BtnPrimary onClick={() => { setCreateModal(true); setForm(EMPTY_USER); resetMessages() }}>+ Create User</BtnPrimary> : null}
      />

      <div className="admin-tabs">
        {['users','audit'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'users' ? 'Users' : 'Audit Log'}
          </button>
        ))}
      </div>

      {errorMsg && <div className="notice notice-error">{errorMsg}</div>}
      {successMsg && <div className="notice notice-success">{successMsg}</div>}

      {tab === 'users' && (
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
    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../api/client'
import { Badge, PageHeader, Modal, FormGroup, Input, BtnPrimary, BtnSecondary, Spinner, Select } from '../components/ui'
import '../components/ui.css'
import './Billing.css'

const EMPTY_INVOICE = { patient:'', description:'', amount:'' }

export default function Billing() {
  const [invoices, setInvoices] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState(EMPTY_INVOICE)
  const [editForm, setEditForm] = useState({ patient:'', description:'', amount:'', status:'unpaid' })

  const resetMessages = () => {
    setErrorMsg('')
    setSuccessMsg('')
  }

  const load = async () => {
    setLoading(true)
    try {
      const [inv, pat] = await Promise.all([api.get('/api/billing/'), api.get('/api/patients/')])
      setInvoices(Array.isArray(inv.data) ? inv.data : inv.data.results ?? [])
      setPatients(Array.isArray(pat.data) ? pat.data : pat.data.results ?? [])
    } catch {
      setErrorMsg('Failed to load billing data.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const markPaid = async (id) => {
    resetMessages()
    try {
      await api.post(`/api/billing/${id}/mark_paid/`)
      setSuccessMsg('Invoice marked as paid.')
      load()
    } catch {
      setErrorMsg('Unable to mark invoice as paid.')
    }
  }

  const handleAdd = async () => {
    if (!form.patient || !form.description || !form.amount || Number(form.amount) <= 0) {
      setErrorMsg('Patient, description, and a valid amount are required.')
      return
    }
    setSaving(true)
    resetMessages()
    try {
      await api.post('/api/billing/', form)
      setCreateModal(false)
      setForm(EMPTY_INVOICE)
      setSuccessMsg('Invoice created successfully.')
      load()
    } catch {
      setErrorMsg('Unable to create invoice. Check required fields.')
    } finally {
      setSaving(false)
    }
  }

  const openView = (invoice) => {
    setSelected(invoice)
    setViewModal(true)
    resetMessages()
  }

  const openEdit = (invoice) => {
    setSelected(invoice)
    setEditForm({
      patient: invoice.patient || '',
      description: invoice.description || '',
      amount: invoice.amount || '',
      status: invoice.status || 'unpaid',
    })
    setEditModal(true)
    resetMessages()
  }

  const handleUpdate = async () => {
    if (!selected) return
    if (!editForm.patient || !editForm.description || !editForm.amount || Number(editForm.amount) <= 0) {
      setErrorMsg('Patient, description, and a valid amount are required.')
      return
    }

    setSaving(true)
    resetMessages()
    try {
      await api.put(`/api/billing/${selected.id}/`, {
        patient: editForm.patient,
        description: editForm.description,
        amount: editForm.amount,
        status: editForm.status,
      })
      setEditModal(false)
      setSelected(null)
      setSuccessMsg('Invoice updated successfully.')
      load()
    } catch {
      setErrorMsg('Unable to update invoice.')
    } finally {
      setSaving(false)
    }
  }

  const total = invoices.length
  const paid = invoices.filter(i => i.status === 'paid').length
  const unpaid = invoices.filter(i => i.status === 'unpaid').length
  const revenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0)

  return (
    <div className="module-page billing-page">
      <PageHeader title="Billing" desc="Manage patient invoices and payments"
        action={<BtnPrimary onClick={() => { setCreateModal(true); setForm(EMPTY_INVOICE); resetMessages() }}>+ Create Invoice</BtnPrimary>} />

      <div className="billing-stats">
        {[
          { label:'Total Invoices', val: total, color:'' },
          { label:'Paid', val: paid, color:'green' },
          { label:'Unpaid', val: unpaid, color:'amber' },
          { label:'Revenue (Month)', val: `$${revenue.toFixed(2)}`, color:'' },
        ].map(s => (
          <div key={s.label} className="billing-stat">
            <div className="bs-label">{s.label}</div>
            <div className={`bs-val ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {errorMsg && <div className="notice notice-error">{errorMsg}</div>}
      {successMsg && <div className="notice notice-success">{successMsg}</div>}

      <div className="table-wrap">
        {loading ? <Spinner /> : (
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Description</th><th>Amount</th><th>Issued</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {invoices.length === 0
                ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">💳</div>No invoices yet</div></td></tr>
                : invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><strong>{inv.patient_name || '-'}</strong></td>
                    <td>{inv.description}</td>
                    <td><strong>${parseFloat(inv.amount).toFixed(2)}</strong></td>
                    <td>{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '-'}</td>
                    <td><Badge type={inv.status === 'paid' ? 'green' : 'amber'}>{inv.status}</Badge></td>
                    <td>
                      <div className="action-btns">
                        <button className="act-btn act-view" onClick={() => openView(inv)}>View</button>
                        <button className="act-btn act-edit" onClick={() => openEdit(inv)}>Edit</button>
                        {inv.status === 'unpaid' && <button className="act-btn act-edit" onClick={() => markPaid(inv.id)}>Mark Paid</button>}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Invoice"
        footer={<><BtnSecondary onClick={() => setCreateModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Create Invoice'}</BtnPrimary></>}>
        <FormGroup label="Patient">
          <Select value={form.patient} onChange={e => setForm({ ...form, patient: e.target.value })}>
            <option value="">Select patient...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Description">
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. GP Consultation" />
        </FormGroup>
        <FormGroup label="Amount ($)">
          <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
        </FormGroup>
      </Modal>

      <Modal
        open={viewModal}
        onClose={() => { setViewModal(false); setSelected(null) }}
        title="Invoice Details"
        footer={<BtnSecondary onClick={() => { setViewModal(false); setSelected(null) }}>Close</BtnSecondary>}
      >
        {selected && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">Patient</span><span className="detail-value">{selected.patient_name || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Description</span><span className="detail-value">{selected.description || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Amount</span><span className="detail-value">${parseFloat(selected.amount || 0).toFixed(2)}</span></div>
            <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{selected.status || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Issued</span><span className="detail-value">{selected.issued_at ? new Date(selected.issued_at).toLocaleString() : '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Paid At</span><span className="detail-value">{selected.paid_at ? new Date(selected.paid_at).toLocaleString() : '-'}</span></div>
          </div>
        )}
      </Modal>

      <Modal
        open={editModal}
        onClose={() => { setEditModal(false); setSelected(null) }}
        title="Edit Invoice"
        footer={<><BtnSecondary onClick={() => { setEditModal(false); setSelected(null) }}>Cancel</BtnSecondary><BtnPrimary onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</BtnPrimary></>}
      >
        <FormGroup label="Patient">
          <Select value={editForm.patient} onChange={e => setEditForm({ ...editForm, patient: e.target.value })}>
            <option value="">Select patient...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Description">
          <Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
        </FormGroup>
        <div className="form-row">
          <FormGroup label="Amount ($)">
            <Input type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
          </FormGroup>
          <FormGroup label="Status">
            <Select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </Select>
          </FormGroup>
        </div>
      </Modal>
    </div>
  )
}

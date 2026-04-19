import { useEffect, useState } from 'react'
import api from '../api/client'
import { Badge, PageHeader, Modal, FormGroup, Input, BtnPrimary, BtnSecondary, Spinner, Select } from '../components/ui'
import '../components/ui.css'
import './Inventory.css'

const EMPTY_ITEM = { name:'', category:'Medication', quantity:0, low_stock_threshold:50, unit:'units' }

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState(EMPTY_ITEM)

  const resetMessages = () => {
    setErrorMsg('')
    setSuccessMsg('')
  }

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/inventory/')
      setItems(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setErrorMsg('Failed to load inventory items.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.name || Number.isNaN(Number(form.quantity)) || Number.isNaN(Number(form.low_stock_threshold))) {
      setErrorMsg('Name, quantity, and low stock threshold are required.')
      return
    }
    setSaving(true)
    resetMessages()
    try {
      await api.post('/api/inventory/', {
        ...form,
        quantity: Number(form.quantity),
        low_stock_threshold: Number(form.low_stock_threshold),
      })
      setCreateModal(false)
      setForm(EMPTY_ITEM)
      setSuccessMsg('Inventory item created successfully.')
      load()
    } catch {
      setErrorMsg('Unable to create inventory item.')
    } finally {
      setSaving(false)
    }
  }

  const openView = (item) => {
    setSelected(item)
    setViewModal(true)
    resetMessages()
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      name: item.name || '',
      category: item.category || 'General',
      quantity: item.quantity ?? 0,
      low_stock_threshold: item.low_stock_threshold ?? 50,
      unit: item.unit || 'units',
    })
    setEditModal(true)
    resetMessages()
  }

  const handleUpdate = async () => {
    if (!selected) return
    if (!form.name || Number.isNaN(Number(form.quantity)) || Number.isNaN(Number(form.low_stock_threshold))) {
      setErrorMsg('Name, quantity, and low stock threshold are required.')
      return
    }
    setSaving(true)
    resetMessages()
    try {
      await api.put(`/api/inventory/${selected.id}/`, {
        name: form.name,
        category: form.category,
        quantity: Number(form.quantity),
        low_stock_threshold: Number(form.low_stock_threshold),
        unit: form.unit,
      })
      setEditModal(false)
      setSelected(null)
      setSuccessMsg('Inventory item updated successfully.')
      load()
    } catch {
      setErrorMsg('Unable to update inventory item.')
    } finally {
      setSaving(false)
    }
  }

  const lowCount = items.filter(i => i.is_low_stock).length
  const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)

  return (
    <div className="module-page inventory-page">
      <PageHeader title="Inventory" desc="Medical stock management and low-stock alerts"
        action={<BtnPrimary onClick={() => { setForm(EMPTY_ITEM); setCreateModal(true); resetMessages() }}>+ Add Item</BtnPrimary>} />

      <div className="inventory-highlights">
        <div className="ih-card">
          <div className="ih-label">Tracked Items</div>
          <div className="ih-value">{items.length}</div>
        </div>
        <div className="ih-card">
          <div className="ih-label">Units in Stock</div>
          <div className="ih-value">{totalQuantity}</div>
        </div>
      </div>

      {lowCount > 0 && (
        <div className="low-stock-alert">
          <strong>{lowCount} item{lowCount > 1 ? 's' : ''}</strong> below low-stock threshold. Reorder recommended.
        </div>
      )}

      {errorMsg && <div className="notice notice-error">{errorMsg}</div>}
      {successMsg && <div className="notice notice-success">{successMsg}</div>}

      <div className="table-wrap inventory-table-wrap">
        {loading ? <Spinner /> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Threshold</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {items.length === 0
                ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📦</div>No inventory items yet</div></td></tr>
                : items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><Badge type="blue">{item.category}</Badge></td>
                    <td><strong style={{ color: item.is_low_stock ? 'var(--red)' : 'inherit' }}>{item.quantity}</strong></td>
                    <td>{item.unit}</td>
                    <td>{item.low_stock_threshold}</td>
                    <td>
                      {item.is_low_stock
                        ? <Badge type="red">Low Stock</Badge>
                        : <Badge type="green">OK</Badge>}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="act-btn act-view" onClick={() => openView(item)}>View</button>
                        <button className="act-btn act-edit" onClick={() => openEdit(item)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Add Inventory Item"
        footer={<><BtnSecondary onClick={() => setCreateModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Add Item'}</BtnPrimary></>}>
        <FormGroup label="Item Name">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" />
        </FormGroup>
        <div className="form-row">
          <FormGroup label="Category">
            <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['Medication','PPE','Equipment','Consumable','General'].map(c => <option key={c}>{c}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Unit">
            <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="tablet / box / units" />
          </FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Quantity">
            <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </FormGroup>
          <FormGroup label="Low Stock Threshold">
            <Input type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </FormGroup>
        </div>
      </Modal>

      <Modal
        open={viewModal}
        onClose={() => { setViewModal(false); setSelected(null) }}
        title="Inventory Item Details"
        footer={<BtnSecondary onClick={() => { setViewModal(false); setSelected(null) }}>Close</BtnSecondary>}
      >
        {selected && (
          <div className="detail-grid">
            <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{selected.name || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Category</span><span className="detail-value">{selected.category || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Quantity</span><span className="detail-value">{selected.quantity ?? '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Unit</span><span className="detail-value">{selected.unit || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Low Stock Threshold</span><span className="detail-value">{selected.low_stock_threshold ?? '-'}</span></div>
            <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{selected.is_low_stock ? 'Low Stock' : 'OK'}</span></div>
          </div>
        )}
      </Modal>

      <Modal
        open={editModal}
        onClose={() => { setEditModal(false); setSelected(null) }}
        title="Edit Inventory Item"
        footer={<><BtnSecondary onClick={() => { setEditModal(false); setSelected(null) }}>Cancel</BtnSecondary><BtnPrimary onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</BtnPrimary></>}
      >
        <FormGroup label="Item Name">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </FormGroup>
        <div className="form-row">
          <FormGroup label="Category">
            <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['Medication','PPE','Equipment','Consumable','General'].map(c => <option key={c}>{c}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Unit">
            <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Quantity">
            <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </FormGroup>
          <FormGroup label="Low Stock Threshold">
            <Input type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </FormGroup>
        </div>
      </Modal>
    </div>
  )
}

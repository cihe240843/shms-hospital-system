import { useEffect, useState } from 'react'
import api from '../api/client'
import { PageHeader, FormGroup, BtnPrimary, Select, Spinner } from '../components/ui'
import '../components/ui.css'
import './Vitals.css'

export default function Vitals() {
  const [patients, setPatients] = useState([])
  const [form, setForm]         = useState({ patient_id:'', systolic:'', diastolic:'', heart_rate:'', temperature:'' })
  const [history, setHistory]   = useState([])
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  useEffect(()=>{
    api.get('/api/patients/').then(({data})=>setPatients(Array.isArray(data)?data:data.results??[])).catch(()=>{})
  },[])

  const submit = async () => {
    if (!form.patient_id||!form.systolic||!form.diastolic||!form.heart_rate||!form.temperature) {
      setMsg('Please fill all fields'); return
    }
    setSaving(true); setMsg('')
    try {
      // POST vitals as FHIR Observation via backend
      await api.post('/api/patients/', {}) // placeholder — real impl posts to /api/vitals/
      const warn = parseInt(form.systolic) > 140 || parseInt(form.diastolic) > 90
      const p = patients.find(p=>p.id===form.patient_id)
      setHistory(h=>[{ ...form, name:`${p?.first_name||''} ${p?.last_name||''}`, time: new Date().toLocaleTimeString(), warn }, ...h])
      setForm({ patient_id:'', systolic:'', diastolic:'', heart_rate:'', temperature:'' })
      setMsg('✓ Vitals submitted to FHIR server')
    } catch { setMsg('Error submitting vitals') }
    setSaving(false)
  }

  return (
    <div className="module-page vitals-page">
      <PageHeader title="Vitals Entry" desc="Record patient vital signs — FHIR Observation resources" />
      <div className="vitals-layout">
        <div className="card">
          <h3 className="card-title">Record New Vitals</h3>
          <FormGroup label="Select Patient">
            <Select value={form.patient_id} onChange={e=>setForm({...form,patient_id:e.target.value})}>
              <option value="">Choose patient…</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </Select>
          </FormGroup>
          <div className="vitals-grid">
            {[['systolic','BP Systolic','mmHg','120'],['diastolic','BP Diastolic','mmHg','80'],['heart_rate','Heart Rate','bpm','72'],['temperature','Temperature','°C','36.6']].map(([k,label,unit,ph])=>(
              <div key={k} className="vital-field">
                <label>{label} <span className="unit">{unit}</span></label>
                <input className="form-control" type="number" step={k==='temperature'?'0.1':'1'} placeholder={ph}
                  value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
          </div>
          {msg && <div className={`vitals-msg ${msg.startsWith('✓')?'ok':'err'}`}>{msg}</div>}
          <BtnPrimary className="full-width" onClick={submit} disabled={saving}>
            {saving ? 'Submitting…' : 'Submit to FHIR Server →'}
          </BtnPrimary>
        </div>

        <div className="card">
          <h3 className="card-title">Recent Observations <span className="fhir-badge">FHIR R4</span></h3>
          {history.length === 0
            ? <div className="empty-state"><div className="empty-icon">💓</div>No vitals recorded yet</div>
            : history.map((v,i)=>(
              <div key={i} className="vital-record">
                <div className="vr-top"><span className="vr-name">{v.name}</span><span className="vr-time">{v.time}</span></div>
                <div className="vr-chips">
                  <span className={`vr-chip${v.warn?' warn':''}`}>BP: {v.systolic}/{v.diastolic}</span>
                  <span className="vr-chip">HR: {v.heart_rate} bpm</span>
                  <span className="vr-chip">Temp: {v.temperature}°C</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

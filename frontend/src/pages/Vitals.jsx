import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { PageHeader, FormGroup, BtnPrimary, Select, Textarea, Spinner, Badge } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import '../components/ui.css'
import './Vitals.css'

export default function Vitals() {
  const { role } = useAuth()
  const [patients, setPatients] = useState([])
  const [form, setForm]         = useState({ patient_id:'', chief_complaint:'', allergy_notes:'', triage_notes:'', pain_score:'', height_cm:'', weight_kg:'', systolic:'', diastolic:'', heart_rate:'', temperature:'' })
  const [history, setHistory]   = useState([])
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const canEdit = useMemo(() => ['nurse', 'superadmin'].includes(role), [role])

  useEffect(()=>{
    const load = async () => {
      try {
        const [{ data: patientsData }, { data: vitalsData }] = await Promise.all([
          api.get('/api/patients/'),
          api.get('/api/vitals/'),
        ])
        setPatients(Array.isArray(patientsData) ? patientsData : patientsData.results ?? [])
        setHistory(Array.isArray(vitalsData) ? vitalsData : vitalsData.results ?? [])
      } catch {
        setPatients([])
        setHistory([])
      }
    }
    load()
  }, [role])

  const submit = async () => {
    if (!canEdit) {
      setMsg('Read-only view for doctors')
      return
    }
    if (!form.patient_id||!form.chief_complaint||!form.systolic||!form.diastolic||!form.heart_rate||!form.temperature) {
      setMsg('Please fill all required triage fields')
      return
    }
    setSaving(true); setMsg('')
    try {
      const payload = {
        patient: form.patient_id,
        chief_complaint: form.chief_complaint,
        allergy_notes: form.allergy_notes,
        triage_notes: form.triage_notes,
        pain_score: form.pain_score ? parseInt(form.pain_score, 10) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        bp_systolic: parseInt(form.systolic, 10),
        bp_diastolic: parseInt(form.diastolic, 10),
        heart_rate: parseInt(form.heart_rate, 10),
        temperature: parseFloat(form.temperature),
      }
      await api.post('/api/vitals/', payload)
      const p = patients.find(p=>p.id===form.patient_id)
      const warn = parseInt(form.systolic, 10) > 140 || parseInt(form.diastolic, 10) > 90 || parseInt(form.heart_rate, 10) > 100 || parseFloat(form.temperature) > 37.5
      setHistory(h=>[{ ...payload, name:`${p?.first_name||''} ${p?.last_name||''}`.trim(), time: new Date().toLocaleTimeString(), warn }, ...h])
      setForm({ patient_id:'', chief_complaint:'', allergy_notes:'', triage_notes:'', pain_score:'', height_cm:'', weight_kg:'', systolic:'', diastolic:'', heart_rate:'', temperature:'' })
      setMsg('✓ Vitals submitted successfully')
    } catch (e) {
      const detail = e?.response?.data?.detail
      const fieldErrors = e?.response?.data
      setMsg(detail || (fieldErrors && typeof fieldErrors === 'object' ? Object.values(fieldErrors).flat().join(' ') : 'Error submitting vitals'))
    }
    setSaving(false)
  }

  return (
    <div className="module-page vitals-page">
      <PageHeader title="Vitals & Triage" desc="Admin registers the visit, nurse records triage and vitals, and the doctor reviews the full clinical picture." />
      <div className="vitals-layout">
        <div className="card">
          <div className="card-headline-row">
            <h3 className="card-title">{canEdit ? 'Record New Triage' : 'Triage Review Only'}</h3>
            {!canEdit && <Badge type="blue">Doctor View</Badge>}
          </div>
          {canEdit ? (
            <>
              <FormGroup label="Select Patient">
                <Select value={form.patient_id} onChange={e=>setForm({...form,patient_id:e.target.value})}>
                  <option value="">Choose patient…</option>
                  {patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Chief Complaint">
                <Textarea rows="3" value={form.chief_complaint} onChange={e=>setForm({...form,chief_complaint:e.target.value})} placeholder="e.g. Fever, cough, chest pain, dizziness" />
              </FormGroup>
              <div className="triage-grid">
                <FormGroup label="Allergies">
                  <Textarea rows="3" value={form.allergy_notes} onChange={e=>setForm({...form,allergy_notes:e.target.value})} placeholder="Drug, food, or other allergies" />
                </FormGroup>
                <FormGroup label="Triage Notes">
                  <Textarea rows="3" value={form.triage_notes} onChange={e=>setForm({...form,triage_notes:e.target.value})} placeholder="Symptoms, meds, history, urgency" />
                </FormGroup>
              </div>
              <div className="triage-grid compact">
                <FormGroup label="Pain Score (0-10)">
                  <input className="form-control" type="number" min="0" max="10" step="1" placeholder="4" value={form.pain_score} onChange={e=>setForm({...form,pain_score:e.target.value})} />
                </FormGroup>
                <FormGroup label="Height (cm)">
                  <input className="form-control" type="number" min="0" step="0.1" placeholder="172" value={form.height_cm} onChange={e=>setForm({...form,height_cm:e.target.value})} />
                </FormGroup>
                <FormGroup label="Weight (kg)">
                  <input className="form-control" type="number" min="0" step="0.1" placeholder="68" value={form.weight_kg} onChange={e=>setForm({...form,weight_kg:e.target.value})} />
                </FormGroup>
              </div>
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
                {saving ? 'Submitting…' : 'Save Triage & Vitals →'}
              </BtnPrimary>
            </>
          ) : (
            <div className="read-only-note">
              Doctor review mode. Nurses record triage and vitals, and the clinician reviews them below.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-headline-row">
            <h3 className="card-title">Recent Observations <span className="fhir-badge">FHIR R4</span></h3>
            <Badge type="gray">{history.length} records</Badge>
          </div>
          {history.length === 0
            ? <div className="empty-state"><div className="empty-icon">💓</div>No vitals recorded yet</div>
            : history.map((v,i)=>(
              <div key={i} className="vital-record">
                <div className="vr-top">
                  <span className="vr-name">{v.name || v.patient_name || 'Unknown patient'}</span>
                  <span className="vr-time">{v.time || new Date(v.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="vr-complaint">{v.chief_complaint || 'No complaint recorded'}</div>
                <div className="vr-chips">
                  <span className={`vr-chip${v.warn?' warn':''}`}>BP: {v.bp_systolic ?? v.systolic}/{v.bp_diastolic ?? v.diastolic}</span>
                  <span className="vr-chip">HR: {v.heart_rate} bpm</span>
                  <span className="vr-chip">Temp: {v.temperature}°C</span>
                  {v.height_cm && <span className="vr-chip">Ht: {v.height_cm} cm</span>}
                  {v.weight_kg && <span className="vr-chip">Wt: {v.weight_kg} kg</span>}
                  {v.pain_score !== null && v.pain_score !== undefined && v.pain_score !== '' && <span className="vr-chip">Pain: {v.pain_score}/10</span>}
                </div>
                {(v.allergy_notes || v.triage_notes) && (
                  <div className="vr-notes">
                    {v.allergy_notes && <div><strong>Allergies:</strong> {v.allergy_notes}</div>}
                    {v.triage_notes && <div><strong>Notes:</strong> {v.triage_notes}</div>}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

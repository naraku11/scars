import { useState } from 'react'
import { AlertTriangle, Bell, Plus, X, CheckCircle, Clock, Shield, Phone, FileText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './RoleDashboard.module.css'

const INCIDENT_TYPES = ['Fire', 'Medical', 'Security', 'Theft', 'Accident', 'Natural Disaster', 'Vandalism', 'Other']
const PRIORITIES     = ['Low', 'Medium', 'High', 'Critical']
const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Rejected: '#dc2626' }
const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }

const initForm = { title: '', type: 'Other', priority: 'Medium', location: '', description: '' }

const EMERGENCY = [
  { label: 'Campus Security', number: '(032) 234-5678' },
  { label: 'Medical Unit', number: '(032) 234-5679' },
  { label: 'Bureau of Fire', number: '160' },
  { label: 'Police (PNP)', number: '117' },
  { label: 'Emergency Hotline', number: '911' },
]

export default function StudentDashboard() {
  const { incidents, notifications, addIncident, currentUser } = useApp()

  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(initForm)
  const [busy, setBusy]           = useState(false)
  const [error, setError]         = useState('')
  const [submitted, setSubmitted] = useState(false)

  const myReports = incidents
    .filter(i => {
      const reporterId = typeof i.reportedBy === 'object' ? i.reportedBy?.id : i.reportedBy ?? i.reportedById
      return reporterId === currentUser?.id
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const recentAlerts = [...notifications]
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    .slice(0, 6)

  const openReports     = myReports.filter(i => i.status === 'Open').length
  const resolvedReports = myReports.filter(i => i.status === 'Resolved').length
  const activeReports   = myReports.filter(i => i.status === 'In Progress').length

  const fc = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await addIncident(form)
      setForm(initForm)
      setShowForm(false)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    } catch (err) {
      setError(err.message || 'Failed to submit report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={p.page}>
      <Header title={`Hello, ${currentUser?.name?.split(' ')[0]}`} subtitle="Student Portal — UV Toledo Campus SCARS" />
      <div className={p.content}>

        {submitted && (
          <div className={`${p.alertBox} ${p.alertSuccess}`}>
            <CheckCircle size={14} /> Your incident report was submitted. Campus security has been notified.
          </div>
        )}
        {error && (
          <div className={`${p.alertBox} ${p.alertDanger}`}>
            <X size={14} /> {error}
          </div>
        )}

        {/* Stats */}
        <div className={p.statsRow}>
          {[
            { label: 'My Reports', value: myReports.length, sub: 'total submitted', icon: FileText, bg: '#E8F5E9', color: '#2E7D32' },
            { label: 'Open', value: openReports, sub: 'pending review', icon: Clock, bg: '#fef3c7', color: '#d97706' },
            { label: 'In Progress', value: activeReports, sub: 'being handled', icon: Shield, bg: '#dbeafe', color: '#2563eb' },
            { label: 'Resolved', value: resolvedReports, sub: 'completed', icon: CheckCircle, bg: '#dcfce7', color: '#16a34a' },
          ].map(({ label, value, sub, icon: Icon, bg, color }) => (
            <div className={p.statCard} key={label} style={{ '--stat-accent': color }}>
              <div className={p.statIcon} style={{ background: bg }}><Icon size={22} color={color} /></div>
              <div className={p.statInfo}>
                <div className={p.statValue}>{value}</div>
                <div className={p.statLabel}>{label}</div>
                <div className={p.statSub}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Hero CTA */}
        {!showForm && (
          <div className={s.heroBanner}>
            <div className={s.heroIcon}><AlertTriangle size={32} color="#dc2626" /></div>
            <div>
              <div className={s.heroTitle}>Report a Campus Incident</div>
              <div className={s.heroSub}>Witnessed something suspicious or dangerous? Report it immediately to campus security.</div>
            </div>
            <button className={`${p.btn} ${p.btnDanger}`} onClick={() => setShowForm(true)}>
              <Plus size={14} /> Report Now
            </button>
          </div>
        )}

        {/* Report form */}
        {showForm && (
          <div className={`${p.card} ${s.reportCard}`}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}><AlertTriangle size={15} /> Submit Incident Report</span>
              <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => { setShowForm(false); setError('') }}>
                <X size={13} /> Cancel
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={p.formGrid}>
                <div className={`${p.field} ${p.formFull}`}>
                  <label>Incident Title *</label>
                  <input value={form.title} onChange={e => fc('title', e.target.value)} placeholder="Brief description of what happened" required />
                </div>
                <div className={p.field}>
                  <label>Type *</label>
                  <select value={form.type} onChange={e => fc('type', e.target.value)}>
                    {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className={p.field}>
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => fc('priority', e.target.value)}>
                    {PRIORITIES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className={`${p.field} ${p.formFull}`}>
                  <label>Location *</label>
                  <input value={form.location} onChange={e => fc('location', e.target.value)} placeholder="e.g. Main Building, Room 201" required />
                </div>
                <div className={`${p.field} ${p.formFull}`}>
                  <label>Description *</label>
                  <textarea value={form.description} onChange={e => fc('description', e.target.value)} placeholder="Describe what happened in detail…" required />
                </div>
              </div>
              <div className={p.btnRow} style={{ marginTop: 14 }}>
                <button type="submit" className={`${p.btn} ${p.btnDanger}`} disabled={busy}>
                  <AlertTriangle size={13} /> {busy ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={s.threeCol}>

          {/* ── My Reports ─────────────────────────── */}
          <div className={`${p.card} ${s.spanTwo}`}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>My Incident Reports ({myReports.length})</span>
            </div>
            {myReports.length === 0 ? (
              <div className={p.empty}>
                <Clock size={20} style={{ marginBottom: 8 }} /><br />
                You haven&apos;t filed any reports yet.
              </div>
            ) : (
              <div className={p.tableWrap}>
                <table>
                  <thead><tr>
                    <th>Title</th><th>Type</th><th>Priority</th><th>Status</th><th>Submitted</th>
                  </tr></thead>
                  <tbody>
                    {myReports.map(inc => (
                      <tr key={inc.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{inc.title}</div>
                          <div style={{ fontSize: 11, color: '#4a7a52' }}>{inc.location}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{inc.type}</td>
                        <td>
                          <span className={s.pill} style={{ background: PRIORITY_COLOR[inc.priority] + '22', color: PRIORITY_COLOR[inc.priority] }}>
                            {inc.priority}
                          </span>
                        </td>
                        <td>
                          <span className={s.pill} style={{ background: STATUS_COLOR[inc.status] + '22', color: STATUS_COLOR[inc.status] }}>
                            {inc.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: '#4a7a52' }}>
                          {inc.createdAt ? new Date(inc.createdAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Right side ─────────────────────────── */}
          <div className={s.rightCol}>

            {/* Campus alerts */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}>Campus Alerts</span>
                <span style={{ fontSize: 11, color: '#4a7a52' }}>{recentAlerts.length} recent</span>
              </div>
              {recentAlerts.map(n => (
                <div key={n.id} className={s.alertItem}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#4a7a52', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    {n.sentAt ? new Date(n.sentAt).toLocaleString() : '—'}
                  </div>
                </div>
              ))}
              {!recentAlerts.length && <div className={p.empty}>No campus alerts.</div>}
            </div>

            {/* Emergency contacts */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}>Emergency Contacts</span>
              </div>
              {EMERGENCY.map(e => (
                <div key={e.label} className={s.emergencyRow}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{e.label}</div>
                  <a href={`tel:${e.number.replace(/\D/g,'')}`} className={s.emergencyNum}>{e.number}</a>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

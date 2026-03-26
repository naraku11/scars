import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle, Clock, Users, Shield,
  Bell, ChevronRight, Send
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './RoleDashboard.module.css'

const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }
const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Closed: '#94a3b8' }

export default function OfficerDashboard() {
  const { incidents, teams, notifications, validateIncident, verifyIncident, assignIncident, sendNotification, currentUser } = useApp()
  const navigate = useNavigate()

  const [notifForm, setNotifForm] = useState({ type: 'Alert', title: '', message: '', target: 'All' })
  const [notifBusy, setNotifBusy] = useState(false)
  const [notifSent, setNotifSent] = useState(false)
  const [busy, setBusy]           = useState({})
  const [assignMap, setAssignMap] = useState({})

  const pending   = incidents.filter(i => !i.validated)
  const active    = incidents.filter(i => i.status === 'In Progress')
  const resolved  = incidents.filter(i => i.status === 'Resolved')
  const available = teams.filter(t => t.status === 'Available')
  const onCall    = teams.filter(t => t.status === 'On Call')
  const recent    = [...incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)

  const act = (id, fn) => async () => {
    setBusy(b => ({ ...b, [id]: true }))
    try { await fn() } finally { setBusy(b => ({ ...b, [id]: false })) }
  }

  const handleAssign = async (inc) => {
    const teamId = assignMap[inc.id]
    if (!teamId) return
    setBusy(b => ({ ...b, [`a${inc.id}`]: true }))
    try { await assignIncident(inc.id, +teamId) } finally { setBusy(b => ({ ...b, [`a${inc.id}`]: false })) }
  }

  const handleNotif = async (e) => {
    e.preventDefault()
    setNotifBusy(true)
    try {
      await sendNotification(notifForm)
      setNotifSent(true)
      setNotifForm({ type: 'Alert', title: '', message: '', target: 'All' })
      setTimeout(() => setNotifSent(false), 3000)
    } finally {
      setNotifBusy(false)
    }
  }

  return (
    <div className={p.page}>
      <Header title={`Welcome, ${currentUser?.name?.split(' ')[0]}`} subtitle="Officer Control Panel — UV Toledo Campus" />
      <div className={p.content}>

        {/* Stats */}
        <div className={p.statsRow}>
          {[
            { label: 'Total Incidents', value: incidents.length, sub: `${pending.length} need validation`, icon: AlertTriangle, bg: '#fee2e2', color: '#dc2626' },
            { label: 'Pending Validation', value: pending.length, sub: 'awaiting review', icon: Clock, bg: '#fef3c7', color: '#d97706' },
            { label: 'Active Responses', value: active.length, sub: 'being handled now', icon: Shield, bg: '#dbeafe', color: '#2563eb' },
            { label: 'Teams Available', value: available.length, sub: `${onCall.length} on call`, icon: Users, bg: '#dcfce7', color: '#16a34a' },
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

        <div className={s.twoCol}>

          {/* ── Incident table ─────────────────────── */}
          <div className={p.card}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>Recent Incidents</span>
              <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => navigate('/incidents')}>
                View All <ChevronRight size={13} />
              </button>
            </div>
            <div className={p.tableWrap}>
              <table>
                <thead><tr>
                  <th>Incident</th><th>Reported By</th><th>Priority</th><th>Status</th><th>Assign</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {recent.map(inc => (
                    <tr key={inc.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{inc.title}</div>
                        <div style={{ fontSize: 11, color: '#4a7a52' }}>{inc.location}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{inc.createdAt ? new Date(inc.createdAt).toLocaleString() : ''}</div>
                      </td>
                      <td style={{ fontSize: 12, color: '#1a2e1c' }}>
                        {typeof inc.reportedBy === 'object' ? inc.reportedBy?.name : inc.reportedBy || '—'}
                      </td>
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
                      <td style={{ minWidth: 140 }}>
                        {inc.status === 'Resolved' ? (
                          <span style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Locked
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <select
                              value={assignMap[inc.id] || ''}
                              onChange={e => setAssignMap(m => ({ ...m, [inc.id]: e.target.value }))}
                              style={{ fontSize: 11, padding: '3px 6px', flex: 1 }}
                            >
                              <option value="">— Team —</option>
                              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <button
                              className={`${p.btn} ${p.btnPrimary} ${p.btnSm}`}
                              disabled={!assignMap[inc.id] || busy[`a${inc.id}`]}
                              onClick={() => handleAssign(inc)}
                              style={{ padding: '3px 8px' }}
                            >
                              {busy[`a${inc.id}`] ? '…' : 'Assign'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {!inc.validated && (
                            <button className={`${p.btn} ${p.btnWarning} ${p.btnSm}`} disabled={busy[inc.id]}
                              onClick={act(inc.id, () => validateIncident(inc.id))}>
                              {busy[inc.id] ? '…' : 'Validate'}
                            </button>
                          )}
                          {inc.validated && !inc.verified && (
                            <button className={`${p.btn} ${p.btnSuccess} ${p.btnSm}`} disabled={busy[`v${inc.id}`]}
                              onClick={act(`v${inc.id}`, () => verifyIncident(inc.id))}>
                              {busy[`v${inc.id}`] ? '…' : 'Verify'}
                            </button>
                          )}
                          {inc.validated && inc.verified && (
                            <span style={{ color: '#22c55e', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={13} /> Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!recent.length && <tr><td colSpan={6} className={p.empty}>No incidents reported.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right column ───────────────────────── */}
          <div className={s.rightCol}>

            {/* Team status */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}>Response Teams</span>
                <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => navigate('/response')}>
                  Manage <ChevronRight size={13} />
                </button>
              </div>
              {teams.map(team => (
                <div key={team.id} className={s.teamRow}>
                  <div className={s.teamDot} style={{ background: team.status === 'Available' ? '#22c55e' : team.status === 'On Call' ? '#f59e0b' : '#94a3b8' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: '#4a7a52' }}>{team.specialty}</div>
                  </div>
                  <span className={s.pill} style={{ background: team.status === 'Available' ? '#dcfce7' : '#fef3c7', color: team.status === 'Available' ? '#166534' : '#92400e' }}>
                    {team.status}
                  </span>
                </div>
              ))}
              {!teams.length && <div className={p.empty}>No teams configured.</div>}
            </div>

            {/* Quick notification */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}>Quick Alert</span>
                <span style={{ fontSize: 11, color: '#4a7a52', display: 'flex', alignItems: 'center', gap: 4 }}><Bell size={12} /> Push to campus</span>
              </div>
              {notifSent && (
                <div className={`${p.alertBox} ${p.alertSuccess}`} style={{ marginBottom: 10 }}>
                  <CheckCircle size={13} /> Alert sent successfully.
                </div>
              )}
              <form onSubmit={handleNotif}>
                <div className={p.field} style={{ marginBottom: 8 }}>
                  <label>Title</label>
                  <input value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))} required placeholder="Alert title" />
                </div>
                <div className={p.field} style={{ marginBottom: 8 }}>
                  <label>Message</label>
                  <textarea value={notifForm.message} onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))} required placeholder="Alert message…" style={{ minHeight: 60 }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className={p.field} style={{ flex: 1 }}>
                    <label>Type</label>
                    <select value={notifForm.type} onChange={e => setNotifForm(f => ({ ...f, type: e.target.value }))}>
                      {['Alert', 'Warning', 'Info', 'Emergency'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className={p.field} style={{ flex: 1 }}>
                    <label>Target</label>
                    <select value={notifForm.target} onChange={e => setNotifForm(f => ({ ...f, target: e.target.value }))}>
                      {['All', 'Students', 'Responders', 'Officers'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className={`${p.btn} ${p.btnPrimary}`} disabled={notifBusy} style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}>
                  <Send size={13} /> {notifBusy ? 'Sending…' : 'Send Alert'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

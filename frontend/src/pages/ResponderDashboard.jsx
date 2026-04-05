import { useState } from 'react'
import {
  AlertTriangle, CheckCircle, Clock, Users,
  Activity, FileText, Eye, X, MapPin, User, Tag, Shield
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './RoleDashboard.module.css'

const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Rejected: '#dc2626' }
const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }

export default function ResponderDashboard() {
  const { incidents, teams, notifications, currentUser } = useApp()
  const [viewing, setViewing] = useState(null)

  // Find my team — the team that has me as a member
  const userId = currentUser?.id
  const myTeam = teams.find(t =>
    t.members?.some(m => (typeof m === 'object' ? (m.userId ?? m.user?.id ?? m.id) : m) === userId)
  )

  const myIncidents = myTeam
    ? incidents.filter(i => {
        const assignedId = typeof i.assignedTo === 'object' ? i.assignedTo?.id : i.assignedTo
        return assignedId === myTeam.id
      })
    : []

  const open       = myIncidents.filter(i => i.status === 'Open').length
  const inProgress = myIncidents.filter(i => i.status === 'In Progress').length
  const resolved   = myIncidents.filter(i => i.status === 'Resolved').length

  // All recent reports (visible to responder regardless of team assignment)
  const allRecentReports = [...incidents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)

  const recentNotifs = [...notifications]
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    .slice(0, 5)

  const members = myTeam?.members ?? []

  return (
    <div className={p.page}>
      <Header title={`Welcome, ${currentUser?.name?.split(' ')[0]}`} subtitle="Responder Panel — UV Toledo Campus" />
      <div className={p.content}>

        {/* Stats */}
        <div className={p.statsRow}>
          {[
            { label: 'Assigned Incidents', value: myIncidents.length, sub: myTeam ? `to ${myTeam.name}` : 'no team yet', icon: AlertTriangle, bg: '#fee2e2', color: '#dc2626' },
            { label: 'Open', value: open, sub: 'need response', icon: Clock, bg: '#fef3c7', color: '#d97706' },
            { label: 'In Progress', value: inProgress, sub: 'being handled', icon: Activity, bg: '#dbeafe', color: '#2563eb' },
            { label: 'Resolved', value: resolved, sub: 'completed', icon: CheckCircle, bg: '#dcfce7', color: '#16a34a' },
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

          {/* ── Assigned incidents ─────────────────── */}
          <div className={p.card}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>
                {myTeam ? `${myTeam.name} — Assigned Incidents` : 'Assigned Incidents'}
              </span>
            </div>

            {!myTeam && (
              <div className={`${p.alertBox} ${p.alertWarn}`}>
                <AlertTriangle size={13} /> You are not assigned to any team yet. Contact your officer.
              </div>
            )}

            <div className={p.tableWrap}>
              <table>
                <thead><tr>
                  <th>Incident</th><th>Reported By</th><th>Priority</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  {myIncidents.map(inc => (
                    <tr key={inc.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{inc.title}</div>
                        <div style={{ fontSize: 11, color: '#4a7a52' }}>{inc.location}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{inc.type} &middot; {inc.createdAt ? new Date(inc.createdAt).toLocaleString() : ''}</div>
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
                      <td>
                        <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => setViewing(inc)}>
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!myIncidents.length && (
                    <tr><td colSpan={5} className={p.empty}>
                      {myTeam ? 'No incidents assigned to your team.' : 'Join a team to see assigned incidents.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── All Recent Reports ──────────────────── */}
          <div className={p.card} style={{ gridColumn: '1 / -1' }}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}><FileText size={15} /> All Recent Reports</span>
              <span style={{ fontSize: 11, color: '#4a7a52' }}>{allRecentReports.length} latest</span>
            </div>
            <div className={p.tableWrap}>
              <table>
                <thead><tr>
                  <th>Title</th><th>Reported By</th><th>Type</th><th>Priority</th><th>Location</th><th>Status</th><th>Submitted</th><th></th>
                </tr></thead>
                <tbody>
                  {allRecentReports.map(inc => (
                    <tr key={inc.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{inc.title}</td>
                      <td style={{ fontSize: 12, color: '#1a2e1c' }}>
                        {typeof inc.reportedBy === 'object' ? inc.reportedBy?.name : inc.reportedBy || '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>{inc.type}</td>
                      <td>
                        <span className={s.pill} style={{ background: PRIORITY_COLOR[inc.priority] + '22', color: PRIORITY_COLOR[inc.priority] }}>
                          {inc.priority}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#4a7a52' }}>{inc.location}</td>
                      <td>
                        <span className={s.pill} style={{ background: STATUS_COLOR[inc.status] + '22', color: STATUS_COLOR[inc.status] }}>
                          {inc.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {inc.createdAt ? new Date(inc.createdAt).toLocaleString() : '—'}
                      </td>
                      <td>
                        <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => setViewing(inc)}>
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!allRecentReports.length && (
                    <tr><td colSpan={7} className={p.empty}>No reports yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right column ───────────────────────── */}
          <div className={s.rightCol}>

            {/* Team members */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}>{myTeam ? myTeam.name : 'My Team'}</span>
                {myTeam && <span style={{ fontSize: 11, color: '#4a7a52' }}>{members.length} members</span>}
              </div>
              {myTeam && (
                <div className={s.teamMeta}>
                  <span className={s.pill} style={{ background: '#dcfce7', color: '#166534' }}>{myTeam.specialty}</span>
                  <span className={s.pill} style={{ background: myTeam.status === 'Available' ? '#dcfce7' : '#fef3c7', color: myTeam.status === 'Available' ? '#166534' : '#92400e' }}>
                    {myTeam.status}
                  </span>
                </div>
              )}
              {members.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  {members.map((m, i) => {
                    const name = typeof m === 'object' ? (m.user?.name ?? m.name ?? 'Member') : `Member ${m}`
                    const avatarLetter = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                    const isMe = (typeof m === 'object' ? (m.userId ?? m.user?.id ?? m.id) : m) === userId
                    return (
                      <div key={i} className={s.memberRow}>
                        <div className={s.memberAvatar}>{avatarLetter}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{name} {isMe && <span className={s.youBadge}>You</span>}</div>
                          <div style={{ fontSize: 11, color: '#4a7a52' }}>Responder</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={p.empty}>Not assigned to a team.</div>
              )}
            </div>

            {/* Recent alerts */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}>Campus Alerts</span>
                <span style={{ fontSize: 11, color: '#4a7a52' }}>{recentNotifs.length} recent</span>
              </div>
              {recentNotifs.map(n => {
                const typeBg = { Emergency: '#fee2e2', Alert: '#fef3c7', Warning: '#fef3c7', Info: '#E8F5E9' }
                const typeClr = { Emergency: '#dc2626', Alert: '#d97706', Warning: '#d97706', Info: '#1B5E20' }
                return (
                  <div key={n.id} className={s.alertItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={s.pill} style={{ fontSize: 10, background: typeBg[n.type] || '#E8F5E9', color: typeClr[n.type] || '#1B5E20' }}>{n.type || 'Info'}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#4a7a52', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      To: {n.target} · {n.sentAt ? new Date(n.sentAt).toLocaleString() : '—'}
                    </div>
                  </div>
                )
              })}
              {!recentNotifs.length && <div className={p.empty}>No alerts.</div>}
            </div>

          </div>
        </div>
      </div>

      {/* Read-only incident detail modal */}
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20, backdropFilter: 'blur(2px)' }}
          onClick={e => e.target === e.currentTarget && setViewing(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid #e2ede3' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2e1c', lineHeight: 1.3 }}>{viewing.title}</div>
                <div style={{ fontSize: 12, color: '#4a7a52', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MapPin size={11} /> {viewing.location}
                </div>
              </div>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className={s.pill} style={{ background: PRIORITY_COLOR[viewing.priority] + '22', color: PRIORITY_COLOR[viewing.priority] }}>{viewing.priority}</span>
                <span className={s.pill} style={{ background: STATUS_COLOR[viewing.status] + '22', color: STATUS_COLOR[viewing.status] }}>{viewing.status}</span>
                <span className={s.pill} style={{ background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={10} /> {viewing.type}
                </span>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { icon: User, label: 'Reported By', val: typeof viewing.reportedBy === 'object' ? viewing.reportedBy?.name : viewing.reportedBy || '—' },
                  { icon: Clock, label: 'Date', val: viewing.createdAt ? new Date(viewing.createdAt).toLocaleString() : '—' },
                  { icon: Users, label: 'Assigned Team', val: viewing.assignedTo ? (typeof viewing.assignedTo === 'object' ? viewing.assignedTo.name : viewing.assignedTo) : 'Unassigned' },
                  { icon: Shield, label: 'Progress', val: `${viewing.validated ? '✓' : '✗'} Validated · ${viewing.verified ? '✓' : '✗'} Verified` },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} style={{ background: '#f8fdf8', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Icon size={10} /> {label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e1c' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ background: '#f8fdf8', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Description</div>
                <div style={{ fontSize: 13, color: '#1a2e1c', lineHeight: 1.6 }}>
                  {viewing.description || <span style={{ color: '#94a3b8' }}>No description provided.</span>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2ede3', background: '#f8fdf8', display: 'flex', justifyContent: 'flex-end' }}>
              <button className={`${p.btn} ${p.btnOutline}`} onClick={() => setViewing(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

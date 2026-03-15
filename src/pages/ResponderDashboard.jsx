import { useState } from 'react'
import {
  AlertTriangle, CheckCircle, Clock, Users,
  Activity, ChevronDown, Bell
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './RoleDashboard.module.css'

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed']
const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Closed: '#94a3b8' }
const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }

export default function ResponderDashboard() {
  const { incidents, teams, notifications, updateStatus, currentUser } = useApp()

  const [busy, setBusy] = useState({})

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

  const recentNotifs = [...notifications]
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    .slice(0, 5)

  const handleStatus = async (id, status) => {
    setBusy(b => ({ ...b, [id]: true }))
    try { await updateStatus(id, status) } finally { setBusy(b => ({ ...b, [id]: false })) }
  }

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
                  <th>Incident</th><th>Priority</th><th>Status</th><th>Update Status</th>
                </tr></thead>
                <tbody>
                  {myIncidents.map(inc => (
                    <tr key={inc.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{inc.title}</div>
                        <div style={{ fontSize: 11, color: '#4a7a52' }}>{inc.location}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{inc.type}</div>
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
                        <div style={{ display: 'flex', align: 'center', gap: 4 }}>
                          <select
                            value={inc.status}
                            onChange={e => handleStatus(inc.id, e.target.value)}
                            disabled={busy[inc.id]}
                            style={{ fontSize: 12, padding: '4px 6px' }}
                          >
                            {STATUS_OPTIONS.map(st => <option key={st}>{st}</option>)}
                          </select>
                          {busy[inc.id] && <span style={{ fontSize: 11, color: '#4a7a52' }}>Saving…</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!myIncidents.length && (
                    <tr><td colSpan={4} className={p.empty}>
                      {myTeam ? 'No incidents assigned to your team.' : 'Join a team to see assigned incidents.'}
                    </td></tr>
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
    </div>
  )
}

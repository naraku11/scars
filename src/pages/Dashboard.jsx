import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Users, Bell, Shield, Plus,
  CheckCircle, BarChart2, TrendingUp, Clock, ShieldAlert
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './Dashboard.module.css'

const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }
const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Closed: '#94a3b8' }

const QUICK_ACTIONS = [
  { icon: ShieldAlert, label: 'Manage Incidents',  desc: 'Validate & verify reports',   to: '/incidents',     accent: '#dc2626', bg: '#fee2e2' },
  { icon: Shield,      label: 'Assign Response',   desc: 'Coordinate response teams',   to: '/response',      accent: '#2563eb', bg: '#dbeafe' },
  { icon: Bell,        label: 'Send Alert',         desc: 'Notify the campus community', to: '/notifications', accent: '#d97706', bg: '#fef3c7' },
  { icon: BarChart2,   label: 'View Analytics',     desc: 'Reports & performance data',  to: '/reports',       accent: '#16a34a', bg: '#dcfce7' },
]

export default function Dashboard() {
  const { incidents, users, notifications, teams } = useApp()
  const navigate = useNavigate()

  const open       = incidents.filter(i => i.status === 'Open').length
  const inProgress = incidents.filter(i => i.status === 'In Progress').length
  const resolved   = incidents.filter(i => i.status === 'Resolved').length
  const total      = incidents.length || 1
  const resolvedPct = Math.round((resolved / total) * 100)
  const recent    = [...incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)

  const typeCounts  = incidents.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc }, {})
  const maxCount    = Math.max(1, ...Object.values(typeCounts))

  const statusBars = [
    { label: 'Open',        count: open,       color: '#ef4444', pct: Math.round((open / total) * 100) },
    { label: 'In Progress', count: inProgress, color: '#f59e0b', pct: Math.round((inProgress / total) * 100) },
    { label: 'Resolved',    count: resolved,   color: '#22c55e', pct: Math.round((resolved / total) * 100) },
  ]

  const getTeamName = (inc) => {
    if (!inc.assignedTo) return null
    if (typeof inc.assignedTo === 'object') return inc.assignedTo.name
    return teams.find(t => t.id === inc.assignedTo)?.name
  }

  return (
    <div className={p.page}>
      <Header title="Dashboard" subtitle="UV Toledo Campus — Smart Campus Alert & Response System" />
      <div className={p.content}>

        {/* ── Stat Cards ── */}
        <div className={p.statsRow}>
          <div className={p.statCard} style={{ '--stat-accent': '#ef4444' }}>
            <div className={p.statIcon} style={{ background: '#fee2e2' }}>
              <AlertTriangle size={22} color="#ef4444" />
            </div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{incidents.length}</div>
              <div className={p.statLabel}>Total Incidents</div>
              <div className={p.statSub}>{open} still open</div>
            </div>
          </div>

          <div className={p.statCard} style={{ '--stat-accent': '#f59e0b' }}>
            <div className={p.statIcon} style={{ background: '#fef3c7' }}>
              <Clock size={22} color="#d97706" />
            </div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{inProgress}</div>
              <div className={p.statLabel}>Active Responses</div>
              <div className={p.statSub}>being handled now</div>
            </div>
          </div>

          <div className={p.statCard} style={{ '--stat-accent': '#22c55e' }}>
            <div className={p.statIcon} style={{ background: '#dcfce7' }}>
              <CheckCircle size={22} color="#16a34a" />
            </div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{resolved}</div>
              <div className={p.statLabel}>Resolved</div>
              <div className={p.statSub}>{resolvedPct}% resolution rate</div>
            </div>
          </div>

          <div className={p.statCard} style={{ '--stat-accent': '#2E7D32' }}>
            <div className={p.statIcon} style={{ background: '#E8F5E9' }}>
              <Users size={22} color="#2E7D32" />
            </div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{users.length}</div>
              <div className={p.statLabel}>System Users</div>
              <div className={p.statSub}>{teams.length} response teams</div>
            </div>
          </div>
        </div>

        <div className={s.grid}>

          {/* ── Recent Incidents Table ── */}
          <div className={`${p.card} ${s.tableCard}`}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>Recent Incidents</span>
              <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => navigate('/incidents')}>
                View All →
              </button>
            </div>

            {incidents.length === 0 ? (
              <div className={p.empty}>
                <AlertTriangle size={28} color="#C8E6C9" />
                <span>No incidents recorded yet.</span>
                <span style={{ fontSize: 12 }}>Incidents reported by students will appear here.</span>
              </div>
            ) : (
              <div className={p.tableWrap}>
                <table>
                  <thead><tr>
                    <th>Incident</th><th>Type</th><th>Priority</th><th>Assigned To</th><th>Status</th><th>Date</th>
                  </tr></thead>
                  <tbody>
                    {recent.map(i => (
                      <tr key={i.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</div>
                          <div style={{ fontSize: 11, color: '#4a7a52' }}>{i.location}</div>
                        </td>
                        <td><span className={s.typeTag}>{i.type}</span></td>
                        <td>
                          <span className={s.priorityDot} style={{ background: PRIORITY_COLOR[i.priority] }} />
                          <span style={{ fontSize: 12, color: PRIORITY_COLOR[i.priority], fontWeight: 600 }}>{i.priority}</span>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {getTeamName(i)
                            ? <span style={{ color: '#1a2e1c', fontWeight: 500 }}>{getTeamName(i)}</span>
                            : <span className={s.unassigned}>Unassigned</span>}
                        </td>
                        <td>
                          <span className={s.statusPill} style={{
                            background: STATUS_COLOR[i.status] + '20',
                            color: STATUS_COLOR[i.status],
                            border: `1px solid ${STATUS_COLOR[i.status]}40`,
                          }}>{i.status}</span>
                        </td>
                        <td style={{ fontSize: 11, color: '#94a3b8' }}>
                          {new Date(i.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className={s.rightCol}>

            {/* Status breakdown */}
            <div className={p.card}>
              <div className={p.sectionTitle} style={{ marginBottom: 16 }}>Incident Status</div>
              {statusBars.map(({ label, count, color, pct }) => (
                <div key={label} className={s.statusRow}>
                  <div className={s.statusMeta}>
                    <span className={s.statusDot} style={{ background: color }} />
                    <span className={s.statusLabel}>{label}</span>
                    <span className={s.statusCount}>{count}</span>
                  </div>
                  <div className={s.barTrack}>
                    <div className={s.barFill} style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className={s.pct}>{pct}%</span>
                </div>
              ))}
            </div>

            {/* By type */}
            <div className={p.card}>
              <div className={p.sectionTitle} style={{ marginBottom: 16 }}>Incidents by Type</div>
              {Object.keys(typeCounts).length === 0 ? (
                <div className={p.empty} style={{ padding: '20px 0' }}>No data yet.</div>
              ) : (
                Object.entries(typeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className={s.statusRow}>
                      <div className={s.statusMeta}>
                        <span className={s.statusDot} style={{ background: '#2E7D32' }} />
                        <span className={s.statusLabel}>{type}</span>
                        <span className={s.statusCount}>{count}</span>
                      </div>
                      <div className={s.barTrack}>
                        <div className={s.barFill} style={{ width: `${(count / maxCount) * 100}%`, background: 'linear-gradient(90deg, #2E7D32, #43A047)' }} />
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Quick Actions */}
            <div className={p.card}>
              <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Quick Actions</div>
              <div className={s.quickActions}>
                {QUICK_ACTIONS.map(({ icon: Icon, label, desc, to, accent, bg }) => (
                  <button key={to} className={s.qBtn} onClick={() => navigate(to)}>
                    <div className={s.qIcon} style={{ background: bg, color: accent }}>
                      <Icon size={18} />
                    </div>
                    <div className={s.qText}>
                      <span className={s.qLabel}>{label}</span>
                      <span className={s.qDesc}>{desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

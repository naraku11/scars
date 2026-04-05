import { useState } from 'react'
import {
  AlertTriangle, CheckCircle, Clock, Users, Activity,
  Eye, X, MapPin, User, Tag, Shield,
  Search, Radio, Inbox, FileText, Calendar, Lock, Timer
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './RoleDashboard.module.css'

const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Rejected: '#dc2626' }
const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }

function formatEta(eta) {
  if (!eta) return null
  const diff = new Date(eta) - Date.now()
  const mins = Math.round(diff / 60000)
  if (mins > 60) {
    const h = Math.floor(mins / 60), m = mins % 60
    return { label: m > 0 ? `in ${h}h ${m}m` : `in ${h}h`, color: '#16a34a', overdue: false }
  }
  if (mins > 0)  return { label: `in ${mins} min`, color: mins <= 10 ? '#d97706' : '#16a34a', overdue: false }
  if (mins === 0) return { label: 'arriving now',  color: '#16a34a', overdue: false }
  const over = Math.abs(mins)
  if (over >= 60) return { label: `overdue ${Math.floor(over / 60)}h`, color: '#dc2626', overdue: true }
  return { label: `overdue ${over} min`, color: '#dc2626', overdue: true }
}

function IncidentCard({ inc, myTeamId, onView, onResolve, resolving }) {
  const pc      = PRIORITY_COLOR[inc.priority] ?? '#94a3b8'
  const sc      = STATUS_COLOR[inc.status]     ?? '#94a3b8'
  const teamId  = typeof inc.assignedTo === 'object' ? inc.assignedTo?.id : inc.assignedTo
  const isMyTeam = myTeamId && teamId === myTeamId

  // Resolve is available when validated + verified and not already finished
  const canResolve  = onResolve && inc.validated && inc.verified
    && inc.status !== 'Resolved' && inc.status !== 'Rejected'
  const notReady    = onResolve && (!inc.validated || !inc.verified)
    && inc.status !== 'Resolved' && inc.status !== 'Rejected'
  const isResolving = resolving === inc.id

  return (
    <div className={s.incCard} style={{ borderLeftColor: pc }}>
      {/* Title */}
      <div className={s.incCardTitle}>{inc.title}</div>

      {/* Location */}
      <div className={s.incCardMeta}>
        <MapPin size={10} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {inc.location}
        </span>
      </div>

      {/* Badges */}
      <div className={s.incCardBadges}>
        <span className={s.pill} style={{ background: pc + '22', color: pc }}>{inc.priority}</span>
        <span className={s.pill} style={{ background: sc + '22', color: sc }}>{inc.status}</span>
        <span className={s.pill} style={{ background: '#f1f5f9', color: '#64748b' }}>{inc.type}</span>
        {isMyTeam && (
          <span className={s.pill} style={{ background: '#dcfce7', color: '#166534' }}>Your Team</span>
        )}
      </div>

      {/* ETA */}
      {(() => {
        const etaFmt = formatEta(inc.eta)
        if (!etaFmt) return null
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700,
            color: etaFmt.color,
            background: etaFmt.overdue ? '#fee2e2' : etaFmt.color + '18',
            borderRadius: 6, padding: '3px 8px',
            marginBottom: 4,
          }}>
            <Timer size={11} style={{ flexShrink: 0 }} />
            <span>ETA: {etaFmt.label}</span>
            {etaFmt.overdue && <span style={{ fontWeight: 900 }}>!</span>}
          </div>
        )
      })()}

      {/* Reporter + Date */}
      <div className={s.incCardFooter}>
        <User size={10} style={{ flexShrink: 0 }} />
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
          {typeof inc.reportedBy === 'object' ? inc.reportedBy?.name : inc.reportedBy || '—'}
        </span>
        <span style={{ color: '#e2e8f0', padding: '0 2px' }}>·</span>
        <Calendar size={10} style={{ flexShrink: 0 }} />
        <span>{inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : '—'}</span>
      </div>

      {/* Actions */}
      <div className={s.incCardActions}>
        <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => onView(inc)}>
          <Eye size={11} /> View Detail
        </button>

        {canResolve && (
          <button
            className={`${p.btn} ${p.btnSuccess} ${p.btnSm}`}
            onClick={() => onResolve(inc.id)}
            disabled={isResolving}
            style={{ marginLeft: 'auto' }}
          >
            <CheckCircle size={11} />
            {isResolving ? 'Resolving…' : 'Resolve'}
          </button>
        )}

        {notReady && (
          <span className={s.resolvedTag} style={{ color: '#94a3b8', marginLeft: 'auto' }}>
            <Lock size={10} /> Awaiting validation
          </span>
        )}

        {inc.status === 'Resolved' && (
          <span className={s.resolvedTag}>
            <CheckCircle size={11} /> Resolved
          </span>
        )}
      </div>
    </div>
  )
}

export default function ResponderDashboard() {
  const { incidents, teams, notifications, currentUser, updateIncident } = useApp()
  const [tab, setTab]         = useState('assigned')
  const [search, setSearch]   = useState('')
  const [viewing, setViewing] = useState(null)
  const [resolving, setResolving] = useState(null) // incident id being resolved

  const userId = currentUser?.id
  const myTeam = teams.find(t =>
    t.members?.some(m => (typeof m === 'object' ? (m.userId ?? m.user?.id ?? m.id) : m) === userId)
  )

  // All incidents ever assigned to my team (stats + All Reports tab)
  const allTeamIncidents = myTeam
    ? incidents.filter(i => {
        const aId = typeof i.assignedTo === 'object' ? i.assignedTo?.id : i.assignedTo
        return aId === myTeam.id
      })
    : []

  // My Incidents tab: active only (needs attention), sorted by priority
  const myIncidents = allTeamIncidents
    .filter(i => i.status !== 'Resolved' && i.status !== 'Rejected')
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))

  const open        = allTeamIncidents.filter(i => i.status === 'Open').length
  const inProgress  = allTeamIncidents.filter(i => i.status === 'In Progress').length
  const resolved    = allTeamIncidents.filter(i => i.status === 'Resolved').length
  const urgentCount = open + inProgress

  // All Reports tab: full history, sorted newest first
  const teamReports = [...allTeamIncidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const filteredReports = search.trim()
    ? teamReports.filter(i =>
        [i.title, i.location, i.type,
          typeof i.reportedBy === 'object' ? i.reportedBy?.name : i.reportedBy
        ].some(v => v?.toLowerCase().includes(search.toLowerCase()))
      )
    : teamReports

  const recentNotifs = [...notifications]
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    .slice(0, 10)

  const members = myTeam?.members ?? []

  // Sync modal with live incident state
  const viewingLive = viewing ? (incidents.find(i => i.id === viewing.id) ?? viewing) : null

  const handleResolve = async (id) => {
    setResolving(id)
    try {
      await updateIncident(id, { status: 'Resolved' })
      // If the resolved incident is currently open in modal, keep it open (live data updates it)
    } catch (e) {
      console.error('Resolve failed:', e)
    } finally {
      setResolving(null)
    }
  }

  // Can the modal incident be resolved?
  const modalCanResolve = viewingLive &&
    viewingLive.validated && viewingLive.verified &&
    viewingLive.status !== 'Resolved' && viewingLive.status !== 'Rejected' &&
    myIncidents.some(i => i.id === viewingLive.id)

  return (
    <div className={p.page}>
      <Header
        title={`Welcome, ${currentUser?.name?.split(' ')[0] ?? 'Responder'}`}
        subtitle={myTeam ? `${myTeam.name} · Responder Panel` : 'Responder Panel — UV Toledo Campus'}
      />
      <div className={p.content}>

        {/* ── Stats ── */}
        <div className={p.statsRow}>
          {[
            { label: 'Assigned',    value: myIncidents.length, sub: myTeam?.name ?? 'no team', icon: AlertTriangle, bg: '#fee2e2', color: '#dc2626' },
            { label: 'Open',        value: open,               sub: 'needs response',           icon: Clock,        bg: '#fef3c7', color: '#d97706' },
            { label: 'In Progress', value: inProgress,         sub: 'being handled',            icon: Activity,     bg: '#dbeafe', color: '#2563eb' },
            { label: 'Resolved',    value: resolved,           sub: 'completed',                icon: CheckCircle,  bg: '#dcfce7', color: '#16a34a' },
          ].map(({ label, value, sub, icon: Icon, bg, color }) => (
            <div className={p.statCard} key={label} style={{ '--stat-accent': color }}>
              <div className={p.statIcon} style={{ background: bg }}><Icon size={22} color={color} /></div>
              <div className={p.statInfo}>
                <div className={p.statValue}>{value}</div>
                <div className={p.statLabel}>{label}</div>
                <div className={p.statSub} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── No-team warning ── */}
        {!myTeam && (
          <div className={`${p.alertBox} ${p.alertWarn}`} style={{ marginBottom: 16 }}>
            <AlertTriangle size={14} />
            You are not assigned to any response team yet. Contact your supervising Officer.
          </div>
        )}

        {/* ── Tabs ── */}
        <div className={p.tabs}>
          <button
            className={`${p.tab} ${tab === 'assigned' ? p.activeTab : ''}`}
            onClick={() => setTab('assigned')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Inbox size={14} />
            My Incidents
            {myIncidents.length > 0 && (
              <span className={s.tabBadgeUrgent}>{myIncidents.length}</span>
            )}
          </button>
          <button
            className={`${p.tab} ${tab === 'all' ? p.activeTab : ''}`}
            onClick={() => setTab('all')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FileText size={14} />
            All Reports
            <span className={s.tabBadgeGray}>{teamReports.length}</span>
          </button>
          <button
            className={`${p.tab} ${tab === 'team' ? p.activeTab : ''}`}
            onClick={() => setTab('team')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Users size={14} />
            My Team
            {myTeam && <span className={s.tabBadge}>{members.length}</span>}
          </button>
        </div>

        {/* ── Tab: My Incidents ── */}
        {tab === 'assigned' && (
          myIncidents.length === 0 ? (
            <div className={p.card}>
              <div className={p.empty}>
                <Inbox size={36} color="#C8E6C9" />
                <span>{myTeam ? 'No incidents assigned to your team right now.' : "You're not in a team yet."}</span>
                {!myTeam && <span style={{ fontSize: 12, color: '#94a3b8' }}>Contact your Officer to be assigned to a team.</span>}
              </div>
            </div>
          ) : (
            <div className={s.incCardGrid}>
              {myIncidents.map(inc => (
                <IncidentCard
                  key={inc.id}
                  inc={inc}
                  myTeamId={myTeam?.id}
                  onView={setViewing}
                  onResolve={handleResolve}
                  resolving={resolving}
                />
              ))}
            </div>
          )
        )}

        {/* ── Tab: All Reports ── */}
        {tab === 'all' && (
          <div className={p.card}>
            <div className={s.searchRow}>
              <Search size={15} color="#4a7a52" style={{ flexShrink: 0 }} />
              <input
                placeholder="Search by title, location, type, or reporter…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4, borderRadius: 4, flexShrink: 0 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {filteredReports.length === 0 ? (
              <div className={p.empty}>
                <FileText size={32} color="#C8E6C9" />
                {search.trim() ? 'No incidents match your search.' : myTeam ? 'No incidents assigned to your team.' : "You're not in a team yet."}
              </div>
            ) : (
              <div className={s.incCardGrid}>
                {filteredReports.map(inc => (
                  <IncidentCard key={inc.id} inc={inc} myTeamId={myTeam?.id} onView={setViewing} />
                ))}
              </div>
            )}

            {filteredReports.length === 0 && !search.trim() && !myTeam && (
              <div className={p.empty} style={{ marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>You are not assigned to a team yet.</span>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: My Team ── */}
        {tab === 'team' && (
          <div className={s.teamTabGrid}>

            {/* Team info + members */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}><Shield size={15} /> {myTeam?.name ?? 'My Team'}</span>
              </div>
              {myTeam ? (
                <>
                  <div className={s.teamMeta} style={{ marginBottom: 14 }}>
                    <span className={s.pill} style={{ background: '#dcfce7', color: '#166534' }}>{myTeam.specialty}</span>
                    <span className={s.pill} style={{
                      background: myTeam.status === 'Available' ? '#dcfce7' : '#fef3c7',
                      color:      myTeam.status === 'Available' ? '#166534' : '#92400e',
                    }}>{myTeam.status}</span>
                    <span className={s.pill} style={{ background: '#f1f5f9', color: '#475569' }}>
                      {members.length} member{members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {members.map((m, i) => {
                      const name     = typeof m === 'object' ? (m.user?.name ?? m.name ?? 'Member') : `Member ${m}`
                      const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                      const isMe     = (typeof m === 'object' ? (m.userId ?? m.user?.id ?? m.id) : m) === userId
                      const role     = typeof m === 'object' ? (m.user?.role?.name ?? '') : ''
                      return (
                        <div key={i} className={s.memberRow}>
                          <div className={s.memberAvatar}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {name} {isMe && <span className={s.youBadge}>You</span>}
                            </div>
                            {role && <div style={{ fontSize: 11, color: '#4a7a52' }}>{role}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className={p.empty}>
                  <Users size={28} color="#C8E6C9" />
                  Not assigned to a team yet.
                </div>
              )}
            </div>

            {/* Campus Alerts */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}><Radio size={15} /> Campus Alerts</span>
                {recentNotifs.length > 0 && (
                  <span style={{ fontSize: 11, color: '#4a7a52', background: '#F1F8F2', padding: '2px 8px', borderRadius: 99 }}>
                    {recentNotifs.length} recent
                  </span>
                )}
              </div>
              {recentNotifs.length === 0 ? (
                <div className={p.empty}><Radio size={28} color="#C8E6C9" />No alerts.</div>
              ) : (
                recentNotifs.map(n => {
                  const typeBg  = { Emergency: '#fee2e2', Alert: '#fef3c7', Warning: '#fef3c7', Info: '#E8F5E9' }
                  const typeClr = { Emergency: '#dc2626', Alert: '#d97706', Warning: '#d97706', Info: '#1B5E20' }
                  return (
                    <div key={n.id} className={s.alertItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span className={s.pill} style={{
                          fontSize: 10,
                          background: typeBg[n.type] ?? '#E8F5E9',
                          color:      typeClr[n.type] ?? '#1B5E20',
                        }}>{n.type || 'Info'}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0 }}>{n.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#4a7a52', lineHeight: 1.5, marginBottom: 4 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {n.sentAt ? new Date(n.sentAt).toLocaleString() : '—'} · To: {n.target}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>
        )}

      </div>

      {/* ── Incident detail modal ── */}
      {viewingLive && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20, backdropFilter: 'blur(2px)' }}
          onClick={e => e.target === e.currentTarget && setViewing(null)}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid #e2ede3' }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2e1c', lineHeight: 1.3 }}>{viewingLive.title}</div>
                <div style={{ fontSize: 12, color: '#4a7a52', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MapPin size={11} /> {viewingLive.location}
                </div>
              </div>
              <button
                onClick={() => setViewing(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, display: 'flex', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className={s.pill} style={{ background: (PRIORITY_COLOR[viewingLive.priority] ?? '#94a3b8') + '22', color: PRIORITY_COLOR[viewingLive.priority] ?? '#94a3b8' }}>
                  {viewingLive.priority}
                </span>
                <span className={s.pill} style={{ background: (STATUS_COLOR[viewingLive.status] ?? '#94a3b8') + '22', color: STATUS_COLOR[viewingLive.status] ?? '#94a3b8' }}>
                  {viewingLive.status}
                </span>
                <span className={s.pill} style={{ background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={10} /> {viewingLive.type}
                </span>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { icon: User,   label: 'Reported By',  val: typeof viewingLive.reportedBy === 'object' ? viewingLive.reportedBy?.name : viewingLive.reportedBy || '—' },
                  { icon: Clock,  label: 'Date',          val: viewingLive.createdAt ? new Date(viewingLive.createdAt).toLocaleString() : '—' },
                  { icon: Users,  label: 'Assigned Team', val: viewingLive.assignedTo ? (typeof viewingLive.assignedTo === 'object' ? viewingLive.assignedTo.name : viewingLive.assignedTo) : 'Unassigned' },
                  { icon: Shield, label: 'Progress',      val: `${viewingLive.validated ? '✓' : '✗'} Validated · ${viewingLive.verified ? '✓' : '✗'} Verified` },
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
                  {viewingLive.description || <span style={{ color: '#94a3b8' }}>No description provided.</span>}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2ede3', background: '#f8fdf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <button className={`${p.btn} ${p.btnOutline}`} onClick={() => setViewing(null)}>Close</button>
              {modalCanResolve && (
                <button
                  className={`${p.btn} ${p.btnSuccess}`}
                  onClick={async () => {
                    await handleResolve(viewingLive.id)
                    setViewing(null)
                  }}
                  disabled={resolving === viewingLive.id}
                >
                  <CheckCircle size={14} />
                  {resolving === viewingLive.id ? 'Resolving…' : 'Mark as Resolved'}
                </button>
              )}
              {viewingLive.status === 'Resolved' && (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle size={14} /> Resolved
                </span>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

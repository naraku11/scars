import { useState, useEffect } from 'react'
import {
  Trash2, CheckCircle, XCircle, Search, Eye, X,
  MapPin, User, Clock, Tag, Shield, Users, Lock, RefreshCw, Zap
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { authApi } from '../services/api'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './IncidentManagement.module.css'

const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }
const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Rejected: '#dc2626' }
const PRIORITIES     = ['Critical', 'High', 'Medium', 'Low']
const STATUSES       = ['Open', 'In Progress', 'Resolved', 'Rejected']

export default function IncidentManagement() {
  const {
    incidents, deletedIncidents, teams,
    updateIncident, deleteIncident, restoreIncident,
    validateIncident, verifyIncident, assignIncident,
  } = useApp()

  const [search,         setSearch]         = useState('')
  const [filterStatus,   setFilterStatus]   = useState('All')
  const [filterType,     setFilterType]     = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [error,          setError]          = useState('')
  const [busy,           setBusy]           = useState({})
  const [viewing,        setViewing]        = useState(null)
  const [incTab,         setIncTab]         = useState('active')

  const allTypes    = ['All', ...new Set(incidents.map(i => i.type))]
  const allStatuses = ['All', 'Open', 'In Progress', 'Rejected']

  const activeFiltered = incidents.filter(i => {
    if (i.status === 'Resolved' || i.status === 'Closed') return false
    const q = search.toLowerCase()
    const matchQ = !q || i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
    return matchQ
      && (filterStatus   === 'All' || i.status   === filterStatus)
      && (filterType     === 'All' || i.type     === filterType)
      && (filterPriority === 'All' || i.priority === filterPriority)
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const resolvedFiltered = incidents.filter(i => {
    if (i.status !== 'Resolved' && i.status !== 'Closed') return false
    const q = search.toLowerCase()
    return !q || i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const pending  = incidents.filter(i => !i.validated).length
  const toVerify = incidents.filter(i => i.validated && !i.verified && i.status !== 'Rejected').length
  const resolved = incidents.filter(i => i.status === 'Resolved').length

  const act = (key, fn) => async () => {
    setBusy(b => ({ ...b, [key]: true }))
    setError('')
    try { await fn() } catch (err) { setError(err.message) }
    finally { setBusy(b => ({ ...b, [key]: false })) }
  }

  const reporterName = (inc) =>
    inc.reportedBy ? (typeof inc.reportedBy === 'object' ? inc.reportedBy.name : inc.reportedBy) : '—'

  const assignedName = (inc) =>
    inc.assignedTo ? (typeof inc.assignedTo === 'object' ? inc.assignedTo.name : inc.assignedTo) : '—'

  const liveViewing = viewing
    ? incidents.find(i => i.id === viewing.id) ?? viewing
    : null

  return (
    <div className={p.page}>
      <Header title="Incident Management" subtitle="Review, validate, and manage all campus incidents" />
      <div className={p.content}>

        {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

        {/* Stats */}
        <div className={p.statsRow}>
          <div className={p.statCard} style={{ '--stat-accent': '#dc2626' }}>
            <div className={p.statIcon} style={{ background: '#fee2e2' }}><Shield size={20} color="#dc2626" /></div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{incidents.length}</div>
              <div className={p.statLabel}>Total Incidents</div>
              <div className={p.statSub}>{activeFiltered.length} matching filters</div>
            </div>
          </div>
          <div className={p.statCard} style={{ '--stat-accent': '#d97706' }}>
            <div className={p.statIcon} style={{ background: '#fef3c7' }}><XCircle size={20} color="#d97706" /></div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{pending}</div>
              <div className={p.statLabel}>Pending Validation</div>
              <div className={p.statSub}>awaiting review</div>
            </div>
          </div>
          <div className={p.statCard} style={{ '--stat-accent': '#2563eb' }}>
            <div className={p.statIcon} style={{ background: '#dbeafe' }}><CheckCircle size={20} color="#2563eb" /></div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{toVerify}</div>
              <div className={p.statLabel}>Awaiting Verification</div>
              <div className={p.statSub}>validated, not verified</div>
            </div>
          </div>
          <div className={p.statCard} style={{ '--stat-accent': '#16a34a' }}>
            <div className={p.statIcon} style={{ background: '#dcfce7' }}><CheckCircle size={20} color="#16a34a" /></div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{resolved}</div>
              <div className={p.statLabel}>Resolved</div>
              <div className={p.statSub}>{incidents.length ? Math.round(resolved / incidents.length * 100) : 0}% resolution rate</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className={p.subTabs}>
          <button className={`${p.subTab} ${incTab === 'active' ? p.activeSubTab : ''}`} onClick={() => setIncTab('active')}>
            Active ({activeFiltered.length})
          </button>
          <button className={`${p.subTab} ${incTab === 'resolved' ? p.activeSubTab : ''}`} onClick={() => setIncTab('resolved')}>
            Resolved ({resolvedFiltered.length})
          </button>
          {deletedIncidents.length > 0 && (
            <button className={`${p.subTab} ${incTab === 'deleted' ? p.activeSubTab : ''}`} onClick={() => setIncTab('deleted')}
              style={{ color: incTab === 'deleted' ? undefined : '#94a3b8' }}>
              <Trash2 size={12} style={{ display: 'inline', marginRight: 4 }} />
              Deleted ({deletedIncidents.length})
            </button>
          )}
        </div>

        {/* ── Active Incidents ───────────────────────────────────── */}
        {incTab === 'active' && (
          <div className={p.card}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>Active Incidents ({activeFiltered.length})</span>
            </div>

            <div className={s.filterBar}>
              <div className={s.searchBox}>
                <Search size={14} className={s.searchIcon} />
                <input placeholder="Search incidents…" value={search} onChange={e => setSearch(e.target.value)} className={s.searchInput} />
              </div>
              <select value={filterStatus}   onChange={e => setFilterStatus(e.target.value)}   className={s.filterSelect}>
                {allStatuses.map(st => <option key={st}>{st}</option>)}
              </select>
              <select value={filterType}     onChange={e => setFilterType(e.target.value)}     className={s.filterSelect}>
                {allTypes.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={s.filterSelect}>
                {['All', ...PRIORITIES].map(pr => <option key={pr}>{pr}</option>)}
              </select>
            </div>

            <div className={p.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Incident</th><th>Type</th><th>Priority</th><th>Status</th>
                    <th>Reporter</th><th>Assigned To</th><th>Progress</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFiltered.map(inc => <IncidentRow key={inc.id} inc={inc} busy={busy} act={act} setViewing={setViewing} validateIncident={validateIncident} verifyIncident={verifyIncident} updateIncident={updateIncident} deleteIncident={deleteIncident} allowDelete />)}
                  {!activeFiltered.length && <tr><td colSpan={9} className={p.empty}>No active incidents match the current filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Resolved Incidents ─────────────────────────────────── */}
        {incTab === 'resolved' && (
          <div className={`${p.card} ${s.resolvedCard}`}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle} style={{ color: '#16a34a' }}>
                <CheckCircle size={15} color="#16a34a" style={{ marginRight: 4 }} />
                Resolved Incidents ({resolvedFiltered.length})
              </span>
              <span style={{ fontSize: 12, color: '#4a7a52' }}>Read-only — resolved records cannot be deleted</span>
            </div>

            <div className={s.filterBar}>
              <div className={s.searchBox}>
                <Search size={14} className={s.searchIcon} />
                <input placeholder="Search resolved…" value={search} onChange={e => setSearch(e.target.value)} className={s.searchInput} />
              </div>
            </div>

            <div className={p.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Incident</th><th>Type</th><th>Priority</th><th>Status</th>
                    <th>Reporter</th><th>Assigned To</th><th>Progress</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedFiltered.map(inc => <IncidentRow key={inc.id} inc={inc} busy={busy} act={act} setViewing={setViewing} validateIncident={validateIncident} verifyIncident={verifyIncident} updateIncident={updateIncident} deleteIncident={deleteIncident} allowDelete={false} />)}
                  {!resolvedFiltered.length && <tr><td colSpan={9} className={p.empty}>No resolved incidents yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ── Deleted Incidents ─────────────────────────────────── */}
        {incTab === 'deleted' && (
          <div className={p.card}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle} style={{ color: '#94a3b8' }}>
                <Trash2 size={15} style={{ display: 'inline', marginRight: 4 }} />
                Deleted Incidents ({deletedIncidents.length})
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Soft-deleted — restore to make active again</span>
            </div>
            <div className={p.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Incident</th><th>Type</th><th>Priority</th><th>Reporter</th><th>Deleted At</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedIncidents.map(inc => {
                    const reporterName = inc.reportedBy ? (typeof inc.reportedBy === 'object' ? inc.reportedBy.name : inc.reportedBy) : '—'
                    return (
                      <tr key={inc.id} style={{ opacity: 0.7 }}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#94a3b8' }}>{inc.title}</div>
                          <div style={{ fontSize: 11, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                            <MapPin size={10} /> {inc.location}
                          </div>
                        </td>
                        <td><span className={s.typePill} style={{ opacity: 0.7 }}><Tag size={10} /> {inc.type}</span></td>
                        <td>
                          <span className={s.pill} style={{ background: PRIORITY_COLOR[inc.priority] + '22', color: PRIORITY_COLOR[inc.priority], opacity: 0.7 }}>
                            {inc.priority}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {reporterName}</div>
                        </td>
                        <td style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} /> {inc.deletedAt ? new Date(inc.deletedAt).toLocaleString() : '—'}
                          </div>
                        </td>
                        <td>
                          <button
                            className={`${p.btn} ${p.btnOutline} ${p.btnSm}`}
                            disabled={busy[`restore-${inc.id}`]}
                            onClick={act(`restore-${inc.id}`, () => restoreIncident(inc.id))}
                            style={{ color: '#16a34a', borderColor: '#16a34a' }}
                          >
                            <RefreshCw size={11} /> {busy[`restore-${inc.id}`] ? '…' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {!deletedIncidents.length && <tr><td colSpan={6} className={p.empty}>No deleted incidents.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Detail Modal */}
      {liveViewing && (
        <IncidentDetail
          inc={liveViewing}
          teams={teams}
          incidents={incidents}
          onClose={() => setViewing(null)}
          onAssign={assignIncident}
          onStatusChange={(id, status) => updateIncident(id, { status })}
          onValidate={validateIncident}
          onVerify={verifyIncident}
          onReject={(id) => updateIncident(id, { status: 'Rejected' })}
          onDelete={async (id) => { await deleteIncident(id); setViewing(null) }}
        />
      )}
    </div>
  )
}

// ── Shared table row ─────────────────────────────────────────────────────────
function IncidentRow({ inc, busy, act, setViewing, validateIncident, verifyIncident, updateIncident, deleteIncident, allowDelete }) {
  const reporterName = inc.reportedBy ? (typeof inc.reportedBy === 'object' ? inc.reportedBy.name : inc.reportedBy) : '—'
  const assignedName = inc.assignedTo ? (typeof inc.assignedTo === 'object' ? inc.assignedTo.name : inc.assignedTo) : '—'

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{inc.title}</div>
        <div style={{ fontSize: 11, color: '#4a7a52', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
          <MapPin size={10} /> {inc.location}
        </div>
      </td>
      <td><span className={s.typePill}><Tag size={10} /> {inc.type}</span></td>
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
      <td style={{ fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <User size={11} color="#4a7a52" /> {reporterName}
        </div>
      </td>
      <td style={{ fontSize: 12 }}>
        {inc.assignedTo
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} color="#2563eb" />{assignedName}</div>
          : <span style={{ color: '#cbd5e1' }}>—</span>}
      </td>
      <td>
        <div className={s.progressBadges}>
          <span className={`${s.progBadge} ${inc.validated ? s.progDone : ''}`}>
            {inc.validated ? <CheckCircle size={11} /> : <XCircle size={11} />} Validate
          </span>
          <span className={`${s.progBadge} ${inc.verified ? s.progDone : ''}`}>
            {inc.verified ? <CheckCircle size={11} /> : <XCircle size={11} />} Verify
          </span>
        </div>
      </td>
      <td style={{ fontSize: 11, color: '#4a7a52', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={10} /> {inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : '—'}
        </div>
      </td>
      <td>
        <div className={s.actionCell}>
          <button className={`${p.btn} ${p.btnOutline} ${p.btnSm} ${s.actionBtn}`} onClick={() => setViewing(inc)}>
            <Eye size={12} /> View
          </button>
          {!inc.validated && (
            <button className={`${p.btn} ${p.btnWarning} ${p.btnSm} ${s.actionBtn}`}
              disabled={busy[`val-${inc.id}`]}
              onClick={act(`val-${inc.id}`, () => validateIncident(inc.id))}>
              {busy[`val-${inc.id}`] ? '…' : 'Validate'}
            </button>
          )}
          {inc.validated && !inc.verified && inc.status !== 'Rejected' && (
            <>
              <button className={`${p.btn} ${p.btnSuccess} ${p.btnSm} ${s.actionBtn}`}
                disabled={busy[`ver-${inc.id}`]}
                onClick={act(`ver-${inc.id}`, () => verifyIncident(inc.id))}>
                {busy[`ver-${inc.id}`] ? '…' : 'Approve'}
              </button>
              <button className={`${p.btn} ${p.btnDanger} ${p.btnSm} ${s.actionBtn}`}
                disabled={busy[`rej-${inc.id}`]}
                onClick={act(`rej-${inc.id}`, () => updateIncident(inc.id, { status: 'Rejected' }))}>
                {busy[`rej-${inc.id}`] ? '…' : 'Reject'}
              </button>
            </>
          )}
          {allowDelete && !(inc.validated && inc.verified) && (
            <>
              <div className={s.actionSep} />
              <button className={`${p.btn} ${p.btnDanger} ${p.btnSm} ${s.delBtn}`}
                disabled={busy[`del-${inc.id}`]}
                onClick={act(`del-${inc.id}`, () => deleteIncident(inc.id))}>
                <Trash2 size={11} /> Delete
              </button>
            </>
          )}
          {allowDelete && inc.validated && inc.verified && (
            <span title="Cannot delete — incident has been validated and verified" style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4 }}>
              <Lock size={10} /> Locked
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Incident Detail Modal ─────────────────────────────────────────────────────
function IncidentDetail({ inc, teams, incidents, onClose, onAssign, onStatusChange, onValidate, onVerify, onReject, onDelete }) {
  const { currentUser } = useApp()
  const [teamId, setTeamId]       = useState(inc.assignedTo?.id ?? '')
  const [status, setStatus]       = useState(inc.status)
  const [busy,   setBusy]         = useState({})
  const [error,  setError]        = useState('')

  // Dynamic team status (On Duty if team has active assigned incidents)
  const getTeamDynStatus = (team) => {
    if (!incidents?.length) return team.status
    const hasActive = incidents.some(i => {
      const aid = typeof i.assignedTo === 'object' ? i.assignedTo?.id : i.assignedTo
      return aid === team.id && i.status !== 'Resolved' && i.status !== 'Rejected' && i.status !== 'Closed'
    })
    return hasActive ? 'On Duty' : team.status
  }

  const handleAutoAssign = () => {
    if (!teams.length) return
    const typeLC = (inc.type || '').toLowerCase()
    // 1. Specialty match + available
    let best = teams.find(t => {
      const spec = (t.specialty || '').toLowerCase()
      return (spec && (spec.includes(typeLC) || typeLC.includes(spec))) && getTeamDynStatus(t) === 'Available'
    })
    // 2. Specialty match any status
    if (!best) best = teams.find(t => {
      const spec = (t.specialty || '').toLowerCase()
      return spec && (spec.includes(typeLC) || typeLC.includes(spec))
    })
    // 3. Any available team
    if (!best) best = teams.find(t => getTeamDynStatus(t) === 'Available')
    // 4. First team
    if (!best) best = teams[0]
    if (best) {
      setTeamId(best.id)
      act('assign', () => onAssign(inc.id, best.id))()
    }
  }
  // Admin password override for resolved status
  const [pwOpen,    setPwOpen]    = useState(false)
  const [pwInput,   setPwInput]   = useState('')
  const [pwError,   setPwError]   = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [unlocked,  setUnlocked]  = useState(false)

  const isAdmin = (typeof currentUser?.role === 'object'
    ? currentUser.role?.name : currentUser?.role) === 'Admin'

  useEffect(() => {
    setTeamId(inc.assignedTo?.id ?? '')
    setStatus(inc.status)
    setUnlocked(false)
  }, [inc.assignedTo?.id, inc.status])

  const act = (key, fn) => async () => {
    setBusy(b => ({ ...b, [key]: true }))
    setError('')
    try { await fn() } catch (err) { setError(err.message) }
    finally { setBusy(b => ({ ...b, [key]: false })) }
  }

  const submitAdminOverride = async () => {
    if (!pwInput.trim()) { setPwError('Enter your admin password.'); return }
    setPwLoading(true); setPwError('')
    try {
      await authApi.verifyPassword(pwInput)
      setUnlocked(true)
      setPwOpen(false)
      setPwInput('')
    } catch {
      setPwError('Incorrect password.')
    } finally {
      setPwLoading(false)
    }
  }

  const reporterName = inc.reportedBy
    ? (typeof inc.reportedBy === 'object' ? inc.reportedBy.name : inc.reportedBy) : '—'
  const assignedName = inc.assignedTo
    ? (typeof inc.assignedTo === 'object' ? inc.assignedTo.name : inc.assignedTo) : 'Unassigned'

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>

        <div className={s.modalHeader}>
          <div>
            <div className={s.modalTitle}>{inc.title}</div>
            <div className={s.modalSub}><MapPin size={12} /> {inc.location}</div>
          </div>
          <button className={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={s.modalBody}>
          {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

          <div className={s.badgeRow}>
            <span className={s.pill} style={{ background: PRIORITY_COLOR[inc.priority] + '22', color: PRIORITY_COLOR[inc.priority] }}>{inc.priority}</span>
            <span className={s.pill} style={{ background: STATUS_COLOR[inc.status] + '22', color: STATUS_COLOR[inc.status] }}>{inc.status}</span>
            <span className={s.pill} style={{ background: '#f1f5f9', color: '#475569' }}><Tag size={10} /> {inc.type}</span>
          </div>

          <div className={s.infoGrid}>
            <div className={s.infoItem}>
              <span className={s.infoLabel}><User size={11} /> Reported By</span>
              <span className={s.infoVal}>{reporterName}</span>
            </div>
            <div className={s.infoItem}>
              <span className={s.infoLabel}><Clock size={11} /> Date</span>
              <span className={s.infoVal}>{inc.createdAt ? new Date(inc.createdAt).toLocaleString() : '—'}</span>
            </div>
            <div className={s.infoItem}>
              <span className={s.infoLabel}><Users size={11} /> Assigned To</span>
              <span className={s.infoVal}>{assignedName}</span>
            </div>
            <div className={s.infoItem}>
              <span className={s.infoLabel}><Shield size={11} /> Workflow</span>
              <span className={s.infoVal} style={{ display: 'flex', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: inc.validated ? '#16a34a' : '#94a3b8' }}>
                  {inc.validated ? <CheckCircle size={13} /> : <XCircle size={13} />} Validated
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: inc.verified ? '#16a34a' : '#94a3b8' }}>
                  {inc.verified ? <CheckCircle size={13} /> : <XCircle size={13} />} Verified
                </span>
              </span>
            </div>
          </div>

          <div className={s.descBox}>
            <div className={s.descLabel}>Description</div>
            <div className={s.descText}>{inc.description || <span style={{ color: '#94a3b8' }}>No description provided.</span>}</div>
          </div>

          {inc.status === 'Resolved' ? (
            <div className={`${s.actionSection} ${s.resolvedCard}`}>
              <div className={s.actionLabel}><Users size={13} /> Assign Response Team</div>
              <div style={{ fontSize: 12, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <CheckCircle size={13} /> Assignment locked — incident is resolved
              </div>
            </div>
          ) : (
            <div className={s.actionSection}>
              <div className={s.actionLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Users size={13} /> Assign Response Team</span>
                <button
                  className={`${p.btn} ${p.btnSm}`}
                  style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', gap: 5 }}
                  disabled={busy.assign || !teams.length}
                  onClick={handleAutoAssign}
                  title="Auto-assign: matches team specialty to incident type"
                >
                  <Zap size={11} /> Auto Assign
                </button>
              </div>
              <div className={s.actionRow}>
                <select value={teamId} onChange={e => setTeamId(e.target.value)} className={s.actionSelect}>
                  <option value="">— Unassigned —</option>
                  {teams.map(t => {
                    const dyn = getTeamDynStatus(t)
                    return <option key={t.id} value={t.id}>{t.name} — {dyn}{t.specialty ? ` · ${t.specialty}` : ''}</option>
                  })}
                </select>
                <button className={`${p.btn} ${p.btnPrimary} ${p.btnSm}`} disabled={busy.assign}
                  onClick={act('assign', () => onAssign(inc.id, teamId ? +teamId : null))}>
                  {busy.assign ? '…' : 'Assign'}
                </button>
              </div>
              {teams.length > 0 && (
                <div style={{ fontSize: 11, color: '#4a7a52', marginTop: 4 }}>
                  Auto assigns best match for <strong>{inc.type}</strong> incidents
                  {teams.filter(t => getTeamDynStatus(t) === 'Available').length > 0
                    ? ` · ${teams.filter(t => getTeamDynStatus(t) === 'Available').length} team(s) available`
                    : ' · no teams currently available'}
                </div>
              )}
            </div>
          )}

          {(() => {
            const canResolve = inc.validated && inc.verified && inc.assignedTo
            const resolveBlocked = status === 'Resolved' && !canResolve
            const isResolved = inc.status === 'Resolved'
            const statusLocked = isResolved && !unlocked

            return (
              <div className={s.actionSection}>
                <div className={s.actionLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><Shield size={13} /> Update Status</span>
                  {isResolved && isAdmin && !unlocked && (
                    <button
                      className={`${p.btn} ${p.btnSm}`}
                      style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', gap: 5 }}
                      onClick={() => { setPwOpen(true); setPwInput(''); setPwError('') }}
                    >
                      <Lock size={11} /> Admin Override
                    </button>
                  )}
                  {unlocked && (
                    <span style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} /> Unlocked
                    </span>
                  )}
                </div>

                {statusLocked ? (
                  <div style={{ fontSize: 12, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <Lock size={13} /> Status is locked — incident is resolved
                    {!isAdmin && <span style={{ color: '#94a3b8', marginLeft: 4 }}>(Admin only)</span>}
                  </div>
                ) : (
                  <>
                    <div className={s.actionRow}>
                      <select value={status} onChange={e => setStatus(e.target.value)} className={s.actionSelect}>
                        {STATUSES.map(st => (
                          <option key={st} value={st} disabled={st === 'Resolved' && !canResolve}>
                            {st}{st === 'Resolved' && !canResolve ? ' (requires validation, approval & assignment)' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        className={`${p.btn} ${p.btnSuccess} ${p.btnSm}`}
                        disabled={busy.status || status === inc.status || resolveBlocked}
                        onClick={act('status', () => onStatusChange(inc.id, status))}
                      >
                        {busy.status ? '…' : 'Update'}
                      </button>
                    </div>
                    {resolveBlocked && (
                      <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={11} /> Must be validated, approved, and assigned to a team before resolving.
                      </div>
                    )}
                  </>
                )}

                {/* Admin password modal */}
                {pwOpen && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}
                    onClick={() => setPwOpen(false)}>
                    <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 360, padding: '24px 26px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: '#1a2e1c', marginBottom: 12 }}>
                        <Lock size={17} /> Admin Override
                      </div>
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, marginBottom: 16 }}>
                        Enter your admin password to unlock status editing on this resolved incident.
                      </p>
                      <div className={p.field}>
                        <label>Admin Password</label>
                        <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitAdminOverride()}
                          placeholder="Enter your password" autoFocus />
                      </div>
                      {pwError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '7px 10px', marginTop: 8 }}>
                          <XCircle size={13} /> {pwError}
                        </div>
                      )}
                      <div className={p.btnRow} style={{ marginTop: 14 }}>
                        <button className={`${p.btn} ${p.btnPrimary}`} onClick={submitAdminOverride} disabled={pwLoading}>
                          {pwLoading ? 'Verifying…' : 'Confirm'}
                        </button>
                        <button className={`${p.btn} ${p.btnOutline}`} onClick={() => setPwOpen(false)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          <div className={s.modalActions}>
            {!inc.validated && (
              <button className={`${p.btn} ${p.btnWarning} ${p.btnSm}`} disabled={busy.validate}
                onClick={act('validate', () => onValidate(inc.id))}>
                <CheckCircle size={13} /> {busy.validate ? '…' : 'Validate'}
              </button>
            )}
            {inc.validated && !inc.verified && inc.status !== 'Rejected' && (
              <>
                <button className={`${p.btn} ${p.btnSuccess} ${p.btnSm}`} disabled={busy.verify}
                  onClick={act('verify', () => onVerify(inc.id))}>
                  <CheckCircle size={13} /> {busy.verify ? '…' : 'Approve'}
                </button>
                <button className={`${p.btn} ${p.btnDanger} ${p.btnSm}`} disabled={busy.reject}
                  onClick={act('reject', () => onReject(inc.id))}>
                  <XCircle size={13} /> {busy.reject ? '…' : 'Reject'}
                </button>
              </>
            )}
            {inc.status === 'Resolved'
              ? <span className={s.resolvedLock} style={{ marginLeft: 'auto' }}><CheckCircle size={13} /> Resolved — cannot be deleted</span>
              : (inc.validated && inc.verified)
                ? <span className={s.resolvedLock} style={{ marginLeft: 'auto', color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <Lock size={13} /> Validated &amp; verified — deletion locked
                  </span>
                : <button className={`${p.btn} ${p.btnDanger} ${p.btnSm}`} style={{ marginLeft: 'auto' }}
                    disabled={busy.delete} onClick={act('delete', () => onDelete(inc.id))}>
                    <Trash2 size={13} /> {busy.delete ? 'Deleting…' : 'Delete Incident'}
                  </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

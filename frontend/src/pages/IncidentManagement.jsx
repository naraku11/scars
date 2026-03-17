import { useState, useEffect } from 'react'
import {
  Trash2, CheckCircle, XCircle, Search, Plus, Eye, X,
  MapPin, User, Clock, Tag, Shield, Users
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './IncidentManagement.module.css'

const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }
const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Closed: '#94a3b8', Rejected: '#dc2626' }
const INC_TYPES      = ['Fire', 'Medical Emergency', 'Security Threat', 'Accident', 'Natural Disaster', 'Power Outage', 'Theft', 'Vandalism', 'Other']
const PRIORITIES     = ['Critical', 'High', 'Medium', 'Low']
const STATUSES       = ['Open', 'In Progress', 'Resolved', 'Closed', 'Rejected']

const initForm = { title: '', type: 'Fire', priority: 'Medium', location: '', description: '' }

export default function IncidentManagement() {
  const {
    incidents, teams, currentUser,
    addIncident, updateIncident, deleteIncident,
    validateIncident, verifyIncident, assignIncident,
  } = useApp()

  const [search,          setSearch]         = useState('')
  const [filterStatus,    setFilterStatus]   = useState('All')
  const [filterType,      setFilterType]     = useState('All')
  const [filterPriority,  setFilterPriority] = useState('All')
  const [error,           setError]          = useState('')
  const [busy,            setBusy]           = useState({})
  const [viewing,         setViewing]        = useState(null)
  const [showAdd,         setShowAdd]        = useState(false)
  const [addForm,         setAddForm]        = useState(initForm)
  const [addBusy,         setAddBusy]        = useState(false)

  const allTypes    = ['All', ...new Set([...INC_TYPES, ...incidents.map(i => i.type)])]
  const allStatuses = ['All', ...STATUSES]

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase()
    const matchQ  = !q || i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
    return matchQ
      && (filterStatus   === 'All' || i.status   === filterStatus)
      && (filterType     === 'All' || i.type     === filterType)
      && (filterPriority === 'All' || i.priority === filterPriority)
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

  const handleAdd = async (e) => {
    e.preventDefault()
    setAddBusy(true); setError('')
    try {
      await addIncident({ ...addForm, reportedById: currentUser?.id })
      setAddForm(initForm); setShowAdd(false)
    } catch (err) { setError(err.message) }
    finally { setAddBusy(false) }
  }

  const af = (k, v) => setAddForm(f => ({ ...f, [k]: v }))

  const reporterName = (inc) =>
    inc.reportedBy ? (typeof inc.reportedBy === 'object' ? inc.reportedBy.name : inc.reportedBy) : '—'

  const assignedName = (inc) =>
    inc.assignedTo ? (typeof inc.assignedTo === 'object' ? inc.assignedTo.name : inc.assignedTo) : '—'

  // Keep the open modal in sync with live incident state
  const liveViewing = viewing
    ? incidents.find(i => i.id === viewing.id) ?? viewing
    : null

  return (
    <div className={p.page}>
      <Header title="Incident Management" subtitle="Review, validate, and manage all campus incidents" />
      <div className={p.content}>

        {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className={p.statsRow}>
          <div className={p.statCard} style={{ '--stat-accent': '#dc2626' }}>
            <div className={p.statIcon} style={{ background: '#fee2e2' }}><Shield size={20} color="#dc2626" /></div>
            <div className={p.statInfo}>
              <div className={p.statValue}>{incidents.length}</div>
              <div className={p.statLabel}>Total Incidents</div>
              <div className={p.statSub}>{filtered.length} matching filters</div>
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

        <div className={p.card}>
          {/* ── Card header ───────────────────────────────────────── */}
          <div className={p.sectionHeader}>
            <span className={p.sectionTitle}>All Incidents ({filtered.length})</span>
            <button
              className={`${p.btn} ${showAdd ? p.btnOutline : p.btnPrimary}`}
              onClick={() => { setShowAdd(v => !v); setError('') }}
            >
              {showAdd ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Incident</>}
            </button>
          </div>

          {/* ── New Incident form ─────────────────────────────────── */}
          {showAdd && (
            <div className={s.addPanel}>
              <div className={s.addPanelTitle}><Plus size={14} /> Report New Incident</div>
              <form onSubmit={handleAdd}>
                <div className={p.formGrid}>
                  <div className={`${p.field} ${p.formFull}`}>
                    <label>Title *</label>
                    <input value={addForm.title} onChange={e => af('title', e.target.value)} placeholder="Brief incident title…" required />
                  </div>
                  <div className={p.field}>
                    <label>Type *</label>
                    <select value={addForm.type} onChange={e => af('type', e.target.value)}>
                      {INC_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className={p.field}>
                    <label>Priority *</label>
                    <select value={addForm.priority} onChange={e => af('priority', e.target.value)}>
                      {PRIORITIES.map(pr => <option key={pr}>{pr}</option>)}
                    </select>
                  </div>
                  <div className={`${p.field} ${p.formFull}`}>
                    <label>Location *</label>
                    <input value={addForm.location} onChange={e => af('location', e.target.value)} placeholder="Building / Room / Area…" required />
                  </div>
                  <div className={`${p.field} ${p.formFull}`}>
                    <label>Description *</label>
                    <textarea value={addForm.description} onChange={e => af('description', e.target.value)} placeholder="Describe the incident…" rows={3} required />
                  </div>
                </div>
                <div className={p.btnRow} style={{ marginTop: 12 }}>
                  <button type="submit" className={`${p.btn} ${p.btnPrimary}`} disabled={addBusy}>
                    <Plus size={14} /> {addBusy ? 'Saving…' : 'Create Incident'}
                  </button>
                  <button type="button" className={`${p.btn} ${p.btnOutline}`} onClick={() => setShowAdd(false)}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Filter bar ────────────────────────────────────────── */}
          <div className={s.filterBar}>
            <div className={s.searchBox}>
              <Search size={14} className={s.searchIcon} />
              <input
                placeholder="Search incidents…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={s.searchInput}
              />
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

          {/* ── Table ─────────────────────────────────────────────── */}
          <div className={p.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reporter</th>
                  <th>Assigned To</th>
                  <th>Progress</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inc => (
                  <tr key={inc.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{inc.title}</div>
                      <div style={{ fontSize: 11, color: '#4a7a52', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        <MapPin size={10} /> {inc.location}
                      </div>
                    </td>
                    <td>
                      <span className={s.typePill}><Tag size={10} /> {inc.type}</span>
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
                    <td style={{ fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={11} color="#4a7a52" /> {reporterName(inc)}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {inc.assignedTo
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} color="#2563eb" />{assignedName(inc)}</div>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td>
                      <div className={s.progressBadges}>
                        <span className={`${s.progBadge} ${inc.validated ? s.progDone : ''}`} title="Validated">
                          {inc.validated ? <CheckCircle size={11} /> : <XCircle size={11} />} Val
                        </span>
                        <span className={`${s.progBadge} ${inc.verified ? s.progDone : ''}`} title="Verified">
                          {inc.verified ? <CheckCircle size={11} /> : <XCircle size={11} />} Ver
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
                        <button
                          className={`${p.btn} ${p.btnOutline} ${p.btnSm} ${s.actionBtn}`}
                          onClick={() => setViewing(inc)}
                        >
                          <Eye size={12} /> View
                        </button>
                        {!inc.validated && (
                          <button
                            className={`${p.btn} ${p.btnWarning} ${p.btnSm} ${s.actionBtn}`}
                            disabled={busy[`val-${inc.id}`]}
                            onClick={act(`val-${inc.id}`, () => validateIncident(inc.id))}
                          >
                            {busy[`val-${inc.id}`] ? '…' : 'Validate'}
                          </button>
                        )}
                        {inc.validated && !inc.verified && inc.status !== 'Rejected' && (
                          <>
                            <button
                              className={`${p.btn} ${p.btnSuccess} ${p.btnSm} ${s.actionBtn}`}
                              disabled={busy[`ver-${inc.id}`]}
                              onClick={act(`ver-${inc.id}`, () => verifyIncident(inc.id))}
                            >
                              {busy[`ver-${inc.id}`] ? '…' : 'Approve'}
                            </button>
                            <button
                              className={`${p.btn} ${p.btnDanger} ${p.btnSm} ${s.actionBtn}`}
                              disabled={busy[`rej-${inc.id}`]}
                              onClick={act(`rej-${inc.id}`, () => updateIncident(inc.id, { status: 'Rejected' }))}
                            >
                              {busy[`rej-${inc.id}`] ? '…' : 'Reject'}
                            </button>
                          </>
                        )}
                        <div className={s.actionSep} />
                        <button
                          className={`${p.btn} ${p.btnDanger} ${p.btnSm} ${s.delBtn}`}
                          disabled={busy[`del-${inc.id}`]}
                          onClick={act(`del-${inc.id}`, () => deleteIncident(inc.id))}
                          title="Delete incident"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={9} className={p.empty}>No incidents match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────── */}
      {liveViewing && (
        <IncidentDetail
          inc={liveViewing}
          teams={teams}
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

// ── Incident Detail Modal ─────────────────────────────────────────────────────
function IncidentDetail({ inc, teams, onClose, onAssign, onStatusChange, onValidate, onVerify, onReject, onDelete }) {
  const [teamId,  setTeamId]  = useState(inc.assignedTo?.id ?? '')
  const [status,  setStatus]  = useState(inc.status)
  const [busy,    setBusy]    = useState({})
  const [error,   setError]   = useState('')

  useEffect(() => {
    setTeamId(inc.assignedTo?.id ?? '')
    setStatus(inc.status)
  }, [inc.assignedTo?.id, inc.status])

  const act = (key, fn) => async () => {
    setBusy(b => ({ ...b, [key]: true }))
    setError('')
    try { await fn() } catch (err) { setError(err.message) }
    finally { setBusy(b => ({ ...b, [key]: false })) }
  }

  const reporterName = inc.reportedBy
    ? (typeof inc.reportedBy === 'object' ? inc.reportedBy.name : inc.reportedBy) : '—'

  const assignedName = inc.assignedTo
    ? (typeof inc.assignedTo === 'object' ? inc.assignedTo.name : inc.assignedTo) : 'Unassigned'

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>

        {/* Header */}
        <div className={s.modalHeader}>
          <div>
            <div className={s.modalTitle}>{inc.title}</div>
            <div className={s.modalSub}><MapPin size={12} /> {inc.location}</div>
          </div>
          <button className={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={s.modalBody}>

          {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

          {/* Badges */}
          <div className={s.badgeRow}>
            <span className={s.pill} style={{ background: PRIORITY_COLOR[inc.priority] + '22', color: PRIORITY_COLOR[inc.priority] }}>
              {inc.priority}
            </span>
            <span className={s.pill} style={{ background: STATUS_COLOR[inc.status] + '22', color: STATUS_COLOR[inc.status] }}>
              {inc.status}
            </span>
            <span className={s.pill} style={{ background: '#f1f5f9', color: '#475569' }}>
              <Tag size={10} /> {inc.type}
            </span>
          </div>

          {/* Info grid */}
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
              <span className={s.infoVal} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: inc.validated ? '#16a34a' : '#94a3b8' }}>
                  {inc.validated ? <CheckCircle size={13} /> : <XCircle size={13} />} Validated
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: inc.verified ? '#16a34a' : '#94a3b8' }}>
                  {inc.verified ? <CheckCircle size={13} /> : <XCircle size={13} />} Verified
                </span>
              </span>
            </div>
          </div>

          {/* Description */}
          <div className={s.descBox}>
            <div className={s.descLabel}>Description</div>
            <div className={s.descText}>{inc.description || <span style={{ color: '#94a3b8' }}>No description provided.</span>}</div>
          </div>

          {/* Assign Team */}
          <div className={s.actionSection}>
            <div className={s.actionLabel}><Users size={13} /> Assign Response Team</div>
            <div className={s.actionRow}>
              <select
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className={s.actionSelect}
              >
                <option value="">— Unassigned —</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
              <button
                className={`${p.btn} ${p.btnPrimary} ${p.btnSm}`}
                disabled={busy.assign}
                onClick={act('assign', () => onAssign(inc.id, teamId ? +teamId : null))}
              >
                {busy.assign ? '…' : 'Assign'}
              </button>
            </div>
          </div>

          {/* Update Status */}
          <div className={s.actionSection}>
            <div className={s.actionLabel}><Shield size={13} /> Update Status</div>
            <div className={s.actionRow}>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={s.actionSelect}
              >
                {STATUSES.map(st => <option key={st}>{st}</option>)}
              </select>
              <button
                className={`${p.btn} ${p.btnSuccess} ${p.btnSm}`}
                disabled={busy.status || status === inc.status}
                onClick={act('status', () => onStatusChange(inc.id, status))}
              >
                {busy.status ? '…' : 'Update'}
              </button>
            </div>
          </div>

          {/* Workflow + Delete */}
          <div className={s.modalActions}>
            {!inc.validated && (
              <button
                className={`${p.btn} ${p.btnWarning} ${p.btnSm}`}
                disabled={busy.validate}
                onClick={act('validate', () => onValidate(inc.id))}
              >
                <CheckCircle size={13} /> {busy.validate ? '…' : 'Validate'}
              </button>
            )}
            {inc.validated && !inc.verified && inc.status !== 'Rejected' && (
              <>
                <button
                  className={`${p.btn} ${p.btnSuccess} ${p.btnSm}`}
                  disabled={busy.verify}
                  onClick={act('verify', () => onVerify(inc.id))}
                >
                  <CheckCircle size={13} /> {busy.verify ? '…' : 'Approve'}
                </button>
                <button
                  className={`${p.btn} ${p.btnDanger} ${p.btnSm}`}
                  disabled={busy.reject}
                  onClick={act('reject', () => onReject(inc.id))}
                >
                  <XCircle size={13} /> {busy.reject ? '…' : 'Reject'}
                </button>
              </>
            )}
            <button
              className={`${p.btn} ${p.btnDanger} ${p.btnSm}`}
              style={{ marginLeft: 'auto' }}
              disabled={busy.delete}
              onClick={act('delete', () => onDelete(inc.id))}
            >
              <Trash2 size={13} /> {busy.delete ? 'Deleting…' : 'Delete Incident'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

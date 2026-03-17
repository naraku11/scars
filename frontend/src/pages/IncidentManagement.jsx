import { useState } from 'react'
import { Trash2, CheckCircle, XCircle, Search, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './IncidentManagement.module.css'

const PRIORITY_COLOR = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' }
const STATUS_COLOR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Closed: '#94a3b8', Rejected: '#dc2626' }

export default function IncidentManagement() {
  const { incidents, deleteIncident, validateIncident, verifyIncident, updateIncident } = useApp()

  const [search,        setSearch]        = useState('')
  const [filterStatus,  setFilterStatus]  = useState('All')
  const [filterType,    setFilterType]    = useState('All')
  const [filterPriority,setFilterPriority]= useState('All')
  const [error,         setError]         = useState('')
  const [busy,          setBusy]          = useState({})

  const types      = ['All', ...new Set(incidents.map(i => i.type))]
  const statuses   = ['All', 'Open', 'In Progress', 'Resolved', 'Closed', 'Rejected']
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low']

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase()
    const matchSearch = !q || i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
    const matchStatus   = filterStatus   === 'All' || i.status   === filterStatus
    const matchType     = filterType     === 'All' || i.type     === filterType
    const matchPriority = filterPriority === 'All' || i.priority === filterPriority
    return matchSearch && matchStatus && matchType && matchPriority
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

  const reporterName = (inc) => {
    if (!inc.reportedBy) return '—'
    return typeof inc.reportedBy === 'object' ? inc.reportedBy.name : inc.reportedBy
  }

  return (
    <div className={p.page}>
      <Header title="Incident Management" subtitle="Review, validate, and manage all campus incidents" />
      <div className={p.content}>

        {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

        {/* Stats */}
        <div className={p.statsRow}>
          <div className={p.statCard} style={{ '--stat-accent': '#dc2626' }}>
            <div className={p.statIcon} style={{ background: '#fee2e2' }}><Filter size={20} color="#dc2626" /></div>
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
          {/* Filters */}
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
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={s.filterSelect}>
              {statuses.map(st => <option key={st}>{st}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className={s.filterSelect}>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={s.filterSelect}>
              {priorities.map(pr => <option key={pr}>{pr}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className={p.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reported By</th>
                  <th>Validated</th>
                  <th>Verified</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inc => (
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
                    <td style={{ fontSize: 12 }}>{reporterName(inc)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {inc.validated
                        ? <CheckCircle size={15} color="#22c55e" />
                        : <XCircle size={15} color="#d1d5db" />}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {inc.verified
                        ? <CheckCircle size={15} color="#22c55e" />
                        : <XCircle size={15} color="#d1d5db" />}
                    </td>
                    <td style={{ fontSize: 11, color: '#4a7a52', whiteSpace: 'nowrap' }}>
                      {inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className={s.actionCell}>
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
    </div>
  )
}

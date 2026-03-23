import { useState, useMemo } from 'react'
import {
  Download, BarChart2, FileText, Users, Clock,
  CheckCircle, XCircle, AlertTriangle, Shield,
  TrendingUp, Activity, MapPin, Tag, Filter
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, FunnelChart, Funnel, LabelList
} from 'recharts'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './ReportingAnalytics.module.css'

const COLORS       = ['#2E7D32', '#43A047', '#66BB6A', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const PRIORITY_CLR = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' }
const STATUS_CLR   = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#22c55e', Closed: '#94a3b8', Rejected: '#dc2626' }

const roleName = (u) => typeof u?.role === 'object' ? u?.role?.name ?? '' : (u?.role ?? '')

// ── Tooltip formatter ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={s.tooltip}>
      {label && <div className={s.tooltipLabel}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 12 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function ReportingAnalytics() {
  const { incidents, users, teams } = useApp()

  const [tab,    setTab]    = useState('overview')
  const [subTab, setSubTab] = useState('charts')
  const [exportFilter, setExportFilter] = useState({ from: '', to: '', type: 'All', status: 'All', priority: 'All' })
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [tableStatus, setTableStatus] = useState('All')
  const [tableType,   setTableType]   = useState('All')
  const [tablePri,    setTablePri]    = useState('All')

  // ── Derived data (memoized — single pass over incidents) ─────────────────────
  const stats = useMemo(() => {
    const resolved = [], open = [], inProgress = [], rejected = []
    const validated = [], verified = [], assigned = [], pending = []
    for (const i of incidents) {
      if (i.status === 'Resolved')    resolved.push(i)
      if (i.status === 'Open')        open.push(i)
      if (i.status === 'In Progress') inProgress.push(i)
      if (i.status === 'Rejected')    rejected.push(i)
      if (i.validated)                validated.push(i)
      if (i.verified)                 verified.push(i)
      if (i.assignedTo)               assigned.push(i)
      if (!i.validated && i.status !== 'Rejected') pending.push(i)
    }
    const len = incidents.length
    return {
      resolved, open, inProgress, rejected, validated, verified, assigned, pending,
      resolutionRate:   len ? Math.round((resolved.length / len) * 100) : 0,
      validationRate:   len ? Math.round((validated.length / len) * 100) : 0,
      verificationRate: len ? Math.round((verified.length / len) * 100) : 0,
      assignmentRate:   len ? Math.round((assigned.length / len) * 100) : 0,
    }
  }, [incidents])

  const { resolved, open, inProgress, rejected, validated, verified, assigned, pending,
          resolutionRate, validationRate, verificationRate, assignmentRate } = stats

  // by type
  const byType = useMemo(() => {
    const m = {}
    incidents.forEach(i => { m[i.type] = (m[i.type] || 0) + 1 })
    return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count)
  }, [incidents])

  // by status
  const byStatus = useMemo(() => {
    const m = {}
    incidents.forEach(i => { m[i.status] = (m[i.status] || 0) + 1 })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [incidents])

  // by priority
  const byPriority = useMemo(() => {
    const order = ['Critical', 'High', 'Medium', 'Low']
    const m = {}
    incidents.forEach(i => { m[i.priority] = (m[i.priority] || 0) + 1 })
    return order.filter(k => m[k]).map(name => ({ name, count: m[name] }))
  }, [incidents])

  // monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      months[key] = { month: key, reported: 0, resolved: 0 }
    }
    incidents.forEach(inc => {
      const d   = new Date(inc.createdAt)
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      if (months[key]) {
        months[key].reported++
        if (inc.status === 'Resolved') months[key].resolved++
      }
    })
    return Object.values(months)
  }, [incidents])

  // top 5 locations
  const byLocation = useMemo(() => {
    const m = {}
    incidents.forEach(i => { if (i.location) m[i.location] = (m[i.location] || 0) + 1 })
    return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 6)
  }, [incidents])

  // day of week
  const byDow = useMemo(() => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const m = { Sun:0, Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0 }
    incidents.forEach(i => { const d = new Date(i.createdAt); m[days[d.getDay()]]++ })
    return days.map(d => ({ day: d, count: m[d] }))
  }, [incidents])

  // validation funnel (memoized)
  const funnelData = useMemo(() => [
    { name: 'Reported',    value: incidents.length,   fill: '#2E7D32' },
    { name: 'Validated',   value: validated.length,   fill: '#43A047' },
    { name: 'Verified',    value: verified.length,    fill: '#66BB6A' },
    { name: 'Assigned',    value: assigned.length,    fill: '#f59e0b' },
    { name: 'Resolved',    value: resolved.length,    fill: '#22c55e' },
  ], [incidents.length, validated.length, verified.length, assigned.length, resolved.length])

  // team metrics
  const teamMetrics = useMemo(() => teams.map(t => {
    const tid = t.id
    const tAssigned = incidents.filter(i => {
      const aid = typeof i.assignedTo === 'object' ? i.assignedTo?.id : i.assignedTo
      return aid === tid
    })
    const tResolved = tAssigned.filter(i => i.status === 'Resolved')
    return {
      id: tid, name: t.name, specialty: t.specialty, status: t.status,
      assigned: tAssigned.length,
      resolved: tResolved.length,
      open: tAssigned.filter(i => i.status === 'Open').length,
      inProgress: tAssigned.filter(i => i.status === 'In Progress').length,
      rate: tAssigned.length ? Math.round((tResolved.length / tAssigned.length) * 100) : 0,
      members: (t.members || []).length,
    }
  }), [teams, incidents])

  // personnel
  const personnel = useMemo(() =>
    users.filter(u => ['Officer','Responder'].includes(roleName(u))).map(u => {
      const myTeam = teams.find(t =>
        t.members?.some(m => (typeof m === 'object' ? (m.userId ?? m.user?.id) : m) === u.id)
      )
      return { ...u, teamName: myTeam?.name ?? '—', teamStatus: myTeam?.status ?? '—' }
    })
  , [users, teams])

  // filtered table
  const tableData = useMemo(() => {
    const q = tableSearch.toLowerCase()
    return incidents.filter(i =>
      (tableStatus === 'All' || i.status   === tableStatus) &&
      (tableType   === 'All' || i.type     === tableType)   &&
      (tablePri    === 'All' || i.priority === tablePri)    &&
      (!q || i.title.toLowerCase().includes(q) || (i.location||'').toLowerCase().includes(q) || i.type.toLowerCase().includes(q))
    ).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [incidents, tableSearch, tableStatus, tableType, tablePri])

  const allTypes = useMemo(() => ['All', ...new Set(incidents.map(i => i.type))], [incidents])

  // export
  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      let rows = incidents
      if (exportFilter.from)     rows = rows.filter(i => new Date(i.createdAt) >= new Date(exportFilter.from))
      if (exportFilter.to)       rows = rows.filter(i => new Date(i.createdAt) <= new Date(exportFilter.to))
      if (exportFilter.type !== 'All')     rows = rows.filter(i => i.type === exportFilter.type)
      if (exportFilter.status !== 'All')   rows = rows.filter(i => i.status === exportFilter.status)
      if (exportFilter.priority !== 'All') rows = rows.filter(i => i.priority === exportFilter.priority)

      const headers = ['ID','Title','Type','Priority','Status','Location','Reporter','Assigned Team','Validated','Verified','Date Reported','Last Updated']
      const data = rows.map(i => [
        i.id,
        `"${(i.title||'').replace(/"/g,'""')}"`,
        i.type, i.priority, i.status,
        `"${(i.location||'').replace(/"/g,'""')}"`,
        typeof i.reportedBy === 'object' ? (i.reportedBy?.name ?? '') : (i.reportedBy ?? ''),
        typeof i.assignedTo === 'object' ? (i.assignedTo?.name ?? '') : (i.assignedTo ?? ''),
        i.validated ? 'Yes' : 'No',
        i.verified  ? 'Yes' : 'No',
        i.createdAt ? new Date(i.createdAt).toLocaleString() : '',
        i.updatedAt ? new Date(i.updatedAt).toLocaleString() : '',
      ])
      const csv = [headers, ...data].map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `scars_incidents_${new Date().toISOString().slice(0,10)}.csv`; a.click()
      URL.revokeObjectURL(url)
      setExporting(false); setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    }, 800)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={p.page}>
      <Header title="Reporting & Analytics" subtitle="Incident reports and system performance metrics" />
      <div className={p.content}>

        {/* ── Main Tabs ── */}
        <div className={p.tabs}>
          <button className={`${p.tab} ${tab === 'overview' ? p.activeTab : ''}`}  onClick={() => { setTab('overview');  setSubTab('kpi') }}>
            <Activity size={14} /> Overview
          </button>
          <button className={`${p.tab} ${tab === 'reports' ? p.activeTab : ''}`}   onClick={() => { setTab('reports');   setSubTab('charts') }}>
            <BarChart2 size={14} /> Incident Reports
          </button>
          <button className={`${p.tab} ${tab === 'metrics' ? p.activeTab : ''}`}   onClick={() => { setTab('metrics');   setSubTab('teams') }}>
            <TrendingUp size={14} /> Response Metrics
          </button>
          <button className={`${p.tab} ${tab === 'export' ? p.activeTab : ''}`}    onClick={() => { setTab('export');    setSubTab('export') }}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {tab === 'overview' && (
          <>
            {/* KPI row */}
            <div className={s.kpiGrid}>
              {[
                { label: 'Total Incidents',    value: incidents.length,  sub: 'all time',                  color: '#2E7D32', bg: '#E8F5E9', icon: Shield },
                { label: 'Open',               value: open.length,       sub: 'needs response',            color: '#ef4444', bg: '#fee2e2', icon: AlertTriangle },
                { label: 'In Progress',        value: inProgress.length, sub: 'being handled',             color: '#f59e0b', bg: '#fef3c7', icon: Clock },
                { label: 'Resolved',           value: resolved.length,   sub: `${resolutionRate}% rate`,   color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
                { label: 'Rejected',           value: rejected.length,   sub: 'not approved',              color: '#dc2626', bg: '#fee2e2', icon: XCircle },
                { label: 'Pending Validation', value: pending.length,    sub: 'awaiting review',           color: '#6366f1', bg: '#ede9fe', icon: FileText },
              ].map(({ label, value, sub, color, bg, icon: Icon }) => (
                <div key={label} className={s.kpiCard} style={{ borderTopColor: color }}>
                  <div className={s.kpiIcon} style={{ background: bg }}><Icon size={20} color={color} /></div>
                  <div className={s.kpiValue} style={{ color }}>{value}</div>
                  <div className={s.kpiLabel}>{label}</div>
                  <div className={s.kpiSub}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Pipeline progress */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}>Incident Pipeline Progress</span>
              </div>
              <div className={s.pipelineGrid}>
                {[
                  { label: 'Validation Rate',   value: validationRate,   color: '#43A047' },
                  { label: 'Verification Rate',  value: verificationRate, color: '#2E7D32' },
                  { label: 'Assignment Rate',    value: assignmentRate,   color: '#f59e0b' },
                  { label: 'Resolution Rate',    value: resolutionRate,   color: '#16a34a' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={s.pipelineItem}>
                    <div className={s.pipelineHeader}>
                      <span className={s.pipelineLabel}>{label}</span>
                      <span className={s.pipelineVal} style={{ color }}>{value}%</span>
                    </div>
                    <div className={s.progressBar}>
                      <div className={s.progressFill} style={{ width: `${value}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={s.chartsGrid}>
              {/* Monthly trend */}
              <div className={p.card}>
                <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Monthly Trend (Last 6 Months)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradReported" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="reported" stroke="#2E7D32" fill="url(#gradReported)" strokeWidth={2} name="Reported" dot={{ r: 3 }} />
                    <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="url(#gradResolved)" strokeWidth={2} name="Resolved" dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* By priority */}
              <div className={p.card}>
                <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Incidents by Priority</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byPriority} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={65} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Incidents">
                      {byPriority.map((e, i) => <Cell key={i} fill={PRIORITY_CLR[e.name] || '#2E7D32'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent 5 */}
            <div className={p.card}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}>Recent Incidents</span>
                <span style={{ fontSize: 12, color: '#4a7a52' }}>Latest 5 reported</span>
              </div>
              <div className={p.tableWrap}>
                <table>
                  <thead><tr><th>Title</th><th>Type</th><th>Priority</th><th>Status</th><th>Location</th><th>Date</th></tr></thead>
                  <tbody>
                    {[...incidents].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5).map(i => (
                      <tr key={i.id}>
                        <td style={{ fontWeight: 600 }}>{i.title}</td>
                        <td><span style={{ fontSize: 11, color: '#475569', display:'flex', alignItems:'center', gap:3 }}><Tag size={10}/>{i.type}</span></td>
                        <td><span className={s.pill} style={{ background: PRIORITY_CLR[i.priority]+'22', color: PRIORITY_CLR[i.priority] }}>{i.priority}</span></td>
                        <td><span className={s.pill} style={{ background: STATUS_CLR[i.status]+'22', color: STATUS_CLR[i.status] }}>{i.status}</span></td>
                        <td style={{ fontSize: 12, color: '#4a7a52' }}><span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{i.location}</span></td>
                        <td style={{ fontSize: 11, color: '#94a3b8' }}>{i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                    {!incidents.length && <tr><td colSpan={6} className={p.empty}>No incidents yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════════ INCIDENT REPORTS ══════════════ */}
        {tab === 'reports' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'charts' ? p.activeSubTab : ''}`} onClick={() => setSubTab('charts')}>Charts</button>
              <button className={`${p.subTab} ${subTab === 'table'  ? p.activeSubTab : ''}`} onClick={() => setSubTab('table')}>Data Table</button>
            </div>

            {/* ── Charts ── */}
            {subTab === 'charts' && (
              <>
                <div className={s.chartsGrid}>
                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Incidents by Type</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={byType} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Incidents" radius={[4,4,0,0]}>
                          {byType.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Incidents by Status</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={byStatus} cx="50%" cy="50%" outerRadius={80} innerRadius={36} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                          {byStatus.map((e,i) => <Cell key={i} fill={STATUS_CLR[e.name] || COLORS[i]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className={s.legendRow}>
                      {byStatus.map((e,i) => (
                        <span key={i} className={s.legendItem}>
                          <span className={s.legendDot} style={{ background: STATUS_CLR[e.name] || COLORS[i] }} />
                          {e.name} ({e.value})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Monthly Trend</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="reported" stroke="#2E7D32" strokeWidth={2} dot={{ r: 3 }} name="Reported" />
                        <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Day of Week Distribution</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={byDow} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Incidents" fill="#2E7D32" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top locations + validation pipeline */}
                <div className={s.chartsGrid}>
                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Top Locations</div>
                    {byLocation.length === 0 ? <div className={p.empty}>No location data.</div> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={byLocation} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" name="Incidents" fill="#43A047" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Validation Pipeline</div>
                    <div className={s.funnelList}>
                      {funnelData.map((item, i) => {
                        const pct = funnelData[0].value ? Math.round((item.value / funnelData[0].value) * 100) : 0
                        return (
                          <div key={i} className={s.funnelItem}>
                            <div className={s.funnelLabel}>
                              <span>{item.name}</span>
                              <span style={{ color: item.fill, fontWeight: 700 }}>{item.value}</span>
                            </div>
                            <div className={s.progressBar}>
                              <div className={s.progressFill} style={{ width: `${pct}%`, background: item.fill }} />
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'right' }}>{pct}% of reported</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Data Table ── */}
            {subTab === 'table' && (
              <div className={p.card}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle}>All Incidents ({tableData.length})</span>
                </div>
                <div className={s.filterRow}>
                  <div className={s.searchWrap}>
                    <Filter size={13} style={{ color: '#4a7a52' }} />
                    <input
                      placeholder="Search title, location, type…"
                      value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                      className={s.searchInput}
                    />
                  </div>
                  <select value={tableStatus} onChange={e => setTableStatus(e.target.value)} className={s.filterSel}>
                    {['All','Open','In Progress','Resolved','Rejected','Closed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={tableType} onChange={e => setTableType(e.target.value)} className={s.filterSel}>
                    {allTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={tablePri} onChange={e => setTablePri(e.target.value)} className={s.filterSel}>
                    {['All','Critical','High','Medium','Low'].map(pr => <option key={pr}>{pr}</option>)}
                  </select>
                </div>
                <div className={p.tableWrap}>
                  <table>
                    <thead><tr>
                      <th>#</th><th>Title</th><th>Type</th><th>Priority</th><th>Status</th>
                      <th>Location</th><th>Reporter</th><th>Assigned Team</th><th>Val</th><th>Ver</th><th>Date</th>
                    </tr></thead>
                    <tbody>
                      {tableData.map((i, idx) => (
                        <tr key={i.id}>
                          <td style={{ color: '#94a3b8', fontSize: 11 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600, maxWidth: 180 }}>{i.title}</td>
                          <td style={{ fontSize: 12 }}>{i.type}</td>
                          <td><span className={s.pill} style={{ background: PRIORITY_CLR[i.priority]+'22', color: PRIORITY_CLR[i.priority] }}>{i.priority}</span></td>
                          <td><span className={s.pill} style={{ background: STATUS_CLR[i.status]+'22', color: STATUS_CLR[i.status] }}>{i.status}</span></td>
                          <td style={{ fontSize: 12, color: '#4a7a52' }}>{i.location}</td>
                          <td style={{ fontSize: 12 }}>{typeof i.reportedBy === 'object' ? i.reportedBy?.name : i.reportedBy || '—'}</td>
                          <td style={{ fontSize: 12 }}>{typeof i.assignedTo === 'object' ? i.assignedTo?.name : i.assignedTo || <span style={{color:'#94a3b8'}}>—</span>}</td>
                          <td>{i.validated ? <CheckCircle size={13} color="#16a34a" /> : <XCircle size={13} color="#94a3b8" />}</td>
                          <td>{i.verified  ? <CheckCircle size={13} color="#16a34a" /> : <XCircle size={13} color="#94a3b8" />}</td>
                          <td style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                      {!tableData.length && <tr><td colSpan={11} className={p.empty}>No incidents match the filters.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════ RESPONSE METRICS ══════════════ */}
        {tab === 'metrics' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'teams'     ? p.activeSubTab : ''}`} onClick={() => setSubTab('teams')}>Teams</button>
              <button className={`${p.subTab} ${subTab === 'personnel' ? p.activeSubTab : ''}`} onClick={() => setSubTab('personnel')}>Personnel</button>
            </div>

            {/* ── Teams ── */}
            {subTab === 'teams' && (
              <>
                <div className={p.statsRow}>
                  {[
                    { label: 'Total Teams',       value: teams.length,           sub: 'configured',         color:'#2E7D32', bg:'#E8F5E9', icon: Users },
                    { label: 'Available',          value: teams.filter(t=>t.status==='Available').length, sub:'ready to respond', color:'#16a34a', bg:'#dcfce7', icon: CheckCircle },
                    { label: 'On Duty',            value: teams.filter(t=>t.status==='On Duty').length,   sub:'currently active', color:'#f59e0b', bg:'#fef3c7', icon: Activity },
                    { label: 'Resolution Rate',    value: `${resolutionRate}%`,   sub:`${resolved.length} resolved`, color:'#2563eb', bg:'#dbeafe', icon: TrendingUp },
                  ].map(({ label, value, sub, color, bg, icon: Icon }) => (
                    <div key={label} className={p.statCard} style={{ '--stat-accent': color }}>
                      <div className={p.statIcon} style={{ background: bg }}><Icon size={20} color={color} /></div>
                      <div className={p.statInfo}>
                        <div className={p.statValue}>{value}</div>
                        <div className={p.statLabel}>{label}</div>
                        <div className={p.statSub}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={s.chartsGrid}>
                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Team Performance — Assigned vs Resolved</div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={teamMetrics} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="assigned"   fill="#43A047" name="Assigned"   radius={[4,4,0,0]} />
                        <Bar dataKey="resolved"   fill="#22c55e" name="Resolved"   radius={[4,4,0,0]} />
                        <Bar dataKey="open"       fill="#ef4444" name="Open"       radius={[4,4,0,0]} />
                        <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Team Resolution Rates</div>
                    {teamMetrics.length === 0 ? <div className={p.empty}>No teams configured.</div> : (
                      <div className={s.funnelList}>
                        {teamMetrics.map(t => (
                          <div key={t.id} className={s.funnelItem}>
                            <div className={s.funnelLabel}>
                              <span style={{ fontWeight: 600 }}>{t.name}</span>
                              <span style={{ color: '#16a34a', fontWeight: 700 }}>{t.rate}%</span>
                            </div>
                            <div className={s.progressBar}>
                              <div className={s.progressFill} style={{ width: `${t.rate}%`, background: '#22c55e' }} />
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.resolved}/{t.assigned} incidents resolved · {t.members} members</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={p.card}>
                  <div className={p.sectionHeader}>
                    <span className={p.sectionTitle}>Team Summary</span>
                  </div>
                  <div className={p.tableWrap}>
                    <table>
                      <thead><tr>
                        <th>Team</th><th>Specialty</th><th>Members</th><th>Assigned</th><th>Open</th><th>In Progress</th><th>Resolved</th><th>Rate</th><th>Status</th>
                      </tr></thead>
                      <tbody>
                        {teamMetrics.map(t => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 600 }}>{t.name}</td>
                            <td style={{ fontSize: 12, color: '#4a7a52' }}>{t.specialty || '—'}</td>
                            <td>{t.members}</td>
                            <td>{t.assigned}</td>
                            <td><span style={{ color: '#ef4444', fontWeight: 600 }}>{t.open}</span></td>
                            <td><span style={{ color: '#f59e0b', fontWeight: 600 }}>{t.inProgress}</span></td>
                            <td><span style={{ color: '#16a34a', fontWeight: 600 }}>{t.resolved}</span></td>
                            <td>
                              <span className={s.rateBadge} style={{ background: t.rate >= 70 ? '#dcfce7' : t.rate >= 40 ? '#fef3c7' : '#fee2e2', color: t.rate >= 70 ? '#166534' : t.rate >= 40 ? '#92400e' : '#991b1b' }}>
                                {t.rate}%
                              </span>
                            </td>
                            <td><span className={`badge ${t.status === 'Available' ? 'badge-resolved' : 'badge-progress'}`}>{t.status}</span></td>
                          </tr>
                        ))}
                        {!teamMetrics.length && <tr><td colSpan={9} className={p.empty}>No teams yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── Personnel ── */}
            {subTab === 'personnel' && (
              <>
                <div className={`${p.statsRow} ${s.statsRow3}`}>
                  {[
                    { label: 'Officers',   value: personnel.filter(u => roleName(u) === 'Officer').length,   sub: 'active officers',   color: '#6d28d9', bg: '#ede9fe' },
                    { label: 'Responders', value: personnel.filter(u => roleName(u) === 'Responder').length, sub: 'field responders',   color: '#92400e', bg: '#fef3c7' },
                    { label: 'Assigned',   value: personnel.filter(u => u.teamName !== '—').length,          sub: 'in a team',          color: '#2E7D32', bg: '#E8F5E9' },
                  ].map(({ label, value, sub, color, bg }) => (
                    <div key={label} className={p.statCard} style={{ '--stat-accent': color }}>
                      <div className={p.statIcon} style={{ background: bg }}><Users size={20} color={color} /></div>
                      <div className={p.statInfo}>
                        <div className={p.statValue}>{value}</div>
                        <div className={p.statLabel}>{label}</div>
                        <div className={p.statSub}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={p.card}>
                  <div className={p.sectionHeader}>
                    <span className={p.sectionTitle}>Personnel Directory</span>
                    <span style={{ fontSize: 12, color: '#4a7a52' }}>{personnel.length} officers &amp; responders</span>
                  </div>
                  <div className={p.tableWrap}>
                    <table>
                      <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Assigned Team</th><th>Team Status</th><th>User Status</th></tr></thead>
                      <tbody>
                        {personnel.map(u => {
                          const rn = roleName(u)
                          return (
                            <tr key={u.id}>
                              <td style={{ fontWeight: 600 }}>{u.name}</td>
                              <td>
                                <span className={s.rolePill} style={{ background: rn === 'Officer' ? '#ede9fe' : '#fef3c7', color: rn === 'Officer' ? '#6d28d9' : '#92400e' }}>
                                  {rn}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: '#475569' }}>{u.email}</td>
                              <td style={{ fontSize: 12, color: '#475569' }}>{u.phone || <span style={{ color:'#94a3b8' }}>—</span>}</td>
                              <td style={{ fontSize: 12 }}>{u.teamName}</td>
                              <td style={{ fontSize: 12, color: u.teamStatus === 'Available' ? '#16a34a' : '#92400e' }}>{u.teamStatus}</td>
                              <td><span className={`badge ${u.status === 'Active' ? 'badge-resolved' : 'badge-rejected'}`}>{u.status}</span></td>
                            </tr>
                          )
                        })}
                        {!personnel.length && <tr><td colSpan={7} className={p.empty}>No officers or responders found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════ EXPORT ══════════════ */}
        {tab === 'export' && (
          <div className={p.card}>
            <div className={s.pdfHeader}>
              <div className={s.pdfIcon}><FileText size={28} color="#2E7D32" /></div>
              <div>
                <div className={p.sectionTitle}>Export Incident Report</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Filter and download incident data as CSV</div>
              </div>
            </div>

            {exportDone && <div className={`${p.alertBox} ${p.alertSuccess}`}><CheckCircle size={13} /> Report downloaded successfully.</div>}

            <div className={p.formGrid}>
              <div className={p.field}>
                <label>From Date</label>
                <input type="date" value={exportFilter.from} onChange={e => setExportFilter(f => ({ ...f, from: e.target.value }))} />
              </div>
              <div className={p.field}>
                <label>To Date</label>
                <input type="date" value={exportFilter.to} onChange={e => setExportFilter(f => ({ ...f, to: e.target.value }))} />
              </div>
              <div className={p.field}>
                <label>Incident Type</label>
                <select value={exportFilter.type} onChange={e => setExportFilter(f => ({ ...f, type: e.target.value }))}>
                  {allTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className={p.field}>
                <label>Status</label>
                <select value={exportFilter.status} onChange={e => setExportFilter(f => ({ ...f, status: e.target.value }))}>
                  {['All','Open','In Progress','Resolved','Rejected','Closed'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={p.field}>
                <label>Priority</label>
                <select value={exportFilter.priority} onChange={e => setExportFilter(f => ({ ...f, priority: e.target.value }))}>
                  {['All','Critical','High','Medium','Low'].map(pr => <option key={pr}>{pr}</option>)}
                </select>
              </div>
            </div>

            <div className={s.exportPreview}>
              {(() => {
                let preview = incidents
                if (exportFilter.from)             preview = preview.filter(i => new Date(i.createdAt) >= new Date(exportFilter.from))
                if (exportFilter.to)               preview = preview.filter(i => new Date(i.createdAt) <= new Date(exportFilter.to))
                if (exportFilter.type !== 'All')   preview = preview.filter(i => i.type === exportFilter.type)
                if (exportFilter.status !== 'All') preview = preview.filter(i => i.status === exportFilter.status)
                if (exportFilter.priority !== 'All') preview = preview.filter(i => i.priority === exportFilter.priority)
                return (
                  <>
                    <div className={s.exportStatRow}>
                      <div className={s.exportStat}><span className={s.exportStatNum}>{preview.length}</span><span>Matching Records</span></div>
                      <div className={s.exportStat}><span className={s.exportStatNum}>{preview.filter(i=>i.status==='Resolved').length}</span><span>Resolved</span></div>
                      <div className={s.exportStat}><span className={s.exportStatNum}>{preview.filter(i=>i.status==='Open').length}</span><span>Open</span></div>
                      <div className={s.exportStat}><span className={s.exportStatNum}>{preview.filter(i=>i.validated).length}</span><span>Validated</span></div>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                      Columns exported: ID, Title, Type, Priority, Status, Location, Reporter, Assigned Team, Validated, Verified, Date Reported, Last Updated
                    </div>
                  </>
                )
              })()}
            </div>

            <div className={p.btnRow} style={{ marginTop: 20 }}>
              <button className={`${p.btn} ${p.btnPrimary}`} onClick={handleExport} disabled={exporting}>
                <Download size={14} /> {exporting ? 'Generating…' : 'Download CSV'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

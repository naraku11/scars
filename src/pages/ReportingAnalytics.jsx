import { useState } from 'react'
import { Download, BarChart2, FileText, Users, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './ReportingAnalytics.module.css'

const COLORS = ['#2E7D32', '#43A047', '#C9A227', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ReportingAnalytics() {
  const { incidents, users, teams } = useApp()
  const [tab, setTab] = useState('reports')
  const [subTab, setSubTab] = useState('charts')
  const [pdfFilter, setPdfFilter] = useState({ from: '', to: '', type: 'All' })
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfDone, setPdfDone] = useState(false)

  // Chart data
  const typeCounts = incidents.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc }, {})
  const barData = Object.entries(typeCounts).map(([name, count]) => ({ name, count }))

  const statusCounts = incidents.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc }, {})
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  const monthlyCounts = incidents.reduce((acc, i) => {
    const m = new Date(i.createdAt).toLocaleString('default', { month: 'short' })
    acc[m] = (acc[m] || 0) + 1
    return acc
  }, {})
  const lineData = Object.entries(monthlyCounts).map(([month, count]) => ({ month, count }))

  const priorityCounts = incidents.reduce((acc, i) => { acc[i.priority] = (acc[i.priority] || 0) + 1; return acc }, {})
  const priorityData = Object.entries(priorityCounts).map(([name, count]) => ({ name, count }))

  const handleGeneratePdf = () => {
    setPdfGenerating(true)
    setTimeout(() => {
      setPdfGenerating(false)
      setPdfDone(true)
      // Create a fake CSV download
      const rows = [['ID','Title','Type','Priority','Status','Location','Date']]
      incidents.forEach(i => rows.push([i.id, i.title, i.type, i.priority, i.status, i.location, new Date(i.createdAt).toLocaleDateString()]))
      const csv = rows.map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'incident_report.csv'; a.click()
      URL.revokeObjectURL(url)
      setTimeout(() => setPdfDone(false), 3000)
    }, 1500)
  }

  // Response metrics
  const resolvedIncidents = incidents.filter(i => i.status === 'Resolved')
  const resolutionRate = incidents.length ? Math.round((resolvedIncidents.length / incidents.length) * 100) : 0
  const avgPerTeam = teams.length ? (incidents.filter(i => i.assignedTo).length / teams.length).toFixed(1) : 0

  const teamMetrics = teams.map(t => ({
    name: t.name,
    assigned: incidents.filter(i => i.assignedTo === t.id).length,
    resolved: incidents.filter(i => i.assignedTo === t.id && i.status === 'Resolved').length,
  }))

  return (
    <div className={p.page}>
      <Header title="Reporting & Analytics" subtitle="Incident reports and system performance metrics" />
      <div className={p.content}>

        <div className={p.tabs}>
          <button className={`${p.tab} ${tab === 'reports' ? p.activeTab : ''}`} onClick={() => { setTab('reports'); setSubTab('charts') }}>Incident Reports</button>
          <button className={`${p.tab} ${tab === 'metrics' ? p.activeTab : ''}`} onClick={() => { setTab('metrics'); setSubTab('users') }}>Response Metric</button>
        </div>

        {tab === 'reports' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'charts' ? p.activeSubTab : ''}`} onClick={() => setSubTab('charts')}>Chart Generation</button>
              <button className={`${p.subTab} ${subTab === 'pdf' ? p.activeSubTab : ''}`} onClick={() => setSubTab('pdf')}>PDF Generation</button>
            </div>

            {subTab === 'charts' && (
              <div className={s.chartsGrid}>
                <div className={p.card}>
                  <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Incidents by Type</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={p.card}>
                  <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Incidents by Status</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className={p.card}>
                  <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Incidents Over Time</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#2E7D32" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={p.card}>
                  <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Incidents by Priority</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {priorityData.map((entry, i) => {
                          const c = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' }
                          return <Cell key={i} fill={c[entry.name] || '#2E7D32'} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {subTab === 'pdf' && (
              <div className={p.card}>
                <div className={s.pdfHeader}>
                  <div className={s.pdfIcon}><FileText size={28} color="#2E7D32" /></div>
                  <div>
                    <div className={p.sectionTitle}>Generate Incident Report</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Export incident data as CSV report</div>
                  </div>
                </div>
                {pdfDone && <div className={`${p.alertBox} ${p.alertSuccess}`}>Report downloaded successfully!</div>}
                <div className={p.formGrid} style={{ maxWidth: 500 }}>
                  <div className={p.field}>
                    <label>From Date</label>
                    <input type="date" value={pdfFilter.from} onChange={e => setPdfFilter(f => ({ ...f, from: e.target.value }))} />
                  </div>
                  <div className={p.field}>
                    <label>To Date</label>
                    <input type="date" value={pdfFilter.to} onChange={e => setPdfFilter(f => ({ ...f, to: e.target.value }))} />
                  </div>
                  <div className={`${p.field} ${p.formFull}`}>
                    <label>Incident Type</label>
                    <select value={pdfFilter.type} onChange={e => setPdfFilter(f => ({ ...f, type: e.target.value }))}>
                      <option>All</option>
                      {['Security', 'Medical', 'Fire', 'Infrastructure', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className={s.pdfStats}>
                  <div className={s.pdfStat}><span className={s.pdfStatNum}>{incidents.length}</span><span>Total Incidents</span></div>
                  <div className={s.pdfStat}><span className={s.pdfStatNum}>{resolvedIncidents.length}</span><span>Resolved</span></div>
                  <div className={s.pdfStat}><span className={s.pdfStatNum}>{incidents.filter(i => i.status === 'Open').length}</span><span>Open</span></div>
                </div>
                <div className={p.btnRow} style={{ marginTop: 20 }}>
                  <button className={`${p.btn} ${p.btnPrimary}`} onClick={handleGeneratePdf} disabled={pdfGenerating}>
                    <Download size={14} /> {pdfGenerating ? 'Generating…' : 'Download Report (CSV)'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'metrics' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'users' ? p.activeSubTab : ''}`} onClick={() => setSubTab('users')}>User Management</button>
            </div>

            {subTab === 'users' && (
              <div>
                <div className={p.statsRow} style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
                  <div className={p.statCard} style={{ '--stat-accent': '#2E7D32' }}>
                    <div className={p.statIcon} style={{ background: '#E8F5E9' }}><BarChart2 size={22} color="#2E7D32" /></div>
                    <div className={p.statInfo}>
                      <div className={p.statValue}>{resolutionRate}%</div>
                      <div className={p.statLabel}>Resolution Rate</div>
                      <div className={p.statSub}>{resolvedIncidents.length} resolved</div>
                    </div>
                  </div>
                  <div className={p.statCard} style={{ '--stat-accent': '#16a34a' }}>
                    <div className={p.statIcon} style={{ background: '#dcfce7' }}><Users size={22} color="#16a34a" /></div>
                    <div className={p.statInfo}>
                      <div className={p.statValue}>{teams.length}</div>
                      <div className={p.statLabel}>Response Teams</div>
                      <div className={p.statSub}>active units</div>
                    </div>
                  </div>
                  <div className={p.statCard} style={{ '--stat-accent': '#f59e0b' }}>
                    <div className={p.statIcon} style={{ background: '#fef3c7' }}><Clock size={22} color="#f59e0b" /></div>
                    <div className={p.statInfo}>
                      <div className={p.statValue}>{avgPerTeam}</div>
                      <div className={p.statLabel}>Avg. Incidents / Team</div>
                      <div className={p.statSub}>workload balance</div>
                    </div>
                  </div>
                </div>

                <div className={s.chartsGrid}>
                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Team Performance</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={teamMetrics} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="assigned" fill="#43A047" name="Assigned" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="resolved" fill="#22c55e" name="Resolved" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={p.card}>
                    <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Team Summary</div>
                    <div className={p.tableWrap}>
                      <table>
                        <thead><tr><th>Team</th><th>Specialty</th><th>Assigned</th><th>Resolved</th><th>Rate</th><th>Status</th></tr></thead>
                        <tbody>
                          {teamMetrics.map((t, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{t.name}</td>
                              <td>{teams[i]?.specialty}</td>
                              <td>{t.assigned}</td>
                              <td>{t.resolved}</td>
                              <td>{t.assigned ? `${Math.round((t.resolved / t.assigned) * 100)}%` : '—'}</td>
                              <td><span className={`${teams[i]?.status === 'Available' ? 'badge-resolved' : 'badge-progress'} badge`}>{teams[i]?.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

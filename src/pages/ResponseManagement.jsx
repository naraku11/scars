import { useState } from 'react'
import { Zap, Users, CheckCircle, XCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './ResponseManagement.module.css'

const STATUSES = ['Open', 'In Progress', 'Resolved']

export default function ResponseManagement() {
  const { incidents, teams, users, assignIncident, updateStatus } = useApp()
  const [tab, setTab]       = useState('team')
  const [subTab, setSubTab] = useState('verify')
  const [error, setError]   = useState('')

  // Works with API object {id,name,status} or mock number ID
  const getTeamFromInc = (inc) => {
    if (!inc.assignedTo) return null
    const id = typeof inc.assignedTo === 'object' ? inc.assignedTo.id : inc.assignedTo
    return teams.find(t => t.id === id) ?? (typeof inc.assignedTo === 'object' ? inc.assignedTo : null)
  }

  // Works with API members [{userId, user:{name}}] or mock [userId]
  const getMemberNames = (team) => {
    if (!team?.members?.length) return []
    return team.members.map(m => {
      if (typeof m === 'object') return m.user?.name ?? m.name ?? 'Unknown'
      return users.find(u => u.id === m)?.name ?? 'Unknown'
    })
  }

  const unassigned = incidents.filter(i => !i.assignedTo && i.status !== 'Resolved' && i.status !== 'Rejected')
  const assigned   = incidents.filter(i =>  i.assignedTo && i.status !== 'Resolved' && i.status !== 'Rejected')

  const autoAssign = async () => {
    setError('')
    const availTeams = teams.filter(t => t.status === 'Available')
    if (!availTeams.length) { setError('No available teams to assign.'); return }
    try {
      for (let i = 0; i < unassigned.length; i++) {
        await assignIncident(unassigned[i].id, availTeams[i % availTeams.length].id)
      }
    } catch (err) { setError(err.message) }
  }

  const handleAssign = async (incId, teamId) => {
    setError('')
    try { await assignIncident(incId, teamId) } catch (err) { setError(err.message) }
  }

  const handleStatus = async (id, status) => {
    setError('')
    try { await updateStatus(id, status) } catch (err) { setError(err.message) }
  }

  return (
    <div className={p.page}>
      <Header title="Response Management" subtitle="Coordinate and track incident responses" />
      <div className={p.content}>

        {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

        <div className={p.tabs}>
          <button className={`${p.tab} ${tab === 'team' ? p.activeTab : ''}`} onClick={() => { setTab('team'); setSubTab('verify') }}>Response Team</button>
          <button className={`${p.tab} ${tab === 'track' ? p.activeTab : ''}`} onClick={() => { setTab('track'); setSubTab('manual') }}>Status Tracking</button>
        </div>

        {tab === 'team' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'verify' ? p.activeSubTab : ''}`} onClick={() => setSubTab('verify')}>Verify Data</button>
              <button className={`${p.subTab} ${subTab === 'assign' ? p.activeSubTab : ''}`} onClick={() => setSubTab('assign')}>Auto Assign</button>
            </div>

            {subTab === 'verify' && (
              <div className={p.card}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle}>Assigned Incidents ({assigned.length})</span>
                </div>
                {assigned.length === 0 && <div className={p.empty}>No incidents currently assigned.</div>}
                <div className={s.assignedGrid}>
                  {assigned.map(inc => {
                    const team = getTeamFromInc(inc)
                    const members = getMemberNames(team)
                    return (
                      <div key={inc.id} className={s.assignCard}>
                        <div className={s.assignCardHeader}>
                          <span className={s.assignTitle}>{inc.title}</span>
                          <span className={`badge ${inc.status === 'In Progress' ? 'badge-progress' : 'badge-open'}`}>{inc.status}</span>
                        </div>
                        <div className={s.assignMeta}>
                          <span><strong>Type:</strong> {inc.type}</span>
                          <span><strong>Priority:</strong> <span className={`priority-${inc.priority.toLowerCase()}`}>{inc.priority}</span></span>
                          <span><strong>Location:</strong> {inc.location}</span>
                        </div>
                        {team && (
                          <div className={s.teamChip}>
                            <Users size={13} />
                            <span>{team.name}</span>
                            <span className={s.teamSpec}>· {team.specialty}</span>
                            <span className={`${s.teamStatus} ${team.status === 'Available' ? s.tsAvail : s.tsOnDuty}`}>{team.status}</span>
                          </div>
                        )}
                        {members.length > 0 && (
                          <div className={s.assignMeta} style={{ marginTop: 6 }}>
                            {members.map((name, i) => <span key={i} className={s.memberChip}>{name}</span>)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {subTab === 'assign' && (
              <div className={p.card}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle}>Unassigned Incidents ({unassigned.length})</span>
                  <button className={`${p.btn} ${p.btnPrimary}`} onClick={autoAssign} disabled={unassigned.length === 0}>
                    <Zap size={14} /> Auto Assign All
                  </button>
                </div>

                <div className={s.teamsRow}>
                  {teams.map(t => (
                    <div key={t.id} className={s.teamCard}>
                      <div className={s.teamName}>{t.name}</div>
                      <div className={s.teamSpec}>{t.specialty}</div>
                      <span className={`${s.teamStatus} ${t.status === 'Available' ? s.tsAvail : s.tsOnDuty}`}>{t.status}</span>
                      <div style={{ fontSize: 11, color: '#4a7a52', marginTop: 4 }}>
                        {getMemberNames(t).join(', ') || 'No members'}
                      </div>
                    </div>
                  ))}
                </div>

                {unassigned.length === 0 && <div className={p.empty}>All incidents are assigned.</div>}
                <div className={s.assignedGrid} style={{ marginTop: 16 }}>
                  {unassigned.map(inc => (
                    <div key={inc.id} className={s.assignCard}>
                      <div className={s.assignCardHeader}>
                        <span className={s.assignTitle}>{inc.title}</span>
                        <span className={`priority-${inc.priority.toLowerCase()}`}>{inc.priority}</span>
                      </div>
                      <div className={s.assignMeta}>
                        <span>{inc.type}</span><span>{inc.location}</span>
                      </div>
                      <div className={p.btnRow} style={{ marginTop: 8 }}>
                        {teams.map(t => (
                          <button key={t.id} className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => handleAssign(inc.id, t.id)}>
                            Assign to {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'track' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'manual' ? p.activeSubTab : ''}`} onClick={() => setSubTab('manual')}>Manual Update</button>
            </div>

            {subTab === 'manual' && (
              <div className={p.card}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle}>Update Incident Status</span>
                  <div className={s.legend}>
                    <span className={s.legendDot} style={{ background: '#ef4444' }} /> Open
                    <span className={s.legendDot} style={{ background: '#f59e0b', marginLeft: 10 }} /> In Progress
                    <span className={s.legendDot} style={{ background: '#22c55e', marginLeft: 10 }} /> Resolved
                  </div>
                </div>
                <div className={p.tableWrap}>
                  <table>
                    <thead><tr>
                      <th>Incident</th><th>Type</th><th>Priority</th><th>Assigned Team</th><th>Last Updated</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                      {incidents.filter(i => i.status !== 'Rejected').map(inc => {
                        const team = getTeamFromInc(inc)
                        return (
                          <tr key={inc.id}>
                            <td style={{ fontWeight: 600 }}>{inc.title}</td>
                            <td>{inc.type}</td>
                            <td><span className={`priority-${inc.priority.toLowerCase()}`}>{inc.priority}</span></td>
                            <td>
                              {team
                                ? <span className={s.memberChip}><Users size={11} /> {team.name}</span>
                                : <span style={{ color: '#94a3b8', fontSize: 12 }}>Unassigned</span>
                              }
                            </td>
                            <td style={{ fontSize: 11, color: '#4a7a52' }}>{new Date(inc.updatedAt).toLocaleString()}</td>
                            <td>
                              <select
                                value={inc.status}
                                onChange={e => handleStatus(inc.id, e.target.value)}
                                className={s.statusSelect}
                                style={{ borderColor: inc.status === 'Open' ? '#ef4444' : inc.status === 'In Progress' ? '#f59e0b' : '#22c55e' }}
                              >
                                {STATUSES.map(st => <option key={st}>{st}</option>)}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

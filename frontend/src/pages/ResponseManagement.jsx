import { useState, useEffect } from 'react'
import { Zap, Users, CheckCircle, XCircle, Plus, Pencil, Trash2, Shield, UserCheck, ChevronDown, ChevronUp, Lock, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { authApi } from '../services/api'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './ResponseManagement.module.css'

const STATUSES = ['Open', 'In Progress', 'Resolved']

// ── Helpers ───────────────────────────────────────────────────────────────────
const roleName  = (u) => typeof u?.role === 'object' ? u?.role?.name ?? '' : (u?.role ?? '')
const isPersonnel = (u) => ['Officer', 'Responder'].includes(roleName(u))

const initTeamForm = () => ({ name: '', specialty: '', status: 'Available', memberIds: [] })

function Avatar({ user, size = 32 }) {
  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (user?.profileImage) {
    return <img src={user.profileImage} alt={user.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#E8F5E9',
      border: '1.5px solid #C8E6C9', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: '#2E7D32', flexShrink: 0,
    }}>{initials}</div>
  )
}

export default function ResponseManagement() {
  const { incidents, teams, users, currentUser, assignIncident, updateStatus, addTeam, updateTeam, deleteTeam } = useApp()

  const [tab, setTab]         = useState('personnel')
  const [subTab, setSubTab]   = useState('list')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // Team form state
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState(initTeamForm())
  const [saving, setSaving]       = useState(false)
  const [expandedTeam, setExpandedTeam] = useState(null)

  // Password verify modal (for unlocking resolved status changes)
  const [pwModal, setPwModal]         = useState(null)  // { incId, newStatus }
  const [pwInput, setPwInput]         = useState('')
  const [pwError, setPwError]         = useState('')
  const [pwLoading, setPwLoading]     = useState(false)

  // Reassign state
  const [reassignId, setReassignId]   = useState(null)  // incidentId being reassigned

  // Auto-dismiss success
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 3500)
    return () => clearTimeout(t)
  }, [success])

  // ── Personnel ─────────────────────────────────────────────────────────────
  const personnel = users.filter(isPersonnel)

  const getPersonnelTeam = (userId) => {
    return teams.find(t =>
      t.members?.some(m => {
        const mid = typeof m === 'object' ? (m.userId ?? m.user?.id) : m
        return mid === userId
      })
    ) ?? null
  }

  // ── Teams helpers ─────────────────────────────────────────────────────────
  const getMemberUsers = (team) => {
    if (!team?.members?.length) return []
    return team.members.map(m => {
      const uid = typeof m === 'object' ? (m.userId ?? m.user?.id) : m
      return users.find(u => u.id === uid) ?? (typeof m === 'object' ? m.user : null)
    }).filter(Boolean)
  }

  const getTeamFromInc = (inc) => {
    if (!inc.assignedTo) return null
    const id = typeof inc.assignedTo === 'object' ? inc.assignedTo.id : inc.assignedTo
    return teams.find(t => t.id === id) ?? (typeof inc.assignedTo === 'object' ? inc.assignedTo : null)
  }

  const getMemberNames = (team) => {
    if (!team?.members?.length) return []
    return team.members.map(m => {
      if (typeof m === 'object') return m.user?.name ?? m.name ?? 'Unknown'
      return users.find(u => u.id === m)?.name ?? 'Unknown'
    })
  }

  // ── Dynamic team status based on active assigned incidents ─────────────
  const getTeamDynamicStatus = (team) => {
    const hasActive = incidents.some(i => {
      const aid = typeof i.assignedTo === 'object' ? i.assignedTo?.id : i.assignedTo
      return aid === team.id && i.status !== 'Resolved' && i.status !== 'Rejected' && i.status !== 'Closed'
    })
    return hasActive ? 'On Duty' : team.status
  }

  // ── Assignment ───────────────────────────────────────────────────────────
  const unassigned = incidents.filter(i => !i.assignedTo && i.status !== 'Resolved' && i.status !== 'Rejected' && i.status !== 'Closed')
  const assigned   = incidents.filter(i =>  i.assignedTo && i.status !== 'Resolved' && i.status !== 'Rejected' && i.status !== 'Closed')

  const autoAssign = async () => {
    setError('')
    const availTeams = teams.filter(t => getTeamDynamicStatus(t) === 'Available')
    if (!availTeams.length) { setError('No available teams to assign.'); return }
    try {
      for (let i = 0; i < unassigned.length; i++) {
        await assignIncident(unassigned[i].id, availTeams[i % availTeams.length].id)
      }
      setSuccess('All incidents assigned.')
    } catch (err) { setError(err.message) }
  }

  const handleAssign = async (incId, teamId) => {
    setError('')
    try { await assignIncident(incId, teamId); setSuccess('Assigned.') } catch (err) { setError(err.message) }
  }

  const handleStatus = async (id, status) => {
    setError('')
    try { await updateStatus(id, status) } catch (err) { setError(err.message) }
  }

  // ── Team form ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null)
    setForm(initTeamForm())
    setShowForm(true)
  }

  const openEdit = (team) => {
    const ids = (team.members || []).map(m =>
      typeof m === 'object' ? (m.userId ?? m.user?.id) : m
    ).filter(Boolean)
    setEditId(team.id)
    setForm({ name: team.name, specialty: team.specialty || '', status: team.status || 'Available', memberIds: ids })
    setShowForm(true)
  }

  const toggleMember = (uid) => {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(uid)
        ? f.memberIds.filter(id => id !== uid)
        : [...f.memberIds, uid],
    }))
  }

  const handleSaveTeam = async () => {
    if (!form.name.trim()) { setError('Team name is required.'); return }
    setSaving(true); setError('')
    try {
      if (editId) {
        await updateTeam(editId, form)
      } else {
        await addTeam(form)
      }
      setShowForm(false)
      setForm(initTeamForm())
      setEditId(null)
      setSuccess(editId ? 'Team updated.' : 'Team created.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Delete this team?')) return
    setError('')
    try { await deleteTeam(id); setSuccess('Team deleted.') } catch (err) { setError(err.message) }
  }

  // ── Resolved status change — requires password (Admin bypasses) ─────────
  const userRoleName = roleName(currentUser)
  const isAdmin = userRoleName === 'Admin'
  const canModifyResolved = currentUser && userRoleName !== 'Student'

  const handleResolvedStatusChange = (incId, newStatus) => {
    if (!canModifyResolved) {
      setError('Students cannot modify resolved incidents.')
      return
    }
    // Admin bypasses password check entirely
    if (isAdmin) {
      handleStatus(incId, newStatus)
      setSuccess('Status updated.')
      return
    }
    setPwInput('')
    setPwError('')
    setPwModal({ incId, newStatus })
  }

  const submitPasswordVerify = async () => {
    if (!pwInput.trim()) { setPwError('Please enter your password.'); return }
    setPwLoading(true); setPwError('')
    try {
      await authApi.verifyPassword(pwInput)
      await updateStatus(pwModal.incId, pwModal.newStatus)
      setPwModal(null)
      setSuccess('Status updated.')
    } catch (err) {
      setPwError(err.message || 'Incorrect password.')
    } finally {
      setPwLoading(false)
    }
  }

  const changeTab = (t, sub) => {
    setTab(t)
    setSubTab(sub)
    setError('')
    setSuccess('')
    setShowForm(false)
    setReassignId(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={p.page}>
      <Header title="Response Management" subtitle="Coordinate personnel, teams, and incident responses" />
      <div className={p.content}>

        {error   && <div className={`${p.alertBox} ${p.alertDanger}`}  onClick={() => setError('')}><XCircle size={14} />{error}</div>}
        {success && <div className={`${p.alertBox} ${p.alertSuccess}`} onClick={() => setSuccess('')}><CheckCircle size={14} />{success}</div>}

        {/* ── Main Tabs ── */}
        <div className={p.tabs}>
          <button className={`${p.tab} ${tab === 'personnel' ? p.activeTab : ''}`} onClick={() => changeTab('personnel', 'list')}>
            <UserCheck size={14} /> Personnel
          </button>
          <button className={`${p.tab} ${tab === 'teams' ? p.activeTab : ''}`} onClick={() => changeTab('teams', 'roster')}>
            <Users size={14} /> Teams
          </button>
          <button className={`${p.tab} ${tab === 'assign' ? p.activeTab : ''}`} onClick={() => changeTab('assign', 'unassigned')}>
            <Zap size={14} /> Assignments
          </button>
          <button className={`${p.tab} ${tab === 'track' ? p.activeTab : ''}`} onClick={() => changeTab('track', 'active')}>
            <Shield size={14} /> Status Tracking
          </button>
        </div>

        {/* ══════════════ PERSONNEL TAB ══════════════ */}
        {tab === 'personnel' && (
          <div className={p.card}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>Officers &amp; Responders ({personnel.length})</span>
            </div>
            {personnel.length === 0 && <div className={p.empty}>No officers or responders found. Add them in User Management.</div>}
            <div className={p.tableWrap}>
              <table>
                <thead><tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Assigned Team</th>
                  <th>Team Status</th>
                  <th>User Status</th>
                </tr></thead>
                <tbody>
                  {personnel.map(u => {
                    const team = getPersonnelTeam(u.id)
                    const rn = roleName(u)
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className={s.nameCell}>
                            <Avatar user={u} size={30} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: '#4a7a52' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${s.rolePill} ${rn === 'Officer' ? s.roleOfficer : s.roleResponder}`}>
                            {rn === 'Officer' ? <Shield size={10} /> : <Users size={10} />}
                            {rn}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#475569' }}>{u.phone || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                        <td>
                          {team
                            ? <span className={s.teamChip}><Users size={11} />{team.name}</span>
                            : <span style={{ color: '#94a3b8', fontSize: 12 }}>Unassigned</span>
                          }
                        </td>
                        <td>
                          {team ? (() => {
                            const dyn = getTeamDynamicStatus(team)
                            return <span className={`${s.teamStatus} ${dyn === 'Available' ? s.tsAvail : s.tsOnDuty}`}>{dyn}</span>
                          })()
                            : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>
                          }
                        </td>
                        <td>
                          <span className={`${s.statusPill} ${u.status === 'Active' ? s.statusActive : s.statusInactive}`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ TEAMS TAB ══════════════ */}
        {tab === 'teams' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'roster' ? p.activeSubTab : ''}`} onClick={() => { setSubTab('roster'); setShowForm(false) }}>Roster</button>
              <button className={`${p.subTab} ${subTab === 'manage' ? p.activeSubTab : ''}`} onClick={() => { setSubTab('manage'); setShowForm(false) }}>Manage Teams</button>
            </div>

            {/* ── Roster ── */}
            {subTab === 'roster' && (
              <div>
                {teams.length === 0 && <div className={p.empty}>No teams yet. Create one in Manage Teams.</div>}
                <div className={s.teamsGrid}>
                  {teams.map(team => {
                    const members = getMemberUsers(team)
                    const open = expandedTeam === team.id
                    const dynStatus = getTeamDynamicStatus(team)
                    return (
                      <div key={team.id} className={s.rosterCard}>
                        <div className={s.rosterCardTop}>
                          <div>
                            <div className={s.teamName}>{team.name}</div>
                            <div className={s.teamSpec}>{team.specialty || 'General'}</div>
                          </div>
                          <span className={`${s.teamStatus} ${dynStatus === 'Available' ? s.tsAvail : s.tsOnDuty}`}>{dynStatus}</span>
                        </div>
                        <div className={s.memberCount}
                          onClick={() => setExpandedTeam(open ? null : team.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Users size={12} />
                          {members.length} member{members.length !== 1 ? 's' : ''}
                          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                        {open && (
                          <div className={s.memberList}>
                            {members.length === 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>No members</span>}
                            {members.map(u => (
                              <div key={u.id} className={s.memberRow}>
                                <Avatar user={u} size={24} />
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2e1c' }}>{u.name}</div>
                                  <span className={`${s.rolePill} ${roleName(u) === 'Officer' ? s.roleOfficer : s.roleResponder}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                                    {roleName(u)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Manage ── */}
            {subTab === 'manage' && (
              <div className={p.card}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle}>Teams ({teams.length})</span>
                  {!showForm && (
                    <button className={`${p.btn} ${p.btnPrimary}`} onClick={openCreate}>
                      <Plus size={14} /> New Team
                    </button>
                  )}
                </div>

                {/* Create / Edit Form */}
                {showForm && (
                  <div className={s.teamFormPanel}>
                    <div className={s.teamFormTitle}>{editId ? 'Edit Team' : 'Create New Team'}</div>
                    <div className={p.formGrid}>
                      <div className={p.field}>
                        <label>Team Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Alpha Response Team" />
                      </div>
                      <div className={p.field}>
                        <label>Specialty</label>
                        <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Fire, Medical, Security" />
                      </div>
                      <div className={p.field}>
                        <label>Status</label>
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                          <option>Available</option>
                          <option>On Duty</option>
                          <option>Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Member Picker */}
                    <div className={s.memberPickerLabel}>
                      <Users size={13} /> Assign Members (Officers &amp; Responders only)
                    </div>
                    {personnel.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>No officers or responders available.</div>}
                    <div className={s.memberPicker}>
                      {personnel.map(u => {
                        const selected = form.memberIds.includes(u.id)
                        const rn = roleName(u)
                        return (
                          <div
                            key={u.id}
                            className={`${s.memberOption} ${selected ? s.memberOptionSelected : ''}`}
                            onClick={() => toggleMember(u.id)}
                          >
                            <Avatar user={u} size={28} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2e1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                              <span className={`${s.rolePill} ${rn === 'Officer' ? s.roleOfficer : s.roleResponder}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                                {rn}
                              </span>
                            </div>
                            {selected && <CheckCircle size={14} style={{ color: '#16a34a', flexShrink: 0 }} />}
                          </div>
                        )
                      })}
                    </div>

                    <div className={p.btnRow} style={{ marginTop: 14 }}>
                      <button className={`${p.btn} ${p.btnPrimary}`} onClick={handleSaveTeam} disabled={saving}>
                        {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Team'}
                      </button>
                      <button className={`${p.btn} ${p.btnOutline}`} onClick={() => { setShowForm(false); setEditId(null); setForm(initTeamForm()) }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Teams Table */}
                {teams.length === 0 && !showForm && <div className={p.empty}>No teams yet. Click New Team to create one.</div>}
                {teams.length > 0 && (
                  <div className={p.tableWrap}>
                    <table>
                      <thead><tr>
                        <th>Team</th><th>Specialty</th><th>Members</th><th>Status</th><th style={{ width: 90 }}>Actions</th>
                      </tr></thead>
                      <tbody>
                        {teams.map(team => {
                          const members = getMemberUsers(team)
                          const dynStatus = getTeamDynamicStatus(team)
                          return (
                            <tr key={team.id}>
                              <td style={{ fontWeight: 600 }}>{team.name}</td>
                              <td style={{ fontSize: 12, color: '#4a7a52' }}>{team.specialty || '—'}</td>
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {members.length === 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>No members</span>}
                                  {members.map(u => (
                                    <span key={u.id} className={s.memberChip}>
                                      {u.name}
                                      <span className={`${s.rolePill} ${roleName(u) === 'Officer' ? s.roleOfficer : s.roleResponder}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                                        {roleName(u)}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td><span className={`${s.teamStatus} ${dynStatus === 'Available' ? s.tsAvail : s.tsOnDuty}`}>{dynStatus}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => { openEdit(team); setSubTab('manage') }} title="Edit"><Pencil size={12} /></button>
                                  <button className={`${p.btn} ${p.btnDanger} ${p.btnSm}`} onClick={() => handleDeleteTeam(team.id)} title="Delete"><Trash2 size={12} /></button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════ ASSIGNMENTS TAB ══════════════ */}
        {tab === 'assign' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'unassigned' ? p.activeSubTab : ''}`} onClick={() => setSubTab('unassigned')}>Unassigned ({unassigned.length})</button>
              <button className={`${p.subTab} ${subTab === 'assigned'   ? p.activeSubTab : ''}`} onClick={() => setSubTab('assigned')}>Assigned ({assigned.length})</button>
            </div>

            {subTab === 'unassigned' && (
              <div className={p.card}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle}>Unassigned Incidents</span>
                  <button className={`${p.btn} ${p.btnPrimary}`} onClick={autoAssign} disabled={unassigned.length === 0}>
                    <Zap size={14} /> Auto Assign All
                  </button>
                </div>

                {teams.length > 0 && (
                  <div className={s.teamsRow}>
                    {teams.map(t => {
                      const dyn = getTeamDynamicStatus(t)
                      return (
                        <div key={t.id} className={s.teamCard}>
                          <div className={s.teamName}>{t.name}</div>
                          {t.specialty && <div className={s.teamSpec} style={{ fontSize: 11, marginBottom: 4 }}>{t.specialty}</div>}
                          <span className={`${s.teamStatus} ${dyn === 'Available' ? s.tsAvail : s.tsOnDuty}`}>{dyn}</span>
                          <div style={{ fontSize: 11, color: '#4a7a52', marginTop: 4 }}>
                            {getMemberNames(t).join(', ') || <span style={{ color: '#94a3b8' }}>No members</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {unassigned.length === 0 && <div className={p.empty}>All incidents are assigned.</div>}
                <div className={s.assignedGrid}>
                  {unassigned.map(inc => (
                    <div key={inc.id} className={s.assignCard}>
                      <div className={s.assignCardHeader}>
                        <span className={s.assignTitle}>{inc.title}</span>
                        <span className={`priority-${inc.priority.toLowerCase()}`}>{inc.priority}</span>
                      </div>
                      <div className={s.assignMeta}>
                        <span><strong>Type:</strong> {inc.type}</span>
                        <span><strong>Location:</strong> {inc.location}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                          background: inc.validated ? '#dcfce7' : '#fef3c7', color: inc.validated ? '#166534' : '#92400e' }}>
                          {inc.validated ? '✓ Validated' : '⏳ Pending Validation'}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                          background: inc.verified ? '#dcfce7' : '#fef3c7', color: inc.verified ? '#166534' : '#92400e' }}>
                          {inc.verified ? '✓ Verified' : '⏳ Pending Verification'}
                        </span>
                      </div>
                      <div className={p.btnRow} style={{ marginTop: 4, flexWrap: 'wrap', gap: 5 }}>
                        {teams.length === 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>No teams available. Create teams first.</span>}
                        {teams.map(t => {
                          const dyn = getTeamDynamicStatus(t)
                          return (
                            <button key={t.id}
                              className={`${p.btn} ${dyn === 'Available' ? p.btnPrimary : p.btnOutline} ${p.btnSm}`}
                              onClick={() => handleAssign(inc.id, t.id)}
                              title={`${dyn} · ${getMemberNames(t).join(', ') || 'No members'}`}
                            >
                              {t.name} <span style={{ fontSize: 9, opacity: 0.75 }}>({dyn})</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subTab === 'assigned' && (
              <div className={p.card}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle}>Assigned Incidents</span>
                </div>
                {assigned.length === 0 && <div className={p.empty}>No incidents currently assigned.</div>}
                <div className={s.assignedGrid}>
                  {assigned.map(inc => {
                    const team = getTeamFromInc(inc)
                    const members = getMemberNames(team)
                    const dynTeamStatus = team ? getTeamDynamicStatus(team) : null
                    const statusBadge = { 'Open': 'badge-open', 'In Progress': 'badge-progress', 'Resolved': 'badge-resolved', 'Rejected': 'badge-rejected' }
                    const isReassigning = reassignId === inc.id
                    return (
                      <div key={inc.id} className={s.assignCard}>
                        <div className={s.assignCardHeader}>
                          <span className={s.assignTitle}>{inc.title}</span>
                          <span className={`badge ${statusBadge[inc.status] || 'badge-open'}`}>{inc.status}</span>
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
                            {team.specialty && <span className={s.teamSpec}>· {team.specialty}</span>}
                            <span className={`${s.teamStatus} ${dynTeamStatus === 'Available' ? s.tsAvail : s.tsOnDuty}`}>{dynTeamStatus}</span>
                          </div>
                        )}
                        {!team && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>No team data available</div>}
                        {members.length > 0 && (
                          <div className={s.assignMeta} style={{ marginTop: 6 }}>
                            {members.map((name, i) => <span key={i} className={s.memberChip}>{name}</span>)}
                          </div>
                        )}
                        {/* Reassign */}
                        {!isReassigning ? (
                          <button
                            className={`${p.btn} ${p.btnOutline} ${p.btnSm}`}
                            style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                            onClick={() => setReassignId(inc.id)}
                          >
                            <RefreshCw size={11} /> Reassign Team
                          </button>
                        ) : (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7a52', marginBottom: 5 }}>Reassign to:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {teams.filter(t => {
                                const tid = typeof inc.assignedTo === 'object' ? inc.assignedTo?.id : inc.assignedTo
                                return t.id !== tid
                              }).map(t => {
                                const dyn = getTeamDynamicStatus(t)
                                return (
                                  <button key={t.id}
                                    className={`${p.btn} ${dyn === 'Available' ? p.btnPrimary : p.btnOutline} ${p.btnSm}`}
                                    onClick={async () => {
                                      await handleAssign(inc.id, t.id)
                                      setReassignId(null)
                                    }}
                                  >
                                    {t.name} <span style={{ fontSize: 9, opacity: 0.75 }}>({dyn})</span>
                                  </button>
                                )
                              })}
                              {teams.length <= 1 && <span style={{ fontSize: 11, color: '#94a3b8' }}>No other teams available.</span>}
                            </div>
                            <button
                              className={`${p.btn} ${p.btnOutline} ${p.btnSm}`}
                              style={{ marginTop: 6 }}
                              onClick={() => setReassignId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════ STATUS TRACKING TAB ══════════════ */}
        {tab === 'track' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'active' ? p.activeSubTab : ''}`} onClick={() => setSubTab('active')}>
                Active ({incidents.filter(i => i.status !== 'Rejected' && i.status !== 'Resolved' && i.status !== 'Closed').length})
              </button>
              <button className={`${p.subTab} ${subTab === 'resolved' ? p.activeSubTab : ''}`} onClick={() => setSubTab('resolved')}>
                Resolved ({incidents.filter(i => i.status === 'Resolved').length})
              </button>
            </div>

            {/* ── Active sub-tab ── */}
            {subTab === 'active' && (
              <div className={p.card}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle}>
                    Active Incidents ({incidents.filter(i => i.status !== 'Rejected' && i.status !== 'Resolved' && i.status !== 'Closed').length})
                  </span>
                  <div className={s.legend}>
                    <span className={s.legendDot} style={{ background: '#ef4444' }} /> Open
                    <span className={s.legendDot} style={{ background: '#f59e0b', marginLeft: 10 }} /> In Progress
                  </div>
                </div>
                {incidents.filter(i => i.status !== 'Rejected' && i.status !== 'Resolved' && i.status !== 'Closed').length === 0
                  ? <div className={p.empty}>No active incidents.</div>
                  : (
                    <div className={s.assignedGrid}>
                      {incidents.filter(i => i.status !== 'Rejected' && i.status !== 'Resolved' && i.status !== 'Closed').map(inc => {
                        const team = getTeamFromInc(inc)
                        const members = getMemberNames(team)
                        const canResolve = inc.validated && inc.verified && inc.assignedTo
                        const dynTeamStatus = team ? getTeamDynamicStatus(team) : null
                        return (
                          <div key={inc.id} className={s.assignCard}>
                            <div className={s.assignCardHeader}>
                              <span className={s.assignTitle}>{inc.title}</span>
                              <span className={`priority-${inc.priority.toLowerCase()}`}>{inc.priority}</span>
                            </div>
                            <div className={s.assignMeta}>
                              <span><strong>Type:</strong> {inc.type}</span>
                              <span><strong>Location:</strong> {inc.location}</span>
                            </div>
                            {team && (
                              <div className={s.teamChip}>
                                <Users size={13} />
                                <span>{team.name}</span>
                                {team.specialty && <span className={s.teamSpec}>· {team.specialty}</span>}
                                <span className={`${s.teamStatus} ${dynTeamStatus === 'Available' ? s.tsAvail : s.tsOnDuty}`}>{dynTeamStatus}</span>
                              </div>
                            )}
                            {!team && <div style={{ fontSize: 11, color: '#94a3b8' }}>Unassigned</div>}
                            {members.length > 0 && (
                              <div className={s.assignMeta} style={{ marginTop: 4 }}>
                                {members.map((name, i) => <span key={i} className={s.memberChip}>{name}</span>)}
                              </div>
                            )}
                            <div style={{ marginTop: 10 }}>
                              <select
                                value={inc.status}
                                onChange={e => handleStatus(inc.id, e.target.value)}
                                className={s.statusSelect}
                                style={{ width: '100%', borderColor: inc.status === 'Open' ? '#ef4444' : '#f59e0b' }}
                              >
                                {STATUSES.map(st => (
                                  <option key={st} value={st} disabled={st === 'Resolved' && !canResolve}>
                                    {st}{st === 'Resolved' && !canResolve ? ' (needs validation, approval & team)' : ''}
                                  </option>
                                ))}
                              </select>
                              {!canResolve && (
                                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
                                  Resolve requires:{' '}
                                  {!inc.validated ? 'validation · ' : ''}
                                  {!inc.verified ? 'approval · ' : ''}
                                  {!inc.assignedTo ? 'team assignment' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
              </div>
            )}

            {/* ── Resolved sub-tab ── */}
            {subTab === 'resolved' && (
              <div className={`${p.card} ${s.resolvedSection}`}>
                <div className={p.sectionHeader}>
                  <span className={p.sectionTitle} style={{ color: '#16a34a' }}>
                    <CheckCircle size={15} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                    Resolved Incidents ({incidents.filter(i => i.status === 'Resolved').length})
                  </span>
                  <span className={s.resolvedNote}>
                    <Lock size={11} /> Password required to reopen
                  </span>
                </div>
                {incidents.filter(i => i.status === 'Resolved').length === 0
                  ? <div className={p.empty}>No resolved incidents yet.</div>
                  : (
                    <div className={s.assignedGrid}>
                      {incidents.filter(i => i.status === 'Resolved').map(inc => {
                        const team = getTeamFromInc(inc)
                        const members = getMemberNames(team)
                        return (
                          <div key={inc.id} className={`${s.assignCard} ${s.assignCardResolved}`}>
                            <div className={s.assignCardHeader}>
                              <span className={s.assignTitle}>{inc.title}</span>
                              <span className="badge badge-resolved">{inc.priority}</span>
                            </div>
                            <div className={s.assignMeta}>
                              <span><strong>Type:</strong> {inc.type}</span>
                              <span><strong>Location:</strong> {inc.location}</span>
                            </div>
                            {team && (
                              <div className={s.teamChip}>
                                <Users size={13} />
                                <span>{team.name}</span>
                                {team.specialty && <span className={s.teamSpec}>· {team.specialty}</span>}
                                <span className={`${s.teamStatus} ${s.tsAvail}`}>Resolved</span>
                              </div>
                            )}
                            {members.length > 0 && (
                              <div className={s.assignMeta} style={{ marginTop: 4 }}>
                                {members.map((name, i) => <span key={i} className={s.memberChip}>{name}</span>)}
                              </div>
                            )}
                            <div style={{ marginTop: 10 }}>
                              <button
                                className={s.resolvedStatusBtn}
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => handleResolvedStatusChange(inc.id, 'Open')}
                                title={isAdmin ? 'Admin: click to reopen instantly' : canModifyResolved ? 'Click to reopen (password required)' : 'Students cannot modify resolved incidents'}
                                disabled={!canModifyResolved}
                              >
                                <Lock size={11} /> {isAdmin ? 'Resolved — admin reopen' : 'Resolved — click to reopen'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
              </div>
            )}
          </>
        )}

        {/* ── Password Verify Modal ── */}
        {pwModal && (
          <div className={s.pwOverlay} onClick={() => setPwModal(null)}>
            <div className={s.pwModal} onClick={e => e.stopPropagation()}>
              <div className={s.pwModalHeader}>
                <Lock size={18} />
                <span>Verify Identity</span>
              </div>
              <p className={s.pwModalDesc}>
                You are about to change a <strong>Resolved</strong> incident's status.<br />
                Enter your password to confirm.
              </p>
              <div className={p.field}>
                <label>Password</label>
                <input
                  type="password"
                  value={pwInput}
                  onChange={e => setPwInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitPasswordVerify()}
                  placeholder="Enter your password"
                  autoFocus
                />
              </div>
              {pwError && (
                <div className={s.pwError}><XCircle size={13} />{pwError}</div>
              )}
              <div className={p.btnRow} style={{ marginTop: 14 }}>
                <button className={`${p.btn} ${p.btnPrimary}`} onClick={submitPasswordVerify} disabled={pwLoading}>
                  {pwLoading ? 'Verifying…' : 'Confirm'}
                </button>
                <button className={`${p.btn} ${p.btnOutline}`} onClick={() => setPwModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

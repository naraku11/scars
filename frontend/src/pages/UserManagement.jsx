import { useState } from 'react'
import { Plus, Trash2, Edit2, Save, X, Users, Shield, UserCheck, UserX } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './UserManagement.module.css'

const initForm = { name: '', email: '', password: '', role: 'Responder', status: 'Active' }

// Normalize role name from both API object and mock string
const roleName = (u) => typeof u?.role === 'object' ? (u.role?.name ?? '') : (u.role ?? '')
const isAdmin = (u) => roleName(u).toLowerCase() === 'admin'

export default function UserManagement() {
  const { users, roles, addUser, updateUser, deleteUser, currentUser } = useApp()
  const [tab, setTab]             = useState('users')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(initForm)
  const [editingUser, setEditingUser] = useState(null)
  const [search, setSearch]       = useState('')
  const [error, setError]         = useState('')
  const [busy, setBusy]           = useState(false)

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    roleName(u).toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const role   = roles.find(r => r.name === form.role)
      const avatar = form.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U'
      await addUser({ ...form, roleId: role?.id, avatar })
      setForm(initForm); setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to add user.')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const role = roles.find(r => r.name === (editingUser.roleName || roleName(editingUser)))
      await updateUser(editingUser.id, {
        name:   editingUser.name,
        email:  editingUser.email,
        status: editingUser.status,
        roleId: role?.id,
      })
      setEditingUser(null)
    } catch (err) {
      setError(err.message || 'Failed to update user.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id) => {
    setError('')
    try { await deleteUser(id) } catch (err) { setError(err.message) }
  }

  const startEdit = (u) => {
    setShowForm(false)
    setEditingUser({ ...u, roleName: roleName(u) })
  }

  const fc = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className={p.page}>
      <Header title="User Management" subtitle="Manage system users and roles" />
      <div className={p.content}>

        {error && <div className={`${p.alertBox} ${p.alertDanger}`}><X size={14} />{error}</div>}

        <div className={p.tabs}>
          <button className={`${p.tab} ${tab === 'users' ? p.activeTab : ''}`} onClick={() => setTab('users')}>User Authentication</button>
          <button className={`${p.tab} ${tab === 'roles' ? p.activeTab : ''}`} onClick={() => setTab('roles')}>Role Management</button>
        </div>

        {tab === 'users' && (
          <>
          <div className={p.statsRow} style={{ marginBottom: 16 }}>
            {[
              { label: 'Total Users', value: users.length, sub: 'registered accounts', icon: Users, bg: '#E8F5E9', color: '#2E7D32' },
              { label: 'Active', value: users.filter(u => u.status === 'Active').length, sub: 'currently active', icon: UserCheck, bg: '#dcfce7', color: '#16a34a' },
              { label: 'Inactive', value: users.filter(u => u.status !== 'Active').length, sub: 'deactivated', icon: UserX, bg: '#fee2e2', color: '#dc2626' },
              { label: 'Roles', value: roles.length, sub: 'system roles', icon: Shield, bg: '#dbeafe', color: '#2563eb' },
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
          <div className={p.card}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>System Users ({users.length})</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '7px 12px', border: '1px solid #C8E6C9', borderRadius: 6, fontSize: 13, outline: 'none', width: 200 }}
                />
                <button className={`${p.btn} ${p.btnPrimary}`} onClick={() => { setShowForm(v => !v); setEditingUser(null) }}>
                  <Plus size={14} /> Add User
                </button>
              </div>
            </div>

            {showForm && (
              <div className={s.userForm}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#1a2e1c' }}>New User</div>
                <form onSubmit={handleAdd}>
                  <div className={p.formGrid}>
                    <div className={p.field}>
                      <label>Full Name *</label>
                      <input value={form.name} onChange={e => fc('name', e.target.value)} placeholder="Juan dela Cruz" required />
                    </div>
                    <div className={p.field}>
                      <label>Email *</label>
                      <input type="email" value={form.email} onChange={e => fc('email', e.target.value)} placeholder="user@uv.edu.ph" required />
                    </div>
                    <div className={p.field}>
                      <label>Password *</label>
                      <input type="password" value={form.password} onChange={e => fc('password', e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
                    </div>
                    <div className={p.field}>
                      <label>Role</label>
                      <select value={form.role} onChange={e => fc('role', e.target.value)}>
                        {roles.map(r => <option key={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className={p.field}>
                      <label>Status</label>
                      <select value={form.status} onChange={e => fc('status', e.target.value)}>
                        <option>Active</option><option>Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className={p.btnRow} style={{ marginTop: 12 }}>
                    <button type="submit" className={`${p.btn} ${p.btnSuccess}`} disabled={busy}><Save size={14} /> {busy ? 'Saving…' : 'Save User'}</button>
                    <button type="button" className={`${p.btn} ${p.btnOutline}`} onClick={() => setShowForm(false)}><X size={14} /> Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {editingUser && (
              <div className={s.userForm}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#1a2e1c' }}>Edit User: {editingUser.name}</div>
                <form onSubmit={handleUpdate}>
                  <div className={p.formGrid}>
                    <div className={p.field}>
                      <label>Full Name</label>
                      <input value={editingUser.name} onChange={e => setEditingUser(u => ({ ...u, name: e.target.value }))} required />
                    </div>
                    <div className={p.field}>
                      <label>Email</label>
                      <input type="email" value={editingUser.email} onChange={e => setEditingUser(u => ({ ...u, email: e.target.value }))} required />
                    </div>
                    <div className={p.field}>
                      <label>Role</label>
                      <select value={editingUser.roleName} onChange={e => setEditingUser(u => ({ ...u, roleName: e.target.value }))}>
                        {roles.map(r => <option key={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className={p.field}>
                      <label>Status</label>
                      <select value={editingUser.status} onChange={e => setEditingUser(u => ({ ...u, status: e.target.value }))}>
                        <option>Active</option><option>Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className={p.btnRow} style={{ marginTop: 12 }}>
                    <button type="submit" className={`${p.btn} ${p.btnSuccess}`} disabled={busy}><Save size={14} /> {busy ? 'Saving…' : 'Update'}</button>
                    <button type="button" className={`${p.btn} ${p.btnOutline}`} onClick={() => setEditingUser(null)}><X size={14} /> Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className={p.tableWrap}>
              <table>
                <thead><tr>
                  <th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className={s.avatarSm}>{u.avatar}</div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          {u.id === currentUser?.id && <span className={s.youBadge}>You</span>}
                        </div>
                      </td>
                      <td style={{ color: '#4a7a52', fontSize: 12 }}>{u.email}</td>
                      <td><span className={s.roleBadge}>{roleName(u)}</span></td>
                      <td><span className={`badge ${u.status === 'Active' ? 'badge-resolved' : 'badge-rejected'}`}>{u.status}</span></td>
                      <td style={{ fontSize: 11, color: '#4a7a52' }}>
                        {u.joined ? new Date(u.joined).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!isAdmin(u) && <>
                            <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => startEdit(u)}><Edit2 size={12} /></button>
                            <button className={`${p.btn} ${p.btnDanger} ${p.btnSm}`} onClick={() => handleDelete(u.id)} disabled={u.id === currentUser?.id}><Trash2 size={12} /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {tab === 'roles' && (
          <div className={p.card}>
            <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Available Roles</div>
            <div className={s.rolesGrid}>
              {roles.map(r => (
                <div key={r.id} className={s.roleCard} style={{ borderTopColor: r.color }}>
                  <div className={s.roleCardHeader}>
                    <span className={s.roleChip} style={{ background: r.color + '22', color: r.color, border: `1px solid ${r.color}44` }}>{r.name}</span>
                    <span className={s.userCount}>{users.filter(u => roleName(u) === r.name).length} users</span>
                  </div>
                  <p className={s.roleDesc}>{r.description}</p>
                  <div className={s.permList}>
                    {Object.entries(r.permissions).filter(([, v]) => v).map(([k]) => (
                      <span key={k} className={s.permBadge}>{k}</span>
                    ))}
                    {!Object.values(r.permissions).some(Boolean) && <span style={{ fontSize: 12, color: '#94a3b8' }}>No permissions</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

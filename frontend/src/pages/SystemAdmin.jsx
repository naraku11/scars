import { useState, useEffect, useRef } from 'react'
import { Edit2, Save, X, CheckCircle, XCircle, Upload, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './SystemAdmin.module.css'

const PERM_KEYS   = ['incidents', 'response', 'notifications', 'reports', 'admin']
const PERM_LABELS = { incidents: 'Incidents', response: 'Response', notifications: 'Notifications', reports: 'Reports', admin: 'Admin' }

export default function SystemAdmin() {
  const { roles, updateRole, systemConfig, saveSystemConfig } = useApp()
  const [tab, setTab]         = useState('roles')
  const [error, setError]     = useState('')
  const [editingRole, setEditingRole] = useState(null)

  // System config
  const [sysForm, setSysForm] = useState({ ...systemConfig })
  const [sysSaved, setSysSaved] = useState(false)
  const [sysBusy, setSysBusy]   = useState(false)
  const logoInputRef = useRef(null)

  useEffect(() => {
    if (systemConfig?.siteName) setSysForm({ ...systemConfig })
  }, [systemConfig])

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSysForm(f => ({ ...f, logoImage: ev.target.result }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleUpdateRole = async () => {
    setError('')
    try {
      await updateRole(editingRole.id, editingRole)
      setEditingRole(null)
    } catch (err) { setError(err.message) }
  }

  const togglePerm = (key) => {
    setEditingRole(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }))
  }

  const handleSaveSys = async (e) => {
    e.preventDefault()
    setSysBusy(true); setError('')
    try {
      await saveSystemConfig(sysForm)
      setSysSaved(true)
      setTimeout(() => setSysSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSysBusy(false)
    }
  }

  return (
    <div className={p.page}>
      <Header title="System Administration" subtitle="Manage roles, permissions, and system settings" />
      <div className={p.content}>

        {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

        <div className={p.tabs}>
          <button className={`${p.tab} ${tab === 'roles' ? p.activeTab : ''}`} onClick={() => setTab('roles')}>Role Permissions</button>
          <button className={`${p.tab} ${tab === 'settings' ? p.activeTab : ''}`} onClick={() => setTab('settings')}>General Settings</button>
        </div>

        {tab === 'roles' && (
          <div className={p.card}>
            <div className={p.sectionTitle} style={{ marginBottom: 16 }}>Role &amp; Permission Management</div>
            <div className={p.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Description</th>
                    {PERM_KEYS.map(k => <th key={k} style={{ textAlign: 'center' }}>{PERM_LABELS[k]}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => {
                    const isAdmin = role.name.toLowerCase() === 'admin'
                    return (
                    <tr key={role.id}>
                      {editingRole?.id === role.id && !isAdmin ? (
                        <>
                          <td>
                            <input
                              value={editingRole.name}
                              onChange={e => setEditingRole(r => ({ ...r, name: e.target.value }))}
                              style={{ border: '1px solid #C8E6C9', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: 110 }}
                            />
                          </td>
                          <td>
                            <input
                              value={editingRole.description}
                              onChange={e => setEditingRole(r => ({ ...r, description: e.target.value }))}
                              style={{ border: '1px solid #C8E6C9', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: 200 }}
                            />
                          </td>
                          {PERM_KEYS.map(k => (
                            <td key={k} style={{ textAlign: 'center' }}>
                              <input type="checkbox" checked={editingRole.permissions[k] ?? false} onChange={() => togglePerm(k)} />
                            </td>
                          ))}
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className={`${p.btn} ${p.btnSuccess} ${p.btnSm}`} onClick={handleUpdateRole}><Save size={12} /></button>
                              <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => setEditingRole(null)}><X size={12} /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span className={s.roleChip} style={{ background: role.color + '22', color: role.color, borderColor: role.color + '44' }}>
                              {role.name}
                            </span>
                          </td>
                          <td style={{ color: '#4a7a52', fontSize: 12 }}>{role.description}</td>
                          {PERM_KEYS.map(k => (
                            <td key={k} style={{ textAlign: 'center' }}>
                              {role.permissions[k]
                                ? <CheckCircle size={16} color="#22c55e" />
                                : <X size={16} color="#d1dfe8" />}
                            </td>
                          ))}
                          <td>
                            {isAdmin ? (
                              <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Protected</span>
                            ) : (
                              <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => setEditingRole({ ...role })}>
                                <Edit2 size={12} />
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className={p.card} style={{ maxWidth: 560 }}>
            <div className={p.sectionTitle} style={{ marginBottom: 16 }}>General System Settings</div>
            {sysSaved && (
              <div className={`${p.alertBox} ${p.alertSuccess}`}>
                <CheckCircle size={14} /> Settings saved successfully.
              </div>
            )}
            <form onSubmit={handleSaveSys}>

              {/* ── Logo Upload ── */}
              <div className={s.logoSection}>
                <div className={s.logoBadgeWrap}>
                  {sysForm.logoImage ? (
                    <img src={sysForm.logoImage} alt="logo" className={s.logoPreview} />
                  ) : (
                    <div className={s.logoPlaceholder}>
                      <Upload size={22} color="#4a7a52" />
                    </div>
                  )}
                </div>
                <div className={s.logoInfo}>
                  <div className={s.logoLabel}>Main Logo</div>
                  <div className={s.logoHint}>Displayed in the sidebar and loading screen. Recommended: square image, min 80×80px.</div>
                  <div className={s.logoBtns}>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoFile}
                    />
                    <button type="button" className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={() => logoInputRef.current?.click()}>
                      <Upload size={13} /> {sysForm.logoImage ? 'Change' : 'Upload'} Logo
                    </button>
                    {sysForm.logoImage && (
                      <button type="button" className={`${p.btn} ${p.btnDanger} ${p.btnSm}`} onClick={() => setSysForm(f => ({ ...f, logoImage: '' }))}>
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={p.formGrid}>
                <div className={`${p.field} ${p.formFull}`}>
                  <label>System Name</label>
                  <input value={sysForm.siteName ?? ''} onChange={e => setSysForm(f => ({ ...f, siteName: e.target.value }))} />
                </div>
                <div className={p.field}>
                  <label>Timezone</label>
                  <select value={sysForm.timezone ?? 'UTC+8'} onChange={e => setSysForm(f => ({ ...f, timezone: e.target.value }))}>
                    {['UTC+8', 'UTC+0', 'UTC-5', 'UTC+1', 'UTC+9'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className={p.field}>
                  <label>Session Timeout (min)</label>
                  <input type="number" value={sysForm.sessionTimeout ?? 30} onChange={e => setSysForm(f => ({ ...f, sessionTimeout: +e.target.value }))} min={5} max={480} />
                </div>
                <div className={p.field}>
                  <label>Max File Size (MB)</label>
                  <input type="number" value={sysForm.maxFileSize ?? 10} onChange={e => setSysForm(f => ({ ...f, maxFileSize: +e.target.value }))} min={1} max={100} />
                </div>
                <div className={`${p.field} ${p.formFull}`}>
                  <label>Alert Email</label>
                  <input type="email" value={sysForm.alertEmail ?? ''} onChange={e => setSysForm(f => ({ ...f, alertEmail: e.target.value }))} />
                </div>
              </div>
              <div className={p.btnRow} style={{ marginTop: 16 }}>
                <button type="submit" className={`${p.btn} ${p.btnPrimary}`} disabled={sysBusy}>
                  <Save size={14} /> {sysBusy ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}

import { useState } from 'react'
import { Send, Bell, Clock, CheckCircle, XCircle, Zap, AlertTriangle, Info, Trash2, Square, CheckSquare } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './NotificationSystem.module.css'

const TARGETS   = ['All', 'Admin', 'Responders', 'Officers', 'Students']
const TYPES     = ['Emergency', 'Alert', 'Warning', 'Info']
const TITLE_MAX = 60
const MSG_MAX   = 280

const TYPE_META = {
  Emergency: { icon: Zap,           color: '#dc2626', bg: '#fee2e2', hint: 'Urgent — all users alerted immediately' },
  Alert:     { icon: AlertTriangle, color: '#f59e0b', bg: '#fef3c7', hint: 'High attention — important campus notice' },
  Warning:   { icon: AlertTriangle, color: '#d97706', bg: '#fef9c3', hint: 'Caution — users should be aware' },
  Info:      { icon: Info,          color: '#2563eb', bg: '#dbeafe', hint: 'General information or announcement' },
}

const initForm = { title: '', message: '', target: 'All', type: 'Info' }

function BellPreview({ form }) {
  const meta = TYPE_META[form.type] ?? TYPE_META.Info
  const Icon = meta.icon
  if (!form.title && !form.message) return null
  return (
    <div className={s.preview}>
      <span className={s.previewLabel}>Bell preview</span>
      <div className={s.previewItem}>
        <div className={s.previewIcon} style={{ background: meta.bg, color: meta.color }}>
          <Icon size={14} />
        </div>
        <div className={s.previewBody}>
          <div className={s.previewTitle}>{form.title || 'Notification title…'}</div>
          <div className={s.previewMsg}>{form.message || 'Message content…'}</div>
          <div className={s.previewMeta}>
            <span className={s.previewType} style={{ background: meta.bg, color: meta.color }}>
              {form.type}
            </span>
            <span className={s.previewTarget}>→ {form.target}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationSystem() {
  const { notifications, sendNotification, deleteNotification, deleteNotifications, currentUser } = useApp()
  const [form, setForm] = useState(initForm)
  const [sent, setSent]   = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleting, setDeleting]       = useState(false)

  const roleName = typeof currentUser?.role === 'object' ? currentUser.role?.name : currentUser?.role
  const isAdmin  = roleName === 'Admin'

  const fc = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSend = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setSent(false)
    try {
      await sendNotification({ ...form })
      setForm(initForm)
      setSent(true)
      setTimeout(() => setSent(false), 3500)
    } catch (err) {
      setError(err.message || 'Failed to send notification.')
    } finally {
      setBusy(false)
    }
  }

  const titleLeft = TITLE_MAX - form.title.length
  const msgLeft   = MSG_MAX   - form.message.length

  // ── Selection helpers ────────────────────────────────────────────────
  const displayedNotifs = notifications.slice(0, 20)
  const allSelected = displayedNotifs.length > 0 && displayedNotifs.every(n => selectedIds.has(n.id))

  const toggleSelect = (id) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(displayedNotifs.map(n => n.id)))

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || deleting) return
    setDeleting(true)
    try {
      await deleteNotifications([...selectedIds])
      setSelectedIds(new Set())
    } finally { setDeleting(false) }
  }

  const handleDeleteAll = async () => {
    if (notifications.length === 0 || deleting) return
    setDeleting(true)
    try {
      await deleteNotifications(notifications.map(n => n.id))
      setSelectedIds(new Set())
    } finally { setDeleting(false) }
  }

  const handleDeleteOne = async (id) => {
    await deleteNotification(id)
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  return (
    <div className={p.page}>
      <Header title="Notification System" subtitle="Send push alerts to campus users" />
      <div className={p.content}>

        {error && (
          <div className={`${p.alertBox} ${p.alertDanger}`} style={{ marginBottom: 16 }}>
            <XCircle size={14} /> {error}
          </div>
        )}

        <div className={s.splitView}>

          {/* ── Compose form ── */}
          <div className={`${p.card} ${s.formCard}`}>
            <div className={s.channelHeader}>
              <div className={s.channelIcon} style={{ background: '#E8F5E9' }}>
                <Bell size={20} color="#1B5E20" />
              </div>
              <div>
                <div className={p.sectionTitle}>Send Notification</div>
                <div style={{ fontSize: 12, color: '#4a7a52' }}>Push in-app alerts to campus users</div>
              </div>
            </div>

            {sent && (
              <div className={`${p.alertBox} ${p.alertSuccess}`} style={{ marginBottom: 14 }}>
                <CheckCircle size={14} /> Notification sent successfully!
              </div>
            )}

            <form onSubmit={handleSend}>

              {/* Urgency type */}
              <div className={p.field} style={{ marginBottom: 16 }}>
                <label>Urgency Type</label>
                <div className={s.typeGrid}>
                  {TYPES.map(t => {
                    const m    = TYPE_META[t]
                    const Icon = m.icon
                    const active = form.type === t
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`${s.typeBtn} ${active ? s.typeBtnActive : ''}`}
                        style={active ? { borderColor: m.color, background: m.bg + 'cc' } : {}}
                        onClick={() => fc('type', t)}
                      >
                        <Icon size={13} style={{ color: active ? m.color : '#94a3b8', flexShrink: 0 }} />
                        <span style={{ color: active ? m.color : '#475569' }}>{t}</span>
                      </button>
                    )
                  })}
                </div>
                <div className={s.typeHint}>{TYPE_META[form.type]?.hint}</div>
              </div>

              {/* Title */}
              <div className={`${p.field}`} style={{ marginBottom: 12 }}>
                <div className={s.fieldLabelRow}>
                  <label>Title *</label>
                  <span className={titleLeft <= 10 ? s.charWarn : s.charCount}>
                    {titleLeft} left
                  </span>
                </div>
                <input
                  value={form.title}
                  onChange={e => e.target.value.length <= TITLE_MAX && fc('title', e.target.value)}
                  placeholder="Alert title…"
                  required
                />
              </div>

              {/* Message */}
              <div className={p.field} style={{ marginBottom: 12 }}>
                <div className={s.fieldLabelRow}>
                  <label>Message *</label>
                  <span className={msgLeft <= 30 ? s.charWarn : s.charCount}>
                    {msgLeft} left
                  </span>
                </div>
                <textarea
                  value={form.message}
                  onChange={e => e.target.value.length <= MSG_MAX && fc('message', e.target.value)}
                  placeholder="Notification message content…"
                  rows={3}
                  required
                />
              </div>

              {/* Target */}
              <div className={p.field} style={{ marginBottom: 16 }}>
                <label>Target Audience</label>
                <select value={form.target} onChange={e => fc('target', e.target.value)}>
                  {TARGETS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Bell preview */}
              <BellPreview form={form} />

              <div className={p.btnRow} style={{ marginTop: 4 }}>
                <button
                  type="submit"
                  className={`${p.btn} ${p.btnPrimary}`}
                  disabled={busy || !form.title.trim() || !form.message.trim()}
                >
                  <Send size={14} />
                  {busy ? 'Sending…' : 'Send Notification'}
                </button>
              </div>
            </form>
          </div>

          {/* ── History panel ── */}
          <div className={`${p.card} ${s.histCard}`}>
            <div className={p.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Select-all checkbox — admin only */}
                {isAdmin && notifications.length > 0 && (
                  <button
                    className={s.selectAllBtn}
                    onClick={toggleSelectAll}
                    title={allSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allSelected
                      ? <CheckSquare size={15} color="#2E7D32" />
                      : <Square size={15} />}
                  </button>
                )}
                <span className={p.sectionTitle}>History</span>
                <span style={{ fontSize: 11, color: '#4a7a52', background: '#F1F8F2', padding: '2px 8px', borderRadius: 99 }}>
                  {notifications.length}
                </span>
              </div>

              {/* Admin bulk-delete controls */}
              {isAdmin && notifications.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedIds.size > 0 && (
                    <button
                      className={s.deleteSelBtn}
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                    >
                      <Trash2 size={11} />
                      {deleting ? 'Deleting…' : `Delete (${selectedIds.size})`}
                    </button>
                  )}
                  <button
                    className={s.deleteAllBtn}
                    onClick={handleDeleteAll}
                    disabled={deleting}
                    title="Delete all notifications"
                  >
                    <Trash2 size={11} /> All
                  </button>
                </div>
              )}
            </div>

            {notifications.length === 0
              ? <div className={p.empty}><Bell size={28} color="#C8E6C9" />No notifications sent yet.</div>
              : (
                <div className={s.histList}>
                  {displayedNotifs.map(n => {
                    const m = TYPE_META[n.type] ?? { color: '#4a7a52', bg: '#F1F8F2', icon: Bell }
                    const HIcon = m.icon ?? Bell
                    const checked = selectedIds.has(n.id)
                    return (
                      <div
                        key={n.id}
                        className={`${s.histItem} ${checked ? s.histItemSelected : ''}`}
                      >
                        {/* Checkbox — admin only */}
                        {isAdmin && (
                          <button
                            className={s.histCheckbox}
                            onClick={() => toggleSelect(n.id)}
                            title={checked ? 'Deselect' : 'Select'}
                          >
                            {checked
                              ? <CheckSquare size={15} color="#2E7D32" />
                              : <Square size={15} />}
                          </button>
                        )}

                        <div className={s.histIcon} style={{ background: m.bg, color: m.color }}>
                          <HIcon size={14} />
                        </div>
                        <div className={s.histInfo}>
                          <span className={s.histTitle}>{n.title}</span>
                          <span className={s.histMsg}>{n.message}</span>
                          <div className={s.histMeta}>
                            <span className={s.histBadge} style={{ background: m.bg, color: m.color }}>
                              {n.type}
                            </span>
                            <span style={{ fontSize: 11, color: '#4a7a52' }}>→ {n.target}</span>
                            <span className={s.histTime}>
                              <Clock size={10} />
                              {new Date(n.sentAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span className="badge badge-resolved">Sent</span>
                          {/* Delete button — admin only */}
                          {isAdmin && (
                            <button
                              className={s.histDeleteBtn}
                              onClick={() => handleDeleteOne(n.id)}
                              title="Delete notification"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>

        </div>
      </div>
    </div>
  )
}

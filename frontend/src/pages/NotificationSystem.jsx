import { useState } from 'react'
import { Send, Bell, Clock, CheckCircle, XCircle, Zap, AlertTriangle, Info } from 'lucide-react'
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
  const { notifications, sendNotification } = useApp()
  const [form, setForm] = useState(initForm)
  const [sent, setSent]   = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)

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
              <span className={p.sectionTitle}>History</span>
              <span style={{ fontSize: 11, color: '#4a7a52', background: '#F1F8F2', padding: '2px 8px', borderRadius: 99 }}>
                {notifications.length}
              </span>
            </div>
            {notifications.length === 0
              ? <div className={p.empty}><Bell size={28} color="#C8E6C9" />No notifications sent yet.</div>
              : (
                <div className={s.histList}>
                  {notifications.slice(0, 20).map(n => {
                    const m = TYPE_META[n.type] ?? { color: '#4a7a52', bg: '#F1F8F2', icon: Bell }
                    const HIcon = m.icon ?? Bell
                    return (
                      <div key={n.id} className={s.histItem}>
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
                        <span className="badge badge-resolved" style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
                          Sent
                        </span>
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

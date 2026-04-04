import { useState } from 'react'
import { Send, Bell, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './NotificationSystem.module.css'

const TARGETS = ['All', 'Responders', 'Officers', 'Students']
const initForm = { title: '', message: '', target: 'All' }

export default function NotificationSystem() {
  const { notifications, sendNotification } = useApp()
  const [form, setForm] = useState(initForm)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setSent(false)
    try {
      await sendNotification({ ...form, type: 'Web Push' })
      setForm(initForm)
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to send notification.')
    } finally {
      setBusy(false)
    }
  }

  const fc = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className={p.page}>
      <Header title="Notification System" subtitle="Send push alerts to campus users" />
      <div className={p.content}>

        {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

        <div className={s.splitView}>
          <div className={`${p.card} ${s.formCard}`}>
            <div className={s.channelHeader}>
              <div className={s.channelIcon} style={{ background: '#E8F5E9' }}><Bell size={20} color="#1B5E20" /></div>
              <div>
                <div className={p.sectionTitle}>Web Push Notification</div>
                <div style={{ fontSize: 12, color: '#4a7a52' }}>Send in-app push notifications to users</div>
              </div>
            </div>
            {sent && <div className={`${p.alertBox} ${p.alertSuccess}`}><CheckCircle size={14} /> Notification sent successfully!</div>}
            <form onSubmit={handleSend}>
              <div className={p.formGrid}>
                <div className={`${p.field} ${p.formFull}`}>
                  <label>Notification Title *</label>
                  <input value={form.title} onChange={e => fc('title', e.target.value)} placeholder="Alert title..." required />
                </div>
                <div className={`${p.field} ${p.formFull}`}>
                  <label>Message *</label>
                  <textarea value={form.message} onChange={e => fc('message', e.target.value)} placeholder="Notification message content..." rows={3} required />
                </div>
                <div className={p.field}>
                  <label>Target Audience</label>
                  <select value={form.target} onChange={e => fc('target', e.target.value)}>
                    {TARGETS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className={p.btnRow} style={{ marginTop: 14 }}>
                <button type="submit" className={`${p.btn} ${p.btnPrimary}`} disabled={busy}>
                  <Send size={14} /> {busy ? 'Sending…' : 'Send Push'}
                </button>
              </div>
            </form>
          </div>

          <NotifHistory notifications={notifications} />
        </div>
      </div>
    </div>
  )
}

function NotifHistory({ notifications }) {
  const typeBg    = { 'Web Push': '#E8F5E9' }
  const typeColor = { 'Web Push': '#1B5E20' }

  return (
    <div className={`${p.card} ${s.histCard}`} style={{ flex: 1 }}>
      <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Notification History</div>
      {notifications.length === 0 && <div className={p.empty}>No notifications sent yet.</div>}
      <div className={s.histList}>
        {notifications.slice(0, 8).map(n => (
          <div key={n.id} className={s.histItem}>
            <div className={s.histIcon} style={{ background: typeBg[n.type] || '#F1F8F2', color: typeColor[n.type] || '#4a7a52' }}>
              <Bell size={14} />
            </div>
            <div className={s.histInfo}>
              <span className={s.histTitle}>{n.title}</span>
              <span className={s.histMsg}>{n.message}</span>
              <div className={s.histMeta}>
                <span><strong>To:</strong> {n.target}</span>
                <span className={s.histTime}><Clock size={11} /> {new Date(n.sentAt).toLocaleString()}</span>
              </div>
            </div>
            <span className="badge badge-resolved" style={{ alignSelf: 'flex-start', flexShrink: 0 }}>Sent</span>
          </div>
        ))}
      </div>
    </div>
  )
}

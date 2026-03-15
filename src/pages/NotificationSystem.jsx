import { useState } from 'react'
import { Send, Bell, MessageSquare, Mail, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './NotificationSystem.module.css'

const TARGETS = ['All', 'Admin', 'Responders', 'Officers', 'Students']
const initForm = { title: '', message: '', target: 'All' }

export default function NotificationSystem() {
  const { notifications, sendNotification } = useApp()
  const [tab, setTab]       = useState('alert')
  const [subTab, setSubTab] = useState('push')
  const [form, setForm]     = useState(initForm)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')
  const [busy, setBusy]     = useState(false)

  const handleSend = (type) => async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setSent(false)
    try {
      await sendNotification({ ...form, type })
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

  const typeIcon = (type) => {
    if (type === 'Web Push') return <Bell size={14} />
    if (type === 'SMS') return <MessageSquare size={14} />
    return <Mail size={14} />
  }

  const typeBg    = { 'Web Push': '#E8F5E9', SMS: '#fef3c7', Email: '#dcfce7' }
  const typeColor = { 'Web Push': '#1B5E20', SMS: '#92400e', Email: '#166534' }

  return (
    <div className={p.page}>
      <Header title="Notification System" subtitle="Send alerts via multiple channels" />
      <div className={p.content}>

        {error && <div className={`${p.alertBox} ${p.alertDanger}`}><XCircle size={14} />{error}</div>}

        <div className={p.tabs}>
          <button className={`${p.tab} ${tab === 'alert' ? p.activeTab : ''}`} onClick={() => { setTab('alert'); setSubTab('push') }}>Alert Send</button>
          <button className={`${p.tab} ${tab === 'multi' ? p.activeTab : ''}`} onClick={() => { setTab('multi'); setSubTab('sms') }}>Multi Channel</button>
        </div>

        {tab === 'alert' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'push' ? p.activeSubTab : ''}`} onClick={() => setSubTab('push')}>Web Push</button>
            </div>

            {subTab === 'push' && (
              <div className={s.splitView}>
                <div className={`${p.card} ${s.formCard}`}>
                  <div className={s.channelHeader}>
                    <div className={s.channelIcon} style={{ background: '#E8F5E9' }}><Bell size={20} color="#1B5E20" /></div>
                    <div>
                      <div className={p.sectionTitle}>Web Push Notification</div>
                      <div style={{ fontSize: 12, color: '#4a7a52' }}>Send browser push notifications to users</div>
                    </div>
                  </div>
                  {sent && <div className={`${p.alertBox} ${p.alertSuccess}`}><CheckCircle size={14} /> Notification sent successfully!</div>}
                  <form onSubmit={handleSend('Web Push')}>
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
                      <button type="submit" className={`${p.btn} ${p.btnPrimary}`} disabled={busy}><Send size={14} /> {busy ? 'Sending…' : 'Send Push'}</button>
                    </div>
                  </form>
                </div>
                <NotifHistory notifications={notifications} typeIcon={typeIcon} typeBg={typeBg} typeColor={typeColor} />
              </div>
            )}
          </>
        )}

        {tab === 'multi' && (
          <>
            <div className={p.subTabs}>
              <button className={`${p.subTab} ${subTab === 'sms' ? p.activeSubTab : ''}`} onClick={() => setSubTab('sms')}>SMS Text</button>
              <button className={`${p.subTab} ${subTab === 'email' ? p.activeSubTab : ''}`} onClick={() => setSubTab('email')}>Email Alert</button>
            </div>

            {subTab === 'sms' && (
              <div className={s.splitView}>
                <div className={`${p.card} ${s.formCard}`}>
                  <div className={s.channelHeader}>
                    <div className={s.channelIcon} style={{ background: '#fef3c7' }}><MessageSquare size={20} color="#92400e" /></div>
                    <div>
                      <div className={p.sectionTitle}>SMS Text Message</div>
                      <div style={{ fontSize: 12, color: '#4a7a52' }}>Send SMS alerts to registered phone numbers</div>
                    </div>
                  </div>
                  {sent && <div className={`${p.alertBox} ${p.alertSuccess}`}><CheckCircle size={14} /> SMS sent successfully!</div>}
                  <form onSubmit={handleSend('SMS')}>
                    <div className={p.formGrid}>
                      <div className={`${p.field} ${p.formFull}`}>
                        <label>Message Title *</label>
                        <input value={form.title} onChange={e => fc('title', e.target.value)} placeholder="SMS title/subject..." required />
                      </div>
                      <div className={`${p.field} ${p.formFull}`}>
                        <label>SMS Message * <span style={{ fontSize: 11, color: '#94a3b8' }}>({form.message.length}/160)</span></label>
                        <textarea value={form.message} onChange={e => fc('message', e.target.value.slice(0, 160))} placeholder="SMS message (max 160 chars)..." rows={3} required />
                      </div>
                      <div className={p.field}>
                        <label>Recipients</label>
                        <select value={form.target} onChange={e => fc('target', e.target.value)}>
                          {TARGETS.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className={p.btnRow} style={{ marginTop: 14 }}>
                      <button type="submit" className={`${p.btn} ${p.btnWarning}`} disabled={busy}><Send size={14} /> {busy ? 'Sending…' : 'Send SMS'}</button>
                    </div>
                  </form>
                </div>
                <NotifHistory notifications={notifications.filter(n => n.type === 'SMS')} typeIcon={typeIcon} typeBg={typeBg} typeColor={typeColor} />
              </div>
            )}

            {subTab === 'email' && (
              <div className={s.splitView}>
                <div className={`${p.card} ${s.formCard}`}>
                  <div className={s.channelHeader}>
                    <div className={s.channelIcon} style={{ background: '#dcfce7' }}><Mail size={20} color="#166534" /></div>
                    <div>
                      <div className={p.sectionTitle}>Email Alert</div>
                      <div style={{ fontSize: 12, color: '#4a7a52' }}>Send email notifications to users</div>
                    </div>
                  </div>
                  {sent && <div className={`${p.alertBox} ${p.alertSuccess}`}><CheckCircle size={14} /> Email sent successfully!</div>}
                  <form onSubmit={handleSend('Email')}>
                    <div className={p.formGrid}>
                      <div className={`${p.field} ${p.formFull}`}>
                        <label>Subject *</label>
                        <input value={form.title} onChange={e => fc('title', e.target.value)} placeholder="Email subject..." required />
                      </div>
                      <div className={`${p.field} ${p.formFull}`}>
                        <label>Email Body *</label>
                        <textarea value={form.message} onChange={e => fc('message', e.target.value)} placeholder="Email body content..." rows={5} required />
                      </div>
                      <div className={p.field}>
                        <label>To (Recipients)</label>
                        <select value={form.target} onChange={e => fc('target', e.target.value)}>
                          {TARGETS.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className={p.btnRow} style={{ marginTop: 14 }}>
                      <button type="submit" className={`${p.btn} ${p.btnSuccess}`} disabled={busy}><Send size={14} /> {busy ? 'Sending…' : 'Send Email'}</button>
                    </div>
                  </form>
                </div>
                <NotifHistory notifications={notifications.filter(n => n.type === 'Email')} typeIcon={typeIcon} typeBg={typeBg} typeColor={typeColor} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function NotifHistory({ notifications, typeIcon, typeBg, typeColor }) {
  return (
    <div className={`${p.card} ${s.histCard}`} style={{ flex: 1 }}>
      <div className={p.sectionTitle} style={{ marginBottom: 14 }}>Notification History</div>
      {notifications.length === 0 && <div className={p.empty}>No notifications sent yet.</div>}
      <div className={s.histList}>
        {notifications.slice(0, 8).map(n => (
          <div key={n.id} className={s.histItem}>
            <div className={s.histIcon} style={{ background: typeBg[n.type] || '#F1F8F2', color: typeColor[n.type] || '#4a7a52' }}>
              {typeIcon(n.type)}
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

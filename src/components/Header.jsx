import { useState, useEffect, useRef } from 'react'
import { Bell, Menu, X, CheckCircle, AlertTriangle, Info, Zap, ShieldCheck } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import s from './Header.module.css'

const TYPE_ICON = {
  Emergency: Zap,
  Alert:     AlertTriangle,
  Warning:   AlertTriangle,
  Info:      Info,
}
const TYPE_COLOR = {
  Emergency: '#dc2626',
  Alert:     '#f59e0b',
  Warning:   '#f59e0b',
  Info:      '#2563eb',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Header({ title, subtitle }) {
  const { notifications, currentUser, systemConfig } = useApp()
  const logoImage = systemConfig?.logoImage
  const ctx = useOutletContext()

  const [open, setOpen]       = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('scars_read_notifs') || '[]')) }
    catch { return new Set() }
  })

  const wrapRef = useRef()

  // Map role name → target label used in notifications
  const roleName = typeof currentUser?.role === 'object' ? currentUser.role?.name : currentUser?.role
  const TARGET_MAP = { Admin: 'Admin', Officer: 'Officers', Responder: 'Responders', Student: 'Students' }
  const myTarget   = TARGET_MAP[roleName] ?? ''

  const sorted = [...notifications]
    .filter(n => n.target === 'All' || n.target === myTarget)
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

  const unread  = sorted.filter(n => !readIds.has(n.id)).length

  // Mark all as read when panel opens
  const handleOpen = () => {
    setOpen(v => {
      if (!v) {
        const allIds = sorted.map(n => n.id)
        const next   = new Set([...readIds, ...allIds])
        setReadIds(next)
        localStorage.setItem('scars_read_notifs', JSON.stringify([...next]))
      }
      return !v
    })
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // New notification arrives while panel is closed → re-add to unread
  useEffect(() => {
    if (!open && sorted.length > 0) {
      const newest = sorted[0]
      if (!readIds.has(newest.id)) return // already unread, nothing to do
    }
  }, [notifications]) // eslint-disable-line

  return (
    <header className={s.header}>
      <div className={s.left}>
        <button className={s.menuBtn} onClick={ctx?.onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        {/* Logo badge — always visible; prominent on mobile when sidebar is hidden */}
        <div className={s.headerLogo}>
          {logoImage
            ? <img src={logoImage} alt="logo" className={s.headerLogoImg} />
            : <ShieldCheck size={18} color="#C9A227" />}
        </div>
        <div>
          <h1 className={s.title}>{title}</h1>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        </div>
      </div>

      <div className={s.right}>
        {/* Bell */}
        <div ref={wrapRef} className={s.notifContainer}>
          <button
            className={`${s.notifBtn} ${open ? s.notifBtnActive : ''}`}
            onClick={handleOpen}
            aria-label="Notifications"
          >
            <Bell size={18} className={unread > 0 ? s.bellRing : ''} />
            {unread > 0 && <span className={s.badge}>{unread > 99 ? '99+' : unread}</span>}
          </button>

          {open && (
            <div className={s.dropdown}>
              {/* Header */}
              <div className={s.dropHeader}>
                <span className={s.dropTitle}>Notifications</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {sorted.length > 0 && (
                    <span className={s.dropCount}>{sorted.length} total</span>
                  )}
                  <button className={s.dropClose} onClick={() => setOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className={s.dropList}>
                {sorted.length === 0 ? (
                  <div className={s.empty}>
                    <Bell size={24} />
                    <span>No notifications yet</span>
                  </div>
                ) : (
                  sorted.slice(0, 20).map(n => {
                    const Icon  = TYPE_ICON[n.type] ?? Info
                    const color = TYPE_COLOR[n.type] ?? '#4a7a52'
                    const isNew = !readIds.has(n.id)
                    return (
                      <div key={n.id} className={`${s.notifItem} ${isNew ? s.notifNew : ''}`}>
                        <div className={s.notifIcon} style={{ background: color + '18', color }}>
                          <Icon size={14} />
                        </div>
                        <div className={s.notifBody}>
                          <div className={s.notifTop}>
                            <span className={s.notifTitle}>{n.title}</span>
                            <span className={s.notifTime}>{timeAgo(n.sentAt)}</span>
                          </div>
                          <div className={s.notifMsg}>{n.message}</div>
                          <div className={s.notifMeta}>
                            <span className={s.notifType} style={{ background: color + '18', color }}>{n.type}</span>
                            <span className={s.notifTarget}>→ {n.target}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {sorted.length > 0 && (
                <div className={s.dropFooter}>
                  <CheckCircle size={12} /> All caught up
                </div>
              )}
            </div>
          )}
        </div>

        <span className={s.date}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>
    </header>
  )
}

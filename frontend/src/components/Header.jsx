import { useState, useEffect, useRef } from 'react'
import { Bell, Menu, X, CheckCircle, AlertTriangle, Info, Zap, ShieldCheck, ExternalLink, UserCircle, LogOut } from 'lucide-react'
import { useOutletContext, useNavigate } from 'react-router-dom'
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
  const { notifications, incidentAlerts, currentUser, systemConfig, logout } = useApp()
  const logoImage = systemConfig?.logoImage
  const ctx = useOutletContext()
  const navigate = useNavigate()

  const [open, setOpen]             = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('scars_read_notifs') || '[]')) }
    catch { return new Set() }
  })
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('scars_dismissed_notifs') || '[]')) }
    catch { return new Set() }
  })

  const wrapRef    = useRef()
  const accountRef = useRef()

  const roleName = typeof currentUser?.role === 'object' ? currentUser.role?.name : currentUser?.role

  const handleLogout = () => { logout(); navigate('/') }

  // Map role name → target label used in notifications
  const TARGET_MAP = { Admin: 'Admin', Officer: 'Officers', Responder: 'Responders', Student: 'Students' }
  const myTarget   = TARGET_MAP[roleName] ?? ''

  const isStudent = roleName === 'Student'

  // DB notifications filtered by role target (exclude Admin-targeted ones for non-admins)
  const dbNotifs = [...notifications].filter(n => {
    if (n.target === 'All') return true
    if (n.target === 'Admin') return roleName === 'Admin'
    return n.target === myTarget
  })

  // In-app incident/response alerts — Students never see these
  const roleAlerts = isStudent ? [] : (incidentAlerts || [])

  const sorted = [...dbNotifs, ...roleAlerts]
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

  // Visible = sorted minus user-dismissed items
  const visible = sorted.filter(n => !dismissedIds.has(n.id))

  const unread  = visible.filter(n => !readIds.has(n.id)).length

  const handleDismiss = (id, e) => {
    e.stopPropagation()
    setDismissedIds(prev => {
      const next = new Set([...prev, id])
      localStorage.setItem('scars_dismissed_notifs', JSON.stringify([...next]))
      return next
    })
  }

  const handleClearAll = () => {
    setDismissedIds(prev => {
      const next = new Set([...prev, ...visible.map(n => n.id)])
      localStorage.setItem('scars_dismissed_notifs', JSON.stringify([...next]))
      return next
    })
  }

  // Prune stale IDs from localStorage when notification list changes
  useEffect(() => {
    if (sorted.length === 0) return
    const validIds = new Set(sorted.map(n => String(n.id)))
    setDismissedIds(prev => {
      const next = new Set([...prev].filter(id => validIds.has(String(id))))
      if (next.size < prev.size) {
        localStorage.setItem('scars_dismissed_notifs', JSON.stringify([...next]))
        return next
      }
      return prev
    })
    setReadIds(prev => {
      const next = new Set([...prev].filter(id => validIds.has(String(id))))
      if (next.size < prev.size) {
        localStorage.setItem('scars_read_notifs', JSON.stringify([...next]))
        return next
      }
      return prev
    })
  }, [sorted.length]) // eslint-disable-line

  // Mark all visible as read when panel opens
  const handleOpen = () => {
    setOpen(v => {
      if (!v) {
        const allIds = visible.map(n => n.id)
        const next   = new Set([...readIds, ...allIds])
        setReadIds(next)
        localStorage.setItem('scars_read_notifs', JSON.stringify([...next]))
      }
      return !v
    })
  }

  // Close on outside click — notifications
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on outside click — account menu
  useEffect(() => {
    if (!accountOpen) return
    const handler = (e) => { if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountOpen])

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {visible.length > 0 && (
                    <>
                      <span className={s.dropCount}>{visible.length}</span>
                      <button className={s.clearAllBtn} onClick={handleClearAll}>
                        Clear all
                      </button>
                    </>
                  )}
                  <button className={s.dropClose} onClick={() => setOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className={s.dropList}>
                {visible.length === 0 ? (
                  <div className={s.empty}>
                    <Bell size={24} />
                    <span>No notifications</span>
                  </div>
                ) : (
                  visible.slice(0, 20).map(n => {
                    const Icon     = TYPE_ICON[n.type] ?? Info
                    const color    = TYPE_COLOR[n.type] ?? '#4a7a52'
                    const isNew    = !readIds.has(n.id)
                    const isIncident = !!n.incidentId
                    const handleClick = () => {
                      setOpen(false)
                      if (isIncident) navigate('/incidents')
                      else navigate('/notifications')
                    }
                    return (
                      <div
                        key={n.id}
                        className={`${s.notifItem} ${isNew ? s.notifNew : ''} ${s.notifClickable}`}
                        onClick={handleClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && handleClick()}
                      >
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
                            {isIncident
                              ? <span className={s.notifIncidentTag}><ExternalLink size={9} /> View Incident</span>
                              : <span className={s.notifTarget}>→ {n.target}</span>
                            }
                          </div>
                        </div>
                        <button
                          className={s.notifDismiss}
                          onClick={e => handleDismiss(n.id, e)}
                          title="Dismiss"
                          tabIndex={-1}
                          aria-label="Dismiss notification"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {visible.length > 0 && (
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

        {/* Account button */}
        <div ref={accountRef} className={s.accountContainer}>
          <button
            className={`${s.accountBtn} ${accountOpen ? s.accountBtnActive : ''}`}
            onClick={() => setAccountOpen(v => !v)}
            aria-label="Account menu"
          >
            {currentUser?.profileImage
              ? <img src={currentUser.profileImage} alt="avatar" className={s.accountAvatar} />
              : <div className={s.accountInitials}>
                  {(currentUser?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
            }
          </button>

          {accountOpen && (
            <div className={s.accountDropdown}>
              <div className={s.accountHeader}>
                {currentUser?.profileImage
                  ? <img src={currentUser.profileImage} alt="avatar" className={s.accountAvatarLg} />
                  : <div className={s.accountInitialsLg}>
                      {(currentUser?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                }
                <div className={s.accountInfo}>
                  <span className={s.accountName}>{currentUser?.name}</span>
                  <span className={s.accountRole}>{roleName}</span>
                </div>
              </div>
              <div className={s.accountDivider} />
              <button
                className={s.accountMenuItem}
                onClick={() => { setAccountOpen(false); navigate('/profile') }}
              >
                <UserCircle size={15} /> My Profile
              </button>
              <button
                className={`${s.accountMenuItem} ${s.accountMenuItemDanger}`}
                onClick={handleLogout}
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

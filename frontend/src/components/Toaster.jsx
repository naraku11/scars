import { useState, useEffect, useCallback, useRef } from 'react'
import { _register, _unregister } from '../services/toast'
import { X, CheckCircle2, AlertTriangle, Info, Zap, ShieldAlert, Bell } from 'lucide-react'
import s from './Toaster.module.css'

const TYPES = {
  success:   { Icon: CheckCircle2,  color: '#16a34a', bg: '#dcfce7', label: 'Success'   },
  error:     { Icon: ShieldAlert,   color: '#dc2626', bg: '#fee2e2', label: 'Error'     },
  warning:   { Icon: AlertTriangle, color: '#d97706', bg: '#fef3c7', label: 'Warning'   },
  info:      { Icon: Info,          color: '#2563eb', bg: '#dbeafe', label: 'Info'      },
  alert:     { Icon: AlertTriangle, color: '#f59e0b', bg: '#fef3c7', label: 'Alert'     },
  emergency: { Icon: Zap,           color: '#dc2626', bg: '#fee2e2', label: 'Emergency' },
  default:   { Icon: Bell,          color: '#4a7a52', bg: '#E8F5E9', label: 'Notice'    },
}

// ── Individual toast ─────────────────────────────────────────────
function Toast({ toast, onDismiss, depth }) {
  const cfg     = TYPES[toast.type] ?? TYPES.default
  const { Icon, color, bg } = cfg
  const timerRef = useRef(null)
  const [progress, setProgress] = useState(100)

  // Count-down progress bar
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return
    const start  = Date.now()
    const end    = start + toast.duration
    const tick   = () => {
      const remaining = Math.max(0, end - Date.now())
      setProgress((remaining / toast.duration) * 100)
      if (remaining > 0) timerRef.current = requestAnimationFrame(tick)
    }
    timerRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(timerRef.current)
  }, [toast.duration])

  // Compute depth-based visual compression (older → smaller + dimmer)
  const scale   = Math.max(0.88, 1 - depth * 0.04)
  const opacity = depth >= 3 ? 0 : Math.max(0.55, 1 - depth * 0.15)
  const ty      = depth === 0 ? 0 : depth * -6  // pull older toasts slightly up/behind

  return (
    <div
      className={`${s.toast} ${toast.exiting ? s.exit : s.enter}`}
      role="alert"
      aria-live={toast.type === 'emergency' ? 'assertive' : 'polite'}
      style={{
        '--color':  color,
        '--bg':     bg,
        transform:  `translateY(${ty}px) scale(${scale})`,
        opacity,
        zIndex:     9999 - depth,
        pointerEvents: depth >= 3 ? 'none' : 'all',
        transition: toast.exiting ? undefined : 'transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease',
      }}
    >
      {/* Colored left accent bar */}
      <div className={s.accent} style={{ background: color }} />

      {/* Icon */}
      <div className={s.iconWrap} style={{ background: color + '18', color }}>
        <Icon size={15} strokeWidth={2.2} />
      </div>

      {/* Content */}
      <div className={s.body}>
        <p className={s.title}>{toast.title}</p>
        {toast.message && <p className={s.message}>{toast.message}</p>}
        {toast.action && (
          <button
            className={s.action}
            style={{ color }}
            onClick={() => { toast.action.onClick(); onDismiss() }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button className={s.close} onClick={onDismiss} aria-label="Dismiss notification">
        <X size={12} strokeWidth={2.5} />
      </button>

      {/* Auto-dismiss progress bar */}
      {toast.duration > 0 && (
        <div
          className={s.progress}
          style={{ width: `${progress}%`, background: color }}
        />
      )}
    </div>
  )
}

// ── Toaster container ────────────────────────────────────────────
export default function Toaster() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    // Remove from DOM after exit animation finishes
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 380)
  }, [])

  const addToast = useCallback((data) => {
    const t = { ...data, exiting: false }
    setToasts(prev => [t, ...prev].slice(0, 5))   // newest first; max 5
    if (t.duration > 0) {
      setTimeout(() => dismiss(t.id), t.duration)
    }
  }, [dismiss])

  useEffect(() => {
    _register(addToast)
    return () => _unregister()
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className={s.container} aria-label="Toast notifications">
      {toasts.map((t, i) => (
        <Toast
          key={t.id}
          toast={t}
          depth={i}
          onDismiss={() => dismiss(t.id)}
        />
      ))}
    </div>
  )
}

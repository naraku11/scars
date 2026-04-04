import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  LayoutDashboard, Users, AlertTriangle, Shield, Bell,
  BarChart2, Settings, ShieldCheck, X, HelpCircle
} from 'lucide-react'
import s from './Sidebar.module.css'


const ADMIN_NAV = [
  { to: '/dashboard',      label: 'Dashboard',              icon: LayoutDashboard },
  { to: '/users',          label: 'User Management',        icon: Users },
  { to: '/incidents',      label: 'Incident Management',    icon: AlertTriangle },
  { to: '/response',       label: 'Response Management',    icon: Shield },
  { to: '/notifications',  label: 'Notification System',    icon: Bell },
  { to: '/reports',        label: 'Reporting & Analytics',  icon: BarChart2 },
  { to: '/admin',          label: 'System Administration',  icon: Settings },
]

const OFFICER_NAV = [
  { to: '/officer',        label: 'Dashboard',              icon: LayoutDashboard },
  { to: '/incidents',      label: 'Incident Management',    icon: AlertTriangle },
  { to: '/response',       label: 'Response Management',    icon: Shield },
  { to: '/reports',        label: 'Reporting & Analytics',  icon: BarChart2 },
]

const RESPONDER_NAV = [
  { to: '/responder',      label: 'Dashboard',              icon: LayoutDashboard },
  { to: '/incidents',      label: 'Incidents',              icon: AlertTriangle },
  { to: '/notifications',  label: 'Notifications',          icon: Bell },
]

const STUDENT_NAV = [
  { to: '/student',        label: 'Dashboard',              icon: LayoutDashboard },
]

const FAQ_ITEM = { to: '/faq', label: 'FAQ & Help', icon: HelpCircle }

function getNavItems(roleName) {
  switch (roleName) {
    case 'Admin':     return [...ADMIN_NAV,     FAQ_ITEM]
    case 'Officer':   return [...OFFICER_NAV,   FAQ_ITEM]
    case 'Responder': return [...RESPONDER_NAV, FAQ_ITEM]
    default:          return [...STUDENT_NAV,   FAQ_ITEM]
  }
}

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, systemConfig } = useApp()
  const logoImage = systemConfig?.logoImage

  const rawName  = systemConfig?.siteName || 'UV Toledo Campus — SCARS'
  const nameParts = rawName.split(' — ')
  const logoName   = nameParts.length > 1 ? nameParts[nameParts.length - 1] : rawName
  const logoCampus = nameParts.length > 1 ? nameParts.slice(0, -1).join(' — ') : 'Campus'

  const roleName = typeof currentUser?.role === 'object'
    ? currentUser.role?.name
    : currentUser?.role

  const navItems = getNavItems(roleName)

  return (
    <aside className={`${s.sidebar} ${isOpen ? s.open : ''}`}>
      <div className={s.logo}>
        <div className={s.logoBadge}>
          {logoImage
            ? <img src={logoImage} alt="logo" className={s.logoImg} />
            : <ShieldCheck size={20} />}
        </div>
        <div className={s.logoText}>
          <span className={s.logoName}>{logoName}</span>
          <span className={s.logoCampus}>{logoCampus}</span>
        </div>
        <button className={s.closeBtn} onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className={s.nav}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

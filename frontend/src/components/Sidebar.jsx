import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  LayoutDashboard, Users, AlertTriangle, Shield, Bell,
  BarChart2, Settings, ShieldCheck, X, HelpCircle
} from 'lucide-react'
import s from './Sidebar.module.css'

// Dashboard route per role — always visible regardless of permissions
const ROLE_DASHBOARD = {
  Admin:     { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  Officer:   { to: '/officer',   label: 'Dashboard', icon: LayoutDashboard },
  Responder: { to: '/responder', label: 'Dashboard', icon: LayoutDashboard },
  Student:   { to: '/student',   label: 'Dashboard', icon: LayoutDashboard },
}

// Permission-gated nav items — shown only when role has that permission
const PERM_NAV = [
  { perm: 'incidents',     to: '/incidents',     label: 'Incident Management',   icon: AlertTriangle },
  { perm: 'response',      to: '/response',      label: 'Response Management',   icon: Shield },
  { perm: 'notifications', to: '/notifications', label: 'Notification System',   icon: Bell },
  { perm: 'reports',       to: '/reports',       label: 'Reporting & Analytics', icon: BarChart2 },
  { perm: 'admin',         to: '/users',         label: 'User Management',       icon: Users },
  { perm: 'admin',         to: '/admin',         label: 'System Administration', icon: Settings },
]

const FAQ_ITEM = { to: '/faq', label: 'FAQ & Help', icon: HelpCircle }

function buildNavItems(roleName, perms) {
  const dashboard = ROLE_DASHBOARD[roleName] ?? ROLE_DASHBOARD.Student
  const gated = PERM_NAV.filter(item => perms?.[item.perm])
  return [dashboard, ...gated, FAQ_ITEM]
}

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, systemConfig, roles } = useApp()
  const logoImage = systemConfig?.logoImage

  const rawName  = systemConfig?.siteName || 'UV Toledo Campus — SCARS'
  const nameParts = rawName.split(' — ')
  const logoName   = nameParts.length > 1 ? nameParts[nameParts.length - 1] : rawName
  const logoCampus = nameParts.length > 1 ? nameParts.slice(0, -1).join(' — ') : 'Campus'

  const roleName = typeof currentUser?.role === 'object'
    ? currentUser.role?.name
    : currentUser?.role

  // Use live roles state so permission changes propagate instantly
  const liveRole = roles.find(r => r.name === roleName)
  const perms    = liveRole?.permissions ?? (typeof currentUser?.role === 'object' ? currentUser.role?.permissions : {}) ?? {}

  const navItems = buildNavItems(roleName, perms)

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

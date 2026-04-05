import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Sidebar from './Sidebar'
import LoadingScreen from './LoadingScreen'
import s from './Layout.module.css'

// Maps protected routes to the required permission key
const ROUTE_PERM = {
  '/incidents':     'incidents',
  '/response':      'response',
  '/notifications': 'notifications',
  '/reports':       'reports',
  '/admin':         'admin',
  '/users':         'admin',
}

// Role-specific home route for redirects
const ROLE_HOME = {
  Admin:     '/dashboard',
  Officer:   '/officer',
  Responder: '/responder',
  Student:   '/student',
}

// Role-dashboard routes — only the owning role may access them
const ROLE_ONLY = {
  '/dashboard': 'Admin',
  '/officer':   'Officer',
  '/responder': 'Responder',
  '/student':   'Student',
}

export default function Layout() {
  const { currentUser, initialized, roles } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  if (!initialized) return <LoadingScreen />
  if (!currentUser)  return <Navigate to="/" replace />

  const roleName  = typeof currentUser.role === 'object' ? currentUser.role?.name : currentUser.role
  const liveRole  = roles.find(r => r.name === roleName)
  const perms     = liveRole?.permissions ?? (typeof currentUser.role === 'object' ? currentUser.role?.permissions : {}) ?? {}
  const homePath  = ROLE_HOME[roleName] ?? '/student'

  // Guard: redirect if user lacks the permission for this route
  const requiredPerm = ROUTE_PERM[location.pathname]
  if (requiredPerm && !perms[requiredPerm]) {
    return <Navigate to={homePath} replace />
  }

  // Guard: redirect if user tries to visit another role's dashboard
  const roleOnly = ROLE_ONLY[location.pathname]
  if (roleOnly && roleName !== roleOnly) {
    return <Navigate to={homePath} replace />
  }

  return (
    <div className={s.layout}>
      {sidebarOpen && <div className={s.overlay} onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={s.main}>
        <div key={location.pathname} className={s.pageEnter}>
          <Outlet context={{ onMenuClick: () => setSidebarOpen(v => !v) }} />
        </div>
      </main>
    </div>
  )
}

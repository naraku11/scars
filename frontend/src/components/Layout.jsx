import { useState, useRef, useCallback } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Sidebar from './Sidebar'
import LoadingScreen from './LoadingScreen'
import s from './Layout.module.css'

// Nav route order per role — mirrors Sidebar nav arrays
const NAV_ROUTES = {
  Admin:     ['/dashboard', '/users', '/incidents', '/response', '/notifications', '/reports', '/admin', '/profile'],
  Officer:   ['/officer', '/incidents', '/response', '/reports', '/profile'],
  Responder: ['/responder', '/incidents', '/notifications', '/profile'],
  Student:   ['/student', '/profile'],
}

function getRoleName(user) {
  return typeof user?.role === 'object' ? user.role?.name : user?.role
}

export default function Layout() {
  const { currentUser, initialized } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate  = useNavigate()

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return
    const startX = touchStartX.current
    const startY = touchStartY.current
    const endX   = e.changedTouches[0].clientX
    const endY   = e.changedTouches[0].clientY
    touchStartX.current = null
    touchStartY.current = null

    const dx = endX - startX
    const dy = endY - startY

    // Ignore mostly-vertical swipes (scrolling)
    if (Math.abs(dy) > Math.abs(dx)) return
    // Minimum horizontal distance
    if (Math.abs(dx) < 50) return

    if (dx > 0) {
      // ── Swipe RIGHT ──────────────────────────────
      if (!sidebarOpen && startX < 40) {
        // Edge swipe → open sidebar
        setSidebarOpen(true)
      } else if (!sidebarOpen && Math.abs(dx) > 80) {
        // Navigate to previous page
        const routes = NAV_ROUTES[getRoleName(currentUser)] ?? []
        const idx = routes.findIndex(r => location.pathname === r || location.pathname.startsWith(r + '/'))
        if (idx > 0) navigate(routes[idx - 1])
      }
    } else {
      // ── Swipe LEFT ───────────────────────────────
      if (sidebarOpen) {
        setSidebarOpen(false)
      } else if (Math.abs(dx) > 80) {
        // Navigate to next page
        const routes = NAV_ROUTES[getRoleName(currentUser)] ?? []
        const idx = routes.findIndex(r => location.pathname === r || location.pathname.startsWith(r + '/'))
        if (idx >= 0 && idx < routes.length - 1) navigate(routes[idx + 1])
      }
    }
  }, [sidebarOpen, currentUser, location.pathname, navigate])

  if (!initialized) return <LoadingScreen />
  if (!currentUser)  return <Navigate to="/" replace />

  return (
    <div
      className={s.layout}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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

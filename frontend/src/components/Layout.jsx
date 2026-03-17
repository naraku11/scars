import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Sidebar from './Sidebar'
import LoadingScreen from './LoadingScreen'
import s from './Layout.module.css'

export default function Layout() {
  const { currentUser, initialized } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  if (!initialized) return <LoadingScreen />
  if (!currentUser)  return <Navigate to="/" replace />

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

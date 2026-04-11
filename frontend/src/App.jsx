import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BrandingManager from './components/BrandingManager'
import Layout from './components/Layout'
import Toaster from './components/Toaster'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import IncidentManagement from './pages/IncidentManagement'
import ResponseManagement from './pages/ResponseManagement'
import NotificationSystem from './pages/NotificationSystem'
import ReportingAnalytics from './pages/ReportingAnalytics'
import SystemAdmin from './pages/SystemAdmin'
import Profile from './pages/Profile'
import OfficerDashboard from './pages/OfficerDashboard'
import ResponderDashboard from './pages/ResponderDashboard'
import StudentDashboard from './pages/StudentDashboard'
import FaqHelp from './pages/FaqHelp'

export default function App() {
  return (
    <AppProvider>
      <BrandingManager />
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<Layout />}>
            {/* Admin */}
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/users"         element={<UserManagement />} />
            <Route path="/incidents"     element={<IncidentManagement />} />
            <Route path="/response"      element={<ResponseManagement />} />
            <Route path="/notifications" element={<NotificationSystem />} />
            <Route path="/reports"       element={<ReportingAnalytics />} />
            <Route path="/admin"         element={<SystemAdmin />} />
            {/* Role-specific dashboards */}
            <Route path="/officer"       element={<OfficerDashboard />} />
            <Route path="/responder"     element={<ResponderDashboard />} />
            <Route path="/student"       element={<StudentDashboard />} />
            {/* Shared pages (all roles) */}
            <Route path="/profile"       element={<Profile />} />
            <Route path="/faq"           element={<FaqHelp />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

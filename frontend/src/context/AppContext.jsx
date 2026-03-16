import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io as socketIo } from 'socket.io-client'
import {
  authApi, usersApi, rolesApi, teamsApi,
  incidentsApi, notificationsApi, adminApi, profileApi,
} from '../services/api'
import {
  mockUsers, mockRoles, mockTeams, mockIncidents,
  mockNotifications, mockBackupConfig,
} from '../data/mockData'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser]     = useState(null)
  const [users, setUsers]                 = useState([])
  const [roles, setRoles]                 = useState([])
  const [teams, setTeams]                 = useState([])
  const [incidents, setIncidents]         = useState([])
  const [notifications, setNotifications] = useState([])
  const [backupConfig, setBackupConfig]   = useState({})
  const [systemConfig, setSystemConfig]   = useState({})
  const [loading, setLoading]             = useState(false)
  const [initialized, setInitialized]     = useState(false)

  // ── Real-time: Socket.io ─────────────────────────────────────────────
  const socketRef = useRef(null)

  useEffect(() => {
    // polling first → more reliable on Hostinger shared hosting (upgrades to websocket when available)
    const socket = socketIo({ path: '/socket.io', transports: ['polling', 'websocket'] })
    socketRef.current = socket

    // Incidents
    socket.on('incident:created', (inc) =>
      setIncidents(prev => prev.some(i => i.id === inc.id) ? prev : [inc, ...prev])
    )
    socket.on('incident:updated', (inc) =>
      setIncidents(prev => prev.map(i => i.id === inc.id ? inc : i))
    )
    socket.on('incident:deleted', ({ id }) =>
      setIncidents(prev => prev.filter(i => i.id !== id))
    )

    // Users
    socket.on('user:created', (user) =>
      setUsers(prev => prev.some(u => u.id === user.id) ? prev : [...prev, user])
    )
    socket.on('user:updated', (user) => {
      setUsers(prev => prev.map(u => u.id === user.id ? user : u))
      setCurrentUser(prev => prev?.id === user.id ? { ...prev, ...user } : prev)
    })
    socket.on('user:deleted', ({ id }) =>
      setUsers(prev => prev.filter(u => u.id !== id))
    )

    // Notifications
    socket.on('notification:sent', (n) =>
      setNotifications(prev => prev.some(x => x.id === n.id) ? prev : [n, ...prev])
    )
    socket.on('notification:deleted', ({ id }) =>
      setNotifications(prev => prev.filter(n => n.id !== id))
    )

    // Teams
    socket.on('team:updated', (team) =>
      setTeams(prev => prev.some(t => t.id === team.id)
        ? prev.map(t => t.id === team.id ? team : t)
        : [...prev, team]
      )
    )
    socket.on('team:deleted', ({ id }) =>
      setTeams(prev => prev.filter(t => t.id !== id))
    )

    // Roles
    socket.on('role:updated', (role) =>
      setRoles(prev => prev.some(r => r.id === role.id)
        ? prev.map(r => r.id === role.id ? role : r)
        : [...prev, role].sort((a, b) => a.level - b.level)
      )
    )
    socket.on('role:deleted', ({ id }) =>
      setRoles(prev => prev.filter(r => r.id !== id))
    )

    return () => socket.disconnect()
  }, [])

  // ── Bootstrap: restore session & load all data ──────────────────────
  const loadMock = useCallback(() => {
    setUsers(mockUsers)
    setRoles(mockRoles)
    setTeams(mockTeams)
    setIncidents(mockIncidents)
    setNotifications(mockNotifications)
    setBackupConfig(mockBackupConfig)
    const savedCfg = JSON.parse(localStorage.getItem('scars_system_config') || 'null')
    setSystemConfig(savedCfg ?? {
      siteName: 'UV Toledo Campus — SCARS', timezone: 'UTC+8',
      language: 'English', sessionTimeout: 30, maxLoginAttempts: 5,
      alertEmail: 'admin@uv.edu.ph', smsApiKey: '', logoImage: '',
    })
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r, t, inc, notif, sys, bak] = await Promise.all([
        usersApi.list(),
        rolesApi.list(),
        teamsApi.list(),
        incidentsApi.list(),
        notificationsApi.list(),
        adminApi.getSystemConfig(),
        adminApi.getBackupConfig(),
      ])
      setUsers(u)
      setRoles(r)
      setTeams(t)
      setIncidents(inc)
      setNotifications(notif)
      setSystemConfig(sys)
      setBackupConfig(bak)
    } catch {
      // API not running — use mock data so UI still works
      loadMock()
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [loadMock])

  useEffect(() => {
    const token = localStorage.getItem('scars_token')
    if (!token) { setInitialized(true); return }
    authApi.me()
      .then(user => { setCurrentUser(user); return loadAll() })
      .catch(() => {
        localStorage.removeItem('scars_token')
        setInitialized(true)
      })
  }, [loadAll])

  // ── Auth ─────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const { token, user } = await authApi.login(email, password)
      localStorage.setItem('scars_token', token)
      setCurrentUser(user)
      await loadAll()
      return user
    } catch {
      // API unavailable — fall back to mock data login
      const mockUser = mockUsers.find(
        u => u.email === email && u.password === password
      )
      if (!mockUser) throw new Error('Invalid email or password')
      setCurrentUser(mockUser)
      loadMock()
      setInitialized(true)
      return mockUser
    }
  }
  const logout = () => {
    localStorage.removeItem('scars_token')
    setCurrentUser(null)
    setUsers([]); setRoles([]); setTeams([])
    setIncidents([]); setNotifications([])
    setSystemConfig({}); setBackupConfig({})
    setInitialized(true)
  }

  // ── Incidents ────────────────────────────────────────────────────────
  const addIncident = async (data) => {
    const inc = await incidentsApi.create({ ...data, reportedById: currentUser?.id })
    setIncidents(prev => [inc, ...prev])
    return inc
  }
  const updateIncident = async (id, data) => {
    const inc = await incidentsApi.update(id, data)
    setIncidents(prev => prev.map(i => i.id === id ? inc : i))
  }
  const deleteIncident = async (id) => {
    await incidentsApi.delete(id)
    setIncidents(prev => prev.filter(i => i.id !== id))
  }
  const validateIncident = async (id) => {
    const inc = await incidentsApi.validate(id)
    setIncidents(prev => prev.map(i => i.id === id ? inc : i))
  }
  const verifyIncident = async (id) => {
    const inc = await incidentsApi.verify(id)
    setIncidents(prev => prev.map(i => i.id === id ? inc : i))
  }
  const assignIncident = async (incidentId, teamId) => {
    const inc = await incidentsApi.assign(incidentId, teamId)
    setIncidents(prev => prev.map(i => i.id === incidentId ? inc : i))
  }
  const updateStatus = async (id, status) => {
    const inc = await incidentsApi.update(id, { status })
    setIncidents(prev => prev.map(i => i.id === id ? inc : i))
  }

  // ── Notifications ────────────────────────────────────────────────────
  const sendNotification = async (data) => {
    const n = await notificationsApi.send({ ...data, sentById: currentUser?.id })
    setNotifications(prev => [n, ...prev])
    return n
  }

  // ── Users ────────────────────────────────────────────────────────────
  const addUser = async (data) => {
    const user = await usersApi.create(data)
    setUsers(prev => [...prev, user])
  }
  const updateUser = async (id, data) => {
    const user = await usersApi.update(id, data)
    setUsers(prev => prev.map(u => u.id === id ? user : u))
    if (currentUser?.id === id) setCurrentUser(user)
  }
  const deleteUser = async (id) => {
    await usersApi.delete(id)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  // ── Profile ───────────────────────────────────────────────────────────
  const updateProfile = async (data) => {
    const user = await profileApi.update(data)
    setCurrentUser(user)
    setUsers(prev => prev.map(u => u.id === user.id ? user : u))
    return user
  }

  // ── Roles ─────────────────────────────────────────────────────────────
  const addRole = async (data) => {
    const role = await rolesApi.create(data)
    setRoles(prev => [...prev, role])
  }
  const updateRole = async (id, data) => {
    const role = await rolesApi.update(id, data)
    setRoles(prev => prev.map(r => r.id === id ? role : r))
  }
  const deleteRole = async (id) => {
    await rolesApi.delete(id)
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  // ── Teams ─────────────────────────────────────────────────────────────
  const updateTeam = async (id, data) => {
    const team = await teamsApi.update(id, data)
    setTeams(prev => prev.map(t => t.id === id ? team : t))
  }

  // ── Admin / Config ────────────────────────────────────────────────────
  const saveSystemConfig = async (data) => {
    try {
      const cfg = await adminApi.saveSystemConfig(data)
      setSystemConfig(cfg)
      localStorage.setItem('scars_system_config', JSON.stringify(cfg))
    } catch {
      // Mock fallback — persist in localStorage
      setSystemConfig(data)
      localStorage.setItem('scars_system_config', JSON.stringify(data))
    }
  }
  const saveBackupConfig = async (data) => {
    const cfg = await adminApi.saveBackupConfig(data)
    setBackupConfig(cfg)
  }
  const triggerBackup = () =>
    setBackupConfig(prev => ({ ...prev, lastBackup: new Date().toISOString(), lastBackupStatus: 'Success' }))

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, roles, teams, incidents, notifications, backupConfig, systemConfig,
      loading, initialized,
      addIncident, updateIncident, deleteIncident, validateIncident, verifyIncident,
      assignIncident, updateStatus,
      sendNotification,
      updateProfile,
      addUser, updateUser, deleteUser,
      addRole, updateRole, deleteRole,
      updateTeam,
      triggerBackup, saveBackupConfig, saveSystemConfig,
      reload: loadAll,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io as socketIo } from 'socket.io-client'
import {
  authApi, usersApi, rolesApi, teamsApi,
  incidentsApi, notificationsApi, adminApi, profileApi,
} from '../services/api'

const AppContext = createContext()

// ── Sound alert helper ───────────────────────────────────────────────────────
function playIncidentSound(priority) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    // Pattern: array of { freq (Hz), dur (s) }. freq=0 = silence gap.
    const patterns = {
      Critical: [
        { freq: 880, dur: 0.12 }, { freq: 0, dur: 0.04 },
        { freq: 880, dur: 0.12 }, { freq: 0, dur: 0.04 },
        { freq: 1100, dur: 0.35 },
      ],
      High: [
        { freq: 660, dur: 0.18 }, { freq: 0, dur: 0.05 },
        { freq: 660, dur: 0.25 },
      ],
      Medium: [{ freq: 440, dur: 0.3 }],
      Low:    [{ freq: 330, dur: 0.2 }],
    }
    const pattern = patterns[priority] || patterns.Low
    const oscType = priority === 'Critical' ? 'square' : priority === 'High' ? 'sawtooth' : 'sine'
    let t = ctx.currentTime + 0.05
    pattern.forEach(({ freq, dur }) => {
      if (freq > 0) {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = oscType
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.28, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
        osc.start(t)
        osc.stop(t + dur)
      }
      t += dur
    })
  } catch { /* AudioContext unavailable */ }
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser]     = useState(null)
  const [users, setUsers]                 = useState([])
  const [roles, setRoles]                 = useState([])
  const [teams, setTeams]                 = useState([])
  const [incidents, setIncidents]               = useState([])
  const [deletedIncidents, setDeletedIncidents] = useState([])
  const [notifications, setNotifications]       = useState([])
  const [incidentAlerts, setIncidentAlerts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('scars_incident_alerts') || '[]') }
    catch { return [] }
  }) // in-app incident notifications — persisted to sessionStorage
  const [backupConfig, setBackupConfig]   = useState({})
  const [systemConfig, setSystemConfig]   = useState({})
  const [loading, setLoading]             = useState(false)
  const [initialized, setInitialized]     = useState(false)

  const currentUserRef = useRef(null)
  const teamsRef       = useRef([])
  useEffect(() => { currentUserRef.current = currentUser }, [currentUser])
  useEffect(() => { teamsRef.current = teams }, [teams])
  // Sync incident alerts to sessionStorage so they survive page refresh
  useEffect(() => {
    try { sessionStorage.setItem('scars_incident_alerts', JSON.stringify(incidentAlerts.slice(0, 50))) }
    catch { /* sessionStorage unavailable */ }
  }, [incidentAlerts])

  // ── Real-time: Socket.io ─────────────────────────────────────────────
  const socketRef = useRef(null)

  useEffect(() => {
    // polling first → more reliable on Hostinger shared hosting (upgrades to websocket when available)
    const socket = socketIo({ path: '/socket.io', transports: ['polling', 'websocket'] })
    socketRef.current = socket

    // Incidents
    socket.on('incident:created', (inc) => {
      setIncidents(prev => prev.some(i => i.id === inc.id) ? prev : [inc, ...prev])
      // Push as in-app alert notification for all roles except Student
      const u = currentUserRef.current
      const rn = typeof u?.role === 'object' ? u?.role?.name : (u?.role ?? '')
      if (rn !== 'Student') {
        const alertType = inc.priority === 'Critical' ? 'Emergency'
          : inc.priority === 'High' ? 'Alert' : 'Info'
        setIncidentAlerts(prev => [{
          id:         `inc-${inc.id}-${Date.now()}`,
          incidentId: inc.id,
          type:       alertType,
          title:      `New Incident: ${inc.title}`,
          message:    `${inc.type} · ${inc.location} · ${inc.priority} priority`,
          target:     'All',
          sentAt:     inc.createdAt || new Date().toISOString(),
          priority:   inc.priority,
        }, ...prev.slice(0, 49)])
        playIncidentSound(inc.priority)
      }
    })
    socket.on('incident:updated', (inc) => {
      setIncidents(prev => {
        const old = prev.find(i => i.id === inc.id)
        const u  = currentUserRef.current
        const rn = typeof u?.role === 'object' ? u?.role?.name : (u?.role ?? '')

        // Response alert: assignment change → notify Responders whose team was assigned
        if (rn === 'Responder' && inc.assignedTo) {
          const newTeamId = typeof inc.assignedTo === 'object' ? inc.assignedTo.id : inc.assignedTo
          const oldTeamId = old?.assignedTo
            ? (typeof old.assignedTo === 'object' ? old.assignedTo.id : old.assignedTo)
            : null
          if (newTeamId !== oldTeamId) {
            const myTeam = teamsRef.current.find(t =>
              t.members?.some(m => {
                const mid = typeof m === 'object' ? (m.userId ?? m.user?.id ?? m.id) : m
                return mid === u?.id
              })
            )
            if (myTeam && myTeam.id === newTeamId) {
              const teamName = typeof inc.assignedTo === 'object' ? inc.assignedTo.name : myTeam.name
              setIncidentAlerts(p => [{
                id:         `assign-${inc.id}-${Date.now()}`,
                incidentId: inc.id,
                type:       'Alert',
                title:      `Incident Assigned to Your Team`,
                message:    `${inc.title} · ${inc.type} at ${inc.location} assigned to ${teamName}`,
                target:     'Responders',
                sentAt:     new Date().toISOString(),
              }, ...p.slice(0, 49)])
              playIncidentSound(inc.priority)
            }
          }
        }

        // Response alert: status change → notify Admin and Officer
        if ((rn === 'Admin' || rn === 'Officer') && old && old.status !== inc.status) {
          setIncidentAlerts(p => [{
            id:         `status-${inc.id}-${Date.now()}`,
            incidentId: inc.id,
            type:       inc.status === 'Resolved' ? 'Info' : 'Alert',
            title:      `Incident ${inc.status}`,
            message:    `${inc.title} · status changed to ${inc.status}`,
            target:     'Officers',
            sentAt:     new Date().toISOString(),
          }, ...p.slice(0, 49)])
        }

        return prev.map(i => i.id === inc.id ? inc : i)
      })
    })
    socket.on('incident:deleted', ({ id, incident }) => {
      setIncidents(prev => prev.filter(i => i.id !== id))
      if (incident) setDeletedIncidents(prev => prev.some(i => i.id === id) ? prev : [incident, ...prev])
    })
    socket.on('incident:restored', (incident) => {
      setDeletedIncidents(prev => prev.filter(i => i.id !== incident.id))
      setIncidents(prev => prev.some(i => i.id === incident.id) ? prev : [incident, ...prev])
    })

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
  }, []) // eslint-disable-line

  // ── Bootstrap: restore session & load all data ──────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r, t, inc, deleted, notif, sys, bak] = await Promise.all([
        usersApi.list(),
        rolesApi.list(),
        teamsApi.list(),
        incidentsApi.list(),
        incidentsApi.listDeleted(),
        notificationsApi.list(),
        adminApi.getSystemConfig(),
        adminApi.getBackupConfig(),
      ])
      setUsers(u)
      setRoles(r)
      setTeams(t)
      setIncidents(inc)
      setDeletedIncidents(deleted)
      setNotifications(notif)
      setSystemConfig(sys)
      setBackupConfig(bak)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

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
    const { token, user } = await authApi.login(email, password)
    localStorage.setItem('scars_token', token)
    setCurrentUser(user)
    // Clear any previous user's in-memory alerts before loading
    sessionStorage.removeItem('scars_incident_alerts')
    setIncidentAlerts([])
    await loadAll()
    return user
  }
  const logout = () => {
    localStorage.removeItem('scars_token')
    setCurrentUser(null)
    setUsers([]); setRoles([]); setTeams([])
    setIncidents([]); setDeletedIncidents([]); setNotifications([])
    setIncidentAlerts([])
    setSystemConfig({}); setBackupConfig({})
    setInitialized(true)
  }

  // ── Incidents ────────────────────────────────────────────────────────
  const addIncident = async (data) => {
    const inc = await incidentsApi.create({ ...data, reportedById: currentUser?.id })
    // Don't add to state here — the socket 'incident:created' event handles it
    // to avoid duplicate entries caused by a race between HTTP response and socket
    return inc
  }
  const updateIncident = async (id, data) => {
    const inc = await incidentsApi.update(id, data)
    setIncidents(prev => prev.map(i => i.id === id ? inc : i))
  }
  const deleteIncident = async (id) => {
    const incident = await incidentsApi.delete(id)
    setIncidents(prev => prev.filter(i => i.id !== id))
    if (incident?.id) setDeletedIncidents(prev => prev.some(i => i.id === id) ? prev : [incident, ...prev])
  }
  const restoreIncident = async (id) => {
    const incident = await incidentsApi.restore(id)
    setDeletedIncidents(prev => prev.filter(i => i.id !== id))
    setIncidents(prev => prev.some(i => i.id === incident.id) ? prev : [incident, ...prev])
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
    // Don't update state here — socket 'notification:sent' handles it (prevents duplicate)
    return n
  }
  const deleteNotification = async (id) => {
    await notificationsApi.delete(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
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
  const addTeam = async (data) => {
    const team = await teamsApi.create(data)
    setTeams(prev => [...prev, team])
  }
  const updateTeam = async (id, data) => {
    const team = await teamsApi.update(id, data)
    setTeams(prev => prev.map(t => t.id === id ? team : t))
  }
  const deleteTeam = async (id) => {
    await teamsApi.delete(id)
    setTeams(prev => prev.filter(t => t.id !== id))
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
      users, roles, teams, incidents, deletedIncidents, notifications, incidentAlerts, backupConfig, systemConfig,
      loading, initialized,
      addIncident, updateIncident, deleteIncident, restoreIncident, validateIncident, verifyIncident,
      assignIncident, updateStatus,
      updateProfile,
      addUser, updateUser, deleteUser,
      addRole, updateRole, deleteRole,
      addTeam, updateTeam, deleteTeam,
      sendNotification, deleteNotification,
      triggerBackup, saveBackupConfig, saveSystemConfig,
      reload: loadAll,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { io as socketIo } from 'socket.io-client'
import useSWR from 'swr'
import {
  authApi, usersApi, rolesApi, teamsApi,
  incidentsApi, notificationsApi, adminApi, profileApi,
} from '../services/api'
import toast from '../services/toast'

const AppContext = createContext()

// ── Sound alert helper ───────────────────────────────────────────────────────
function playIncidentSound(priority) {
  try {
    const AudioCtx = window.AudioContext || (/** @type {any} */ (window)).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
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

// ── SWR fetcher — stable, defined outside component ─────────────────────────
async function fetchAllData() {
  const [users, roles, teams, incidents, deletedIncidents, notifications, systemConfig, backupConfig] =
    await Promise.all([
      usersApi.list(),
      rolesApi.list(),
      teamsApi.list(),
      incidentsApi.list(),
      incidentsApi.listDeleted(),
      notificationsApi.list(),
      adminApi.getSystemConfig(),
      adminApi.getBackupConfig(),
    ])
  return { users, roles, teams, incidents, deletedIncidents, notifications, systemConfig, backupConfig }
}

// Hosting-safe polling limits:
// fetchAllData fires 8 parallel requests per cycle.
// At MIN_POLL_MS = 15 000ms → 4 cycles/min × 8 = 32 req/min (< 40 limit).
const MIN_POLL_MS  = 15_000
const MAX_POLL_MS  = 60_000
const BACKOFF_MULT = 1.5

// ── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [currentUser, setCurrentUser]           = useState(null)
  const [users, setUsers]                       = useState([])
  const [roles, setRoles]                       = useState([])
  const [teams, setTeams]                       = useState([])
  const [incidents, setIncidents]               = useState([])
  const [deletedIncidents, setDeletedIncidents] = useState([])
  const [notifications, setNotifications]       = useState([])
  const [incidentAlerts, setIncidentAlerts]     = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('scars_incident_alerts') || '[]') }
    catch { return [] }
  })
  const [backupConfig, setBackupConfig]         = useState({})
  const [systemConfig, setSystemConfig]         = useState({})
  const [loading, setLoading]                   = useState(false)
  const [initialized, setInitialized]           = useState(false)

  // SWR control: null = unauthenticated (SWR suspended); string = fetch active
  const [swrKey, setSwrKey]         = useState(null)
  // pollInterval: 0 = socket up (SWR polling disabled); > 0 = adaptive fallback
  const [pollInterval, setPollInterval] = useState(0)

  const currentUserRef = useRef(null)
  const teamsRef       = useRef([])
  const socketUpRef    = useRef(false)   // true while socket is connected
  const dataHashRef    = useRef('')       // detects whether data actually changed
  const revalidateRef  = useRef(null)    // SWR mutate — stable ref for socket handlers
  const socketRef      = useRef(null)

  useEffect(() => { currentUserRef.current = currentUser }, [currentUser])
  useEffect(() => { teamsRef.current = teams }, [teams])

  // Persist in-app alerts across page refresh
  useEffect(() => {
    try { sessionStorage.setItem('scars_incident_alerts', JSON.stringify(incidentAlerts.slice(0, 50))) }
    catch { /* sessionStorage unavailable */ }
  }, [incidentAlerts])

  // ── SWR: smart sync with Page Visibility API + adaptive backoff ──────────
  const { mutate: revalidate } = useSWR(
    swrKey,        // null = suspended
    fetchAllData,
    {
      revalidateOnFocus:    true,         // Page Visibility API — SWR built-in; resumes on tab focus
      refreshWhenHidden:    false,        // Pause polling when tab is hidden
      revalidateOnReconnect: true,        // Re-fetch on network reconnect
      refreshInterval:      pollInterval, // 0 = off (socket up); > 0 = adaptive fallback
      dedupingInterval:     3_000,
      onSuccess(data) {
        if (!data) return
        // Compute a lightweight hash to detect real changes
        const hash = [
          data.incidents.length,
          data.incidents[0]?.updatedAt ?? '',
          data.notifications.length,
          data.users.length,
        ].join('|')
        const changed = hash !== dataHashRef.current
        dataHashRef.current = hash

        setUsers(data.users)
        setRoles(data.roles)
        setTeams(data.teams)
        setIncidents(data.incidents)
        setDeletedIncidents(data.deletedIncidents)
        setNotifications(data.notifications)
        setSystemConfig(data.systemConfig)
        setBackupConfig(data.backupConfig)
        setInitialized(true)
        setLoading(false)

        // Adaptive backoff: reset to MIN on change; increase slowly when idle
        if (!socketUpRef.current) {
          setPollInterval(prev => {
            const base = prev || MIN_POLL_MS
            return changed
              ? MIN_POLL_MS
              : Math.min(Math.ceil(base * BACKOFF_MULT), MAX_POLL_MS)
          })
        }
      },
      onError() {
        setLoading(false)
        if (!socketUpRef.current) {
          setPollInterval(prev => Math.min((prev || MIN_POLL_MS) * 2, MAX_POLL_MS))
        }
      },
    }
  )

  // Keep revalidate accessible in socket handlers without stale closures
  useEffect(() => { revalidateRef.current = revalidate }, [revalidate])

  // ── Real-time: Socket.io — all handlers named for proper cleanup ─────────
  useEffect(() => {
    const socket = socketIo({ path: '/socket.io', transports: ['polling', 'websocket'] })
    socketRef.current = socket

    // Connection lifecycle — drives pollInterval
    const onConnect = () => {
      socketUpRef.current = true
      setPollInterval(0)           // disable SWR polling; socket takes over
      revalidateRef.current?.()   // immediate sync on (re)connect
    }
    const onDisconnect = () => {
      socketUpRef.current = false
      setPollInterval(MIN_POLL_MS) // start adaptive fallback polling
    }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // Incidents
    const onIncidentCreated = (inc) => {
      setIncidents(prev => prev.some(i => i.id === inc.id) ? prev : [inc, ...prev])
      const u  = currentUserRef.current
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
        // Toast
        toast.show({
          type:    alertType.toLowerCase(),
          title:   `New Incident — ${inc.priority}`,
          message: `${inc.title} · ${inc.location}`,
          duration: inc.priority === 'Critical' ? 8000 : 5000,
        })
      }
    }
    const onIncidentUpdated = (inc) => {
      setIncidents(prev => {
        const old = prev.find(i => i.id === inc.id)
        const u  = currentUserRef.current
        const rn = typeof u?.role === 'object' ? u?.role?.name : (u?.role ?? '')

        // Responder: alert when their team is assigned
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
              // Toast
              toast.alert(`Assigned to ${teamName}`, {
                message:  `${inc.title} · ${inc.type} at ${inc.location}`,
                duration: 6000,
              })
            }
          }
        }

        // Admin / Officer: alert on status change
        if ((rn === 'Admin' || rn === 'Officer') && old && old.status !== inc.status) {
          const isResolved = inc.status === 'Resolved'
          setIncidentAlerts(p => [{
            id:         `status-${inc.id}-${Date.now()}`,
            incidentId: inc.id,
            type:       isResolved ? 'Info' : 'Alert',
            title:      `Incident ${inc.status}`,
            message:    `${inc.title} · status changed to ${inc.status}`,
            target:     'Officers',
            sentAt:     new Date().toISOString(),
          }, ...p.slice(0, 49)])
          // Toast
          toast.show({
            type:    isResolved ? 'success' : 'warning',
            title:   `Incident ${inc.status}`,
            message: `${inc.title} · ${inc.location}`,
            duration: 5000,
          })
        }

        return prev.map(i => i.id === inc.id ? inc : i)
      })
    }
    const onIncidentDeleted = ({ id, incident }) => {
      setIncidents(prev => prev.filter(i => i.id !== id))
      if (incident) setDeletedIncidents(prev => prev.some(i => i.id === id) ? prev : [incident, ...prev])
    }
    const onIncidentRestored = (incident) => {
      setDeletedIncidents(prev => prev.filter(i => i.id !== incident.id))
      setIncidents(prev => prev.some(i => i.id === incident.id) ? prev : [incident, ...prev])
    }
    socket.on('incident:created', onIncidentCreated)
    socket.on('incident:updated', onIncidentUpdated)
    socket.on('incident:deleted', onIncidentDeleted)
    socket.on('incident:restored', onIncidentRestored)

    // Users
    const onUserCreated = (user) =>
      setUsers(prev => prev.some(u => u.id === user.id) ? prev : [...prev, user])
    const onUserUpdated = (user) => {
      setUsers(prev => prev.map(u => u.id === user.id ? user : u))
      setCurrentUser(prev => prev?.id === user.id ? { ...prev, ...user } : prev)
    }
    const onUserDeleted = ({ id }) =>
      setUsers(prev => prev.filter(u => u.id !== id))
    socket.on('user:created', onUserCreated)
    socket.on('user:updated', onUserUpdated)
    socket.on('user:deleted', onUserDeleted)

    // Notifications
    const onNotificationSent = (n) => {
      setNotifications(prev => prev.some(x => x.id === n.id) ? prev : [n, ...prev])
      // Show toast for notifications targeted at the current user's role
      const u  = currentUserRef.current
      const rn = typeof u?.role === 'object' ? u?.role?.name : (u?.role ?? '')
      const TARGET_MAP = { Admin: 'Admin', Officer: 'Officers', Responder: 'Responders', Student: 'Students' }
      const myTarget = TARGET_MAP[rn] ?? ''
      if (n.target === 'All' || n.target === myTarget || (n.target === 'Admin' && rn === 'Admin')) {
        toast.show({
          type:    n.type === 'Emergency' ? 'emergency' : n.type === 'Alert' ? 'alert' : 'info',
          title:   n.title,
          message: n.message,
          duration: n.type === 'Emergency' ? 8000 : 5000,
        })
      }
    }
    const onNotificationDeleted = ({ id }) =>
      setNotifications(prev => prev.filter(n => n.id !== id))
    socket.on('notification:sent', onNotificationSent)
    socket.on('notification:deleted', onNotificationDeleted)

    // Teams
    const onTeamUpdated = (team) =>
      setTeams(prev => prev.some(t => t.id === team.id)
        ? prev.map(t => t.id === team.id ? team : t)
        : [...prev, team]
      )
    const onTeamDeleted = ({ id }) =>
      setTeams(prev => prev.filter(t => t.id !== id))
    socket.on('team:updated', onTeamUpdated)
    socket.on('team:deleted', onTeamDeleted)

    // Roles
    const onRoleUpdated = (role) =>
      setRoles(prev => prev.some(r => r.id === role.id)
        ? prev.map(r => r.id === role.id ? role : r)
        : [...prev, role].sort((a, b) => a.level - b.level)
      )
    const onRoleDeleted = ({ id }) =>
      setRoles(prev => prev.filter(r => r.id !== id))
    socket.on('role:updated', onRoleUpdated)
    socket.on('role:deleted', onRoleDeleted)

    // Cleanup: remove all named handlers + disconnect
    return () => {
      socket.off('connect',    onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('incident:created',  onIncidentCreated)
      socket.off('incident:updated',  onIncidentUpdated)
      socket.off('incident:deleted',  onIncidentDeleted)
      socket.off('incident:restored', onIncidentRestored)
      socket.off('user:created',  onUserCreated)
      socket.off('user:updated',  onUserUpdated)
      socket.off('user:deleted',  onUserDeleted)
      socket.off('notification:sent',    onNotificationSent)
      socket.off('notification:deleted', onNotificationDeleted)
      socket.off('team:updated', onTeamUpdated)
      socket.off('team:deleted', onTeamDeleted)
      socket.off('role:updated', onRoleUpdated)
      socket.off('role:deleted', onRoleDeleted)
      socket.disconnect()
    }
  }, [])

  // ── Bootstrap: restore session on mount ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('scars_token')
    if (!token) { setInitialized(true); return }
    authApi.me()
      .then(user => {
        setCurrentUser(user)
        setLoading(true)
        setSwrKey('app-data')   // activates SWR to load all data
      })
      .catch(() => {
        localStorage.removeItem('scars_token')
        setInitialized(true)
      })
  }, [])

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { token, user } = await authApi.login(email, password)
    localStorage.setItem('scars_token', token)
    setCurrentUser(user)
    sessionStorage.removeItem('scars_incident_alerts')
    setIncidentAlerts([])
    setLoading(true)
    setSwrKey('app-data')   // activates SWR — onSuccess sets initialized + all state
    return user
  }

  const logout = () => {
    localStorage.removeItem('scars_token')
    setCurrentUser(null)
    setSwrKey(null)          // suspends SWR
    setPollInterval(0)
    dataHashRef.current = ''
    setUsers([]); setRoles([]); setTeams([])
    setIncidents([]); setDeletedIncidents([]); setNotifications([])
    setIncidentAlerts([])
    setSystemConfig({}); setBackupConfig({})
    setInitialized(true)
  }

  // ── Incidents ─────────────────────────────────────────────────────────────
  const addIncident = async (data) => {
    const inc = await incidentsApi.create({ ...data, reportedById: currentUser?.id })
    // State updated via socket 'incident:created' to prevent duplicate entries
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

  // ── Notifications ─────────────────────────────────────────────────────────
  const sendNotification = async (data) => {
    const n = await notificationsApi.send({ ...data, sentById: currentUser?.id })
    // State updated via socket 'notification:sent' to prevent duplicate
    return n
  }
  const deleteNotification = async (id) => {
    await notificationsApi.delete(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  const deleteNotifications = async (ids) => {
    await notificationsApi.deleteMany(ids)
    const idSet = new Set(ids.map(Number))
    setNotifications(prev => prev.filter(n => !idSet.has(n.id)))
  }

  // ── Users ─────────────────────────────────────────────────────────────────
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

  // ── Profile ───────────────────────────────────────────────────────────────
  const updateProfile = async (data) => {
    const user = await profileApi.update(data)
    setCurrentUser(user)
    setUsers(prev => prev.map(u => u.id === user.id ? user : u))
    return user
  }

  // ── Roles ─────────────────────────────────────────────────────────────────
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

  // ── Teams ─────────────────────────────────────────────────────────────────
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

  // ── Admin / Config ────────────────────────────────────────────────────────
  const saveSystemConfig = async (data) => {
    try {
      const cfg = await adminApi.saveSystemConfig(data)
      setSystemConfig(cfg)
      localStorage.setItem('scars_system_config', JSON.stringify(cfg))
    } catch {
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
      sendNotification, deleteNotification, deleteNotifications,
      triggerBackup, saveBackupConfig, saveSystemConfig,
      reload: revalidate,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

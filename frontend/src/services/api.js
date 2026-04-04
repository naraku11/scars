const BASE = '/api'

function getToken() {
  return localStorage.getItem('scars_token')
}

// Deduplicate concurrent identical GET requests — if two components both
// call usersApi.list() before the first resolves, they share one fetch.
const inflight = new Map()

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  // Deduplicate GET requests only (mutations must always execute)
  const dedupeKey = method === 'GET' ? `${method}:${path}` : null
  if (dedupeKey && inflight.has(dedupeKey)) return inflight.get(dedupeKey)

  const promise = (async () => {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    return res.json()
  })()

  if (dedupeKey) {
    inflight.set(dedupeKey, promise)
    promise.finally(() => inflight.delete(dedupeKey))
  }

  return promise
}

const get  = (path)        => request('GET',    path)
const post = (path, body)  => request('POST',   path, body)
const put  = (path, body)  => request('PUT',    path, body)
const patch = (path, body) => request('PATCH',  path, body)
const del  = (path)        => request('DELETE', path)

// Auth
export const authApi = {
  login:          (email, password) => post('/auth/login', { email, password }),
  me:             ()                => get('/auth/me'),
  verifyPassword: (password)        => post('/auth/verify-password', { password }),
}

// Users
export const usersApi = {
  list:   ()          => get('/users'),
  get:    (id)        => get(`/users/${id}`),
  create: (data)      => post('/users', data),
  update: (id, data)  => put(`/users/${id}`, data),
  delete: (id)        => del(`/users/${id}`),
}

// Roles
export const rolesApi = {
  list:   ()          => get('/roles'),
  create: (data)      => post('/roles', data),
  update: (id, data)  => put(`/roles/${id}`, data),
  delete: (id)        => del(`/roles/${id}`),
}

// Teams
export const teamsApi = {
  list:   ()          => get('/teams'),
  get:    (id)        => get(`/teams/${id}`),
  create: (data)      => post('/teams', data),
  update: (id, data)  => put(`/teams/${id}`, data),
  delete: (id)        => del(`/teams/${id}`),
}

// Incidents
export const incidentsApi = {
  list:        ()           => get('/incidents'),
  listDeleted: ()           => get('/incidents/deleted'),
  get:         (id)         => get(`/incidents/${id}`),
  create:      (data)       => post('/incidents', data),
  update:      (id, data)   => put(`/incidents/${id}`, data),
  delete:      (id)         => del(`/incidents/${id}`),
  restore:     (id)         => patch(`/incidents/${id}/restore`),
  validate:    (id)         => patch(`/incidents/${id}/validate`),
  verify:      (id)         => patch(`/incidents/${id}/verify`),
  assign:      (id, teamId) => patch(`/incidents/${id}/assign`, { teamId }),
}

// Notifications
export const notificationsApi = {
  list:   ()          => get('/notifications'),
  send:   (data)      => post('/notifications', data),
  delete: (id)        => del(`/notifications/${id}`),
}

// Profile
export const profileApi = {
  get:         ()       => get('/profile'),
  update:      (data)   => put('/profile', data),
  verifyFace:  (image)  => post('/profile/verify-face', { image }),
}

// Admin
export const adminApi = {
  getSystemConfig:  ()      => get('/admin/system-config'),
  saveSystemConfig: (data)  => put('/admin/system-config', data),
  getBackupConfig:  ()      => get('/admin/backup-config'),
  saveBackupConfig: (data)  => put('/admin/backup-config', data),
}

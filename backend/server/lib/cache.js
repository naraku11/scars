const store = new Map()
const MAX_ENTRIES = 500

export function cacheGet(key) {
  const item = store.get(key)
  if (!item) return null
  if (Date.now() > item.exp) { store.delete(key); return null }
  return item.val
}

export function cacheSet(key, val, ttlMs = 60_000) {
  // Evict expired entries when approaching limit
  if (store.size >= MAX_ENTRIES) {
    const now = Date.now()
    for (const [k, v] of store) {
      if (now > v.exp) store.delete(k)
    }
    // If still over limit, evict oldest entries
    if (store.size >= MAX_ENTRIES) {
      const excess = store.size - MAX_ENTRIES + 1
      const keys = store.keys()
      for (let i = 0; i < excess; i++) store.delete(keys.next().value)
    }
  }
  store.set(key, { val, exp: Date.now() + ttlMs })
}

export function cacheDel(...keys) {
  keys.forEach(k => store.delete(k))
}

/** Delete all keys matching a prefix (e.g. cachePurge('user:') clears all user entries) */
export function cachePurge(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}

/** Cache stats for /api/health diagnostics */
export function cacheStats() {
  let active = 0, expired = 0
  const now = Date.now()
  for (const v of store.values()) {
    if (now > v.exp) expired++; else active++
  }
  return { entries: store.size, active, expired }
}

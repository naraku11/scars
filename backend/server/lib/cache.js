const store = new Map()

export function cacheGet(key) {
  const item = store.get(key)
  if (!item) return null
  if (Date.now() > item.exp) { store.delete(key); return null }
  return item.val
}

export function cacheSet(key, val, ttlMs = 60_000) {
  store.set(key, { val, exp: Date.now() + ttlMs })
}

export function cacheDel(...keys) {
  keys.forEach(k => store.delete(k))
}

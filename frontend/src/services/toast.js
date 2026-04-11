// Global toast singleton — callable from anywhere (AppContext, components, etc.)
// The Toaster component registers itself via _register on mount.

let _dispatch = null

export function _register(fn)   { _dispatch = fn }
export function _unregister()   { _dispatch = null }

let _seq = 0

function show({ type = 'info', title, message, duration = 5000, action }) {
  if (!_dispatch) return
  _dispatch({ id: ++_seq, type, title, message, duration, action })
}

const toast = {
  show,
  success:   (title, opts = {}) => show({ type: 'success',   title, ...opts }),
  error:     (title, opts = {}) => show({ type: 'error',     title, ...opts }),
  warning:   (title, opts = {}) => show({ type: 'warning',   title, ...opts }),
  info:      (title, opts = {}) => show({ type: 'info',      title, ...opts }),
  alert:     (title, opts = {}) => show({ type: 'alert',     title, ...opts }),
  emergency: (title, opts = {}) => show({ type: 'emergency', title, ...opts }),
}

export default toast

import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

const SHIELD_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232E7D32'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/%3E%3C/svg%3E"

function getCachedLogo() {
  try {
    return JSON.parse(localStorage.getItem('scars_system_config') || 'null')?.logoImage || ''
  } catch { return '' }
}

/**
 * Invisible component that keeps document.title and favicon
 * in sync with systemConfig. Falls back to localStorage so the
 * favicon and login page show the logo before authentication.
 */
export default function BrandingManager() {
  const { systemConfig } = useApp()
  const logo = systemConfig?.logoImage || getCachedLogo()
  const name = systemConfig?.siteName

  // ── Page title ──────────────────────────────────────────────
  useEffect(() => {
    document.title = name || 'UV Toledo Campus — SCARS'
  }, [name])

  // ── Favicon ─────────────────────────────────────────────────
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    if (logo) {
      link.type = 'image/png'
      link.href = logo
    } else {
      link.type = 'image/svg+xml'
      link.href = SHIELD_SVG
    }
  }, [logo])

  return null
}

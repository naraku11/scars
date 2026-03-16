import { ShieldCheck } from 'lucide-react'
import s from './LoadingScreen.module.css'

function getSavedConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem('scars_system_config') || 'null')
    const siteName = cfg?.siteName || 'UV Toledo Campus — SCARS'
    const parts = siteName.split(' — ')
    return {
      logoImage: cfg?.logoImage || '',
      title:     parts.length > 1 ? parts[parts.length - 1] : siteName,
      sub:       parts.length > 1 ? parts.slice(0, -1).join(' — ') : 'Smart Campus Alert & Response System',
    }
  } catch {
    return { logoImage: '', title: 'UV SCARS', sub: 'Smart Campus Alert & Response System' }
  }
}

export default function LoadingScreen() {
  const { logoImage, title, sub } = getSavedConfig()

  return (
    <div className={s.screen}>
      <div className={s.card}>
        <div className={s.shieldWrap}>
          <div className={s.ring} />
          <div className={s.ring2} />
          {logoImage
            ? <img src={logoImage} alt="logo" className={s.logoImg} />
            : <ShieldCheck size={44} className={s.shieldIcon} />}
        </div>
        <div className={s.title}>{title}</div>
        <div className={s.sub}>{sub}</div>
        <div className={s.bar}><div className={s.barFill} /></div>
        <div className={s.dots}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}

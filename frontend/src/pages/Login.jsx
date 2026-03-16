import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useApp } from '../context/AppContext'
import s from './Login.module.css'

function getSavedConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem('scars_system_config') || 'null')
    const siteName = cfg?.siteName || 'UV Toledo Campus — SCARS'
    const parts = siteName.split(' — ')
    return {
      logoImage: cfg?.logoImage || '',
      acronym:   parts.length > 1 ? parts[parts.length - 1] : siteName,
      sysName:   parts.length > 1 ? parts.slice(0, -1).join(' — ') : siteName,
    }
  } catch {
    return { logoImage: '', acronym: 'SCARS', sysName: 'UV Toledo Campus' }
  }
}

export default function Login() {
  const { login } = useApp()
  const { logoImage, acronym, sysName } = getSavedConfig()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      const role = typeof user?.role === 'object' ? user.role?.name : user?.role
      if (role === 'Officer')   navigate('/officer')
      else if (role === 'Responder') navigate('/responder')
      else if (role === 'Student')   navigate('/student')
      else                           navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      {/* Left panel — branding */}
      <div className={s.brandPanel}>
        <div className={s.seal}>
          {logoImage
            ? <img src={logoImage} alt="logo" className={s.sealImg} />
            : <ShieldCheck size={52} color="#C9A227" />}
        </div>
        <div className={s.uniName}>University of the Visayas</div>
        <div className={s.campusName}>Toledo Campus</div>
        <div className={s.divider} />
        <div className={s.sysName}>{sysName}</div>
        <div className={s.acronym}>{acronym}</div>
        <div className={s.motto}>"Amor, Servitium, Humanitas"</div>
      </div>

      {/* Right panel — form */}
      <div className={s.formPanel}>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardIcon}>
              {logoImage
                ? <img src={logoImage} alt="logo" className={s.cardLogoImg} />
                : <ShieldCheck size={26} />}
            </div>
            <div>
              <h2 className={s.cardTitle}>Sign In</h2>
              <p className={s.cardSub}>Access the SCARS portal</p>
            </div>
          </div>

          {error && <div className={s.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label>Email</label>
              <div className={s.inputWrap}>
                <Mail size={15} className={s.inputIcon} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@uv.edu.ph" required
                />
              </div>
            </div>
            <div className={s.field}>
              <label>Password</label>
              <div className={s.inputWrap}>
                <Lock size={15} className={s.inputIcon} />
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" required
                />
                <button type="button" className={s.showHideBtn} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" className={s.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}

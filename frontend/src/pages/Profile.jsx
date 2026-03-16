import { useState, useRef } from 'react'
import { Camera, Edit2, Save, X, CheckCircle, AlertCircle, Loader, User, Mail, Lock, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { profileApi } from '../services/api'
import Header from '../components/Header'
import p from '../components/Page.module.css'
import s from './Profile.module.css'

export default function Profile() {
  const { currentUser, updateProfile } = useApp()
  const fileRef = useRef()

  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', password: '' })
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  // Photo state
  const [preview, setPreview]     = useState(null)
  const [verifyState, setVerify]  = useState(null)  // null | 'loading' | {valid,message}
  const [photoFile, setPhotoFile] = useState(null)

  const roleName = typeof currentUser?.role === 'object'
    ? currentUser.role?.name
    : currentUser?.role

  const roleColor = typeof currentUser?.role === 'object'
    ? currentUser.role?.color
    : '#2E7D32'

  const startEdit = () => {
    setForm({ name: currentUser.name, email: currentUser.email, password: '' })
    setError('')
    setSuccess('')
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setSuccess('')
    try {
      const payload = {}
      if (form.name    && form.name    !== currentUser.name)  payload.name  = form.name
      if (form.email   && form.email   !== currentUser.email) payload.email = form.email
      if (form.password) payload.password = form.password
      if (!Object.keys(payload).length) { setEditing(false); return }
      await updateProfile(payload)
      setSuccess('Profile updated successfully.')
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setBusy(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setVerify({ valid: false, message: 'Please select an image file.' })
      return
    }
    setPhotoFile(file)
    setVerify(null)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleVerify = async () => {
    if (!preview) return
    setVerify('loading')
    setError('')
    try {
      const result = await profileApi.verifyFace(preview)
      setVerify(result)
      if (result.valid) {
        // Auto-save the verified image
        await updateProfile({ profileImage: preview })
        setSuccess('Profile photo updated.')
        setPreview(null)
        setPhotoFile(null)
      }
    } catch (err) {
      setVerify({ valid: false, message: err.message || 'Verification failed.' })
    }
  }

  const cancelPhoto = () => {
    setPreview(null)
    setPhotoFile(null)
    setVerify(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const photo = currentUser?.profileImage || null

  return (
    <div className={p.page}>
      <Header title="My Profile" subtitle="View and edit your account details" />
      <div className={p.content}>

        {success && (
          <div className={`${p.alertBox} ${p.alertSuccess}`}>
            <CheckCircle size={14} /> {success}
          </div>
        )}
        {error && (
          <div className={`${p.alertBox} ${p.alertDanger}`}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className={s.profileGrid}>

          {/* ── Left: Avatar Card ─────────────────── */}
          <div className={`${p.card} ${s.avatarCard}`}>
            <div className={s.photoWrap}>
              {photo ? (
                <img src={photo} alt="Profile" className={s.photo} />
              ) : (
                <div className={s.avatarBig} style={{ background: roleColor + '22', color: roleColor }}>
                  {currentUser?.avatar || '?'}
                </div>
              )}
              <button className={s.cameraBtn} onClick={() => fileRef.current?.click()} title="Change photo">
                <Camera size={15} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div className={s.profileName}>{currentUser?.name}</div>
            <span className={s.roleBadge} style={{ background: roleColor + '22', color: roleColor, border: `1px solid ${roleColor}44` }}>
              {roleName}
            </span>
            <div className={s.joinedDate}>
              Member since {currentUser?.joined ? new Date(currentUser.joined).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' }) : '—'}
            </div>

            {/* Photo upload area */}
            {preview && (
              <div className={s.photoPreviewBox}>
                <div className={s.previewLabel}>New Photo Preview</div>
                <img src={preview} alt="Preview" className={s.previewImg} />

                {verifyState === 'loading' && (
                  <div className={s.verifyStatus}>
                    <Loader size={14} className={s.spin} /> Verifying face…
                  </div>
                )}
                {verifyState && verifyState !== 'loading' && (
                  <div className={`${s.verifyStatus} ${verifyState.valid ? s.verifyOk : s.verifyFail}`}>
                    {verifyState.valid
                      ? <CheckCircle size={14} />
                      : <AlertCircle size={14} />}
                    {verifyState.message}
                    {verifyState.noApi && <span className={s.noApiNote}> (Face API not configured)</span>}
                  </div>
                )}

                {(!verifyState || verifyState === null) && (
                  <div className={p.btnRow} style={{ marginTop: 10, justifyContent: 'center' }}>
                    <button className={`${p.btn} ${p.btnSuccess} ${p.btnSm}`} onClick={handleVerify}>
                      <Shield size={13} /> Verify &amp; Save
                    </button>
                    <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={cancelPhoto}>
                      <X size={13} /> Cancel
                    </button>
                  </div>
                )}
                {verifyState && verifyState !== 'loading' && !verifyState.valid && (
                  <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={cancelPhoto} style={{ marginTop: 6 }}>
                    <X size={13} /> Cancel
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Info / Edit Card ────────────── */}
          <div className={`${p.card} ${s.infoCard}`}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>Account Details</span>
              {!editing && (
                <button className={`${p.btn} ${p.btnOutline} ${p.btnSm}`} onClick={startEdit}>
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>

            {!editing ? (
              <div className={s.detailList}>
                <div className={s.detailRow}>
                  <span className={s.detailIcon}><User size={15} /></span>
                  <div>
                    <div className={s.detailLabel}>Full Name</div>
                    <div className={s.detailValue}>{currentUser?.name}</div>
                  </div>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailIcon}><Mail size={15} /></span>
                  <div>
                    <div className={s.detailLabel}>Email Address</div>
                    <div className={s.detailValue}>{currentUser?.email}</div>
                  </div>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailIcon}><Shield size={15} /></span>
                  <div>
                    <div className={s.detailLabel}>Role</div>
                    <div className={s.detailValue}>{roleName}</div>
                  </div>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailIcon}><CheckCircle size={15} /></span>
                  <div>
                    <div className={s.detailLabel}>Status</div>
                    <div className={s.detailValue}>
                      <span className={`badge ${currentUser?.status === 'Active' ? 'badge-resolved' : 'badge-rejected'}`}>
                        {currentUser?.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <div className={p.formGrid}>
                  <div className={p.field}>
                    <label><User size={12} /> Full Name</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={p.field}>
                    <label><Mail size={12} /> Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={`${p.field} ${p.formFull}`}>
                    <label><Lock size={12} /> New Password <span style={{ fontWeight: 400, color: '#4a7a52' }}>(leave blank to keep current)</span></label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      minLength={form.password ? 6 : undefined}
                    />
                  </div>
                </div>
                <div className={p.btnRow} style={{ marginTop: 16 }}>
                  <button type="submit" className={`${p.btn} ${p.btnSuccess}`} disabled={busy}>
                    <Save size={13} /> {busy ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button type="button" className={`${p.btn} ${p.btnOutline}`} onClick={cancelEdit}>
                    <X size={13} /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

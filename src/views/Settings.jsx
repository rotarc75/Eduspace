import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { changePassword } = useApp()
  const [pwd,     setPwd]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg,     setMsg]     = useState(null)
  const [saving,  setSaving]  = useState(false)

  async function handleChange() {
    if (!pwd || pwd !== confirm) {
      setMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (pwd.length < 4) {
      setMsg({ type: 'error', text: 'Minimum 4 caractères.' })
      return
    }
    setSaving(true)
    const err = await changePassword(pwd)
    setSaving(false)
    if (err) {
      setMsg({ type: 'error', text: 'Erreur lors de la sauvegarde.' })
    } else {
      setMsg({ type: 'success', text: 'Mot de passe modifié !' })
      setPwd('')
      setConfirm('')
    }
  }

  return (
    <div>
      <h1 className="page-title">Réglages</h1>
      <p className="page-subtitle">Paramètres de l'espace professeur</p>

      <div style={{ maxWidth: 420 }}>
        <div className="card" style={{ marginBottom: 12 }}>
          <h2 style={{ marginBottom: '1rem' }}>Mot de passe professeur</h2>
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setMsg(null) }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setMsg(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleChange()}
              />
            </div>
            {msg && (
              <div style={{ fontSize: 13, color: msg.type === 'error' ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>
                {msg.text}
              </div>
            )}
            <button className="btn-primary btn-full" onClick={handleChange} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
          <h2 style={{ marginBottom: 6 }}>À propos</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            EduSpace est une application privée entre un professeur et son élève.
            Les données sont stockées dans Supabase et partagées entre les deux utilisateurs.
            Aucun compte nécessaire — l'accès prof est protégé par un mot de passe.
          </p>
        </div>
      </div>
    </div>
  )
}

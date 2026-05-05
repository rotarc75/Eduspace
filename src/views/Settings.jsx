import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../shared/Icon'

export default function Settings() {
  const { profId, professors, updateCurrentProf } = useAuth()

  const [form, setForm] = useState({ name: '', username: '', password: '', confirm: '' })
  const [msg,    setMsg]    = useState(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Initialiser le formulaire dès que professors est chargé
  useEffect(() => {
    if (loaded) return
    const current = professors.find(p => p.id === profId)
    if (current) {
      setForm(f => ({ ...f, name: current.name, username: current.username }))
      setLoaded(true)
    }
  }, [professors, profId, loaded])

  async function handleSave() {
    setMsg(null)
    if (!form.name.trim() || !form.username.trim()) {
      setMsg({ type: 'error', text: "Le nom et l'identifiant sont obligatoires." }); return
    }
    if (form.password && form.password !== form.confirm) {
      setMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' }); return
    }
    if (form.password && form.password.length < 4) {
      setMsg({ type: 'error', text: 'Mot de passe trop court (min. 4 caractères).' }); return
    }
    setSaving(true)
    const err = await updateCurrentProf({
      name:     form.name.trim(),
      username: form.username.trim(),
      password: form.password || null,
    })
    setSaving(false)
    if (err) {
      setMsg({ type: 'error', text: err.message })
    } else {
      setMsg({ type: 'success', text: '✓ Modifications enregistrées !' })
      setForm(f => ({ ...f, password: '', confirm: '' }))
    }
  }

  const msgBox = msg && (
    <div style={{
      fontSize: 13, fontWeight: 500, padding: '9px 12px', borderRadius: 'var(--r-sm)',
      color:       msg.type === 'error' ? 'var(--red)'   : 'var(--green)',
      background:  msg.type === 'error' ? 'var(--red-bg)' : 'var(--green-bg)',
      border: `1px solid ${msg.type === 'error' ? 'var(--red-border)' : 'var(--green-border)'}`,
    }}>
      {msg.text}
    </div>
  )

  return (
    <div>
      <h1 className="page-title">Réglages</h1>
      <p className="page-subtitle">Gérer votre compte professeur</p>

      <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Infos du compte */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="user" size={15} style={{ color: 'var(--maths)' }} /> Informations du compte
          </h2>
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label">Nom affiché</label>
              <input value={form.name}
                placeholder="Votre nom…"
                onChange={e => { setForm({ ...form, name: e.target.value }); setMsg(null) }} />
            </div>
            <div className="form-group">
              <label className="form-label">Identifiant de connexion</label>
              <input value={form.username}
                placeholder="Votre identifiant…"
                onChange={e => { setForm({ ...form, username: e.target.value }); setMsg(null) }} />
              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>
                Doit être unique parmi tous les professeurs.
              </div>
            </div>
          </div>
        </div>

        {/* Mot de passe */}
        <div className="card">
          <h2 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lock" size={15} style={{ color: 'var(--maths)' }} /> Mot de passe
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Laisser vide pour conserver l'actuel.
          </p>
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setMsg(null) }} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer</label>
              <input type="password" placeholder="••••••••" value={form.confirm}
                onChange={e => { setForm({ ...form, confirm: e.target.value }); setMsg(null) }}
                onKeyDown={e => e.key === 'Enter' && handleSave()} />
            </div>
          </div>
        </div>

        {msgBox}

        <button className="btn-primary btn-full" onClick={handleSave} disabled={saving || !loaded}>
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}

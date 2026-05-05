import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { profName, profId, professors, updateCurrentProf } = useAuth()

  const currentProf = professors.find(p => p.id === profId)

  const [form, setForm] = useState({
    name:     currentProf?.name     ?? '',
    username: currentProf?.username ?? '',
    password: '',
    confirm:  '',
  })
  const [msg,    setMsg]    = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setMsg(null)
    if (!form.name.trim() || !form.username.trim()) {
      setMsg({ type: 'error', text: 'Le nom et l\'identifiant sont obligatoires.' }); return
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
      setMsg({ type: 'success', text: 'Modifications enregistrées !' })
      setForm(f => ({ ...f, password: '', confirm: '' }))
    }
  }

  return (
    <div>
      <h1 className="page-title">Réglages</h1>
      <p className="page-subtitle">Gérer votre compte</p>

      <div style={{ maxWidth: 440 }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Mon compte</h2>
          <div className="form-stack">

            <div className="form-group">
              <label className="form-label">Nom affiché</label>
              <input
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); setMsg(null) }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Identifiant de connexion</label>
              <input
                value={form.username}
                onChange={e => { setForm({ ...form, username: e.target.value }); setMsg(null) }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>
                Doit être unique parmi tous les professeurs.
              </div>
            </div>

            <hr className="divider" />

            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
              Changer le mot de passe <span style={{ fontWeight: 400, fontSize: 12 }}>(laisser vide pour garder l'actuel)</span>
            </div>

            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setMsg(null) }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer</label>
              <input
                type="password" placeholder="••••••••"
                value={form.confirm}
                onChange={e => { setForm({ ...form, confirm: e.target.value }); setMsg(null) }}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>

            {msg && (
              <div style={{
                fontSize: 13, fontWeight: 500,
                color: msg.type === 'error' ? 'var(--red)' : 'var(--green)',
                background: msg.type === 'error' ? 'var(--red-bg)' : 'var(--green-bg)',
                border: `1px solid ${msg.type === 'error' ? 'var(--red-border)' : 'var(--green-border)'}`,
                borderRadius: 'var(--r-sm)', padding: '8px 12px',
              }}>
                {msg.text}
              </div>
            )}

            <button className="btn-primary btn-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

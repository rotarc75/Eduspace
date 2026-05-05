import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../shared/Icon'

// mode: null | 'prof_login' | 'prof_register' | 'student'
export default function LoginScreen() {
  const { loginProf, loginStudent, registerProfessor, authLoading } = useAuth()

  const [mode,    setMode]    = useState(null)
  const [form,    setForm]    = useState({ name: '', username: '', password: '', confirm: '' })
  const [error,   setError]   = useState(null)
  const [saving,  setSaving]  = useState(false)

  if (authLoading) return <div className="loading-screen"><div className="loading-spinner" /><p>Chargement…</p></div>

  function resetForm(m) { setMode(m); setForm({ name: '', username: '', password: '', confirm: '' }); setError(null) }

  async function handleLogin() {
    setError(null)
    if (!form.username.trim() || !form.password) { setError('Remplis tous les champs.'); return }
    const ok = mode === 'prof_login'
      ? loginProf(form.username, form.password)
      : loginStudent(form.username, form.password)
    if (!ok) setError('Identifiant ou mot de passe incorrect.')
  }

  async function handleRegister() {
    setError(null)
    if (!form.name.trim() || !form.username.trim() || !form.password) { setError('Tous les champs sont obligatoires.'); return }
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (form.password.length < 4) { setError('Mot de passe trop court (min. 4 caractères).'); return }
    setSaving(true)
    const err = await registerProfessor({ name: form.name, username: form.username, password: form.password })
    setSaving(false)
    if (err) setError(err.message)
  }

  const cardBtn = (color) => ({
    padding: '1.125rem 1.5rem', borderRadius: 'var(--r-lg)',
    background: 'var(--bg-surface)', border: '1px solid var(--border-md)',
    display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
    width: '100%', cursor: 'pointer', transition: 'border-color 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--maths-bg)', border: '1px solid var(--maths-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="book" size={22} style={{ color: 'var(--maths)' }} />
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>EduSpace</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Espace de travail prof / élève</div>
        </div>

        {/* ── Sélection du rôle ─────────────────────────────────── */}
        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Bloc professeur avec deux boutons */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r)', flexShrink: 0, background: 'var(--maths-bg)', border: '1px solid var(--maths-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="settings" size={16} style={{ color: 'var(--maths)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Professeur</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accès complet · gestion des élèves</div>
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <button onClick={() => resetForm('prof_login')}
                  style={{ flex: 1, padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderRight: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon name="unlock" size={13} /> Se connecter
                </button>
                <button onClick={() => resetForm('prof_register')}
                  style={{ flex: 1, padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'var(--maths)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--maths-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon name="plus" size={13} /> Créer un compte
                </button>
              </div>
            </div>

            {/* Bloc élève */}
            <button style={cardBtn('infos')} onClick={() => resetForm('student')}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--infos)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-md)'}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', flexShrink: 0, background: 'var(--infos-bg)', border: '1px solid var(--infos-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="user" size={18} style={{ color: 'var(--infos)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Élève</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accès à mon espace de travail</div>
              </div>
              <Icon name="chevron-right" size={16} style={{ color: 'var(--text-hint)' }} />
            </button>
          </div>
        )}

        {/* ── Formulaire connexion (prof ou élève) ──────────────── */}
        {(mode === 'prof_login' || mode === 'student') && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <button className="btn-ghost" style={{ marginBottom: '1.25rem', fontSize: 13, padding: '4px 8px' }}
              onClick={() => resetForm(null)}>
              <Icon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} /> Retour
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              {mode === 'prof_login' ? 'Connexion professeur' : 'Connexion élève'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Entrez vos identifiants</p>
            <div className="form-stack">
              <div className="form-group">
                <label className="form-label">Identifiant</label>
                <input placeholder="Votre identifiant" value={form.username} autoFocus
                  onChange={e => { setForm({ ...form, username: e.target.value }); setError(null) }} />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input type="password" placeholder="••••••••" value={form.password}
                  className={error ? 'error' : ''}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              {error && <div className="alert alert-red" style={{ padding: '8px 12px', fontSize: 13 }}><Icon name="alert" size={14} style={{ flexShrink: 0 }} /> {error}</div>}
              <button className="btn-primary btn-full" onClick={handleLogin} style={{ marginTop: 4 }}>
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* ── Formulaire création compte professeur ─────────────── */}
        {mode === 'prof_register' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <button className="btn-ghost" style={{ marginBottom: '1.25rem', fontSize: 13, padding: '4px 8px' }}
              onClick={() => resetForm(null)}>
              <Icon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} /> Retour
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Créer un compte professeur</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Remplissez les informations ci-dessous</p>
            <div className="form-stack">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input placeholder="Ex : Dr. Martin" value={form.name} autoFocus
                  onChange={e => { setForm({ ...form, name: e.target.value }); setError(null) }} />
              </div>
              <div className="form-group">
                <label className="form-label">Identifiant *</label>
                <input placeholder="Ex : martin" value={form.username}
                  onChange={e => { setForm({ ...form, username: e.target.value }); setError(null) }} />
                <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>Sans espaces, sera utilisé pour se connecter.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe *</label>
                <input type="password" placeholder="••••••••" value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(null) }} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe *</label>
                <input type="password" placeholder="••••••••" value={form.confirm}
                  className={error && form.confirm ? 'error' : ''}
                  onChange={e => { setForm({ ...form, confirm: e.target.value }); setError(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()} />
              </div>
              {error && <div className="alert alert-red" style={{ padding: '8px 12px', fontSize: 13 }}><Icon name="alert" size={14} style={{ flexShrink: 0 }} /> {error}</div>}
              <button className="btn-primary btn-full" onClick={handleRegister} disabled={saving} style={{ marginTop: 4 }}>
                {saving ? 'Création…' : 'Créer mon compte'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

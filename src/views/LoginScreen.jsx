import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../shared/Icon'

export default function LoginScreen() {
  const { loginProf, loginStudent, authLoading } = useAuth()
  const [mode,  setMode]  = useState(null)   // null | 'prof' | 'student'
  const [form,  setForm]  = useState({ username: '', password: '' })
  const [error, setError] = useState(null)

  if (authLoading) return <div className="loading-screen"><div className="loading-spinner" /><p>Chargement…</p></div>

  function handleSubmit() {
    setError(null)
    if (!form.username.trim() || !form.password) { setError('Remplis tous les champs.'); return }
    const ok = mode === 'prof'
      ? loginProf(form.username, form.password)
      : loginStudent(form.username, form.password)
    if (!ok) setError('Identifiant ou mot de passe incorrect.')
  }

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

        {/* Sélection du rôle */}
        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'prof',    label: 'Professeur', sub: 'Accès complet · gestion des élèves', icon: 'settings', color: 'maths' },
              { key: 'student', label: 'Élève',      sub: 'Accès à mon espace de travail',       icon: 'user',     color: 'infos'  },
            ].map(({ key, label, sub, icon, color }) => (
              <button key={key}
                onClick={() => { setMode(key); setForm({ username: '', password: '' }); setError(null) }}
                style={{ padding: '1.125rem 1.5rem', borderRadius: 'var(--r-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border-md)', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `var(--${color})`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
              >
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', flexShrink: 0, background: `var(--${color}-bg)`, border: `1px solid var(--${color}-border)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icon} size={18} style={{ color: `var(--${color})` }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
                </div>
                <Icon name="chevron-right" size={16} style={{ color: 'var(--text-hint)' }} />
              </button>
            ))}
          </div>
        )}

        {/* Formulaire */}
        {mode && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <button className="btn-ghost" style={{ marginBottom: '1.25rem', fontSize: 13, padding: '4px 8px' }}
              onClick={() => { setMode(null); setError(null) }}>
              <Icon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} /> Retour
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              {mode === 'prof' ? 'Connexion professeur' : 'Connexion élève'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Entrez vos identifiants
            </p>
            <div className="form-stack">
              <div className="form-group">
                <label className="form-label">Identifiant</label>
                <input placeholder={mode === 'prof' ? 'Ex : prof' : 'Ton identifiant…'}
                  value={form.username} autoFocus
                  onChange={e => { setForm({ ...form, username: e.target.value }); setError(null) }} />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input type="password" placeholder="••••••••"
                  value={form.password} className={error ? 'error' : ''}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
              {error && (
                <div className="alert alert-red" style={{ padding: '8px 12px', fontSize: 13 }}>
                  <Icon name="alert" size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}
              <button className="btn-primary btn-full" onClick={handleSubmit} style={{ marginTop: 4 }}>
                Se connecter
              </button>
            </div>
            {mode === 'prof' && (
              <p className="form-hint" style={{ marginTop: '1rem' }}>
                Compte par défaut : <strong>prof</strong> / <strong>prof2024</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

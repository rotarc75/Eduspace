import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../shared/Icon'

export default function LoginScreen() {
  const { loginProf, loginStudent, students, authLoading } = useAuth()

  const [mode,  setMode]  = useState(null)  // null | 'prof' | 'student'
  const [form,  setForm]  = useState({ username: '', password: '' })
  const [error, setError] = useState(null)

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Chargement…</p>
      </div>
    )
  }

  function handleSubmit() {
    setError(null)
    if (mode === 'prof') {
      const ok = loginProf(form.password)
      if (!ok) setError('Mot de passe incorrect.')
    } else {
      if (!form.username.trim() || !form.password) { setError('Remplis tous les champs.'); return }
      const ok = loginStudent(form.username, form.password)
      if (!ok) setError('Identifiant ou mot de passe incorrect.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: 8,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--maths-bg)', border: '1px solid var(--maths-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="book" size={20} style={{ color: 'var(--maths)' }} />
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>EduSpace</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Espace de travail prof / élève
          </div>
        </div>

        {/* Mode selection */}
        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => { setMode('prof'); setForm({ username: '', password: '' }); setError(null) }}
              style={{
                padding: '1.125rem 1.5rem', borderRadius: 'var(--r-lg)',
                background: 'var(--bg-surface)', border: '1px solid var(--border-md)',
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--maths)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--r)', flexShrink: 0,
                background: 'var(--maths-bg)', border: '1px solid var(--maths-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="settings" size={18} style={{ color: 'var(--maths)' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Professeur</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accès complet, gestion des élèves</div>
              </div>
              <Icon name="chevron-right" size={16} style={{ color: 'var(--text-hint)', marginLeft: 'auto' }} />
            </button>

            <button
              onClick={() => { setMode('student'); setForm({ username: '', password: '' }); setError(null) }}
              style={{
                padding: '1.125rem 1.5rem', borderRadius: 'var(--r-lg)',
                background: 'var(--bg-surface)', border: '1px solid var(--border-md)',
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--infos)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--r)', flexShrink: 0,
                background: 'var(--infos-bg)', border: '1px solid var(--infos-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="user" size={18} style={{ color: 'var(--infos)' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Élève</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {students.length > 0
                    ? `${students.length} compte${students.length > 1 ? 's' : ''} disponible${students.length > 1 ? 's' : ''}`
                    : 'Accès à ton espace personnel'}
                </div>
              </div>
              <Icon name="chevron-right" size={16} style={{ color: 'var(--text-hint)', marginLeft: 'auto' }} />
            </button>
          </div>
        )}

        {/* Login form */}
        {mode && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <button
              className="btn-ghost"
              style={{ marginBottom: '1.25rem', padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => { setMode(null); setError(null) }}
            >
              <Icon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
              Retour
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                {mode === 'prof' ? 'Connexion professeur' : 'Connexion élève'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {mode === 'prof' ? 'Entrez votre mot de passe' : 'Entrez vos identifiants'}
              </p>
            </div>

            <div className="form-stack">
              {mode === 'student' && (
                <div className="form-group">
                  <label className="form-label">Identifiant</label>
                  <input
                    placeholder="Ton identifiant…"
                    value={form.username}
                    onChange={e => { setForm({ ...form, username: e.target.value }); setError(null) }}
                    autoFocus
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  className={error ? 'error' : ''}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoFocus={mode === 'prof'}
                />
              </div>

              {error && (
                <div className="alert alert-red" style={{ padding: '8px 12px', fontSize: 13 }}>
                  <Icon name="alert" size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}

              <button className="btn-primary btn-full" onClick={handleSubmit} style={{ marginTop: 4 }}>
                <Icon name="chevron-right" size={14} /> Se connecter
              </button>
            </div>

            {mode === 'prof' && (
              <p className="form-hint" style={{ marginTop: '1rem' }}>
                Mot de passe par défaut : <strong>prof2024</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../shared/Icon'

export default function LoginScreen() {
  const { loginProf, loginStudent, registerProfessor, authLoading } = useAuth()

  // null | 'prof' | 'student' | 'prof_login' | 'prof_register'
  const [mode,   setMode]   = useState(null)
  const [form,   setForm]   = useState({ name: '', username: '', password: '', confirm: '' })
  const [error,  setError]  = useState(null)
  const [saving, setSaving] = useState(false)

  if (authLoading) return (
    <div className="loading-screen"><div className="loading-spinner" /><p>Chargement…</p></div>
  )

  function go(m) { setMode(m); setForm({ name: '', username: '', password: '', confirm: '' }); setError(null) }

  async function handleLogin() {
    if (!form.username.trim() || !form.password) { setError('Remplis tous les champs.'); return }
    const ok = mode === 'prof_login'
      ? loginProf(form.username, form.password)
      : loginStudent(form.username, form.password)
    if (!ok) setError('Identifiant ou mot de passe incorrect.')
  }

  async function handleRegister() {
    if (!form.name.trim() || !form.username.trim() || !form.password) { setError('Tous les champs sont obligatoires.'); return }
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (form.password.length < 4) { setError('Mot de passe trop court (min. 4 caractères).'); return }
    setSaving(true)
    const err = await registerProfessor({ name: form.name, username: form.username, password: form.password })
    setSaving(false)
    if (err) setError(err.message)
  }

  // ── Styles ──────────────────────────────────────────────────────
  const logo = (
    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--maths-bg)', border: '1px solid var(--maths-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="book" size={22} style={{ color: 'var(--maths)' }} />
        </div>
        <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>EduSpace</span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Espace de travail prof / élève</div>
    </div>
  )

  const backBtn = (to) => (
    <button className="btn-ghost" style={{ marginBottom: '1.25rem', fontSize: 13, padding: '4px 8px' }} onClick={() => go(to)}>
      <Icon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} /> Retour
    </button>
  )

  const errorBox = error && (
    <div className="alert alert-red" style={{ padding: '8px 12px', fontSize: 13 }}>
      <Icon name="alert" size={14} style={{ flexShrink: 0 }} /> {error}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {logo}

        {/* ── Étape 1 : choisir son rôle ──────────────────────── */}
        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'prof',    label: 'Professeur', sub: 'Accès complet · gestion des élèves', icon: 'settings', color: 'maths' },
              { key: 'student', label: 'Élève',      sub: 'Accès à mon espace de travail',       icon: 'user',     color: 'infos' },
            ].map(({ key, label, sub, icon, color }) => (
              <button key={key} onClick={() => go(key)}
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

        {/* ── Étape 2 prof : se connecter OU créer un compte ────── */}
        {mode === 'prof' && (
          <div>
            {backBtn(null)}
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Professeur</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Vous avez déjà un compte ou vous souhaitez en créer un ?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => go('prof_login')}
                style={{ padding: '1.125rem 1.25rem', borderRadius: 'var(--r-lg)', background: 'var(--maths-bg)', border: '1px solid var(--maths-border)', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r)', background: 'rgba(123,156,244,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="unlock" size={17} style={{ color: 'var(--maths)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--maths)', marginBottom: 2 }}>J'ai déjà un compte</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Se connecter avec mon identifiant</div>
                </div>
                <Icon name="chevron-right" size={15} style={{ color: 'var(--maths)', opacity: 0.6 }} />
              </button>

              <button onClick={() => go('prof_register')}
                style={{ padding: '1.125rem 1.25rem', borderRadius: 'var(--r-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border-md)', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
              >
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r)', background: 'var(--bg-elevated)', border: '1px solid var(--border-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="plus" size={17} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Créer un compte</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Première fois sur EduSpace</div>
                </div>
                <Icon name="chevron-right" size={15} style={{ color: 'var(--text-hint)' }} />
              </button>
            </div>
          </div>
        )}

        {/* ── Formulaire connexion prof ou élève ────────────────── */}
        {(mode === 'prof_login' || mode === 'student') && (
          <div className="card" style={{ padding: '1.75rem' }}>
            {backBtn(mode === 'prof_login' ? 'prof' : null)}
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
              {errorBox}
              <button className="btn-primary btn-full" onClick={handleLogin} style={{ marginTop: 4 }}>
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* ── Formulaire création compte prof ───────────────────── */}
        {mode === 'prof_register' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            {backBtn('prof')}
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
                <input placeholder="Ex : martin (sans espaces)" value={form.username}
                  onChange={e => { setForm({ ...form, username: e.target.value }); setError(null) }} />
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
              {errorBox}
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

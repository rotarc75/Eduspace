import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './shared/Sidebar'
import Modal from './shared/Modal'
import ErrorBoundary from './shared/ErrorBoundary'
import LoginScreen    from './views/LoginScreen'
import ProfDashboard  from './views/ProfDashboard'
import Accueil        from './views/Accueil'
import MatiereView    from './views/MatiereView'
import Devoirs        from './views/Devoirs'
import Tickets        from './views/Tickets'
import Journal        from './views/Journal'
import Settings       from './views/Settings'

// ── Workspace (espace d'un élève) ────────────────────────────────
function Workspace({ isProf }) {
  const { tickets, devoirs, nextSession, loading, dbError } = useApp()
  const { studentName, backToDashboard, role, logout } = useAuth()

  const [tab,             setTab]             = useState('accueil')
  const [showAuth,        setShowAuth]        = useState(false)
  const [highlightDevoir, setHighlightDevoir] = useState(null)

  const openTickets    = (tickets ?? []).filter(t => t.statut === 'ouvert').length
  const pendingDevoirs = (devoirs ?? []).filter(
    d => !d.done && d.deadline && new Date(d.deadline) >= new Date(new Date().toDateString())
  ).length

  function gotoDevoir(id) {
    setHighlightDevoir(id)
    setTab('devoirs')
  }

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /><p>Chargement…</p></div>
  if (dbError)  return <div className="loading-screen"><p className="db-error">⚠️ {dbError}</p></div>

  function renderView() {
    const wrap = node => <ErrorBoundary key={tab}>{node}</ErrorBoundary>
    switch (tab) {
      case 'maths':    return wrap(<MatiereView matiere="maths" isProf={isProf} />)
      case 'infos':    return wrap(<MatiereView matiere="infos" isProf={isProf} />)
      case 'devoirs':  return wrap(<Devoirs isProf={isProf} highlightId={highlightDevoir} onHighlightDone={() => setHighlightDevoir(null)} />)
      case 'tickets':  return wrap(<Tickets isProf={isProf} />)
      case 'journal':  return wrap(<Journal isProf={isProf} onGotoDevoir={gotoDevoir} />)
      case 'settings': return isProf ? wrap(<Settings />) : null
      default:         return wrap(<Accueil setTab={setTab} isProf={isProf} />)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        tab={tab} setTab={setTab}
        isProf={isProf}
        studentName={studentName}
        openTickets={openTickets}
        pendingDevoirs={pendingDevoirs}
        nextSession={nextSession}
        onAuthRequest={() => setShowAuth(true)}
        onBackToDashboard={role === 'prof' ? backToDashboard : null}
        onLogout={logout}
      />
      <main className="main-content">{renderView()}</main>

      <Modal open={showAuth} onClose={() => setShowAuth(false)} title="Accès professeur" size="sm">
        <ProfLoginInline onClose={() => setShowAuth(false)} />
      </Modal>
    </div>
  )
}

function ProfLoginInline({ onClose }) {
  const { loginProf } = useAuth()
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState(false)
  function submit() {
    const ok = loginProf(pwd)
    if (ok) onClose()
    else setErr(true)
  }
  return (
    <div className="form-stack">
      <div className="form-group">
        <label className="form-label">Mot de passe professeur</label>
        <input type="password" placeholder="••••••••" value={pwd} className={err ? 'error' : ''}
          onChange={e => { setPwd(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
        {err && <span className="form-error">Mot de passe incorrect</span>}
      </div>
      <div className="btn-row">
        <button className="btn-primary btn-full" onClick={submit}>Connexion</button>
        <button onClick={onClose}>Annuler</button>
      </div>
      <p className="form-hint">Par défaut : <strong>prof2024</strong></p>
    </div>
  )
}

// ── Routeur principal ────────────────────────────────────────────
function AppRouter() {
  const { role, studentId, authLoading, dbError } = useAuth()

  if (authLoading) return <div className="loading-screen"><div className="loading-spinner" /><p>Chargement…</p></div>
  if (dbError)     return <div className="loading-screen"><p className="db-error">⚠️ {dbError}</p><p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Vérifie ton fichier <code>.env</code>.</p></div>

  // Pas connecté
  if (!role) return <LoginScreen />

  // Prof sans élève sélectionné → tableau de bord
  if (role === 'prof' && !studentId) return <ProfDashboard />

  // Prof dans l'espace d'un élève, ou élève connecté
  const isProf = role === 'prof'
  return (
    <ErrorBoundary>
      <AppProvider studentId={studentId}>
        <Workspace isProf={isProf} />
      </AppProvider>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  )
}

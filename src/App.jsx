import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './shared/Sidebar'
import Modal from './shared/Modal'
import ErrorBoundary from './shared/ErrorBoundary'
import Accueil     from './views/Accueil'
import MatiereView from './views/MatiereView'
import Devoirs     from './views/Devoirs'
import Tickets     from './views/Tickets'
import Journal     from './views/Journal'
import Settings    from './views/Settings'

function AppInner() {
  const { loading, dbError, profPwd, tickets, devoirs, nextSession } = useApp()

  const [role,          setRole]          = useState('eleve')
  const [tab,           setTab]           = useState('accueil')
  const [showAuth,      setShowAuth]      = useState(false)
  const [pwd,           setPwd]           = useState('')
  const [pwdErr,        setPwdErr]        = useState(false)
  const [highlightDevoir, setHighlightDevoir] = useState(null)

  const isProf         = role === 'prof'
  const openTickets    = (tickets ?? []).filter((t) => t.statut === 'ouvert').length
  const pendingDevoirs = (devoirs ?? []).filter(
    (d) => !d.done && d.deadline && new Date(d.deadline) >= new Date(new Date().toDateString())
  ).length

  function gotoDevoir(id) {
    setHighlightDevoir(id)
    setTab('devoirs')
  }

  function login() {
    if (pwd === profPwd) {
      setRole('prof'); setShowAuth(false); setPwd(''); setPwdErr(false)
    } else {
      setPwdErr(true)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Chargement…</p>
      </div>
    )
  }

  if (dbError) {
    return (
      <div className="loading-screen">
        <p className="db-error">⚠️ {dbError}</p>
        <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>
          Vérifie ton fichier <code>.env</code> et relance <code>npm run dev</code>.
        </p>
      </div>
    )
  }

  // Rendu conditionnel — un seul composant à la fois + ErrorBoundary individuel
  function renderView() {
    const wrap = (node) => <ErrorBoundary key={tab}>{node}</ErrorBoundary>
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
        tab={tab}
        setTab={setTab}
        isProf={isProf}
        openTickets={openTickets}
        pendingDevoirs={pendingDevoirs}
        nextSession={nextSession}
        onAuthRequest={() => setShowAuth(true)}
        onLogout={() => { setRole('eleve'); if (tab === 'settings') setTab('accueil') }}
      />

      <main className="main-content">
        {renderView()}
      </main>

      <Modal
        open={showAuth}
        onClose={() => { setShowAuth(false); setPwd(''); setPwdErr(false) }}
        title="Accès professeur"
        size="sm"
      >
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password" placeholder="••••••••" value={pwd}
              className={pwdErr ? 'error' : ''}
              onChange={(e) => { setPwd(e.target.value); setPwdErr(false) }}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              autoFocus
            />
            {pwdErr && <span className="form-error">Mot de passe incorrect</span>}
          </div>
          <div className="btn-row">
            <button className="btn-primary btn-full" onClick={login}>Connexion</button>
            <button onClick={() => { setShowAuth(false); setPwd(''); setPwdErr(false) }}>Annuler</button>
          </div>
          <p className="form-hint">Par défaut : <strong>prof2024</strong></p>
        </div>
      </Modal>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </ErrorBoundary>
  )
}

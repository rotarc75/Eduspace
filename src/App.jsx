import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './shared/Sidebar'
import Modal from './shared/Modal'
import ErrorBoundary from './shared/ErrorBoundary'
import Icon from './shared/Icon'
import LoginScreen   from './views/LoginScreen'
import ProfDashboard from './views/ProfDashboard'
import Accueil       from './views/Accueil'
import MatiereView   from './views/MatiereView'
import Devoirs       from './views/Devoirs'
import Tickets       from './views/Tickets'
import Journal       from './views/Journal'
import Settings      from './views/Settings'

const COLORS = ['blue', 'green', 'purple', 'amber', 'red']
const COLOR_LABELS = { blue: 'Bleu', green: 'Vert', purple: 'Violet', amber: 'Orange', red: 'Rouge' }
const SUBJECT_COLOR_MAP = {
  blue:   '#7B9CF4', green: '#5BC8A0', purple: '#B08CF4', amber: '#F4B860', red: '#F47B7B',
}

function AddSubjectModal({ open, onClose }) {
  const { addSubject } = useApp()
  const [name,   setName]   = useState('')
  const [color,  setColor]  = useState('blue')
  const [saving, setSaving] = useState(false)
  async function handleAdd() {
    if (!name.trim() || saving) return
    setSaving(true)
    await addSubject({ name: name.trim(), color })
    setSaving(false)
    setName(''); setColor('blue')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Nouvelle matière" size="sm">
      <div className="form-stack">
        <div className="form-group">
          <label className="form-label">Nom de la matière *</label>
          <input placeholder="Ex : Physique, Anglais, Histoire…" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Couleur</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button key={c} type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: `3px solid ${color === c ? SUBJECT_COLOR_MAP[c] : 'transparent'}`,
                  background: SUBJECT_COLOR_MAP[c], padding: 0, opacity: color === c ? 1 : 0.45,
                  transition: 'opacity 0.15s, border-color 0.15s',
                }}
                title={COLOR_LABELS[c]}
              />
            ))}
          </div>
        </div>
        <button className="btn-primary btn-full" onClick={handleAdd} disabled={!name.trim() || saving}>
          <Icon name="plus" size={14} /> {saving ? 'Création…' : 'Créer la matière'}
        </button>
      </div>
    </Modal>
  )
}

function Workspace({ isProf }) {
  const { tickets, devoirs, subjects, nextSession, loading, dbError, deleteSubject } = useApp()
  const { studentName, backToDashboard, logout } = useAuth()

  const [tab,             setTab]             = useState('accueil')
  const [showAddSubject,  setShowAddSubject]  = useState(false)
  const [highlightDevoir, setHighlightDevoir] = useState(null)

  const openTickets    = (tickets ?? []).filter(t => t.statut === 'ouvert').length
  const pendingDevoirs = (devoirs ?? []).filter(
    d => !d.done && d.deadline && new Date(d.deadline) >= new Date(new Date().toDateString())
  ).length

  function gotoDevoir(id) { setHighlightDevoir(id); setTab('devoirs') }

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /><p>Chargement…</p></div>
  if (dbError)  return <div className="loading-screen"><p className="db-error">⚠️ {dbError}</p></div>

  // Trouver la matière active si tab = subject_xxx
  const activeSubject = tab.startsWith('subject_')
    ? (subjects ?? []).find(s => s.id === tab.replace('subject_', ''))
    : null

  function renderView() {
    const wrap = (node, key) => <ErrorBoundary key={key ?? tab}>{node}</ErrorBoundary>
    if (activeSubject) return wrap(<MatiereView subject={activeSubject} isProf={isProf} />, activeSubject.id)
    switch (tab) {
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
        subjects={subjects}
        openTickets={openTickets}
        pendingDevoirs={pendingDevoirs}
        nextSession={nextSession}
        onAddSubject={() => setShowAddSubject(true)}
        onBackToDashboard={backToDashboard}
        onLogout={logout}
      />
      <main className="main-content">{renderView()}</main>
      <AddSubjectModal open={showAddSubject} onClose={() => setShowAddSubject(false)} />
    </div>
  )
}

function AppRouter() {
  const { role, studentId, authLoading, dbError } = useAuth()
  if (authLoading) return <div className="loading-screen"><div className="loading-spinner" /><p>Chargement…</p></div>
  if (dbError)     return <div className="loading-screen"><p className="db-error">⚠️ {dbError}</p></div>
  if (!role)       return <LoginScreen />
  if (role === 'prof' && !studentId) return <ProfDashboard />
  return (
    <ErrorBoundary>
      <AppProvider studentId={studentId}>
        <Workspace isProf={role === 'prof'} />
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

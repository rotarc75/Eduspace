import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Icon from '../shared/Icon'
import ResourceCard from '../shared/ResourceCard'
import Modal from '../shared/Modal'

const fmtLong  = (d) => new Date(d).toLocaleDateString('fr-FR', { dateStyle: 'long' })
const fmtShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Accueil({ setTab, isProf }) {
  const { resources, tickets, journal, devoirs, nextSession, saveNextSession } = useApp()

  const [showSetSession, setShowSetSession] = useState(false)
  const [sessionInput,   setSessionInput]   = useState('')
  const [savingSession,  setSavingSession]  = useState(false)

  const openTickets = tickets.filter((t) => t.statut === 'ouvert').length
  const overdue     = resources.filter(
    (r) => r.deadline && new Date(r.deadline) < new Date() && r.type === 'exercice'
  )
  const pendingDevoirs = devoirs.filter((d) => !d.done).slice(0, 3)
  const latestEntry    = [...journal].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  const isEmpty        = !resources.length && !tickets.length && !journal.length

  const daysLeft = daysUntil(nextSession)

  async function handleSaveSession() {
    setSavingSession(true)
    await saveNextSession(sessionInput)
    setSavingSession(false)
    setShowSetSession(false)
  }

  return (
    <div>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-subtitle">
        {isProf ? 'Mode professeur' : 'Mode élève'} · Maths &amp; Informatique
      </p>

      {/* Prochaine séance — bandeau */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          background: nextSession ? 'var(--maths-bg)' : 'var(--bg-elevated)',
          border: `1px solid ${nextSession ? 'var(--maths-border)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--r)',
            background: nextSession ? 'rgba(123,156,244,0.2)' : 'var(--bg-surface)',
            border: '1px solid var(--border-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="calendar" size={18} style={{ color: nextSession ? 'var(--maths)' : 'var(--text-hint)' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Prochaine séance
            </div>
            {nextSession ? (
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--maths)' }}>
                {fmtShort(nextSession)}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {daysLeft === 0 ? "Aujourd'hui !" : daysLeft === 1 ? 'Demain' : daysLeft > 0 ? `Dans ${daysLeft} jours` : `Passée (${Math.abs(daysLeft)}j)`}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Non planifiée</div>
            )}
          </div>
        </div>
        {isProf && (
          <button
            style={{ flexShrink: 0 }}
            onClick={() => { setSessionInput(nextSession || ''); setShowSetSession(true) }}
          >
            <Icon name="pen" size={13} /> {nextSession ? 'Modifier' : 'Planifier'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card" onClick={() => setTab('maths')}>
          <div className="stat-value" style={{ color: 'var(--maths)' }}>
            {resources.filter((r) => r.matiere === 'maths').length}
          </div>
          <div className="stat-label">Ressources Maths</div>
        </div>
        <div className="stat-card" onClick={() => setTab('infos')}>
          <div className="stat-value" style={{ color: 'var(--infos)' }}>
            {resources.filter((r) => r.matiere === 'infos').length}
          </div>
          <div className="stat-label">Ressources Infos</div>
        </div>
        <div className="stat-card" onClick={() => setTab('tickets')}>
          <div className="stat-value" style={{ color: openTickets > 0 ? 'var(--amber)' : undefined }}>
            {openTickets}
          </div>
          <div className="stat-label">Tickets ouverts</div>
        </div>
        <div className="stat-card" onClick={() => setTab('journal')}>
          <div className="stat-value">{journal.length}</div>
          <div className="stat-label">Séances</div>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="alert alert-amber" style={{ marginBottom: '1.25rem' }}>
          <Icon name="alert" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Exercice{overdue.length > 1 ? 's' : ''} en retard :</strong>{' '}
            {overdue.map((r) => r.titre).join(', ')}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Dernière séance */}
        {latestEntry && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2>Dernière séance</h2>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setTab('journal')}>
                Voir tout <Icon name="chevron-right" size={12} />
              </button>
            </div>
            <div className="card" style={{ height: 'calc(100% - 36px)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{fmtLong(latestEntry.date)}</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {latestEntry.resume}
              </div>
              {latestEntry.a_preparer && (
                <div className="todo-box" style={{ marginTop: 10 }}>
                  <div className="journal-section-label">À préparer</div>
                  <div className="journal-section-text" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {latestEntry.a_preparer}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Devoirs à faire */}
        {pendingDevoirs.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2>Devoirs à faire</h2>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setTab('devoirs')}>
                Voir tout <Icon name="chevron-right" size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pendingDevoirs.map((d) => {
                const days = daysUntil(d.deadline)
                const urgent = days != null && days <= 3
                return (
                  <div key={d.id} className="card" style={{ padding: '0.625rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: urgent ? 'var(--red)' : 'var(--border-md)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titre}</div>
                        <div style={{ fontSize: 11, color: urgent ? 'var(--red)' : 'var(--text-hint)' }}>
                          {days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : days > 0 ? `Dans ${days}j` : 'En retard'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <Icon name="book" size={40} />
          <h2 style={{ color: 'var(--text-muted)' }}>Bienvenue sur EduSpace !</h2>
          <p>L'espace est vide pour l'instant.</p>
          {!isProf && <p style={{ marginTop: 4 }}>Mot de passe prof par défaut : <strong>prof2024</strong></p>}
        </div>
      )}

      {/* Modal prochaine séance */}
      <Modal open={showSetSession} onClose={() => setShowSetSession(false)} title="Prochaine séance" size="sm">
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">Date de la prochaine séance</label>
            <input type="date" value={sessionInput} onChange={(e) => setSessionInput(e.target.value)} autoFocus />
          </div>
          <div className="btn-row">
            <button className="btn-primary btn-full" onClick={handleSaveSession} disabled={savingSession}>
              <Icon name="check" size={14} /> {savingSession ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {nextSession && (
              <button className="btn-danger" onClick={async () => { await saveNextSession(''); setShowSetSession(false) }}>
                Effacer
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

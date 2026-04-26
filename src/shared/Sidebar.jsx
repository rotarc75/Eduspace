import Icon from './Icon'

const NAV = [
  { id: 'accueil', label: 'Accueil',         icon: 'home',         group: 'main' },
  { id: 'maths',   label: 'Mathématiques',   icon: 'book',         group: 'matieres', accent: 'maths' },
  { id: 'infos',   label: 'Informatique',    icon: 'code',         group: 'matieres', accent: 'infos' },
  { id: 'devoirs', label: 'Devoirs',         icon: 'check-circle', group: 'suivi' },
  { id: 'tickets', label: 'Tickets',         icon: 'ticket',       group: 'suivi' },
  { id: 'journal', label: 'Journal de bord', icon: 'pen',          group: 'suivi' },
]

const fmtShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Sidebar({
  tab, setTab, isProf, studentName,
  openTickets, pendingDevoirs, nextSession,
  onAuthRequest, onBackToDashboard, onLogout
}) {
  const items = [
    ...NAV,
    ...(isProf ? [{ id: 'settings', label: 'Réglages', icon: 'settings', group: 'suivi' }] : []),
  ]
  const groups = [
    { key: 'main',     label: null       },
    { key: 'matieres', label: 'Matières' },
    { key: 'suivi',    label: 'Suivi'    },
  ]
  const days = daysUntil(nextSession)

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-brand-name"><span className="sb-logo-dot" />EduSpace</div>
        <div className="sb-role">
          <div className="sb-role-dot" style={{ background: isProf ? 'var(--green)' : 'var(--text-hint)' }} />
          {isProf ? 'Professeur' : 'Élève'}
        </div>
      </div>

      {/* Élève actuel (prof seulement) */}
      {isProf && studentName && (
        <div style={{
          margin: '0.5rem 0.75rem 0',
          background: 'var(--maths-bg)', border: '1px solid var(--maths-border)',
          borderRadius: 'var(--r)', padding: '8px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(123,156,244,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'var(--maths)',
          }}>
            {initials(studentName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {studentName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>Espace élève</div>
          </div>
        </div>
      )}

      {/* Prochaine séance */}
      {nextSession && (
        <div
          style={{
            margin: '0.5rem 0.75rem 0',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', padding: '7px 10px',
            cursor: 'pointer',
          }}
          onClick={() => setTab('accueil')}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>
            Prochaine séance
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--maths)' }}>
            {fmtShort(nextSession)}
            {days != null && (
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 5 }}>
                {days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : days > 0 ? `J-${days}` : 'Passée'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sb-nav">
        {groups.map(({ key, label }) => {
          const groupItems = items.filter(i => i.group === key)
          if (!groupItems.length) return null
          return (
            <div key={key}>
              {label && <div className="sb-section-label">{label}</div>}
              {groupItems.map(item => {
                const active = tab === item.id
                const cls = ['sb-btn', active ? 'active' : '', active && item.accent ? `active-${item.accent}` : ''].filter(Boolean).join(' ')
                return (
                  <button key={item.id} className={cls} onClick={() => setTab(item.id)}>
                    <span className="sb-btn-inner"><Icon name={item.icon} size={15} />{item.label}</span>
                    {item.id === 'tickets' && openTickets > 0 && <span className="sb-badge">{openTickets}</span>}
                    {item.id === 'devoirs' && pendingDevoirs > 0 && <span className="sb-badge">{pendingDevoirs}</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        {/* Retour tableau de bord (prof uniquement) */}
        {onBackToDashboard && (
          <button
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', fontSize: 12, marginBottom: 4 }}
            onClick={onBackToDashboard}
          >
            <Icon name="chevron-right" size={13} style={{ transform: 'rotate(180deg)' }} />
            Mes élèves
          </button>
        )}
        {/* Mode élève : bouton accès prof */}
        {!isProf && onAuthRequest && (
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 12 }} onClick={onAuthRequest}>
            <Icon name="unlock" size={13} /> Accès professeur
          </button>
        )}
        {/* Déconnexion */}
        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 12 }} onClick={onLogout}>
          <Icon name="log-out" size={13} /> Déconnexion
        </button>
      </div>
    </aside>
  )
}

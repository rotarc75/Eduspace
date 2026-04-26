import Icon from './Icon'

const TYPE = {
  cours:     { cls: 'badge-maths',   label: 'Cours'      },
  exercice:  { cls: 'badge-amber',   label: 'Exercice'   },
  ressource: { cls: 'badge-neutral', label: 'Ressource'  },
  rendu:     { cls: 'badge-green',   label: 'Rendu élève'},
}

const fmt = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default function ResourceCard({ r, isProf, onDelete }) {
  const matBadge = r.matiere === 'maths' ? 'badge-maths' : 'badge-infos'
  const matLabel = r.matiere === 'maths' ? 'Maths' : 'Infos'
  const type     = TYPE[r.type] ?? { cls: 'badge-neutral', label: r.type }

  const due       = r.deadline ? new Date(r.deadline) : null
  const isOverdue = due && due < new Date() && r.type === 'exercice'
  const isPdf     = r.file_name?.endsWith?.('.pdf') || (r.url && r.file_name)

  return (
    <div className="card resource-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="resource-meta">
            <span className={`badge ${matBadge}`}>{matLabel}</span>
            <span className={`badge ${type.cls}`}>{type.label}</span>
            {isPdf && <span className="badge badge-red"><Icon name="file-pdf" size={10} /> PDF</span>}
            {r.added_by === 'eleve' && <span className="badge badge-neutral">élève</span>}
            {r.chap && (
              <span className="badge badge-neutral">
                <Icon name="tag" size={10} /> {r.chap}
              </span>
            )}
          </div>

          <div className="resource-title">{r.titre}</div>
          {r.description && <div className="resource-desc">{r.description}</div>}

          {r.url && (
            <a className="resource-link" href={r.url} target="_blank" rel="noreferrer">
              {isPdf
                ? <><Icon name="file-pdf" size={12} /> {r.file_name ?? 'Ouvrir le PDF'}</>
                : <><Icon name="link" size={12} /> Ouvrir le fichier</>}
            </a>
          )}

          {due && (
            <div className={`resource-deadline${isOverdue ? ' overdue' : ''}`}>
              <Icon name="calendar" size={12} />
              {isOverdue ? 'En retard — ' : 'À rendre le '}
              {fmt(due)}
            </div>
          )}
        </div>

        {isProf && onDelete && (
          <button className="btn-icon" onClick={() => onDelete(r.id)} title="Supprimer">
            <Icon name="trash" size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

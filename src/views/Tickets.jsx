import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Icon from '../shared/Icon'
import Modal from '../shared/Modal'

const LABELS = [
  { value: 'question', label: 'Question',               cls: 'badge-maths' },
  { value: 'revision', label: 'À réviser',              cls: 'badge-amber' },
  { value: 'erreur',   label: 'Erreur de compréhension',cls: 'badge-red'   },
  { value: 'autre',    label: 'Autre',                  cls: 'badge-neutral'},
]
const labelInfo = (val) => LABELS.find((l) => l.value === val) ?? LABELS[3]
const fmt = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function TicketDetail({ ticket, isProf, onClose }) {
  const { toggleTicket, deleteTicket, addComment, ticketComments } = useApp()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const li = labelInfo(ticket.label)
  const cmts = ticketComments(ticket.id)

  async function submit() {
    if (!text.trim() || saving) return
    setSaving(true)
    await addComment(ticket.id, text.trim(), isProf ? 'Prof' : 'Élève')
    setSaving(false)
    setText('')
  }

  return (
    <Modal open onClose={onClose} title={ticket.titre} size="lg">
      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className={`badge ${ticket.statut === 'ouvert' ? 'badge-green' : 'badge-neutral'}`}>
          {ticket.statut === 'ouvert'
            ? <><Icon name="circle" size={10} /> Ouvert</>
            : <><Icon name="check" size={10} /> Fermé</>}
        </span>
        <span className={`badge ${li.cls}`}>{li.label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{fmt(ticket.created_at)}</span>
      </div>

      {/* Description */}
      {ticket.description && (
        <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--r)', padding: '0.875rem 1rem', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
          {ticket.description}
        </div>
      )}

      {/* Comments */}
      <h3 style={{ marginBottom: 10 }}>Commentaires ({cmts.length})</h3>
      {cmts.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 12 }}>Aucun commentaire.</p>
      )}
      {cmts.map((c) => (
        <div key={c.id} className="comment">
          <div className={`comment-avatar ${c.author === 'Prof' ? 'avatar-prof' : 'avatar-eleve'}`}>
            {c.author[0]}
          </div>
          <div className="comment-body">
            <div className="comment-meta">{c.author} · {fmt(c.created_at)}</div>
            <div className="comment-text">{c.text}</div>
          </div>
        </div>
      ))}

      {/* Add comment */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'flex-end' }}>
        <textarea
          placeholder={`Répondre en tant que ${isProf ? 'prof' : 'élève'}…`}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit())}
          style={{ resize: 'none', flex: 1 }}
        />
        <button className="btn-primary" onClick={submit} disabled={!text.trim() || saving} style={{ padding: '9px 12px', flexShrink: 0 }}>
          <Icon name="send" size={14} />
        </button>
      </div>

      <hr className="divider" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={{ flex: 1 }} onClick={() => toggleTicket(ticket.id)}>
          {ticket.statut === 'ouvert'
            ? <><Icon name="check-circle" size={14} /> Fermer le ticket</>
            : <><Icon name="circle" size={14} /> Rouvrir</>}
        </button>
        {isProf && (
          <button className="btn-danger" onClick={() => { deleteTicket(ticket.id); onClose() }}>
            <Icon name="trash" size={14} /> Supprimer
          </button>
        )}
      </div>
    </Modal>
  )
}

export default function Tickets({ isProf }) {
  const { tickets, addTicket } = useApp()
  const [filter,  setFilter]  = useState('ouvert')
  const [selId,   setSelId]   = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', label: 'question' })

  const selected = selId ? tickets.find((t) => t.id === selId) : null
  const visible  = tickets.filter((t) => filter === 'tous' || t.statut === filter)
  const counts   = {
    ouvert: tickets.filter((t) => t.statut === 'ouvert').length,
    fermé:  tickets.filter((t) => t.statut === 'fermé').length,
    tous:   tickets.length,
  }

  async function create() {
    if (!form.titre.trim() || saving) return
    setSaving(true)
    await addTicket({ titre: form.titre.trim(), description: form.description.trim() || null, label: form.label })
    setSaving(false)
    setForm({ titre: '', description: '', label: 'question' })
    setShowNew(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">Questions, révisions, points à retravailler</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Icon name="plus" size={14} /> Nouveau ticket
        </button>
      </div>

      {/* Filters */}
      <div className="ticket-filters">
        {['ouvert', 'fermé', 'tous'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="empty-state">
          <Icon name="ticket" size={32} />
          <p>Aucun ticket {filter !== 'tous' ? filter : ''}</p>
        </div>
      ) : (
        visible.map((t) => {
          const li = labelInfo(t.label)
          return (
            <div
              key={t.id}
              className="card card-hover ticket-card"
              onClick={() => setSelId(t.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ color: t.statut === 'ouvert' ? 'var(--green)' : 'var(--text-hint)', marginTop: 1, flexShrink: 0 }}>
                  {t.statut === 'ouvert'
                    ? <Icon name="circle" size={16} />
                    : <Icon name="check-circle" size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.titre}</div>
                  <div className="ticket-meta">
                    <span className={`badge ${li.cls}`}>{li.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{fmt(t.created_at)}</span>
                    {ticketComments && (
                      <CommentCount ticketId={t.id} />
                    )}
                  </div>
                </div>
                <Icon name="chevron-right" size={14} style={{ color: 'var(--text-hint)', flexShrink: 0, marginTop: 2 }} />
              </div>
            </div>
          )
        })
      )}

      {/* Detail modal */}
      {selected && (
        <TicketDetail
          ticket={selected}
          isProf={isProf}
          onClose={() => setSelId(null)}
        />
      )}

      {/* New ticket modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouveau ticket" size="md">
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">Titre *</label>
            <input
              placeholder="Ex : Je ne comprends pas les limites de fonctions"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Explique le problème en détail…"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Label</label>
            <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
              {LABELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <button className="btn-primary btn-full" onClick={create} disabled={!form.titre.trim() || saving}>
            {saving ? 'Création…' : 'Créer le ticket'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function CommentCount({ ticketId }) {
  const { ticketComments } = useApp()
  const n = ticketComments(ticketId).length
  if (!n) return null
  return (
    <span style={{ fontSize: 11, color: 'var(--text-hint)', display: 'flex', alignItems: 'center', gap: 3 }}>
      <Icon name="message" size={11} /> {n}
    </span>
  )
}

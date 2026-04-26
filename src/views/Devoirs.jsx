import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import Icon from '../shared/Icon'
import Modal from '../shared/Modal'

const fmt      = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const today    = () => new Date().toISOString().split('T')[0]

function daysLeft(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
}

function DeadlinePill({ deadline, done }) {
  if (done) return <span className="badge badge-green"><Icon name="check" size={10} /> Rendu</span>
  const d = daysLeft(deadline)
  if (d < 0)   return <span className="badge badge-red"><Icon name="alert" size={10} /> En retard ({Math.abs(d)}j)</span>
  if (d === 0) return <span className="badge badge-red">Aujourd'hui !</span>
  if (d <= 3)  return <span className="badge badge-amber"><Icon name="clock" size={10} /> Dans {d}j</span>
  return <span className="badge badge-neutral"><Icon name="calendar" size={10} /> {fmt(deadline)}</span>
}

export default function Devoirs({ isProf, highlightId, onHighlightDone }) {
  const { devoirs, journal, addDevoir, updateDevoir, toggleDevoir, deleteDevoir } = useApp()

  const [showNew,  setShowNew]  = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [filter,   setFilter]   = useState('todo')
  const highlightRef = useRef(null)

  // Quand on arrive avec un highlightId, montrer tous les devoirs et scroller dessus
  useEffect(() => {
    if (!highlightId) return
    setFilter('tous')
    // Scroller après le rendu
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Effacer le highlight après 2 secondes
      setTimeout(() => onHighlightDone?.(), 2000)
    }, 100)
    return () => clearTimeout(timer)
  }, [highlightId])

  const emptyForm = { titre: '', description: '', matiere: 'maths', deadline: today(), url: '', journal_id: '' }
  const [form, setForm] = useState(emptyForm)

  const editDevoir = editId ? devoirs.find((d) => d.id === editId) : null

  // Devoirs triés
  const sorted = [...devoirs].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return new Date(a.deadline) - new Date(b.deadline)
  })
  const visible = sorted.filter((d) => {
    if (filter === 'todo') return !d.done
    if (filter === 'done') return d.done
    return true
  })
  const counts = {
    todo: devoirs.filter((d) => !d.done).length,
    done: devoirs.filter((d) =>  d.done).length,
    tous: devoirs.length,
  }
  const urgent = devoirs.filter((d) => !d.done && daysLeft(d.deadline) <= 3)

  // Journal entries pour le select
  const journalSorted = [...journal].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)

  async function handleAdd() {
    if (!form.titre.trim() || !form.deadline || saving) return
    setSaving(true)
    await addDevoir({
      titre:       form.titre.trim(),
      description: form.description.trim() || null,
      matiere:     form.matiere,
      deadline:    form.deadline,
      url:         form.url.trim() || null,
      done:        false,
      journal_id:  form.journal_id || null,
    })
    setSaving(false)
    setForm(emptyForm)
    setShowNew(false)
  }

  async function handleEdit() {
    if (!form.titre.trim() || !form.deadline || saving) return
    setSaving(true)
    await updateDevoir(editId, {
      titre:       form.titre.trim(),
      description: form.description.trim() || null,
      matiere:     form.matiere,
      deadline:    form.deadline,
      url:         form.url.trim() || null,
      journal_id:  form.journal_id || null,
    })
    setSaving(false)
    setEditId(null)
  }

  function openEdit(d) {
    setForm({
      titre:       d.titre,
      description: d.description || '',
      matiere:     d.matiere,
      deadline:    d.deadline,
      url:         d.url || '',
      journal_id:  d.journal_id || '',
    })
    setEditId(d.id)
  }

  function linkedJournal(d) {
    if (!d.journal_id) return null
    return journal.find((j) => j.id === d.journal_id)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Devoirs</h1>
          <p className="page-subtitle">
            {counts.todo} à faire{counts.done > 0 ? ` · ${counts.done} rendu${counts.done !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        {isProf && (
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setShowNew(true) }}>
            <Icon name="plus" size={14} /> Nouveau devoir
          </button>
        )}
      </div>

      {/* Urgent */}
      {urgent.length > 0 && filter === 'todo' && (
        <div className="alert alert-amber" style={{ marginBottom: '1.25rem' }}>
          <Icon name="alert" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>{urgent.length} devoir{urgent.length > 1 ? 's urgents' : ' urgent'} :</strong>{' '}
            {urgent.map((d) => d.titre).join(', ')}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="ticket-filters">
        {[{ key: 'todo', label: 'À faire' }, { key: 'done', label: 'Rendus' }, { key: 'tous', label: 'Tous' }].map(({ key, label }) => (
          <button key={key} className={`filter-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="empty-state">
          <Icon name="check-circle" size={32} />
          <p>{filter === 'todo' ? 'Aucun devoir en cours 🎉' : 'Aucun devoir ici'}</p>
        </div>
      ) : (
        visible.map((d) => {
          const linked        = linkedJournal(d)
          const isHighlighted = d.id === highlightId
          return (
            <div
              key={d.id}
              ref={isHighlighted ? highlightRef : null}
              className="card"
              style={{
                marginBottom: 8, opacity: d.done ? 0.65 : 1,
                outline:    isHighlighted ? '2px solid var(--maths)' : 'none',
                boxShadow:  isHighlighted ? '0 0 0 4px var(--maths-bg)' : 'none',
                transition: 'outline 0.3s, box-shadow 0.3s',
              }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Checkbox */}
                <button
                  style={{
                    marginTop: 2, width: 22, height: 22, borderRadius: 6, border: `2px solid ${d.done ? 'var(--green)' : 'var(--border-md)'}`,
                    background: d.done ? 'var(--green-bg)' : 'transparent', color: d.done ? 'var(--green)' : 'transparent',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                  onClick={() => toggleDevoir(d.id)}
                  title={d.done ? 'Marquer non rendu' : 'Marquer rendu'}
                >
                  <Icon name="check" size={13} />
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 4 }}>
                    <span className={`badge ${d.matiere === 'maths' ? 'badge-maths' : 'badge-infos'}`}>
                      {d.matiere === 'maths' ? 'Maths' : 'Infos'}
                    </span>
                    <DeadlinePill deadline={d.deadline} done={d.done} />
                    {linked && (
                      <span className="badge badge-purple" style={{ gap: 3 }}>
                        <Icon name="pen" size={10} /> Séance {fmtShort(linked.date)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, textDecoration: d.done ? 'line-through' : 'none', color: d.done ? 'var(--text-muted)' : 'var(--text)' }}>
                    {d.titre}
                  </div>
                  {d.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{d.description}</div>}
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer"
                       style={{ fontSize: 12, color: 'var(--maths)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                      <Icon name="link" size={12} /> Ouvrir le fichier
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {isProf && (
                    <>
                      <button className="btn-icon" onClick={() => openEdit(d)} title="Modifier"><Icon name="pen" size={14} /></button>
                      <button className="btn-icon" onClick={() => deleteDevoir(d.id)} title="Supprimer"><Icon name="trash" size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* ── Modal form (add ou edit) ─────────────────────────────── */}
      {(showNew || !!editId) && (
        <Modal
          open
          onClose={() => { setShowNew(false); setEditId(null) }}
          title={editId ? 'Modifier le devoir' : 'Nouveau devoir'}
          size="md"
        >
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label">Titre *</label>
              <input placeholder="Ex : Exercices p.42 — dérivées" value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea placeholder="Consignes supplémentaires…" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Matière</label>
                <select value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })}>
                  <option value="maths">Mathématiques</option>
                  <option value="infos">Informatique</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date limite *</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Lien vers le fichier (optionnel)</label>
              <input placeholder="https://drive.google.com/…" value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>

            {/* Lien séance journal */}
            <div className="form-group">
              <label className="form-label"><Icon name="pen" size={10} /> Rattacher à une séance</label>
              <select value={form.journal_id} onChange={(e) => setForm({ ...form, journal_id: e.target.value })}>
                <option value="">— Sans lien —</option>
                {journalSorted.map((j) => (
                  <option key={j.id} value={j.id}>
                    {new Date(j.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })} — {j.resume?.slice(0, 40)}…
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>
                Permet de retrouver d'où vient le devoir depuis le journal
              </div>
            </div>

            <hr className="divider" />
            <button className="btn-primary btn-full"
              onClick={editId ? handleEdit : handleAdd}
              disabled={!form.titre.trim() || !form.deadline || saving}>
              <Icon name="check" size={14} />
              {saving ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Ajouter le devoir'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

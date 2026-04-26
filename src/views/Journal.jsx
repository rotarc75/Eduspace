import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Icon from '../shared/Icon'
import Modal from '../shared/Modal'

const fmtLong  = (d) => new Date(d).toLocaleDateString('fr-FR', { dateStyle: 'long' })
const fmtShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const today    = () => new Date().toISOString().split('T')[0]

const MOODS = [
  { emoji: '😴', label: 'Peu motivé' },
  { emoji: '😕', label: 'Difficile'  },
  { emoji: '😐', label: 'Correct'    },
  { emoji: '🙂', label: 'Bien'       },
  { emoji: '🚀', label: 'Excellent'  },
]
const NOTE_LABELS = ['', 'À retravailler', 'Passable', 'Correct', 'Bien', 'Excellent']

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-row">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          className={`star-btn ${n <= (hover || value) ? 'active' : ''}`}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n === value ? 0 : n)} title={NOTE_LABELS[n]}>⭐</button>
      ))}
      {value > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 4 }}>{NOTE_LABELS[value]}</span>}
    </div>
  )
}

function NotionTagInput({ tags, setTags }) {
  const [input, setInput] = useState('')
  function add() { const v = input.trim(); if (v && !tags.includes(v)) setTags([...tags, v]); setInput('') }
  return (
    <div>
      <div className="tag-input-row">
        <input placeholder="Ex : dérivées, limites, Python…" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} disabled={!input.trim()}><Icon name="plus" size={14} /></button>
      </div>
      {tags.length > 0 && (
        <div className="notion-tags">
          {tags.map(t => (
            <span key={t} className="notion-tag">{t}
              <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function JournalStats({ journal }) {
  if (journal.length < 2) return null
  const withNote = journal.filter(j => j.note > 0)
  const avg = withNote.length ? (withNote.reduce((s, j) => s + j.note, 0) / withNote.length).toFixed(1) : null
  const allNotions = journal.flatMap(j => j.notions || [])
  const freq = {}
  allNotions.forEach(n => { freq[n] = (freq[n] || 0) + 1 })
  const top = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 5)
  return (
    <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-elevated)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
        <Icon name="trending-up" size={14} style={{ color: 'var(--maths)' }} />
        <h3 style={{ fontSize: 13 }}>Vue d'ensemble · {journal.length} séance{journal.length > 1 ? 's' : ''}</h3>
      </div>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {avg && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Note moy.</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)', letterSpacing: '-1px' }}>
              {avg}<span style={{ fontSize: 12, color: 'var(--text-hint)', fontWeight: 400 }}>/5</span>
            </div>
          </div>
        )}
        {top.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Notions vues</div>
            <div className="notion-tags">
              {top.map(([n, c]) => (
                <span key={n} className="notion-tag" style={{ fontSize: 11 }}>{n} <span style={{ opacity: 0.6 }}>×{c}</span></span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateDevoirModal({ entry, onClose }) {
  const { addDevoir } = useApp()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titre: entry.a_preparer?.slice(0, 80) || '', description: '',
    matiere: 'maths', deadline: '', url: '',
  })
  async function handleCreate() {
    if (!form.titre.trim() || !form.deadline || saving) return
    setSaving(true)
    await addDevoir({
      titre: form.titre.trim(), description: form.description.trim() || null,
      matiere: form.matiere, deadline: form.deadline,
      url: form.url.trim() || null, done: false, journal_id: entry.id,
    })
    setSaving(false)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Créer un devoir depuis cette séance" size="md">
      <div style={{ padding: '0 0 0.75rem', marginBottom: '0.875rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 4 }}>Séance du {fmtLong(entry.date)}</div>
        {entry.a_preparer && (
          <div className="todo-box" style={{ fontSize: 13 }}>
            <div className="journal-section-label">À préparer</div>
            <div className="journal-section-text" style={{ fontSize: 13 }}>{entry.a_preparer}</div>
          </div>
        )}
      </div>
      <div className="form-stack">
        <div className="form-group">
          <label className="form-label">Titre du devoir *</label>
          <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea placeholder="Précisions…" rows={2} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Matière</label>
            <select value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })}>
              <option value="maths">Mathématiques</option>
              <option value="infos">Informatique</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date limite *</label>
            <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Lien fichier</label>
          <input placeholder="https://…" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        </div>
        <button className="btn-primary btn-full" onClick={handleCreate} disabled={!form.titre.trim() || !form.deadline || saving}>
          <Icon name="plus" size={14} /> {saving ? 'Création…' : 'Créer le devoir'}
        </button>
      </div>
    </Modal>
  )
}

// ── Formulaire séance (création OU édition) ───────────────────────
function SeanceForm({ initial, initialNotions, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial)
  const [notions, setNotions] = useState(initialNotions)

  return (
    <div className="form-stack">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date de la séance</label>
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label"><Icon name="clock" size={10} /> Durée (heures)</label>
          <input type="number" placeholder="Ex : 1.5" min="0.5" max="8" step="0.5"
            value={form.duree} onChange={e => setForm({ ...form, duree: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Résumé de la séance *</label>
        <textarea placeholder="Ce qu'on a vu, les difficultés rencontrées…" rows={4}
          value={form.resume} onChange={e => setForm({ ...form, resume: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Notions abordées</label>
        <NotionTagInput tags={notions} setTags={setNotions} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label"><Icon name="smile" size={10} /> Humeur de l'élève</label>
          <div className="mood-row">
            {MOODS.map((m, i) => (
              <button key={i} type="button" className={`mood-btn${form.mood === i ? ' active' : ''}`}
                title={m.label} onClick={() => setForm({ ...form, mood: form.mood === i ? -1 : i })}>
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label"><Icon name="star" size={10} /> Note de la séance</label>
          <StarRating value={form.note} onChange={n => setForm({ ...form, note: n })} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">À préparer pour la prochaine fois</label>
        <textarea placeholder="Exercices à faire, chapitres à relire…" rows={2}
          value={form.a_preparer} onChange={e => setForm({ ...form, a_preparer: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label"><Icon name="target" size={10} /> Objectifs de la prochaine séance</label>
        <textarea placeholder="Ce qu'on veut atteindre…" rows={2}
          value={form.objectifs} onChange={e => setForm({ ...form, objectifs: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label"><Icon name="lock" size={10} /> Notes personnelles (visibles uniquement par toi)</label>
        <textarea placeholder="Observations, points d'attention…" rows={2}
          value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      <hr className="divider" />
      <button className="btn-primary btn-full" onClick={() => onSave(form, notions)}
        disabled={!form.resume.trim() || saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer la séance'}
      </button>
    </div>
  )
}

const EMPTY_FORM = { date: today(), resume: '', a_preparer: '', objectifs: '', notes: '', note: 0, mood: -1, duree: '' }

export default function Journal({ isProf, onGotoDevoir }) {
  const { journal, devoirs, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useApp()

  const [showNew,     setShowNew]     = useState(false)
  const [editEntry,   setEditEntry]   = useState(null)   // entry en cours d'édition
  const [expanded,    setExpanded]    = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [devoirEntry, setDevoirEntry] = useState(null)

  const sorted = [...journal].sort((a, b) => new Date(b.date) - new Date(a.date))

  async function handleCreate(form, notions) {
    if (saving) return
    setSaving(true)
    await addJournalEntry({
      date: form.date, resume: form.resume.trim(),
      a_preparer: form.a_preparer.trim() || null,
      objectifs:  form.objectifs.trim() || null,
      notes:      form.notes.trim() || null,
      note:       form.note || null,
      mood:       form.mood >= 0 ? form.mood : null,
      duree:      form.duree || null,
      notions:    notions.length > 0 ? notions : null,
    })
    setSaving(false)
    setShowNew(false)
  }

  async function handleUpdate(form, notions) {
    if (!editEntry || saving) return
    setSaving(true)
    await updateJournalEntry(editEntry.id, {
      date: form.date, resume: form.resume.trim(),
      a_preparer: form.a_preparer.trim() || null,
      objectifs:  form.objectifs.trim() || null,
      notes:      form.notes.trim() || null,
      note:       form.note || null,
      mood:       form.mood >= 0 ? form.mood : null,
      duree:      form.duree || null,
      notions:    notions.length > 0 ? notions : null,
    })
    setSaving(false)
    setEditEntry(null)
  }

  function openEdit(entry) {
    setEditEntry(entry)
  }

  function linkedDevoirs(entryId) {
    return (devoirs ?? []).filter((d) => d.journal_id === entryId)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Journal de bord</h1>
          <p className="page-subtitle">Suivi séance par séance</p>
        </div>
        {isProf && (
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={14} /> Nouvelle séance
          </button>
        )}
      </div>

      <JournalStats journal={journal} />

      {sorted.length === 0 && (
        <div className="empty-state">
          <Icon name="pen" size={32} />
          <p>Aucune séance enregistrée</p>
          {isProf && <p>Clique sur "Nouvelle séance" après chaque cours</p>}
        </div>
      )}

      {/* Timeline */}
      <div className="journal-timeline">
        {sorted.map((entry, i) => {
          const linked = linkedDevoirs(entry.id)
          return (
            <div key={entry.id} className="journal-entry">
              <div className={`journal-dot${i === 0 ? ' latest' : ''}`} />
              <div className="card" style={{ overflow: 'hidden' }}>

                {/* Header cliquable */}
                <div className="journal-header" onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span className="journal-date">{fmtLong(entry.date)}</span>
                      {i === 0 && <span className="badge badge-green">Dernière</span>}
                      {entry.mood != null && <span title={MOODS[entry.mood]?.label} style={{ fontSize: 16 }}>{MOODS[entry.mood]?.emoji}</span>}
                      {entry.note > 0 && <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>{'⭐'.repeat(entry.note)}</span>}
                      {entry.duree && <span className="badge badge-neutral"><Icon name="clock" size={10} /> {entry.duree}h</span>}
                      {linked.length > 0 && (
                        <span className="badge badge-purple"><Icon name="check-circle" size={10} /> {linked.length} devoir{linked.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="journal-preview">{entry.resume}</div>
                    {entry.notions?.length > 0 && (
                      <div className="notion-tags" style={{ marginTop: 5 }}>
                        {entry.notions.map(n => <span key={n} className="notion-tag">{n}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {/* Bouton éditer (prof, visible toujours) */}
                    {isProf && (
                      <button
                        className="btn-icon"
                        onClick={(e) => { e.stopPropagation(); openEdit(entry) }}
                        title="Modifier cette séance"
                        style={{ padding: 5 }}
                      >
                        <Icon name="pen" size={14} />
                      </button>
                    )}
                    <Icon name={expanded === entry.id ? 'chevron-up' : 'chevron-down'} size={16} style={{ color: 'var(--text-hint)' }} />
                  </div>
                </div>

                {/* Contenu développé */}
                {expanded === entry.id && (
                  <div className="journal-body">

                    {/* Résumé */}
                    <div>
                      <div className="journal-section-label"><Icon name="pen" size={10} /> Résumé</div>
                      <div className="journal-section-text">{entry.resume}</div>
                    </div>

                    {/* À préparer + créer devoir */}
                    {entry.a_preparer && (
                      <div>
                        <div className="todo-box">
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div className="journal-section-label"><Icon name="check" size={10} /> À préparer pour la prochaine fois</div>
                              <div className="journal-section-text">{entry.a_preparer}</div>
                            </div>
                            {isProf && (
                              <button
                                style={{ flexShrink: 0, fontSize: 11, padding: '4px 8px', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', color: 'var(--amber)', borderRadius: 'var(--r-sm)' }}
                                onClick={() => setDevoirEntry(entry)}
                              >
                                <Icon name="plus" size={11} /> Créer un devoir
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Devoirs liés — cliquables */}
                        {linked.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {linked.map((d) => (
                              <button
                                key={d.id}
                                onClick={() => onGotoDevoir && onGotoDevoir(d.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '7px 10px', background: 'var(--bg-elevated)',
                                  borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
                                  textAlign: 'left', cursor: 'pointer', width: '100%',
                                  transition: 'border-color 0.12s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--maths)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                              >
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.done ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }} />
                                <span style={{ fontSize: 13, flex: 1, textDecoration: d.done ? 'line-through' : 'none', color: d.done ? 'var(--text-muted)' : 'var(--text)' }}>
                                  {d.titre}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{fmtShort(d.deadline)}</span>
                                {d.done
                                  ? <Icon name="check" size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
                                  : <Icon name="chevron-right" size={12} style={{ color: 'var(--text-hint)', flexShrink: 0 }} />
                                }
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Devoirs liés sans a_preparer */}
                    {!entry.a_preparer && linked.length > 0 && (
                      <div>
                        <div className="journal-section-label"><Icon name="check-circle" size={10} /> Devoirs liés</div>
                        {linked.map((d) => (
                          <button key={d.id}
                            onClick={() => onGotoDevoir && onGotoDevoir(d.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '7px 10px', background: 'var(--bg-elevated)',
                              borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
                              textAlign: 'left', width: '100%', marginBottom: 5, cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--maths)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.done ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }} />
                            <span style={{ fontSize: 13, flex: 1, textDecoration: d.done ? 'line-through' : 'none' }}>{d.titre}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>{fmtShort(d.deadline)}</span>
                            <Icon name="chevron-right" size={12} style={{ color: 'var(--text-hint)', flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Objectifs */}
                    {entry.objectifs && (
                      <div>
                        <div className="journal-section-label"><Icon name="target" size={10} /> Objectifs prochaine séance</div>
                        <div className="journal-section-text">{entry.objectifs}</div>
                      </div>
                    )}

                    {/* Notes prof */}
                    {entry.notes && isProf && (
                      <div className="notes-box">
                        <div className="journal-section-label"><Icon name="lock" size={10} /> Notes personnelles</div>
                        <div className="journal-section-text">{entry.notes}</div>
                      </div>
                    )}

                    {/* Actions bas */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {isProf && !entry.a_preparer && (
                        <button style={{ fontSize: 12 }} onClick={() => setDevoirEntry(entry)}>
                          <Icon name="plus" size={13} /> Créer un devoir lié
                        </button>
                      )}
                      {isProf && (
                        <button className="btn-danger" style={{ fontSize: 12 }} onClick={() => deleteJournalEntry(entry.id)}>
                          <Icon name="trash" size={13} /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal — Nouvelle séance */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouvelle séance" size="lg">
        <SeanceForm
          initial={EMPTY_FORM}
          initialNotions={[]}
          onSave={handleCreate}
          onClose={() => setShowNew(false)}
          saving={saving}
        />
      </Modal>

      {/* Modal — Modifier une séance */}
      {editEntry && (
        <Modal
          open
          onClose={() => setEditEntry(null)}
          title={`Modifier — ${fmtLong(editEntry.date)}`}
          size="lg"
        >
          <SeanceForm
            initial={{
              date:       editEntry.date       ?? today(),
              resume:     editEntry.resume      ?? '',
              a_preparer: editEntry.a_preparer  ?? '',
              objectifs:  editEntry.objectifs   ?? '',
              notes:      editEntry.notes       ?? '',
              note:       editEntry.note        ?? 0,
              mood:       editEntry.mood        ?? -1,
              duree:      editEntry.duree       ?? '',
            }}
            initialNotions={editEntry.notions ?? []}
            onSave={handleUpdate}
            onClose={() => setEditEntry(null)}
            saving={saving}
          />
        </Modal>
      )}

      {/* Modal — Créer devoir depuis séance */}
      {devoirEntry && (
        <CreateDevoirModal entry={devoirEntry} onClose={() => setDevoirEntry(null)} />
      )}
    </div>
  )
}

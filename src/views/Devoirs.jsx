import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import Icon from '../shared/Icon'
import Modal from '../shared/Modal'
import FileUpload from '../shared/FileUpload'

const fmt      = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const today    = () => new Date().toISOString().split('T')[0]

function daysLeft(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
}

function DeadlinePill({ deadline, done, submitted }) {
  if (submitted) return <span className="badge badge-green"><Icon name="check" size={10} /> Rendu</span>
  if (done && !submitted) return <span className="badge badge-green"><Icon name="check" size={10} /> Fait</span>
  const d = daysLeft(deadline)
  if (d < 0)   return <span className="badge badge-red"><Icon name="alert" size={10} /> En retard ({Math.abs(d)}j)</span>
  if (d === 0) return <span className="badge badge-red">Aujourd'hui !</span>
  if (d <= 3)  return <span className="badge badge-amber"><Icon name="clock" size={10} /> Dans {d}j</span>
  return <span className="badge badge-neutral"><Icon name="calendar" size={10} /> {fmt(deadline)}</span>
}

export default function Devoirs({ isProf, highlightId, onHighlightDone }) {
  const { devoirs, subjects, journal, addDevoir, updateDevoir, toggleDevoir, deleteDevoir, submitDevoir } = useApp()

  const [showNew,    setShowNew]    = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [submitId,   setSubmitId]   = useState(null)  // devoir en cours de soumission élève
  const [saving,     setSaving]     = useState(false)
  const [filter,     setFilter]     = useState('todo')
  const [uploadFile, setUploadFile] = useState(null)
  const highlightRef = useRef(null)

  useEffect(() => {
    if (!highlightId) return
    setFilter('tous')
    const t = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => onHighlightDone?.(), 2000)
    }, 100)
    return () => clearTimeout(t)
  }, [highlightId])

  const emptyForm = { titre: '', description: '', subject_id: '', deadline: today(), url: '', journal_id: '' }
  const [form, setForm] = useState(emptyForm)

  const editDevoir  = editId  ? devoirs.find(d => d.id === editId)  : null
  const submitDevoir_ = submitId ? devoirs.find(d => d.id === submitId) : null

  const sorted = [...devoirs].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return new Date(a.deadline) - new Date(b.deadline)
  })
  const visible = sorted.filter(d => {
    if (filter === 'todo') return !d.done
    if (filter === 'done') return d.done
    return true
  })
  const counts = {
    todo: devoirs.filter(d => !d.done).length,
    done: devoirs.filter(d =>  d.done).length,
    tous: devoirs.length,
  }
  const urgent = devoirs.filter(d => !d.done && daysLeft(d.deadline) <= 3)
  const journalSorted = [...journal].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)

  async function handleAdd() {
    if (!form.titre.trim() || !form.deadline || saving) return
    setSaving(true)
    await addDevoir({
      titre:       form.titre.trim(),
      description: form.description.trim() || null,
      subject_id:  form.subject_id || null,
      deadline:    form.deadline,
      url:         form.url.trim() || null,
      done:        false,
      journal_id:  form.journal_id || null,
    })
    setSaving(false); setForm(emptyForm); setShowNew(false)
  }

  async function handleEdit() {
    if (!form.titre.trim() || !form.deadline || saving) return
    setSaving(true)
    await updateDevoir(editId, {
      titre:       form.titre.trim(),
      description: form.description.trim() || null,
      subject_id:  form.subject_id || null,
      deadline:    form.deadline,
      url:         form.url.trim() || null,
      journal_id:  form.journal_id || null,
    })
    setSaving(false); setEditId(null)
  }

  async function handleSubmit() {
    if (!uploadFile || saving) return
    setSaving(true)
    await submitDevoir(submitId, { url: uploadFile.url, name: uploadFile.name })
    setSaving(false); setSubmitId(null); setUploadFile(null)
  }

  function openEdit(d) {
    setForm({ titre: d.titre, description: d.description || '', subject_id: d.subject_id || '', deadline: d.deadline, url: d.url || '', journal_id: d.journal_id || '' })
    setEditId(d.id)
  }

  function linkedJournal(d) {
    if (!d.journal_id) return null
    return journal.find(j => j.id === d.journal_id)
  }

  function subjectLabel(d) {
    if (!d.subject_id) return null
    return (subjects ?? []).find(s => s.id === d.subject_id)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Devoirs</h1>
          <p className="page-subtitle">{counts.todo} à faire{counts.done > 0 ? ` · ${counts.done} rendu${counts.done !== 1 ? 's' : ''}` : ''}</p>
        </div>
        {isProf && (
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setShowNew(true) }}>
            <Icon name="plus" size={14} /> Nouveau devoir
          </button>
        )}
      </div>

      {urgent.length > 0 && filter === 'todo' && (
        <div className="alert alert-amber" style={{ marginBottom: '1.25rem' }}>
          <Icon name="alert" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div><strong>{urgent.length} devoir{urgent.length > 1 ? 's urgents' : ' urgent'} :</strong> {urgent.map(d => d.titre).join(', ')}</div>
        </div>
      )}

      <div className="ticket-filters">
        {[{ key: 'todo', label: 'À faire' }, { key: 'done', label: 'Rendus' }, { key: 'tous', label: 'Tous' }].map(({ key, label }) => (
          <button key={key} className={`filter-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state"><Icon name="check-circle" size={32} /><p>{filter === 'todo' ? 'Aucun devoir en cours 🎉' : 'Aucun devoir ici'}</p></div>
      ) : visible.map(d => {
        const isHighlighted = d.id === highlightId
        const linked        = linkedJournal(d)
        const subj          = subjectLabel(d)
        const hasSubmission = !!d.submission_url
        return (
          <div key={d.id}
            ref={isHighlighted ? highlightRef : null}
            className="card"
            style={{ marginBottom: 8, opacity: d.done ? 0.7 : 1, outline: isHighlighted ? '2px solid var(--maths)' : 'none', boxShadow: isHighlighted ? '0 0 0 4px var(--maths-bg)' : 'none', transition: 'outline 0.3s, box-shadow 0.3s' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {/* Checkbox */}
              <button
                style={{ marginTop: 2, width: 22, height: 22, borderRadius: 6, border: `2px solid ${d.done ? 'var(--green)' : 'var(--border-md)'}`, background: d.done ? 'var(--green-bg)' : 'transparent', color: d.done ? 'var(--green)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                onClick={() => toggleDevoir(d.id)} title={d.done ? 'Marquer non rendu' : 'Marquer fait'}
              >
                <Icon name="check" size={13} />
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 4 }}>
                  {subj && <span className="badge" style={{ background: `rgba(${subj.color === 'blue' ? '123,156,244' : subj.color === 'green' ? '91,200,160' : subj.color === 'purple' ? '176,140,244' : subj.color === 'amber' ? '244,184,96' : '244,123,123'},0.15)`, color: `var(--${subj.color === 'amber' ? 'amber' : subj.color === 'red' ? 'red' : subj.color === 'green' ? 'infos' : subj.color === 'purple' ? 'purple' : 'maths'})`, border: 'none' }}>{subj.name}</span>}
                  <DeadlinePill deadline={d.deadline} done={d.done} submitted={hasSubmission} />
                  {linked && <span className="badge badge-purple"><Icon name="pen" size={10} /> {fmtShort(linked.date)}</span>}
                  {hasSubmission && <span className="badge badge-green"><Icon name="file-pdf" size={10} /> PDF rendu</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, textDecoration: d.done && !hasSubmission ? 'line-through' : 'none', color: d.done ? 'var(--text-muted)' : 'var(--text)' }}>{d.titre}</div>
                {d.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{d.description}</div>}
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--maths)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                    <Icon name="link" size={12} /> Fichier du devoir
                  </a>
                )}
                {/* Soumission élève */}
                {hasSubmission && (
                  <a href={d.submission_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--green)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, marginLeft: d.url ? 12 : 0 }}>
                    <Icon name="file-pdf" size={12} /> {d.submission_name ?? 'Voir le rendu'}
                  </a>
                )}
                {/* Bouton rendre pour l'élève */}
                {!isProf && !hasSubmission && (
                  <button
                    style={{ marginTop: 8, fontSize: 12, background: 'var(--infos-bg)', borderColor: 'var(--infos-border)', color: 'var(--infos)' }}
                    onClick={() => { setSubmitId(d.id); setUploadFile(null) }}
                  >
                    <Icon name="upload" size={12} /> Rendre mon travail (PDF)
                  </button>
                )}
              </div>

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
      })}

      {/* ── Modal add/edit ────────────────────────────────────────── */}
      {(showNew || !!editId) && (
        <Modal open onClose={() => { setShowNew(false); setEditId(null) }}
          title={editId ? 'Modifier le devoir' : 'Nouveau devoir'} size="md">
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label">Titre *</label>
              <input placeholder="Ex : Exercices p.42" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea placeholder="Consignes…" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Matière</label>
                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">— Aucune —</option>
                  {(subjects ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date limite *</label>
                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Lien fichier (optionnel)</label>
              <input placeholder="https://…" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label"><Icon name="pen" size={10} /> Rattacher à une séance</label>
              <select value={form.journal_id} onChange={e => setForm({ ...form, journal_id: e.target.value })}>
                <option value="">— Sans lien —</option>
                {journalSorted.map(j => (
                  <option key={j.id} value={j.id}>{new Date(j.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })} — {j.resume?.slice(0, 40)}…</option>
                ))}
              </select>
            </div>
            <hr className="divider" />
            <button className="btn-primary btn-full" onClick={editId ? handleEdit : handleAdd}
              disabled={!form.titre.trim() || !form.deadline || saving}>
              <Icon name="check" size={14} />{saving ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Ajouter le devoir'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal soumission élève ────────────────────────────────── */}
      {submitId && submitDevoir_ && (
        <Modal open onClose={() => { setSubmitId(null); setUploadFile(null) }}
          title="Rendre mon travail" size="md">
          <div className="form-stack">
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Devoir</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{submitDevoir_.titre}</div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>À rendre le {fmt(submitDevoir_.deadline)}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Ton travail (PDF)</label>
              <FileUpload value={uploadFile} onChange={setUploadFile} disabled={saving} />
            </div>
            <button className="btn-primary btn-full" onClick={handleSubmit} disabled={!uploadFile || saving}>
              <Icon name="send" size={14} />{saving ? 'Envoi…' : 'Envoyer mon travail'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

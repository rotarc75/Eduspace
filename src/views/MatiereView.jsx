import { useState } from 'react'
import { useApp, SUBJECT_COLORS } from '../context/AppContext'
import Icon from '../shared/Icon'
import Modal from '../shared/Modal'
import ResourceCard from '../shared/ResourceCard'
import FileUpload from '../shared/FileUpload'

export default function MatiereView({ subject, isProf }) {
  const { resources, chapters, addResource, deleteResource, addChapter, deleteChapter, deleteSubject } = useApp()

  const color   = SUBJECT_COLORS[subject.color] ?? SUBJECT_COLORS.blue
  const myResources = (resources ?? []).filter(r => r.subject_id === subject.id)
  const myChapters  = (chapters  ?? []).filter(c => c.subject_id === subject.id)

  const [selChap,      setSelChap]      = useState(null)
  const [showAddRes,   setShowAddRes]   = useState(false)
  const [showAddChap,  setShowAddChap]  = useState(false)
  const [showDelConf,  setShowDelConf]  = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [sourceMode,   setSourceMode]   = useState('pdf')
  const [uploadedFile, setUploadedFile] = useState(null)

  const [resForm, setResForm] = useState({ titre: '', description: '', url: '', type: 'cours', deadline: '', chap: '' })
  const [chapForm, setChapForm] = useState({ num: '', titre: '' })

  const sortedChapters = [...myChapters].sort((a, b) => (Number(a.num) || 999) - (Number(b.num) || 999))
  const chapResources  = selChap ? myResources.filter(r => r.chap === selChap) : []

  function resetResForm() {
    setResForm({ titre: '', description: '', url: '', type: 'cours', deadline: '', chap: '' })
    setUploadedFile(null); setSourceMode('pdf')
  }

  async function handleAddResource() {
    if (!resForm.titre.trim() || saving) return
    const finalUrl = sourceMode === 'pdf' ? (uploadedFile?.url ?? null) : (resForm.url.trim() || null)
    setSaving(true)
    await addResource({
      subject_id:  subject.id,
      titre:       resForm.titre.trim(),
      description: resForm.description.trim() || null,
      url:         finalUrl,
      file_name:   sourceMode === 'pdf' ? (uploadedFile?.name ?? null) : null,
      type:        resForm.type,
      deadline:    resForm.deadline || null,
      chap:        resForm.chap || selChap || null,
      added_by:    isProf ? 'prof' : 'eleve',
    })
    setSaving(false)
    resetResForm(); setShowAddRes(false)
  }

  async function handleAddChapter() {
    if (!chapForm.titre.trim() || saving) return
    setSaving(true)
    await addChapter({ subject_id: subject.id, num: chapForm.num.trim() || null, titre: chapForm.titre.trim() })
    setSaving(false)
    setChapForm({ num: '', titre: '' }); setShowAddChap(false)
  }

  return (
    <div>
      {/* ── SOMMAIRE ─────────────────────────────────────────────── */}
      {selChap === null && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color.text, boxShadow: `0 0 8px ${color.text}` }} />
              <div>
                <h1 className="page-title">{subject.name}</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {myChapters.length} chapitre{myChapters.length !== 1 ? 's' : ''} · {myResources.length} ressource{myResources.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {isProf && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowAddChap(true)}><Icon name="tag" size={14} /> Chapitre</button>
                <button className="btn-danger" style={{ fontSize: 12 }} onClick={() => setShowDelConf(true)}>
                  <Icon name="trash" size={13} /> Supprimer la matière
                </button>
              </div>
            )}
          </div>

          {sortedChapters.length === 0 ? (
            <div className="empty-state">
              <Icon name="book" size={32} />
              <p>Aucun chapitre pour l'instant</p>
              {isProf && <p>Crée des chapitres pour organiser les ressources</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedChapters.map((c, i) => {
                const count = myResources.filter(r => r.chap === c.titre).length
                return (
                  <div key={c.id} className="card card-hover" onClick={() => setSelChap(c.titre)}
                    style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 'var(--r)', background: color.bg, border: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: 15, color: color.text }}>
                      {c.num || (i + 1)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{c.titre}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-hint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="file" size={11} />{count} ressource{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <Icon name="chevron-right" size={16} style={{ color: 'var(--text-hint)' }} />
                      {isProf && (
                        <button className="btn-icon" style={{ padding: 4 }}
                          onClick={e => { e.stopPropagation(); deleteChapter(c.id) }} title="Supprimer">
                          <Icon name="trash" size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CHAPITRE ─────────────────────────────────────────────── */}
      {selChap !== null && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
            <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => setSelChap(null)}>
              <Icon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />{subject.name}
            </button>
            <Icon name="chevron-right" size={13} style={{ color: 'var(--text-hint)' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: color.text }}>{selChap}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: color.text, marginBottom: 2 }}>{selChap}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{chapResources.length} ressource{chapResources.length !== 1 ? 's' : ''}</p>
            </div>
            <button style={{ background: color.bg, borderColor: color.border, color: color.text, fontWeight: 600 }} onClick={() => setShowAddRes(true)}>
              <Icon name="plus" size={14} /> Ajouter
            </button>
          </div>

          {chapResources.length === 0 ? (
            <div className="empty-state">
              <Icon name="file" size={30} />
              <p>Aucune ressource dans ce chapitre</p>
              <button style={{ marginTop: 12, background: color.bg, borderColor: color.border, color: color.text }} onClick={() => setShowAddRes(true)}>
                <Icon name="plus" size={14} /> Ajouter la première
              </button>
            </div>
          ) : chapResources.map(r => <ResourceCard key={r.id} r={r} isProf={isProf} onDelete={deleteResource} />)}
        </div>
      )}

      {/* Modal ressource */}
      <Modal open={showAddRes} onClose={() => { setShowAddRes(false); resetResForm() }}
        title={`Ajouter — ${selChap ?? subject.name}`} size="md">
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">Titre *</label>
            <input placeholder="Ex : Fiche de cours chapitre 3" value={resForm.titre}
              onChange={e => setResForm({ ...resForm, titre: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea placeholder="Quelques mots…" rows={2} value={resForm.description}
              onChange={e => setResForm({ ...resForm, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Fichier</label>
            <div className="source-toggle">
              <button type="button" className={`source-toggle-btn ${sourceMode === 'pdf' ? 'active' : ''}`} onClick={() => setSourceMode('pdf')}>
                <Icon name="file-pdf" size={13} /> Importer un PDF
              </button>
              <button type="button" className={`source-toggle-btn ${sourceMode === 'lien' ? 'active' : ''}`} onClick={() => setSourceMode('lien')}>
                <Icon name="link" size={13} /> Lien externe
              </button>
            </div>
            {sourceMode === 'pdf'
              ? <FileUpload value={uploadedFile} onChange={setUploadedFile} disabled={saving} />
              : <input placeholder="https://…" value={resForm.url} onChange={e => setResForm({ ...resForm, url: e.target.value })} />}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select value={resForm.type} onChange={e => setResForm({ ...resForm, type: e.target.value })}>
                <option value="cours">Cours</option>
                <option value="exercice">Exercice</option>
                <option value="ressource">Ressource</option>
                <option value="rendu">Rendu élève</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date limite</label>
              <input type="date" value={resForm.deadline} onChange={e => setResForm({ ...resForm, deadline: e.target.value })} />
            </div>
          </div>
          {selChap === null && sortedChapters.length > 0 && (
            <div className="form-group">
              <label className="form-label">Chapitre</label>
              <select value={resForm.chap} onChange={e => setResForm({ ...resForm, chap: e.target.value })}>
                <option value="">— Sans chapitre —</option>
                {sortedChapters.map(c => <option key={c.id} value={c.titre}>{c.num ? `${c.num}. ` : ''}{c.titre}</option>)}
              </select>
            </div>
          )}
          <hr className="divider" />
          <button style={{ background: color.text, borderColor: color.text, color: '#0a0d16', fontWeight: 600, justifyContent: 'center', width: '100%' }}
            onClick={handleAddResource} disabled={!resForm.titre.trim() || saving}>
            <Icon name="plus" size={14} />{saving ? 'Enregistrement…' : 'Ajouter la ressource'}
          </button>
        </div>
      </Modal>

      {/* Modal chapitre */}
      <Modal open={showAddChap} onClose={() => setShowAddChap(false)} title="Nouveau chapitre" size="sm">
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">N° du chapitre</label>
            <input placeholder="Ex : 3" value={chapForm.num} onChange={e => setChapForm({ ...chapForm, num: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Titre *</label>
            <input placeholder="Ex : Les fonctions dérivées" value={chapForm.titre}
              onChange={e => setChapForm({ ...chapForm, titre: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleAddChapter()} />
          </div>
          <button className="btn-primary btn-full" onClick={handleAddChapter} disabled={!chapForm.titre.trim() || saving}>
            {saving ? 'Création…' : 'Créer le chapitre'}
          </button>
        </div>
      </Modal>

      {/* Confirm suppression matière */}
      {showDelConf && (
        <Modal open onClose={() => setShowDelConf(false)} title={`Supprimer "${subject.name}" ?`} size="sm">
          <div className="form-stack">
            <div className="alert alert-red"><Icon name="alert" size={16} style={{ flexShrink: 0 }} />
              <div>Tous les chapitres et ressources de cette matière seront supprimés définitivement.</div>
            </div>
            <div className="btn-row">
              <button className="btn-danger btn-full" onClick={() => { deleteSubject(subject.id); setShowDelConf(false) }}>
                <Icon name="trash" size={14} /> Supprimer
              </button>
              <button onClick={() => setShowDelConf(false)}>Annuler</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

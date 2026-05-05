import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Icon from '../shared/Icon'
import Modal from '../shared/Modal'

const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : null
const fmtShort = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null
const COLORS   = [
  { bg: 'var(--maths-bg)',  border: 'var(--maths-border)',  text: 'var(--maths)'  },
  { bg: 'var(--infos-bg)',  border: 'var(--infos-border)',  text: 'var(--infos)'  },
  { bg: 'var(--amber-bg)',  border: 'var(--amber-border)',  text: 'var(--amber)'  },
  { bg: 'var(--purple-bg)', border: 'var(--purple-border)', text: 'var(--purple)' },
  { bg: 'var(--green-bg)',  border: 'var(--green-border)',  text: 'var(--green)'  },
]
const initials = n => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? '?'

function StudentCard({ student, color, stat, onSelect, onEdit, onDelete }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.125rem 1.25rem 0.875rem', background: color.bg, borderBottom: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: color.text, flexShrink: 0 }}>
          {initials(student.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{student.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{student.username}</div>
        </div>
      </div>
      <div style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', marginBottom: 10, flexWrap: 'wrap' }}>
          {[
            { val: stat?.devoirsPending, label: 'devoir(s)' },
            { val: stat?.ticketsOpen,    label: 'ticket(s)' },
            { val: stat?.totalSessions,  label: 'séance(s)' },
          ].map(({ val, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{val ?? '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        {stat?.lastSession && <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pen" size={11} /> Dernière séance : {fmtDate(stat.lastSession)}</div>}
        {student.next_session && <div style={{ fontSize: 12, color: 'var(--maths)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={11} /> Prochaine : {fmtShort(student.next_session)}</div>}
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }} onClick={onSelect}>
            Accéder <Icon name="chevron-right" size={13} />
          </button>
          <button className="btn-icon" style={{ padding: 7 }} onClick={onEdit} title="Modifier"><Icon name="pen" size={14} /></button>
          <button className="btn-icon btn-danger" style={{ padding: 7 }} onClick={onDelete} title="Supprimer"><Icon name="trash" size={14} /></button>
        </div>
      </div>
    </div>
  )
}

function StudentForm({ initial, onSave, saving, error }) {
  const [form, setForm] = useState(initial)
  return (
    <div className="form-stack">
      <div className="form-group">
        <label className="form-label">Nom complet *</label>
        <input placeholder="Ex : Marie Dupont" value={form.name} autoFocus
          onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Identifiant de connexion *</label>
        <input placeholder="Ex : marie.dupont" value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })} />
        <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>L'élève l'utilise pour se connecter.</div>
      </div>
      <div className="form-group">
        <label className="form-label">Mot de passe *</label>
        <input type="password" placeholder="••••••••" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && onSave(form)} />
        {initial.password === '' && <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>Laisser vide pour ne pas changer.</div>}
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--red)' }}><Icon name="alert" size={12} /> {error}</div>}
      <button className="btn-primary btn-full" onClick={() => onSave(form)} disabled={!form.name.trim() || !form.username.trim() || saving}>
        {saving ? 'Enregistrement…' : initial._isEdit ? 'Mettre à jour' : 'Créer le compte'}
      </button>
    </div>
  )
}

function ProfForm({ initial, onSave, saving, error }) {
  const [form, setForm] = useState(initial)
  return (
    <div className="form-stack">
      <div className="form-group">
        <label className="form-label">Nom *</label>
        <input placeholder="Ex : Dr. Martin" value={form.name} autoFocus
          onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Identifiant *</label>
        <input placeholder="Ex : martin" value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Mot de passe {initial._isEdit ? '(laisser vide = inchangé)' : '*'}</label>
        <input type="password" placeholder="••••••••" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && onSave(form)} />
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--red)' }}><Icon name="alert" size={12} /> {error}</div>}
      <button className="btn-primary btn-full" onClick={() => onSave(form)}
        disabled={!form.name.trim() || !form.username.trim() || (!initial._isEdit && !form.password) || saving}>
        {saving ? 'Enregistrement…' : initial._isEdit ? 'Mettre à jour' : 'Créer le compte'}
      </button>
    </div>
  )
}

export default function ProfDashboard() {
  const { students, professors, profId, profName, isOwner, selectStudent, logout,
          createStudent, updateStudent, deleteStudent,
          createProfessor, updateProfessor, deleteProfessor } = useAuth()

  const [stats,      setStats]      = useState({})
  const [activeTab,  setActiveTab]  = useState('students')  // 'students' | 'professors'
  const [modal,      setModal]      = useState(null)  // { type, data? }
  const [saving,     setSaving]     = useState(false)
  const [formErr,    setFormErr]    = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)

  useEffect(() => { if (students.length) loadStats() }, [students])

  async function loadStats() {
    const ids = students.map(s => s.id)
    const [devs, ticks, jours] = await Promise.all([
      supabase.from('devoirs').select('student_id, done').in('student_id', ids),
      supabase.from('tickets').select('student_id, statut').in('student_id', ids),
      supabase.from('journal').select('student_id, date').in('student_id', ids).order('date', { ascending: false }),
    ])
    const s = {}
    ids.forEach(id => {
      const devs_   = (devs.data  ?? []).filter(d => d.student_id === id)
      const ticks_  = (ticks.data ?? []).filter(t => t.student_id === id)
      const jours_  = (jours.data ?? []).filter(j => j.student_id === id)
      s[id] = { devoirsPending: devs_.filter(d => !d.done).length, ticketsOpen: ticks_.filter(t => t.statut === 'ouvert').length, lastSession: jours_[0]?.date ?? null, totalSessions: jours_.length }
    })
    setStats(s)
  }

  async function handleCreateStudent(form) {
    if (!form.name.trim() || !form.username.trim() || !form.password) { setFormErr('Tous les champs sont requis.'); return }
    setSaving(true)
    const err = await createStudent(form)
    setSaving(false)
    if (err) { setFormErr(err.message); return }
    setModal(null); setFormErr(null)
  }

  async function handleEditStudent(form) {
    const fields = { name: form.name.trim(), username: form.username.trim() }
    if (form.password.trim()) fields.password = form.password.trim()
    setSaving(true)
    const err = await updateStudent(modal.data.id, fields)
    setSaving(false)
    if (err) { setFormErr(err.message); return }
    setModal(null); setFormErr(null)
  }

  async function handleDeleteStudent() {
    await deleteStudent(delConfirm.id)
    setDelConfirm(null)
  }

  async function handleCreateProf(form) {
    if (!form.name.trim() || !form.username.trim() || !form.password) { setFormErr('Tous les champs sont requis.'); return }
    setSaving(true)
    const err = await createProfessor(form)
    setSaving(false)
    if (err) { setFormErr(err.message); return }
    setModal(null); setFormErr(null)
  }

  async function handleEditProf(form) {
    const fields = { name: form.name.trim(), username: form.username.trim() }
    if (form.password.trim()) fields.password = form.password.trim()
    setSaving(true)
    const err = await updateProfessor(modal.data.id, fields)
    setSaving(false)
    if (err) { setFormErr(err.message); return }
    setModal(null); setFormErr(null)
  }

  async function handleDeleteProf() {
    await deleteProfessor(delConfirm.id)
    setDelConfirm(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--maths-bg)', border: '1px solid var(--maths-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="book" size={16} style={{ color: 'var(--maths)' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>EduSpace</span>
          <span style={{ color: 'var(--text-hint)', fontSize: 13, marginLeft: 4 }}>
            — {profName}
            {isOwner && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)', borderRadius: 20, padding: '1px 7px' }}>Propriétaire</span>}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => { setModal({ type: 'createStudent' }); setFormErr(null) }}>
            <Icon name="plus" size={14} /> Nouvel élève
          </button>
          {isOwner && (
            <button onClick={() => { setModal({ type: 'createProf' }); setFormErr(null) }}>
              <Icon name="plus" size={14} /> Nouveau prof
            </button>
          )}
          <button className="btn-ghost" onClick={logout} style={{ fontSize: 12 }}>
            <Icon name="log-out" size={13} /> Déconnexion
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>

        {/* Tabs */}
        {isOwner && (
          <div className="ticket-filters" style={{ marginBottom: '1.5rem' }}>
            <button className={`filter-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
              Mes élèves ({students.length})
            </button>
            <button className={`filter-btn ${activeTab === 'professors' ? 'active' : ''}`} onClick={() => setActiveTab('professors')}>
              Professeurs ({professors.length})
            </button>
          </div>
        )}

        {/* ── Élèves ─────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Mes élèves</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              {students.length} élève{students.length !== 1 ? 's' : ''} · Clique sur un élève pour accéder à son espace
            </p>
            {students.length === 0 ? (
              <div className="empty-state card" style={{ padding: '4rem 2rem' }}>
                <Icon name="user" size={40} />
                <h2 style={{ color: 'var(--text-muted)', marginTop: 8 }}>Aucun élève pour l'instant</h2>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => { setModal({ type: 'createStudent' }); setFormErr(null) }}>
                  <Icon name="plus" size={14} /> Créer un élève
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {students.map((student, i) => (
                  <StudentCard key={student.id}
                    student={student}
                    color={COLORS[i % COLORS.length]}
                    stat={stats[student.id]}
                    onSelect={() => selectStudent(student)}
                    onEdit={() => { setModal({ type: 'editStudent', data: student }); setFormErr(null) }}
                    onDelete={() => setDelConfirm({ type: 'student', ...student })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Professeurs (owner only) ────────────────────────────── */}
        {activeTab === 'professors' && isOwner && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Comptes professeurs</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Les professeurs ont accès à tous les élèves. Seul le propriétaire peut gérer les comptes professeurs.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {professors.map(prof => (
                <div key={prof.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--maths-bg)', border: '1px solid var(--maths-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--maths)', flexShrink: 0 }}>
                    {initials(prof.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{prof.name}</span>
                      {prof.is_owner && <span style={{ fontSize: 11, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)', borderRadius: 20, padding: '1px 7px' }}>Propriétaire</span>}
                      {prof.id === profId && <span style={{ fontSize: 11, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', borderRadius: 20, padding: '1px 7px' }}>Vous</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{prof.username}</div>
                  </div>
                  {!prof.is_owner && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn-icon" onClick={() => { setModal({ type: 'editProf', data: prof }); setFormErr(null) }} title="Modifier">
                        <Icon name="pen" size={14} />
                      </button>
                      <button className="btn-icon btn-danger" onClick={() => setDelConfirm({ type: 'prof', ...prof })} title="Supprimer">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <Modal open={modal?.type === 'createStudent'} onClose={() => setModal(null)} title="Créer un compte élève" size="sm">
        <StudentForm initial={{ name: '', username: '', password: '', _isEdit: false }}
          onSave={handleCreateStudent} saving={saving} error={formErr} />
      </Modal>

      <Modal open={modal?.type === 'editStudent'} onClose={() => setModal(null)} title={`Modifier — ${modal?.data?.name}`} size="sm">
        {modal?.data && (
          <StudentForm initial={{ name: modal.data.name, username: modal.data.username, password: '', _isEdit: true }}
            onSave={handleEditStudent} saving={saving} error={formErr} />
        )}
      </Modal>

      <Modal open={modal?.type === 'createProf'} onClose={() => setModal(null)} title="Créer un compte professeur" size="sm">
        <ProfForm initial={{ name: '', username: '', password: '', _isEdit: false }}
          onSave={handleCreateProf} saving={saving} error={formErr} />
      </Modal>

      <Modal open={modal?.type === 'editProf'} onClose={() => setModal(null)} title={`Modifier — ${modal?.data?.name}`} size="sm">
        {modal?.data && (
          <ProfForm initial={{ name: modal.data.name, username: modal.data.username, password: '', _isEdit: true }}
            onSave={handleEditProf} saving={saving} error={formErr} />
        )}
      </Modal>

      {/* Confirm suppression */}
      {delConfirm && (
        <Modal open onClose={() => setDelConfirm(null)} title="Confirmer la suppression" size="sm">
          <div className="form-stack">
            <div className="alert alert-red">
              <Icon name="alert" size={16} style={{ flexShrink: 0 }} />
              <div>
                {delConfirm.type === 'student'
                  ? <>Toutes les données de <strong>{delConfirm.name}</strong> seront supprimées définitivement.</>
                  : <>Le compte de <strong>{delConfirm.name}</strong> sera supprimé.</>}
              </div>
            </div>
            <div className="btn-row">
              <button className="btn-danger btn-full"
                onClick={delConfirm.type === 'student' ? handleDeleteStudent : handleDeleteProf}>
                <Icon name="trash" size={14} /> Supprimer
              </button>
              <button onClick={() => setDelConfirm(null)}>Annuler</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Icon from '../shared/Icon'
import Modal from '../shared/Modal'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : null
const fmtShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null

// Couleurs d'accent pour chaque élève (cycle)
const COLORS = [
  { bg: 'var(--maths-bg)',  border: 'var(--maths-border)',  text: 'var(--maths)'  },
  { bg: 'var(--infos-bg)',  border: 'var(--infos-border)',  text: 'var(--infos)'  },
  { bg: 'var(--amber-bg)',  border: 'var(--amber-border)',  text: 'var(--amber)'  },
  { bg: 'var(--purple-bg)', border: 'var(--purple-border)', text: 'var(--purple)' },
  { bg: 'var(--green-bg)',  border: 'var(--green-border)',  text: 'var(--green)'  },
]

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function ProfDashboard() {
  const { students, selectStudent, logout, createStudent, deleteStudent, updateStudent } = useAuth()

  const [stats,       setStats]       = useState({})  // studentId → { devoirs, tickets, lastSession }
  const [showCreate,  setShowCreate]  = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [delConfirm,  setDelConfirm]  = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [editForm, setEditForm] = useState({ name: '', username: '', password: '' })
  const [formErr, setFormErr] = useState(null)

  // Charger les stats de tous les élèves
  useEffect(() => {
    if (students.length === 0) return
    loadStats()
  }, [students])

  async function loadStats() {
    const ids = students.map(s => s.id)
    const [devs, ticks, jours] = await Promise.all([
      supabase.from('devoirs').select('student_id, done').in('student_id', ids),
      supabase.from('tickets').select('student_id, statut').in('student_id', ids),
      supabase.from('journal').select('student_id, date').in('student_id', ids).order('date', { ascending: false }),
    ])
    const s = {}
    ids.forEach(id => {
      const devoirsData = (devs.data ?? []).filter(d => d.student_id === id)
      const ticketsData = (ticks.data ?? []).filter(t => t.student_id === id)
      const journalData = (jours.data ?? []).filter(j => j.student_id === id)
      s[id] = {
        devoirsPending: devoirsData.filter(d => !d.done).length,
        ticketsOpen:    ticketsData.filter(t => t.statut === 'ouvert').length,
        lastSession:    journalData[0]?.date ?? null,
        totalSessions:  journalData.length,
      }
    })
    setStats(s)
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setFormErr('Tous les champs sont obligatoires.'); return
    }
    setSaving(true)
    const err = await createStudent(form)
    setSaving(false)
    if (err) { setFormErr(err.message); return }
    setForm({ name: '', username: '', password: '' })
    setFormErr(null)
    setShowCreate(false)
  }

  async function handleEdit() {
    if (!editForm.name.trim() || !editForm.username.trim()) {
      setFormErr('Nom et identifiant obligatoires.'); return
    }
    setSaving(true)
    const fields = { name: editForm.name.trim(), username: editForm.username.trim() }
    if (editForm.password.trim()) fields.password = editForm.password.trim()
    const err = await updateStudent(editStudent.id, fields)
    setSaving(false)
    if (err) { setFormErr(err.message); return }
    setEditStudent(null); setFormErr(null)
  }

  async function handleDelete() {
    if (!delConfirm) return
    await deleteStudent(delConfirm.id)
    setDelConfirm(null)
  }

  function openEdit(student) {
    setEditStudent(student)
    setEditForm({ name: student.name, username: student.username, password: '' })
    setFormErr(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--maths-bg)', border: '1px solid var(--maths-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="book" size={16} style={{ color: 'var(--maths)' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>EduSpace</span>
          <span style={{ color: 'var(--text-hint)', fontSize: 13, marginLeft: 4 }}>— Tableau de bord prof</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => { setShowCreate(true); setFormErr(null) }}>
            <Icon name="plus" size={14} /> Nouvel élève
          </button>
          <button className="btn-ghost" onClick={logout} style={{ fontSize: 12 }}>
            <Icon name="log-out" size={13} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Mes élèves</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
          {students.length} élève{students.length !== 1 ? 's' : ''} · Clique sur un élève pour accéder à son espace
        </p>

        {/* Empty state */}
        {students.length === 0 && (
          <div className="empty-state card" style={{ padding: '4rem 2rem' }}>
            <Icon name="user" size={40} />
            <h2 style={{ color: 'var(--text-muted)', marginTop: 8 }}>Aucun élève pour l'instant</h2>
            <p>Crée ton premier compte élève pour commencer</p>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={14} /> Créer un élève
            </button>
          </div>
        )}

        {/* Student grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {students.map((student, i) => {
            const color  = COLORS[i % COLORS.length]
            const stat   = stats[student.id] ?? {}
            const hasDevoirsUrgents = stat.devoirsPending > 0
            const hasTickets        = stat.ticketsOpen > 0
            return (
              <div
                key={student.id}
                className="card"
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => selectStudent(student)}
              >
                {/* Card top */}
                <div style={{
                  padding: '1.25rem 1.25rem 1rem',
                  background: color.bg,
                  borderBottom: `1px solid ${color.border}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: color.text, flexShrink: 0,
                  }}>
                    {initials(student.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      @{student.username}
                    </div>
                  </div>
                </div>

                {/* Card stats */}
                <div style={{ padding: '0.875rem 1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: hasDevoirsUrgents ? 'var(--amber)' : 'var(--text)', lineHeight: 1 }}>
                        {stat.devoirsPending ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>devoir{stat.devoirsPending !== 1 ? 's' : ''} en cours</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: hasTickets ? 'var(--amber)' : 'var(--text)', lineHeight: 1 }}>
                        {stat.ticketsOpen ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>ticket{stat.ticketsOpen !== 1 ? 's' : ''} ouvert{stat.ticketsOpen !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{stat.totalSessions ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>séance{stat.totalSessions !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {stat.lastSession && (
                    <div style={{ fontSize: 12, color: 'var(--text-hint)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                      <Icon name="pen" size={11} /> Dernière séance : {fmtDate(stat.lastSession)}
                    </div>
                  )}
                  {student.next_session && (
                    <div style={{ fontSize: 12, color: 'var(--maths)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                      <Icon name="calendar" size={11} /> Prochaine séance : {fmtShort(student.next_session)}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                      onClick={e => { e.stopPropagation(); selectStudent(student) }}
                    >
                      Accéder <Icon name="chevron-right" size={13} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={e => { e.stopPropagation(); openEdit(student) }}
                      title="Modifier"
                      style={{ padding: 7 }}
                    >
                      <Icon name="pen" size={14} />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={e => { e.stopPropagation(); setDelConfirm(student) }}
                      title="Supprimer"
                      style={{ padding: 7 }}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal — Créer un élève */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFormErr(null) }} title="Créer un compte élève" size="sm">
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">Nom complet *</label>
            <input placeholder="Ex : Marie Dupont" value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); setFormErr(null) }} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Identifiant de connexion *</label>
            <input placeholder="Ex : marie.dupont" value={form.username}
              onChange={e => { setForm({ ...form, username: e.target.value }); setFormErr(null) }} />
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>
              Utilisé pour se connecter. Sans espaces.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe *</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); setFormErr(null) }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          {formErr && <div style={{ fontSize: 12, color: 'var(--red)' }}><Icon name="alert" size={12} /> {formErr}</div>}
          <button className="btn-primary btn-full" onClick={handleCreate} disabled={saving}>
            {saving ? 'Création…' : 'Créer le compte'}
          </button>
        </div>
      </Modal>

      {/* Modal — Modifier un élève */}
      {editStudent && (
        <Modal open onClose={() => { setEditStudent(null); setFormErr(null) }} title={`Modifier — ${editStudent.name}`} size="sm">
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input value={editForm.name}
                onChange={e => { setEditForm({ ...editForm, name: e.target.value }); setFormErr(null) }} />
            </div>
            <div className="form-group">
              <label className="form-label">Identifiant de connexion</label>
              <input value={editForm.username}
                onChange={e => { setEditForm({ ...editForm, username: e.target.value }); setFormErr(null) }} />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input type="password" placeholder="Laisser vide pour ne pas changer" value={editForm.password}
                onChange={e => { setEditForm({ ...editForm, password: e.target.value }); setFormErr(null) }} />
            </div>
            {formErr && <div style={{ fontSize: 12, color: 'var(--red)' }}><Icon name="alert" size={12} /> {formErr}</div>}
            <button className="btn-primary btn-full" onClick={handleEdit} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal — Confirmer suppression */}
      {delConfirm && (
        <Modal open onClose={() => setDelConfirm(null)} title="Supprimer cet élève ?" size="sm">
          <div className="form-stack">
            <div className="alert alert-red">
              <Icon name="alert" size={16} style={{ flexShrink: 0 }} />
              <div>
                Toutes les données de <strong>{delConfirm.name}</strong> seront supprimées définitivement
                (ressources, devoirs, journal, tickets).
              </div>
            </div>
            <div className="btn-row">
              <button className="btn-danger btn-full" onClick={handleDelete}>
                <Icon name="trash" size={14} /> Supprimer définitivement
              </button>
              <button onClick={() => setDelConfirm(null)}>Annuler</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

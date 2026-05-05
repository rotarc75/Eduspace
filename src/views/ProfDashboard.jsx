import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Icon from '../shared/Icon'
import Modal from '../shared/Modal'

const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null
const fmtShort = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null
const fmtNext  = d => {
  if (!d) return null
  const days = Math.ceil((new Date(d) - new Date()) / 864e5)
  const date = fmtShort(d)
  if (days === 0) return { label: date, sub: "Aujourd'hui !", color: 'var(--green)' }
  if (days === 1) return { label: date, sub: 'Demain', color: 'var(--maths)' }
  if (days > 0)   return { label: date, sub: `J-${days}`, color: 'var(--maths)' }
  return { label: date, sub: 'Passée', color: 'var(--text-hint)' }
}

const PALETTE = [
  { bg: 'var(--maths-bg)',  border: 'var(--maths-border)',  text: 'var(--maths)'  },
  { bg: 'var(--infos-bg)',  border: 'var(--infos-border)',  text: 'var(--infos)'  },
  { bg: 'var(--amber-bg)',  border: 'var(--amber-border)',  text: 'var(--amber)'  },
  { bg: 'var(--purple-bg)', border: 'var(--purple-border)', text: 'var(--purple)' },
  { bg: 'var(--green-bg)',  border: 'var(--green-border)',  text: 'var(--green)'  },
]

const initials = n => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? '?'

// ── Formulaire générique (élève ou prof) ─────────────────────────
function AccountForm({ fields, onSave, saving, error, isEdit }) {
  const [form, setForm] = useState(fields)
  useEffect(() => setForm(fields), [JSON.stringify(fields)])
  return (
    <div className="form-stack">
      {form.name !== undefined && (
        <div className="form-group">
          <label className="form-label">Nom complet *</label>
          <input value={form.name} autoFocus placeholder="Ex : Marie Dupont"
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Identifiant *</label>
        <input value={form.username} placeholder="Ex : marie.dupont"
          onChange={e => setForm({ ...form, username: e.target.value })} />
        {!isEdit && <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>Utilisé pour se connecter.</div>}
      </div>
      <div className="form-group">
        <label className="form-label">Mot de passe {isEdit ? '(vide = inchangé)' : '*'}</label>
        <input type="password" placeholder="••••••••" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && onSave(form)} />
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={12} />{error}</div>}
      <button className="btn-primary btn-full" disabled={saving || !form.username?.trim() || (!isEdit && !form.password)}
        onClick={() => onSave(form)}>
        {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le compte'}
      </button>
    </div>
  )
}

// ── Modal "Mon compte" — accessible à tous les profs ─────────────
function MyAccountModal({ open, onClose }) {
  const { profId, profName, professors, updateCurrentProf } = useAuth()
  const current = professors.find(p => p.id === profId)

  const [form,   setForm]   = useState({ name: '', username: '', password: '', confirm: '' })
  const [msg,    setMsg]    = useState(null)
  const [saving, setSaving] = useState(false)

  // Pré-remplir dès que les données sont dispo
  useEffect(() => {
    if (current) {
      setForm(f => ({ ...f, name: current.name, username: current.username, password: '', confirm: '' }))
    }
  }, [current?.id])

  async function handleSave() {
    setMsg(null)
    if (!form.name.trim() || !form.username.trim()) {
      setMsg({ ok: false, text: "Nom et identifiant obligatoires." }); return
    }
    if (form.password && form.password !== form.confirm) {
      setMsg({ ok: false, text: "Les mots de passe ne correspondent pas." }); return
    }
    if (form.password && form.password.length < 4) {
      setMsg({ ok: false, text: "Mot de passe trop court (min. 4 caractères)." }); return
    }
    setSaving(true)
    const err = await updateCurrentProf({
      name:     form.name.trim(),
      username: form.username.trim(),
      password: form.password || null,
    })
    setSaving(false)
    if (err) setMsg({ ok: false, text: err.message })
    else {
      setMsg({ ok: true, text: "Modifications enregistrées !" })
      setForm(f => ({ ...f, password: '', confirm: '' }))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mon compte" size="sm">
      <div className="form-stack">
        <div className="form-group">
          <label className="form-label">Nom affiché</label>
          <input value={form.name} placeholder="Votre nom…"
            onChange={e => { setForm({ ...form, name: e.target.value }); setMsg(null) }} />
        </div>
        <div className="form-group">
          <label className="form-label">Identifiant de connexion</label>
          <input value={form.username} placeholder="Votre identifiant…"
            onChange={e => { setForm({ ...form, username: e.target.value }); setMsg(null) }} />
        </div>
        <hr className="divider" />
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Nouveau mot de passe <span style={{ color: 'var(--text-hint)' }}>(laisser vide pour garder l'actuel)</span>
        </div>
        <div className="form-group">
          <label className="form-label">Nouveau mot de passe</label>
          <input type="password" placeholder="••••••••" value={form.password}
            onChange={e => { setForm({ ...form, password: e.target.value }); setMsg(null) }} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirmer</label>
          <input type="password" placeholder="••••••••" value={form.confirm}
            onChange={e => { setForm({ ...form, confirm: e.target.value }); setMsg(null) }}
            onKeyDown={e => e.key === 'Enter' && handleSave()} />
        </div>
        {msg && (
          <div style={{
            fontSize: 13, padding: '8px 12px', borderRadius: 'var(--r-sm)', fontWeight: 500,
            color:      msg.ok ? 'var(--green)' : 'var(--red)',
            background: msg.ok ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${msg.ok ? 'var(--green-border)' : 'var(--red-border)'}`,
          }}>
            {msg.text}
          </div>
        )}
        <button className="btn-primary btn-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  )
}

export default function ProfDashboard() {
  const { students, professors, profId, profName, isOwner, selectStudent, logout,
          createStudent, updateStudent, deleteStudent,
          createProfessor, updateProfessor, deleteProfessor } = useAuth()

  const [stats,     setStats]     = useState({})
  const [activeTab, setActiveTab] = useState('students')
  const [modal,     setModal]     = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [formErr,   setFormErr]   = useState(null)
  const [delId,     setDelId]     = useState(null)

  useEffect(() => { if (students.length) loadStats() }, [students])

  async function loadStats() {
    const ids = students.map(s => s.id)
    if (!ids.length) return
    const [devs, ticks, jours] = await Promise.all([
      supabase.from('devoirs').select('student_id,done').in('student_id', ids),
      supabase.from('tickets').select('student_id,statut').in('student_id', ids),
      supabase.from('journal').select('student_id,date').in('student_id', ids).order('date', { ascending: false }),
    ])
    const s = {}
    ids.forEach(id => {
      s[id] = {
        devoirsPending: (devs.data ?? []).filter(d => d.student_id === id && !d.done).length,
        ticketsOpen:    (ticks.data ?? []).filter(t => t.student_id === id && t.statut === 'ouvert').length,
        lastSession:    (jours.data ?? []).find(j => j.student_id === id)?.date ?? null,
        totalSessions:  (jours.data ?? []).filter(j => j.student_id === id).length,
      }
    })
    setStats(s)
  }

  // ── CRUD handlers ────────────────────────────────────────────────
  async function handle(action, form) {
    const { name, username, password } = form
    if (!username?.trim() || (!modal?.isEdit && !password)) { setFormErr('Champs obligatoires manquants.'); return }
    setSaving(true)
    const fields = { username: username.trim(), ...(name ? { name: name.trim() } : {}), ...(password ? { password } : {}) }
    const err = await action(fields)
    setSaving(false)
    if (err) { setFormErr(err.message); return }
    setModal(null); setFormErr(null)
  }

  async function handleDelete() {
    if (!delId) return
    if (delId.type === 'student') await deleteStudent(delId.id)
    else await deleteProfessor(delId.id)
    setDelId(null)
  }

  // ── Global stats ─────────────────────────────────────────────────
  const totalDevoirs  = Object.values(stats).reduce((s, v) => s + (v.devoirsPending ?? 0), 0)
  const totalTickets  = Object.values(stats).reduce((s, v) => s + (v.ticketsOpen    ?? 0), 0)
  const totalSessions = Object.values(stats).reduce((s, v) => s + (v.totalSessions  ?? 0), 0)
  const nextSessions  = students.filter(s => s.next_session).sort((a,b) => new Date(a.next_session) - new Date(b.next_session))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--maths-bg)', border: '1px solid var(--maths-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="book" size={16} style={{ color: 'var(--maths)' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>EduSpace</span>
          <span style={{ color: 'var(--text-hint)', fontSize: 13 }}>· {profName}</span>
          {isOwner && <span className="badge badge-amber">Admin</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => { setModal({ type: 'student' }); setFormErr(null) }}>
            <Icon name="plus" size={14} /> Nouvel élève
          </button>
          {isOwner && (
            <button onClick={() => { setModal({ type: 'prof' }); setFormErr(null) }}>
              <Icon name="plus" size={14} /> Nouveau prof
            </button>
          )}
          <button onClick={() => { setModal({ type: 'myaccount' }); setFormErr(null) }} style={{ fontSize: 12 }}>
            <Icon name="settings" size={13} /> Mon compte
          </button>
          <button className="btn-ghost" onClick={logout} style={{ fontSize: 12 }}>
            <Icon name="log-out" size={13} /> Déconnexion
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: 1040, margin: '0 auto' }}>

        {/* ── Bannière de bienvenue ────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, var(--maths-bg) 0%, var(--bg-elevated) 100%)', border: '1px solid var(--maths-border)', borderRadius: 'var(--r-xl)', padding: '1.5rem 2rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--maths)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Tableau de bord</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>
              Bonjour, {profName?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {students.length} élève{students.length !== 1 ? 's' : ''} · {professors.length} professeur{professors.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Prochaines séances */}
          {nextSessions.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {nextSessions.slice(0, 3).map(s => {
                const ns = fmtNext(s.next_session)
                return (
                  <div key={s.id} onClick={() => selectStudent(s)}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-lg)', padding: '0.625rem 1rem', cursor: 'pointer', transition: 'border-color 0.15s', minWidth: 130 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--maths)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 2 }}>Prochaine séance</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: ns?.color }}>{ns?.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: ns?.color, marginTop: 1 }}>{ns?.sub}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Stat bar ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '1.75rem' }}>
          {[
            { icon: 'check-circle', label: 'Devoirs en attente', value: totalDevoirs,  color: totalDevoirs  > 0 ? 'var(--amber)' : 'var(--text)' },
            { icon: 'ticket',       label: 'Tickets ouverts',    value: totalTickets,  color: totalTickets  > 0 ? 'var(--amber)' : 'var(--text)' },
            { icon: 'pen',          label: 'Séances au total',   value: totalSessions, color: 'var(--text)' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={icon} size={18} style={{ color: 'var(--maths)' }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        {isOwner && (
          <div className="ticket-filters" style={{ marginBottom: '1.25rem' }}>
            <button className={`filter-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
              Élèves ({students.length})
            </button>
            <button className={`filter-btn ${activeTab === 'professors' ? 'active' : ''}`} onClick={() => setActiveTab('professors')}>
              Professeurs ({professors.length})
            </button>
          </div>
        )}

        {/* ── Grille élèves ────────────────────────────────────── */}
        {activeTab === 'students' && (
          <>
            {students.length === 0 ? (
              <div className="empty-state card" style={{ padding: '4rem 2rem' }}>
                <Icon name="user" size={40} />
                <h2 style={{ color: 'var(--text-muted)', marginTop: 8 }}>Aucun élève pour l'instant</h2>
                <p style={{ fontSize: 13 }}>Commence par créer un premier compte élève</p>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => { setModal({ type: 'student' }); setFormErr(null) }}>
                  <Icon name="plus" size={14} /> Créer un élève
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
                {students.map((student, i) => {
                  const col  = PALETTE[i % PALETTE.length]
                  const stat = stats[student.id] ?? {}
                  const ns   = fmtNext(student.next_session)
                  return (
                    <div key={student.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {/* Top coloré */}
                      <div style={{ background: col.bg, borderBottom: `1px solid ${col.border}`, padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: col.text, flexShrink: 0 }}>
                          {initials(student.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{student.username}</div>
                        </div>
                      </div>

                      <div style={{ padding: '0.875rem 1.25rem' }}>
                        {/* Mini stats */}
                        <div style={{ display: 'flex', gap: '1.25rem', marginBottom: 12 }}>
                          {[
                            { n: stat.devoirsPending, label: 'devoir(s)', warn: stat.devoirsPending > 0 },
                            { n: stat.ticketsOpen,    label: 'ticket(s)', warn: stat.ticketsOpen > 0 },
                            { n: stat.totalSessions,  label: 'séance(s)', warn: false },
                          ].map(({ n, label, warn }) => (
                            <div key={label}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: warn ? 'var(--amber)' : 'var(--text)', lineHeight: 1 }}>{n ?? '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 1 }}>{label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Prochaine séance */}
                        {ns ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '5px 8px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                            <Icon name="calendar" size={12} style={{ color: ns.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: ns.color, fontWeight: 500 }}>{ns.label}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {ns.sub}</span>
                          </div>
                        ) : stat.lastSession ? (
                          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="pen" size={11} /> Dernière séance : {fmtShort(stat.lastSession)}
                          </div>
                        ) : null}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                            onClick={() => selectStudent(student)}>
                            Accéder <Icon name="chevron-right" size={13} />
                          </button>
                          <button className="btn-icon" style={{ padding: 7 }} title="Modifier"
                            onClick={() => { setModal({ type: 'student', isEdit: true, data: student }); setFormErr(null) }}>
                            <Icon name="pen" size={14} />
                          </button>
                          <button className="btn-icon btn-danger" style={{ padding: 7 }} title="Supprimer"
                            onClick={() => setDelId({ type: 'student', id: student.id, name: student.name })}>
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Liste professeurs ────────────────────────────────── */}
        {activeTab === 'professors' && isOwner && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Les professeurs ont accès à tous les élèves. Seul l'admin peut gérer les comptes professeurs.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {professors.map(prof => (
                <div key={prof.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--maths-bg)', border: '1px solid var(--maths-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--maths)', flexShrink: 0 }}>
                    {initials(prof.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{prof.name}</span>
                      {prof.is_owner && <span className="badge badge-amber">Admin</span>}
                      {prof.id === profId && <span className="badge badge-green">Vous</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{prof.username}</div>
                  </div>
                  {!prof.is_owner && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn-icon" style={{ padding: 7 }} title="Modifier"
                        onClick={() => { setModal({ type: 'prof', isEdit: true, data: prof }); setFormErr(null) }}>
                        <Icon name="pen" size={14} />
                      </button>
                      <button className="btn-icon btn-danger" style={{ padding: 7 }} title="Supprimer"
                        onClick={() => setDelId({ type: 'prof', id: prof.id, name: prof.name })}>
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
      <Modal
        open={!!modal && modal.type === 'student'}
        onClose={() => { setModal(null); setFormErr(null) }}
        title={modal?.isEdit ? `Modifier — ${modal?.data?.name}` : 'Créer un compte élève'}
        size="sm"
      >
        <AccountForm
          fields={modal?.isEdit
            ? { name: modal.data.name, username: modal.data.username, password: '' }
            : { name: '', username: '', password: '' }
          }
          isEdit={modal?.isEdit}
          saving={saving}
          error={formErr}
          onSave={form => handle(
            modal?.isEdit
              ? fields => updateStudent(modal.data.id, fields)
              : createStudent,
            form
          )}
        />
      </Modal>

      <Modal
        open={!!modal && modal.type === 'prof'}
        onClose={() => { setModal(null); setFormErr(null) }}
        title={modal?.isEdit ? `Modifier — ${modal?.data?.name}` : 'Créer un compte professeur'}
        size="sm"
      >
        <AccountForm
          fields={modal?.isEdit
            ? { name: modal.data.name, username: modal.data.username, password: '' }
            : { name: '', username: '', password: '' }
          }
          isEdit={modal?.isEdit}
          saving={saving}
          error={formErr}
          onSave={form => handle(
            modal?.isEdit
              ? fields => updateProfessor(modal.data.id, fields)
              : createProfessor,
            form
          )}
        />
      </Modal>

      {/* Confirmation suppression */}
      {delId && (
        <Modal open onClose={() => setDelId(null)} title="Confirmer la suppression" size="sm">
          <div className="form-stack">
            <div className="alert alert-red">
              <Icon name="alert" size={16} style={{ flexShrink: 0 }} />
              <div>
                {delId.type === 'student'
                  ? <>Toutes les données de <strong>{delId.name}</strong> seront supprimées définitivement.</>
                  : <>Le compte de <strong>{delId.name}</strong> sera supprimé.</>
                }
              </div>
            </div>
            <div className="btn-row">
              <button className="btn-danger btn-full" onClick={handleDelete}>
                <Icon name="trash" size={14} /> Supprimer
              </button>
              <button onClick={() => setDelId(null)}>Annuler</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Mon compte */}
      <MyAccountModal
        open={!!modal && modal.type === 'myaccount'}
        onClose={() => { setModal(null); setFormErr(null) }}
      />
    </div>
  )
}

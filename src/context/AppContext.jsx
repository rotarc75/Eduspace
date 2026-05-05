import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

const SUBJECT_COLORS = {
  blue:   { text: '#7B9CF4', bg: 'rgba(123,156,244,0.12)', border: 'rgba(123,156,244,0.30)' },
  green:  { text: '#5BC8A0', bg: 'rgba(91,200,160,0.12)',  border: 'rgba(91,200,160,0.30)'  },
  purple: { text: '#B08CF4', bg: 'rgba(176,140,244,0.12)', border: 'rgba(176,140,244,0.30)' },
  amber:  { text: '#F4B860', bg: 'rgba(244,184,96,0.12)',  border: 'rgba(244,184,96,0.30)'  },
  red:    { text: '#F47B7B', bg: 'rgba(244,123,123,0.12)', border: 'rgba(244,123,123,0.30)' },
}
export { SUBJECT_COLORS }

export function AppProvider({ children, studentId }) {
  const [resources, setResources] = useState([])
  const [chapters,  setChapters]  = useState([])
  const [subjects,  setSubjects]  = useState([])
  const [tickets,   setTickets]   = useState([])
  const [comments,  setComments]  = useState([])
  const [journal,   setJournal]   = useState([])
  const [devoirs,   setDevoirs]   = useState([])
  const [nextSession, setNextSession] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [dbError,   setDbError]   = useState(null)

  useEffect(() => {
    if (studentId) loadAll()
    else { resetState(); setLoading(false) }
  }, [studentId])

  function resetState() {
    setResources([]); setChapters([]); setSubjects([])
    setTickets([]); setComments([]); setJournal([]); setDevoirs([]); setNextSession(null)
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [r, ch, sub, t, cm, j, d, st] = await Promise.all([
        supabase.from('resources').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('chapters').select('*').eq('student_id', studentId),
        supabase.from('subjects').select('*').eq('student_id', studentId).order('created_at'),
        supabase.from('tickets').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('ticket_comments').select('*').order('created_at'),
        supabase.from('journal').select('*').eq('student_id', studentId).order('date', { ascending: false }),
        supabase.from('devoirs').select('*').eq('student_id', studentId).order('deadline'),
        supabase.from('students').select('next_session').eq('id', studentId).single(),
      ])
      if (r.error)   throw r.error
      if (ch.error)  throw ch.error
      if (sub.error) throw sub.error
      if (t.error)   throw t.error
      if (j.error)   throw j.error
      if (d.error)   throw d.error
      setResources(r.data   ?? [])
      setChapters(ch.data   ?? [])
      setSubjects(sub.data  ?? [])
      setTickets(t.data     ?? [])
      setComments(cm.data   ?? [])
      setJournal(j.data     ?? [])
      setDevoirs(d.data     ?? [])
      if (st.data) setNextSession(st.data.next_session ?? null)
    } catch (err) {
      console.error(err)
      setDbError('Erreur de chargement.')
    }
    setLoading(false)
  }

  // ── Subjects ───────────────────────────────────────────────────
  async function addSubject({ name, color }) {
    const { data, error } = await supabase.from('subjects')
      .insert([{ student_id: studentId, name, color }]).select()
    if (!error && data) setSubjects(p => [...p, data[0]])
    return error
  }
  async function deleteSubject(id) {
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects(p => p.filter(s => s.id !== id))
    setChapters(p => p.filter(c => c.subject_id !== id))
    setResources(p => p.filter(r => r.subject_id !== id))
  }

  // ── Resources ──────────────────────────────────────────────────
  async function addResource(resource) {
    const { data, error } = await supabase.from('resources')
      .insert([{ ...resource, student_id: studentId }]).select()
    if (!error && data) setResources(p => [data[0], ...p])
    return error
  }
  async function deleteResource(id) {
    await supabase.from('resources').delete().eq('id', id)
    setResources(p => p.filter(r => r.id !== id))
  }

  // ── Chapters ───────────────────────────────────────────────────
  async function addChapter(chapter) {
    const { data, error } = await supabase.from('chapters')
      .insert([{ ...chapter, student_id: studentId }]).select()
    if (!error && data) setChapters(p => [...p, data[0]])
    return error
  }
  async function deleteChapter(id) {
    await supabase.from('chapters').delete().eq('id', id)
    setChapters(p => p.filter(c => c.id !== id))
  }

  // ── Tickets ────────────────────────────────────────────────────
  async function addTicket(ticket) {
    const { data, error } = await supabase.from('tickets')
      .insert([{ ...ticket, student_id: studentId }]).select()
    if (!error && data) setTickets(p => [data[0], ...p])
    return error
  }
  async function toggleTicket(id) {
    const ticket = tickets.find(t => t.id === id)
    const newStatus = ticket.statut === 'ouvert' ? 'fermé' : 'ouvert'
    await supabase.from('tickets').update({ statut: newStatus }).eq('id', id)
    setTickets(p => p.map(t => t.id === id ? { ...t, statut: newStatus } : t))
  }
  async function deleteTicket(id) {
    await supabase.from('tickets').delete().eq('id', id)
    setTickets(p => p.filter(t => t.id !== id))
    setComments(p => p.filter(c => c.ticket_id !== id))
  }
  async function addComment(ticketId, text, author) {
    const { data, error } = await supabase.from('ticket_comments')
      .insert([{ ticket_id: ticketId, text, author }]).select()
    if (!error && data) setComments(p => [...p, data[0]])
    return error
  }
  function ticketComments(ticketId) {
    return comments.filter(c => c.ticket_id === ticketId)
  }

  // ── Journal ────────────────────────────────────────────────────
  async function addJournalEntry(entry) {
    const { data, error } = await supabase.from('journal')
      .insert([{ ...entry, student_id: studentId }]).select()
    if (!error && data) setJournal(p => [data[0], ...p])
    return error
  }
  async function updateJournalEntry(id, fields) {
    const { data, error } = await supabase.from('journal').update(fields).eq('id', id).select()
    if (!error && data) setJournal(p => p.map(j => j.id === id ? data[0] : j))
    return error
  }
  async function deleteJournalEntry(id) {
    await supabase.from('journal').delete().eq('id', id)
    setJournal(p => p.filter(j => j.id !== id))
    setDevoirs(p => p.map(d => d.journal_id === id ? { ...d, journal_id: null } : d))
  }

  // ── Devoirs ────────────────────────────────────────────────────
  const sortDevoirs = arr => [...arr].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  async function addDevoir(devoir) {
    const { data, error } = await supabase.from('devoirs')
      .insert([{ ...devoir, student_id: studentId }]).select()
    if (!error && data) setDevoirs(p => sortDevoirs([...p, data[0]]))
    return error
  }
  async function updateDevoir(id, fields) {
    const { data, error } = await supabase.from('devoirs').update(fields).eq('id', id).select()
    if (!error && data) setDevoirs(p => sortDevoirs(p.map(d => d.id === id ? data[0] : d)))
    return error
  }
  async function toggleDevoir(id) {
    const devoir = devoirs.find(d => d.id === id)
    const done = !devoir.done
    await supabase.from('devoirs').update({ done }).eq('id', id)
    setDevoirs(p => p.map(d => d.id === id ? { ...d, done } : d))
  }
  async function deleteDevoir(id) {
    await supabase.from('devoirs').delete().eq('id', id)
    setDevoirs(p => p.filter(d => d.id !== id))
  }
  async function submitDevoir(id, { url, name }) {
    const fields = { submission_url: url, submission_name: name, submitted_at: new Date().toISOString(), done: true }
    const { data, error } = await supabase.from('devoirs').update(fields).eq('id', id).select()
    if (!error && data) setDevoirs(p => p.map(d => d.id === id ? data[0] : d))
    return error
  }

  // ── Next session ───────────────────────────────────────────────
  async function saveNextSession(date) {
    const { error } = await supabase.from('students')
      .update({ next_session: date || null }).eq('id', studentId)
    if (!error) setNextSession(date || null)
    return error
  }

  return (
    <AppContext.Provider value={{
      resources, chapters, subjects, tickets, journal, devoirs, nextSession,
      loading, dbError,
      addSubject, deleteSubject,
      addResource, deleteResource,
      addChapter, deleteChapter,
      addTicket, toggleTicket, deleteTicket, addComment, ticketComments,
      addJournalEntry, updateJournalEntry, deleteJournalEntry,
      addDevoir, updateDevoir, toggleDevoir, deleteDevoir, submitDevoir,
      saveNextSession,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

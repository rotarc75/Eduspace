import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [resources,    setResources]    = useState([])
  const [chapters,     setChapters]     = useState([])
  const [tickets,      setTickets]      = useState([])
  const [comments,     setComments]     = useState([])
  const [journal,      setJournal]      = useState([])
  const [devoirs,      setDevoirs]      = useState([])
  const [profPwd,      setProfPwd]      = useState('prof2024')
  const [nextSession,  setNextSession]  = useState(null)   // date string YYYY-MM-DD
  const [loading,      setLoading]      = useState(true)
  const [dbError,      setDbError]      = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [r, ch, t, cm, j, d, s] = await Promise.all([
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
        supabase.from('chapters').select('*'),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('ticket_comments').select('*').order('created_at'),
        supabase.from('journal').select('*').order('date', { ascending: false }),
        supabase.from('devoirs').select('*').order('deadline'),
        supabase.from('settings').select('*'),
      ])
      if (r.error)  throw r.error
      if (ch.error) throw ch.error
      if (t.error)  throw t.error
      if (cm.error) throw cm.error
      if (j.error)  throw j.error
      if (d.error)  throw d.error

      setResources(r.data ?? [])
      setChapters(ch.data ?? [])
      setTickets(t.data    ?? [])
      setComments(cm.data  ?? [])
      setJournal(j.data    ?? [])
      setDevoirs(d.data    ?? [])

      if (s.data) {
        const pwd  = s.data.find((x) => x.key === 'prof_pwd')
        const next = s.data.find((x) => x.key === 'next_session')
        if (pwd)  setProfPwd(pwd.value)
        if (next) setNextSession(next.value)
      }
    } catch (err) {
      console.error(err)
      setDbError('Impossible de se connecter à la base de données. Vérifie ton fichier .env.')
    }
    setLoading(false)
  }

  // ── Resources ────────────────────────────────────────────────────
  async function addResource(resource) {
    const { data, error } = await supabase.from('resources').insert([resource]).select()
    if (!error && data) setResources((p) => [data[0], ...p])
    return error
  }
  async function deleteResource(id) {
    await supabase.from('resources').delete().eq('id', id)
    setResources((p) => p.filter((r) => r.id !== id))
  }

  // ── Chapters ─────────────────────────────────────────────────────
  async function addChapter(chapter) {
    const { data, error } = await supabase.from('chapters').insert([chapter]).select()
    if (!error && data) setChapters((p) => [...p, data[0]])
    return error
  }
  async function deleteChapter(id) {
    await supabase.from('chapters').delete().eq('id', id)
    setChapters((p) => p.filter((c) => c.id !== id))
  }

  // ── Tickets ──────────────────────────────────────────────────────
  async function addTicket(ticket) {
    const { data, error } = await supabase.from('tickets').insert([ticket]).select()
    if (!error && data) setTickets((p) => [data[0], ...p])
    return error
  }
  async function toggleTicket(id) {
    const ticket    = tickets.find((t) => t.id === id)
    const newStatus = ticket.statut === 'ouvert' ? 'fermé' : 'ouvert'
    await supabase.from('tickets').update({ statut: newStatus }).eq('id', id)
    setTickets((p) => p.map((t) => (t.id === id ? { ...t, statut: newStatus } : t)))
  }
  async function deleteTicket(id) {
    await supabase.from('tickets').delete().eq('id', id)
    setTickets((p) => p.filter((t) => t.id !== id))
    setComments((p) => p.filter((c) => c.ticket_id !== id))
  }
  async function addComment(ticketId, text, author) {
    const { data, error } = await supabase
      .from('ticket_comments')
      .insert([{ ticket_id: ticketId, text, author }])
      .select()
    if (!error && data) setComments((p) => [...p, data[0]])
    return error
  }
  function ticketComments(ticketId) {
    return comments.filter((c) => c.ticket_id === ticketId)
  }

  // ── Journal ──────────────────────────────────────────────────────
  async function addJournalEntry(entry) {
    const { data, error } = await supabase.from('journal').insert([entry]).select()
    if (!error && data) setJournal((p) => [data[0], ...p])
    return error
  }
  async function updateJournalEntry(id, fields) {
    const { data, error } = await supabase.from('journal').update(fields).eq('id', id).select()
    if (!error && data) setJournal((p) => p.map((j) => (j.id === id ? data[0] : j)))
    return error
  }
  async function deleteJournalEntry(id) {
    await supabase.from('journal').delete().eq('id', id)
    setJournal((p) => p.filter((j) => j.id !== id))
    setDevoirs((p) => p.map((d) => d.journal_id === id ? { ...d, journal_id: null } : d))
  }

  // ── Settings ─────────────────────────────────────────────────────
  async function changePassword(newPwd) {
    const { error } = await supabase.from('settings').upsert({ key: 'prof_pwd', value: newPwd })
    if (!error) setProfPwd(newPwd)
    return error
  }
  async function saveNextSession(date) {
    const val = date || ''
    const { error } = await supabase.from('settings').upsert({ key: 'next_session', value: val })
    if (!error) setNextSession(val || null)
    return error
  }

  // ── Devoirs ──────────────────────────────────────────────────────
  const sortDevoirs = (arr) => [...arr].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  async function addDevoir(devoir) {
    const { data, error } = await supabase.from('devoirs').insert([devoir]).select()
    if (!error && data) setDevoirs((p) => sortDevoirs([...p, data[0]]))
    return error
  }
  async function updateDevoir(id, fields) {
    const { data, error } = await supabase.from('devoirs').update(fields).eq('id', id).select()
    if (!error && data) setDevoirs((p) => sortDevoirs(p.map((d) => (d.id === id ? data[0] : d))))
    return error
  }
  async function toggleDevoir(id) {
    const devoir = devoirs.find((d) => d.id === id)
    const done   = !devoir.done
    await supabase.from('devoirs').update({ done }).eq('id', id)
    setDevoirs((p) => p.map((d) => (d.id === id ? { ...d, done } : d)))
  }
  async function deleteDevoir(id) {
    await supabase.from('devoirs').delete().eq('id', id)
    setDevoirs((p) => p.filter((d) => d.id !== id))
  }

  return (
    <AppContext.Provider value={{
      resources, chapters, tickets, journal, devoirs, profPwd, nextSession,
      loading, dbError,
      addResource, deleteResource,
      addChapter, deleteChapter,
      addTicket, toggleTicket, deleteTicket, addComment, ticketComments,
      addJournalEntry, updateJournalEntry, deleteJournalEntry,
      addDevoir, updateDevoir, toggleDevoir, deleteDevoir,
      changePassword, saveNextSession,
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

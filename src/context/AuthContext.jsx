import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [role,        setRole]        = useState(null)
  const [profId,      setProfId]      = useState(null)
  const [profName,    setProfName]    = useState(null)
  const [isOwner,     setIsOwner]     = useState(false)
  const [studentId,   setStudentId]   = useState(null)
  const [studentName, setStudentName] = useState(null)
  const [allStudents, setAllStudents] = useState([])   // tous (pour auth élève)
  const [professors,  setProfessors]  = useState([])
  const [authLoading, setAuthLoading] = useState(true)
  const [dbError,     setDbError]     = useState(null)

  useEffect(() => {
    // Lire la session sauvegardée
    let savedProfId = null
    try {
      const saved = JSON.parse(localStorage.getItem('eduspace_session') || 'null')
      if (saved?.role) {
        setRole(saved.role)
        setProfId(saved.profId || null)
        setProfName(saved.profName || null)
        setIsOwner(saved.isOwner || false)
        setStudentId(saved.studentId || null)
        setStudentName(saved.studentName || null)
        savedProfId = saved.profId || null
      }
    } catch {}
    loadInit(savedProfId)
  }, [])

  async function loadInit(currentProfId) {
    try {
      const [s, p] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('professors').select('*').order('name'),
      ])
      if (s.error) throw s.error
      if (p.error) throw p.error
      setAllStudents(s.data ?? [])
      setProfessors(p.data  ?? [])
    } catch (e) {
      console.error(e)
      setDbError('Impossible de se connecter à Supabase.')
    }
    setAuthLoading(false)
  }

  // Élèves visibles = ceux appartenant au prof connecté
  const students = allStudents.filter(s => s.prof_id === profId)

  function persist(data) {
    localStorage.setItem('eduspace_session', JSON.stringify(data))
  }

  // ── Connexions ─────────────────────────────────────────────────
  function loginProf(username, password) {
    const prof = professors.find(
      p => p.username.toLowerCase() === username.trim().toLowerCase() && p.password === password
    )
    if (!prof) return false
    setRole('prof')
    setProfId(prof.id); setProfName(prof.name); setIsOwner(prof.is_owner)
    setStudentId(null); setStudentName(null)
    persist({ role: 'prof', profId: prof.id, profName: prof.name, isOwner: prof.is_owner, studentId: null, studentName: null })
    return true
  }

  function loginStudent(username, password) {
    // Chercher dans TOUS les élèves (pas seulement ceux d'un prof)
    const student = allStudents.find(
      s => s.username.toLowerCase() === username.trim().toLowerCase() && s.password === password
    )
    if (!student) return false
    setRole('student'); setStudentId(student.id); setStudentName(student.name)
    persist({ role: 'student', studentId: student.id, studentName: student.name })
    return true
  }

  function selectStudent(student) {
    setStudentId(student.id); setStudentName(student.name)
    persist({ role: 'prof', profId, profName, isOwner, studentId: student.id, studentName: student.name })
  }

  function backToDashboard() {
    setStudentId(null); setStudentName(null)
    persist({ role: 'prof', profId, profName, isOwner, studentId: null, studentName: null })
  }

  function logout() {
    setRole(null); setProfId(null); setProfName(null); setIsOwner(false)
    setStudentId(null); setStudentName(null)
    localStorage.removeItem('eduspace_session')
  }

  // ── Auto-inscription professeur ────────────────────────────────
  async function registerProfessor({ name, username, password }) {
    const taken = professors.some(p => p.username.toLowerCase() === username.trim().toLowerCase())
    if (taken) return { message: 'Cet identifiant est déjà utilisé.' }
    const { data, error } = await supabase.from('professors')
      .insert([{ name: name.trim(), username: username.trim(), password, is_owner: false }]).select()
    if (error) return error
    if (data) {
      const prof = data[0]
      setProfessors(p => [...p, prof].sort((a,b) => a.name.localeCompare(b.name)))
      setRole('prof'); setProfId(prof.id); setProfName(prof.name); setIsOwner(false)
      setStudentId(null); setStudentName(null)
      persist({ role: 'prof', profId: prof.id, profName: prof.name, isOwner: false, studentId: null, studentName: null })
    }
    return null
  }

  // ── Modifier son propre compte ─────────────────────────────────
  async function updateCurrentProf({ name, username, password }) {
    const taken = professors.some(p => p.username.toLowerCase() === username.trim().toLowerCase() && p.id !== profId)
    if (taken) return { message: 'Cet identifiant est déjà utilisé par un autre professeur.' }
    const fields = { name: name.trim(), username: username.trim() }
    if (password) fields.password = password
    const { error } = await supabase.from('professors').update(fields).eq('id', profId)
    if (!error) {
      setProfessors(p => p.map(pr => pr.id === profId ? { ...pr, ...fields } : pr))
      setProfName(name.trim())
      persist({ role: 'prof', profId, profName: name.trim(), isOwner, studentId, studentName })
    }
    return error ?? null
  }

  // ── Gestion élèves (liés au prof courant) ─────────────────────
  async function createStudent({ name, username, password }) {
    const { data, error } = await supabase.from('students')
      .insert([{ name, username, password, prof_id: profId }]).select()
    if (!error && data) setAllStudents(p => [...p, data[0]].sort((a,b) => a.name.localeCompare(b.name)))
    return error
  }
  async function updateStudent(id, fields) {
    const { error } = await supabase.from('students').update(fields).eq('id', id)
    if (!error) setAllStudents(p => p.map(s => s.id === id ? { ...s, ...fields } : s))
    return error
  }
  async function deleteStudent(id) {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (!error) setAllStudents(p => p.filter(s => s.id !== id))
    return error
  }

  // ── Gestion professeurs (owner seulement) ─────────────────────
  async function createProfessor({ name, username, password }) {
    const { data, error } = await supabase.from('professors')
      .insert([{ name, username, password, is_owner: false }]).select()
    if (!error && data) setProfessors(p => [...p, data[0]].sort((a,b) => a.name.localeCompare(b.name)))
    return error
  }
  async function updateProfessor(id, fields) {
    const { error } = await supabase.from('professors').update(fields).eq('id', id)
    if (!error) setProfessors(p => p.map(pr => pr.id === id ? { ...pr, ...fields } : pr))
    return error
  }
  async function deleteProfessor(id) {
    const { error } = await supabase.from('professors').delete().eq('id', id)
    if (!error) setProfessors(p => p.filter(pr => pr.id !== id))
    return error
  }

  return (
    <AuthContext.Provider value={{
      role, profId, profName, isOwner,
      studentId, studentName,
      students,       // élèves du prof courant uniquement
      professors,
      authLoading, dbError,
      loginProf, loginStudent,
      selectStudent, backToDashboard, logout,
      registerProfessor, updateCurrentProf,
      createStudent, updateStudent, deleteStudent,
      createProfessor, updateProfessor, deleteProfessor,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

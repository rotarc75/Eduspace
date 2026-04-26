import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [role,        setRole]        = useState(null)   // 'prof' | 'student' | null
  const [studentId,   setStudentId]   = useState(null)
  const [studentName, setStudentName] = useState(null)
  const [students,    setStudents]    = useState([])
  const [profPwd,     setProfPwd]     = useState('prof2024')
  const [authLoading, setAuthLoading] = useState(true)
  const [dbError,     setDbError]     = useState(null)

  useEffect(() => {
    // Restaurer la session depuis localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('eduspace_session') || 'null')
      if (saved?.role) {
        setRole(saved.role)
        setStudentId(saved.studentId || null)
        setStudentName(saved.studentName || null)
      }
    } catch {}
    loadInit()
  }, [])

  async function loadInit() {
    try {
      const [s, settings] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('settings').select('*'),
      ])
      if (s.error) throw s.error
      setStudents(s.data ?? [])
      if (settings.data) {
        const p = settings.data.find(x => x.key === 'prof_pwd')
        if (p) setProfPwd(p.value)
      }
    } catch (e) {
      console.error('AuthContext error:', e)
      setDbError('Impossible de se connecter à Supabase. Vérifie ton .env.')
    }
    setAuthLoading(false)
  }

  function persist(role, studentId, studentName) {
    localStorage.setItem('eduspace_session', JSON.stringify({ role, studentId, studentName }))
  }

  // ── Connexions ───────────────────────────────────────────────────
  function loginProf(password) {
    if (password !== profPwd) return false
    setRole('prof'); setStudentId(null); setStudentName(null)
    persist('prof', null, null)
    return true
  }

  function loginStudent(username, password) {
    const student = students.find(
      s => s.username.toLowerCase() === username.trim().toLowerCase() && s.password === password
    )
    if (!student) return false
    setRole('student'); setStudentId(student.id); setStudentName(student.name)
    persist('student', student.id, student.name)
    return true
  }

  // Le prof entre dans l'espace d'un élève
  function selectStudent(student) {
    setStudentId(student.id)
    setStudentName(student.name)
    persist('prof', student.id, student.name)
  }

  // Le prof revient au tableau de bord
  function backToDashboard() {
    setStudentId(null); setStudentName(null)
    persist('prof', null, null)
  }

  function logout() {
    setRole(null); setStudentId(null); setStudentName(null)
    localStorage.removeItem('eduspace_session')
  }

  // ── Gestion des élèves (prof) ────────────────────────────────────
  async function createStudent({ name, username, password }) {
    const { data, error } = await supabase
      .from('students').insert([{ name, username, password }]).select()
    if (!error && data) {
      setStudents(p => [...p, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
    }
    return error
  }

  async function updateStudent(id, fields) {
    const { error } = await supabase.from('students').update(fields).eq('id', id)
    if (!error) setStudents(p => p.map(s => s.id === id ? { ...s, ...fields } : s))
    return error
  }

  async function deleteStudent(id) {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (!error) setStudents(p => p.filter(s => s.id !== id))
    return error
  }

  async function updateProfPwd(newPwd) {
    const { error } = await supabase.from('settings').upsert({ key: 'prof_pwd', value: newPwd })
    if (!error) setProfPwd(newPwd)
    return error
  }

  return (
    <AuthContext.Provider value={{
      role, studentId, studentName, students, profPwd, authLoading, dbError,
      loginProf, loginStudent, selectStudent, backToDashboard, logout,
      createStudent, updateStudent, deleteStudent, updateProfPwd,
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

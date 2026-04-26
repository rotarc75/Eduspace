import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Icon from './Icon'

const BUCKET = 'pdfs'
const MAX_MB = 20

export default function FileUpload({ value, onChange, disabled }) {
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error,    setError]    = useState(null)
  const inputRef = useRef()

  async function handleFile(file) {
    if (!file) return
    setError(null)
    if (file.type !== 'application/pdf') { setError('Seuls les fichiers PDF sont acceptés.'); return }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`Fichier trop lourd (max ${MAX_MB} Mo).`); return }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path     = `${Date.now()}_${safeName}`
    setProgress(10)

    const { data, error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: 'application/pdf', upsert: false })

    if (upErr) {
      setError(`Erreur : ${upErr.message}`)
      setProgress(null)
      return
    }

    setProgress(100)
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
    onChange({ url: publicUrl, name: file.name, path: data.path })
    setTimeout(() => setProgress(null), 600)
  }

  async function handleRemove() {
    if (value?.path) await supabase.storage.from(BUCKET).remove([value.path])
    onChange(null)
    setError(null)
  }

  // Drag events
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = ()  => setDragging(false)
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]) }

  if (value) {
    return (
      <div className="file-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="file-card-icon"><Icon name="file-pdf" size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value.name}
            </div>
            <a href={value.url} target="_blank" rel="noreferrer"
               style={{ fontSize: 11, color: 'var(--maths)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Icon name="link" size={10} /> Ouvrir le PDF
            </a>
          </div>
          {!disabled && (
            <button type="button" className="btn-icon" onClick={handleRemove} title="Supprimer">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className={`drop-zone${dragging ? ' drag-over' : ''}${disabled ? ' drop-zone-disabled' : ''}`}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {progress !== null ? (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Envoi en cours…</div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ marginBottom: 8, color: 'var(--text-hint)' }}><Icon name="upload" size={26} /></div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Glisse un PDF ici ou clique pour choisir</div>
            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 3 }}>PDF uniquement · max {MAX_MB} Mo</div>
          </div>
        )}
      </div>
      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="alert" size={12} /> {error}
        </div>
      )}
      <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
             onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  )
}

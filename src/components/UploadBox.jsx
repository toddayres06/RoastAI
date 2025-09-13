import { useEffect, useRef, useState } from 'react'
import { compressImage } from '../lib/image'
import { getClientId } from '../lib/clientId'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || '' // '' in dev (proxy), full URL in prod

export default function UploadBox() {
  const { session } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const onPaste = (e) => {
      const item = [...e.clipboardData.items].find(i => i.type.startsWith('image/'))
      if (item) handleFiles([item.getAsFile()])
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  function handleFiles(list) {
    const f = list?.[0]; if (!f) return
    if (!f.type.startsWith('image/')) return setMsg('Please choose an image.')
    setFile(f)
    setPreview(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f) })
    setMsg(null)
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!file) return
    setBusy(true); setMsg(null)
    try {
      // smaller image = faster + cheaper
      const { blob } = await compressImage(file, { maxSide: 1280, quality: 0.85 })
      const fd = new FormData()
      fd.append('image', blob, file.name.replace(/\.[^.]+$/, '') + '.webp')

      // optional: control spice/length from UI (hard-coded for now)
      // fd.append('spice', 'inferno')      // 'mild' | 'hot' | 'inferno'
      // fd.append('sentences', '4')        // 1..6

      const headers = { 'X-Client-Id': getClientId() }
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`

      const res = await fetch(`${API_BASE}/api/roast`, { method: 'POST', headers, body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`)
      setMsg(`${data.source === 'ai' ? '🤖' : '🧪'} ${data.roast || data.message || 'Uploaded ✓'}`)
      console.log('[roast]', { source: data.source, spice: data.spice, sentences: data.sentences })
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      className="w-full max-w-lg rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur mx-auto text-center"
    >
      <div
        className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-8 sm:p-10 hover:bg-white/10 transition"
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-lg font-semibold">Drop a photo here</p>
        <p className="text-sm text-neutral-300">or click to browse, or paste (Ctrl/Cmd+V)</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {preview && (
        <div className="mt-4">
          <img alt="preview" src={preview} className="mx-auto max-h-72 sm:max-h-96 w-auto h-auto rounded-lg shadow" />
          <button
            type="button"
            onClick={() => { if (preview) URL.revokeObjectURL(preview); setPreview(null); setFile(null) }}
            className="mt-3 text-sm text-neutral-300 underline hover:text-white"
          >
            Replace
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || busy}
        className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Submit for Roast'}
      </button>

      {msg && <p className="mt-3 text-sm text-amber-200">{msg}</p>}
    </form>
  )
}

import { useState, useEffect, useRef } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const session = await fetchAuthSession({ forceRefresh: false })
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Nu există sesiune activă')
  return { Authorization: token }
}

interface Video {
  video_id: string
  filename: string
  s3_key: string
  status: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadPct, setUploadPct] = useState(0)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadVideos = async () => {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/videos`, { headers })
      if (res.ok) {
        const data = await res.json()
        setVideos(data)
      }
    } catch (e) {
      console.error('Eroare la încărcarea videouri:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVideos() }, [])

  const uploadVideo = async (file: File) => {
    setUploading(file.name)
    setUploadPct(0)

    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/videos`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name })
      })
      const { upload_url } = await res.json()

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadPct(Math.round(e.loaded / e.total * 100))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('PUT', upload_url)
        xhr.setRequestHeader('Content-Type', 'video/mp4')
        xhr.send(file)
      })

      await loadVideos()
    } catch (e) {
      console.error('Upload error:', e)
    } finally {
      setUploading(null)
      setUploadPct(0)
    }
  }

  const deleteVideo = async (video: Video) => {
    if (!confirm(`Ștergi "${video.filename}"?`)) return
    try {
      const headers = await getAuthHeader()
      await fetch(`${API_URL}/videos`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.video_id, s3_key: video.s3_key })
      })
      setVideos(prev => prev.filter(v => v.video_id !== video.video_id))
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadVideo(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadVideo(file)
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Videouri</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Uploadează videouri — se vor posta automat conform programului tău.
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: 12, padding: '40px 24px', textAlign: 'center',
          background: dragging ? '#eff6ff' : '#fff', cursor: 'pointer',
          marginBottom: 28, transition: 'all 0.15s',
        }}
      >
        <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <div style={{ fontSize: 40, marginBottom: 12 }}>📤</div>
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Trage video-ul aici sau apasă pentru a selecta
        </div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>
          MP4, MOV · Max 500 MB · Recomandat 9:16 pentru Stories
        </div>
      </div>

      {uploading && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
          padding: '14px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1e40af' }}>
              Se uploadează: {uploading}
            </span>
            <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>{uploadPct}%</span>
          </div>
          <div style={{ height: 6, background: '#bfdbfe', borderRadius: 3 }}>
            <div style={{
              height: '100%', background: '#3b82f6', borderRadius: 3,
              width: `${uploadPct}%`, transition: 'width 0.1s',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
            Upload direct în S3 — serverul nu este implicat
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
            Videouri uploadate ({videos.length})
          </h2>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {videos.filter(v => v.status === 'pending').length} în așteptare
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '24px 20px', color: '#9ca3af', fontSize: 14 }}>Se încarcă...</div>
        ) : videos.length === 0 ? (
          <div style={{ padding: '24px 20px', color: '#9ca3af', fontSize: 14 }}>
            Nu ai videouri uploadate încă.
          </div>
        ) : (
          videos.map((v, i) => (
            <div key={v.video_id} style={{
              padding: '14px 20px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 56, height: 40, background: '#1f2937', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 18, flexShrink: 0,
              }}>▶</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: '#374151', fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.filename}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.s3_key}
                </div>
              </div>

              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                background: v.status === 'used' ? '#f3f4f6' : '#ecfdf5',
                color: v.status === 'used' ? '#6b7280' : '#065f46',
              }}>
                {v.status === 'used' ? 'Folosit' : '● În așteptare'}
              </span>

              {v.status !== 'used' && (
                <button
                  onClick={() => deleteVideo(v)}
                  style={{
                    padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 6, fontSize: 12, color: '#dc2626', cursor: 'pointer',
                  }}
                >
                  Șterge
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

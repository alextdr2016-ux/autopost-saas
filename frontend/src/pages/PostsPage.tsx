import { useState, useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const session = await fetchAuthSession({ forceRefresh: false })
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Nu există sesiune activă')
  return { Authorization: token }
}

interface Post {
  sk: string
  type: 'product' | 'article' | 'video'
  title: string
  fb_post_id: string
  status: 'success' | 'error'
  error: string
  created_at: string
}

const typeConfig = {
  product: { label: 'Produs', bg: '#eff6ff', color: '#1e40af', icon: '🛍' },
  article: { label: 'Articol', bg: '#ecfdf5', color: '#065f46', icon: '📖' },
  video:   { label: 'Video',   bg: '#f5f3ff', color: '#5b21b6', icon: '🎬' },
}

function formatDate(iso: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('ro-RO', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function getFbLink(fb_post_id: string) {
  if (!fb_post_id) return null
  const parts = fb_post_id.split('_')
  if (parts.length === 2) return `https://www.facebook.com/${parts[0]}/posts/${parts[1]}`
  return `https://www.facebook.com/${fb_post_id}`
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const headers = await getAuthHeader()
        const res = await fetch(`${API_URL}/posts`, { headers })
        if (res.ok) {
          const data = await res.json()
          setPosts(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = posts.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  const counts = {
    all: posts.length,
    success: posts.filter(p => p.status === 'success').length,
    error: posts.filter(p => p.status === 'error').length,
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Istoric postări</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            {counts.all} postări totale · {counts.success} reușite · {counts.error} erori
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['all', 'Toate'], ['success', 'Reușite'], ['error', 'Erori']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                border: filter === key ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                background: filter === key ? '#eff6ff' : '#fff',
                color: filter === key ? '#1d4ed8' : '#374151',
                cursor: 'pointer',
              }}
            >
              {label}
              <span style={{
                marginLeft: 6, fontSize: 11, background: filter === key ? '#dbeafe' : '#f3f4f6',
                color: filter === key ? '#1e40af' : '#6b7280',
                padding: '1px 6px', borderRadius: 10, fontWeight: 600,
              }}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14, padding: 32, textAlign: 'center' }}>
          Se încarcă postările...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
          padding: 48, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Nicio postare găsită
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            Postările automate vor apărea aici după prima rulare.
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Data', 'Tip', 'Titlu / Produs', 'Status', 'Link Facebook'].map(h => (
                  <th key={h} style={{
                    padding: '10px 18px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#6b7280', textTransform: 'uppercase',
                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const cfg = typeConfig[p.type] ?? typeConfig.product
                const fbLink = getFbLink(p.fb_post_id)
                return (
                  <tr key={i} style={{
                    borderTop: '1px solid #f3f4f6',
                    background: p.status === 'error' ? '#fff5f5' : undefined,
                  }}>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {formatDate(p.created_at)}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 5,
                        background: cfg.bg, color: cfg.color, fontWeight: 600,
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 18px', fontSize: 13, color: '#374151',
                      fontWeight: 500, maxWidth: 240,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.title || '—'}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {p.status === 'success' ? (
                        <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>✓ Postat</span>
                      ) : (
                        <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }} title={p.error}>
                          ✕ Eroare
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {fbLink ? (
                        <a
                          href={fbLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12, color: '#3b82f6', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          Vezi postarea ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

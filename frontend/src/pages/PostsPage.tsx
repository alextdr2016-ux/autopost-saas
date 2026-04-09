import { useState, useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { useLanguage } from '../i18n/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const session = await fetchAuthSession({ forceRefresh: false })
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('No active session')
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
  product: { labelKey: 'typeProduct' as const, bg: '#eff6ff', color: '#1e40af', icon: '\u{1F6CD}' },
  article: { labelKey: 'typeArticle' as const, bg: '#ecfdf5', color: '#065f46', icon: '\u{1F4D6}' },
  video:   { labelKey: 'typeVideo' as const,   bg: '#f5f3ff', color: '#5b21b6', icon: '\u{1F3AC}' },
}

function getFbLink(fb_post_id: string) {
  if (!fb_post_id) return null
  const parts = fb_post_id.split('_')
  if (parts.length === 2) return `https://www.facebook.com/${parts[0]}/posts/${parts[1]}`
  return `https://www.facebook.com/${fb_post_id}`
}

export default function PostsPage() {
  const { t, lang } = useLanguage()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all')

  function formatDate(iso: string) {
    if (!iso) return '\u2014'
    try {
      const d = new Date(iso)
      return d.toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-US', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return iso }
  }

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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)' }}>{t('postsPageTitle')}</h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: 14, marginTop: 4 }}>
            {counts.all} {t('totalPosts')} · {counts.success} {t('successful')} · {counts.error} {t('errors')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['all', t('filterAll')], ['success', t('filterSuccess')], ['error', t('filterError')]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as 'all' | 'success' | 'error')}
              style={{
                padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                border: filter === key ? '2px solid #3b82f6' : '1px solid var(--border)',
                background: filter === key ? '#eff6ff' : 'var(--bg-card)',
                color: filter === key ? '#1d4ed8' : 'var(--foreground)',
                cursor: 'pointer',
              }}
            >
              {label}
              <span style={{
                marginLeft: 6, fontSize: 11, background: filter === key ? '#dbeafe' : 'var(--surface)',
                color: filter === key ? '#1e40af' : 'var(--foreground-muted)',
                padding: '1px 6px', borderRadius: 10, fontWeight: 600,
              }}>
                {counts[key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--foreground-muted)', fontSize: 14, padding: 32, textAlign: 'center' }}>
          {t('loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)',
          padding: 48, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4ED}'}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>
            {t('noPostsFound')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--foreground-dim)' }}>
            {t('postsWillAppear')}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)' }}>
                {[t('colDate'), t('colType'), t('colTitle'), t('colStatus'), t('colFbLink')].map(h => (
                  <th key={h} style={{
                    padding: '10px 18px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase',
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
                    borderTop: '1px solid var(--border)',
                    background: p.status === 'error' ? 'var(--destructive-bg)' : undefined,
                  }}>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--foreground-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(p.created_at)}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 5,
                        background: cfg.bg, color: cfg.color, fontWeight: 600,
                      }}>
                        {cfg.icon} {t(cfg.labelKey)}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 18px', fontSize: 13, color: 'var(--foreground)',
                      fontWeight: 500, maxWidth: 240,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.title || '\u2014'}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {p.status === 'success' ? (
                        <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>{'\u2713'} {t('posted')}</span>
                      ) : (
                        <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }} title={p.error}>
                          {'\u2715'} {t('errorStatus')}
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
                          {t('viewPost')} {'\u2197'}
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--foreground-dim)' }}>{'\u2014'}</span>
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

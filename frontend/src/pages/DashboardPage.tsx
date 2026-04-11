import { useState, useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { type Page } from '../App'
import { useLanguage } from '../i18n/LanguageContext'
import type { Lang } from '../i18n/translations'

const API_URL = import.meta.env.VITE_API_URL

/* ── Types ── */
interface PostItem {
  sk: string
  type: 'product' | 'article' | 'video'
  title: string
  fb_post_id: string
  status: 'success' | 'error'
  error?: string
  created_at: string
  template?: string
}

interface DashboardStats {
  postsToday: number
  postsThisMonth: number
  successRate: number
  totalErrors: number
  videosPending: number
}

/* ── SVG Icons (Lucide-style) ── */
const SunIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/><path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
  </svg>
)
const MoonIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
)
const CheckIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const XIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

/* ── Helpers ── */
function formatDate(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function isToday(iso: string): boolean {
  try {
    const d = new Date(iso)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  } catch { return false }
}

function isThisMonth(iso: string): boolean {
  try {
    const d = new Date(iso)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  } catch { return false }
}

function computeStats(posts: PostItem[]): DashboardStats {
  const today = posts.filter(p => isToday(p.created_at))
  const thisMonth = posts.filter(p => isThisMonth(p.created_at))
  const successes = thisMonth.filter(p => p.status === 'success').length
  const errors = thisMonth.filter(p => p.status === 'error').length
  const rate = thisMonth.length > 0 ? Math.round((successes / thisMonth.length) * 100) : 0

  return {
    postsToday: today.length,
    postsThisMonth: thisMonth.length,
    successRate: rate,
    totalErrors: errors,
    videosPending: 0,
  }
}

/* ── Component ── */
interface Props {
  onNavigate: (p: Page) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function DashboardPage({ onNavigate, theme, onToggleTheme }: Props) {
  const { t, lang, setLang } = useLanguage()
  const [posts, setPosts] = useState<PostItem[]>([])
  const [videosPending, setVideosPending] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()
      if (!token) return

      const headers = { Authorization: `Bearer ${token}` }

      const [postsRes, videosRes] = await Promise.all([
        fetch(`${API_URL}/posts`, { headers }),
        fetch(`${API_URL}/videos`, { headers }),
      ])

      if (postsRes.ok) {
        const data = await postsRes.json()
        const postsArr = Array.isArray(data) ? data : (data.posts || [])
        setPosts(postsArr)
      }

      if (videosRes.ok) {
        const data = await videosRes.json()
        const videosArr = Array.isArray(data) ? data : (data.videos || [])
        const pending = videosArr.filter((v: { status: string }) => v.status === 'pending')
        setVideosPending(pending.length)
      }
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const stats = computeStats(posts)
  stats.videosPending = videosPending

  const todayPosts = posts.filter(p => isToday(p.created_at))
  const recentPosts = posts.slice(0, 8)

  const statCards = [
    {
      label: t('postsToday'),
      value: stats.postsToday.toString(),
      dotColor: 'var(--accent)',
      sub: todayPosts.filter(p => p.status === 'success').length + ' ' + t('successCount'),
      changeType: 'neutral' as const,
    },
    {
      label: t('successRate'),
      value: stats.successRate + '%',
      dotColor: 'var(--success)',
      sub: stats.postsThisMonth + ' ' + t('postsThisMonth'),
      changeType: (stats.successRate >= 90 ? 'up' : stats.successRate >= 70 ? 'neutral' : 'down') as 'up' | 'neutral' | 'down',
    },
    {
      label: t('videosPending'),
      value: stats.videosPending.toString(),
      dotColor: 'var(--warning)',
      sub: t('readyToPost'),
      changeType: 'neutral' as const,
    },
    {
      label: t('errorsThisMonth'),
      value: stats.totalErrors.toString(),
      dotColor: stats.totalErrors > 0 ? 'var(--destructive)' : 'var(--success)',
      sub: stats.totalErrors === 0 ? t('allWorking') : t('checkHistory'),
      changeType: (stats.totalErrors === 0 ? 'up' : 'down') as 'up' | 'down',
    },
  ]

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' as const, gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)' }}>{t('dashboardTitle')}</h1>
          <p style={{ color: 'var(--foreground-muted)', marginTop: 4, fontSize: 14 }}>
            {new Date().toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Language switcher */}
          <div style={{
            display: 'flex', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', overflow: 'hidden',
          }}>
            {(['en', 'ro'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: '8px 12px', fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: lang === l ? 'var(--accent)' : 'var(--surface)',
                  color: lang === l ? '#fff' : 'var(--foreground-muted)',
                  fontFamily: 'var(--font)',
                }}
              >
                {l === 'en' ? 'EN' : 'RO'}
              </button>
            ))}
          </div>
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            aria-label={t('toggleTheme')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--foreground-muted)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {theme === 'light' ? SunIcon : MoonIcon}
          </button>
          <button
            onClick={() => onNavigate('creator')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              fontFamily: 'var(--font)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 200ms ease',
              minHeight: 44,
              boxShadow: '0 0 20px var(--accent-glow)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            {t('createPost')}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 60, color: 'var(--foreground-muted)',
        }}>
          {t('loadingData')}
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="stats-grid-responsive" style={{ marginBottom: 32 }}>
            {statCards.map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                transition: 'border-color 200ms ease',
                boxShadow: 'var(--card-shadow)',
              }}>
                <div style={{
                  fontSize: 12, color: 'var(--foreground-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.04em', fontWeight: 500, marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dotColor, display: 'inline-block' }} />
                  {s.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: 'var(--foreground)' }}>
                  {s.value}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 99,
                  background: s.changeType === 'up' ? 'var(--success-bg)' : s.changeType === 'down' ? 'var(--destructive-bg)' : 'var(--surface)',
                  color: s.changeType === 'up' ? 'var(--success)' : s.changeType === 'down' ? 'var(--destructive)' : 'var(--foreground-muted)',
                }}>
                  {s.sub}
                </span>
              </div>
            ))}
          </div>

          {/* Content grid */}
          <div className="dashboard-grid-responsive">
            {/* Recent posts table */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderBottom: '1px solid var(--border)',
              }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>{t('recentPosts')}</h2>
                <button
                  onClick={() => onNavigate('posts')}
                  style={{
                    padding: '6px 12px', minHeight: 36, fontSize: 12,
                    background: 'var(--surface)', color: 'var(--foreground)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500,
                  }}
                >
                  {t('viewAll')}
                </button>
              </div>

              {recentPosts.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--foreground-muted)' }}>
                  {t('noPostsYet')}
                </div>
              ) : (
                <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }} role="table">
                  <thead>
                    <tr>
                      {[t('colTitle'), t('colType'), t('colDate'), t('colStatus')].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', fontSize: 11, textTransform: 'uppercase',
                          letterSpacing: '0.05em', color: 'var(--foreground-dim)',
                          fontWeight: 600, padding: '12px 20px',
                          borderBottom: '1px solid var(--border)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentPosts.map((p, i) => (
                      <tr key={i} style={{ transition: 'background 200ms ease' }}>
                        <td style={{
                          padding: '14px 20px', fontSize: 13, color: 'var(--foreground)',
                          maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {p.title || t('noTitle')}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 600,
                            background: p.type === 'video' ? 'rgba(139,92,246,0.1)' : p.type === 'article' ? 'var(--success-bg)' : 'var(--accent-glow)',
                            color: p.type === 'video' ? '#8b5cf6' : p.type === 'article' ? 'var(--success)' : 'var(--accent)',
                            textTransform: 'capitalize',
                          }}>{p.type === 'product' ? t('typeProduct') : p.type === 'article' ? t('typeArticle') : t('typeVideo')}</span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--foreground-muted)' }}>
                          {formatDate(p.created_at, lang)}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 99,
                            fontSize: 12, fontWeight: 500,
                            background: p.status === 'success' ? 'var(--success-bg)' : 'var(--destructive-bg)',
                            color: p.status === 'success' ? 'var(--success)' : 'var(--destructive)',
                          }}>
                            {p.status === 'success' ? CheckIcon : XIcon}
                            {p.status === 'success' ? t('statusSuccess') : t('statusError')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>

            {/* Right panel - Quick Stats & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--card-shadow)',
              }}>
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border)',
                }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>{t('quickActions')}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px' }}>
                  <QuickAction label={t('qaCreateTemplate')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>} onClick={() => onNavigate('creator')} />
                  <QuickAction label={t('qaConnectFb')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} onClick={() => onNavigate('connect')} />
                  <QuickAction label={t('qaUploadVideo')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>} onClick={() => onNavigate('videos')} />
                  <QuickAction label={t('qaViewHistory')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>} onClick={() => onNavigate('posts')} />
                  <QuickAction label={t('qaSettings')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>} onClick={() => onNavigate('settings')} />
                </div>
              </div>

              {/* Post breakdown by type */}
              {posts.length > 0 && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  boxShadow: 'var(--card-shadow)',
                }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--foreground)' }}>
                    {t('distributionThisMonth')}
                  </h3>
                  {['product', 'article', 'video'].map(type => {
                    const count = posts.filter(p => isThisMonth(p.created_at) && p.type === type).length
                    const total = stats.postsThisMonth || 1
                    const pct = Math.round((count / total) * 100)
                    const labels: Record<string, string> = { product: t('products'), article: t('articles'), video: t('videos') }
                    const colors: Record<string, string> = { product: 'var(--accent)', article: 'var(--success)', video: '#8b5cf6' }
                    return (
                      <div key={type} style={{ marginBottom: 12 }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: 13, marginBottom: 4,
                        }}>
                          <span style={{ color: 'var(--foreground-muted)' }}>{labels[type]}</span>
                          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{
                          height: 6, borderRadius: 3, background: 'var(--surface)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            background: colors[type],
                            width: `${pct}%`,
                            transition: 'width 500ms ease',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Quick Action button ── */
function QuickAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--foreground-muted)',
        cursor: 'pointer',
        fontFamily: 'var(--font)',
        fontSize: 13,
        transition: 'all 200ms ease',
        minHeight: 44,
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div style={{ width: 16, height: 16, flexShrink: 0 }}>{icon}</div>
      {label}
    </button>
  )
}

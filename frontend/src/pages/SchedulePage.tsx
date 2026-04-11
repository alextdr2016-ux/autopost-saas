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

const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

interface ScheduledPost {
  sk: string
  scheduled_at: string
  caption: string
  post_type: 'feed' | 'story'
  status: 'pending' | 'done' | 'error'
  error?: string
}

export default function SchedulePage() {
  const { t, lang } = useLanguage()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [hour, setHour] = useState('09:00')
  const [caption, setCaption] = useState('')
  const [postType, setPostType] = useState<'feed' | 'story'>('feed')

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return iso }
  }

  const load = async () => {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/scheduled`, { headers })
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

  useEffect(() => { load() }, [])

  const schedule = async () => {
    if (!caption.trim()) { setError(t('writeCaptionError')); return }
    if (!date) { setError(t('selectDateError')); return }

    setSaving(true)
    setError('')
    try {
      const headers = await getAuthHeader()
      const scheduled_at = `${date}T${hour}:00`
      const res = await fetch(`${API_URL}/scheduled`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at, caption, post_type: postType }),
      })
      if (res.ok) {
        setSuccess(t('postScheduled'))
        setCaption('')
        setTimeout(() => setSuccess(''), 3000)
        load()
      } else {
        const data = await res.json()
        setError(data.error || t('scheduleError'))
      }
    } catch {
      setError(t('connectionError'))
    } finally {
      setSaving(false)
    }
  }

  const deleteScheduled = async (sk: string) => {
    try {
      const headers = await getAuthHeader()
      await fetch(`${API_URL}/scheduled`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sk }),
      })
      setPosts(p => p.filter(x => x.sk !== sk))
    } catch {
      setError(t('deleteError'))
    }
  }

  const pending = posts.filter(p => p.status === 'pending').sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const done = posts.filter(p => p.status !== 'pending').sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))

  return (
    <div className="page-wrapper" style={{ maxWidth: 700, width: '100%' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>{t('scheduleTitle')}</h1>
      <p style={{ color: 'var(--foreground-muted)', fontSize: 14, marginBottom: 28 }}>
        {t('scheduleDesc')}
      </p>

      <section style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 16 }}>{t('newScheduledPost')}</h2>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 8 }}>
            {t('postTypeLabel')}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['feed', 'story'] as const).map(tp => (
              <button
                key={tp}
                onClick={() => setPostType(tp)}
                style={{
                  padding: '8px 20px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                  border: postType === tp ? '2px solid #3b82f6' : '1px solid var(--border)',
                  background: postType === tp ? '#eff6ff' : 'var(--bg-card)',
                  color: postType === tp ? '#1d4ed8' : 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                {tp === 'feed' ? t('feed') : t('story')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
              {t('dateLabel')}
            </label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13, color: 'var(--foreground)', outline: 'none',
                boxSizing: 'border-box', background: 'var(--bg-deep)',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
              {t('hourLabel')}
            </label>
            <select
              value={hour}
              onChange={e => setHour(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13, color: 'var(--foreground)', outline: 'none',
                boxSizing: 'border-box', background: 'var(--bg-deep)',
              }}
            >
              {HOURS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
            {t('captionLabel')}
          </label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder={t('captionPlaceholder')}
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13, color: 'var(--foreground)', outline: 'none',
              resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', background: 'var(--bg-deep)',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--foreground-dim)', marginTop: 4 }}>
            {caption.length} / 2200 {t('characters')}
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
            padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#dc2626',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
            padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#15803d', fontWeight: 500,
          }}>
            {'\u2713'} {success}
          </div>
        )}

        <button
          onClick={schedule}
          disabled={saving}
          style={{
            padding: '10px 24px', background: saving ? '#93c5fd' : '#3b82f6',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
            fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? t('scheduling') : t('schedulePost')}
        </button>
      </section>

      <section style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 16 }}>
          {t('pendingTitle')}
          {pending.length > 0 && (
            <span style={{
              marginLeft: 8, background: '#eff6ff', color: '#1d4ed8',
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            }}>{pending.length}</span>
          )}
        </h2>

        {loading ? (
          <div style={{ color: 'var(--foreground-dim)', fontSize: 13 }}>{t('loading')}</div>
        ) : pending.length === 0 ? (
          <div style={{ color: 'var(--foreground-dim)', fontSize: 13 }}>{t('noPendingPosts')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(p => (
              <div key={p.sk} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', background: 'var(--surface)',
                borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: p.post_type === 'story' ? '#fdf4ff' : '#eff6ff',
                      color: p.post_type === 'story' ? '#7c3aed' : '#1d4ed8',
                    }}>
                      {p.post_type === 'story' ? t('story') : t('feed')}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', fontFamily: 'monospace' }}>
                      {formatDate(p.scheduled_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--foreground-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {p.caption.length > 120 ? p.caption.slice(0, 120) + '...' : p.caption}
                  </div>
                </div>
                <button
                  onClick={() => deleteScheduled(p.sk)}
                  style={{
                    padding: '6px 12px', background: 'var(--bg-card)', color: '#dc2626',
                    border: '1px solid #fecaca', borderRadius: 6, fontSize: 12,
                    fontWeight: 500, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 16 }}>{t('historyTitle')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.slice(0, 20).map(p => (
              <div key={p.sk} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'var(--surface)',
                borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: p.status === 'done' ? '#10b981' : '#ef4444',
                }} />
                <span style={{ fontSize: 12, color: 'var(--foreground-dim)', fontFamily: 'monospace', flexShrink: 0 }}>
                  {formatDate(p.scheduled_at)}
                </span>
                <span style={{
                  fontSize: 11, padding: '1px 7px', borderRadius: 20, flexShrink: 0,
                  background: p.post_type === 'story' ? '#fdf4ff' : '#eff6ff',
                  color: p.post_type === 'story' ? '#7c3aed' : '#1d4ed8', fontWeight: 600,
                }}>
                  {p.post_type === 'story' ? t('story') : t('feed')}
                </span>
                <span style={{ fontSize: 13, color: 'var(--foreground-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.caption}
                </span>
                {p.status === 'error' && p.error && (
                  <span style={{ fontSize: 11, color: '#dc2626', flexShrink: 0 }}>{p.error}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

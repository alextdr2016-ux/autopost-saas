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

export default function SettingsPage() {
  const { t } = useLanguage()
  const [siteType, setSiteType] = useState<'extended' | 'shopify' | 'woo' | 'rss'>('extended')
  const [siteUrl, setSiteUrl] = useState('')
  const [times, setTimes] = useState(['09:00', '18:00'])
  const [timezone, setTimezone] = useState('Europe/Bucharest')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [postTypes, setPostTypes] = useState({ products: true, articles: true, videos: true })
  const [shopifyStore, setShopifyStore] = useState('')
  const [shopifyToken, setShopifyToken] = useState('')
  const [shopifySaved, setShopifySaved] = useState(false)
  const [shopifySaving, setShopifySaving] = useState(false)
  const [shopifyConnected, setShopifyConnected] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const headers = await getAuthHeader()
        const res = await fetch(`${API_URL}/settings`, { headers })
        if (res.ok) {
          const data = await res.json()
          if (data.site_url) setSiteUrl(data.site_url)
          if (data.site_type) setSiteType(data.site_type)
          if (data.post_times) setTimes(data.post_times)
          if (data.timezone) setTimezone(data.timezone)
          if (data.post_products !== undefined) setPostTypes(p => ({ ...p, products: data.post_products }))
          if (data.post_articles !== undefined) setPostTypes(p => ({ ...p, articles: data.post_articles }))
          if (data.post_videos !== undefined) setPostTypes(p => ({ ...p, videos: data.post_videos }))
          if (data.shopify_store) setShopifyStore(data.shopify_store)
          if (data.shopify_connected) setShopifyConnected(true)
        }
      } catch (e) {
        console.error('Error loading settings:', e)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_url: siteUrl,
          site_type: siteType,
          post_times: times,
          timezone,
          post_products: postTypes.products,
          post_articles: postTypes.articles,
          post_videos: postTypes.videos,
        })
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError(t('saveError'))
      }
    } catch (e) {
      setError(t('connectionError'))
    } finally {
      setSaving(false)
    }
  }

  const saveShopify = async () => {
    if (!shopifyToken.trim() || !shopifyStore.trim()) {
      setError(t('fillShopifyFields'))
      return
    }
    setShopifySaving(true)
    setError('')
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_shopify',
          shopify_store: shopifyStore.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
          shopify_token: shopifyToken,
        })
      })
      if (res.ok) {
        setShopifyConnected(true)
        setShopifyToken('')
        setShopifySaved(true)
        setTimeout(() => setShopifySaved(false), 3000)
      } else {
        setError(t('shopifySaveError'))
      }
    } catch {
      setError(t('connectionError'))
    } finally {
      setShopifySaving(false)
    }
  }

  const toggleTime = (t: string) => {
    setTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].sort())
  }

  const allTimes = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

  if (loading) {
    return (
      <div className="page-wrapper" style={{ color: 'var(--foreground-muted)', fontSize: 14 }}>
        {t('loadingSettings')}
      </div>
    )
  }

  const postTypeItems = [
    { key: 'products', label: t('productsLabel'), desc: t('productsDesc') },
    { key: 'articles', label: t('articlesLabel'), desc: t('articlesDesc') },
    { key: 'videos', label: t('videosLabel'), desc: t('videosSettingsDesc') },
  ]

  return (
    <div className="page-wrapper" style={{ maxWidth: 680, width: '100%' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', marginBottom: 28 }}>{t('settingsTitle')}</h1>

      <section style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 16 }}>{t('siteConnection')}</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 8 }}>
            {t('siteType')}
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'extended', label: 'Extended CMS' },
              { id: 'shopify', label: 'Shopify' },
              { id: 'woo', label: 'WooCommerce' },
              { id: 'rss', label: 'RSS Feed' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSiteType(opt.id as typeof siteType)}
                style={{
                  padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                  border: siteType === opt.id ? '2px solid #3b82f6' : '1px solid var(--border)',
                  background: siteType === opt.id ? '#eff6ff' : 'var(--bg-card)',
                  color: siteType === opt.id ? '#1d4ed8' : 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
            {siteType === 'rss' ? t('rssUrl') : t('siteApiUrl')}
          </label>
          <input
            value={siteUrl}
            onChange={e => setSiteUrl(e.target.value)}
            placeholder="https://site.ro/wp-json/wp/v2"
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13, outline: 'none', color: 'var(--foreground)', background: 'var(--bg-deep)',
            }}
          />
        </div>
      </section>

      {siteType === 'shopify' && (
        <section style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>{t('shopifyConnection')}</h2>
          <p style={{ fontSize: 13, color: 'var(--foreground-muted)', marginBottom: 16 }}>
            {t('shopifyDesc')}
          </p>

          {shopifyConnected && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {'\u2713'} {t('shopifyConnected')} — <strong>{shopifyStore}</strong>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
              {t('shopifyStoreUrl')}
            </label>
            <input
              value={shopifyStore}
              onChange={e => setShopifyStore(e.target.value)}
              placeholder="magazin.myshopify.com"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13, outline: 'none', color: 'var(--foreground)', background: 'var(--bg-deep)',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
              {t('shopifyTokenLabel')}
            </label>
            <input
              type="password"
              value={shopifyToken}
              onChange={e => setShopifyToken(e.target.value)}
              placeholder="shpat_..."
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13, outline: 'none', color: 'var(--foreground)', background: 'var(--bg-deep)',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--foreground-dim)', marginTop: 4 }}>
              {t('shopifyTokenHelp')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={saveShopify}
              disabled={shopifySaving}
              style={{
                padding: '10px 24px', background: shopifySaving ? '#6b7280' : '#5c6ac4', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: shopifySaving ? 'not-allowed' : 'pointer',
              }}
            >
              {shopifySaving ? t('saving') : t('connectShopify')}
            </button>
            {shopifySaved && (
              <span style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>{'\u2713'} {t('shopifyConnectedSuccess')}</span>
            )}
          </div>
        </section>
      )}

      <section style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 16 }}>{t('whatGetsPosted')}</h2>
        {postTypeItems.map((item, idx) => (
          <label key={item.key} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
            borderBottom: idx !== postTypeItems.length - 1 ? '1px solid var(--border)' : 'none',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={postTypes[item.key as keyof typeof postTypes]}
              onChange={() => setPostTypes(p => ({ ...p, [item.key]: !p[item.key as keyof typeof postTypes] }))}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--foreground-dim)' }}>{item.desc}</div>
            </div>
          </label>
        ))}
      </section>

      <section style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>{t('postingHours')}</h2>
        <p style={{ fontSize: 13, color: 'var(--foreground-muted)', marginBottom: 16 }}>
          {t('postingHoursDesc')} {times.join(', ')}
        </p>
        <div className="stats-grid-responsive" style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
          {allTimes.map(time => {
            const active = times.includes(time)
            return (
              <button
                key={time}
                onClick={() => toggleTime(time)}
                style={{
                  padding: '7px 4px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: active ? '2px solid #3b82f6' : '1px solid var(--border)',
                  background: active ? '#eff6ff' : 'var(--bg-card)',
                  color: active ? '#1d4ed8' : 'var(--foreground)',
                  cursor: 'pointer', fontFamily: 'monospace', textAlign: 'center',
                }}
              >{time}</button>
            )
          })}
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: 6 }}>
            {t('timezone')}
          </label>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            style={{
              padding: '8px 12px', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13, color: 'var(--foreground)', outline: 'none', background: 'var(--bg-deep)',
            }}
          >
            <option value="Europe/Bucharest">Europe/Bucharest (UTC+3 summer)</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
      </section>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '11px 28px', background: saving ? '#6b7280' : 'var(--foreground)', color: 'var(--bg-deep)',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? t('saving') : t('saveSettings')}
        </button>
        {saved && (
          <span style={{ color: '#10b981', fontSize: 14, fontWeight: 500 }}>
            {'\u2713'} {t('savedToDynamo')}
          </span>
        )}
      </div>
    </div>
  )
}

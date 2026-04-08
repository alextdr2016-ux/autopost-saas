import { useState, useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const session = await fetchAuthSession({ forceRefresh: false })
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Nu există sesiune activă')
  return { Authorization: token }
}

export default function SettingsPage() {
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
        console.error('Eroare la încărcarea setărilor:', e)
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
        setError('Eroare la salvare. Încearcă din nou.')
      }
    } catch (e) {
      setError('Eroare de conexiune.')
    } finally {
      setSaving(false)
    }
  }

  const saveShopify = async () => {
    if (!shopifyToken.trim() || !shopifyStore.trim()) {
      setError('Completează Store URL și Access Token')
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
        setError('Eroare la salvare Shopify.')
      }
    } catch {
      setError('Eroare de conexiune.')
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
      <div style={{ padding: 32, color: '#6b7280', fontSize: 14 }}>
        Se încarcă setările...
      </div>
    )
  }

  return (
    <div style={{ padding: 32, maxWidth: 680 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 28 }}>Setări</h1>

      <section style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Conectare site</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
            Tipul site-ului
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
                  border: siteType === opt.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  background: siteType === opt.id ? '#eff6ff' : '#fff',
                  color: siteType === opt.id ? '#1d4ed8' : '#374151',
                  cursor: 'pointer',
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
            {siteType === 'rss' ? 'URL feed RSS' : 'URL API site'}
          </label>
          <input
            value={siteUrl}
            onChange={e => setSiteUrl(e.target.value)}
            placeholder="https://site.ro/wp-json/wp/v2"
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 13, outline: 'none', color: '#374151',
            }}
          />
        </div>
      </section>

      {siteType === 'shopify' && (
        <section style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Conectare Shopify</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Introdu datele magazinului tău Shopify pentru a importa produse automat.
          </p>

          {shopifyConnected && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✓ Shopify conectat — <strong>{shopifyStore}</strong>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Store URL
            </label>
            <input
              value={shopifyStore}
              onChange={e => setShopifyStore(e.target.value)}
              placeholder="magazin.myshopify.com"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 13, outline: 'none', color: '#374151',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Admin API Access Token
            </label>
            <input
              type="password"
              value={shopifyToken}
              onChange={e => setShopifyToken(e.target.value)}
              placeholder="shpat_..."
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 13, outline: 'none', color: '#374151',
              }}
            />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              Găsești tokenul în Shopify Admin → Apps → Develop apps → API credentials
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
              {shopifySaving ? 'Se salvează...' : 'Conectează Shopify'}
            </button>
            {shopifySaved && (
              <span style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>✓ Shopify conectat!</span>
            )}
          </div>
        </section>
      )}

      <section style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Ce se postează</h2>
        {[
          { key: 'products', label: 'Produse', desc: 'Postări cu produse din catalog, banner generat automat' },
          { key: 'articles', label: 'Articole blog', desc: 'Postări cu articolele de pe site' },
          { key: 'videos', label: 'Videouri', desc: 'Videouri uploadate de tine, postate pe Stories și Feed' },
        ].map(item => (
          <label key={item.key} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
            borderBottom: item.key !== 'videos' ? '1px solid #f3f4f6' : 'none',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={postTypes[item.key as keyof typeof postTypes]}
              onChange={() => setPostTypes(p => ({ ...p, [item.key]: !p[item.key as keyof typeof postTypes] }))}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.desc}</div>
            </div>
          </label>
        ))}
      </section>

      <section style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Ore de postare</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Alege orele la care se vor face postările. Selectate: {times.join(', ')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 16 }}>
          {allTimes.map(t => {
            const active = times.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleTime(t)}
                style={{
                  padding: '7px 4px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: active ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  background: active ? '#eff6ff' : '#fff',
                  color: active ? '#1d4ed8' : '#374151',
                  cursor: 'pointer', fontFamily: 'monospace', textAlign: 'center',
                }}
              >{t}</button>
            )
          })}
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
            Fus orar
          </label>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            style={{
              padding: '8px 12px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 13, color: '#374151', outline: 'none',
            }}
          >
            <option value="Europe/Bucharest">Europe/Bucharest (UTC+3 vara)</option>
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
            padding: '11px 28px', background: saving ? '#6b7280' : '#111827', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Se salvează...' : 'Salvează setările'}
        </button>
        {saved && (
          <span style={{ color: '#10b981', fontSize: 14, fontWeight: 500 }}>
            ✓ Salvat în DynamoDB
          </span>
        )}
      </div>
    </div>
  )
}

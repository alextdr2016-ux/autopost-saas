import { useState, useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const session = await fetchAuthSession({ forceRefresh: false })
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Nu există sesiune activă')
  return { Authorization: token }
}

export default function ConnectFacebookPage() {
  const [fbStatus, setFbStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [pageId, setPageId] = useState('')
  const [pageToken, setPageToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const check = async () => {
      try {
        const headers = await getAuthHeader()
        const res = await fetch(`${API_URL}/settings`, { headers })
        if (res.ok) {
          const data = await res.json()
          if (data.facebook_connected) {
            setFbStatus('connected')
            setPageId(data.facebook_page_id || '')
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    check()
  }, [])

  const saveFacebook = async () => {
    if (!pageToken.trim()) {
      setError('Introdu Page Access Token-ul')
      return
    }
    setSaving(true)
    setError('')
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_facebook',
          page_id: pageId,
          page_access_token: pageToken,
        })
      })
      if (res.ok) {
        setFbStatus('connected')
        setSuccess('Facebook conectat cu succes!')
        setPageToken('')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Eroare la salvare. Încearcă din nou.')
      }
    } catch (e) {
      setError('Eroare de conexiune.')
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async () => {
    setFbStatus('disconnected')
    setPageId('')
    setSuccess('')
    setError('')
  }

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        Conectare Facebook & Instagram
      </h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
        Conectează pagina ta de Facebook pentru a activa postarea automată.
      </p>

      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
        padding: '16px 20px', marginBottom: 28,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8', marginBottom: 8 }}>
          Cum obții Page Access Token
        </div>
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          {[
            'Mergi la developers.facebook.com → Tools → Graph API Explorer',
            'Selectează aplicația ta și pagina de Facebook',
            'Adaugă permisiunile: pages_manage_posts, pages_read_engagement',
            'Generează token și copiază-l aici',
            'Pentru token permanent (60 zile) folosește Long-lived token',
          ].map((s, i) => (
            <li key={i} style={{ fontSize: 13, color: '#1e40af', marginBottom: 4 }}>{s}</li>
          ))}
        </ol>
      </div>

      {success && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8,
          padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#065f46', fontWeight: 500,
        }}>
          ✓ {success}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
        padding: 24, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 48, height: 48, background: '#1877f2', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 26, fontWeight: 900, flexShrink: 0,
          }}>f</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontWeight: 600, color: '#111827', fontSize: 16 }}>Facebook</span>
              {fbStatus === 'connected' && (
                <span style={{
                  background: '#ecfdf5', color: '#065f46', fontSize: 11,
                  fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                }}>● Conectat</span>
              )}
            </div>

            {fbStatus === 'connected' ? (
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                  Page ID: <strong style={{ color: '#374151', fontFamily: 'monospace' }}>{pageId}</strong>
                  {' '}· Token stocat în <strong style={{ color: '#374151' }}>AWS Secrets Manager</strong>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setFbStatus('disconnected')}
                    style={{
                      padding: '8px 16px', background: '#eff6ff', color: '#1d4ed8',
                      border: '1px solid #bfdbfe', borderRadius: 7, fontSize: 13,
                      fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Actualizează token
                  </button>
                  <button
                    onClick={disconnect}
                    style={{
                      padding: '8px 16px', background: '#fff', color: '#dc2626',
                      border: '1px solid #fecaca', borderRadius: 7, fontSize: 13,
                      fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Deconectează
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                    Page ID
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={e => setPageId(e.target.value)}
                    placeholder="1527633700832184"
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                      borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                    Page Access Token
                  </label>
                  <textarea
                    value={pageToken}
                    onChange={e => setPageToken(e.target.value)}
                    placeholder="EAANh..."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                      borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'monospace', resize: 'vertical',
                    }}
                  />
                </div>
                <button
                  onClick={saveFacebook}
                  disabled={saving}
                  style={{
                    padding: '10px 20px', background: saving ? '#93c5fd' : '#1877f2',
                    color: '#fff', border: 'none', borderRadius: 7, fontSize: 14,
                    fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Se salvează...' : 'Salvează & Conectează'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
        padding: 24, opacity: fbStatus !== 'connected' ? 0.5 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22,
          }}>📷</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#111827', fontSize: 16 }}>Instagram Business</span>
              {fbStatus === 'connected' && (
                <span style={{
                  background: '#ecfdf5', color: '#065f46', fontSize: 11,
                  fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                }}>● Conectat automat</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              {fbStatus === 'connected'
                ? 'Conectat prin pagina Facebook. Postările pe Instagram folosesc același token.'
                : 'Se conectează automat după conectarea Facebook-ului.'
              }
            </p>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 24, padding: '14px 18px', background: '#f9fafb',
        border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#6b7280',
      }}>
        <strong style={{ color: '#374151' }}>Securitate:</strong>{' '}
        Token-ul tău Facebook este stocat criptat în AWS Secrets Manager și nu este niciodată expus în frontend.
      </div>
    </div>
  )
}

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

export default function ConnectFacebookPage() {
  const { t } = useLanguage()
  const [fbStatus, setFbStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [pageId, setPageId] = useState('')
  const [pageToken, setPageToken] = useState('')
  const [igAccountId, setIgAccountId] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingIg, setSavingIg] = useState(false)
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
          if (data.instagram_account_id) {
            setIgAccountId(data.instagram_account_id)
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
      setError(t('enterPageToken'))
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
        setSuccess(t('fbConnectedSuccess'))
        setPageToken('')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(t('saveError'))
      }
    } catch (e) {
      setError(t('connectionError'))
    } finally {
      setSaving(false)
    }
  }

  const saveInstagram = async () => {
    if (!igAccountId.trim()) {
      setError(t('enterIgId'))
      return
    }
    setSavingIg(true)
    setError('')
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_instagram',
          instagram_account_id: igAccountId,
        })
      })
      if (res.ok) {
        setSuccess(t('igIdSaved'))
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(t('saveError'))
      }
    } catch (e) {
      setError(t('connectionError'))
    } finally {
      setSavingIg(false)
    }
  }

  const disconnect = async () => {
    setFbStatus('disconnected')
    setPageId('')
    setSuccess('')
    setError('')
  }

  const tokenSteps = [t('tokenStep1'), t('tokenStep2'), t('tokenStep3'), t('tokenStep4'), t('tokenStep5')]

  return (
    <div className="page-wrapper" style={{ maxWidth: 700, width: '100%' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>
        {t('connectTitle')}
      </h1>
      <p style={{ color: 'var(--foreground-muted)', fontSize: 14, marginBottom: 32 }}>
        {t('connectDesc')}
      </p>

      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
        padding: '16px 20px', marginBottom: 28,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8', marginBottom: 8 }}>
          {t('howToGetToken')}
        </div>
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          {tokenSteps.map((s, i) => (
            <li key={i} style={{ fontSize: 13, color: '#1e40af', marginBottom: 4 }}>{s}</li>
          ))}
        </ol>
      </div>

      {success && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8,
          padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#065f46', fontWeight: 500,
        }}>
          {'\u2713'} {success}
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
        background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)',
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
              <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: 16 }}>Facebook</span>
              {fbStatus === 'connected' && (
                <span style={{
                  background: '#ecfdf5', color: '#065f46', fontSize: 11,
                  fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                }}>{'\u25CF'} {t('connected')}</span>
              )}
            </div>

            {fbStatus === 'connected' ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--foreground-muted)', marginBottom: 16 }}>
                  Page ID: <strong style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>{pageId}</strong>
                  {' '}{'\u00B7'} {t('tokenStoredIn')} <strong style={{ color: 'var(--foreground)' }}>AWS Secrets Manager</strong>
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
                    {t('updateToken')}
                  </button>
                  <button
                    onClick={disconnect}
                    style={{
                      padding: '8px 16px', background: 'var(--bg-card)', color: '#dc2626',
                      border: '1px solid #fecaca', borderRadius: 7, fontSize: 13,
                      fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {t('disconnect')}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
                    Page ID
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={e => setPageId(e.target.value)}
                    placeholder="1527633700832184"
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'monospace', background: 'var(--bg-deep)', color: 'var(--foreground)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
                    Page Access Token
                  </label>
                  <textarea
                    value={pageToken}
                    onChange={e => setPageToken(e.target.value)}
                    placeholder="EAANh..."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'monospace', resize: 'vertical', background: 'var(--bg-deep)', color: 'var(--foreground)',
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
                  {saving ? t('saving') : t('saveAndConnect')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)',
        padding: 24, opacity: fbStatus !== 'connected' ? 0.5 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22,
          }}>{'\u{1F4F7}'}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: 16 }}>{t('igBusiness')}</span>
              {fbStatus === 'connected' && (
                <span style={{
                  background: '#ecfdf5', color: '#065f46', fontSize: 11,
                  fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                }}>{'\u25CF'} {t('igAutoConnected')}</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--foreground-muted)', marginBottom: fbStatus === 'connected' ? 16 : 0 }}>
              {fbStatus === 'connected' ? t('igConnectedViaFb') : t('igAutoAfterFb')}
            </p>
            {fbStatus === 'connected' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}>
                  Instagram Business Account ID
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={igAccountId}
                    onChange={e => setIgAccountId(e.target.value)}
                    placeholder="17841400000000000"
                    style={{
                      flex: 1, padding: '10px 12px', border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 13, outline: 'none',
                      fontFamily: 'monospace', background: 'var(--bg-deep)', color: 'var(--foreground)',
                    }}
                  />
                  <button
                    onClick={saveInstagram}
                    disabled={savingIg}
                    style={{
                      padding: '10px 16px', background: savingIg ? '#93c5fd' : '#3b82f6',
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: 13,
                      fontWeight: 600, cursor: savingIg ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {savingIg ? t('saving') : t('save')}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--foreground-dim)', marginTop: 6 }}>
                  {t('igIdHelp')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 24, padding: '14px 18px', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--foreground-muted)',
      }}>
        <strong style={{ color: 'var(--foreground)' }}>{t('security')}</strong>{' '}
        {t('securityNote')}
      </div>
    </div>
  )
}

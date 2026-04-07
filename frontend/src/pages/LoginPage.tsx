import { useState } from 'react'
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth'

type Mode = 'login' | 'signup' | 'confirm'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn({
        username: email,
        password,
        options: { authFlowType: 'USER_PASSWORD_AUTH' }
      })
      if (result.isSignedIn) {
        onLogin()
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Eroare la autentificare')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } }
      })
      setMode('confirm')
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Eroare la înregistrare')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      setSuccess('Cont verificat cu succes! Intră acum în cont.')
      setMode('login')
      setCode('')
      setPassword('')
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Cod invalid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f9fb',
    }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, background: '#3b82f6', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: '#fff', fontWeight: 700, margin: '0 auto 16px',
          }}>A</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>AutoPost</h1>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
            Postare automată pe Facebook & Instagram
          </p>
        </div>

        <div style={{
          background: '#fff', borderRadius: 12, padding: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 24 }}>
            {mode === 'login' && 'Intră în cont'}
            {mode === 'signup' && 'Creează cont nou'}
            {mode === 'confirm' && 'Verificare email'}
          </h2>

          {success && (
            <div style={{
              background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#065f46', fontWeight: 500,
            }}>
              ✓ {success}
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          {mode === 'confirm' && (
            <form onSubmit={handleConfirm}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Am trimis un cod de verificare la <strong>{email}</strong>. Verifică și inbox-ul și spam-ul.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Cod verificare
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                    borderRadius: 8, fontSize: 16, outline: 'none',
                    boxSizing: 'border-box', letterSpacing: '0.2em', textAlign: 'center',
                  }}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Se verifică...' : 'Verifică codul'}
              </button>
            </form>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={mode === 'login' ? handleLogin : handleSignUp}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                    borderRadius: 8, fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', color: '#111827',
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Parolă {mode === 'signup' && <span style={{ color: '#9ca3af', fontWeight: 400 }}>(min. 8 caractere)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                    borderRadius: 8, fontSize: 14, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading
                  ? (mode === 'login' ? 'Se conectează...' : 'Se creează contul...')
                  : (mode === 'login' ? 'Intră în cont' : 'Creează cont')
                }
              </button>
            </form>
          )}

          {mode !== 'confirm' && (
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
              {mode === 'login' ? (
                <>Nu ai cont?{' '}
                  <button onClick={() => { setMode('signup'); setError('') }}
                    style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
                    Înregistrează-te gratuit
                  </button>
                </>
              ) : (
                <>Ai deja cont?{' '}
                  <button onClick={() => { setMode('login'); setError('') }}
                    style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
                    Intră în cont
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function btnStyle(loading: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '11px', background: loading ? '#93c5fd' : '#3b82f6',
    color: '#fff', border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
  }
}

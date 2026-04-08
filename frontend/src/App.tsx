import { useState, useEffect } from 'react'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import './index.css'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ConnectFacebookPage from './pages/ConnectFacebookPage'
import VideosPage from './pages/VideosPage'
import SettingsPage from './pages/SettingsPage'
import PostsPage from './pages/PostsPage'
import CreatorPage from './pages/CreatorPage'
import SchedulePage from './pages/SchedulePage'
import Sidebar from './components/Sidebar'

export type Page = 'dashboard' | 'connect' | 'videos' | 'settings' | 'posts' | 'creator' | 'schedule'

const API_URL = import.meta.env.VITE_API_URL

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState<Page>('dashboard')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [fbConnected, setFbConnected] = useState(false)

  useEffect(() => {
    fetchAuthSession()
      .then(session => {
        if (session.tokens?.idToken) {
          setLoggedIn(true)
          // Check Facebook connection status
          const token = session.tokens.idToken.toString()
          fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
              if (data.facebook_connected || data.facebook_page_id) setFbConnected(true)
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleLogout = async () => {
    await signOut()
    setLoggedIn(false)
  }

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-deep)',
      }}>
        <div style={{ color: 'var(--foreground-muted)', fontSize: 14 }}>Se incarca...</div>
      </div>
    )
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPage={page} onNavigate={setPage} onLogout={handleLogout} fbConnected={fbConnected} />
      <main style={{ flex: 1, marginLeft: 260, overflow: 'auto' }}>
        {page === 'dashboard' && <DashboardPage onNavigate={setPage} theme={theme} onToggleTheme={toggleTheme} />}
        {page === 'connect' && <ConnectFacebookPage />}
        {page === 'videos' && <VideosPage />}
        {page === 'posts' && <PostsPage />}
        {page === 'creator' && <CreatorPage />}
        {page === 'schedule' && <SchedulePage />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

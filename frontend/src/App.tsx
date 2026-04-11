import { useState, useEffect, useCallback } from 'react'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import './index.css'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import LandingPage from './pages/LandingPage'
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

function AppInner() {
  const { t } = useLanguage()
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
        <div style={{ color: 'var(--foreground-muted)', fontSize: 14 }}>{t('loading')}</div>
      </div>
    )
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavigate = useCallback((p: Page) => {
    setPage(p)
    setMobileMenuOpen(false)
  }, [])

  if (!loggedIn) {
    return <LandingPage onLogin={() => setLoggedIn(true)} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile header */}
      <header className="mobile-header">
        <div className="mobile-header-logo">
          <div className="mobile-header-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}>
              <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z"/>
            </svg>
          </div>
          AutoPost
        </div>
        <button className="hamburger-btn" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </header>

      {/* Sidebar overlay */}
      <div className={`sidebar-overlay${mobileMenuOpen ? ' open' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      <Sidebar
        currentPage={page}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        fbConnected={fbConnected}
        mobileOpen={mobileMenuOpen}
      />
      <main className="app-main">
        {page === 'dashboard' && <DashboardPage onNavigate={handleNavigate} theme={theme} onToggleTheme={toggleTheme} />}
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

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  )
}

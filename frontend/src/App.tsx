import { useState, useEffect } from 'react'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import './index.css'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ConnectFacebookPage from './pages/ConnectFacebookPage'
import VideosPage from './pages/VideosPage'
import SettingsPage from './pages/SettingsPage'
import PostsPage from './pages/PostsPage'
import Sidebar from './components/Sidebar'

export type Page = 'dashboard' | 'connect' | 'videos' | 'settings' | 'posts'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState<Page>('dashboard')

  useEffect(() => {
    fetchAuthSession()
      .then(session => {
        if (session.tokens?.idToken) {
          setLoggedIn(true)
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const handleLogout = async () => {
    await signOut()
    setLoggedIn(false)
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
        <div style={{ color: '#6b7280', fontSize: 14 }}>Se încarcă...</div>
      </div>
    )
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fb' }}>
      <Sidebar currentPage={page} onNavigate={setPage} onLogout={handleLogout} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
        {page === 'connect' && <ConnectFacebookPage />}
        {page === 'videos' && <VideosPage />}
        {page === 'posts' && <PostsPage />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

import { type Page } from '../App'

/* ── SVG Icon components (Lucide-style, no emoji) ── */
const Icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  creator: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
    </svg>
  ),
  connect: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  videos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  posts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z"/>
    </svg>
  ),
}

const navItems: { id: Page; label: string; icon: keyof typeof Icons }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'creator', label: 'Creator postari', icon: 'creator' },
  { id: 'connect', label: 'Conexiuni', icon: 'connect' },
  { id: 'videos', label: 'Videouri', icon: 'videos' },
  { id: 'posts', label: 'Istoric postari', icon: 'posts' },
  { id: 'settings', label: 'Setari', icon: 'settings' },
]

interface Props {
  currentPage: Page
  onNavigate: (p: Page) => void
  onLogout: () => void
  fbConnected?: boolean
}

export default function Sidebar({ currentPage, onNavigate, onLogout, fbConnected = false }: Props) {
  return (
    <aside style={{
      width: 260,
      background: 'var(--bg-base)',
      borderRight: '1px solid var(--border)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 8px 24px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--accent)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 20, height: 20, color: '#fff' }}>{Icons.facebook}</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)' }}>Auto Poster</div>
          <span style={{
            fontSize: 10, background: 'var(--accent-glow)', color: 'var(--accent)',
            padding: '2px 6px', borderRadius: 4, fontWeight: 600,
          }}>PRO</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {navItems.map(item => {
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                color: active ? 'var(--accent)' : 'var(--foreground-muted)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                border: 'none',
                background: active ? 'var(--accent-glow)' : 'transparent',
                fontFamily: 'var(--font)',
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{ width: 18, height: 18, flexShrink: 0 }}>{Icons[item.icon]}</div>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--foreground-muted)',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          border: 'none',
          background: 'transparent',
          fontFamily: 'var(--font)',
          fontSize: 14,
          textAlign: 'left',
          width: '100%',
          marginBottom: 12,
        }}
      >
        <div style={{ width: 18, height: 18, flexShrink: 0 }}>{Icons.logout}</div>
        Deconectare
      </button>

      {/* Connection status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13,
        color: 'var(--foreground-muted)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
          background: fbConnected ? 'var(--success)' : 'var(--destructive)',
          boxShadow: fbConnected ? '0 0 6px var(--success)' : 'none',
        }} />
        <span>{fbConnected ? 'Facebook conectat' : 'Facebook neconectat'}</span>
      </div>
    </aside>
  )
}

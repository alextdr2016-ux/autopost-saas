import { type Page } from '../App'

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'connect', label: 'Facebook / Instagram', icon: '⇄' },
  { id: 'videos', label: 'Videouri', icon: '▶' },
  { id: 'posts', label: 'Istoric postări', icon: '≡' },
  { id: 'settings', label: 'Setări', icon: '⚙' },
] as const

interface Props {
  currentPage: Page
  onNavigate: (p: Page) => void
  onLogout: () => void
}

export default function Sidebar({ currentPage, onNavigate, onLogout }: Props) {
  return (
    <aside style={{
      width: 220,
      background: '#111827',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
      minHeight: '100vh',
    }}>
      <div style={{ padding: '0 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#3b82f6',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#fff', fontWeight: 700,
          }}>A</div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>AutoPost</span>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        {nav.map(item => {
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Page)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '10px 20px',
                background: active ? '#1e3a5f' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: active ? '#60a5fa' : '#9ca3af',
                fontSize: 14, textAlign: 'left',
                borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#d1d5db', fontWeight: 600,
          }}>A</div>
          <div>
            <div style={{ color: '#f9fafb', fontSize: 13, fontWeight: 500 }}>Alex</div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Plan Pro</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '8px', border: '1px solid #374151',
            borderRadius: 6, background: 'transparent',
            color: '#6b7280', fontSize: 13, cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

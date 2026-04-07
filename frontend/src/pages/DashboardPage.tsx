import { type Page } from '../App'

const stats = [
  { label: 'Postări azi', value: '4', sub: '2 programate', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Postări luna aceasta', value: '47', sub: '+12% față de luna trecută', color: '#10b981', bg: '#ecfdf5' },
  { label: 'Videouri în așteptare', value: '3', sub: 'Gata de postare', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Conturi conectate', value: '2', sub: 'Facebook + Instagram', color: '#8b5cf6', bg: '#f5f3ff' },
]

const recentPosts = [
  { time: '09:00', type: 'Produs', title: 'Rochie de vară flori', platform: 'Facebook + Instagram', status: 'Postat', statusColor: '#10b981' },
  { time: '12:30', type: 'Video', title: 'Story promo weekend', platform: 'Instagram Story', status: 'Postat', statusColor: '#10b981' },
  { time: '18:00', type: 'Articol', title: 'Top 5 tendințe 2025', platform: 'Facebook', status: 'Programat', statusColor: '#3b82f6' },
  { time: '20:00', type: 'Produs', title: 'Geantă piele naturală', platform: 'Facebook + Instagram', status: 'Programat', statusColor: '#3b82f6' },
]

interface Props { onNavigate: (p: Page) => void }

export default function DashboardPage({ onNavigate }: Props) {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Bun venit în AutoPost</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 10, padding: 20,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              display: 'inline-block', padding: '6px 10px', borderRadius: 8,
              background: s.bg, color: s.color, fontSize: 22, fontWeight: 700, marginBottom: 10,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10,
        padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, color: '#92400e', fontSize: 14 }}>
            Token Facebook expiră în 8 zile
          </span>
          <span style={{ color: '#b45309', fontSize: 13, marginLeft: 8 }}>
            Reconectează pagina pentru a nu întrerupe postările.
          </span>
        </div>
        <button
          onClick={() => onNavigate('connect')}
          style={{
            background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6,
            padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Reconectează
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Postări astăzi</h2>
          <button
            onClick={() => onNavigate('posts')}
            style={{ fontSize: 13, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Vezi toate →
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Ora', 'Tip', 'Titlu', 'Platformă', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentPosts.map((p, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 20px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>{p.time}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                    background: p.type === 'Video' ? '#f5f3ff' : p.type === 'Articol' ? '#ecfdf5' : '#eff6ff',
                    color: p.type === 'Video' ? '#7c3aed' : p.type === 'Articol' ? '#065f46' : '#1e40af',
                  }}>{p.type}</span>
                </td>
                <td style={{ padding: '12px 20px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{p.title}</td>
                <td style={{ padding: '12px 20px', fontSize: 13, color: '#6b7280' }}>{p.platform}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{ fontSize: 13, color: p.statusColor, fontWeight: 500 }}>● {p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

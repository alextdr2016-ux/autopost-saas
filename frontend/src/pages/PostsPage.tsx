const posts = [
  { date: '6 Apr', time: '09:00', type: 'Produs', title: 'Rochie de vară cu imprimeu floral', platform: 'Facebook + Instagram', status: 'Postat', reach: '1,240', likes: '47' },
  { date: '6 Apr', time: '12:30', type: 'Video', title: 'Story promo weekend -20%', platform: 'Instagram Story', status: 'Postat', reach: '890', likes: '—' },
  { date: '6 Apr', time: '18:00', type: 'Articol', title: 'Top 5 tendințe fashion 2025', platform: 'Facebook', status: 'Programat', reach: '—', likes: '—' },
  { date: '5 Apr', time: '09:00', type: 'Produs', title: 'Geantă piele naturală premium', platform: 'Facebook + Instagram', status: 'Postat', reach: '2,100', likes: '83' },
  { date: '5 Apr', time: '18:00', type: 'Produs', title: 'Sandale platformă vara 2025', platform: 'Facebook + Instagram', status: 'Postat', reach: '980', likes: '31' },
  { date: '4 Apr', time: '09:00', type: 'Video', title: 'Lookbook primăvară', platform: 'Facebook + Instagram', status: 'Postat', reach: '3,450', likes: '142' },
  { date: '4 Apr', time: '18:00', type: 'Produs', title: 'Bluză linen casual', platform: 'Facebook', status: 'Eșuat', reach: '—', likes: '—' },
]

const typeColors: Record<string, [string, string]> = {
  Produs: ['#eff6ff', '#1e40af'],
  Video: ['#f5f3ff', '#5b21b6'],
  Articol: ['#ecfdf5', '#065f46'],
}

const statusColor: Record<string, string> = {
  Postat: '#10b981',
  Programat: '#3b82f6',
  Eșuat: '#ef4444',
}

export default function PostsPage() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Istoric postări</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Toate postările tale, ordonate cronologic.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Toate', 'Postate', 'Programate', 'Eșuate'].map(f => (
            <button key={f} style={{
              padding: '7px 14px', border: '1px solid #e5e7eb',
              borderRadius: 7, fontSize: 13, background: f === 'Toate' ? '#111827' : '#fff',
              color: f === 'Toate' ? '#fff' : '#374151', cursor: 'pointer', fontWeight: 500,
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Data', 'Tip', 'Titlu', 'Platformă', 'Reach', 'Like-uri', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '10px 18px', textAlign: 'left', fontSize: 12,
                  fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((p, i) => {
              const [tbg, tc] = typeColors[p.type] ?? ['#f3f4f6', '#374151']
              return (
                <tr key={i} style={{
                  borderTop: '1px solid #f3f4f6',
                  background: p.status === 'Eșuat' ? '#fff5f5' : undefined,
                }}>
                  <td style={{ padding: '12px 18px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {p.date} <span style={{ fontFamily: 'monospace' }}>{p.time}</span>
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: tbg, color: tc, fontWeight: 600 }}>
                      {p.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', fontSize: 13, color: '#374151', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </td>
                  <td style={{ padding: '12px 18px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>{p.platform}</td>
                  <td style={{ padding: '12px 18px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{p.reach}</td>
                  <td style={{ padding: '12px 18px', fontSize: 13, color: '#374151' }}>{p.likes}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ fontSize: 13, color: statusColor[p.status], fontWeight: 500 }}>
                      ● {p.status}
                    </span>
                    {p.status === 'Eșuat' && (
                      <button style={{
                        marginLeft: 8, fontSize: 11, padding: '2px 8px',
                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                        borderRadius: 4, cursor: 'pointer',
                      }}>Repostează</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

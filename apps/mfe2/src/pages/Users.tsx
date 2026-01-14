import { Link } from 'react-router-dom'

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Viewer' },
  { id: 4, name: 'David Brown', email: 'david@example.com', role: 'Editor' },
]

export default function Users({ basePath = '' }: { basePath?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ marginTop: 0, color: '#42b883' }}>Users</h2>
        <Link
          to={basePath || '/mfe2'}
          style={{ color: '#42b883', textDecoration: 'none' }}
        >
          &larr; Back
        </Link>
      </div>

      <table style={{
        width: '100%',
        marginTop: '20px',
        borderCollapse: 'collapse',
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '12px' }}>{user.name}</td>
              <td style={{ padding: '12px', color: '#888' }}>{user.email}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  backgroundColor: '#42b88333',
                  color: '#42b883',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                }}>
                  {user.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

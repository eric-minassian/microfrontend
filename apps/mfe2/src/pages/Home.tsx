import { Link } from 'react-router-dom'
import { useUser } from 'shell/useUser'

export default function Home({ basePath = '' }: { basePath?: string }) {
  const { user, isAuthenticated } = useUser()

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#42b883' }}>User Management</h2>
      <p>Welcome to MFE2 - User Management Module</p>

      {isAuthenticated && user && (
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #42b88333',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
            Logged in as <strong style={{ color: '#fff' }}>{user.name}</strong> ({user.role})
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
            User context provided by Shell via Module Federation
          </p>
          {user.role === 'admin' && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#42b883' }}>
              You have admin access to manage users
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <Link
          to={`${basePath}/users`}
          style={{
            padding: '10px 20px',
            backgroundColor: '#42b883',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          View Users
        </Link>
        <Link
          to={`${basePath}/roles`}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#42b883',
            border: '1px solid #42b883',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          Roles
        </Link>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useUser } from 'shell/useUser'

export default function Home({ basePath = '' }: { basePath?: string }) {
  const { user, isAuthenticated } = useUser()

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#646cff' }}>Product Catalog</h2>
      <p>Welcome to MFE1 - Product Catalog Module</p>

      {isAuthenticated && user && (
        <div style={{
          backgroundColor: '#1a1a2e',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #646cff33',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
            Logged in as <strong style={{ color: '#fff' }}>{user.name}</strong> ({user.role})
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
            User context provided by Shell via Module Federation
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <Link
          to={`${basePath}/products`}
          style={{
            padding: '10px 20px',
            backgroundColor: '#646cff',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          View Products
        </Link>
        <Link
          to={`${basePath}/categories`}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#646cff',
            border: '1px solid #646cff',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          Categories
        </Link>
      </div>
    </div>
  )
}

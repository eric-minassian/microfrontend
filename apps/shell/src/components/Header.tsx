import { Link, useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/mfe1', label: 'MFE1' },
  { path: '/mfe2', label: 'MFE2' },
]

export default function Header() {
  const location = useLocation()
  const { user, isAuthenticated, logout, login } = useUser()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogin = () => {
    login({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
    })
  }

  return (
    <header style={{
      backgroundColor: '#1a1a2e',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #333',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#fff',
        }}>
          MicroFrontend Shell
        </h1>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: isActive(path) ? '#fff' : '#888',
                backgroundColor: isActive(path) ? '#646cff' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isAuthenticated && user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#333',
                }}
              />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', color: '#fff' }}>{user.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{user.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #666',
                borderRadius: '4px',
                color: '#888',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={handleLogin}
            style={{
              padding: '8px 16px',
              backgroundColor: '#646cff',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Login
          </button>
        )}
      </div>
    </header>
  )
}

import { Link } from 'react-router-dom'

const roles = [
  { id: 1, name: 'Admin', permissions: ['read', 'write', 'delete', 'manage'] },
  { id: 2, name: 'Editor', permissions: ['read', 'write'] },
  { id: 3, name: 'Viewer', permissions: ['read'] },
]

export default function Roles({ basePath = '' }: { basePath?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ marginTop: 0, color: '#42b883' }}>Roles</h2>
        <Link
          to={basePath || '/mfe2'}
          style={{ color: '#42b883', textDecoration: 'none' }}
        >
          &larr; Back
        </Link>
      </div>

      <div style={{ marginTop: '20px' }}>
        {roles.map(role => (
          <div
            key={role.id}
            style={{
              backgroundColor: '#1a1a2e',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #333',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#42b883' }}>{role.name}</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {role.permissions.map(permission => (
                <span
                  key={permission}
                  style={{
                    backgroundColor: '#333',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#fff',
                  }}
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

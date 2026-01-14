import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <p>Welcome to the Microfrontend Shell Dashboard.</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '24px',
      }}>
        <DashboardCard
          title="MFE1 - Product Catalog"
          description="Browse and manage products in the catalog."
          linkTo="/mfe1"
          color="#646cff"
        />
        <DashboardCard
          title="MFE2 - User Management"
          description="Manage users, roles, and permissions."
          linkTo="/mfe2"
          color="#42b883"
        />
      </div>
    </div>
  )
}

function DashboardCard({
  title,
  description,
  linkTo,
  color
}: {
  title: string
  description: string
  linkTo: string
  color: string
}) {
  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${color}33`,
    }}>
      <h3 style={{ margin: '0 0 12px 0', color }}>{title}</h3>
      <p style={{ margin: '0 0 16px 0', color: '#888' }}>{description}</p>
      <Link
        to={linkTo}
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          backgroundColor: color,
          color: '#fff',
          borderRadius: '6px',
          textDecoration: 'none',
        }}
      >
        Open
      </Link>
    </div>
  )
}

import { Link } from 'react-router-dom'

const categories = [
  { id: 1, name: 'Electronics', count: 42 },
  { id: 2, name: 'Furniture', count: 18 },
  { id: 3, name: 'Clothing', count: 95 },
  { id: 4, name: 'Books', count: 234 },
]

export default function Categories({ basePath = '' }: { basePath?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ marginTop: 0, color: '#646cff' }}>Categories</h2>
        <Link
          to={basePath || '/mfe1'}
          style={{ color: '#646cff', textDecoration: 'none' }}
        >
          &larr; Back
        </Link>
      </div>

      <div style={{ marginTop: '20px' }}>
        {categories.map(category => (
          <div
            key={category.id}
            style={{
              backgroundColor: '#1a1a2e',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #333',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{category.name}</span>
            <span style={{
              backgroundColor: '#646cff33',
              color: '#646cff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px',
            }}>
              {category.count} items
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

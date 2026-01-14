import { Link } from 'react-router-dom'

const products = [
  { id: 1, name: 'Laptop Pro', price: 1299, category: 'Electronics' },
  { id: 2, name: 'Wireless Mouse', price: 49, category: 'Electronics' },
  { id: 3, name: 'Standing Desk', price: 599, category: 'Furniture' },
  { id: 4, name: 'Monitor 27"', price: 399, category: 'Electronics' },
]

export default function Products({ basePath = '' }: { basePath?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ marginTop: 0, color: '#646cff' }}>Products</h2>
        <Link
          to={basePath || '/mfe1'}
          style={{ color: '#646cff', textDecoration: 'none' }}
        >
          &larr; Back
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '20px',
      }}>
        {products.map(product => (
          <div
            key={product.id}
            style={{
              backgroundColor: '#1a1a2e',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #333',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{product.name}</h3>
            <p style={{ margin: '0 0 8px 0', color: '#888', fontSize: '14px' }}>
              {product.category}
            </p>
            <p style={{ margin: 0, color: '#646cff', fontWeight: 'bold' }}>
              ${product.price}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

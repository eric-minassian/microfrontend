import { useNavigate } from 'react-router-dom'
import {
  ContentLayout,
  Header,
  Table,
  Box,
  SpaceBetween,
  Button,
  Badge,
} from '@cloudscape-design/components'

const products = [
  { id: 1, name: 'Laptop Pro', price: 1299, category: 'Electronics', status: 'In Stock' },
  { id: 2, name: 'Wireless Mouse', price: 49, category: 'Electronics', status: 'In Stock' },
  { id: 3, name: 'Standing Desk', price: 599, category: 'Furniture', status: 'Low Stock' },
  { id: 4, name: 'Monitor 27"', price: 399, category: 'Electronics', status: 'In Stock' },
  { id: 5, name: 'Ergonomic Chair', price: 449, category: 'Furniture', status: 'Out of Stock' },
]

export default function Products({ basePath = '' }: { basePath?: string }) {
  const navigate = useNavigate()

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate(basePath || '/mfe1')}>
                Back
              </Button>
              <Button variant="primary">Add Product</Button>
            </SpaceBetween>
          }
        >
          Products
        </Header>
      }
    >
      <Table
        columnDefinitions={[
          {
            id: 'name',
            header: 'Name',
            cell: item => item.name,
            sortingField: 'name',
          },
          {
            id: 'category',
            header: 'Category',
            cell: item => item.category,
            sortingField: 'category',
          },
          {
            id: 'price',
            header: 'Price',
            cell: item => `$${item.price.toLocaleString()}`,
            sortingField: 'price',
          },
          {
            id: 'status',
            header: 'Status',
            cell: item => (
              <Badge
                color={
                  item.status === 'In Stock'
                    ? 'green'
                    : item.status === 'Low Stock'
                    ? 'blue'
                    : 'red'
                }
              >
                {item.status}
              </Badge>
            ),
          },
        ]}
        items={products}
        sortingDisabled
        variant="full-page"
        stickyHeader
        empty={
          <Box textAlign="center" color="inherit">
            <b>No products</b>
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              No products to display.
            </Box>
            <Button>Add product</Button>
          </Box>
        }
        header={
          <Header
            counter={`(${products.length})`}
          >
            All Products
          </Header>
        }
      />
    </ContentLayout>
  )
}

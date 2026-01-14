import { useNavigate } from 'react-router-dom'
import {
  ContentLayout,
  Header,
  Container,
  SpaceBetween,
  Button,
  Alert,
  ColumnLayout,
  Box,
} from '@cloudscape-design/components'
import { useUser } from 'shell/useUser'

export default function Home({ basePath = '' }: { basePath?: string }) {
  const { user, isAuthenticated } = useUser()
  const navigate = useNavigate()

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Browse and manage your product inventory"
        >
          Product Catalog
        </Header>
      }
    >
      <SpaceBetween size="l">
        {isAuthenticated && user && (
          <Alert
            type="info"
            header={`Welcome, ${user.name}`}
          >
            You are logged in as <strong>{user.role}</strong>. User context is
            provided by the Shell via Module Federation.
          </Alert>
        )}

        <Container
          header={
            <Header
              variant="h2"
              description="Quick access to catalog features"
            >
              Quick Actions
            </Header>
          }
        >
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Products</Box>
              <Box variant="p" padding={{ bottom: 's' }}>
                View and manage your product inventory
              </Box>
              <Button
                variant="primary"
                onClick={() => navigate(`${basePath}/products`)}
              >
                View Products
              </Button>
            </div>
            <div>
              <Box variant="awsui-key-label">Categories</Box>
              <Box variant="p" padding={{ bottom: 's' }}>
                Organize products into categories
              </Box>
              <Button
                variant="normal"
                onClick={() => navigate(`${basePath}/categories`)}
              >
                View Categories
              </Button>
            </div>
          </ColumnLayout>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  )
}

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
          description="Manage users, roles, and permissions"
        >
          User Management
        </Header>
      }
    >
      <SpaceBetween size="l">
        {isAuthenticated && user && (
          <Alert
            type={user.role === 'admin' ? 'success' : 'info'}
            header={`Welcome, ${user.name}`}
          >
            You are logged in as <strong>{user.role}</strong>.
            {user.role === 'admin' && ' You have full administrative access to manage users.'}
            <Box variant="small" color="text-body-secondary" padding={{ top: 'xs' }}>
              User context provided by Shell via Module Federation.
            </Box>
          </Alert>
        )}

        <Container
          header={
            <Header
              variant="h2"
              description="Quick access to user management features"
            >
              Quick Actions
            </Header>
          }
        >
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Users</Box>
              <Box variant="p" padding={{ bottom: 's' }}>
                View and manage user accounts
              </Box>
              <Button
                variant="primary"
                onClick={() => navigate(`${basePath}/users`)}
              >
                View Users
              </Button>
            </div>
            <div>
              <Box variant="awsui-key-label">Roles</Box>
              <Box variant="p" padding={{ bottom: 's' }}>
                Configure roles and permissions
              </Box>
              <Button
                variant="normal"
                onClick={() => navigate(`${basePath}/roles`)}
              >
                View Roles
              </Button>
            </div>
          </ColumnLayout>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  )
}

import { useNavigate } from 'react-router-dom'
import {
  ContentLayout,
  Header,
  Container,
  Box,
  SpaceBetween,
  Button,
  Badge,
  ColumnLayout,
} from '@cloudscape-design/components'

const roles = [
  { id: 1, name: 'Admin', description: 'Full system access', permissions: ['read', 'write', 'delete', 'manage'] },
  { id: 2, name: 'Editor', description: 'Can edit content', permissions: ['read', 'write'] },
  { id: 3, name: 'Viewer', description: 'Read-only access', permissions: ['read'] },
]

export default function Roles({ basePath = '' }: { basePath?: string }) {
  const navigate = useNavigate()

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate(basePath || '/mfe2')}>
                Back
              </Button>
              <Button variant="primary">Add Role</Button>
            </SpaceBetween>
          }
        >
          Roles
        </Header>
      }
    >
      <SpaceBetween size="l">
        {roles.map(role => (
          <Container
            key={role.id}
            header={
              <Header
                variant="h2"
                description={role.description}
                actions={
                  <Button iconName="edit">Edit</Button>
                }
              >
                {role.name}
              </Header>
            }
          >
            <ColumnLayout columns={1}>
              <div>
                <Box variant="awsui-key-label">Permissions</Box>
                <Box padding={{ top: 'xs' }}>
                  <SpaceBetween direction="horizontal" size="xs">
                    {role.permissions.map(permission => (
                      <Badge key={permission} color="blue">
                        {permission}
                      </Badge>
                    ))}
                  </SpaceBetween>
                </Box>
              </div>
            </ColumnLayout>
          </Container>
        ))}
      </SpaceBetween>
    </ContentLayout>
  )
}

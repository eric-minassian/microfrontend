import { useNavigate } from 'react-router-dom'
import {
  ContentLayout,
  Header,
  Table,
  Box,
  SpaceBetween,
  Button,
  Badge,
  StatusIndicator,
} from '@cloudscape-design/components'

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Viewer', status: 'Inactive' },
  { id: 4, name: 'David Brown', email: 'david@example.com', role: 'Editor', status: 'Active' },
  { id: 5, name: 'Eve Wilson', email: 'eve@example.com', role: 'Viewer', status: 'Active' },
]

export default function Users({ basePath = '' }: { basePath?: string }) {
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
              <Button variant="primary">Add User</Button>
            </SpaceBetween>
          }
        >
          Users
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
            id: 'email',
            header: 'Email',
            cell: item => item.email,
          },
          {
            id: 'role',
            header: 'Role',
            cell: item => (
              <Badge
                color={
                  item.role === 'Admin'
                    ? 'red'
                    : item.role === 'Editor'
                    ? 'blue'
                    : 'grey'
                }
              >
                {item.role}
              </Badge>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            cell: item => (
              <StatusIndicator type={item.status === 'Active' ? 'success' : 'stopped'}>
                {item.status}
              </StatusIndicator>
            ),
          },
        ]}
        items={users}
        sortingDisabled
        variant="full-page"
        stickyHeader
        empty={
          <Box textAlign="center" color="inherit">
            <b>No users</b>
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              No users to display.
            </Box>
            <Button>Add user</Button>
          </Box>
        }
        header={
          <Header
            counter={`(${users.length})`}
          >
            All Users
          </Header>
        }
      />
    </ContentLayout>
  )
}

import { useNavigate } from 'react-router-dom'
import {
  ContentLayout,
  Header,
  Container,
  Cards,
  Box,
  SpaceBetween,
  Button,
  Link,
} from '@cloudscape-design/components'
import { mfeList } from '../mfe-registry'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Central hub for all microfrontend applications"
        >
          Dashboard
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Container
          header={
            <Header
              variant="h2"
              description="Select a microfrontend to get started"
            >
              Available Services
            </Header>
          }
        >
          <Cards
            cardDefinition={{
              header: item => (
                <Link
                  fontSize="heading-m"
                  onFollow={(e) => {
                    e.preventDefault()
                    navigate(item.routePath)
                  }}
                >
                  {item.displayName}
                </Link>
              ),
              sections: [
                {
                  id: 'description',
                  content: item => item.description,
                },
                {
                  id: 'team',
                  header: 'Team',
                  content: item => item.team,
                },
                {
                  id: 'actions',
                  content: item => (
                    <Button
                      variant="primary"
                      onClick={() => navigate(item.routePath)}
                    >
                      Open
                    </Button>
                  ),
                },
              ],
            }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 },
            ]}
            items={mfeList}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No microfrontends registered</b>
                <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                  Add MFEs to the registry to see them here.
                </Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>
    </ContentLayout>
  )
}

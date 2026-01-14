import { useNavigate } from 'react-router-dom'
import {
  ContentLayout,
  Header,
  Cards,
  Box,
  SpaceBetween,
  Button,
  Badge,
} from '@cloudscape-design/components'

const categories = [
  { id: 1, name: 'Electronics', count: 42, description: 'Computers, phones, and accessories' },
  { id: 2, name: 'Furniture', count: 18, description: 'Office and home furniture' },
  { id: 3, name: 'Clothing', count: 95, description: 'Apparel and accessories' },
  { id: 4, name: 'Books', count: 234, description: 'Physical and digital books' },
]

export default function Categories({ basePath = '' }: { basePath?: string }) {
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
              <Button variant="primary">Add Category</Button>
            </SpaceBetween>
          }
        >
          Categories
        </Header>
      }
    >
      <Cards
        cardDefinition={{
          header: item => item.name,
          sections: [
            {
              id: 'description',
              content: item => item.description,
            },
            {
              id: 'count',
              header: 'Products',
              content: item => (
                <Badge color="blue">{item.count} items</Badge>
              ),
            },
          ],
        }}
        cardsPerRow={[
          { cards: 1 },
          { minWidth: 400, cards: 2 },
          { minWidth: 700, cards: 3 },
        ]}
        items={categories}
        header={
          <Header
            counter={`(${categories.length})`}
          >
            All Categories
          </Header>
        }
        empty={
          <Box textAlign="center" color="inherit">
            <b>No categories</b>
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              No categories to display.
            </Box>
            <Button>Add category</Button>
          </Box>
        }
      />
    </ContentLayout>
  )
}

import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Spinner } from '@cloudscape-design/components'
import '@cloudscape-design/global-styles/index.css'

// Lazy load the main App to improve initial paint
const App = lazy(() => import('./App.tsx'))

const CenteredSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spinner size="large" />
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<CenteredSpinner />}>
      <App />
    </Suspense>
  </StrictMode>,
)

/**
 * Dynamic MFE Routes Component
 *
 * Automatically generates routes for all registered MFEs.
 * When a new MFE is added to the registry, it will automatically
 * be available as a route - no code changes needed here.
 */

import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Header,
  Spinner,
  StatusIndicator,
} from '@cloudscape-design/components'
import { ErrorBoundary } from '@mfe-platform/core/react'
import type { MfeConfig } from '@mfe-platform/core/types'
import { mfeList } from '../mfe-registry'

/**
 * Cache for lazy-loaded MFE components
 * This ensures we only create each lazy component once
 */
const mfeComponentCache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<{ basePath?: string }>>
>()

/**
 * Get or create a lazy-loaded component for an MFE
 */
function getMfeComponent(mfeName: string) {
  if (!mfeComponentCache.has(mfeName)) {
    // Dynamic import based on MFE name
    // The module name must match what's configured in Module Federation
    const LazyComponent = lazy(() => {
      switch (mfeName) {
        case 'mfe1':
          return import('mfe1/App')
        case 'mfe2':
          return import('mfe2/App')
        default:
          return Promise.reject(new Error(`Unknown MFE: ${mfeName}`))
      }
    })
    mfeComponentCache.set(mfeName, LazyComponent)
  }
  return mfeComponentCache.get(mfeName)!
}

/**
 * Loading spinner component for MFE loading states
 */
function MfeLoadingSpinner({ name }: { name: string }) {
  return (
    <Container>
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" padding={{ top: 's' }}>
          Loading {name}...
        </Box>
      </Box>
    </Container>
  )
}

/**
 * Error fallback component for MFE errors
 */
function MfeErrorFallback({
  mfeName,
  error,
  retry,
}: {
  mfeName: string
  error: Error
  retry: () => void
}) {
  return (
    <Container
      header={
        <Header variant="h2">
          <StatusIndicator type="error">
            Failed to load {mfeName}
          </StatusIndicator>
        </Header>
      }
    >
      <Box padding="l">
        <Box variant="p" color="text-status-error" padding={{ bottom: 'm' }}>
          {error.message}
        </Box>
        <Button onClick={retry} iconName="refresh">
          Retry
        </Button>
      </Box>
    </Container>
  )
}

/**
 * Props for individual MFE wrapper
 */
interface MfeWrapperProps {
  mfe: MfeConfig
}

/**
 * Wrapper component that handles loading and error states for a single MFE
 */
function MfeWrapper({ mfe }: MfeWrapperProps) {
  const MfeComponent = getMfeComponent(mfe.name)

  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <MfeErrorFallback mfeName={mfe.displayName} error={error} retry={retry} />
      )}
    >
      <Suspense fallback={<MfeLoadingSpinner name={mfe.displayName} />}>
        <MfeComponent basePath={mfe.routePath} />
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * Generates Route elements for all registered MFEs
 *
 * Usage in App.tsx:
 * ```tsx
 * <Routes>
 *   <Route path="/" element={<Dashboard />} />
 *   {generateMfeRoutes()}
 * </Routes>
 * ```
 */
export function generateMfeRoutes() {
  return mfeList.map((mfe) => (
    <Route
      key={mfe.name}
      path={`${mfe.routePath}/*`}
      element={<MfeWrapper mfe={mfe} />}
    />
  ))
}

/**
 * Pre-built routes array that can be spread into Routes component
 * Useful when you need more control over route ordering
 */
export const mfeRoutes = mfeList.map((mfe) => ({
  path: `${mfe.routePath}/*`,
  element: <MfeWrapper mfe={mfe} />,
  mfe,
}))

export { MfeWrapper }

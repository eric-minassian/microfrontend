/**
 * Dynamic MFE Routes Component
 *
 * Automatically generates routes for all registered MFEs.
 * When a new MFE is added to the registry, it will automatically
 * be available as a route - no code changes needed here.
 */

import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import { ErrorBoundary, LoadingSpinner } from '@mfe-platform/core/react'
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
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            Failed to load {mfe.displayName}
          </h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{error.message}</p>
          <button
            onClick={retry}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}
    >
      <Suspense fallback={<LoadingSpinner name={mfe.displayName} />}>
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

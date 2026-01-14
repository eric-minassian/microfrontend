/**
 * React Components and Utilities for MFE Platform
 *
 * These components help MFE teams integrate with the platform
 * and handle common patterns like error boundaries and loading states.
 */

import {
  Component,
  Suspense,
  lazy,
  type ComponentType,
  type ReactNode,
  type ErrorInfo,
} from 'react'
import type { MfeAppProps } from './types.js'

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  retry,
}: {
  error: Error
  retry: () => void
}) {
  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#dc2626',
      }}
    >
      <h3 style={{ marginBottom: '1rem' }}>Something went wrong</h3>
      <p style={{ marginBottom: '1rem', color: '#666' }}>{error.message}</p>
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
        Try Again
      </button>
    </div>
  )
}

/**
 * Error Boundary component for catching and handling errors in MFEs
 *
 * @example
 * ```tsx
 * import { ErrorBoundary } from '@mfe-platform/core/react'
 *
 * function App() {
 *   return (
 *     <ErrorBoundary>
 *       <MyMfeContent />
 *     </ErrorBoundary>
 *   )
 * }
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback ?? DefaultErrorFallback
      return <Fallback error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

/**
 * Props for the LoadingSpinner component
 */
interface LoadingSpinnerProps {
  /** Name of the MFE being loaded */
  name?: string
  /** Optional custom message */
  message?: string
}

/**
 * Default loading spinner component
 *
 * @example
 * ```tsx
 * import { LoadingSpinner } from '@mfe-platform/core/react'
 *
 * <Suspense fallback={<LoadingSpinner name="Product Catalog" />}>
 *   <MfeApp />
 * </Suspense>
 * ```
 */
export function LoadingSpinner({ name, message }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ color: '#6b7280', margin: 0 }}>
        {message ?? (name ? `Loading ${name}...` : 'Loading...')}
      </p>
    </div>
  )
}

/**
 * Type for the lazy-loaded MFE component factory
 */
type MfeImportFactory = () => Promise<{ default: ComponentType<MfeAppProps> }>

/**
 * Creates a lazy-loaded MFE component with error boundary and suspense built-in
 *
 * This is the recommended way to load MFEs in the shell application.
 *
 * @example
 * ```tsx
 * // In shell/src/App.tsx
 * import { createMfeLoader } from '@mfe-platform/core/react'
 *
 * const CatalogMfe = createMfeLoader({
 *   name: 'catalog',
 *   displayName: 'Product Catalog',
 *   importFn: () => import('catalog/App'),
 * })
 *
 * // Use in routes
 * <Route path="/catalog/*" element={<CatalogMfe basePath="/catalog" />} />
 * ```
 */
export function createMfeLoader(options: {
  name: string
  displayName: string
  importFn: MfeImportFactory
  fallback?: ReactNode
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>
}): ComponentType<MfeAppProps> {
  const { displayName, importFn, fallback, errorFallback } = options

  const LazyMfe = lazy(importFn)

  return function MfeLoader(props: MfeAppProps) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense
          fallback={fallback ?? <LoadingSpinner name={displayName} />}
        >
          <LazyMfe {...props} />
        </Suspense>
      </ErrorBoundary>
    )
  }
}

/**
 * Hook to get the base path from props or context
 * Useful for building navigation links within an MFE
 *
 * @example
 * ```tsx
 * import { useBasePath } from '@mfe-platform/core/react'
 *
 * function ProductList({ basePath }: MfeAppProps) {
 *   const base = useBasePath(basePath, '/catalog')
 *   return <Link to={`${base}/products/123`}>View Product</Link>
 * }
 * ```
 */
export function useBasePath(
  basePath: string | undefined,
  defaultPath: string
): string {
  return basePath ?? defaultPath
}

/**
 * Creates navigation utilities for an MFE
 *
 * @example
 * ```tsx
 * import { createMfeNavigation } from '@mfe-platform/core/react'
 *
 * const nav = createMfeNavigation('/catalog')
 *
 * // In component
 * <Link to={nav.to('/products')}>Products</Link>
 * // Results in: /catalog/products
 * ```
 */
export function createMfeNavigation(basePath: string) {
  const normalizedBase = basePath.endsWith('/')
    ? basePath.slice(0, -1)
    : basePath

  return {
    /**
     * Creates a full path from a relative path
     */
    to: (relativePath: string) => {
      const normalizedPath = relativePath.startsWith('/')
        ? relativePath
        : `/${relativePath}`
      return `${normalizedBase}${normalizedPath}`
    },

    /**
     * The base path for this MFE
     */
    basePath: normalizedBase,
  }
}

/**
 * Higher-order component that provides basePath to all children
 *
 * @example
 * ```tsx
 * import { withBasePath } from '@mfe-platform/core/react'
 *
 * const ProductPage = withBasePath(({ basePath }) => {
 *   return <Link to={`${basePath}/details`}>Details</Link>
 * })
 * ```
 */
export function withBasePath<P extends MfeAppProps>(
  WrappedComponent: ComponentType<P>
): ComponentType<P> {
  return function WithBasePathWrapper(props: P) {
    return <WrappedComponent {...props} />
  }
}

/**
 * Type-safe factory for creating MFE root components
 *
 * @example
 * ```tsx
 * // src/App.tsx
 * import { createMfeApp } from '@mfe-platform/core/react'
 *
 * export default createMfeApp({
 *   defaultBasePath: '/catalog',
 *   routes: (basePath) => (
 *     <Routes>
 *       <Route path="/" element={<Home />} />
 *       <Route path="/products" element={<Products />} />
 *     </Routes>
 *   ),
 * })
 * ```
 */
export function createMfeApp(options: {
  defaultBasePath: string
  routes: (basePath: string) => ReactNode
}): ComponentType<MfeAppProps> {
  const { defaultBasePath, routes } = options

  return function MfeApp({ basePath = defaultBasePath }: MfeAppProps) {
    return <>{routes(basePath)}</>
  }
}

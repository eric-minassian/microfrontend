/**
 * @mfe-platform/core
 *
 * Platform SDK for microfrontend development.
 * This package provides everything MFE teams need to build and integrate
 * their microfrontends with the platform.
 *
 * @example
 * ```ts
 * // For MFE configuration (safe for browser code)
 * import { defineMfe, createMfeRegistry } from '@mfe-platform/core/config'
 *
 * // For Vite configuration (build-time only)
 * import { createMfeConfig } from '@mfe-platform/core/vite'
 *
 * // For React components
 * import { ErrorBoundary, LoadingSpinner } from '@mfe-platform/core/react'
 *
 * // For types
 * import type { MfeAppProps, User } from '@mfe-platform/core/types'
 * ```
 */

// Re-export everything for convenience
export * from './types.js'
export * from './config.js'
export * from './react.js'

// Note: We intentionally do NOT re-export from ./vite.js here
// because it imports @module-federation/vite which uses Node.js APIs
// that are not compatible with browser environments.
// Import from '@mfe-platform/core/vite' directly in vite.config.ts files.

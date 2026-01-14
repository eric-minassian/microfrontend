/**
 * Core types for the MFE Platform
 *
 * These types define the contracts between the shell and microfrontends.
 */

import type { ComponentType } from 'react'

/**
 * User information shared across all MFEs via the shell's UserContext
 */
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
}

/**
 * The context value provided by the shell's UserProvider
 */
export interface UserContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

/**
 * Standard props that the shell passes to each MFE's root component
 */
export interface MfeAppProps {
  /** The base path where this MFE is mounted (e.g., '/mfe1') */
  basePath?: string
}

/**
 * Configuration for registering an MFE with the platform
 */
export interface MfeConfig {
  /** Unique identifier for the MFE (e.g., 'mfe1', 'catalog', 'checkout') */
  name: string

  /** Display name shown in navigation and loading states */
  displayName: string

  /** Route path where this MFE is mounted (e.g., '/catalog') */
  routePath: string

  /** Development server port */
  devPort: number

  /** Production URL path (defaults to routePath if not specified) */
  prodPath?: string

  /** Description of the MFE for documentation */
  description?: string

  /** Team that owns this MFE */
  team?: string
}

/**
 * Registry of all MFEs in the platform
 */
export interface MfeRegistry {
  [name: string]: MfeConfig
}

/**
 * Props for the MfeLoader component
 */
export interface MfeLoaderProps {
  /** The MFE configuration or name */
  mfe: MfeConfig | string

  /** Optional fallback during loading */
  fallback?: React.ReactNode

  /** Optional error fallback */
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>
}

/**
 * Shell configuration for the platform
 */
export interface ShellConfig {
  /** Name of the shell application */
  name?: string

  /** Development server port */
  devPort?: number

  /** Registry of MFEs to load */
  mfes: MfeRegistry

  /** Modules to expose from the shell (e.g., shared context) */
  exposes?: Record<string, string>

  /** Additional shared dependencies */
  shared?: Record<string, SharedConfig>
}

/**
 * MFE-specific Vite configuration options
 */
export interface MfeViteConfig {
  /** MFE configuration */
  mfe: MfeConfig

  /** Shell URL in production (defaults to current origin) */
  shellUrl?: string

  /** Additional modules to expose */
  exposes?: Record<string, string>

  /** Additional shared dependencies */
  shared?: Record<string, SharedConfig>
}

/**
 * Shared dependency configuration for Module Federation
 */
export interface SharedConfig {
  singleton?: boolean
  requiredVersion?: string
  eager?: boolean
}

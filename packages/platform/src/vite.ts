/**
 * Vite Configuration Helpers for MFE Platform
 *
 * These helpers abstract away the complexity of Module Federation configuration.
 * MFE teams only need to provide minimal configuration to get started.
 *
 * NOTE: This module imports @module-federation/vite and should ONLY be used
 * in vite.config.ts files, never in browser/runtime code.
 */

import { federation } from '@module-federation/vite'
import type { UserConfig } from 'vite'
import type {
  MfeConfig,
  MfeViteConfig,
  ShellConfig,
  SharedConfig,
} from './types.js'

// Re-export config utilities for convenience in vite.config.ts
export { defineMfe, createMfeRegistry } from './config.js'

// Re-export types that consumers of this module commonly need
export type { MfeConfig, MfeViteConfig, ShellConfig, SharedConfig }

/**
 * Default shared dependencies that are always included
 * These are configured as singletons to ensure consistency across MFEs
 */
const DEFAULT_SHARED: Record<string, SharedConfig> = {
  react: { singleton: true },
  'react-dom': { singleton: true },
  'react-router-dom': { singleton: true },
  '@cloudscape-design/components': { singleton: true },
  '@cloudscape-design/global-styles': { singleton: true },
}

/**
 * Creates a Vite configuration for an MFE (remote module)
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import react from '@vitejs/plugin-react'
 * import { createMfeConfig, defineMfe } from '@mfe-platform/core/vite'
 *
 * const mfe = defineMfe({
 *   name: 'catalog',
 *   displayName: 'Product Catalog',
 *   routePath: '/catalog',
 *   devPort: 3001,
 * })
 *
 * export default defineConfig(createMfeConfig({ mfe }))
 * ```
 */
export function createMfeConfig(options: MfeViteConfig): UserConfig {
  const { mfe, shellUrl, exposes = {}, shared = {} } = options

  const isProd = process.env.NODE_ENV === 'production'

  // In production, use the configured prod path or route path
  // In development, use localhost with the dev port
  const prodPath = mfe.prodPath ?? mfe.routePath

  // Shell URL defaults to current origin in production
  const resolvedShellUrl =
    shellUrl ?? (isProd ? '' : `http://localhost:3000`)

  return {
    base: isProd ? `${prodPath}/` : '/',
    server: {
      port: mfe.devPort,
      strictPort: true,
    },
    preview: {
      port: mfe.devPort,
    },
    build: {
      target: 'chrome89',
      minify: true,
      cssCodeSplit: false,
    },
    plugins: [
      federation({
        name: mfe.name,
        filename: 'remoteEntry.js',
        manifest: true,
        exposes: {
          // Always expose the App component
          './App': './src/App.tsx',
          ...exposes,
        },
        remotes: {
          // MFEs can consume from the shell (e.g., shared context)
          shell: {
            type: 'module',
            name: 'shell',
            entry: `${resolvedShellUrl}/mf-manifest.json`,
            entryGlobalName: 'shell',
          },
        },
        shared: {
          ...DEFAULT_SHARED,
          ...shared,
        },
      }),
    ],
  }
}

/**
 * Creates a Vite configuration for the shell (host) application
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import react from '@vitejs/plugin-react'
 * import { createShellConfig } from '@mfe-platform/core/vite'
 * import { mfeRegistry } from './mfe-registry'
 *
 * export default defineConfig(createShellConfig({
 *   mfes: mfeRegistry,
 *   exposes: {
 *     './useUser': './src/context/UserContext.tsx',
 *   },
 * }))
 * ```
 */
export function createShellConfig(options: ShellConfig): UserConfig {
  const {
    name = 'shell',
    devPort = 3000,
    mfes,
    exposes = {},
    shared = {},
  } = options

  const isProd = process.env.NODE_ENV === 'production'

  // Build remotes configuration from MFE registry
  const remotes: Record<string, { type: string; name: string; entry: string; entryGlobalName: string }> = {}

  for (const [mfeName, mfeConfig] of Object.entries(mfes)) {
    const prodPath = mfeConfig.prodPath ?? mfeConfig.routePath
    const devUrl = `http://localhost:${mfeConfig.devPort}`
    const mfeUrl = isProd ? prodPath : devUrl

    remotes[mfeName] = {
      type: 'module',
      name: mfeName,
      entry: `${mfeUrl}/mf-manifest.json`,
      entryGlobalName: mfeName,
    }
  }

  return {
    base: '/',
    server: {
      port: devPort,
      strictPort: true,
    },
    preview: {
      port: devPort,
    },
    build: {
      target: 'chrome89',
      minify: true,
      cssCodeSplit: false,
    },
    plugins: [
      federation({
        name,
        filename: 'remoteEntry.js',
        manifest: true,
        exposes,
        remotes,
        shared: {
          ...DEFAULT_SHARED,
          ...shared,
        },
      }),
    ],
  }
}

/**
 * Generates TypeScript declaration content for MFE remote types
 * This can be used to create remotes.d.ts files programmatically
 */
export function generateMfeTypeDeclaration(mfeName: string): string {
  return `declare module '${mfeName}/App' {
  import type { ComponentType } from 'react'
  import type { MfeAppProps } from '@mfe-platform/core/types'
  const App: ComponentType<MfeAppProps>
  export default App
}
`
}

/**
 * Generates shell type declarations for consuming shared modules
 */
export function generateShellTypeDeclaration(): string {
  return `declare module 'shell/useUser' {
  import type { UserContextValue } from '@mfe-platform/core/types'
  export function useUser(): UserContextValue
}
`
}

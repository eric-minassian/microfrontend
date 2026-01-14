/**
 * MFE Configuration Utilities
 *
 * These utilities help define MFE configurations without importing
 * any Vite or build-tool specific code. Safe to use in browser code.
 */

import type { MfeConfig } from './types.js'

// Re-export the config type
export type { MfeConfig }

/**
 * Helper to define an MFE configuration with type safety
 *
 * @example
 * ```ts
 * const mfe = defineMfe({
 *   name: 'catalog',
 *   displayName: 'Product Catalog',
 *   routePath: '/catalog',
 *   devPort: 3001,
 *   team: 'commerce-team',
 * })
 * ```
 */
export function defineMfe(config: MfeConfig): MfeConfig {
  return config
}

/**
 * Helper to create an MFE registry from multiple MFE configs
 *
 * @example
 * ```ts
 * const registry = createMfeRegistry([
 *   defineMfe({ name: 'catalog', ... }),
 *   defineMfe({ name: 'checkout', ... }),
 * ])
 * ```
 */
export function createMfeRegistry(mfes: MfeConfig[]): Record<string, MfeConfig> {
  return mfes.reduce(
    (acc, mfe) => {
      acc[mfe.name] = mfe
      return acc
    },
    {} as Record<string, MfeConfig>
  )
}

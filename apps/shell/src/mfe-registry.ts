/**
 * MFE Registry - Central configuration for all microfrontends
 *
 * This is the single source of truth for all MFEs in the platform.
 * When onboarding a new MFE, simply add an entry to this registry.
 *
 * The platform team owns this file and manages MFE registration.
 *
 * @example Adding a new MFE:
 * ```ts
 * export const mfeRegistry = createMfeRegistry([
 *   // ... existing MFEs
 *   defineMfe({
 *     name: 'checkout',
 *     displayName: 'Checkout',
 *     routePath: '/checkout',
 *     devPort: 3003,
 *     team: 'payments-team',
 *     description: 'Handles cart and payment processing',
 *   }),
 * ])
 * ```
 */

// Import from /config (browser-safe) instead of /vite (build-time only)
import {
  defineMfe,
  createMfeRegistry,
  type MfeConfig,
} from '@mfe-platform/core/config'

/**
 * All registered MFEs in the platform
 *
 * To onboard a new MFE:
 * 1. Add an entry below with a unique name
 * 2. Assign a dev port (check existing ports to avoid conflicts)
 * 3. Define the route path where it will be mounted
 * 4. Update remotes.d.ts with type declarations
 */
export const mfeRegistry = createMfeRegistry([
  defineMfe({
    name: 'mfe1',
    displayName: 'Product Catalog',
    routePath: '/mfe1',
    devPort: 3001,
    team: 'commerce-team',
    description: 'Product catalog and inventory management',
  }),

  defineMfe({
    name: 'mfe2',
    displayName: 'User Management',
    routePath: '/mfe2',
    devPort: 3002,
    team: 'identity-team',
    description: 'User profiles and role management',
  }),
])

/**
 * Get all MFE configs as an array
 */
export const mfeList: MfeConfig[] = Object.values(mfeRegistry)

/**
 * Get a specific MFE config by name
 */
export function getMfe(name: string): MfeConfig | undefined {
  return mfeRegistry[name]
}

/**
 * Get all MFE names
 */
export function getMfeNames(): string[] {
  return Object.keys(mfeRegistry)
}

/**
 * Check if an MFE is registered
 */
export function hasMfe(name: string): boolean {
  return name in mfeRegistry
}

/**
 * Get the next available dev port
 * Useful when adding new MFEs to avoid port conflicts
 */
export function getNextAvailablePort(): number {
  const usedPorts = mfeList.map((mfe) => mfe.devPort)
  const maxPort = Math.max(3000, ...usedPorts)
  return maxPort + 1
}

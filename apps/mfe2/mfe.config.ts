/**
 * MFE Configuration for User Management (mfe2)
 *
 * This file defines the configuration for this microfrontend.
 * The platform team maintains the registry entry in the shell,
 * but MFE teams can customize their local config here.
 */

import { defineMfe } from '@mfe-platform/core/vite'

export const mfe = defineMfe({
  name: 'mfe2',
  displayName: 'User Management',
  routePath: '/mfe2',
  devPort: 3002,
  team: 'identity-team',
  description: 'User profiles and role management',
})

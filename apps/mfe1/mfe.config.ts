/**
 * MFE Configuration for Product Catalog (mfe1)
 *
 * This file defines the configuration for this microfrontend.
 * The platform team maintains the registry entry in the shell,
 * but MFE teams can customize their local config here.
 */

import { defineMfe } from '@mfe-platform/core/vite'

export const mfe = defineMfe({
  name: 'mfe1',
  displayName: 'Product Catalog',
  routePath: '/mfe1',
  devPort: 3001,
  team: 'commerce-team',
  description: 'Product catalog and inventory management',
})

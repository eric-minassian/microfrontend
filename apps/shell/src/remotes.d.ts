/**
 * Type declarations for remote MFE modules
 *
 * These declarations provide TypeScript support for dynamically
 * loaded MFE components via Module Federation.
 *
 * When onboarding a new MFE, add a module declaration below.
 */

declare module 'mfe1/App' {
  import type { ComponentType } from 'react'
  import type { MfeAppProps } from '@mfe-platform/core/types'
  const App: ComponentType<MfeAppProps>
  export default App
}

declare module 'mfe2/App' {
  import type { ComponentType } from 'react'
  import type { MfeAppProps } from '@mfe-platform/core/types'
  const App: ComponentType<MfeAppProps>
  export default App
}

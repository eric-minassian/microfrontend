/**
 * Type declarations for shell modules consumed by this MFE
 *
 * These declarations provide TypeScript support for shared modules
 * exposed by the shell via Module Federation.
 */

declare module 'shell/useUser' {
  import type { UserContextValue } from '@mfe-platform/core/types'
  export function useUser(): UserContextValue
}

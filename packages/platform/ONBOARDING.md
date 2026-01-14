# MFE Onboarding Guide

This guide explains how to onboard a new microfrontend (MFE) to the platform.

## For Platform Team (Shell Owners)

### 1. Update the MFE Registry

Add the new MFE to `apps/shell/src/mfe-registry.ts`:

```typescript
export const mfeRegistry = createMfeRegistry([
  // ... existing MFEs

  defineMfe({
    name: 'checkout',           // Unique identifier (used in imports)
    displayName: 'Checkout',    // Human-readable name (shown in UI)
    routePath: '/checkout',     // URL path where MFE is mounted
    devPort: 3003,              // Local dev server port
    team: 'payments-team',      // (optional) Owning team
    description: 'Cart and payment processing',  // (optional)
  }),
])
```

### 2. Add Type Declarations

Add the new MFE to `apps/shell/src/remotes.d.ts`:

```typescript
declare module 'checkout/App' {
  const App: ComponentType<MfeAppProps>
  export default App
}
```

### 3. Update MfeRoutes (if not using dynamic imports)

If using the static import pattern, update `apps/shell/src/components/MfeRoutes.tsx`:

```typescript
function getMfeComponent(mfeName: string) {
  // ... existing cases
  case 'checkout':
    return import('checkout/App')
}
```

That's it! The shell will automatically:
- Configure Module Federation to load the new MFE
- Create a route at the configured `routePath`
- Handle loading states and error boundaries

---

## For MFE Teams

### 1. Create Your MFE App

Start with a standard Vite + React setup:

```bash
pnpm create vite my-mfe --template react-ts
cd my-mfe
pnpm install
```

### 2. Install Platform Dependencies

```bash
pnpm add @mfe-platform/core
pnpm add -D @module-federation/vite
```

### 3. Create MFE Configuration

Create `mfe.config.ts` in your project root:

```typescript
import { defineMfe } from '@mfe-platform/core/vite'

export const mfe = defineMfe({
  name: 'checkout',           // Must match registry entry
  displayName: 'Checkout',
  routePath: '/checkout',
  devPort: 3003,
  team: 'payments-team',
})
```

### 4. Update Vite Config

Replace your `vite.config.ts` with:

```typescript
import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createMfeConfig } from '@mfe-platform/core/vite'
import { mfe } from './mfe.config'

export default defineConfig(({ mode }) => {
  process.env.NODE_ENV = mode

  const mfeConfig = createMfeConfig({ mfe })

  return mergeConfig(mfeConfig, {
    plugins: [react()],
    server: {
      origin: `http://localhost:${mfe.devPort}`,
    },
    base: mode === 'production'
      ? `${mfe.routePath}/`
      : `http://localhost:${mfe.devPort}`,
  })
})
```

### 5. Create Your App Component

Your `src/App.tsx` must accept `basePath` prop:

```typescript
import { Routes, Route } from 'react-router-dom'
import type { MfeAppProps } from '@mfe-platform/core/types'
import Home from './pages/Home'
import Details from './pages/Details'

export default function App({ basePath = '/checkout' }: MfeAppProps) {
  return (
    <Routes>
      <Route path="/" element={<Home basePath={basePath} />} />
      <Route path="/details" element={<Details basePath={basePath} />} />
    </Routes>
  )
}
```

### 6. Add Shell Type Declarations

Create `src/remotes.d.ts`:

```typescript
import type { UserContextValue } from '@mfe-platform/core/types'

declare module 'shell/useUser' {
  export function useUser(): UserContextValue
}
```

### 7. Access Shared State

Use the shell's shared context:

```typescript
import { useUser } from 'shell/useUser'

function MyComponent() {
  const { user, isAuthenticated } = useUser()

  if (!isAuthenticated) {
    return <p>Please log in</p>
  }

  return <p>Welcome, {user?.name}!</p>
}
```

---

## Development Workflow

### Running Locally

```bash
# From monorepo root
pnpm dev

# Or run individual apps
pnpm dev:shell    # Shell on port 3000
pnpm dev:mfe1     # MFE1 on port 3001
pnpm dev:mfe2     # MFE2 on port 3002
```

### Building for Production

```bash
pnpm build
```

### Testing Your MFE in Isolation

Your MFE can run standalone for development:

```bash
cd apps/your-mfe
pnpm dev
```

Then open `http://localhost:YOUR_PORT` directly. Note that shell-provided context (like `useUser`) won't be available in standalone mode.

---

## Platform API Reference

### Types (`@mfe-platform/core/types`)

- `MfeAppProps` - Standard props passed to MFE App components
- `User` - User object shape from shell context
- `UserContextValue` - Full context value from useUser hook
- `MfeConfig` - MFE configuration options

### Vite Helpers (`@mfe-platform/core/vite`)

- `defineMfe(config)` - Define MFE configuration with type safety
- `createMfeConfig(options)` - Generate Vite config for an MFE
- `createShellConfig(options)` - Generate Vite config for the shell
- `createMfeRegistry(mfes)` - Create registry from MFE array

### React Utilities (`@mfe-platform/core/react`)

- `ErrorBoundary` - Catch and handle errors in MFE content
- `LoadingSpinner` - Standard loading indicator
- `createMfeLoader(options)` - Create lazy-loaded MFE component
- `useBasePath(basePath, default)` - Get base path with fallback
- `createMfeNavigation(basePath)` - Navigation helper for MFEs

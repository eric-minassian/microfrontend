# MFE Onboarding Guide

This guide walks you through adding a new microfrontend (MFE) to the platform.

## Overview

The platform uses Module Federation to load MFEs dynamically. Each MFE:
- Runs independently on its own dev server
- Gets deployed to its own S3 bucket (your team owns this)
- Is loaded by the shell at runtime via a route path

---

## Step 1: Coordinate with Platform Team

Before starting, coordinate with the platform team to:

1. **Reserve an MFE name** (e.g., `checkout`, `analytics`)
2. **Reserve a dev port** (e.g., `3003`)
3. **Define your route path** (e.g., `/checkout`)

The platform team will add your MFE to the registry in the shell.

---

## Step 2: Create Your MFE

### Option A: Start from scratch

```bash
# Create new Vite React app
pnpm create vite my-mfe --template react-ts
cd my-mfe

# Install dependencies
pnpm add @mfe-platform/core react-router-dom
pnpm add -D @module-federation/vite
```

### Option B: Copy an existing MFE

Copy `apps/mfe1` or `apps/mfe2` as a template and modify.

---

## Step 3: Configure Your MFE

### 3.1 Create `mfe.config.ts`

```typescript
import { defineMfe } from '@mfe-platform/core/config'

export const mfe = defineMfe({
  name: 'checkout',           // Must match registry entry
  displayName: 'Checkout',    // Shown in loading states
  routePath: '/checkout',     // URL path in shell
  devPort: 3003,              // Your dev server port
  team: 'payments-team',      // Your team name
  description: 'Cart and payment processing',
})
```

### 3.2 Update `vite.config.ts`

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

### 3.3 Create `src/remotes.d.ts`

This provides TypeScript support for shell-provided modules:

```typescript
import type { UserContextValue } from '@mfe-platform/core/types'

declare module 'shell/useUser' {
  export function useUser(): UserContextValue
}
```

### 3.4 Update `package.json`

Add the platform dependency:

```json
{
  "dependencies": {
    "@mfe-platform/core": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.2.0"
  }
}
```

---

## Step 4: Create Your App Component

Your `src/App.tsx` must:
1. Accept `basePath` prop
2. Use `<Routes>` for internal navigation

```typescript
import { Routes, Route } from 'react-router-dom'
import type { MfeAppProps } from '@mfe-platform/core/types'
import Home from './pages/Home'
import Details from './pages/Details'

export default function App({ basePath = '/checkout' }: MfeAppProps) {
  return (
    <Routes>
      <Route path="/" element={<Home basePath={basePath} />} />
      <Route path="/cart" element={<Cart basePath={basePath} />} />
      <Route path="/payment" element={<Payment basePath={basePath} />} />
    </Routes>
  )
}
```

---

## Step 5: Access Shared State

The shell provides shared context via Module Federation. Use it like this:

```typescript
import { useUser } from 'shell/useUser'

function CheckoutPage({ basePath }: { basePath: string }) {
  const { user, isAuthenticated } = useUser()

  if (!isAuthenticated) {
    return <p>Please log in to checkout</p>
  }

  return (
    <div>
      <h1>Checkout</h1>
      <p>Shipping to: {user?.email}</p>
    </div>
  )
}
```

### Available from shell:

| Export | Description |
|--------|-------------|
| `useUser()` | Returns `{ user, isAuthenticated, login, logout, updateUser }` |

---

## Step 6: Navigation

### Internal navigation (within your MFE)

Use relative paths with react-router:

```typescript
import { Link, useNavigate } from 'react-router-dom'

function Home({ basePath }: { basePath: string }) {
  const navigate = useNavigate()

  return (
    <>
      <Link to="/cart">View Cart</Link>
      <button onClick={() => navigate('/payment')}>
        Proceed to Payment
      </button>
    </>
  )
}
```

### External navigation (to shell or other MFEs)

Use absolute paths:

```typescript
<a href="/">Back to Dashboard</a>
<a href="/mfe1/products">View Products</a>
```

---

## Step 7: Development

### Run locally with the shell

```bash
# From monorepo root - runs all apps
pnpm dev

# Or run your MFE + shell only
pnpm dev:shell & pnpm --filter your-mfe dev
```

### Run standalone (without shell)

```bash
cd apps/your-mfe
pnpm dev
```

Note: Shell-provided context (like `useUser`) won't work in standalone mode.

---

## Step 8: Building & Deployment

### Build

```bash
pnpm --filter your-mfe build
```

This outputs to `apps/your-mfe/dist/` with:
- `index.html` - Entry point
- `remoteEntry.js` - Module Federation entry
- `mf-manifest.json` - Federation manifest

### Deployment

Your team deploys the `dist/` folder to your S3 bucket. The platform team will configure CloudFront to route `/your-path/*` to your bucket.

---

## Checklist

- [ ] MFE name and port reserved with platform team
- [ ] `mfe.config.ts` created with correct values
- [ ] `vite.config.ts` updated to use `createMfeConfig`
- [ ] `src/remotes.d.ts` created for shell types
- [ ] `src/App.tsx` accepts `basePath` prop
- [ ] Platform team added entry to `mfe-registry.ts`
- [ ] Platform team added types to `remotes.d.ts`
- [ ] Tested locally with `pnpm dev`
- [ ] Build succeeds with `pnpm build`

---

## Troubleshooting

### "Cannot find module 'shell/useUser'"

Ensure `src/remotes.d.ts` exists with the correct type declaration.

### MFE not loading in shell

1. Check your MFE dev server is running
2. Verify the port matches your `mfe.config.ts`
3. Check browser console for Module Federation errors

### Styles bleeding between MFEs

Use scoped CSS (CSS Modules, styled-components, etc.) to avoid conflicts.

---

## Questions?

Contact the platform team in #platform-support.

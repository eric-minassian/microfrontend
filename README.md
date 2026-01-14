# Microfrontend POC

A proof-of-concept microfrontend architecture using Module Federation, Vite, React, and AWS CDK.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   /* (default)│  │  /mfe1/*   │  │  /mfe2/*   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │  Shell S3 │    │  MFE1 S3  │    │  MFE2 S3  │
    │  Bucket   │    │  Bucket   │    │  Bucket   │
    └───────────┘    └───────────┘    └───────────┘
```

### Apps

| App | Port | Description |
|-----|------|-------------|
| **Shell** | 3000 | Host application with header, routing, and shared context |
| **MFE1** | 3001 | Product Catalog - products and categories management |
| **MFE2** | 3002 | User Management - users and roles administration |

### Routing

| URL | What Loads |
|-----|------------|
| `/` | Shell header + Dashboard |
| `/mfe1` | Shell header + MFE1 (Product Catalog home) |
| `/mfe1/products` | Shell header + MFE1 Products page |
| `/mfe1/categories` | Shell header + MFE1 Categories page |
| `/mfe2` | Shell header + MFE2 (User Management home) |
| `/mfe2/users` | Shell header + MFE2 Users page |
| `/mfe2/roles` | Shell header + MFE2 Roles page |

## Features

- **Module Federation** - Runtime module sharing between apps
- **Shared React Context** - Shell provides `useUser` hook to MFEs
- **Independent Deployment** - Each MFE has its own S3 bucket
- **Delegated Routing** - MFEs handle their own sub-routes
- **Shared Dependencies** - React, React DOM, and React Router as singletons

## Tech Stack

- **Build**: Vite 7 + @module-federation/vite
- **Frontend**: React 19, TypeScript, React Router 7
- **Infrastructure**: AWS CDK, CloudFront, S3
- **Package Manager**: pnpm workspaces

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- AWS CLI configured (for deployment)

### Installation

```bash
pnpm install
```

### Development

```bash
# Start all apps in parallel
pnpm dev

# Or start individually
pnpm dev:shell  # http://localhost:3000
pnpm dev:mfe1   # http://localhost:3001
pnpm dev:mfe2   # http://localhost:3002
```

Open http://localhost:3000 to view the shell with integrated MFEs.

### Build

```bash
pnpm build
```

### Deploy to AWS

```bash
# Build and deploy
pnpm run deploy:aws

# Destroy infrastructure
pnpm run destroy:aws
```

## Project Structure

```
microfrontend/
├── apps/
│   ├── shell/                 # Host application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── Header.tsx
│   │   │   ├── context/
│   │   │   │   └── UserContext.tsx  # Shared user state
│   │   │   ├── pages/
│   │   │   │   └── Dashboard.tsx
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   ├── mfe1/                  # Product Catalog MFE
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Products.tsx
│   │   │   │   └── Categories.tsx
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   └── mfe2/                  # User Management MFE
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Home.tsx
│       │   │   ├── Users.tsx
│       │   │   └── Roles.tsx
│       │   └── App.tsx
│       └── vite.config.ts
├── infra/                     # AWS CDK infrastructure
│   └── lib/
│       └── infra-stack.ts
├── package.json
└── pnpm-workspace.yaml
```

## Shared State

The shell exposes a `useUser` hook via Module Federation that MFEs can consume:

```tsx
// In any MFE
import { useUser } from 'shell/useUser'

function MyComponent() {
  const { user, isAuthenticated, logout } = useUser()

  return <div>Welcome, {user?.name}</div>
}
```

### Available Context Values

```typescript
interface UserContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
}
```

## Module Federation Configuration

### Shell (Host)

```typescript
federation({
  name: 'shell',
  exposes: {
    './useUser': './src/context/UserContext.tsx',
  },
  remotes: {
    mfe1: { entry: 'http://localhost:3001/mf-manifest.json' },
    mfe2: { entry: 'http://localhost:3002/mf-manifest.json' },
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-router-dom': { singleton: true },
  },
})
```

### MFEs (Remotes)

```typescript
federation({
  name: 'mfe1',
  exposes: {
    './App': './src/App.tsx',
  },
  remotes: {
    shell: { entry: 'http://localhost:3000/mf-manifest.json' },
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-router-dom': { singleton: true },
  },
})
```

## AWS Infrastructure

The CDK stack creates:

- **3 S3 Buckets** - One per app (shell, mfe1, mfe2)
- **CloudFront Distribution** - Single entry point with path-based routing
- **Origin Access Control** - Secure S3 access
- **CORS Configuration** - For cross-origin module loading

### CloudFront Behaviors

| Path Pattern | Origin |
|--------------|--------|
| `/*` (default) | Shell bucket |
| `/mfe1/*` | MFE1 bucket |
| `/mfe2/*` | MFE2 bucket |

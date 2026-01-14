# MFE Development Workflow Enhancement - Implementation Sketch

This document outlines how to implement two developer experience improvements:
1. **Remote Override** - Develop MFEs locally against a deployed shell
2. **Dev Deployments** - Shareable preview URLs for MFE versions

---

## Problem Statement

**Current workflow requires running everything locally:**
```bash
pnpm dev  # Starts shell (3000) + mfe1 (3001) + mfe2 (3002)
```

**Desired workflows:**

1. **Local MFE + Deployed Shell:**
   - Developer runs only their MFE locally (`pnpm dev:mfe1`)
   - Opens deployed shell with override param
   - Shell loads MFE from localhost instead of deployed version

2. **Shareable Dev URLs:**
   - Developer pushes to a branch
   - Gets a preview URL like `https://preview-abc123.mfe.example.com`
   - Team can test the latest MFE changes without running locally

---

## Part 1: Remote Override Feature

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  https://mfe.example.com?mfe-override=mfe1:localhost:3001  │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ Deployed Shell│ │ Deployed MFE2 │ │ LOCAL MFE1    │
    │ CloudFront    │ │ CloudFront    │ │ localhost:3001│
    └───────────────┘ └───────────────┘ └───────────────┘
```

### Implementation Approach

The challenge: Module Federation configures remotes at **build time** in vite.config.ts. We need **runtime** URL resolution.

**Solution: Use Module Federation's `getRemote()` API for dynamic loading**

#### Step 1: Create Runtime Config System

```typescript
// packages/platform/src/runtime-config.ts

export interface MfeOverride {
  name: string
  url: string
}

export interface RuntimeConfig {
  mfeOverrides: MfeOverride[]
}

/**
 * Parse MFE overrides from URL query params
 * Format: ?mfe-override=mfe1:http://localhost:3001&mfe-override=mfe2:http://localhost:3002
 * Or shorthand: ?mfe-override=mfe1:3001 (assumes localhost)
 */
export function parseOverridesFromUrl(): MfeOverride[] {
  if (typeof window === 'undefined') return []

  const params = new URLSearchParams(window.location.search)
  const overrides: MfeOverride[] = []

  for (const value of params.getAll('mfe-override')) {
    const [name, urlOrPort] = value.split(':')
    if (!name || !urlOrPort) continue

    // Support shorthand: mfe1:3001 -> http://localhost:3001
    const url = urlOrPort.match(/^\d+$/)
      ? `http://localhost:${urlOrPort}`
      : urlOrPort.startsWith('http')
        ? urlOrPort
        : `http://${urlOrPort}`

    overrides.push({ name, url })
  }

  return overrides
}

/**
 * Also check localStorage for persistent overrides during development
 */
export function parseOverridesFromStorage(): MfeOverride[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem('mfe-overrides')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Get all overrides (URL params take precedence over localStorage)
 */
export function getMfeOverrides(): Map<string, string> {
  const storageOverrides = parseOverridesFromStorage()
  const urlOverrides = parseOverridesFromUrl()

  const overrideMap = new Map<string, string>()

  // Storage first (lower priority)
  for (const { name, url } of storageOverrides) {
    overrideMap.set(name, url)
  }

  // URL params override storage
  for (const { name, url } of urlOverrides) {
    overrideMap.set(name, url)
  }

  return overrideMap
}

/**
 * Helper to set persistent overrides (useful for dev tools UI)
 */
export function setMfeOverride(name: string, url: string): void {
  const overrides = parseOverridesFromStorage()
  const existing = overrides.findIndex(o => o.name === name)

  if (existing >= 0) {
    overrides[existing].url = url
  } else {
    overrides.push({ name, url })
  }

  localStorage.setItem('mfe-overrides', JSON.stringify(overrides))
}

export function clearMfeOverride(name: string): void {
  const overrides = parseOverridesFromStorage().filter(o => o.name !== name)
  localStorage.setItem('mfe-overrides', JSON.stringify(overrides))
}

export function clearAllOverrides(): void {
  localStorage.removeItem('mfe-overrides')
}
```

#### Step 2: Create Dynamic MFE Loader

Replace static imports with dynamic loading using `@module-federation/enhanced/runtime`:

```typescript
// packages/platform/src/dynamic-loader.ts

import { init, loadRemote } from '@module-federation/enhanced/runtime'
import type { ComponentType } from 'react'
import type { MfeAppProps, MfeRegistry } from './types.js'
import { getMfeOverrides } from './runtime-config.js'

let initialized = false

/**
 * Initialize Module Federation runtime with dynamic remotes
 */
export function initMfeDynamicLoader(
  mfeRegistry: MfeRegistry,
  options: {
    shellName?: string
    defaultBaseUrl?: string  // e.g., 'https://mfe.example.com'
  } = {}
) {
  if (initialized) return

  const { shellName = 'shell', defaultBaseUrl = '' } = options
  const overrides = getMfeOverrides()

  const remotes = Object.entries(mfeRegistry).map(([name, config]) => {
    // Check for override first
    const overrideUrl = overrides.get(name)

    if (overrideUrl) {
      console.log(`[MFE] Using override for ${name}: ${overrideUrl}`)
      return {
        name,
        entry: `${overrideUrl}/mf-manifest.json`,
      }
    }

    // Otherwise use default production URL
    const prodPath = config.prodPath ?? config.routePath
    return {
      name,
      entry: `${defaultBaseUrl}${prodPath}/mf-manifest.json`,
    }
  })

  init({
    name: shellName,
    remotes,
    shared: {
      react: { singleton: true, version: '19.0.0' },
      'react-dom': { singleton: true, version: '19.0.0' },
      'react-router-dom': { singleton: true, version: '7.0.0' },
    },
  })

  initialized = true
}

/**
 * Dynamically load an MFE component
 */
export async function loadMfeComponent(
  mfeName: string
): Promise<ComponentType<MfeAppProps>> {
  const module = await loadRemote<{ default: ComponentType<MfeAppProps> }>(
    `${mfeName}/App`
  )

  if (!module?.default) {
    throw new Error(`MFE ${mfeName} did not export a default component`)
  }

  return module.default
}
```

#### Step 3: Update MfeRoutes to Use Dynamic Loading

```typescript
// apps/shell/src/components/MfeRoutes.tsx (modified)

import { lazy, Suspense, useEffect, useState } from 'react'
import { Route } from 'react-router-dom'
import { loadMfeComponent, initMfeDynamicLoader } from '@mfe-platform/core/dynamic-loader'
import { getMfeOverrides } from '@mfe-platform/core/runtime-config'
import { mfeList, mfeRegistry } from '../mfe-registry'
// ... other imports

// Initialize the dynamic loader on module load
const baseUrl = import.meta.env.PROD
  ? '' // Same origin in production
  : 'http://localhost:3000'

initMfeDynamicLoader(mfeRegistry, { defaultBaseUrl: baseUrl })

/**
 * Cache for dynamically loaded MFE components
 */
const mfeComponentCache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<{ basePath?: string }>>
>()

/**
 * Get or create a lazy-loaded component for an MFE
 * Now supports dynamic URL resolution via overrides
 */
function getMfeComponent(mfeName: string) {
  const overrides = getMfeOverrides()
  const cacheKey = overrides.has(mfeName)
    ? `${mfeName}@${overrides.get(mfeName)}`
    : mfeName

  if (!mfeComponentCache.has(cacheKey)) {
    const LazyComponent = lazy(() => loadMfeComponent(mfeName).then(comp => ({ default: comp })))
    mfeComponentCache.set(cacheKey, LazyComponent)
  }

  return mfeComponentCache.get(cacheKey)!
}

// ... rest of the file stays similar
```

#### Step 4: Add CORS Support for Local Development

Update the MFE dev server config:

```typescript
// packages/platform/src/vite.ts (add to createMfeConfig)

export function createMfeConfig(options: MfeViteConfig): UserConfig {
  // ... existing code ...

  return {
    // ... existing config ...
    server: {
      port: mfe.devPort,
      strictPort: true,
      // Allow deployed shell to load this MFE
      cors: {
        origin: [
          'http://localhost:3000',
          // Add your deployed shell URLs
          /\.cloudfront\.net$/,
          /\.example\.com$/,
        ],
        credentials: true,
      },
      headers: {
        // Required for cross-origin module loading
        'Access-Control-Allow-Origin': '*',
      },
    },
    // ... rest of config
  }
}
```

#### Step 5: Security - Disable Overrides in Production

```typescript
// packages/platform/src/runtime-config.ts

export function getMfeOverrides(): Map<string, string> {
  // SECURITY: Never allow overrides in production
  if (import.meta.env.PROD && !import.meta.env.VITE_ALLOW_MFE_OVERRIDES) {
    return new Map()
  }

  // ... rest of implementation
}
```

#### Usage

Developer workflow becomes:

```bash
# Terminal 1: Start only your MFE
cd apps/mfe1 && pnpm dev

# Browser: Open deployed shell with override
https://your-deployed-shell.cloudfront.net/?mfe-override=mfe1:3001
```

---

## Part 2: Dev/Preview Deployments

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Deployment (main branch)                                  │
│  https://mfe.example.com                                        │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │ Shell   │  │ MFE1    │  │ MFE2    │                         │
│  │ /       │  │ /mfe1   │  │ /mfe2   │                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Preview Deployment (feature branch)                            │
│  https://mfe.example.com?mfe-preview=mfe1:abc123                │
│                                                                 │
│  ┌─────────┐  ┌─────────────┐  ┌─────────┐                     │
│  │ Shell   │  │ MFE1@abc123 │  │ MFE2    │                     │
│  │ /       │  │ /preview/   │  │ /mfe2   │                     │
│  │ (main)  │  │ mfe1/abc123 │  │ (main)  │                     │
│  └─────────┘  └─────────────┘  └─────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Option A: S3 Path-Based Previews (Simpler)

Store preview builds in the same bucket with versioned paths:

```
s3://mfe-bucket/
├── mfe1/                    # Production (main branch)
│   ├── mf-manifest.json
│   └── ...
└── preview/
    └── mfe1/
        ├── abc123/          # Preview build (commit SHA)
        │   ├── mf-manifest.json
        │   └── ...
        └── feature-xyz/     # Preview build (branch name)
            ├── mf-manifest.json
            └── ...
```

#### CDK Changes

```typescript
// infra/lib/infra-stack.ts (additions)

// Add CloudFront behavior for preview paths
distribution.addBehavior('/preview/mfe1/*', new origins.S3BucketOrigin(mfe1Bucket, {
  originAccessControl: oac,
}), {
  viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
});

// Similar for mfe2, mfe3, etc.
```

#### Build Script for Preview Deployments

```bash
#!/bin/bash
# scripts/deploy-preview.sh

set -e

MFE_NAME=${1:-mfe1}
PREVIEW_ID=${2:-$(git rev-parse --short HEAD)}

echo "Deploying preview: $MFE_NAME @ $PREVIEW_ID"

# Build the MFE with preview base path
cd "apps/$MFE_NAME"
VITE_BASE_PATH="/preview/$MFE_NAME/$PREVIEW_ID/" pnpm build

# Deploy to preview path
aws s3 sync dist/ "s3://mfe-${MFE_NAME}-bucket/preview/$MFE_NAME/$PREVIEW_ID/" \
  --delete \
  --cache-control "max-age=0, no-cache"

# Output the preview URL
DISTRIBUTION_URL=$(aws cloudformation describe-stacks \
  --stack-name MfePlatformStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionUrl`].OutputValue' \
  --output text)

echo ""
echo "✅ Preview deployed!"
echo "📎 Preview URL: ${DISTRIBUTION_URL}?mfe-preview=$MFE_NAME:$PREVIEW_ID"
```

#### Runtime Config Update

```typescript
// packages/platform/src/runtime-config.ts (additions)

export interface MfePreview {
  name: string
  version: string  // commit SHA or branch name
}

/**
 * Parse preview params from URL
 * Format: ?mfe-preview=mfe1:abc123&mfe-preview=mfe2:feature-xyz
 */
export function parsePreviewsFromUrl(): MfePreview[] {
  if (typeof window === 'undefined') return []

  const params = new URLSearchParams(window.location.search)
  const previews: MfePreview[] = []

  for (const value of params.getAll('mfe-preview')) {
    const [name, version] = value.split(':')
    if (name && version) {
      previews.push({ name, version })
    }
  }

  return previews
}

/**
 * Get MFE URL with preview support
 */
export function getMfeUrl(
  mfeName: string,
  config: MfeConfig,
  baseUrl: string
): string {
  // Check for localhost override first
  const overrides = getMfeOverrides()
  if (overrides.has(mfeName)) {
    return overrides.get(mfeName)!
  }

  // Check for preview version
  const previews = parsePreviewsFromUrl()
  const preview = previews.find(p => p.name === mfeName)
  if (preview) {
    return `${baseUrl}/preview/${mfeName}/${preview.version}`
  }

  // Default to production path
  const prodPath = config.prodPath ?? config.routePath
  return `${baseUrl}${prodPath}`
}
```

### Option B: Separate CloudFront Distributions (More Isolated)

Create a separate "preview" CloudFront distribution:

```
Main:    https://mfe.example.com
Preview: https://preview.mfe.example.com/{preview-id}
```

This provides better isolation but more infrastructure complexity.

### GitHub Actions Integration

```yaml
# .github/workflows/preview-deploy.yml

name: Deploy Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Detect changed MFEs
        id: changes
        run: |
          CHANGED_MFES=$(git diff --name-only origin/main...HEAD | grep '^apps/mfe' | cut -d'/' -f2 | sort -u | tr '\n' ' ')
          echo "mfes=$CHANGED_MFES" >> $GITHUB_OUTPUT

      - name: Build and deploy changed MFEs
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          PREVIEW_ID="${{ github.event.pull_request.head.sha }}"
          for mfe in ${{ steps.changes.outputs.mfes }}; do
            ./scripts/deploy-preview.sh $mfe $PREVIEW_ID
          done

      - name: Comment preview URL
        uses: actions/github-script@v7
        with:
          script: |
            const previewId = context.payload.pull_request.head.sha.substring(0, 7);
            const changedMfes = '${{ steps.changes.outputs.mfes }}'.trim().split(' ');
            const baseUrl = 'https://your-cloudfront-url.cloudfront.net';

            const previewParams = changedMfes
              .map(mfe => `mfe-preview=${mfe}:${previewId}`)
              .join('&');

            const previewUrl = `${baseUrl}?${previewParams}`;

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 🚀 Preview Deployment Ready\n\n**Preview URL:** ${previewUrl}\n\n**Changed MFEs:** ${changedMfes.join(', ')}`
            });
```

---

## Summary: File Changes Required

### For Remote Override Feature

| File | Change |
|------|--------|
| `packages/platform/src/runtime-config.ts` | **NEW** - Parse overrides from URL/localStorage |
| `packages/platform/src/dynamic-loader.ts` | **NEW** - Dynamic MFE loading at runtime |
| `packages/platform/src/index.ts` | Export new modules |
| `apps/shell/src/components/MfeRoutes.tsx` | Use dynamic loader instead of static imports |
| `packages/platform/src/vite.ts` | Add CORS config for dev servers |

### For Dev/Preview Deployments

| File | Change |
|------|--------|
| `packages/platform/src/runtime-config.ts` | Add preview URL parsing |
| `infra/lib/infra-stack.ts` | Add preview path behaviors |
| `scripts/deploy-preview.sh` | **NEW** - Preview deployment script |
| `.github/workflows/preview-deploy.yml` | **NEW** - CI/CD for previews |
| `apps/*/vite.config.ts` | Support `VITE_BASE_PATH` env var |

---

## Implementation Order

**Phase 1: Remote Override (simpler, immediate DX win)**
1. Create runtime-config.ts with URL parsing
2. Add CORS to MFE dev servers
3. Update MfeRoutes to check for overrides
4. Test: `pnpm dev:mfe1` + deployed shell with `?mfe-override=mfe1:3001`

**Phase 2: Preview Deployments**
1. Update CDK for preview paths
2. Create deploy-preview.sh script
3. Add GitHub Actions workflow
4. Update runtime-config for preview URLs

---

## Security Considerations

1. **Production Safety**: Override/preview params should be disabled in production unless explicitly enabled
2. **CORS**: Only allow known origins (your CloudFront domain, localhost for dev)
3. **CSP**: Update Content-Security-Policy headers if needed
4. **Validation**: Sanitize preview IDs to prevent path traversal attacks

---

## Alternative: Simpler Override for Quick Win

If the full dynamic loading is too complex initially, a simpler approach:

1. Deploy a **"dev shell"** alongside the production shell
2. Dev shell has hardcoded `http://localhost:*` URLs for remotes
3. Developers access `https://dev.mfe.example.com` which expects local MFEs

This avoids runtime URL resolution but requires maintaining two shell deployments.

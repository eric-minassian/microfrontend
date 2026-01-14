import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createShellConfig } from '@mfe-platform/core/vite'
import { mfeRegistry } from './src/mfe-registry'

export default defineConfig(({ mode }) => {
  // Set NODE_ENV for the platform config helpers
  process.env.NODE_ENV = mode

  const shellConfig = createShellConfig({
    mfes: mfeRegistry,
    exposes: {
      './useUser': './src/context/UserContext.tsx',
    },
  })

  return mergeConfig(shellConfig, {
    plugins: [react()],
    server: {
      origin: 'http://localhost:3000',
    },
    base: mode === 'production' ? '/' : 'http://localhost:3000',
  })
})

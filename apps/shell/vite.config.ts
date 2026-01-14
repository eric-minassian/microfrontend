import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  const mfe1Url = isProd ? (env.VITE_MFE1_URL || '/mfe1') : 'http://localhost:3001'
  const mfe2Url = isProd ? (env.VITE_MFE2_URL || '/mfe2') : 'http://localhost:3002'

  return {
    server: {
      port: 3000,
      origin: 'http://localhost:3000',
    },
    base: isProd ? '/' : 'http://localhost:3000',
    plugins: [
      react(),
      federation({
        name: 'shell',
        filename: 'remoteEntry.js',
        manifest: true,
        // Expose shared context/hooks for MFEs to consume
        exposes: {
          './useUser': './src/context/UserContext.tsx',
        },
        remotes: {
          mfe1: {
            type: 'module',
            name: 'mfe1',
            entry: `${mfe1Url}/mf-manifest.json`,
            entryGlobalName: 'mfe1',
          },
          mfe2: {
            type: 'module',
            name: 'mfe2',
            entry: `${mfe2Url}/mf-manifest.json`,
            entryGlobalName: 'mfe2',
          },
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
          'react-router-dom': { singleton: true },
        },
      }),
    ],
    build: {
      target: 'chrome89',
    },
  }
})

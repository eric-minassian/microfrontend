import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  const shellUrl = isProd ? (env.VITE_SHELL_URL || '') : 'http://localhost:3000'

  return {
    server: {
      port: 3002,
      origin: 'http://localhost:3002',
    },
    base: isProd ? '/mfe2/' : 'http://localhost:3002',
    plugins: [
      react(),
      federation({
        name: 'mfe2',
        filename: 'remoteEntry.js',
        manifest: true,
        exposes: {
          './App': './src/App.tsx',
        },
        remotes: {
          shell: {
            type: 'module',
            name: 'shell',
            entry: `${shellUrl}/mf-manifest.json`,
            entryGlobalName: 'shell',
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

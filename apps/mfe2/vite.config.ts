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
    base: mode === 'production' ? `${mfe.routePath}/` : `http://localhost:${mfe.devPort}`,
  })
})

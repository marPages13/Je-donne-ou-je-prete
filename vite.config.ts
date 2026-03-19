import { defineConfig, loadEnv } from 'vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      adonisjs({
        entrypoints: ['resources/css/app.css', 'resources/js/app.js'],
        reload: ['resources/views/**/*.edge'],
      }),
    ],
    server: {
      allowedHosts: env.ALLOWED_HOST,
    },
  }
})

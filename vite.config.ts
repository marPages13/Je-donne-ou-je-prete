
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'

console.log('ALLOWED_HOST:', process.env.ALLOWED_HOST)

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entrypoints of your application. Each entrypoint will
       * result in a separate bundle.
       */
      entrypoints: ['resources/css/app.css', 'resources/js/app.js'],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],
    }),
  ],
  server: {
    allowedHosts: process.env.ALLOWED_HOST
      ? [process.env.ALLOWED_HOST]
      : ['jdjp.etml.net'],
  },
})

import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entrypoints of your application. Each entrypoint will
       * result in a separate bundle.
       */
      entrypoints: [
        'resources/css/account.css',
        'resources/css/ajout.css',
        'resources/css/app.css',
        'resources/css/details.css',
        'resources/css/edit.css',
        'resources/css/home.css',
        'resources/css/login.css',
        'resources/css/variable.css',
        'resources/img/jdjp.png',
        'resources/img/logo.png',
        'resources/img/plus.png',
        'resources/img/user.png',
        'resources/img/user.svg',
        'resources/js/app.js',
        'resources/js/user-avatar.js',
      ],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],
    }),
  ],
  server: {
    middlewareMode: process.env.NODE_ENV === 'production',
    allowedHosts: process.env.ALLOWED_HOST ? [process.env.ALLOWED_HOST] : ['localhost'],
  },
})
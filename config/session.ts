import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/session'

const sessionConfig = defineConfig({
  enabled: true,
  cookieName: 'Je-Donne-Je-prete',

  /**
   * When set to true, the session id cookie will be deleted
   * once the user closes the browser.
   */
  clearWithBrowser: false,

  /**
   * Define how long to keep the session data alive without
   * any activity.
   */
  age: '2h',

  /**
   * Configuration for session cookie and the
   * cookie store
   */
  cookie: {
    path: '/',
    httpOnly: true,
    /**
     * En production (derrière HTTPS), le cookie de session doit être `secure`
     * sinon la session ne persiste pas et l'utilisateur est redirigé en boucle.
     */
    secure: env.get('NODE_ENV') === 'production',
    sameSite: 'lax',
  },

  /**
   * The store to use. Make sure to validate the environment
   * variable in order to infer the store name without any
   * errors.
   */
  store: env.get('SESSION_DRIVER', 'cookie'),

  /**
   * List of configured stores. Refer documentation to see
   * list of available stores and their config.
   */
  stores: {
    cookie: stores.cookie(),
  },
})

export default sessionConfig

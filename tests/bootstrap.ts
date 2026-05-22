import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import { apiClient } from '@japa/api-client'
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import { shieldApiClient } from '@adonisjs/shield/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
import testUtils from '@adonisjs/core/services/test_utils'
import { ApiRequest } from '@japa/api-client'
import { ApiClient } from '@japa/api-client'

// Add a minimal shim only if the session plugin didn't register `withSession`
// The real plugin (`@adonisjs/session`) registers a richer implementation
if (typeof (ApiRequest.prototype as any).withSession !== 'function') {
  ApiRequest.macro('withSession', function (this: any, session: Record<string, any>) {
    // Priorité à withPlainCookie / withEncryptedCookie si fournis par le plugin Adonis
    // @ts-ignore
    if (typeof this.withPlainCookie === 'function') {
      for (const k of Object.keys(session || {})) {
        // @ts-ignore
        this.withPlainCookie(k, session[k])
      }
      return this
    }

    // Sinon fallback sur cookies()
    // @ts-ignore
    if (typeof this.cookies === 'function') {
      // @ts-ignore
      this.cookies(session)
    }
    return this
  })
}

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  apiClient(),
  pluginAdonisJS(app),
  sessionApiClient(app),
  authApiClient(app),
  shieldApiClient(),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    // Ensure server uses memory session store so test sessionClient and server share the same store
    () => {
      process.env.SESSION_DRIVER = 'memory'
      return testUtils.httpServer().start()
    },
    () => testUtils.db().migrate(),
  ],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (suite.name === 'functional' || suite.name === 'unit') {
    suite.setup(() => testUtils.db().truncate())
  }
}

// Diagnostics: log sessionClient and cookies for troubleshooting CSRF/session issues
ApiClient.onRequest((request: ApiRequest) => {
  request.setup(async () => {
    try {
      // @ts-ignore
      console.log('[TEST-DBG] request.cookiesJar =', request.cookiesJar)
      // @ts-ignore
      if (request.sessionClient) {
        // @ts-ignore
        console.log('[TEST-DBG] sessionClient (before commit) =', request.sessionClient)
      }
    }
    catch (e) {
      console.log('[TEST-DBG] error logging request', e)
    }
    return async () => { }
  })

  request.teardown(async (response: any) => {
    try {
      console.log('[TEST-DBG] response.cookies =', response.cookies)
      // @ts-ignore
      console.log('[TEST-DBG] response.sessionBag =', response.sessionBag)
    }
    catch (e) {
      console.log('[TEST-DBG] error logging response', e)
    }
  })
})

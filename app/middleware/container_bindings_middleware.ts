import { Logger } from '@adonisjs/core/logger'
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * The container bindings middleware binds classes to their request
 * specific value using the container resolver.
 *
 * - We bind "HttpContext" class to the "ctx" object
 * - And bind "Logger" class to the "ctx.logger" object
 */
export default class ContainerBindingsMiddleware {
  private static cachedRepoVersion: string | null = null

  private static async computeRepoVersion() {
    if (this.cachedRepoVersion) {
      return this.cachedRepoVersion
    }

    try {
      const response = await fetch(
        'https://api.github.com/repos/BlackAngelTVdev/Je-donne-ou-je-prete/releases/latest'
      )
      if (!response.ok) {
        // If GitHub API fails, try reading local package.json for a version
        try {
          const pkgPath = path.join(process.cwd(), 'package.json')
          const pkgRaw = await fs.readFile(pkgPath, 'utf-8')
          const pkg = JSON.parse(pkgRaw) as { version?: string }
          let version = pkg.version || 'V0.00'
          if (!/^v/i.test(version)) {
            version = 'v' + version
          }
          this.cachedRepoVersion = version
          return this.cachedRepoVersion
        } catch {
          this.cachedRepoVersion = 'V0.00'
          return this.cachedRepoVersion
        }
      }

      const data = (await response.json()) as { tag_name: string }
      this.cachedRepoVersion = data.tag_name || 'V0.00'
      return this.cachedRepoVersion
    } catch {
      this.cachedRepoVersion = 'V0.00'
      return this.cachedRepoVersion
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    ctx.containerResolver.bindValue(HttpContext, ctx)
    ctx.containerResolver.bindValue(Logger, ctx.logger)
    const requestPath = ctx.request.url()
    const isCherchePage =
      requestPath.startsWith('/cherche') || requestPath.startsWith('/item/cherche')

    ctx.view.share({
      repoVersion: await ContainerBindingsMiddleware.computeRepoVersion(),
      isCherchePage,
    })

    return next()
  }
}

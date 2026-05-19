import type { HttpContext } from '@adonisjs/core/http'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default class ServeResourcesMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const { request, response } = ctx

    // Check if request is for /resources/*
    if (request.url().startsWith('/resources/')) {
      const resourcePath = request.url().slice(11) // Remove '/resources/' prefix
      const fullPath = path.resolve(path.join(__dirname, '../../resources', resourcePath))
      const resourcesDir = path.resolve(path.join(__dirname, '../../resources'))

      // Security check - ensure path is within resources directory
      if (!fullPath.startsWith(resourcesDir)) {
        return response.status(403).send('Forbidden')
      }

      try {
        // Check if file exists
        await fs.access(fullPath)
        return response.download(fullPath)
      } catch {
        return response.status(404).send('Not Found')
      }
    }

    await next()
  }
}

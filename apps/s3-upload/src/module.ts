import { join } from 'node:path'
import { defineNuxtModule, useLogger } from '@nuxt/kit'

export interface ModuleOptions {
  s3: {
    bucket?: string
    endpoint?: string
    accessKey?: string
    secretKey?: string
  }
}

declare module '@nuxt/schema' {
  interface NuxtConfig { s3Upload?: ModuleOptions }
  interface NuxtOptions { s3Upload: ModuleOptions }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 's3-upload',
    configKey: 's3Upload',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },

  defaults: {
    s3: {},
  },

  setup(options, nuxt) {
    const logger = useLogger('s3-upload')

    const s3 = options.s3 ?? {}

    const required = ['bucket', 'endpoint', 'accessKey', 'secretKey'] as const
    const missing = required.filter(key => !s3[key])

    if (missing.length > 0) {
      logger.warn(`Missing required s3Upload config fields: ${missing.join(', ')} — skipping S3 upload after build`)
      return
    }

    nuxt.hook('nitro:build:public-assets', async (nitro) => {
      const buildAssetsDir = nuxt.options.app.buildAssetsDir.replace(/^\/|\/$/g, '')

      logger.info('Uploading build assets')
      try {
        const { uploadAssets } = await import('./utils/s3-upload')
        await uploadAssets({
          bucket: s3.bucket!,
          endpoint: s3.endpoint!,
          accessKey: s3.accessKey!,
          secretKey: s3.secretKey!,
          dir: join(nitro.options.output.publicDir, buildAssetsDir),
          prefix: buildAssetsDir,
        })
        logger.success('S3 build assets upload completed.')
      }
      catch (err) {
        logger.error('S3 upload failed:', err)
        throw err
      }
    })
  },
})

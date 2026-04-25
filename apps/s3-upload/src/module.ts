import { defineNuxtModule, useLogger } from '@nuxt/kit'
import type { S3Config } from './utils/s3-upload'

export type { S3Config }

export interface ModuleOptions {
  s3: Partial<S3Config>
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
    s3: {
      outputDir: '.output/public/_nuxt',
    },
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

    const config: S3Config = {
      bucket: s3.bucket!,
      outputDir: s3.outputDir ?? '.output/public/_nuxt',
      endpoint: s3.endpoint!,
      accessKey: s3.accessKey!,
      secretKey: s3.secretKey!,
    }

    nuxt.hook('build:done', async () => {
      logger.info(`Uploading build assets to s3://${config.bucket}/ ...`)
      try {
        const { uploadAssets } = await import('./utils/s3-upload')
        await uploadAssets(config)
        logger.success('S3 upload complete.')
      }
      catch (err) {
        logger.error('S3 upload failed:', err)
        throw err
      }
    })
  },
})
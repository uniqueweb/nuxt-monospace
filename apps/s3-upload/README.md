# @uniqueweb/s3-upload

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt 4 module that automatically uploads your static build assets to S3-compatible storage (Cloudflare R2, AWS S3, MinIO, …) after `nuxt build`.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- Uploads built assets to any S3-compatible bucket via the `nitro:build:public-assets` hook
- Output path and S3 key prefix are derived automatically from `nitro.output.publicDir` and `app.buildAssetsDir` — no path config needed
- Skips unchanged files via ETag / MD5 checksum (equivalent to `rclone --checksum`)
- Concurrent uploads (16 parallel requests)
- Correct `Cache-Control` headers — immutable for hashed assets, `no-store` for `latest.json`
- Zero runtime overhead — build-time only

## Setup

```bash
npm install @uniqueweb/s3-upload
```

Add the module to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@uniqueweb/s3-upload'],

  s3Upload: {
    s3: {
      bucket: 'my-bucket',
      endpoint: 'https://<accountid>.r2.cloudflarestorage.com',
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
    },
  },
})
```

## Configuration

| Option       | Type     | Required | Description                        |
|--------------|----------|----------|------------------------------------|
| `bucket`     | `string` | yes      | S3 bucket name                     |
| `endpoint`   | `string` | yes      | S3-compatible endpoint URL         |
| `accessKey`  | `string` | yes      | Access key ID                      |
| `secretKey`  | `string` | yes      | Secret access key                  |

If any required field is missing the module logs a warning and skips the upload — the build itself is never aborted.

The upload directory and S3 key prefix are resolved automatically from your Nuxt config.

## Environment variables

Store credentials in `.env` and never commit them:

```env
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

## Local development

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Release new version
npm run release
```

## License

MIT

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@uniqueweb/s3-upload/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@uniqueweb/s3-upload

[npm-downloads-src]: https://img.shields.io/npm/dm/@uniqueweb/s3-upload.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@uniqueweb/s3-upload

[license-src]: https://img.shields.io/npm/l/@uniqueweb/s3-upload.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@uniqueweb/s3-upload

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
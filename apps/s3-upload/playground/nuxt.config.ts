export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  s3Upload: {
    s3: {
      // bucket: 'my-bucket',
      // endpoint: 'https://<accountid>.r2.cloudflarestorage.com',
      // accessKey: process.env.S3_ACCESS_KEY,
      // secretKey: process.env.S3_SECRET_KEY,
    },
  },
})

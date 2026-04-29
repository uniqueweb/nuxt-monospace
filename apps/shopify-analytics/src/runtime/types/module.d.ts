import type { ModuleOptions } from '../../module'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    shopifyAnalytics?: ModuleOptions
  }
  interface PublicRuntimeConfig {
    shopifyAnalytics: ModuleOptions
    shopify?: {
      domain?: string
    }
    checkoutDomain?: string
  }
}

declare module 'nuxt/schema' {
  interface NuxtConfig {
    shopifyAnalytics?: ModuleOptions
  }
  interface PublicRuntimeConfig {
    shopifyAnalytics: ModuleOptions
    shopify?: {
      domain?: string
    }
    checkoutDomain?: string
  }
}

export {}

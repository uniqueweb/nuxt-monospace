import {
  defineNuxtModule,
  addImports,
  addPlugin,
  createResolver,
} from '@nuxt/kit'

export interface ModuleOptions {
  enabled: boolean
  domain: string
  shopId: string
  checkoutDomain?: string
  hydrogenSubchannelId?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@uniqueweb/shopify-analytics',
    configKey: 'shopifyAnalytics',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },

  defaults: {
    enabled: true,
    domain: '',
    shopId: '',
    checkoutDomain: '',
    hydrogenSubchannelId: '',
  },

  setup(options, nuxt) {
    nuxt.options.runtimeConfig.public.shopifyAnalytics = {
      ...options,
      hydrogenSubchannelId: options.hydrogenSubchannelId || '',
    }

    const { resolve } = createResolver(import.meta.url)

    addImports([
      {
        name: 'useShopifyAnalytics',
        from: resolve('runtime/composables/use-shopify-analytics'),
      },
      {
        name: 'useShopifyCookies',
        from: resolve('runtime/composables/use-shopify-cookies'),
      },
      {
        name: 'useCartAnalytics',
        from: resolve('runtime/composables/use-cart-analytics'),
      },
    ])

    addPlugin({
      src: resolve('runtime/plugins/shopify-analytics.client'),
      mode: 'client',
    })

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ path: resolve('runtime/types/module.d.ts') })
      references.push({ path: resolve('runtime/types/events') })
      references.push({ path: resolve('runtime/types/payloads') })
    })
  },
})

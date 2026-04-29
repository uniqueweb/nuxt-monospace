export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',

  shopifyAnalytics: {
    enabled: true,
    domain: process.env.SHOPIFY_DOMAIN || '',
    shopId: process.env.SHOPIFY_SHOP_ID || '',
    checkoutDomain: process.env.SHOPIFY_CHECKOUT_DOMAIN || '',
  },
})

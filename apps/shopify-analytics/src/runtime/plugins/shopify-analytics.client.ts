import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import { useShopifyAnalytics } from '../composables/use-shopify-analytics'
import { useShopifyAnalyticsHandlers } from '../composables/use-shopify-analytics-handlers'
import { AnalyticsEvent } from '../types/events'

export default defineNuxtPlugin(() => {
  const { public: { shopifyAnalytics } } = useRuntimeConfig()

  if (!shopifyAnalytics?.enabled || !shopifyAnalytics?.domain) {
    if (import.meta.dev) {
      console.warn('[shopify-analytics] Module not configured or disabled')
    }
    return
  }

  const { subscribe, register } = useShopifyAnalytics()
  const {
    handlePageView,
    handleProductView,
    handleCollectionView,
    handleSearchView,
    handleAddToCart,
    handleCartView,
  } = useShopifyAnalyticsHandlers()

  const { ready } = register('Internal_Shopify_Analytics')

  subscribe(AnalyticsEvent.PAGE_VIEWED, handlePageView)
  subscribe(AnalyticsEvent.PRODUCT_VIEWED, handleProductView)
  subscribe(AnalyticsEvent.COLLECTION_VIEWED, handleCollectionView)
  subscribe(AnalyticsEvent.CART_VIEWED, handleCartView)
  subscribe(AnalyticsEvent.SEARCH_VIEWED, handleSearchView)
  subscribe(AnalyticsEvent.PRODUCT_ADD_TO_CART, handleAddToCart)

  ready()
})

import { useRuntimeConfig } from 'nuxt/app'
import type {
  BasePayload,
  PageViewPayload,
  ProductViewPayload,
  CollectionViewPayload,
  SearchViewPayload,
  CartViewPayload,
  CartLineUpdatePayload,
  ShopifyAnalyticsPayload,
  AnalyticsProduct,
} from '../types/payloads'
import { AnalyticsPageType } from '../types/events'
import {
  getClientBrowserParameters,
  createPageViewEvent,
  createProductViewEvent,
  createCollectionViewEvent,
  createSearchViewEvent,
  createCartViewEvent,
  createAddToCartEvent,
  sendToMonorail,
} from '../utils/monorail'

const PACKAGE_VERSION = '1.0.0'

export function useShopifyAnalyticsHandlers() {
  const shopDomain = useRuntimeConfig().public.shopifyAnalytics.domain as string

  function prepareBasePayload(payload: BasePayload): ShopifyAnalyticsPayload | undefined {
    if (!payload?.shop?.shopId) {
      console.error('[shopify-analytics] Missing shop.shopId')
      return
    }

    if (!payload?.shop?.currency) {
      console.error('[shopify-analytics] Missing shop.currency')
      return
    }

    if (!payload?.shop?.acceptedLanguage) {
      console.error('[shopify-analytics] Missing shop.acceptedLanguage')
      return
    }

    return {
      shopifySalesChannel: 'hydrogen',
      assetVersionId: PACKAGE_VERSION,
      shopId: payload.shop.shopId,
      currency: payload.shop.currency,
      acceptedLanguage: payload.shop.acceptedLanguage,
      hydrogenSubchannelId: payload.shop.hydrogenSubchannelId,
      hasUserConsent: true,
      ...getClientBrowserParameters(),
    }
  }

  async function handlePageView(payload: PageViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload) return

    await sendToMonorail([createPageViewEvent(basePayload)], shopDomain)
  }

  async function handleProductView(payload: ProductViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload) return

    if (!payload.products || payload.products.length === 0) {
      console.error('[shopify-analytics] Missing products data')
      return
    }

    const formattedProducts = payload.products.map((product: AnalyticsProduct) => ({
      productGid: product.id,
      variantGid: product.variantId,
      name: product.title,
      variantName: product.variantTitle,
      brand: product.vendor,
      price: product.price,
      quantity: product.quantity || 1,
      category: product.productType,
      sku: product.sku,
    }))

    basePayload.products = formattedProducts
    basePayload.pageType = AnalyticsPageType.product
    basePayload.resourceId = formattedProducts[0]?.productGid

    await sendToMonorail([
      createPageViewEvent(basePayload),
      createProductViewEvent(basePayload),
    ], shopDomain)
  }

  async function handleCollectionView(payload: CollectionViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload) return

    basePayload.pageType = AnalyticsPageType.collection
    basePayload.resourceId = payload.collection.id
    basePayload.collectionHandle = payload.collection.handle
    basePayload.collectionId = payload.collection.id

    await sendToMonorail([
      createPageViewEvent(basePayload),
      createCollectionViewEvent(basePayload),
    ], shopDomain)
  }

  async function handleSearchView(payload: SearchViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload) return

    basePayload.pageType = AnalyticsPageType.search
    basePayload.searchString = payload.searchTerm

    await sendToMonorail([
      createPageViewEvent(basePayload),
      createSearchViewEvent(basePayload),
    ], shopDomain)
  }

  async function handleCartView(payload: CartViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload) return

    basePayload.pageType = AnalyticsPageType.cart
    basePayload.cartId = payload.cart?.id
    basePayload.totalValue = payload.cart?.cost?.totalAmount?.amount
      ? Number.parseFloat(payload.cart.cost.totalAmount.amount)
      : undefined

    await sendToMonorail([createCartViewEvent(basePayload)], shopDomain)
  }

  async function handleAddToCart(payload: CartLineUpdatePayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload) return

    if (!payload.cart || !payload.currentLine) {
      console.error('[shopify-analytics] Missing cart or currentLine data')
      return
    }

    const { cart, currentLine } = payload

    basePayload.cartId = cart.id

    const cartTotal = cart.cost?.totalAmount?.amount
    if (cartTotal) {
      basePayload.totalValue = Number.parseFloat(cartTotal)
    }

    basePayload.products = [{
      productGid: currentLine.merchandise.product.id,
      variantGid: currentLine.merchandise.id,
      name: currentLine.merchandise.product.title,
      variantName: currentLine.merchandise.title,
      brand: currentLine.merchandise.product.vendor,
      price: currentLine.merchandise.price.amount,
      quantity: currentLine.quantity,
      category: currentLine.merchandise.product.productType,
      sku: currentLine.merchandise.sku,
    }]

    if (import.meta.dev) {
      console.log('[add-to-cart] Tracking:', {
        cartId: cart.id,
        cartToken: cart.id?.split('/')?.pop(),
        product: currentLine.merchandise.product.title,
        quantity: currentLine.quantity,
        cartTotal,
        uniqueToken: basePayload.uniqueToken,
        visitToken: basePayload.visitToken,
      })
    }

    await sendToMonorail([createAddToCartEvent(basePayload)], shopDomain)
  }

  return {
    handlePageView,
    handleProductView,
    handleCollectionView,
    handleSearchView,
    handleCartView,
    handleAddToCart,
  }
}

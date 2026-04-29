import type { AnalyticsEventName } from './events'

// Shop Analytics Configuration
export interface ShopAnalytics {
  shopId: string
  currency: string
  acceptedLanguage: string
  hydrogenSubchannelId?: string
}

// Base Payload
export interface BasePayload {
  shop: ShopAnalytics | null
  customData?: Record<string, unknown>
}

// URL Payload
export interface UrlPayload {
  url: string
}

// Page View Payload
export interface PageViewPayload extends BasePayload, UrlPayload {}

// Product Payload
export interface AnalyticsProduct {
  id: string
  variantId: string
  title: string
  variantTitle: string
  vendor: string
  price: string
  quantity: number
  productType?: string
  sku?: string | null
}

// Product View Payload
export interface ProductViewPayload extends BasePayload, UrlPayload {
  products: AnalyticsProduct[]
}

// Collection View Payload
export interface CollectionViewPayload extends BasePayload, UrlPayload {
  collection: {
    id: string
    handle: string
  }
}

// Search View Payload
export interface SearchViewPayload extends BasePayload, UrlPayload {
  searchTerm: string
}

// ─── Cart Types (defined locally to keep module standalone) ───────────────────

export interface AnalyticsCartMoneyAmount {
  amount: string
  currencyCode: string
}

export interface AnalyticsCartLineProduct {
  id: string
  title: string
  handle: string
  vendor: string
  productType?: string
  tags?: string[]
}

export interface AnalyticsCartLineMerchandise {
  id: string
  title: string
  sku?: string | null
  price: AnalyticsCartMoneyAmount
  image?: { url: string, altText?: string | null } | null
  selectedOptions: Array<{ name: string, value: string }>
  product: AnalyticsCartLineProduct
}

export interface AnalyticsCartLine {
  id: string
  quantity: number
  merchandise: AnalyticsCartLineMerchandise
  cost?: {
    totalAmount: AnalyticsCartMoneyAmount
  }
}

export interface AnalyticsCart {
  id: string
  totalQuantity: number
  updatedAt: string
  cost: {
    totalAmount: AnalyticsCartMoneyAmount
    subtotalAmount?: AnalyticsCartMoneyAmount
    totalTaxAmount?: AnalyticsCartMoneyAmount | null
  }
  lines: {
    edges: Array<{ node: AnalyticsCartLine }>
  }
}

// ─── Cart Payloads ────────────────────────────────────────────────────────────

export interface CartViewPayload extends BasePayload, UrlPayload {
  cart: AnalyticsCart | null
  prevCart?: AnalyticsCart | null
}

export interface CartUpdatePayload extends BasePayload, UrlPayload {
  cart: AnalyticsCart | null
  prevCart?: AnalyticsCart | null
}

export interface CartLineUpdatePayload extends CartUpdatePayload {
  currentLine?: AnalyticsCartLine
}

// ─── Monorail Types ───────────────────────────────────────────────────────────

export interface ShopifyMonorailPayload {
  products?: string[]
  [key: string]: unknown
}

export interface ShopifyMonorailEvent {
  schema_id: string
  payload: ShopifyMonorailPayload
  metadata: {
    event_created_at_ms: number
  }
}

// Client Browser Parameters
export interface ClientBrowserParameters {
  uniqueToken: string
  visitToken: string
  url: string
  path: string
  search: string
  referrer: string
  title: string
  userAgent: string
}

// Shopify Analytics Payload (sent to Monorail)
export interface ShopifyAnalyticsPayload extends ClientBrowserParameters {
  shopifySalesChannel: string
  assetVersionId?: string
  shopId: string
  currency: string
  acceptedLanguage: string
  hydrogenSubchannelId?: string
  hasUserConsent: boolean
  pageType?: string
  resourceId?: string
  collectionHandle?: string
  collectionId?: string
  searchString?: string
  products?: Array<{
    productGid: string
    variantGid: string
    name: string
    variantName: string
    brand: string
    price: string
    quantity: number
    category?: string
    sku?: string | null
  }>
  cartId?: string
  totalValue?: number
}

// Event Payloads Map
export type EventPayloads = {
  page_viewed: PageViewPayload
  product_viewed: ProductViewPayload
  collection_viewed: CollectionViewPayload
  search_viewed: SearchViewPayload
  cart_viewed: CartViewPayload
  product_added_to_cart: CartLineUpdatePayload
  product_removed_from_cart: CartLineUpdatePayload
}

export type AnalyticsEventPayload<T extends AnalyticsEventName> = EventPayloads[T]

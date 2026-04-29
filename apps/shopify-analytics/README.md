# @uniqueweb/shopify-analytics

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt module for tracking Shopify analytics events via the Monorail API, inspired by Shopify's Hydrogen framework.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- Page view tracking — automatic and manual page view events
- Product view tracking — track product impressions
- Collection view tracking — track collection page views
- Search tracking — track search queries
- Cart tracking — auto-tracking via `useCartAnalytics` + manual cart view events
- Cookie management — manages `_shopify_y` / `_shopify_s` session cookies
- Pub/Sub system — subscribe to any analytics event
- Monorail API — sends data to Shopify's analytics endpoint

## Setup

```bash
npm install @uniqueweb/shopify-analytics
```

Add the module to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@uniqueweb/shopify-analytics'],
})
```

## Configuration

### Environment Variables

```env
NUXT_PUBLIC_SHOPIFY_ANALYTICS_DOMAIN=your-store.myshopify.com
NUXT_PUBLIC_SHOPIFY_ANALYTICS_SHOP_ID=gid://shopify/Shop/12345678
NUXT_PUBLIC_SHOPIFY_ANALYTICS_CHECKOUT_DOMAIN=checkout.your-store.com
NUXT_PUBLIC_SHOPIFY_ANALYTICS_HYDROGEN_SUBCHANNEL_ID=your-subchannel-id
```

| Variable | Required | Description |
|---|---|---|
| `NUXT_PUBLIC_SHOPIFY_ANALYTICS_DOMAIN` | Yes | Shopify store domain (without `https://`), used for the Monorail endpoint |
| `NUXT_PUBLIC_SHOPIFY_ANALYTICS_SHOP_ID` | Yes | Shopify shop GID (`gid://shopify/Shop/...`) |
| `NUXT_PUBLIC_SHOPIFY_ANALYTICS_CHECKOUT_DOMAIN` | No | Checkout domain — used to calculate the common parent domain for cookie sharing between storefront and checkout |
| `NUXT_PUBLIC_SHOPIFY_ANALYTICS_HYDROGEN_SUBCHANNEL_ID` | No | Hydrogen subchannel ID |

## Initialization

The module is split into three parts:

**1. Plugin (automatic)** — runs on app start, registers all Monorail event handlers via `subscribe()`.

**2. `app.vue`** — called once after localization is available. Sets cookies and shop context via `watchEffect` so changes to consent or locale are reactive. Also wires up cart auto-tracking.

```vue
<!-- app.vue -->
<script setup lang="ts">
const shopifyShopStore = useShopifyShopStore()
const shopifyCartStore = useShopifyCartStore()

await shopifyShopStore.getLocalization()

if (import.meta.client) {
  const { setShop } = useShopifyAnalytics()
  const { public: { shopifyAnalytics } } = useRuntimeConfig()

  watchEffect(() => {
    // TODO: replace with reactive consent value from your CMP
    const hasConsent = true

    useShopifyCookies({
      hasUserConsent: hasConsent,
      checkoutDomain: shopifyAnalytics.checkoutDomain,
    })

    if (hasConsent) {
      setShop({
        shopId: shopifyAnalytics.shopId,
        currency: shopifyShopStore.buyerCurrencyCode ?? 'EUR',
        acceptedLanguage: shopifyShopStore.buyerLanguageCode ?? 'DE',
        hydrogenSubchannelId: shopifyAnalytics.hydrogenSubchannelId,
      })
    }
    else {
      setShop(null)
    }
  })

  useCartAnalytics(shopifyCartStore)
}
</script>
```

> `setShop()` and `useShopifyCookies()` are wrapped in `watchEffect` so they react to consent changes and locale updates automatically. `useCartAnalytics()` is called once — it sets up an internal `watch` on the cart store.

## Usage

In all `publish()` calls, pass `shop: getShop()` instead of a hardcoded shop object:

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics()

publish(AnalyticsEvent.PAGE_VIEWED, {
  url: window.location.href,
  shop: getShop(),
})
</script>
```

### Product View Tracking

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics()

onMounted(() => {
  publish(AnalyticsEvent.PRODUCT_VIEWED, {
    url: window.location.href,
    shop: getShop(),
    products: [
      {
        id: product.value.id,
        variantId: variant.value.id,
        title: product.value.title,
        variantTitle: variant.value.title,
        vendor: product.value.vendor,
        price: variant.value.price.amount,
        quantity: 1,
      },
    ],
  })
})
</script>
```

### Collection View Tracking

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics()

onMounted(() => {
  publish(AnalyticsEvent.COLLECTION_VIEWED, {
    url: window.location.href,
    shop: getShop(),
    collection: {
      id: collection.value.id,
      handle: collection.value.handle,
    },
  })
})
</script>
```

### Search Tracking

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics()

function handleSearch(searchTerm: string) {
  publish(AnalyticsEvent.SEARCH_VIEWED, {
    url: window.location.href,
    shop: getShop(),
    searchTerm,
  })
}
</script>
```

### Cart View Tracking

Publish manually when the cart is opened (e.g. in an aside/drawer component):

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics()
const shopifyCartStore = useShopifyCartStore()

publish(AnalyticsEvent.CART_VIEWED, {
  url: window.location.href,
  shop: getShop(),
  cart: shopifyCartStore.cart ?? null,
})
</script>
```

### Add to Cart / Remove from Cart Tracking

These events are tracked **automatically** by `useCartAnalytics()` (initialized in `app.vue`). It watches the cart store and compares lines between updates to detect additions and removals — including quantity changes.

No manual `publish()` call is needed for cart line events.

### Custom Event Subscribers

```typescript
// plugins/custom-analytics.client.ts
export default defineNuxtPlugin(() => {
  const { subscribe, AnalyticsEvent } = useShopifyAnalytics()

  subscribe(AnalyticsEvent.PRODUCT_VIEWED, (payload) => {
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        items: payload.products.map((p) => ({
          item_id: p.id,
          item_name: p.title,
          price: p.price,
        })),
      })
    }
  })

  subscribe(AnalyticsEvent.PRODUCT_ADD_TO_CART, (payload) => {
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [payload.currentLine.merchandise.id],
        content_type: 'product',
      })
    }
  })
})
```

## API Reference

### `useShopifyAnalytics()`

- `publish<T>(event, payload)` — Publish an analytics event
- `subscribe<T>(event, callback)` — Subscribe to an event (returns an unsubscribe function)
- `setShop(shop | null)` — Set or clear shop configuration (call in `app.vue`)
- `getShop()` — Get current shop configuration (use in `publish()` calls)
- `canTrack()` — Check if tracking is allowed
- `AnalyticsEvent` — Enum of all event names

All methods are no-ops on the server (SSR-safe).

### `useCartAnalytics(cartStore)`

Watches a Pinia cart store for changes and automatically publishes `PRODUCT_ADD_TO_CART` / `PRODUCT_REMOVED_FROM_CART` events. Uses `localStorage` to deduplicate events across page reloads.

```ts
// Call once in app.vue, client-only
useCartAnalytics(shopifyCartStore)
```

### `useShopifyCookies(options?)`

Manages `_shopify_y` (1-year user token) and `_shopify_s` (30-min session token) cookies required by Shopify's Live View and analytics.

```ts
useShopifyCookies({
  hasUserConsent: true,        // removes cookies if false
  domain: 'example.com',       // optional, defaults to window.location.host
  checkoutDomain: 'checkout.example.com', // optional, without https://
})
```

`checkoutDomain` calculates the common parent domain between the storefront and the checkout subdomain and sets the cookie there, so it is accessible on both. Example:

| `window.location.host` | `checkoutDomain` | Cookie domain |
|---|---|---|
| `store.com` | `checkout.store.com` | `.store.com` |
| `localhost:3000` | `checkout.store.com` | _(no domain attr)_ |

### Event Types

| Event | Trigger |
|---|---|
| `AnalyticsEvent.PAGE_VIEWED` | Manual — call on every page |
| `AnalyticsEvent.PRODUCT_VIEWED` | Manual — call on product page |
| `AnalyticsEvent.COLLECTION_VIEWED` | Manual — call on collection page |
| `AnalyticsEvent.SEARCH_VIEWED` | Manual — call on search |
| `AnalyticsEvent.CART_VIEWED` | Manual — call when cart opens |
| `AnalyticsEvent.PRODUCT_ADD_TO_CART` | Automatic via `useCartAnalytics` |
| `AnalyticsEvent.PRODUCT_REMOVED_FROM_CART` | Automatic via `useCartAnalytics` |

## How It Works

1. **Plugin** registers all Monorail event handlers via `subscribe()` and marks the analytics system as ready
2. **`useShopifyCookies()`** sets `_shopify_y` / `_shopify_s` cookies, wrapped in `watchEffect` for consent reactivity
3. **`setShop()`** provides shop context (id, currency, language) used in every event payload, also inside `watchEffect`
4. **`useCartAnalytics()`** watches the cart store; on each update it diffs the cart lines and publishes add/remove events
5. **Pub/Sub** queues events until the plugin is ready, then flushes automatically
6. **Monorail** events are sent to `https://{domain}/.well-known/shopify/monorail/unstable/produce_batch`

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

## Credits

Inspired by and based on the [shopify-analytics module](https://github.com/pixelastronauts/nitrogen/tree/shopify-analytics/modules/shopify-analytics) from [pixelastronauts/nitrogen](https://github.com/pixelastronauts). Adapted and modified for this project — thank you for the inspiration!

## License

MIT

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@uniqueweb/shopify-analytics/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@uniqueweb/shopify-analytics

[npm-downloads-src]: https://img.shields.io/npm/dm/@uniqueweb/shopify-analytics.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@uniqueweb/shopify-analytics

[license-src]: https://img.shields.io/npm/l/@uniqueweb/shopify-analytics.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@uniqueweb/shopify-analytics

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com

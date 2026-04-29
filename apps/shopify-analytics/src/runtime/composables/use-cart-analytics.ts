import { watch } from 'vue'
import type { AnalyticsCart } from '../types/payloads'
import { useShopifyAnalytics } from './use-shopify-analytics'

export function useCartAnalytics(cartStore: Record<string, unknown>) {
  if (!import.meta.client) return

  const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics()

  let prevCart: AnalyticsCart | null = null
  let lastEventId: string | null = null

  watch(
    () => cartStore.cart as AnalyticsCart | null,
    (currentCart) => {
      if (!currentCart) return

      const shop = getShop()
      if (!shop?.shopId) {
        console.warn('[cart-analytics] Shop not configured, skipping cart tracking')
        return
      }

      if (currentCart.updatedAt === prevCart?.updatedAt) return

      // Prevent duplicate events on page reload via localStorage
      let storedCart: {
        id: string
        updatedAt: string
      } | null = null
      try {
        const stored = localStorage.getItem('cartLastUpdatedAt')
        if (stored) storedCart = JSON.parse(stored)
      }
      catch {
        storedCart = null
      }

      if (currentCart.id === storedCart?.id && currentCart.updatedAt === storedCart?.updatedAt) {
        prevCart = currentCart
        return
      }

      if (currentCart.updatedAt === lastEventId) {
        prevCart = currentCart
        return
      }
      lastEventId = currentCart.updatedAt

      try {
        localStorage.setItem('cartLastUpdatedAt', JSON.stringify({
          id: currentCart.id,
          updatedAt: currentCart.updatedAt,
        }))
      }
      catch {
        console.warn('[cart-analytics] Failed to save to localStorage')
      }

      const prevLines = prevCart?.lines?.edges?.map(edge => edge.node) ?? []
      const currentLines = currentCart.lines?.edges?.map(edge => edge.node) ?? []

      prevLines.forEach((prevLine) => {
        const matchedLine = currentLines.find(line => line.id === prevLine.id)

        if (matchedLine) {
          if (prevLine.quantity < matchedLine.quantity) {
            publish(AnalyticsEvent.PRODUCT_ADD_TO_CART, {
              url: window.location.href,
              shop,
              cart: currentCart,
              prevCart,
              currentLine: matchedLine,
            })
          }
          else if (prevLine.quantity > matchedLine.quantity) {
            publish(AnalyticsEvent.PRODUCT_REMOVED_FROM_CART, {
              url: window.location.href,
              shop,
              cart: currentCart,
              prevCart,
              currentLine: matchedLine,
            })
          }
        }
        else {
          publish(AnalyticsEvent.PRODUCT_REMOVED_FROM_CART, {
            url: window.location.href,
            shop,
            cart: currentCart,
            prevCart,
            currentLine: prevLine,
          })
        }
      })

      currentLines.forEach((line) => {
        if (!prevLines.some(prevLine => line.id === prevLine.id)) {
          publish(AnalyticsEvent.PRODUCT_ADD_TO_CART, {
            url: window.location.href,
            shop,
            cart: currentCart,
            prevCart,
            currentLine: line,
          })
        }
      })

      prevCart = currentCart
    },
    {
      deep: true,
    },
  )
}

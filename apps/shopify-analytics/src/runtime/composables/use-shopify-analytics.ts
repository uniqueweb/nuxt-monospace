import type {
  EventPayloads,
  ShopAnalytics,
} from '../types/payloads'
import {
  AnalyticsEvent, type AnalyticsEventName,
} from '../types/events'

type SubscriberCallback = (payload: unknown) => void

// Client-only module-level state — persists across component lifecycles
const subscribers = new Map<string, Map<string, SubscriberCallback>>()
const registers: Record<string, boolean> = {}
const waitForReadyQueue = new Map<string, unknown>()
let shopConfig: ShopAnalytics | null = null

export function useShopifyAnalytics() {
  // Analytics are client-only — return no-ops on the server to prevent
  // shared module-level state from being mutated across SSR requests
  if (import.meta.server) {
    return {
      subscribe: () => () => {},
      publish: () => {},
      register: () => ({ ready: () => {} }),
      canTrack: () => false,
      setShop: (_shop: ShopAnalytics | null) => {},
      getShop: (): ShopAnalytics | null => null,
      AnalyticsEvent,
    }
  }

  function subscribe<T extends AnalyticsEventName>(
    event: T,
    callback: (payload: EventPayloads[T]) => void,
  ): () => void {
    if (!subscribers.has(event)) {
      subscribers.set(event, new Map())
    }

    const id = Math.random().toString(36).substring(7)
    subscribers.get(event)!.set(id, callback as SubscriberCallback)

    return () => {
      subscribers.get(event)?.delete(id)
    }
  }

  function publish<T extends AnalyticsEventName>(
    event: T,
    payload: EventPayloads[T],
  ): void {
    if (!areRegistersReady()) {
      waitForReadyQueue.set(event, payload)
      return
    }

    const eventSubscribers = subscribers.get(event)
    if (eventSubscribers) {
      eventSubscribers.forEach((callback) => {
        try {
          callback(payload)
        }
        catch (error) {
          console.error(`[shopify-analytics] Error in subscriber for ${event}:`, error)
        }
      })
    }
  }

  function register(key: string) {
    if (!Object.prototype.hasOwnProperty.call(registers, key)) {
      registers[key] = false
    }

    return {
      ready: () => {
        registers[key] = true

        if (areRegistersReady() && waitForReadyQueue.size > 0) {
          waitForReadyQueue.forEach((queuePayload, queueEvent) => {
            publish(queueEvent as AnalyticsEventName, queuePayload)
          })
          waitForReadyQueue.clear()
        }
      },
    }
  }

  function areRegistersReady(): boolean {
    const keys = Object.keys(registers)
    if (keys.length === 0)
      return true

    return keys.every(key => registers[key] === true)
  }

  function setShop(shop: ShopAnalytics | null) {
    shopConfig = shop
  }

  function getShop(): ShopAnalytics | null {
    return shopConfig
  }

  function canTrack(): boolean {
    return true
  }

  return {
    subscribe,
    publish,
    register,
    canTrack,
    setShop,
    getShop,
    AnalyticsEvent,
  }
}

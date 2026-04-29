/**
 * Shopify Cookies Management
 * Sets _shopify_y and _shopify_s cookies for session tracking
 */

const SHOPIFY_Y = '_shopify_y'
const SHOPIFY_S = '_shopify_s'

const longTermLength = 60 * 60 * 24 * 360 // ~1 year expiry
const shortTermLength = 60 * 30 // 30 mins

interface UseShopifyCookiesOptions {
  /**
   * If set to false, Shopify cookies will be removed.
   * If set to true, Shopify unique user token cookie will have cookie expiry of 1 year.
   */
  hasUserConsent?: boolean
  /**
   * The domain scope of the cookie. Defaults to window.location.host.
   */
  domain?: string
  /**
   * The checkout domain of the shop. Used to calculate the common parent domain for cookie sharing
   * between storefront and checkout (e.g. store.com and checkout.store.com).
   */
  checkoutDomain?: string
}

function hexTime(): string {
  const dateNumber = new Date().getTime() >>> 0

  let perfNumber = 0
  try {
    perfNumber = performance.now() >>> 0
  }
  catch {
    perfNumber = 0
  }

  const output = Math.abs(dateNumber + perfNumber)
    .toString(16)
    .toLowerCase()

  return output.padStart(8, '0')
}

function buildUUID(): string {
  const tokenHash = 'xxxx-4xxx-xxxx-xxxxxxxxxxxx'

  let hash = ''
  try {
    const crypto = window.crypto
    const randomValuesArray = new Uint16Array(31)
    crypto.getRandomValues(randomValuesArray)

    let i = 0
    hash = tokenHash.replace(/x/g, (c) => {
      const r = (randomValuesArray[i] ?? 0) % 16
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      i++
      return v.toString(16)
    }).toUpperCase()
  }
  catch {
    hash = tokenHash.replace(/x/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    }).toUpperCase()
  }

  return `${hexTime()}-${hash}`
}

function getShopifyCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  cookieString.split(';').forEach((cookie) => {
    const [
      key,
      value,
    ] = cookie.trim().split('=')
    if (key && value) {
      cookies[key] = value
    }
  })

  return {
    [SHOPIFY_Y]: cookies[SHOPIFY_Y] || '',
    [SHOPIFY_S]: cookies[SHOPIFY_S] || '',
  }
}

function setCookie(
  name: string,
  value: string,
  maxAge: number,
  domain: string,
): void {
  const parts = [
    `${name}=${value}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'SameSite=Lax',
  ]

  if (domain) {
    parts.push(`Domain=${domain}`)
  }

  document.cookie = parts.join('; ')
}

export function useShopifyCookies(options: UseShopifyCookiesOptions = {}) {
  const {
    hasUserConsent = true,
    domain = '',
    checkoutDomain = '',
  } = options

  if (typeof document === 'undefined') {
    return
  }

  const cookies = getShopifyCookies(document.cookie)

  function initializeCookies() {
    let currentDomain = domain || window.location.host

    if (checkoutDomain) {
      const checkoutDomainParts = checkoutDomain.split('.').reverse()
      const currentDomainParts = currentDomain.split('.').reverse()
      const sameDomainParts: string[] = []

      checkoutDomainParts.forEach((part: string, index: number) => {
        if (part === currentDomainParts[index]) {
          sameDomainParts.push(part)
        }
      })

      currentDomain = sameDomainParts.reverse().join('.')
    }

    if (currentDomain.startsWith('localhost')) {
      currentDomain = ''
    }

    // Shopify checkout requires cookies with leading dot domain
    const domainWithLeadingDot = currentDomain
      ? /^\./.test(currentDomain)
        ? currentDomain
        : `.${currentDomain}`
      : ''

    if (hasUserConsent) {
      setCookie(
        SHOPIFY_Y,
        cookies[SHOPIFY_Y] || buildUUID(),
        longTermLength,
        domainWithLeadingDot,
      )

      setCookie(
        SHOPIFY_S,
        cookies[SHOPIFY_S] || buildUUID(),
        shortTermLength,
        domainWithLeadingDot,
      )
    }
    else {
      setCookie(SHOPIFY_Y, '', 0, domainWithLeadingDot)
      setCookie(SHOPIFY_S, '', 0, domainWithLeadingDot)
    }
  }

  initializeCookies()
}

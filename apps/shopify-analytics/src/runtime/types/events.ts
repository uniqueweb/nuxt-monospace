// Analytics Event Types
export const AnalyticsEvent = {
  // Views
  PAGE_VIEWED: 'page_viewed' as const,
  PRODUCT_VIEWED: 'product_viewed' as const,
  COLLECTION_VIEWED: 'collection_viewed' as const,
  CART_VIEWED: 'cart_viewed' as const,
  SEARCH_VIEWED: 'search_viewed' as const,

  // Cart
  PRODUCT_ADD_TO_CART: 'product_added_to_cart' as const,
  PRODUCT_REMOVED_FROM_CART: 'product_removed_from_cart' as const,
}

export type AnalyticsEventName = typeof AnalyticsEvent[keyof typeof AnalyticsEvent]

// Page Types
export const AnalyticsPageType = {
  article: 'article',
  blog: 'blog',
  captcha: 'captcha',
  cart: 'cart',
  collection: 'collection',
  customersAccount: 'customers/account',
  customersActivateAccount: 'customers/activate_account',
  customersAddresses: 'customers/addresses',
  customersLogin: 'customers/login',
  customersOrder: 'customers/order',
  customersRegister: 'customers/register',
  customersResetPassword: 'customers/reset_password',
  giftCard: 'gift_card',
  home: 'index',
  listCollections: 'list-collections',
  forbidden: 'forbidden',
  notFound: 'not_found',
  page: 'page',
  password: 'password',
  product: 'product',
  policy: 'policy',
  search: 'search',
} as const

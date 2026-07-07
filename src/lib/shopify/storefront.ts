// Fetches an artist's products from their Shopify store via the Storefront API.
// The artist provides their store domain + a Storefront access token (created in
// their own Shopify admin). No platform-level OAuth app required.

export type ShopifyProduct = {
  id: string
  title: string
  url: string
  image: string | null
  price: string
  currency: string
}

type StorefrontNode = {
  id: string
  title: string
  handle: string
  onlineStoreUrl: string | null
  featuredImage: { url: string } | null
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } }
}

const QUERY = `{
  products(first: 12, sortKey: BEST_SELLING) {
    edges { node {
      id title handle onlineStoreUrl
      featuredImage { url }
      priceRange { minVariantPrice { amount currencyCode } }
    } }
  }
}`

export async function fetchShopifyProducts(domain: string, token: string): Promise<ShopifyProduct[]> {
  const clean = domain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  if (!clean || !token.trim()) return []

  try {
    const res = await fetch(`https://${clean}/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token.trim(),
      },
      body: JSON.stringify({ query: QUERY }),
      // Cache each store's catalog for 5 minutes to keep the page fast.
      next: { revalidate: 300 },
    })
    if (!res.ok) return []

    const json = (await res.json()) as { data?: { products?: { edges?: { node: StorefrontNode }[] } } }
    const edges = json.data?.products?.edges ?? []

    return edges.map(({ node: n }) => ({
      id: n.id,
      title: n.title,
      url: n.onlineStoreUrl || `https://${clean}/products/${n.handle}`,
      image: n.featuredImage?.url ?? null,
      price: n.priceRange?.minVariantPrice?.amount ?? '',
      currency: n.priceRange?.minVariantPrice?.currencyCode ?? 'USD',
    }))
  } catch {
    return []
  }
}

export function formatShopifyPrice(amount: string, currency: string): string {
  if (!amount) return ''
  const n = parseFloat(amount)
  const value = Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2)
  if (currency === 'USD') return `$${value}`
  return `${value} ${currency}`
}

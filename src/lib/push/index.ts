import webpush from 'web-push'

let configured = false

// Returns a configured web-push, or null if VAPID keys aren't set yet.
export function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return null
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:info@pennyfly.com', publicKey, privateKey)
    configured = true
  }
  return webpush
}

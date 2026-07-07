'use client'

import { useEffect } from 'react'

// Fires once when the dashboard loads. Attributes a referral if the cookie is
// present; the endpoint is idempotent and clears the cookie afterward.
export default function ReferralClaim() {
  useEffect(() => {
    fetch('/api/refer/claim', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}

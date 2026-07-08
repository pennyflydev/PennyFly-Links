import { createSign } from 'crypto'

// Builds a "Save to Google Wallet" URL: a JWT (RS256, signed with the issuer's
// service-account key) describing a generic pass for the artist. Returns null
// if Google Wallet isn't configured, so the button simply doesn't render.
//
// Requires env:
//   GOOGLE_WALLET_ISSUER_ID     – your Google Wallet issuer id
//   GOOGLE_WALLET_CLASS_ID       – suffix of a pre-created generic class
//   GOOGLE_WALLET_SA_EMAIL       – service account email
//   GOOGLE_WALLET_SA_PRIVATE_KEY – service account private key (PEM)

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function buildGoogleWalletSaveUrl(artist: {
  id: string
  artist_name: string
  slug: string
  avatar_url: string | null
}): string | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
  const classSuffix = process.env.GOOGLE_WALLET_CLASS_ID
  const saEmail = process.env.GOOGLE_WALLET_SA_EMAIL
  const rawKey = process.env.GOOGLE_WALLET_SA_PRIVATE_KEY
  if (!issuerId || !classSuffix || !saEmail || !rawKey) return null

  // Env-stored keys usually have escaped newlines.
  const privateKey = rawKey.replace(/\\n/g, '\n')
  const origin = process.env.NEXT_PUBLIC_PROD_URL || 'https://penny-fly-links.vercel.app'
  const pageUrl = `${origin}/${artist.slug}`

  const genericObject = {
    id: `${issuerId}.flylink-${artist.id}`,
    classId: `${issuerId}.${classSuffix}`,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#000000',
    cardTitle: { defaultValue: { language: 'en-US', value: 'FlyLink' } },
    header: { defaultValue: { language: 'en-US', value: artist.artist_name } },
    subheader: { defaultValue: { language: 'en-US', value: 'Follow for drops & shows' } },
    ...(artist.avatar_url ? { logo: { sourceUri: { uri: artist.avatar_url } } } : {}),
    linksModuleData: { uris: [{ uri: pageUrl, description: 'Open FlyLink page', id: 'flylink' }] },
  }

  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: saEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [origin],
    payload: { genericObjects: [genericObject] },
  }

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  try {
    const signer = createSign('RSA-SHA256')
    signer.update(unsigned)
    signer.end()
    const signature = base64url(signer.sign(privateKey))
    return `https://pay.google.com/gp/v/save/${unsigned}.${signature}`
  } catch {
    return null
  }
}

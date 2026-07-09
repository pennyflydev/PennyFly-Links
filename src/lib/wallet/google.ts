import { createSign } from 'crypto'

// "Save to Google Wallet" URLs: a JWT (RS256, signed with the issuer's
// service-account key) describing a pass. Returns null if Google Wallet isn't
// configured, so the button simply doesn't render.
//
// Requires env:
//   GOOGLE_WALLET_ISSUER_ID     – your Google Wallet issuer id
//   GOOGLE_WALLET_CLASS_ID       – suffix of a pre-created generic class
//   GOOGLE_WALLET_SA_EMAIL       – service account email
//   GOOGLE_WALLET_SA_PRIVATE_KEY – service account private key (PEM)

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

type WalletConfig = { issuerId: string; classSuffix: string; saEmail: string; privateKey: string; origin: string }

function walletConfig(): WalletConfig | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
  const classSuffix = process.env.GOOGLE_WALLET_CLASS_ID
  const saEmail = process.env.GOOGLE_WALLET_SA_EMAIL
  const rawKey = process.env.GOOGLE_WALLET_SA_PRIVATE_KEY
  if (!issuerId || !classSuffix || !saEmail || !rawKey) return null
  return {
    issuerId,
    classSuffix,
    saEmail,
    privateKey: rawKey.replace(/\\n/g, '\n'), // env keys usually have escaped newlines
    origin: process.env.NEXT_PUBLIC_PROD_URL || 'https://penny-fly-links.vercel.app',
  }
}

// Sign a save JWT for one generic object and return the pay.google.com URL.
function signSaveUrl(cfg: WalletConfig, genericObject: Record<string, unknown>): string | null {
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: cfg.saEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [cfg.origin],
    payload: { genericObjects: [genericObject] },
  }
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  try {
    const signer = createSign('RSA-SHA256')
    signer.update(unsigned)
    signer.end()
    return `https://pay.google.com/gp/v/save/${unsigned}.${base64url(signer.sign(cfg.privateKey))}`
  } catch {
    return null
  }
}

// Artist loyalty-style pass (from the public page).
export function buildGoogleWalletSaveUrl(artist: {
  id: string
  artist_name: string
  slug: string
  avatar_url: string | null
}): string | null {
  const cfg = walletConfig()
  if (!cfg) return null
  return signSaveUrl(cfg, {
    id: `${cfg.issuerId}.flylink-${artist.id}`,
    classId: `${cfg.issuerId}.${cfg.classSuffix}`,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#000000',
    cardTitle: { defaultValue: { language: 'en-US', value: 'FlyLink' } },
    header: { defaultValue: { language: 'en-US', value: artist.artist_name } },
    subheader: { defaultValue: { language: 'en-US', value: 'Follow for drops & shows' } },
    ...(artist.avatar_url ? { logo: { sourceUri: { uri: artist.avatar_url } } } : {}),
    linksModuleData: { uris: [{ uri: `${cfg.origin}/${artist.slug}`, description: 'Open FlyLink page', id: 'flylink' }] },
  })
}

// Event-ticket pass. The QR barcode encodes the ticket token, so scanning the
// wallet pass hits the same door-scan validate flow as the web ticket.
export function buildGoogleWalletTicketUrl(ticket: {
  ticketId: string
  token: string
  eventTitle: string
  dateStr: string
  venue: string | null
  ticketType: string
  buyerName: string | null
}): string | null {
  const cfg = walletConfig()
  if (!cfg) return null

  const textModules = [
    { id: 'type', header: 'Ticket', body: ticket.ticketType },
    ...(ticket.dateStr ? [{ id: 'date', header: 'When', body: ticket.dateStr }] : []),
    ...(ticket.venue ? [{ id: 'venue', header: 'Where', body: ticket.venue }] : []),
  ]

  return signSaveUrl(cfg, {
    id: `${cfg.issuerId}.ticket-${ticket.ticketId}`,
    classId: `${cfg.issuerId}.${cfg.classSuffix}`,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#000000',
    cardTitle: { defaultValue: { language: 'en-US', value: ticket.eventTitle } },
    header: { defaultValue: { language: 'en-US', value: ticket.buyerName || 'Admit one' } },
    subheader: { defaultValue: { language: 'en-US', value: ticket.ticketType } },
    barcode: { type: 'QR_CODE', value: ticket.token, alternateText: ticket.ticketType },
    textModulesData: textModules,
  })
}

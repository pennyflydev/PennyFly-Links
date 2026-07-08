import { randomBytes } from 'crypto'

// Unguessable ticket token (what the QR encodes).
export function newTicketToken(): string {
  return randomBytes(16).toString('hex')
}

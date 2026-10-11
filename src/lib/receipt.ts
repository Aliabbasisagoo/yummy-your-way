import { menuItems, money } from './menu'

export type OrderLine = {
  id: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  portion?: string | undefined
}

export type OrderDraft = {
  cart: Record<string, number>
  mode: string
  locationName: string
  customerName: string
  customerPhone?: string | undefined
  note?: string | undefined
}

const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Only dishes that exist on the menu, with prices taken from the menu itself. */
export function orderLines(cart: Record<string, number>): OrderLine[] {
  return menuItems
    .filter(item => (cart[item.id] ?? 0) > 0)
    .map(item => {
      const quantity = cart[item.id] ?? 0
      return {
        id: item.id,
        name: item.name,
        quantity,
        unitPrice: item.price,
        lineTotal: item.price * quantity,
        portion: item.portion,
      }
    })
}

export function orderTotals(cart: Record<string, number>) {
  const lines = orderLines(cart)
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  return { lines, subtotal, total: subtotal }
}

/** Short, human-friendly reference such as ANK-20261010-7KQ4. */
export function makeOrderRef(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const bytes = new Uint8Array(4)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  const suffix = Array.from(bytes, byte => REF_ALPHABET[byte % REF_ALPHABET.length]).join('')
  return `ANK-${y}${m}${d}-${suffix}`
}

/** The text the restaurant receives on WhatsApp: what was ordered, from where, for how much. */
export function buildReceipt(draft: OrderDraft, orderRef: string, placedAt: Date): string {
  const { lines, subtotal, total } = orderTotals(draft.cart)
  const placed = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(placedAt)

  const head = [
    '*SAGE Cafe & Grill F-7 — new order*',
    '',
    `Order: ${orderRef}`,
    `Placed: ${placed} (Karachi)`,
    `Type: ${draft.mode}`,
    `Location: ${draft.locationName}`,
    `Customer: ${draft.customerName}`,
  ]
  if (draft.customerPhone) head.push(`Phone: ${draft.customerPhone}`)

  const items = lines.map(line =>
    `• ${line.quantity} × ${line.name}${line.portion ? ` (${line.portion})` : ''} — ${money(line.lineTotal)}`,
  )

  const tail = ['', '*Items*', ...items, '', `*Subtotal: ${money(subtotal)}*`, `*Total: ${money(total)}*`]
  if (draft.note) tail.push('', `Note: ${draft.note}`)

  return [...head, ...tail].join('\n')
}

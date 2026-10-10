import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export type InboxClient = SupabaseClient<Database>

export type OrderRow = {
  id: string
  status: string
  message_id: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  provider_error: string | null
}

const RANK: Record<string, number> = { pending: 0, accepted: 1, sent: 2, delivered: 3, read: 4 }
const TIMESTAMPS: Record<string, 'sent_at' | 'delivered_at' | 'read_at'> = {
  sent: 'sent_at',
  delivered: 'delivered_at',
  read: 'read_at',
}

function describeErrors(errors: unknown): string | null {
  if (!Array.isArray(errors) || errors.length === 0) return null
  const parts = errors
    .map(raw => {
      const error = raw as { message?: unknown; title?: unknown; code?: unknown }
      const message = typeof error?.message === 'string' ? error.message : typeof error?.title === 'string' ? error.title : ''
      const code = error?.code === undefined ? '' : ` [${String(error.code)}]`
      return `${message}${code}`.trim()
    })
    .filter(Boolean)
  return parts.length ? parts.join('; ') : 'WhatsApp reported a delivery failure.'
}

/**
 * Applies one delivery callback to its order.
 * Only moves the order forward (sent -> delivered -> read) and never lets an older
 * callback overwrite a later one, while still keeping each callback's own timestamp.
 */
export async function applyStatus(
  db: InboxClient,
  order: OrderRow,
  status: string,
  providerTimestamp: string | null,
  errors: unknown,
): Promise<void> {
  const stamp = providerTimestamp ?? new Date().toISOString()
  const currentRank = RANK[order.status] ?? 0
  const update: Record<string, unknown> = {}

  if (status === 'failed') {
    if (currentRank >= (RANK.delivered ?? 3)) return
    update.status = 'failed'
    update.failed_at = order.failed_at ?? stamp
    update.provider_error = describeErrors(errors)
  } else {
    const rank = RANK[status]
    if (rank === undefined) return
    const column = TIMESTAMPS[status]
    if (column && !order[column]) update[column] = stamp
    if (rank > currentRank) update.status = status
    if (Object.keys(update).length === 0) return
  }

  update.updated_at = new Date().toISOString()
  const { error } = await db.from('whatsapp_orders').update(update).eq('id', order.id)
  if (error) throw new Error(`Could not record delivery status "${status}": ${error.message}`)
}

async function findOrder(db: InboxClient, messageId: string): Promise<OrderRow | null> {
  const { data, error } = await db
    .from('whatsapp_orders')
    .select('id, status, message_id, sent_at, delivered_at, read_at, failed_at, provider_error')
    .eq('message_id', messageId)
    .maybeSingle()
  if (error) throw new Error(`Could not read the order for message ${messageId}: ${error.message}`)
  return (data as OrderRow | null) ?? null
}

/**
 * Replays every stored callback for a sent message onto its order.
 * Covers both arrival orders: a callback that landed before the order saved its
 * message id, and callbacks that arrive afterwards.
 */
export async function reconcileMessage(db: InboxClient, messageId: string): Promise<void> {
  const order = await findOrder(db, messageId)
  if (!order) return

  const { data, error } = await db
    .from('whatsapp_message_statuses')
    .select('status, provider_timestamp, errors')
    .eq('message_id', messageId)
    .order('provider_timestamp', { ascending: true })
  if (error) throw new Error(`Could not read stored delivery statuses: ${error.message}`)

  for (const row of data ?? []) {
    await applyStatus(db, order, row.status, row.provider_timestamp, row.errors)
  }
}

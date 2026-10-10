import { verifyWebhookRequest, WebhookError } from '@lovable.dev/webhooks-js'
import { createFileRoute } from '@tanstack/react-router'

import { applyStatus, reconcileMessage, type InboxClient } from '@/lib/whatsapp-status'

type Json = Record<string, unknown>
type JsonArray = unknown[]

type WebhookRow = {
  id: string
  event: string
  payload: Json
  attempts: number
  processed_at: string | null
}

const asRecord = (value: unknown): Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Json) : {}
const asArray = (value: unknown): JsonArray => (Array.isArray(value) ? value : [])

function json(body: unknown, status = 200) {
  return Response.json(body, { status })
}

/**
 * Durable receiver for every WhatsApp callback Lovable forwards for the connected number.
 * Each delivery is stored before it is processed, so a retry reuses the same row and
 * nothing is acted on twice.
 */
async function storeEvent(
  db: InboxClient,
  input: { deliveryId: string; event: string; payload: Json },
): Promise<{ ok: true; row: WebhookRow } | { ok: false }> {
  const upsert = await db
    .from('whatsapp_webhook_events')
    .upsert(
      { delivery_id: input.deliveryId, event: input.event, payload: input.payload },
      { onConflict: 'delivery_id', ignoreDuplicates: true },
    )
  if (upsert.error) {
    console.error(`Could not store WhatsApp delivery ${input.deliveryId}: ${upsert.error.message}`)
    return { ok: false }
  }

  const read = await db
    .from('whatsapp_webhook_events')
    .select('id, event, payload, attempts, processed_at')
    .eq('delivery_id', input.deliveryId)
    .maybeSingle()
  if (read.error || !read.data) {
    console.error(`Could not read back WhatsApp delivery ${input.deliveryId}: ${read.error?.message ?? 'row missing'}`)
    return { ok: false }
  }

  return { ok: true, row: read.data as WebhookRow }
}

async function markProcessed(db: InboxClient, id: string) {
  const { error } = await db
    .from('whatsapp_webhook_events')
    .update({ processed_at: new Date().toISOString(), processing_error: null })
    .eq('id', id)
  if (error) console.error(`Could not mark WhatsApp delivery ${id} processed: ${error.message}`)
}

async function markFailed(db: InboxClient, row: WebhookRow, reason: string) {
  const attempts = row.attempts + 1
  const backoffSeconds = Math.min(30 * 2 ** Math.min(attempts, 8), 3600)
  const nextRetry = new Date(Date.now() + backoffSeconds * 1000).toISOString()
  const { error } = await db
    .from('whatsapp_webhook_events')
    .update({ attempts, processing_error: reason.slice(0, 1000), next_retry_at: nextRetry })
    .eq('id', row.id)
  if (error) console.error(`Could not record a processing failure for delivery ${row.id}: ${error.message}`)
}

async function saveMessage(db: InboxClient, value: Json): Promise<void> {
  for (const raw of asArray(value.messages)) {
    const message = asRecord(raw)
    const messageId = typeof message.id === 'string' ? message.id : null
    const from = typeof message.from === 'string' ? message.from : null
    if (!messageId || !from) continue

    const type = typeof message.type === 'string' ? message.type : 'unknown'
    const text = asRecord(message.text)
    const button = asRecord(message.button)
    const interactive = asRecord(message.interactive)
    const interactiveBody = asRecord(interactive.body)
    const product = asRecord(message.product)
    const productHeader = asRecord(product.header)

    const body =
      (typeof text.body === 'string' ? text.body : null) ??
      (typeof button.text === 'string' ? button.text : null) ??
      (typeof interactiveBody.text === 'string' ? interactiveBody.text : null) ??
      (typeof product.header === 'string' ? product.header : null)

    const media = asRecord(message[type] ?? message.media)
    const mediaId = typeof media.id === 'string' ? media.id : null
    const mediaMime = typeof media.mime_type === 'string' ? media.mime_type : null
    const mediaCaption = typeof media.caption === 'string' ? media.caption : null
    const mediaFilename = typeof media.filename === 'string' ? media.filename : null

    const { error } = await db
      .from('whatsapp_inbound_messages')
      .insert({
        message_id: messageId,
        sender: from,
        type,
        body,
        media_id: mediaId,
        media_mime_type: mediaMime,
        media_caption: mediaCaption ?? body,
        media_filename: mediaFilename,
        raw: message,
      })
      .select('id')

    if (error && error.code !== '23505') {
      throw new Error(`Could not store inbound WhatsApp message ${messageId}: ${error.message}`)
    }
  }
}

async function saveStatuses(
  db: InboxClient,
  value: Json,
  deliveryId: string,
): Promise<void> {
  for (const raw of asArray(value.statuses)) {
    const status = asRecord(raw)
    const messageId = typeof status.id === 'string' ? status.id : null
    const state = typeof status.status === 'string' ? status.status : null
    if (!messageId || !state) continue

    const providerTimestamp =
      typeof status.timestamp === 'string' || typeof status.timestamp === 'number'
        ? new Date(Number(status.timestamp) * 1000).toISOString()
        : null

    const inserted = await db
      .from('whatsapp_message_statuses')
      .upsert(
        {
          message_id: messageId,
          status: state,
          provider_timestamp: providerTimestamp,
          errors: asArray(status.errors),
          delivery_id: deliveryId,
        },
        { onConflict: 'delivery_id, message_id, status' },
      )
      .select('id')

    if (inserted.error) {
      throw new Error(`Could not store WhatsApp status "${state}" for ${messageId}: ${inserted.error.message}`)
    }

    // A callback can land before the sender has saved its message id; it stays stored
    // and is applied by reconcileMessage once the order record catches up.
    await reconcileMessage(db, messageId)
  }
}

async function processEvent(db: InboxClient, row: WebhookRow, deliveryId: string): Promise<void> {
  const payload = asRecord(row.payload)
  const entry = asRecord(asArray(payload.entry)[0])
  const change = asRecord(asArray(entry.changes)[0])
  const value = asRecord(change.value)

  if (row.event === 'whatsapp.message') {
    await saveMessage(db, value)
    return
  }

  if (row.event === 'whatsapp.status') {
    await saveStatuses(db, value, deliveryId)
    return
  }

  if (row.event === 'whatsapp.message_error') {
    console.error(`WhatsApp reported an account error: ${JSON.stringify(value.errors ?? value)}`)
    return
  }

  // Anything else is kept in the inbox untouched; nothing here acts on it.
  console.log(`Stored unhandled WhatsApp event: ${row.event}`)
}

/**
 * Retries deliveries whose processing never finished, so work left behind by a crash
 * or an exhausted gateway retry still gets done. Rows are spread out by their own
 * next_retry_at, so one permanently blocked delivery cannot starve the runnable ones.
 */
async function recoverPending(db: InboxClient, skipId: string): Promise<void> {
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('whatsapp_webhook_events')
    .select('id, event, payload, attempts, processed_at, delivery_id')
    .is('processed_at', null)
    .neq('id', skipId)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order('received_at', { ascending: true })
    .limit(10)

  if (error) {
    console.error(`Could not look for unfinished WhatsApp deliveries: ${error.message}`)
    return
  }

  for (const raw of data ?? []) {
    const row = raw as WebhookRow & { delivery_id: string }
    try {
      await processEvent(db, row, row.delivery_id)
      await markProcessed(db, row.id)
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      console.error(`Retry failed for WhatsApp delivery ${row.delivery_id}: ${reason}`)
      await markFailed(db, row, reason)
    }
  }
}

async function respond(
  db: InboxClient,
  body: unknown,
  status: number,
  skipId?: string,
): Promise<Response> {
  try {
    await recoverPending(db, skipId ?? '')
  } catch (cause) {
    console.error(`WhatsApp recovery pass failed: ${cause instanceof Error ? cause.message : cause}`)
  }
  return json(body, status)
}

export const Route = createFileRoute('/api/public/whatsapp/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['WHATSAPP_API_KEY']
        if (!secret) return json({ error: 'WhatsApp is not configured' }, 500)

        let verified: { payload: unknown }
        try {
          verified = await verifyWebhookRequest({
            req: request,
            secret,
            maxBodyBytes: 4 * 1024 * 1024,
          })
        } catch (cause) {
          const code = cause instanceof WebhookError ? cause.code : 'unknown'
          console.error(`Rejected WhatsApp webhook: ${code}`)
          return json({ error: 'Invalid webhook signature' }, 401)
        }

        const deliveryId = request.headers.get('x-lovable-delivery')?.trim()
        const event = request.headers.get('x-lovable-event')?.trim()
        if (!deliveryId || !event) return json({ error: 'Missing delivery headers' }, 400)

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const stored = await storeEvent(supabaseAdmin, {
          deliveryId,
          event,
          payload: asRecord(verified.payload),
        })
        if (!stored.ok) return json({ error: 'Could not store webhook' }, 500)

        const row = stored.row
        if (row.processed_at) {
          return respond(supabaseAdmin, { ok: true, duplicate: true }, 200, row.id)
        }

        try {
          await processEvent(supabaseAdmin, row, deliveryId)
        } catch (cause) {
          const reason = cause instanceof Error ? cause.message : String(cause)
          console.error(`Could not process WhatsApp delivery ${deliveryId}: ${reason}`)
          await markFailed(supabaseAdmin, row, reason)
          return respond(supabaseAdmin, { error: 'Processing failed' }, 500, row.id)
        }

        await markProcessed(supabaseAdmin, row.id)
        return respond(supabaseAdmin, { ok: true }, 200, row.id)
      },
    },
  },
})

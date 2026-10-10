import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { menuItems } from './menu'
import { buildReceipt, makeOrderRef, orderTotals } from './receipt'
import { reconcileMessage } from './whatsapp-status'
import { RESTAURANT_WHATSAPP_NUMBER, sendWhatsAppText } from './whatsapp.server'

const menuIds = menuItems.map(item => item.id)

const orderSchema = z
  .object({
    cart: z
      .record(z.string(), z.number().int().min(1).max(99))
      .refine(cart => Object.keys(cart).length > 0, 'Pick at least one dish.')
      .refine(cart => Object.keys(cart).length <= 40, 'This order is too large to send.'),
    mode: z.enum(['Delivery', 'Pick-Up']),
    locationName: z.string().trim().min(3).max(200),
    customerName: z.string().trim().min(2).max(80),
    customerPhone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{7,20}$/, 'Enter a valid phone number.')
      .optional()
      .or(z.literal('')),
    note: z.string().trim().max(300).optional().or(z.literal('')),
  })
  .refine(order => Object.keys(order.cart).every(id => menuIds.includes(id)), 'This order contains items that are not on the menu.')

export type PlaceOrderResult =
  | { ok: true; orderRef: string; receipt: string }
  | { ok: false; orderRef?: string; error: string }

/**
 * Records an order and sends the receipt to the restaurant's WhatsApp.
 * Prices are always recalculated from the menu, never taken from the browser.
 */
export const placeOrder = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { lines, subtotal, total } = orderTotals(data.cart)
    if (lines.length === 0) return { ok: false, error: 'Your basket is empty.' }

    const orderRef = makeOrderRef()
    const placedAt = new Date()
    const receipt = buildReceipt(
      {
        cart: data.cart,
        mode: data.mode,
        locationName: data.locationName,
        customerName: data.customerName,
        customerPhone: data.customerPhone || undefined,
        note: data.note || undefined,
      },
      orderRef,
      placedAt,
    )

    const created = await supabaseAdmin
      .from('whatsapp_orders')
      .insert({
        order_ref: orderRef,
        status: 'pending',
        customer_name: data.customerName,
        customer_phone: data.customerPhone || null,
        mode: data.mode,
        location_name: data.locationName,
        items: lines,
        subtotal,
        total,
        note: data.note || null,
        receipt_text: receipt,
      })
      .select('id')
      .single()

    if (created.error || !created.data) {
      console.error(`Order ${orderRef} could not be recorded: ${created.error?.message}`)
      return { ok: false, orderRef, error: 'We could not record your order. Please try again.' }
    }

    const sent = await sendWhatsAppText(RESTAURANT_WHATSAPP_NUMBER, receipt)
    const now = new Date().toISOString()

    if (!sent.ok) {
      await supabaseAdmin
        .from('whatsapp_orders')
        .update({ status: 'failed', provider_error: sent.error, failed_at: now, updated_at: now })
        .eq('id', created.data.id)
      return {
        ok: false,
        orderRef,
        error: 'Your order could not be sent on WhatsApp. Please call the restaurant to place it.',
      }
    }

    const saved = await supabaseAdmin
      .from('whatsapp_orders')
      .update({ message_id: sent.messageId, status: 'accepted', updated_at: now })
      .eq('id', created.data.id)

    if (saved.error) {
      // The message is already on its way, so the order stands even if the record lagged.
      console.error(`Order ${orderRef} sent but not linked to message ${sent.messageId}: ${saved.error.message}`)
    }

    // A delivery callback may already have arrived for this message id.
    await reconcileMessage(supabaseAdmin, sent.messageId).catch(error =>
      console.error(`Could not reconcile delivery statuses for order ${orderRef}: ${error instanceof Error ? error.message : error}`),
    )

    return { ok: true, orderRef, receipt }
  })

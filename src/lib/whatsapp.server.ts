const GATEWAY_URL = 'https://connector-gateway.lovable.dev/whatsapp'

/** The restaurant's own connected WhatsApp number, digits only, E.164 without "+". */
export const RESTAURANT_WHATSAPP_NUMBER = '923499690647'

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string }

const digitsOnly = (value: string) => value.replace(/\D/g, '')

/**
 * Sends a plain text message through the Lovable connector gateway.
 * Keys are read inside the call: on the worker runtime process.env is only filled per request.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  const recipient = digitsOnly(to)
  if (recipient.length < 8 || recipient.length > 15) {
    return { ok: false, error: 'The restaurant WhatsApp number is not set up correctly.' }
  }

  const gatewayKey = process.env['LOVABLE_API_KEY']
  const connectionKey = process.env['WHATSAPP_API_KEY']
  if (!gatewayKey || !connectionKey) {
    return { ok: false, error: 'WhatsApp messaging is not connected yet.' }
  }

  let response: Response
  try {
    response = await fetch(`${GATEWAY_URL}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        'X-Connection-Api-Key': connectionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: { body },
      }),
    })
  } catch (error) {
    console.error(`WhatsApp send could not reach the gateway: ${error instanceof Error ? error.message : error}`)
    return { ok: false, error: 'WhatsApp could not be reached right now.' }
  }

  const responseBody = await response.text()
  if (!response.ok) {
    console.error(`WhatsApp send failed [${response.status}]: ${responseBody}`)
    return { ok: false, error: `WhatsApp refused the message (${response.status}).` }
  }

  try {
    const parsed = JSON.parse(responseBody) as { messages?: Array<{ id?: string }> }
    const messageId = parsed.messages?.[0]?.id
    if (!messageId) return { ok: false, error: 'WhatsApp did not confirm the message.' }
    return { ok: true, messageId }
  } catch {
    return { ok: false, error: 'WhatsApp sent an unreadable reply.' }
  }
}

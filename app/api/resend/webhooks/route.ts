import {
  handleResendWebhookEvent,
  ResendWebhookConfigurationError,
  type ResendWebhookHeaders,
  verifyResendWebhook
} from '@/lib/resend/webhooks'
import type { WebhookEventPayload } from 'resend'
import { persistResendWebhookEvent } from '@/lib/resend/webhooks/persist'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

interface ResendWebhookRouteDependencies {
  handleEvent: (options: { event: WebhookEventPayload; webhookId: string }) => Promise<void>
  persistEvent: (options: {
    event: WebhookEventPayload
    webhookId: string
    webhookSecret: string
  }) => Promise<unknown>
}

const routeDependencies: ResendWebhookRouteDependencies = {
  handleEvent: handleResendWebhookEvent,
  persistEvent: persistResendWebhookEvent
}

function jsonResponse(body: Record<string, boolean | string>, status: number) {
  return Response.json(body, { headers: NO_STORE_HEADERS, status })
}

function getSignatureHeaders(request: Request): ResendWebhookHeaders | null {
  const id = request.headers.get('svix-id')?.trim()
  const signature = request.headers.get('svix-signature')?.trim()
  const timestamp = request.headers.get('svix-timestamp')?.trim()

  if (!id || !signature || !timestamp) {
    return null
  }

  return { id, signature, timestamp }
}

function isBodyTooLarge(request: Request) {
  const contentLength = request.headers.get('content-length')

  if (!contentLength) {
    return false
  }

  const parsedLength = Number(contentLength)

  return Number.isFinite(parsedLength) && parsedLength > MAX_WEBHOOK_BODY_BYTES
}

export async function handleResendWebhookRequest(
  request: Request,
  dependencies: ResendWebhookRouteDependencies = routeDependencies
) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim()

  if (!webhookSecret) {
    console.error('[resend/webhook] RESEND_WEBHOOK_SECRET is not configured')
    return jsonResponse({ error: 'Webhook verification is not configured.', received: false }, 503)
  }

  const headers = getSignatureHeaders(request)

  if (!headers) {
    return jsonResponse({ error: 'Missing webhook signature headers.', received: false }, 400)
  }

  if (isBodyTooLarge(request)) {
    return jsonResponse({ error: 'Webhook payload is too large.', received: false }, 413)
  }

  const payload = await request.text()
  const payloadSize = new TextEncoder().encode(payload).byteLength

  if (payloadSize > MAX_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: 'Webhook payload is too large.', received: false }, 413)
  }

  let event: WebhookEventPayload

  try {
    event = verifyResendWebhook({ headers, payload, webhookSecret })
  } catch (error) {
    if (error instanceof ResendWebhookConfigurationError) {
      console.error('[resend/webhook] Resend API client is not configured')
      return jsonResponse({ error: 'Webhook verification is not configured.', received: false }, 503)
    }

    return jsonResponse({ error: 'Invalid webhook signature.', received: false }, 400)
  }

  try {
    await dependencies.persistEvent({
      event,
      webhookId: headers.id,
      webhookSecret
    })
    await dependencies.handleEvent({ event, webhookId: headers.id })
  } catch {
    console.error('[resend/webhook] failed to process verified event', {
      eventType: event.type,
      webhookId: headers.id
    })
    return jsonResponse({ error: 'Webhook processing failed.', received: false }, 500)
  }

  return jsonResponse({ received: true }, 200)
}

export async function POST(request: Request) {
  return await handleResendWebhookRequest(request)
}

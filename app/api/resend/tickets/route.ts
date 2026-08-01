import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { createClient } from '@/lib/resend'
import { queueResendSend } from '@/lib/resend/rate-limit'
import {
  renderTicketDeliveryEmail,
  TICKET_DELIVERY_DEFAULTS,
  TICKET_DELIVERY_INTENT
} from '@/lib/resend/templates/ticket-delivery'
import { getVerifiedAdminSession } from '@/lib/firebase/server-auth'
import { createPngFilename } from '@/lib/tickets/download-ticket-png'
import { fetchQuery } from 'convex/nextjs'
import { uuidv7 } from 'uuidv7'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_FROM = 'hq@foreplay.pro'
const MAX_TICKET_PNG_BYTES = 3 * 1024 * 1024
const MAX_ENCODED_TICKET_LENGTH = Math.ceil((MAX_TICKET_PNG_BYTES * 4) / 3) + 4
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

interface TicketDeliveryRequest {
  contentBase64: string
  eventId: string
  registrationId: string
  subscriptionId: string
}

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  })

const formatSender = (value: string) => (value.includes('<') ? value : `Foreplay <${value}>`)

function parseBody(raw: unknown): TicketDeliveryRequest | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  const eventId = typeof value.eventId === 'string' ? value.eventId.trim() : ''
  const subscriptionId = typeof value.subscriptionId === 'string' ? value.subscriptionId.trim() : ''
  const registrationId = typeof value.registrationId === 'string' ? value.registrationId.trim() : ''
  const contentBase64 = typeof value.contentBase64 === 'string' ? value.contentBase64.trim() : ''

  if (
    !eventId ||
    eventId.length > 512 ||
    !subscriptionId ||
    subscriptionId.length > 512 ||
    !registrationId ||
    registrationId.length > 512 ||
    !contentBase64 ||
    contentBase64.length > MAX_ENCODED_TICKET_LENGTH
  ) {
    return null
  }

  return { contentBase64, eventId, registrationId, subscriptionId }
}

function decodeTicketPng(contentBase64: string) {
  const content = Buffer.from(contentBase64, 'base64')

  if (content.length === 0 || content.length > MAX_TICKET_PNG_BYTES) {
    return null
  }

  if (content.length < pngSignature.length || !content.subarray(0, pngSignature.length).equals(pngSignature)) {
    return null
  }

  return content
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown email delivery error'
}

export async function POST(request: Request) {
  const session = await getVerifiedAdminSession()

  if (!session) {
    return jsonResponse({ ok: false, error: 'An admin session is required.' }, 401)
  }

  const parsed = parseBody(await request.json().catch(() => null))
  if (!parsed) {
    return jsonResponse({ ok: false, error: 'A valid ticket image and registration are required.' }, 400)
  }

  const content = decodeTicketPng(parsed.contentBase64)
  if (!content) {
    return jsonResponse({ ok: false, error: 'The ticket attachment must be a PNG smaller than 3 MB.' }, 400)
  }

  const [event, registrationDetails, template] = await Promise.all([
    fetchQuery(api.tournaments.q.getByTournamentId, { id: parsed.eventId }),
    fetchQuery(api.subscriptions.q.getRegistrationDetailsForAdmin, {
      subscriptionId: parsed.subscriptionId,
      tournamentId: parsed.eventId
    }),
    fetchQuery(api.messagingConfigs.q.getMessagingConfigByIntent, {
      intent: TICKET_DELIVERY_INTENT
    })
  ])

  if (!registrationDetails) {
    return jsonResponse({ ok: false, error: 'The registration could not be found for this event.' }, 404)
  }

  if (!event) {
    return jsonResponse({ ok: false, error: 'The event could not be found.' }, 404)
  }

  const registrationId = parsed.registrationId as Id<'registrations'>
  const registration = registrationDetails.registrations.find((entry) => entry._id === registrationId)
  const { subscription } = registrationDetails

  if (!registration) {
    return jsonResponse({ ok: false, error: 'The selected ticket is not part of this registration.' }, 404)
  }

  if (
    subscription.status !== 'confirmed' ||
    subscription.payment_status !== 'paid' ||
    registration.payment_status !== 'paid'
  ) {
    return jsonResponse({ ok: false, error: 'Only active, paid tickets can be emailed.' }, 409)
  }

  const playerEmail = registration.player_email?.trim().toLowerCase() ?? ''
  const contactEmail = subscription.contact_email?.trim().toLowerCase() ?? ''
  const recipient = emailPattern.test(playerEmail) ? playerEmail : contactEmail
  if (!emailPattern.test(recipient)) {
    return jsonResponse({ ok: false, error: 'This ticket does not have a valid recipient email address.' }, 409)
  }

  let rendered: Awaited<ReturnType<typeof renderTicketDeliveryEmail>>
  try {
    rendered = await renderTicketDeliveryEmail({
      bodyTemplate: template?.body ?? template?.text ?? TICKET_DELIVERY_DEFAULTS.body,
      eventTitle: event.title,
      playerName: registration.player_name,
      reference: subscription.txn_ref_no ?? subscription.form_id ?? subscription._id.slice(-8).toUpperCase(),
      subjectTemplate: template?.subject ?? TICKET_DELIVERY_DEFAULTS.subject,
      ticketCount: 1
    })
  } catch (error) {
    console.error('[resend/tickets] template rendering failed', error)
    return jsonResponse({ ok: false, error: 'The ticket email template could not be rendered.' }, 500)
  }
  const from = template?.from?.[0]?.trim() || process.env.RESEND_FROM?.trim() || DEFAULT_FROM

  let resend: ReturnType<typeof createClient>
  try {
    resend = createClient()
  } catch (error) {
    console.error('[resend/tickets] createClient failed', error)
    return jsonResponse({ ok: false, error: 'Email delivery is not configured.' }, 502)
  }

  try {
    const result = await queueResendSend(() =>
      resend.emails.send({
        attachments: [
          {
            content,
            contentType: 'image/png',
            filename: createPngFilename(`foreplay-ticket-${registration.player_name}`, 'foreplay-ticket')
          }
        ],
        from: formatSender(from),
        headers: {
          'X-Entity-Ref-ID': uuidv7(),
          'X-Priority': '1',
          Importance: 'high'
        },
        html: rendered.html,
        subject: rendered.subject,
        text: rendered.message,
        to: recipient
      })
    )

    if (result.error) {
      throw new Error(result.error.message)
    }

    return jsonResponse(
      {
        ok: true,
        id: result.data?.id ?? null,
        recipient
      },
      200
    )
  } catch (error) {
    console.error('[resend/tickets] send failed', error)
    return jsonResponse({ ok: false, error: `Ticket email failed: ${getErrorMessage(error)}` }, 502)
  }
}

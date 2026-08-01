import { createClient } from '@/lib/resend'
import { getVerifiedAdminSession } from '@/lib/firebase/server-auth'
import { queueResendSend } from '@/lib/resend/rate-limit'
import { sendEmail } from '@/lib/resend/send-invite'
import {
  parseTicketDeliveryTemplateProps,
  renderTicketDeliveryEmail,
  TICKET_DELIVERY_TEMPLATE
} from '@/lib/resend/templates/ticket-delivery'
import { uuidv7 } from 'uuidv7'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_FROM = 'hq@foreplay.pro'
const MAX_RECIPIENTS_PER_SEND = 50
const MAX_COPY_RECIPIENTS = 20
const MAX_SUBJECT_LENGTH = 200
const MAX_MESSAGE_LENGTH = 20_000
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const jsonResponse = (body: Record<string, unknown>, status: number) => {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}

const escapeHtml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const renderPlainTextEmail = (body: string) => {
  return `<p>${escapeHtml(body).replace(/\r?\n/g, '<br />')}</p>`
}

const formatSender = (value: string) => {
  return value.includes('<') ? value : `Foreplay <${value}>`
}

const toErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

const extractResendErrorDetails = (err: unknown): string => {
  if (!err || typeof err !== 'object') return toErrorMessage(err)
  const e = err as Record<string, unknown>
  const message = typeof e.message === 'string' ? e.message : undefined
  const code = typeof e.code === 'string' || typeof e.code === 'number' ? String(e.code) : undefined
  const parts = [code].filter(Boolean).join(' ')
  return `${message ?? 'Resend error'}${parts ? ` (${parts})` : ''}`
}

function parseBody(raw: unknown): {
  to: string[]
  recipients?: { email: string; name: string }[]
  subject: string
  html?: string
  body?: string
  cc?: string[]
  bcc?: string[]
  template?: string
  templateProps?: string
} | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const toRaw = o.to
  const toArr = Array.isArray(toRaw)
    ? (toRaw as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : typeof toRaw === 'string' && toRaw.trim()
      ? [toRaw.trim()]
      : []
  const recipientsRaw = o.recipients
  const recipients =
    Array.isArray(recipientsRaw) &&
    recipientsRaw.every((r) => r && typeof r === 'object' && typeof (r as { email?: unknown }).email === 'string')
      ? (recipientsRaw as { email: string; name?: string }[])
          .map((r) => ({
            email: r.email.trim(),
            name: typeof r.name === 'string' ? r.name.trim() : ''
          }))
          .filter((recipient) => recipient.email.length > 0)
      : undefined
  const hasRecipients = toArr.length > 0 || (recipients?.length ?? 0) > 0
  if (!hasRecipients) return null
  const subject = typeof o.subject === 'string' ? o.subject.trim() : ''
  if (!subject) return null
  return {
    to: toArr,
    recipients,
    subject,
    html: typeof o.html === 'string' ? o.html : undefined,
    body: typeof o.body === 'string' ? o.body : undefined,
    cc: Array.isArray(o.cc)
      ? (o.cc as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : undefined,
    bcc: Array.isArray(o.bcc)
      ? (o.bcc as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : undefined,
    template: typeof o.template === 'string' ? o.template.trim() : undefined,
    templateProps: typeof o.templateProps === 'string' ? o.templateProps : undefined
  }
}

export async function POST(req: Request) {
  const session = await getVerifiedAdminSession()

  if (!session) {
    return jsonResponse({ ok: false, error: 'An admin session is required.' }, 401)
  }

  const raw: unknown = await req.json().catch(() => null)
  const parsed = parseBody(raw)
  if (!parsed) {
    return jsonResponse({ ok: false, error: 'Choose at least one recipient and enter a subject.' }, 400)
  }

  const { to, recipients, subject, html, body, cc, bcc, template, templateProps } = parsed
  const from = process.env.RESEND_FROM?.trim() || DEFAULT_FROM
  const useInvitationComponent = template === 'invitation' && recipients && recipients.length > 0
  const useTicketDeliveryComponent = template === TICKET_DELIVERY_TEMPLATE
  const fallbackHtml = html?.trim() || (body ? renderPlainTextEmail(body) : '<p></p>')

  const rawRecipientList: { email: string; name: string }[] =
    (recipients?.length ?? 0) > 0 ? recipients! : to.map((e) => ({ email: e, name: '' }))
  const recipientList = Array.from(
    new Map(
      rawRecipientList.map((recipient) => {
        const email = recipient.email.trim().toLowerCase()
        return [email, { email, name: recipient.name.trim() }] as const
      })
    ).values()
  )

  if (
    recipientList.length === 0 ||
    recipientList.length > MAX_RECIPIENTS_PER_SEND ||
    recipientList.some((recipient) => !emailPattern.test(recipient.email))
  ) {
    return jsonResponse(
      {
        ok: false,
        error: `Use between 1 and ${MAX_RECIPIENTS_PER_SEND} valid recipient email addresses.`
      },
      400
    )
  }

  if (
    subject.length > MAX_SUBJECT_LENGTH ||
    (body?.length ?? 0) > MAX_MESSAGE_LENGTH ||
    (html?.length ?? 0) > MAX_MESSAGE_LENGTH
  ) {
    return jsonResponse({ ok: false, error: 'The subject or message is too long.' }, 400)
  }

  if (
    (cc?.length ?? 0) > MAX_COPY_RECIPIENTS ||
    (bcc?.length ?? 0) > MAX_COPY_RECIPIENTS ||
    [...(cc ?? []), ...(bcc ?? [])].some((email) => !emailPattern.test(email.trim()))
  ) {
    return jsonResponse({ ok: false, error: 'One or more CC or BCC addresses are invalid.' }, 400)
  }

  const ids: string[] = []
  let resend: ReturnType<typeof createClient> | null = null

  for (const recipient of recipientList) {
    const headers: Record<string, string> = {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'high',
      'X-Entity-Ref-ID': uuidv7()
    }

    if (useInvitationComponent) {
      try {
        const result = await sendEmail({
          to: recipient.email,
          subject,
          recipientName: recipient.name,
          templateProps,
          cc,
          bcc,
          headers
        })

        if (result?.id) {
          ids.push(result.id)
        }
        continue
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Send failed'
        console.error('[resend/send-job] sendInvitationEmail', err)
        return jsonResponse(
          {
            ok: false,
            error: `Invitation send failed for ${recipient.email} - ${message}`
          },
          502
        )
      }
    }

    let recipientSubject = subject
    let recipientHtml = fallbackHtml

    if (useTicketDeliveryComponent) {
      try {
        const sampleProps = parseTicketDeliveryTemplateProps(templateProps, recipient.name)
        const rendered = await renderTicketDeliveryEmail({
          ...sampleProps,
          bodyTemplate: body,
          subjectTemplate: subject
        })
        recipientSubject = rendered.subject
        recipientHtml = rendered.html
      } catch (err) {
        console.error('[resend/send-job] renderTicketDeliveryEmail', err)
        return jsonResponse(
          {
            ok: false,
            error: `Ticket template rendering failed for ${recipient.email}.`
          },
          500
        )
      }
    }

    if (!resend) {
      try {
        resend = createClient()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Resend is not configured'
        console.error('[resend/send-job] createClient', err)
        return jsonResponse({ ok: false, error: message }, 502)
      }
    }

    const resendClient = resend
    if (!resendClient) {
      return jsonResponse({ ok: false, error: 'Resend is not configured' }, 502)
    }

    const payload: {
      from: string
      to: string
      subject: string
      html: string
      headers: Record<string, string>
      cc?: string[]
      bcc?: string[]
    } = {
      from: formatSender(from),
      to: recipient.email,
      subject: recipientSubject,
      html: recipientHtml,
      headers
    }
    if (cc && cc.length > 0) payload.cc = cc
    if (bcc && bcc.length > 0) payload.bcc = bcc

    let result: unknown
    try {
      result = await queueResendSend(() => resendClient.emails.send(payload))
    } catch (err) {
      const message = toErrorMessage(err)
      console.error('[resend/send-job] send threw', err)
      return jsonResponse(
        {
          ok: false,
          error: `Resend failed for ${recipient.email} - ${message}`
        },
        502
      )
    }

    if (typeof result === 'object' && result !== null && 'error' in result && (result as { error?: unknown }).error) {
      const resendErr = (result as { error?: unknown }).error
      const details = extractResendErrorDetails(resendErr)
      console.error('[resend/send-job] send returned error', resendErr)
      return jsonResponse(
        {
          ok: false,
          error: `Resend failed for ${recipient.email} - ${details}`
        },
        502
      )
    }

    const id =
      typeof result === 'object' &&
      result !== null &&
      'data' in result &&
      typeof (result as { data?: unknown }).data === 'object' &&
      (result as { data?: { id?: unknown } }).data !== null &&
      typeof (result as { data?: { id?: unknown } }).data?.id === 'string'
        ? (result as { data: { id: string } }).data.id
        : null
    if (id) ids.push(id)
  }

  return jsonResponse({ ok: true, id: ids[0] ?? null, ids, sentCount: recipientList.length }, 200)
}

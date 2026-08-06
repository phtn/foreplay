import { Body, Container, Head, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components'
import { renderTemplate } from '../render'

export const TICKET_DELIVERY_INTENT = 'ticket_delivery'
export const TICKET_DELIVERY_TEMPLATE = 'ticket_delivery'

export const TICKET_DELIVERY_DEFAULTS = {
  body: `Hi {{playerName}},

Your ticket for {{eventTitle}} is attached to this email as a PNG. Keep it available on your phone and present the QR code at the event entrance.

Ticket reference: {{reference}}`,
  group: 'tickets',
  intent: TICKET_DELIVERY_INTENT,
  subject: 'Your ticket for {{eventTitle}}',
  template: TICKET_DELIVERY_TEMPLATE,
  title: 'Ticket delivery',
  type: 'transactional',
  visible: true
} as const

export interface TicketDeliveryTemplateProps {
  eventTitle: string
  playerName: string
  reference: string
  ticketCount: number
}

export const TICKET_DELIVERY_SAMPLE_PROPS: TicketDeliveryTemplateProps = {
  eventTitle: 'Foreplay Invitation',
  playerName: 'Alex Reyes',
  reference: 'FP26',
  ticketCount: 1
}

interface TicketDeliveryEmailProps extends TicketDeliveryTemplateProps {
  message: string
  subject: string
}

const templateVariablePattern = /\{\{\s*(playerName|eventTitle|reference|ticketCount)\s*\}\}/g

export function applyTicketDeliveryVariables(value: string, props: TicketDeliveryTemplateProps) {
  const variables: Record<keyof TicketDeliveryTemplateProps, string> = {
    eventTitle: props.eventTitle,
    playerName: props.playerName,
    reference: props.reference,
    ticketCount: String(props.ticketCount)
  }

  return value.replace(templateVariablePattern, (_match, key: keyof TicketDeliveryTemplateProps) => variables[key])
}

export function parseTicketDeliveryTemplateProps(
  value: string | null | undefined,
  recipientName?: string
): TicketDeliveryTemplateProps {
  if (!value?.trim()) {
    return {
      ...TICKET_DELIVERY_SAMPLE_PROPS,
      playerName: recipientName?.trim() || TICKET_DELIVERY_SAMPLE_PROPS.playerName
    }
  }

  try {
    const parsed = JSON.parse(value) as Partial<TicketDeliveryTemplateProps>
    return {
      eventTitle:
        typeof parsed.eventTitle === 'string' && parsed.eventTitle.trim()
          ? parsed.eventTitle.trim()
          : TICKET_DELIVERY_SAMPLE_PROPS.eventTitle,
      playerName:
        recipientName?.trim() ||
        (typeof parsed.playerName === 'string' && parsed.playerName.trim()
          ? parsed.playerName.trim()
          : TICKET_DELIVERY_SAMPLE_PROPS.playerName),
      reference:
        typeof parsed.reference === 'string' && parsed.reference.trim()
          ? parsed.reference.trim()
          : TICKET_DELIVERY_SAMPLE_PROPS.reference,
      ticketCount:
        typeof parsed.ticketCount === 'number' && Number.isFinite(parsed.ticketCount) && parsed.ticketCount > 0
          ? Math.floor(parsed.ticketCount)
          : TICKET_DELIVERY_SAMPLE_PROPS.ticketCount
    }
  } catch {
    return {
      ...TICKET_DELIVERY_SAMPLE_PROPS,
      playerName: recipientName?.trim() || TICKET_DELIVERY_SAMPLE_PROPS.playerName
    }
  }
}

export function TicketDeliveryEmail({
  eventTitle,
  message,
  reference,
  subject,
  ticketCount
}: TicketDeliveryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Tailwind>
        <Body className='bg-[#f4f4f5] py-[32px] font-sans text-[#18181b]'>
          <Container className='mx-auto max-w-[560px] overflow-hidden rounded-[20px] bg-white'>
            <Section className='bg-[#09090b] px-[32px] py-[28px] text-white'>
              <Text className='m-0 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f472b6]'>
                Foreplay Gate Pass
              </Text>
              <Text className='m-0 mt-[12px] text-[26px] font-semibold leading-[32px] text-white'>{eventTitle}</Text>
            </Section>

            <Section className='px-[32px] py-[32px]'>
              <Text className='m-0 whitespace-pre-wrap text-[15px] leading-[25px] text-[#3f3f46]'>{message}</Text>

              <Section className='mt-[28px] rounded-[12px] border border-solid border-[#e4e4e7] bg-[#fafafa] px-[18px] py-[16px]'>
                <Text className='m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71717a]'>
                  Attached
                </Text>
                <Text className='m-0 mt-[6px] text-[14px] font-semibold text-[#18181b]'>
                  {ticketCount} {ticketCount === 1 ? 'ticket image' : 'ticket images'} · {reference}
                </Text>
              </Section>

              <Hr className='my-[28px] border-[#e4e4e7]' />
              <Text className='m-0 text-[12px] leading-[19px] text-[#71717a]'>
                The QR code in the attached image is your gate pass. Do not share it publicly.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export async function renderTicketDeliveryEmail({
  bodyTemplate = TICKET_DELIVERY_DEFAULTS.body,
  subjectTemplate = TICKET_DELIVERY_DEFAULTS.subject,
  ...props
}: TicketDeliveryTemplateProps & {
  bodyTemplate?: string | null
  subjectTemplate?: string | null
}) {
  const normalizedBodyTemplate = bodyTemplate?.trim() || TICKET_DELIVERY_DEFAULTS.body
  const normalizedSubjectTemplate = subjectTemplate?.trim() || TICKET_DELIVERY_DEFAULTS.subject
  const message = applyTicketDeliveryVariables(normalizedBodyTemplate, props)
  const subject = applyTicketDeliveryVariables(normalizedSubjectTemplate, props)
  const html = await renderTemplate(TicketDeliveryEmail, {
    ...props,
    message,
    subject
  })

  return { html, message, subject }
}

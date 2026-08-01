import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import {
  TICKET_DELIVERY_DEFAULTS,
  TICKET_DELIVERY_INTENT,
  TICKET_DELIVERY_SAMPLE_PROPS,
  TICKET_DELIVERY_TEMPLATE
} from '@/lib/resend/templates/ticket-delivery'
import { fetchQuery } from 'convex/nextjs'
import {
  MessagingWorkspace,
  type MessagingRecipient,
  type MessagingTemplate
} from './messaging/messaging-workspace'

type User = Doc<'users'>

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Manila'
})

const displayName = (user: User) => user.name ?? user.preferredUsername ?? user.email ?? user.subject

export const MessagingContent = async () => {
  await requireAdminSession()

  const [users, templates] = await Promise.all([
    fetchQuery(api.users.q.listUsers),
    fetchQuery(api.messagingConfigs.q.listMessagingConfigs)
  ])
  const recipients = users
    .flatMap((user): MessagingRecipient[] => {
      const email = user.email?.trim().toLowerCase()

      if (!email || user.emailVerified !== true) {
        return []
      }

      return [
        {
          id: user._id,
          email,
          name: displayName(user),
          pictureUrl: user.pictureUrl,
          updatedLabel: dateFormatter.format(user.updatedAt)
        }
      ]
    })
    .toSorted((left, right) => left.name.localeCompare(right.name))
  const hasTicketDeliveryTemplate = templates.some((template) => template.intent === TICKET_DELIVERY_INTENT)
  const messagingTemplates = [
    ...templates.map((template): MessagingTemplate => {
      const intent = template.intent ?? 'general'
      const ticketDeliveryTemplate = intent === TICKET_DELIVERY_INTENT
      const body = template.body ?? template.text ?? ''
      const subject = template.subject ?? ''
      const templateKey = template.template ?? ''
      const templateProps = template.templateProps ?? ''

      return {
        id: template._id,
        persistedId: template._id,
        body: ticketDeliveryTemplate && !body.trim() ? TICKET_DELIVERY_DEFAULTS.body : body,
        group: template.group ?? '',
        html: template.html ?? '',
        intent,
        subject:
          ticketDeliveryTemplate && !subject.trim() ? TICKET_DELIVERY_DEFAULTS.subject : subject,
        template:
          ticketDeliveryTemplate && !templateKey.trim() ? TICKET_DELIVERY_TEMPLATE : templateKey,
        templateProps:
          ticketDeliveryTemplate && !templateProps.trim()
            ? JSON.stringify(TICKET_DELIVERY_SAMPLE_PROPS)
            : templateProps,
        title: template.title ?? 'Untitled template',
        type: template.type ?? 'email',
        updatedLabel: dateFormatter.format(template.updatedAt ?? template._creationTime),
        visible: template.visible !== false
      }
    }),
    ...(hasTicketDeliveryTemplate
      ? []
      : [
          {
            id: `builtin:${TICKET_DELIVERY_INTENT}`,
            persistedId: null,
            body: TICKET_DELIVERY_DEFAULTS.body,
            group: TICKET_DELIVERY_DEFAULTS.group,
            html: '',
            intent: TICKET_DELIVERY_DEFAULTS.intent,
            subject: TICKET_DELIVERY_DEFAULTS.subject,
            template: TICKET_DELIVERY_DEFAULTS.template,
            templateProps: JSON.stringify(TICKET_DELIVERY_SAMPLE_PROPS),
            title: TICKET_DELIVERY_DEFAULTS.title,
            type: TICKET_DELIVERY_DEFAULTS.type,
            updatedLabel: 'built in',
            visible: TICKET_DELIVERY_DEFAULTS.visible
          } satisfies MessagingTemplate
        ])
  ]
    .toSorted((left, right) => left.title.localeCompare(right.title))

  return (
    <MessagingWorkspace
      recipients={recipients}
      templates={messagingTemplates}
      totalUserCount={users.length}
    />
  )
}

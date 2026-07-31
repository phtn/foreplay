import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
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
  const messagingTemplates = templates
    .map(
      (template): MessagingTemplate => ({
        id: template._id,
        body: template.body ?? template.text ?? '',
        html: template.html ?? '',
        intent: template.intent ?? 'general',
        subject: template.subject ?? '',
        title: template.title ?? 'Untitled template',
        type: template.type ?? 'email',
        updatedLabel: dateFormatter.format(template.updatedAt ?? template._creationTime),
        visible: template.visible !== false
      })
    )
    .toSorted((left, right) => left.title.localeCompare(right.title))

  return (
    <MessagingWorkspace
      recipients={recipients}
      templates={messagingTemplates}
      totalUserCount={users.length}
    />
  )
}

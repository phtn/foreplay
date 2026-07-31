import type { Doc } from '@/convex/_generated/dataModel'
import type { EmailSettingsFormValues } from './email-settings-form-schema'

type EmailSettingsDoc = Doc<'messagingConfigs'>

export const defaultFormValues: EmailSettingsFormValues = {
  title: 'Title',
  intent: 'greeting',
  visible: true,
  type: 'marketing',
  group: 'invoice',
  from: 'hg@foreplay.pro',
  to: '',
  cc: '',
  bcc: '',
  subject: 'Example Subject',
  text: '',
  body: '',
  html: '',
  template: '',
  templateProps: ''
}

export const withViewTransition = (fn: () => void) => {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => unknown
  }
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      fn()
    })
    return
  }
  fn()
}

export const toFormValues = (setting?: EmailSettingsDoc | null): EmailSettingsFormValues => {
  if (!setting) return defaultFormValues

  return {
    title: setting.title ?? '',
    intent: setting.intent ?? '',
    visible: setting.visible ?? true,
    type: setting.type ?? 'transactional',
    group: setting.group ?? '',
    from: (setting.from ?? []).join(', '),
    to: (setting.to ?? []).join(', '),
    cc: (setting.cc ?? []).join(', '),
    bcc: (setting.bcc ?? []).join(', '),
    subject: setting.subject ?? '',
    text: setting.text ?? '',
    body: setting.body ?? '',
    html: setting.html ?? '',
    template: setting.template ?? '',
    templateProps: setting.templateProps ?? ''
  }
}

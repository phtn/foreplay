import type { GreetingEmailProps } from './greeting'

export type TemplateProps = Omit<GreetingEmailProps, 'recipientName'> & {
  recipientName?: string
}

export const DEFAULT_PROPS: TemplateProps = {
  inviterName: 'We',
  title: 'You are invited.',
  message: 'Enter the code below to access our app:',
  ctaLabel: 'Book Entry',
  ctaUrl: 'https://foreplay.pro',
  accessCode: 'FP2026'
}

export function parseTemplateProps(json: string | undefined): TemplateProps {
  if (!json?.trim()) {
    return { ...DEFAULT_PROPS }
  }

  try {
    const parsed = JSON.parse(json) as Partial<TemplateProps>
    return {
      ...DEFAULT_PROPS,
      ...parsed
    }
  } catch {
    return { ...DEFAULT_PROPS }
  }
}

export function getInvitationDefaultProps(): TemplateProps {
  return { ...DEFAULT_PROPS }
}

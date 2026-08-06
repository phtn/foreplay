'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useDeferredValue, useId, useMemo, useRef, useState } from 'react'
import { saveMessagingTemplate } from '../../actions'

export type MessagingRecipient = {
  id: string
  email: string
  name: string
  pictureUrl: string | null
  updatedLabel: string
}

export type MessagingTemplate = {
  id: string
  persistedId: string | null
  body: string
  group: string
  html: string
  intent: string
  subject: string
  template: string
  templateProps: string
  title: string
  type: string
  updatedLabel: string
  visible: boolean
}

interface MessagingWorkspaceProps {
  recipients: MessagingRecipient[]
  templates: MessagingTemplate[]
  totalUserCount: number
}

type DeliveryStatus = {
  kind: 'error' | 'success'
  message: string
} | null

const maxRecipientsPerSend = 2

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

  return initials || 'U'
}

export function MessagingWorkspace({ recipients, templates, totalUserCount }: MessagingWorkspaceProps) {
  const searchId = useId()
  const templateId = useId()
  const subjectId = useId()
  const messageId = useId()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(() => new Set())
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [templateHtml, setTemplateHtml] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(null)
  const [templateStatus, setTemplateStatus] = useState<DeliveryStatus>(null)
  const [isSending, setIsSending] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const router = useRouter()
  const navigate = (path: string) => () => router.push(path)

  const filteredRecipients = useMemo(() => {
    const query = deferredSearchQuery.trim().toLocaleLowerCase()

    if (!query) {
      return recipients
    }

    return recipients.filter((recipient) => `${recipient.name} ${recipient.email}`.toLocaleLowerCase().includes(query))
  }, [deferredSearchQuery, recipients])
  const selectedRecipients = useMemo(
    () => recipients.filter((recipient) => selectedRecipientIds.has(recipient.id)),
    [recipients, selectedRecipientIds]
  )
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  )
  const excludedUserCount = Math.max(0, totalUserCount - recipients.length)
  const selectedCount = selectedRecipients.length
  const ticketTemplateSelected = selectedTemplate?.template === 'ticket_delivery'
  const templateDirty = Boolean(
    selectedTemplate && (subject !== selectedTemplate.subject || message !== selectedTemplate.body)
  )
  const canSaveTemplate = Boolean(
    ticketTemplateSelected && selectedTemplate && (selectedTemplate.persistedId === null || templateDirty)
  )
  const hasMessageContent = Boolean(message.trim() || templateHtml.trim())
  const canSend =
    selectedCount > 0 && selectedCount <= maxRecipientsPerSend && Boolean(subject.trim()) && hasMessageContent
  const allFilteredSelected =
    filteredRecipients.length > 0 && filteredRecipients.every((recipient) => selectedRecipientIds.has(recipient.id))

  const setRecipientSelected = (recipientId: string, selected: boolean) => {
    setDeliveryStatus(null)

    if (selected && !selectedRecipientIds.has(recipientId) && selectedRecipientIds.size >= maxRecipientsPerSend) {
      setDeliveryStatus({
        kind: 'error',
        message: `You can send to up to ${maxRecipientsPerSend} recipients at a time.`
      })
      return
    }

    setSelectedRecipientIds((current) => {
      const next = new Set(current)

      if (selected) {
        next.add(recipientId)
      } else {
        next.delete(recipientId)
      }
      return next
    })
  }

  const toggleFilteredRecipients = () => {
    setDeliveryStatus(null)

    const availableSlots = maxRecipientsPerSend - selectedRecipientIds.size
    const unselectedFilteredCount = filteredRecipients.filter(
      (recipient) => !selectedRecipientIds.has(recipient.id)
    ).length

    if (!allFilteredSelected && unselectedFilteredCount > availableSlots) {
      setDeliveryStatus({
        kind: 'error',
        message: `The first ${maxRecipientsPerSend} recipients were selected. Send or clear this group before selecting more.`
      })
    }

    setSelectedRecipientIds((current) => {
      const next = new Set(current)

      if (allFilteredSelected) {
        filteredRecipients.forEach((recipient) => next.delete(recipient.id))
        return next
      }

      for (const recipient of filteredRecipients) {
        if (next.size >= maxRecipientsPerSend) {
          break
        }

        next.add(recipient.id)
      }

      return next
    })
  }

  const clearSearch = () => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  const applyTemplate = (templateIdValue: string) => {
    setSelectedTemplateId(templateIdValue)
    setDeliveryStatus(null)
    setTemplateStatus(null)

    const template = templates.find((entry) => entry.id === templateIdValue)

    if (!template) {
      return
    }

    setSubject(template.subject)
    setMessage(template.body)
    setTemplateHtml(template.html)
  }

  const resetDraft = () => {
    setSelectedTemplateId('')
    setSubject('')
    setMessage('')
    setTemplateHtml('')
    setDeliveryStatus(null)
    setTemplateStatus(null)
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate || !ticketTemplateSelected || !canSaveTemplate || isSavingTemplate) {
      return
    }

    setIsSavingTemplate(true)
    setTemplateStatus(null)

    try {
      const result = await saveMessagingTemplate({
        body: message,
        group: selectedTemplate.group,
        id: selectedTemplate.persistedId,
        intent: selectedTemplate.intent,
        subject,
        template: selectedTemplate.template,
        templateProps: selectedTemplate.templateProps,
        title: selectedTemplate.title,
        type: selectedTemplate.type,
        visible: selectedTemplate.visible
      })

      setSelectedTemplateId(result.templateId)
      setTemplateStatus({ kind: 'success', message: 'Ticket delivery template saved.' })
      router.refresh()
    } catch (error) {
      setTemplateStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to save the ticket delivery template.'
      })
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const handleSend = async () => {
    setDeliveryStatus(null)

    if (!canSend || isSending) {
      return
    }

    const confirmed = window.confirm(
      `Send this email to ${selectedCount} ${selectedCount === 1 ? 'recipient' : 'recipients'}?`
    )

    if (!confirmed) {
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/resend/send-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients: selectedRecipients.map(({ email, name }) => ({ email, name })),
          subject: subject.trim(),
          body: message.trim() || undefined,
          html: templateHtml || undefined,
          template: selectedTemplate?.template || undefined,
          templateProps: selectedTemplate?.templateProps || undefined
        })
      })
      const result = (await response.json().catch(() => null)) as {
        error?: string
        ok?: boolean
        sentCount?: number
      } | null

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? 'Unable to send email. Check your connection and try again.')
      }

      const sentCount = result.sentCount ?? selectedCount
      setSelectedRecipientIds(new Set())
      setDeliveryStatus({
        kind: 'success',
        message: `${sentCount} ${sentCount === 1 ? 'email' : 'emails'} sent successfully.`
      })
    } catch (error) {
      setDeliveryStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to send email. Check your connection and try again.'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section aria-labelledby='messaging-heading' className='space-y-5 px-2 md:px-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-3'>
        <div className='space-y-1'>
          <h2 id='messaging-heading' className='flex items-center font-poly font-medium text-xl space-x-4'>
            <span>Messaging</span>
            <Icon
              name='webhook'
              className='size-5 text-webhooks dark:text-white'
              onClick={navigate('/admin/config/email/webhooks')}
            />
          </h2>
        </div>

        <div className='hidden _flex flex-wrap items-center gap-2 font-ios text-xs uppercase tracking-widest text-muted-foreground'>
          <span className='rounded-full border border-border/70 px-2.5 py-1'>{recipients.length} verified</span>
          <span className='rounded-full border border-border/70 px-2.5 py-1'>{templates.length} templates</span>
        </div>
      </div>

      <div className='grid lg:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)] divide-x-[0.5px] divide-border/50 rounded-md overflow-hidden border'>
        <Card className='rounded-none ring-0 gap-y-0 py-0 md:divide-x divide-border'>
          <CardHeader className='p-0 gap-0 ring-0 rounded-none'>
            {/*<div className='hidden _flex items-center justify-between px-4'>
              <div className=''>
                <CardTitle className='font-poly'>Recipients</CardTitle>
                <CardDescription>
                  {selectedCount} selected · maximum {maxRecipientsPerSend} per send
                </CardDescription>
              </div>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={!filteredRecipients.length}
                className='hidden'
                onClick={toggleFilteredRecipients}>
                {allFilteredSelected ? 'Clear visible' : 'Select visible'}
              </Button>
            </div>
*/}
            <div className='relative'>
              <label htmlFor={searchId} className='sr-only'>
                Search recipients
              </label>
              <Input
                ref={searchInputRef}
                id={searchId}
                type='search'
                inputMode='search'
                autoComplete='off'
                spellCheck={false}
                maxLength={160}
                value={searchQuery}
                placeholder='Search name or email'
                className='h-12 ps-4 rounded-none border-none placeholder:text-lg focus-visible:outline-none focus-within:outline-none ring-0'
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
              />
              {searchQuery ? (
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  aria-label='Clear recipient search'
                  className='absolute inset-y-0 right-0 my-auto'
                  onClick={clearSearch}>
                  <Icon name='close' aria-hidden='true' className='size-4' />
                </Button>
              ) : null}
            </div>

            {/*<p className='text-xs text-muted-foreground' role='status' aria-live='polite' aria-atomic='true'>
              {searchQuery.trim()
                ? `${filteredRecipients.length} ${
                    filteredRecipients.length === 1 ? 'recipient matches' : 'recipients match'
                  } this search.`
                : `${filteredRecipients.length} ${
                    filteredRecipients.length === 1 ? 'recipient is' : 'recipients are'
                  } available.`}
            </p>*/}
          </CardHeader>

          <CardContent className='max-h-136 overflow-y-auto p-0 border-t'>
            {filteredRecipients.length ? (
              <ul className='divide-y divide-border/60'>
                {filteredRecipients.map((recipient) => {
                  const selected = selectedRecipientIds.has(recipient.id)
                  return (
                    <li key={recipient.id}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40',
                          selected && 'bg-primary/5'
                        )}>
                        <input
                          type='checkbox'
                          checked={selected}
                          className='size-4 shrink-0 accent-primary sr-only'
                          onChange={(event) => setRecipientSelected(recipient.id, event.currentTarget.checked)}
                        />
                        <Avatar className='size-9 border border-border/70'>
                          <AvatarImage src={recipient.pictureUrl ?? undefined} alt='' />
                          <AvatarFallback className='text-xs'>{getInitials(recipient.name)}</AvatarFallback>
                        </Avatar>
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate font-okx text-sm'>{recipient.name}</span>
                          <span className='block truncate text-xs text-muted-foreground'>{recipient.email}</span>
                        </span>
                        <span className='shrink-0 text-right'>
                          <span className='block font-ios text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400'>
                            Verified
                          </span>
                          <span className='mt-0.5 hidden text-[10px] text-muted-foreground sm:block'>
                            {recipient.updatedLabel}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className='flex min-h-48 flex-col items-center justify-center gap-3 px-6 text-center'>
                <Icon name='search' aria-hidden='true' className='size-8 text-muted-foreground' />
                <div className='space-y-1'>
                  <p className='font-okx text-base'>No recipients found</p>
                  <p className='text-sm text-muted-foreground'>Try another name or email address.</p>
                </div>
                <Button type='button' size='sm' variant='outline' onClick={clearSearch}>
                  Clear search
                </Button>
              </div>
            )}
          </CardContent>

          {excludedUserCount ? (
            <CardFooter className='border-t border-border/70 py-3 text-xs text-muted-foreground'>
              {excludedUserCount} {excludedUserCount === 1 ? 'account is' : 'accounts are'} excluded because a verified
              email address is not available.
            </CardFooter>
          ) : null}
        </Card>

        <Card className='gap-0 py-0 rounded-none'>
          <CardHeader className='border-b border-border/70 pt-4 pb-0 gap-0'>
            <div className=''>
              <CardTitle className='font-poly'>Compose email</CardTitle>
              <CardDescription className=''>
                Recipient addresses are sent individually and are never exposed to other users.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className='space-y-5 py-5 rounded-none'>
            <div className='space-y-2'>
              <label htmlFor={templateId} className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>
                Template
              </label>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <select
                  id={templateId}
                  value={selectedTemplateId}
                  className='h-10 min-w-0 flex-1 rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
                  onChange={(event) => applyTemplate(event.currentTarget.value)}>
                  <option value=''>Start with a blank message</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                      {template.visible ? '' : ' — hidden'}
                    </option>
                  ))}
                </select>
                {ticketTemplateSelected ? (
                  <Button
                    type='button'
                    variant='outline'
                    disabled={!canSaveTemplate || isSavingTemplate}
                    className='active:scale-[0.96]'
                    onClick={() => void handleSaveTemplate()}>
                    <Icon name={isSavingTemplate ? 'spinner-ring' : 'document'} aria-hidden='true' className='size-4' />
                    {isSavingTemplate ? 'Saving' : selectedTemplate?.persistedId ? 'Save changes' : 'Save template'}
                  </Button>
                ) : null}
              </div>
              {selectedTemplate ? (
                <p className='text-xs text-muted-foreground'>
                  {selectedTemplate.intent} · {selectedTemplate.type} · updated {selectedTemplate.updatedLabel}
                </p>
              ) : null}
              {ticketTemplateSelected ? (
                <p className='text-xs text-muted-foreground'>
                  Supported placeholders: {'{{playerName}}'}, {'{{eventTitle}}'}, {'{{reference}}'}, and{' '}
                  {'{{ticketCount}}'}. Use the recipient list below to send a test with sample ticket details.
                </p>
              ) : null}
              <div aria-live='polite' aria-atomic='true'>
                {templateStatus?.kind === 'success' ? (
                  <p role='status' className='text-sm text-emerald-600 dark:text-emerald-400'>
                    {templateStatus.message}
                  </p>
                ) : null}
                {templateStatus?.kind === 'error' ? (
                  <p role='alert' className='text-sm text-destructive'>
                    {templateStatus.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className='space-y-2'>
              <label htmlFor={subjectId} className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>
                Subject
              </label>
              <Input
                id={subjectId}
                value={subject}
                maxLength={200}
                placeholder='Tournament update'
                className='h-10'
                onChange={(event) => {
                  setSubject(event.currentTarget.value)
                  setDeliveryStatus(null)
                  setTemplateStatus(null)
                }}
              />
              <p className='text-right text-xs text-muted-foreground'>{subject.length}/200</p>
            </div>

            <div className='space-y-2'>
              <label
                htmlFor={messageId}
                className='font-ios text-xs uppercase tracking-widest text-muted-foreground space-x-2'>
                Message Body
              </label>
              <textarea
                id={messageId}
                rows={10}
                value={message}
                maxLength={20_000}
                placeholder='Write the update recipients should receive.'
                className='min-h-56 w-full resize-y rounded-lg border border-input bg-input/30 px-3 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm'
                onChange={(event) => {
                  setMessage(event.currentTarget.value)
                  setTemplateHtml('')
                  setDeliveryStatus(null)
                  setTemplateStatus(null)
                }}
              />
              <div className='flex items-start justify-between gap-3 text-xs text-muted-foreground'>
                <span>
                  {templateHtml && !message.trim()
                    ? 'This template will use its formatted HTML content.'
                    : 'Line breaks are preserved in the delivered email.'}
                </span>
                <span className='shrink-0'>{message.length}/20,000</span>
              </div>
            </div>

            <div className='rounded-xl border border-dashed border-border/80 bg-muted/15 p-4'>
              <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>Delivery preview</p>
              <p className='mt-3 font-poly text-base'>{subject.trim() || 'No subject yet'}</p>
              <p className='mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground'>
                {message.trim() ||
                  (templateHtml
                    ? 'Formatted HTML from the selected template will be delivered.'
                    : 'Write a message or select a template to preview it here.')}
              </p>
            </div>

            <div aria-live='polite' aria-atomic='true'>
              {deliveryStatus?.kind === 'success' ? (
                <p role='status' className='flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400'>
                  <Icon name='circle-check-line' aria-hidden='true' className='size-4' />
                  {deliveryStatus.message}
                </p>
              ) : null}
              {deliveryStatus?.kind === 'error' ? (
                <p role='alert' className='text-sm text-destructive'>
                  {deliveryStatus.message}
                </p>
              ) : null}
            </div>
          </CardContent>

          <CardFooter className='flex flex-col-reverse gap-2 border-t border-border/70 py-4 sm:flex-row sm:justify-between'>
            <Button type='button' variant='ghost' disabled={isSending} onClick={resetDraft}>
              Reset draft
            </Button>
            <Button type='button' size='lg' disabled={!canSend || isSending} onClick={handleSend}>
              <Icon name={isSending ? 'spinner-ring' : 'send'} aria-hidden='true' className='size-4' />
              {isSending
                ? 'Sending emails'
                : selectedCount
                  ? `Send to ${selectedCount} ${selectedCount === 1 ? 'recipient' : 'recipients'}`
                  : 'Select recipients'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

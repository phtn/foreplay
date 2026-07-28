'use client'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { type SubmitEvent, useState } from 'react'
import { saveTournamentSupport } from './actions'

type TournamentSupport = NonNullable<Doc<'tournaments'>['support']>

type SupportDraft = {
  name: string
  title: string
  email: string
  phone: string
  secondaryName: string
  secondaryTitle: string
  secondaryEmail: string
  secondaryPhone: string
}

interface EventSupportDrawerProps {
  eventTitle: string
  support: Doc<'tournaments'>['support']
  tournamentId: Id<'tournaments'>
}

const emptySupportDraft: SupportDraft = {
  name: '',
  title: '',
  email: '',
  phone: '',
  secondaryName: '',
  secondaryTitle: '',
  secondaryEmail: '',
  secondaryPhone: ''
}

function getSupportDraft(support: TournamentSupport | undefined): SupportDraft {
  return {
    name: support?.name ?? '',
    title: support?.title ?? '',
    email: support?.email ?? '',
    phone: support?.phone ?? '',
    secondaryName: support?.secondaryName ?? '',
    secondaryTitle: support?.secondaryTitle ?? '',
    secondaryEmail: support?.secondaryEmail ?? '',
    secondaryPhone: support?.secondaryPhone ?? ''
  }
}

function hasSupportDetails(support: TournamentSupport | undefined) {
  return Boolean(
    support?.name ||
    support?.title ||
    support?.email ||
    support?.phone ||
    support?.secondaryName ||
    support?.secondaryTitle ||
    support?.secondaryEmail ||
    support?.secondaryPhone
  )
}

export function EventSupportDrawer({ eventTitle, support, tournamentId }: EventSupportDrawerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<SupportDraft>(support ? () => getSupportDraft(support) : emptySupportDraft)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const configured = hasSupportDetails(support)

  const updateDraft = <Key extends keyof SupportDraft>(key: Key, value: SupportDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(getSupportDraft(support))
      setErrorMessage(null)
      setSuccessMessage(null)
    }

    setOpen(nextOpen)
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const result = await saveTournamentSupport({
        tournamentId,
        support: draft
      })

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      setSuccessMessage(
        Object.values(draft).some((value) => value.trim()) ? 'Support details saved.' : 'Support details cleared.'
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save support details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection='right'>
      <Tooltip>
        <TooltipTrigger
          delay={150}
          render={
            <DrawerTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  className='relative rounded-full text-sky-600 hover:text-sky-500'
                  aria-label={`${configured ? 'Edit' : 'Add'} support details for ${eventTitle}`}>
                  <Icon name='service' className='size-5' />
                  {configured ? (
                    <span
                      aria-hidden
                      className='absolute right-0.5 top-0.5 size-1.5 rounded-full bg-emerald-500 ring-2 ring-background'
                    />
                  ) : null}
                </Button>
              }
            />
          }
        />
        <TooltipContent className='font-okx font-medium' side='top'>
          {configured ? 'Edit support' : 'Add support'}
        </TooltipContent>
      </Tooltip>

      <DrawerContent className='[--drawer-content-width:calc(100vw-0.5rem)] sm:[--drawer-content-width:44rem] md:[--drawer-content-width:48rem] rounded-xl'>
        <DrawerHeader className='flex-row items-start justify-between gap-4 border-b border-border/60 border-dashed pb-4 text-left'>
          <div className='min-w-0 space-y-1'>
            <p className='font-ios text-xs uppercase tracking-widest text-violet-700 dark:text-violet-400'>
              Tournament support
            </p>
            <DrawerTitle className='truncate font-poly text-xl'>{eventTitle}</DrawerTitle>
            <DrawerDescription className='font-ios text-xs whitespace-nowrap'>
              Add the contact guests can reach for event help.
            </DrawerDescription>
          </div>

          <DrawerClose
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='shrink-0 rounded-full'
                disabled={isSubmitting}
                aria-label='Close tournament support'>
                <Icon name='close' className='size-4' />
              </Button>
            }
          />
        </DrawerHeader>

        <form onSubmit={handleSubmit} className='flex min-h-0 flex-1 flex-col'>
          <div className='min-h-0 flex-1 overflow-y-auto bg-slate-950/5 p-0'>
            <div className='h-12 font-poly flex items-center justify-center'>Primary Support</div>
            <div className='grid gap-5 _rounded-xl bg-background p-4 shadow-sm'>
              <div className='grid gap-4'>
                <SupportInput
                  id='event-support-title'
                  label='Title'
                  value={draft.title}
                  onChange={(value) => updateDraft('title', value)}
                  placeholder='Customer Support'
                  autoComplete='organization-title'
                  maxLength={120}
                />
                <SupportInput
                  id='event-support-name'
                  label='Name'
                  value={draft.name}
                  onChange={(value) => updateDraft('name', value)}
                  placeholder='Point of Contact'
                  autoComplete='name'
                  maxLength={120}
                />
              </div>

              <SupportInput
                id='event-support-email'
                label='Email'
                type='email'
                value={draft.email}
                onChange={(value) => updateDraft('email', value)}
                placeholder='support@tournament.com'
                autoComplete='email'
                maxLength={320}
              />

              <SupportInput
                id='event-support-phone'
                label='Phone'
                type='tel'
                value={draft.phone}
                onChange={(value) => updateDraft('phone', value)}
                placeholder='+63 917 123 4567'
                autoComplete='tel'
                maxLength={64}
              />

              <ul className='list-disc px-5'>
                <li className='text-xs leading-5 text-muted-foreground'>Every field is optional.</li>
                <li className='text-xs leading-5 text-muted-foreground'>
                  Save all fields blank to remove the support contact from this tournament.
                </li>
              </ul>

              {errorMessage ? (
                <p role='alert' className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p
                  role='status'
                  className='rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'>
                  {successMessage}
                </p>
              ) : null}
            </div>
            <div className='h-12 font-poly flex items-center justify-center'>Secondary Support</div>
            <div className='grid gap-5 _rounded-xl border border-border/0 bg-background p-4 shadow-sm sm:p-5'>
              <div className='grid gap-4'>
                <SupportInput
                  id='event-secondary-support-title'
                  label='Title'
                  value={draft.secondaryTitle}
                  onChange={(value) => updateDraft('secondaryTitle', value)}
                  placeholder='Customer Support'
                  autoComplete='organization-title'
                  maxLength={120}
                />
                <SupportInput
                  id='event-secondary-support-name'
                  label='Name'
                  value={draft.secondaryName}
                  onChange={(value) => updateDraft('secondaryName', value)}
                  placeholder='Point of Contact'
                  autoComplete='name'
                  maxLength={120}
                />
              </div>

              <SupportInput
                id='event-secondary-support-email'
                label='Email'
                type='email'
                value={draft.secondaryEmail}
                onChange={(value) => updateDraft('secondaryEmail', value)}
                placeholder='support@tournament.com'
                autoComplete='email'
                maxLength={320}
              />

              <SupportInput
                id='event-secondary-support-phone'
                label='Phone'
                type='tel'
                value={draft.secondaryPhone}
                onChange={(value) => updateDraft('secondaryPhone', value)}
                placeholder='+63 917 123 4567'
                autoComplete='tel'
                maxLength={64}
              />

              <ul className='list-disc px-5'>
                <li className='text-xs leading-5 text-muted-foreground'>Every field is optional.</li>
                <li className='text-xs leading-5 text-muted-foreground'>
                  Save all fields blank to remove the support contact from this tournament.
                </li>
              </ul>

              {errorMessage ? (
                <p role='alert' className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p
                  role='status'
                  className='rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'>
                  {successMessage}
                </p>
              ) : null}
            </div>
          </div>

          <DrawerFooter className='grid gap-2 border-t border-border/70 p-4 sm:grid-cols-2'>
            {/*<DrawerClose
              render={
                <Button type='button' variant='ghost' className='h-12 font-poly' disabled={isSubmitting}>
                  Close
                </Button>
              }
            />*/}
            <Button
              type='submit'
              className='h-12 gap-2 bg-foreground hover:bg-foreground/80 font-poly text-background'
              disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span>Saving</span>
                  <Icon name='spinner-ring' className='size-3.5' />
                </>
              ) : (
                <span>Save</span>
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

function SupportInput({
  id,
  label,
  onChange,
  value,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> & {
  id: string
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className='h-11'
        {...props}
      />
    </div>
  )
}

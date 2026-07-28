import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

type TournamentSupport = Doc<'tournaments'>['support']

type SupportContact = {
  email: string | undefined
  id: 'primary' | 'secondary'
  label: string
  name: string | undefined
  phone: string | undefined
  title: string | undefined
}

const trimOptional = (value: string | undefined) => value?.trim() || undefined

export function getSupportContacts(support: TournamentSupport): SupportContact[] {
  if (!support) {
    return []
  }

  const contacts: SupportContact[] = [
    {
      id: 'primary',
      label: 'Primary support',
      name: trimOptional(support.name),
      title: trimOptional(support.title),
      email: trimOptional(support.email),
      phone: trimOptional(support.phone)
    },
    {
      id: 'secondary',
      label: 'Secondary support',
      name: trimOptional(support.secondaryName),
      title: trimOptional(support.secondaryTitle),
      email: trimOptional(support.secondaryEmail),
      phone: trimOptional(support.secondaryPhone)
    }
  ]

  return contacts.filter((contact) => contact.name || contact.title || contact.email || contact.phone)
}

const getPhoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

function SupportContactCard({ contact }: { contact: SupportContact }) {
  const heading = contact.name ?? contact.title ?? contact.label
  const showTitle = contact.title && contact.title !== heading

  return (
    <article className='flex min-w-0 flex-col rounded-md _border border-border/60 bg-background p-4'>
      <div className='flex items-start gap-3'>
        <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <Icon name='service' className='size-5' />
        </span>
        <div className='min-w-0'>
          <p className='font-ios text-[10px] uppercase tracking-[0.2em] text-muted-foreground'>{contact.label}</p>
          <h3 className='mt-1 wrap-break-word font-poly text-lg leading-tight text-foreground capitalize'>{heading}</h3>
          {showTitle ? <p className='mt-1 font-ios text-xs text-muted-foreground'>{contact.title}</p> : null}
        </div>
      </div>

      {contact.email || contact.phone ? (
        <address className='mt-5 grid gap-2 not-italic'>
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className='group flex min-h-11 min-w-0 items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'>
              <Icon name='mail' className='size-4 shrink-0 text-primary' />
              <span className='min-w-0 flex-1 wrap-break-word font-ios text-sm text-foreground/85'>
                {contact.email}
              </span>
              <Icon
                name='chevron-right'
                className='size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5'
              />
            </a>
          ) : null}

          {contact.phone ? (
            <a
              href={getPhoneHref(contact.phone)}
              className='group flex min-h-11 min-w-0 items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'>
              <Icon name='phone-accept' className='size-4 shrink-0 text-primary' />
              <span className='min-w-0 flex-1 wrap-break-word font-ios text-sm tracking-wide text-foreground/85'>
                {contact.phone}
              </span>
              <Icon
                name='chevron-right'
                className='size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5'
              />
            </a>
          ) : null}
        </address>
      ) : null}
    </article>
  )
}

export function SupportDetails({ support }: { support: TournamentSupport }) {
  const contacts = getSupportContacts(support)

  if (contacts.length === 0) {
    return null
  }

  return (
    <section
      id='tournament-support'
      aria-labelledby='tournament-support-heading'
      className='mt-12 scroll-mt-6 overflow-hidden rounded-[1.5rem] border border-border/60 bg-slate-50 shadow-sm dark:border-slate-600 dark:bg-transparent sm:mt-16'>
      <div className='flex items-start gap-4 border-b border-dashed border-border/50 px-4 py-5 sm:px-7 sm:py-6'>
        <span className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground'>
          <Icon name='service' className='size-6' />
        </span>
        <div className='min-w-0'>
          <p className='font-ios text-[10px] uppercase tracking-[0.28em] text-primary'>Need a hand?</p>
          <h2 id='tournament-support-heading' className='mt-1 font-poly text-xl tracking-[-0.02em] sm:text-2xl'>
            Questions &amp; inquiries
          </h2>
          <p className='mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>
            Contact the event team for help with registration, payments, or tournament-day details.
          </p>
        </div>
      </div>

      <div className={cn('grid gap-3 p-4 sm:p-5', contacts.length > 1 ? 'md:grid-cols-2' : null)}>
        {contacts.map((contact) => (
          <SupportContactCard key={contact.id} contact={contact} />
        ))}
      </div>
    </section>
  )
}

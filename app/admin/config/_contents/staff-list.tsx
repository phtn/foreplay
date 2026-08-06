'use client'

import { HyperList } from '@/components/list/hyperlist'
import { Badge } from '@/components/reui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Icon, type IconName } from '@/lib/icons'
import { type ComponentProps, type ReactNode, useDeferredValue, useId, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { grantAdminClaim, removeCustomClaim, setCustomClaim } from '../actions'
import { filterStaffUsers, type UserWithClaims } from './staff-list-filter'

interface StaffListProps {
  data: UserWithClaims[] | undefined
  currentUserId: string
  isTopG: boolean
}

type StaffListEntry = UserWithClaims & {
  canManagePrivilegedClaims: boolean
  id: string
  isCurrentUser: boolean
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

export const StaffList = ({ data, currentUserId, isTopG }: StaffListProps) => {
  const searchId = useId()
  const searchDescriptionId = `${searchId}-description`
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filteredUsers = useMemo(() => filterStaffUsers(data, deferredQuery), [data, deferredQuery])
  const listData = useMemo<StaffListEntry[]>(
    () =>
      filteredUsers.map((entry) => ({
        ...entry,
        canManagePrivilegedClaims: isTopG,
        id: entry.user._id,
        isCurrentUser: entry.user.subject === currentUserId
      })),
    [currentUserId, filteredUsers, isTopG]
  )
  const listVersion = useMemo(
    () =>
      listData
        .map(
          ({ canManagePrivilegedClaims, claims, id, isCurrentUser }) =>
            `${id}:${isCurrentUser}:${canManagePrivilegedClaims}:${JSON.stringify(claims)}`
        )
        .join('|'),
    [listData]
  )
  const isSearching = deferredQuery.trim().length > 0
  const resultLabel = isSearching
    ? `${listData.length} ${listData.length === 1 ? 'user' : 'users'} found`
    : `${listData.length} ${listData.length === 1 ? 'account' : 'accounts'} found`

  const clearSearch = () => {
    setQuery('')
    searchInputRef.current?.focus()
  }

  return (
    <section aria-labelledby={`${searchId}-heading`} className='relative border dark:border-zinc-700'>
      <h2 id={`${searchId}-heading`} className='sr-only opacity-0 absolute font-bold'>
        Staff
      </h2>
      <div className='relative'>
        <div className=''>
          <label
            htmlFor={searchId}
            className='sr-only font-ios text-xs uppercase tracking-widest text-muted-foreground'>
            Search users
          </label>
          <div className='relative'>
            {query.trim().length === 0 && (
              <Icon
                name='slash'
                className='pointer-events-none absolute inset-y-0 right-3 my-auto size-5 text-foreground/50'
              />
            )}
            <Input
              ref={searchInputRef}
              id={searchId}
              type='search'
              inputMode='search'
              autoComplete='off'
              spellCheck={false}
              maxLength={160}
              value={query}
              aria-describedby={searchDescriptionId}
              placeholder='Search for name, email, phone, or id'
              className='h-12 px-5 rounded-none border-b border-x-0 border-t-0 border-foreground/40 dark:border-zinc-700 md:text-lg focus-within:outline-none focus-visible:ring-none focus-within:ring-0 focus-within:ring-sky-400/40 placeholder:text-foreground/40'
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            {query ? (
              <Button
                type='button'
                size='icon-lg'
                variant='ghost'
                aria-label='Clear user search'
                className='absolute inset-y-0 right-3 my-auto hidden'
                onClick={clearSearch}>
                <Icon name='close' className='size-5' />
              </Button>
            ) : null}
          </div>
        </div>
        <p
          className='px-2 font-ios text-xs uppercase tracking-widest absolute top-4 right-14 pointer-events-none'
          role='status'
          aria-live='polite'
          aria-atomic='true'>
          {resultLabel}
        </p>
      </div>

      <div className='p-0'>
        {listData.length ? (
          <HyperList
            key={listVersion}
            data={listData}
            keyId='id'
            max={listData.length}
            container='mb-auto w-full space-y-1'
            component={StaffListItem}
          />
        ) : (
          <Card className='ring-0 rounded-lg py-0'>
            <CardContent className='flex min-h-48 flex-col items-center justify-center px-6 text-center'>
              <Icon name={isSearching ? 'user-circle' : 'person-multiple'} className='size-10 text-foreground/20' />
              <div className='space-y-2 py-4'>
                <p className='font-poly text-foreground/70 text-base'>
                  {isSearching ? 'No users found' : 'No staff or admins yet'}
                </p>
                <p className='font-okx text-sm text-foreground/50'>
                  {isSearching
                    ? 'Try a name, email, phone number, or user ID.'
                    : 'Search for a user to grant staff or admin access.'}
                </p>
              </div>

              {isSearching ? (
                <Button type='button' size='sm' variant='secondary' onClick={clearSearch} className='font-okx px-4'>
                  Clear search
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}

const StaffListItem = ({ canManagePrivilegedClaims, claims, isCurrentUser, user }: StaffListEntry) => {
  const displayName = user.name ?? user.preferredUsername ?? user.email ?? user.subject

  return (
    <Accordion key={user._id} multiple={false} defaultValue={['1']} className='border-none rounded-none'>
      <AccordionItem value={user._id} className='p-0 **:data-[slot=accordion-content]:p-0!'>
        <AccordionTrigger className='items-center px-2 pb-2 pt-3 hover:no-underline'>
          <div className='flex items-center gap-2 md:gap-4'>
            <Avatar className='size-8 border border-foreground'>
              <AvatarImage src={user.pictureUrl ?? undefined} alt='user avatar' />
              <AvatarFallback className='text-xs'>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className='inline-flex items-center gap-3'>
              <span className='font-okx font-medium text-foreground/80 text-lg'>{displayName}</span>
              <div className='font-okx font-medium flex shrink-0 items-center gap-2 uppercase'>
                {claims.topg === true ? (
                  <Badge variant='top-g-outline' size='default' radius='md'>
                    Top G
                  </Badge>
                ) : null}
                <Badge variant={claims.admin === true ? 'god-outline' : 'focus-outline'} size='default' radius='md'>
                  {claims.admin === true ? 'Admin' : 'User'}
                </Badge>
                {claims.staff === true ? (
                  <Badge variant='default-outline' size='lg'>
                    Staff
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='py-0 ring-none rounded-none md:mt-1'>
          <UserClaimCard
            canManagePrivilegedClaims={canManagePrivilegedClaims}
            claims={claims}
            isCurrentUser={isCurrentUser}
            user={user}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

type UserClaimCardProps = UserWithClaims & Pick<StaffListEntry, 'canManagePrivilegedClaims' | 'isCurrentUser'>

function UserClaimCard({ canManagePrivilegedClaims, claims, isCurrentUser, user }: UserClaimCardProps) {
  const cardId = useId()
  const hasAdminClaim = claims.admin === true
  const hasStaffClaim = claims.staff === true
  const claimEntries = Object.entries(claims).toSorted(([left], [right]) => left.localeCompare(right))
  const adminProtectionMessage = isCurrentUser
    ? 'You cannot remove admin access from your own account.'
    : 'Only Top G accounts can remove admin access.'

  return (
    <Card className='mb-1 gap-0 rounded-none border-x-0 border-b-0 border-t border-dashed border-border/70 bg-muted/15 py-0 ring-0'>
      <CardHeader className='gap-0 px-3 py-4 sm:px-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex min-w-0 items-start gap-3'>
            <div className='flex size-7 shrink-0 items-center justify-center rounded-sm bg-foreground/5 text-foreground ring-1 ring-foreground/10'>
              <Icon name='key' className='size-4' />
            </div>
            <div className='min-w-0'>
              <CardTitle className='font-okx text-base'>Access Controls</CardTitle>
              <CardDescription className='leading-5'>Manage roles and custom claims for this account.</CardDescription>
            </div>
          </div>
          <div className='flex flex-wrap items-center justify-end gap-1.5'>
            {isCurrentUser ? (
              <Badge variant='god-light' size='lg' radius='full'>
                Current
              </Badge>
            ) : null}
            <Badge variant='outline' size='lg' radius='full'>
              {claimEntries.length} {claimEntries.length === 1 ? 'claim' : 'claims'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6 px-3 pb-4 sm:px-4'>
        <section aria-labelledby={`${cardId}-roles`} className='space-y-3'>
          <SectionHeading id={`${cardId}-roles`} title='Roles' description='' />

          <div className='grid gap-3 lg:grid-cols-2'>
            <RoleControl
              title='Admin'
              description={
                hasAdminClaim && (!canManagePrivilegedClaims || isCurrentUser)
                  ? adminProtectionMessage
                  : 'Full access to administration and configuration.'
              }
              icon='horse-head'
              isAssigned={hasAdminClaim}>
              {hasAdminClaim ? (
                canManagePrivilegedClaims && !isCurrentUser ? (
                  <form action={removeCustomClaim}>
                    <input type='hidden' name='uid' value={user.subject} />
                    <input type='hidden' name='claimKey' value='admin' />
                    <FormSubmitButton icon='minus' label='Remove admin' variant='destructive' />
                  </form>
                ) : (
                  <ProtectedAction label={isCurrentUser ? 'Current account' : 'Top G required'} />
                )
              ) : (
                <form action={grantAdminClaim}>
                  <input type='hidden' name='uid' value={user.subject} />
                  <FormSubmitButton icon='add' label='Grant admin' />
                </form>
              )}
            </RoleControl>

            <RoleControl
              title='Staff'
              description='Access to staff tools and event operations.'
              icon='user-box-fill'
              isAssigned={hasStaffClaim}>
              <form action={hasStaffClaim ? removeCustomClaim : setCustomClaim}>
                <input type='hidden' name='uid' value={user.subject} />
                <input type='hidden' name='claimKey' value='staff' />
                {hasStaffClaim ? null : <input type='hidden' name='claimValue' value='true' />}
                <FormSubmitButton
                  icon={hasStaffClaim ? 'minus' : 'add'}
                  label={hasStaffClaim ? 'Remove staff' : 'Grant staff'}
                  variant={hasStaffClaim ? 'destructive' : 'outline'}
                />
              </form>
            </RoleControl>
          </div>
        </section>

        <section aria-labelledby={`${cardId}-editor`} className='space-y-3'>
          <SectionHeading
            id={`${cardId}-editor`}
            title='Add or update a claim'
            description='Use a claim key and a JSON value, or enter plain text.'
          />

          <form action={setCustomClaim} className='rounded-xl bg-background/70 p-3 ring-1 ring-foreground/8 sm:p-4'>
            <input type='hidden' name='uid' value={user.subject} />
            <div className='grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end'>
              <div className='space-y-1.5'>
                <label htmlFor={`${cardId}-claim-key`} className='text-xs font-medium text-foreground/80'>
                  Claim key
                </label>
                <Input
                  id={`${cardId}-claim-key`}
                  name='claimKey'
                  placeholder='department'
                  autoComplete='off'
                  spellCheck={false}
                  maxLength={64}
                  required
                  className='font-mono md:text-xs'
                />
              </div>
              <div className='space-y-1.5'>
                <label htmlFor={`${cardId}-claim-value`} className='text-xs font-medium text-foreground/80'>
                  Claim value
                </label>
                <Input
                  id={`${cardId}-claim-value`}
                  name='claimValue'
                  placeholder='true, 1, or "operations"'
                  autoComplete='off'
                  spellCheck={false}
                  required
                  className='font-mono md:text-xs'
                />
              </div>
              <FormSubmitButton icon='add' label='Set claim' variant='secondary' className='sm:min-w-28' />
            </div>
            <p className='mt-3 text-xs leading-5 text-muted-foreground'>
              The <code className='font-mono text-foreground/75'>topg</code> claim and admin removal are protected.
            </p>
          </form>
        </section>

        <section aria-labelledby={`${cardId}-claims`} className='space-y-3'>
          <SectionHeading
            id={`${cardId}-claims`}
            title='Assigned claims'
            description='Review the exact values currently stored in Firebase.'
          />

          {claimEntries.length ? (
            <div className='overflow-hidden rounded-xl bg-background/70 ring-1 ring-foreground/8'>
              {claimEntries.map(([claimKey, claimValue]) => {
                const isManagedRole =
                  (claimKey === 'admin' && claimValue === true) || (claimKey === 'staff' && claimValue === true)
                const isSelfProtected = isCurrentUser && (claimKey === 'admin' || claimKey === 'topg')
                const requiresTopG = (claimKey === 'admin' || claimKey === 'topg') && !canManagePrivilegedClaims

                return (
                  <div
                    key={claimKey}
                    className='flex min-w-0 items-center justify-between gap-3 border-t border-border/50 px-3 py-3 first:border-t-0 sm:px-4'>
                    <div className='min-w-0 space-y-0.5'>
                      <p className='truncate font-mono text-xs font-medium text-foreground'>{claimKey}</p>
                      <p className='wrap-break-word font-mono text-xs leading-5 text-muted-foreground'>
                        {formatClaimValue(claimValue)}
                      </p>
                    </div>
                    {isManagedRole ? (
                      <Badge variant='secondary' size='sm' radius='full'>
                        Role
                      </Badge>
                    ) : isSelfProtected || requiresTopG ? (
                      <ProtectedAction compact label={isSelfProtected ? 'Current account' : 'Top G required'} />
                    ) : (
                      <form action={removeCustomClaim}>
                        <input type='hidden' name='uid' value={user.subject} />
                        <input type='hidden' name='claimKey' value={claimKey} />
                        <ClaimRemoveButton claimKey={claimKey} />
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className='rounded-xl border border-dashed border-border/70 bg-background/50 px-4 py-6 text-center'>
              <Icon name='key' className='mx-auto size-5 text-muted-foreground/60' />
              <p className='mt-2 text-sm font-medium text-foreground/75'>No custom claims</p>
              <p className='mt-1 text-xs text-muted-foreground'>Add a claim above or assign a role.</p>
            </div>
          )}
        </section>

        <dl className='grid gap-3 rounded-xl bg-muted/40 px-3 py-3 text-xs sm:grid-cols-2 sm:px-4'>
          <AccountMetadata label='Provider' value={user.nickname ?? 'Unknown'} />
          <AccountMetadata label='Last updated' value={dateFormatter.format(user.updatedAt)} alignEnd />
        </dl>

        <p className='text-xs leading-5 text-muted-foreground'>
          Role changes take effect after the user refreshes their authentication token.
        </p>
      </CardContent>
    </Card>
  )
}

function SectionHeading({ description, id, title }: { description: string; id: string; title: string }) {
  return (
    <div className='space-y-1'>
      <h3 id={id} className='font-okx text-sm font-medium text-foreground'>
        {title}
      </h3>
      <p className='text-xs leading-5 text-muted-foreground'>{description}</p>
    </div>
  )
}

function RoleControl({
  children,
  description,
  icon,
  isAssigned,
  title
}: {
  children: ReactNode
  description: string
  icon: IconName
  isAssigned: boolean
  title: string
}) {
  return (
    <div className='flex min-h-44 flex-col rounded-sm bg-background/70 p-4 ring-1 ring-foreground/8'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground/70'>
            <Icon name={icon} className='size-5' />
          </div>
          <p className='font-okx text-sm font-medium text-foreground'>{title}</p>
        </div>
        <Badge variant={isAssigned ? 'success-light' : 'outline'} size='sm' radius='full'>
          {isAssigned ? 'Assigned' : 'Not assigned'}
        </Badge>
      </div>
      <p className='mt-3 text-xs leading-5 text-muted-foreground'>{description}</p>
      <div className='mt-auto pt-4 [&>form]:w-full'>{children}</div>
    </div>
  )
}

function FormSubmitButton({
  className,
  icon,
  label,
  variant = 'outline'
}: {
  className?: string
  icon: IconName
  label: string
  variant?: ComponentProps<typeof Button>['variant']
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type='submit'
      size='sm'
      variant={variant}
      disabled={pending}
      aria-busy={pending}
      className={`w-full ${className ?? ''}`}>
      <Icon name={pending ? 'spinner-ring' : icon} className='size-3.5' />
      {label}
    </Button>
  )
}

function ClaimRemoveButton({ claimKey }: { claimKey: string }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type='submit'
      size='icon-sm'
      variant='ghost'
      disabled={pending}
      aria-busy={pending}
      aria-label={`Remove ${claimKey} claim`}
      className='rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive'>
      <Icon name={pending ? 'spinner-ring' : 'close'} className='size-3.5' />
    </Button>
  )
}

function ProtectedAction({ compact = false, label }: { compact?: boolean; label: string }) {
  return (
    <div
      className={
        compact
          ? 'flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground'
          : 'flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-muted px-3 text-xs font-medium text-muted-foreground'
      }>
      <Icon name='lock' className='size-3.5' />
      <span>{label}</span>
    </div>
  )
}

function AccountMetadata({ alignEnd = false, label, value }: { alignEnd?: boolean; label: string; value: string }) {
  return (
    <div className={alignEnd ? 'sm:text-end' : undefined}>
      <dt className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{label}</dt>
      <dd className='mt-1 truncate font-mono text-xs text-foreground/75'>{value}</dd>
    </div>
  )
}

function formatClaimValue(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value) ?? String(value)
}

'use client'

import { HyperList } from '@/components/list/hyperlist'
import { Badge } from '@/components/reui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Icon } from '@/lib/icons'
import { useDeferredValue, useId, useMemo, useRef, useState } from 'react'
import { grantAdminClaim, removeCustomClaim, setCustomClaim } from '../actions'
import { filterStaffUsers, type UserWithClaims } from './staff-list-filter'

interface StaffListProps {
  data: UserWithClaims[] | undefined
}

type StaffListEntry = UserWithClaims & {
  id: string
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

export const StaffList = ({ data }: StaffListProps) => {
  const searchId = useId()
  const searchDescriptionId = `${searchId}-description`
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filteredUsers = useMemo(() => filterStaffUsers(data, deferredQuery), [data, deferredQuery])
  const listData = useMemo<StaffListEntry[]>(
    () => filteredUsers.map((entry) => ({ ...entry, id: entry.user._id })),
    [filteredUsers]
  )
  const listVersion = useMemo(
    () => listData.map(({ claims, id }) => `${id}:${JSON.stringify(claims)}`).join('|'),
    [listData]
  )
  const isSearching = deferredQuery.trim().length > 0
  const resultLabel = isSearching
    ? `${listData.length} ${listData.length === 1 ? 'user' : 'users'} found`
    : `${listData.length} ${listData.length === 1 ? 'account has' : 'accounts have'} staff or admin access`

  const clearSearch = () => {
    setQuery('')
    searchInputRef.current?.focus()
  }

  return (
    <section aria-labelledby={`${searchId}-heading`} className='space-y-4'>
      <div className='grid gap-3 px-2 md:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] md:items-end'>
        <div className='space-y-1'>
          <h2 id={`${searchId}-heading`} className='font-poly text-lg font-medium'>
            Staff
          </h2>
          {/*<p id={searchDescriptionId} className='text-sm text-muted-foreground'>
            Search any account to grant or revoke claims.
          </p>*/}
        </div>

        <div className='space-y-1.5'>
          <label htmlFor={searchId} className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>
            Search users
          </label>
          <div className='relative'>
            <Icon
              name='search'
              aria-hidden='true'
              className='pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground'
            />
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
              placeholder='Name, email, phone, or user ID'
              className='h-11 px-10'
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            {query ? (
              <Button
                type='button'
                size='icon-lg'
                variant='ghost'
                aria-label='Clear user search'
                className='absolute inset-y-0 right-0 my-auto'
                onClick={clearSearch}>
                <Icon name='close' aria-hidden='true' className='size-4' />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <p
        className='px-2 font-ios text-xs uppercase tracking-widest text-muted-foreground'
        role='status'
        aria-live='polite'
        aria-atomic='true'>
        {resultLabel}
      </p>

      {listData.length ? (
        <HyperList
          key={listVersion}
          data={listData}
          keyId='id'
          max={listData.length}
          container='mb-auto w-full'
          component={StaffListItem}
        />
      ) : (
        <Card className='rounded-lg border-border/70'>
          <CardContent className='flex min-h-48 flex-col items-center justify-center gap-3 px-6 text-center'>
            <Icon
              name={isSearching ? 'search' : 'person-multiple'}
              aria-hidden='true'
              className='size-8 text-muted-foreground'
            />
            <div className='space-y-1'>
              <p className='font-okx text-base'>{isSearching ? 'No users found' : 'No staff or admins yet'}</p>
              <p className='text-sm text-muted-foreground'>
                {isSearching
                  ? 'Try a name, email, phone number, or user ID.'
                  : 'Search for a user to grant staff or admin access.'}
              </p>
            </div>
            {isSearching ? (
              <Button type='button' size='sm' variant='outline' onClick={clearSearch}>
                Clear search
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}
    </section>
  )
}

const StaffListItem = ({ user, claims }: StaffListEntry) => {
  const displayName = user.name ?? user.preferredUsername ?? user.email ?? user.subject

  return (
    <Accordion key={user._id} multiple={false} defaultValue={['1']} className='border-none'>
      <AccordionItem value={user._id} className='bg-transparent p-0 **:data-[slot=accordion-content]:p-0!'>
        <AccordionTrigger className='items-center px-1 py-4 hover:no-underline'>
          <div className='flex items-center gap-2 md:gap-4'>
            <Avatar className='size-8 border'>
              <AvatarImage src={user.pictureUrl ?? undefined} alt='' />
              <AvatarFallback className='text-xs'>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className='inline-flex items-center gap-3'>
              <span className='font-okx font-medium text-foreground/80 text-lg'>{displayName}</span>
              <div className='flex shrink-0 items-center gap-2 uppercase'>
                <Badge variant={claims.admin === true ? 'info-light' : 'outline'} size='lg'>
                  {claims.admin === true ? 'Admin' : 'User'}
                </Badge>
                {claims.staff === true ? (
                  <Badge variant='info-light' size='lg'>
                    Staff
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='rounded-none bg-transparent md:pb-4 md:pl-11 md:pr-4'>
          <UserClaimCard claims={claims} user={user} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function UserClaimCard({ claims, user }: UserWithClaims) {
  const hasAdminClaim = claims.admin === true
  const hasStaffClaim = claims.staff === true

  return (
    <Card className='rounded-none md:rounded-lg py-1'>
      <CardContent className='space-y-5 px-2 md:px-4'>
        <div className='space-y-2'>
          <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Custom claims</p>
          <ClaimBadges claims={claims} />
        </div>

        <div className='grid gap-3 md:grid-cols-[auto_1fr] md:items-end'>
          <div className='flex flex-wrap gap-2'>
            <form action={hasAdminClaim ? removeCustomClaim : grantAdminClaim}>
              <input type='hidden' name='uid' value={user.subject} />
              {hasAdminClaim ? <input type='hidden' name='claimKey' value='admin' /> : null}
              <Button type='submit' size='sm' variant={hasAdminClaim ? 'destructive' : 'default'}>
                {hasAdminClaim ? 'Remove admin' : 'Grant admin'}
              </Button>
            </form>
            <form action={hasStaffClaim ? removeCustomClaim : setCustomClaim}>
              <input type='hidden' name='uid' value={user.subject} />
              <input type='hidden' name='claimKey' value='staff' />
              {hasStaffClaim ? null : <input type='hidden' name='claimValue' value='true' />}
              <Button type='submit' size='sm' variant={hasStaffClaim ? 'destructive' : 'outline'}>
                {hasStaffClaim ? 'Remove staff' : 'Grant staff'}
              </Button>
            </form>
          </div>

          <form action={setCustomClaim} className='grid gap-2 sm:grid-cols-[minmax(120px,0.4fr)_1fr_auto]'>
            <input type='hidden' name='uid' value={user.subject} />
            <Input name='claimKey' placeholder='claim key' aria-label='Claim key' className='h-9' />
            <Input name='claimValue' placeholder='true, false, \"staff\", 1' aria-label='Claim value' className='h-9' />
            <Button type='submit' size='sm' variant='outline'>
              Set claim
            </Button>
          </form>
        </div>

        {Object.keys(claims).length ? (
          <div className='space-y-2'>
            <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Remove claim</p>
            <div className='flex flex-wrap gap-2'>
              {Object.keys(claims).map((claimKey) => (
                <form key={claimKey} action={removeCustomClaim}>
                  <input type='hidden' name='uid' value={user.subject} />
                  <input type='hidden' name='claimKey' value={claimKey} />
                  <Button
                    type='submit'
                    size='sm'
                    variant='ghost'
                    className='h-8 text-destructive hover:bg-destructive/10'>
                    <Icon name='close' className='size-3.5' />
                    {claimKey}
                  </Button>
                </form>
              ))}
            </div>
          </div>
        ) : null}

        <div className='grid md:gap-2 md:border-t border-border/70 md:pt-4 text-xs text-muted-foreground sm:grid-cols-2'>
          <p>Provider: {user.nickname ?? 'Unknown'}</p>
          <p className='md:text-right'>Updated: {dateFormatter.format(user.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ClaimBadges({ claims }: { claims: Record<string, unknown> }) {
  const entries = Object.entries(claims)

  if (!entries.length) {
    return <span className='text-sm text-muted-foreground'>No custom claims</span>
  }

  return (
    <div className='flex flex-wrap gap-1.5'>
      {entries.map(([key, value]) => (
        <Badge key={key} variant={key === 'admin' && value === true ? 'success-light' : 'outline'} size='lg'>
          {key}: {JSON.stringify(value)}
        </Badge>
      ))}
    </div>
  )
}

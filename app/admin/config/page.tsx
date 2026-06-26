import { Badge } from '@/components/reui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { getFirebaseUserByUid } from '@/lib/firebase/admin'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { fetchQuery } from 'convex/nextjs'
import { Metadata } from 'next'
import Link from 'next/link'
import { grantAdminClaim, removeCustomClaim, setCustomClaim } from './actions'

export const metadata: Metadata = {
  title: 'Admin Config',
  description: 'Manage Foreplay admin configuration and Firebase custom claims.',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/favicon-32x32.svg'
    }
  ]
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>
type User = Doc<'users'>

interface PageProps {
  searchParams: SearchParams
}

type UserWithClaims = {
  claims: Record<string, unknown>
  user: User
}

const getSearchValue = (value: string | string[] | undefined) => {
  return typeof value === 'string' ? value.trim() : ''
}

const getUserSearchText = (user: User) => {
  return [user.email, user.name, user.preferredUsername, user.phone, user.subject, user.tokenIdentifier]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function filterUsers(users: User[], query: string) {
  if (!query) {
    return users.toSorted((left, right) => right.updatedAt - left.updatedAt).slice(0, 12)
  }

  const normalizedQuery = query.toLowerCase()

  return users
    .filter((user) => getUserSearchText(user).includes(normalizedQuery))
    .toSorted((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 24)
}

async function attachFirebaseClaims(users: User[]): Promise<UserWithClaims[]> {
  const results = await Promise.all(
    users.map(async (user) => {
      try {
        const firebaseUser = await getFirebaseUserByUid(user.subject)
        return {
          user,
          claims: firebaseUser.customClaims ?? {}
        }
      } catch {
        return {
          user,
          claims: {}
        }
      }
    })
  )

  return results
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value)
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

function UserClaimCard({ claims, user }: UserWithClaims) {
  const hasAdminClaim = claims.admin === true
  const hasStaffClaim = claims.staff === true

  return (
    <Card className='border-border/70'>
      <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 space-y-1'>
          <CardTitle className='truncate text-lg'>{user.name ?? user.email ?? user.subject}</CardTitle>
          <p className='text-sm text-muted-foreground'>{user.email ?? 'No email'}</p>
          <p className='font-mono text-xs text-muted-foreground'>{user.subject}</p>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <Badge variant={hasAdminClaim ? 'success-light' : 'outline'} size='lg'>
            {hasAdminClaim ? 'Admin' : 'User'}
          </Badge>
          {hasStaffClaim ? (
            <Badge variant='info-light' size='lg'>
              Staff
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className='space-y-5'>
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

        <div className='grid gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:grid-cols-2'>
          <p>Provider: {user.nickname ?? 'Unknown'}</p>
          <p>Updated: {formatDate(user.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function Page({ searchParams }: PageProps) {
  await requireAdminSession()

  const query = getSearchValue((await searchParams).q)
  const users = await fetchQuery(api.users.q.listUsers)
  const matchingUsers = filterUsers(users, query)
  const usersWithClaims = await attachFirebaseClaims(matchingUsers)

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-2'>
          <Link
            href='/admin'
            className='inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'>
            <Icon name='arrow-left' className='size-4' />
            Back
          </Link>
          <div>
            <p className='font-ios text-xs uppercase tracking-widest text-sky-600'>Admin Settings</p>
            <h1 className='font-okx font-bold text-xl md:text-2xl'>Custom Claims</h1>
          </div>
        </div>
        <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')} href='/admin'>
          Events
          <Icon name='chevron-right' className='size-4' />
        </Link>
      </div>

      <form className='grid gap-3 sm:grid-cols-[1fr_auto]'>
        <Input
          type='search'
          name='q'
          defaultValue={query}
          placeholder='Search by email, name, phone, or Firebase uid'
          className='h-11'
        />
        <Button type='submit' className='h-11'>
          Search users
        </Button>
      </form>

      <div className='grid gap-4'>
        {usersWithClaims.length ? (
          usersWithClaims.map((item) => <UserClaimCard key={item.user._id} {...item} />)
        ) : (
          <Card className='border-border/70'>
            <CardContent className='flex min-h-40 items-center justify-center text-center text-sm text-muted-foreground'>
              No users matched your search.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

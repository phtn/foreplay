import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { getFirebaseUserByUid } from '@/lib/firebase/admin'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Icon } from '@/lib/icons'
import { fetchQuery } from 'convex/nextjs'
import { StaffList } from './staff-list'

type User = Doc<'users'>

type UserWithClaims = {
  claims: Record<string, unknown>
  user: User
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

export const StaffContent = async () => {
  await requireAdminSession()

  const query = ''
  const users = await fetchQuery(api.users.q.listUsers)
  const matchingUsers = filterUsers(users, query)
  const usersWithClaims = await attachFirebaseClaims(matchingUsers)

  return (
    <div className='space-y-4'>
      <form className='grid gap-2 md:gap-3 px-2 grid-cols-[1fr_auto]'>
        <Input
          type='search'
          name='q'
          defaultValue={query}
          placeholder='Search by email, name, phone, or user ID'
          className='h-11'
        />
        <Button type='submit' className='h-11 ' variant='secondary'>
          <span className='hidden md:flex'>Search users</span>
          <Icon name='search' className='size-4 md:hidden' />
        </Button>
      </form>

      <StaffList data={usersWithClaims} />

      {/*<div className='grid gap-4'>
        {usersWithClaims.length ? (
          usersWithClaims.map((item) => <UserClaimCard key={item.user._id} {...item} />)
        ) : (
          <Card className='border-border/70'>
            <CardContent className='flex min-h-40 items-center justify-center text-center text-sm text-muted-foreground'>
              No users matched your search.
            </CardContent>
          </Card>
        )}
      </div>*/}
    </div>
  )
}

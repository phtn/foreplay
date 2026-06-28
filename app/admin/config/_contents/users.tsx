import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchQuery } from 'convex/nextjs'

type User = Doc<'users'>

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

const displayName = (user: User) => user.name ?? user.preferredUsername ?? user.email ?? user.subject

export const UsersContent = async () => {
  await requireAdminSession()

  const users = (await fetchQuery(api.users.q.listUsers)).toSorted((left, right) => right.updatedAt - left.updatedAt)

  return (
    <section className='rounded-lg border border-border/70 bg-card'>
      <div className='border-b border-border/70 p-4 sm:p-5'>
        <p className='font-ios text-xs uppercase tracking-widest text-sky-500'>Users</p>
        <h2 className='mt-1 font-okx text-xl font-semibold'>All users</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead className='text-right'>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>
                <div className='min-w-56'>
                  <p className='font-medium text-foreground'>{displayName(user)}</p>
                  <p className='mt-1 font-mono text-xs text-muted-foreground'>{user.subject}</p>
                </div>
              </TableCell>
              <TableCell>{user.email ?? 'N/A'}</TableCell>
              <TableCell>{user.phone ?? 'N/A'}</TableCell>
              <TableCell>{user.nickname ?? user.issuer}</TableCell>
              <TableCell className='text-right'>{dateFormatter.format(user.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

import { Badge } from '@/components/reui/badge'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { grantAdminClaim, removeCustomClaim, setCustomClaim } from '../actions'

// const users = [

//   {
//     id: '1',
//     name: 'Alex Johnson',
//     email: 'alex@apple.com',
//     role: 'Admin',
//     avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80',
//     initials: 'AJ',
//     content:
//       'Alex has full administrative access to the platform, including billing management, user provisioning, and security configurations.'
//   },
//   {
//     id: '2',
//     name: 'Sarah Chen',
//     email: 'sarah@openai.com',
//     role: 'Viewer',
//     avatar: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80',
//     initials: 'SC',
//     content: 'Sarah has read-only access to projects and reports. She cannot modify settings or invite new members.'
//   },
//   {
//     id: '3',
//     name: 'Michael Rodriguez',
//     email: 'michael@meta.com',
//     role: 'Editor',
//     avatar: 'https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80',
//     initials: 'MR',
//     content:
//       'Michael is part of the design team and has permissions to edit projects, manage assets, and update design system components.'
//   }
// ]

type UserWithClaims = {
  claims: Record<string, unknown>
  user: Doc<'users'>
}
interface StaffListProps {
  data: UserWithClaims[] | undefined
}
function formatDate(value: number) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value)
}
export function StaffList({ data }: StaffListProps) {
  return (
    <div className='mb-auto w-full'>
      {data?.map(({ user, claims }) => (
        <Accordion key={user._id} multiple={false} defaultValue={['1']} className='border-none'>
          <AccordionItem value={user._id} className='bg-transparent p-0 **:data-[slot=accordion-content]:p-0!'>
            <AccordionTrigger className='items-center px-1 py-4 hover:no-underline'>
              <div className='flex items-center gap-2 md:gap-4'>
                <Avatar className='size-8 border'>
                  <AvatarImage src={user.pictureUrl ?? undefined} alt={user.name ?? 'staff-name'} />
                  <AvatarFallback className='text-xs'>{user.name}</AvatarFallback>
                </Avatar>
                <div className='inline-flex items-center gap-3'>
                  <span className='font-okx font-medium text-foreground/80 text-lg'>{user.name}</span>
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
      ))}
    </div>
  )
}

function UserClaimCard({ claims, user }: UserWithClaims) {
  const hasAdminClaim = claims.admin === true
  const hasStaffClaim = claims.staff === true

  return (
    <Card className='rounded-none md:rounded-lg py-1'>
      {/*<CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 space-y-1'>
          <CardTitle className='truncate text-lg flex items-center space-x-2'>
            <span>{user.name ?? user.email ?? user.subject}</span>
            <div className='flex shrink-0 items-center gap-2 uppercase'>
              <Badge variant={hasAdminClaim ? 'info-light' : 'outline'} size='lg'>
                {hasAdminClaim ? 'Admin' : 'User'}
              </Badge>
              {hasStaffClaim ? (
                <Badge variant='info-light' size='lg'>
                  Staff
                </Badge>
              ) : null}
            </div>
          </CardTitle>
          <p className='text-sm text-muted-foreground'>{user.email ?? 'No email'}</p>
          <p className='font-mono text-xs text-muted-foreground'>{user.subject}</p>
        </div>
      </CardHeader>*/}
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
          <p className='md:text-right'>Updated: {formatDate(user.updatedAt)}</p>
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

import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Icon } from '@/lib/icons'
import { grantAdminClaim, removeCustomClaim, setCustomClaim } from '../../actions'

interface AccessPanelProps {
  claims: Record<string, unknown>
  isCurrentAdmin: boolean
  uid: string
}

function formatClaimValue(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value) ?? String(value)
}

export function AccessPanel({ claims, isCurrentAdmin, uid }: AccessPanelProps) {
  const claimEntries = Object.entries(claims).toSorted(([left], [right]) => left.localeCompare(right))
  const hasAdminClaim = claims.admin === true
  const hasStaffClaim = claims.staff === true

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='border-b border-border/60 py-5'>
        <div className='flex items-start justify-between gap-4'>
          <div className='space-y-1'>
            <CardTitle className='font-okx text-base'>Access & Roles</CardTitle>
            <CardDescription>Firebase custom claims for this account.</CardDescription>
          </div>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300'>
            <Icon name='key' className='size-4' />
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-5 py-5'>
        <div className='space-y-2'>
          <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>Assigned roles</p>
          <div className='flex flex-wrap gap-1.5'>
            <Badge variant='outline' size='lg'>
              User
            </Badge>
            {hasStaffClaim ? (
              <Badge variant='info-light' size='lg'>
                Staff
              </Badge>
            ) : null}
            {hasAdminClaim ? (
              <Badge variant='success-light' size='lg'>
                Admin
              </Badge>
            ) : null}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <form action={hasAdminClaim ? removeCustomClaim : grantAdminClaim}>
            <input type='hidden' name='uid' value={uid} />
            {hasAdminClaim ? <input type='hidden' name='claimKey' value='admin' /> : null}
            <Button
              type='submit'
              variant={hasAdminClaim ? 'destructive' : 'outline'}
              size='sm'
              disabled={hasAdminClaim && isCurrentAdmin}
              title={hasAdminClaim && isCurrentAdmin ? 'You cannot remove your own admin access.' : undefined}
              className='w-full'>
              {hasAdminClaim && isCurrentAdmin ? 'Current admin' : hasAdminClaim ? 'Remove admin' : 'Grant admin'}
            </Button>
          </form>

          <form action={hasStaffClaim ? removeCustomClaim : setCustomClaim}>
            <input type='hidden' name='uid' value={uid} />
            <input type='hidden' name='claimKey' value='staff' />
            {hasStaffClaim ? null : <input type='hidden' name='claimValue' value='true' />}
            <Button type='submit' variant={hasStaffClaim ? 'destructive' : 'outline'} size='sm' className='w-full'>
              {hasStaffClaim ? 'Remove staff' : 'Grant staff'}
            </Button>
          </form>
        </div>

        <div className='border-t border-border/60 pt-5'>
          <form action={setCustomClaim} className='space-y-2'>
            <input type='hidden' name='uid' value={uid} />
            <div className='grid grid-cols-[0.8fr_1.2fr] gap-2'>
              <div>
                <label htmlFor='claim-key' className='sr-only'>
                  Claim key
                </label>
                <Input
                  id='claim-key'
                  name='claimKey'
                  placeholder='claim key'
                  required
                  className='h-9 font-mono text-xs'
                />
              </div>
              <div>
                <label htmlFor='claim-value' className='sr-only'>
                  Claim value
                </label>
                <Input
                  id='claim-value'
                  name='claimValue'
                  placeholder='true, false, or text'
                  required
                  className='h-9 font-mono text-xs'
                />
              </div>
            </div>
            <Button type='submit' variant='secondary' size='sm' className='w-full'>
              Set custom claim
            </Button>
          </form>
        </div>

        <div className='space-y-2 border-t border-border/60 pt-5'>
          <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>All claims</p>
          {claimEntries.length ? (
            <div className='divide-y divide-border/50 rounded-xl border border-border/60'>
              {claimEntries.map(([claimKey, claimValue]) => {
                const isProtectedClaim = claimKey === 'admin' && isCurrentAdmin

                return (
                  <div key={claimKey} className='flex min-w-0 items-center justify-between gap-3 px-3 py-2.5'>
                    <div className='min-w-0'>
                      <p className='truncate font-mono text-xs text-foreground'>{claimKey}</p>
                      <p className='truncate font-mono text-[10px] text-muted-foreground'>
                        {formatClaimValue(claimValue)}
                      </p>
                    </div>
                    {isProtectedClaim ? (
                      <Icon name='lock' className='size-3.5 shrink-0 text-muted-foreground' />
                    ) : (
                      <form action={removeCustomClaim}>
                        <input type='hidden' name='uid' value={uid} />
                        <input type='hidden' name='claimKey' value={claimKey} />
                        <Button
                          type='submit'
                          variant='ghost'
                          size='icon-xs'
                          aria-label={`Remove ${claimKey} claim`}
                          className='rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive'>
                          <Icon name='close' className='size-3.5' />
                        </Button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className='rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground'>
              No custom claims assigned.
            </p>
          )}
        </div>

        <p className='text-xs leading-5 text-muted-foreground'>
          Role changes apply after the user refreshes their authentication token.
        </p>
      </CardContent>
    </Card>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { signOutUser } from '@/lib/firebase/auth'
import { clearFirebaseSession } from '@/lib/firebase/session'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SignOutButtonProps {
  label?: string
  withLabel?: boolean
}
export function SignOutButton({ label, withLabel = false }: SignOutButtonProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setSignOutError(null)
    setIsSigningOut(true)

    try {
      await clearFirebaseSession()
      await signOutUser()
      router.replace('/auth')
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out right now.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className='flex w-full'>
      <Button
        type='button'
        disabled={isSigningOut}
        onClick={handleSignOut}
        className={cn(
          'flex items-center justify-center rounded-none p-0 bg-transparent text-foreground/80 dark:bg-transparent hover:bg-transparent!',
          {
            'w-full space-x-2 justify-start hover:bg-background': withLabel
          }
        )}>
        <Icon name='logout' className='size-5' />
        {withLabel && <p className='capitalize'>{label ?? 'Sign out'}</p>}
      </Button>
      {signOutError ? (
        <p className='max-w-sm font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff7d33]'>{signOutError}</p>
      ) : null}
    </div>
  )
}

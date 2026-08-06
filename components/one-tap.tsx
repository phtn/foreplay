'use client'

import { useFirebaseUser } from '@/lib/firebase/auth'
import { auth } from '@/lib/firebase/config'
import { Icon } from '@/lib/icons'
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Topbar } from './layouts/topbar'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
            use_fedcm_for_prompt?: boolean
          }) => void
          prompt: (notification?: () => void) => void
          disableAutoSelect: () => void
        }
      }
    }
    toggleGoogleOneTap?: (enabled: boolean) => void
  }
}

const ONE_TAP_STORAGE_KEY = 'google_one_tap_enabled'

export const GoogleOneTap = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading, sessionUser, user } = useFirebaseUser()
  const isAuthenticated = Boolean(sessionUser || user)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [showFallbackButton, setShowFallbackButton] = useState(false)
  const [isOneTapEnabled, setIsOneTapEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(ONE_TAP_STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })
  const oneTapInitializedRef = useRef(false)
  const promptAttemptedRef = useRef(false)

  const navigateHome = useCallback(() => {
    if (pathname !== '/') {
      router.replace('/')
    }
  }, [pathname, router])

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined' || scriptLoaded) {
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      // Defer state update to avoid synchronous setState in effect
      queueMicrotask(() => {
        setScriptLoaded(true)
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      setScriptLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script')
    }
    document.head.appendChild(script)
  }, [scriptLoaded])

  // Toggle One-Tap enabled state
  const toggleOneTap = useCallback((enabled: boolean) => {
    setIsOneTapEnabled(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONE_TAP_STORAGE_KEY, String(enabled))
    }

    // If disabling and One-Tap is already initialized, disable it
    if (!enabled && oneTapInitializedRef.current && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect()
        oneTapInitializedRef.current = false
        console.log('Google One-Tap disabled')
      } catch (error) {
        console.error('Error disabling One-Tap:', error)
      }
    }
  }, [])

  // Expose toggle function to window for easy access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as { toggleGoogleOneTap?: (enabled: boolean) => void }).toggleGoogleOneTap = toggleOneTap
      return () => {
        delete (window as { toggleGoogleOneTap?: (enabled: boolean) => void }).toggleGoogleOneTap
      }
    }
  }, [toggleOneTap])

  // Initialize and show Google One Tap
  const initializeOneTap = useCallback(() => {
    const firebaseAuth = auth

    if (
      typeof window === 'undefined' ||
      !window.google?.accounts?.id ||
      oneTapInitializedRef.current ||
      isAuthenticated ||
      !firebaseAuth ||
      !isOneTapEnabled
    ) {
      return
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      console.error(
        'Google Client ID not found. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.\n' +
          'You can find your OAuth 2.0 Client ID in Firebase Console > Project Settings > General > Your apps > Web app config,\n' +
          'or in Google Cloud Console > APIs & Services > Credentials.'
      )
      return
    }

    // Verify the client ID format (should be a long string ending in .apps.googleusercontent.com)
    if (!clientId.includes('.apps.googleusercontent.com')) {
      console.warn('Google Client ID format may be incorrect. Expected format: xxxxxx.apps.googleusercontent.com')
    }

    // Check if we're on localhost - FedCM may not work well on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    // Try with FedCM first, but allow fallback
    const tryInitialize = (useFedCM: boolean) => {
      if (!window.google?.accounts?.id) {
        console.error('Google Identity Services not available')
        return
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            try {
              console.log('Google One Tap credential received', {
                credentialLength: response.credential?.length,
                hasCredential: !!response.credential,
                useFedCM
              })

              if (!response.credential) {
                console.error('No credential in response')
                return
              }

              const credential = GoogleAuthProvider.credential(response.credential)

              if (!credential) {
                console.error('Failed to create Firebase creds from Google credential')
                return
              }

              console.log('Signing in with Firebase...')
              const result = await signInWithCredential(firebaseAuth, credential)
              console.log('Successfully signed in with Google One Tap:', {
                email: result.user.email,
                uid: result.user.uid,
                displayName: result.user.displayName
              })
              navigateHome()
              // Authentication state will be updated by useFirebaseUser.
            } catch (error) {
              console.error('Error signing in with Google One Tap:', error)
              if (error instanceof Error) {
                console.error('Error details:', {
                  message: error.message,
                  name: error.name,
                  stack: error.stack
                })
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          ...(useFedCM ? { use_fedcm_for_prompt: true } : {})
        })

        oneTapInitializedRef.current = true
        console.log('Google One Tap initialized successfully', {
          clientId: clientId.substring(0, 20) + '...',
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          useFedCM
        })

        // Show the One Tap prompt
        try {
          window.google.accounts.id.prompt()
          console.log('One Tap prompt() called', { useFedCM })

          // Set a timeout to check if prompt appeared (for debugging)
          setTimeout(() => {
            const oneTapElements = document.querySelectorAll(
              '[id*="google-one-tap"], [class*="google-one-tap"], iframe[src*="accounts.google.com"]'
            )
            console.log('One Tap elements found:', oneTapElements.length, {
              elements: Array.from(oneTapElements).map((el) => ({
                id: el.id,
                className: el.className,
                tagName: el.tagName
              }))
            })

            // If no elements found and we're on localhost, show fallback button
            if (oneTapElements.length === 0 && isLocalhost && !promptAttemptedRef.current) {
              console.log('One Tap not appearing on localhost, showing fallback button')
              setShowFallbackButton(true)
            }
          }, 3000)

          promptAttemptedRef.current = true
        } catch (promptError) {
          console.error('Error calling prompt():', promptError)
          if (useFedCM && isLocalhost) {
            console.warn('FedCM prompt failed on localhost, this is expected. One Tap may not appear.')
          }
        }
      } catch (error) {
        console.error('Error initializing Google One Tap:', error)
        if (error instanceof Error) {
          console.error('Initialization error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          })
        }
        oneTapInitializedRef.current = false // Reset so we can try again
      }
    }

    // On localhost, try without FedCM first as it's more reliable
    if (isLocalhost) {
      console.log('Detected localhost - initializing without FedCM for better compatibility')
      tryInitialize(false)

      // On localhost, show fallback button after a short delay since One Tap often doesn't work
      setTimeout(() => {
        if (!isAuthenticated && !showFallbackButton) {
          console.log('Showing fallback button for localhost')
          setShowFallbackButton(true)
        }
      }, 2000)
    } else {
      // On production, use FedCM
      tryInitialize(true)
    }
  }, [isAuthenticated, showFallbackButton, isOneTapEnabled, navigateHome])

  // Initialize One Tap when script is loaded and user is not authenticated
  useEffect(() => {
    if (scriptLoaded && !isAuthenticated && !isLoading && !oneTapInitializedRef.current && isOneTapEnabled) {
      // Small delay to ensure DOM is ready and Google script is fully loaded
      const timer = setTimeout(() => {
        if (window.google?.accounts?.id) {
          console.log('Initializing One Tap...', {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            hasGoogleScript: !!window.google,
            hasAccountsId: !!window.google?.accounts?.id,
            isOneTapEnabled
          })
          initializeOneTap()
        } else {
          console.warn('Google Identity Services not fully loaded yet', {
            hasGoogle: !!window.google,
            hasAccounts: !!window.google?.accounts,
            hasId: !!window.google?.accounts?.id
          })
        }
      }, 500) // Increased delay to ensure script is fully ready

      return () => {
        clearTimeout(timer)
      }
    }
  }, [scriptLoaded, isAuthenticated, isLoading, initializeOneTap, isOneTapEnabled])

  // Fallback sign-in handler using popup
  const handleSignInWithPopup = useCallback(async () => {
    if (!auth) {
      console.error('Firebase Auth is not configured')
      return
    }

    if (!window.google?.accounts?.id) {
      console.error('Google Identity Services not available')
      return
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('Google Client ID not found')
      return
    }

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      console.log('Initiating Google sign-in popup...')
      const result = await signInWithPopup(auth, provider)
      console.log('Successfully signed in with Google:', {
        email: result.user.email,
        uid: result.user.uid,
        displayName: result.user.displayName
      })
      navigateHome()
    } catch (error) {
      console.error('Error signing in with Google popup:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          code: (error as { code?: string }).code
        })
      }
    }
  }, [navigateHome])

  // Show fallback button on localhost if One Tap doesn't appear
  if (showFallbackButton && !isAuthenticated) {
    return (
      <button
        onClick={handleSignInWithPopup}
        className='flex min-w-21 cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 transition-all text-white text-sm font-okxs font-medium leading-normal disabled:opacity-50 bg-foreground dark:bg-white dark:text-[#4285F4] hover:bg-foreground/80'
        type='button'>
        <span className='truncate flex items-center gap-2'>
          <Icon name='goog' className='size-4' />
          Sign in with Google
        </span>
      </button>
    )
  }
  // Show user info and sign out button when authenticated
  // if (user) {
  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth)
  //     console.log('User signed out successfully')
  //   } catch (error) {
  //     console.error('Error signing out:', error)
  //   }
  // }

  // return <UserMenu user={user} hasAdminClaim={hasAdminClaim} />
  // }

  // Don't render anything visible - One Tap appears as an overlay
  // But show a small indicator in development mode
  if (process.env.NODE_ENV === 'development' && !isAuthenticated) {
    return (
      <div className='flex items-center gap-2 text-xs text-slate-500'>
        <span>One-Tap: {isOneTapEnabled ? 'ON' : 'OFF'}</span>
        <button
          onClick={() => toggleOneTap(!isOneTapEnabled)}
          className='px-2 py-1 text-xs border rounded hover:bg-slate-100 dark:hover:bg-slate-800'
          type='button'
          title='Toggle Google One-Tap (also available via window.toggleGoogleOneTap(true/false))'>
          {isOneTapEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    )
  }

  return null
}

export function TopbarWithGoogleOneTap() {
  return (
    <>
      <Topbar />
      <GoogleOneTap />
    </>
  )
}

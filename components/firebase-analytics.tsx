'use client'

import { firebaseApp, isFirebaseAnalyticsConfigured } from '@/lib/firebase/config'
import { useEffect } from 'react'

export function FirebaseAnalytics() {
  useEffect(() => {
    const app = firebaseApp

    if (!app || !isFirebaseAnalyticsConfigured) {
      if (process.env.NODE_ENV === 'development' && app) {
        console.warn('Firebase Analytics is disabled because NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is missing.')
      }
      return
    }

    let cancelled = false

    void import('firebase/analytics')
      .then(async ({ getAnalytics, isSupported }) => {
        const supported = await isSupported()

        if (!cancelled && supported) {
          getAnalytics(app)
        }
      })
      .catch((error: unknown) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Firebase Analytics could not be initialized.', error)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return null
}

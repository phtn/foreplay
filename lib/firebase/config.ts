import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

const requiredFirebaseFields = ['apiKey', 'authDomain', 'projectId', 'appId'] as const

export const isFirebaseConfigured = requiredFirebaseFields.every((field) => Boolean(firebaseConfig[field]))
export const isFirebaseAnalyticsConfigured = Boolean(firebaseConfig.measurementId)

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const missingFields = requiredFirebaseFields.filter((field) => !firebaseConfig[field])
  if (missingFields.length > 0) {
    console.warn(`Firebase config missing required fields: ${missingFields.join(', ')}`)
  }
}

export const firebaseApp = isFirebaseConfigured ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null

export const auth = firebaseApp ? getAuth(firebaseApp) : null

'use client'
import { useRouter } from 'next/navigation'

export default function Default() {
  const router = useRouter()
  router.replace('/auth/login')
  return null
}

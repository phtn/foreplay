'use client'

import { useEffect, useState } from 'react'

function formatCountdown(targetAt: string, now: number) {
  const diff = Math.max(0, new Date(targetAt).getTime() - now)
  const totalSeconds = Math.floor(diff / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    label: `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`,
    isLive: diff === 0
  }
}

export function TeeTimeCountdown({ targetAt }: { targetAt: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const countdown = formatCountdown(targetAt, now)

  return (
    <span aria-live='polite' aria-atomic='true'>
      {countdown.isLive ? 'Live now' : countdown.label}
    </span>
  )
}

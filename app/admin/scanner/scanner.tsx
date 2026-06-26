'use client'

import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { checkInGatePass } from './actions'

type BarcodeDetectorResult = {
  rawValue: string
}

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>
}

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance

type CheckInResult = Awaited<ReturnType<typeof checkInGatePass>>

type GateScannerProps = {
  operator: string
}

const getBarcodeDetector = () => {
  return (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
}

function ResultPanel({ result }: { result: CheckInResult | null }) {
  if (!result) {
    return (
      <div className='flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 p-5 text-center text-sm text-muted-foreground'>
        Scan a player gate pass to check them in.
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        result.alreadyCheckedIn
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
      )}>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='font-ios text-xs uppercase tracking-widest'>
            {result.alreadyCheckedIn ? 'Already checked in' : 'Checked in'}
          </p>
          <p className='font-okx text-xl font-semibold'>{result.playerName}</p>
          <p className='text-sm opacity-80'>{result.playerEmail ?? 'No email'}</p>
        </div>
        <Icon name={result.alreadyCheckedIn ? 'alert-triangle' : 'check'} className='size-6' />
      </div>
      <div className='mt-4 grid gap-2 text-xs opacity-80 sm:grid-cols-2'>
        <p className='font-mono'>Registration: {result.registrationId}</p>
        <p className='font-mono'>Tournament: {result.tournamentId}</p>
      </div>
    </div>
  )
}

export function GateScanner({ operator }: GateScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const checkingRef = useRef(false)
  const lastPayloadRef = useRef('')
  const lastPayloadAtRef = useRef(0)
  const [active, setActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [manualPayload, setManualPayload] = useState('')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const stopScanner = useCallback(() => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setActive(false)
  }, [])

  const handlePayload = useCallback(async (payload: string) => {
    const normalizedPayload = payload.trim()

    if (!normalizedPayload || checkingRef.current) {
      return
    }

    const now = Date.now()

    if (lastPayloadRef.current === normalizedPayload && now - lastPayloadAtRef.current < 2500) {
      return
    }

    checkingRef.current = true
    lastPayloadRef.current = normalizedPayload
    lastPayloadAtRef.current = now
    setIsChecking(true)
    setErrorMessage(null)

    try {
      const nextResult = await checkInGatePass(normalizedPayload)
      setResult(nextResult)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to check in this gate pass.')
    } finally {
      checkingRef.current = false
      setIsChecking(false)
    }
  }, [])

  const startScanner = useCallback(async () => {
    setErrorMessage(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Camera access is not available in this browser.')
      return
    }

    if (!getBarcodeDetector()) {
      setErrorMessage('QR scanning is not supported in this browser. Use manual payload entry below.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setActive(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to start the camera.')
    }
  }, [])

  useEffect(() => {
    if (!active) {
      return
    }

    let cancelled = false
    const BarcodeDetector = getBarcodeDetector()

    if (!BarcodeDetector) {
      return
    }

    const detector = new BarcodeDetector({ formats: ['qr_code'] })

    const scanFrame = async () => {
      const video = videoRef.current

      if (cancelled || !video) {
        return
      }

      try {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          const codes = await detector.detect(video)
          const payload = codes[0]?.rawValue

          if (payload) {
            void handlePayload(payload)
          }
        }
      } catch {
        // Ignore single-frame decode errors and keep scanning.
      }

      if (!cancelled) {
        frameRef.current = window.requestAnimationFrame(scanFrame)
      }
    }

    frameRef.current = window.requestAnimationFrame(scanFrame)

    return () => {
      cancelled = true

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [active, handlePayload])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-2 px-3 pb-5 md:px-0'>
      <div className='hidden _flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <Badge variant='outline' size='lg'>
          {operator}
        </Badge>
      </div>

      <Card className='border-border/70 p-0'>
        <CardHeader className='border-b border-border/70 h-12 pt-4 pb-0'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-bg'>Scan Tickets</CardTitle>
            <Badge variant={active ? 'success-light' : 'outline'} size='lg'>
              {active ? 'Camera ON' : 'Camera OFF'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-4 px-4'>
          <div className='overflow-hidden rounded-xl border border-border/70 bg-black'>
            <video ref={videoRef} playsInline muted className='aspect-3/4 w-full object-cover sm:aspect-video' />
          </div>

          <div className='grid gap-2 sm:grid-cols-2'>
            <Button
              type='button'
              size='xl'
              onClick={active ? stopScanner : startScanner}
              className='bg-pink-500 text-white text-base'>
              <Icon name={active ? 'close' : 'ticket'} className='size-4' />
              {active ? 'Stop scanner' : 'Start scanner'}
            </Button>
            <Button
              size='xl'
              type='button'
              variant='outline'
              disabled={isChecking || !manualPayload.trim()}
              className='text-base'
              onClick={() => {
                void handlePayload(manualPayload)
              }}>
              <Icon name={isChecking ? 'spinner-ring' : 'check'} className='size-4' />
              Check manual payload
            </Button>
          </div>

          {errorMessage ? (
            <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
              {errorMessage}
            </div>
          ) : null}

          <ResultPanel result={result} />

          <div className='space-y-2'>
            <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Manual fallback</p>
            <Input
              value={manualPayload}
              onChange={(event) => setManualPayload(event.currentTarget.value)}
              placeholder='Paste QR payload'
            />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

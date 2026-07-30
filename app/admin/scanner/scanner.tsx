'use client'

import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import { onError, onInfo, onSuccess } from '@/ctx/toast'
import { Icon } from '@/lib/icons'
import {
  normalizeScanTicketTonesConfig,
  playToneSetEvent,
  preloadTonePlayback,
  prepareTonePlayback,
  type ScanTicketToneKey
} from '@/lib/tones'
import { cn } from '@/lib/utils'
import { useQuery } from 'convex/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

interface ResultPanelProps {
  result: CheckInResult | null
  testing?: boolean
}

const TestingResult = () => {
  const bool = true
  return (
    <div
      className={cn(
        'absolute w-full bottom-0 rounded-xs border p-5 h-28 overflow-hidden',
        bool
          ? 'border-orange-400/40 bg-orange-400/10 text-orange-300 dark:text-orange-200'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50'
      )}>
      <div className='absolute size-96 bg-[url("/som-optimized.svg")] bg-cover opacity-5 invert -top-20 md:top-0 scale-100 md:scale-300' />
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1.5'>
          <p className='flex items-center space-x-2 font-ios text-xs uppercase tracking-widest'>
            <Icon name={bool ? 'code-scanner' : 'chevrons-right'} className={cn('size-4', { 'size-3': bool })} />
            <span>{bool ? 'TESTING IN PROGRESS' : 'Checked in'}</span>
            <span>&middot;</span>
            <span>date</span>
            <span>&middot;</span>
            <span>10 mins ago</span>
          </p>
          <p className={cn('font-okx text-xl font-semibold', { 'blur-xs': bool })}>Elon Musk</p>
          <p className={cn('text-sm opacity-80', { 'blur-xs': bool })}>elon@tesla.com</p>
        </div>
        <div className='flex flex-col items-center justify-between text-xs h-13 mt-6'>
          <div className='flex items-center justify-center relative'>
            <Icon name='verified-solid' className={cn('size-10 absolute', { '_text-slate-400 opacity-0': bool })} />
            <Icon
              name={bool ? 'clock' : 'verified'}
              className={cn('size-10 absolute z-10 text-yellow-500', { 'text-orange-200/80 size-8!': bool })}
            />
          </div>
          <p className='font-okx text-base'>Seoul of Manila</p>
        </div>
      </div>
    </div>
  )
}
function ResultPanel({ result, testing = false }: ResultPanelProps) {
  if (testing) {
    return <TestingResult />
  }
  if (!result) {
    return (
      <div className='hidden _flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 p-5 text-center text-sm text-muted-foreground'>
        Scan a player gate pass to check them in.
      </div>
    )
  }

  return (
    <div
      className={cn(
        'absolute w-full bottom-0 rounded-xs border p-5 h-28 overflow-hidden',
        result.alreadyCheckedIn
          ? 'border-orange-400/40 bg-orange-400/10 text-orange-300 dark:text-orange-200'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50'
      )}>
      <div className='absolute size-96 bg-[url("/som-optimized.svg")] bg-cover opacity-5 invert -top-20 md:top-0 scale-100 md:scale-300' />
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1.5'>
          <p className='flex items-center space-x-1 font-ios text-xs uppercase tracking-widest'>
            <Icon
              name={result.alreadyCheckedIn ? 'qrcode' : 'chevrons-right'}
              className={cn('size-4', { 'size-3': result.alreadyCheckedIn })}
            />
            <span>{result.alreadyCheckedIn ? 'Already Checked-in' : 'Checked in'}</span>
          </p>
          <p className={cn('font-okx text-xl font-semibold', { 'blur-xs': result.alreadyCheckedIn })}>Elon Musk</p>
          <p className={cn('text-sm opacity-80', { 'blur-xs': result.alreadyCheckedIn })}>elon@tesla.com</p>
        </div>
        <div className='flex flex-col items-center justify-between text-xs h-13 mt-6'>
          <div className='flex items-center justify-center relative'>
            <Icon
              name='verified-solid'
              className={cn('size-10 absolute', { '_text-slate-400 opacity-0': result.alreadyCheckedIn })}
            />
            <Icon
              name={result.alreadyCheckedIn ? 'clock' : 'verified'}
              className={cn('size-10 absolute z-10 text-yellow-500', {
                'text-orange-200/80 size-8!': result.alreadyCheckedIn
              })}
            />
          </div>
          <p className='font-okx text-base'>Seoul of Manila</p>
        </div>
      </div>
    </div>
  )
}

export function GateScanner({ operator }: GateScannerProps) {
  const scanTicketTonesSetting = useQuery(api.admin.q.getScanTicketTonesConfig)
  const scanTicketTones = useMemo(
    () => normalizeScanTicketTonesConfig(scanTicketTonesSetting),
    [scanTicketTonesSetting]
  )
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

  const playScanTone = useCallback(
    (key: ScanTicketToneKey) => {
      void playToneSetEvent(scanTicketTones, key).catch(() => undefined)
    },
    [scanTicketTones]
  )

  const stopScanner = useCallback(() => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setActive(false)
  }, [])

  const handlePayload = useCallback(
    async (payload: string) => {
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
        playScanTone(nextResult.alreadyCheckedIn ? 'used' : 'good')

        if (nextResult.alreadyCheckedIn) {
          onInfo('Ticket Already Used')
          return
        }
        onSuccess('Scan Successful!')
      } catch (error) {
        setResult(null)
        playScanTone('invalid')
        onError('Invalid Ticket')
        setErrorMessage(error instanceof Error ? error.message : 'Unable to check in this gate pass.')
      } finally {
        checkingRef.current = false
        setIsChecking(false)
      }
    },
    [playScanTone]
  )

  const startScanner = useCallback(async () => {
    setErrorMessage(null)
    void prepareTonePlayback().catch(() => undefined)

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
    if (scanTicketTones.enabled) {
      void preloadTonePlayback().catch(() => undefined)
    }
  }, [scanTicketTones.enabled])

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
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-2 px-0 pb-5 md:px-0'>
      <div className='hidden _flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <Badge variant='outline' size='lg'>
          {operator}
        </Badge>
      </div>

      <Card className='rounded-none md:rounded-xs gap-0 p-0 pb-0 pt-0 ring-slate-400/80 dark:ring-background portrait:border-t portrait:border-slate-400/80'>
        <CardHeader className='relative rounded-none md:rounded-t-xs border-b border-slate-400/50 bg-slate-200 dark:bg-slate-400/80 h-11 pt-2 pb-0 px-2'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center font-okx'>
              <span
                className={cn(
                  'aspect-square rounded-full size-3.5 ml-2 mr-1 bg-slate-300 dark:bg-slate-500 shadow-inner',
                  {
                    'bg-green-500 dark:bg-green-400 border border-slate-400 dark:border-slate-600': active
                  }
                )}
              />

              <span className={cn('opacity-40 text-xs tracking-wide', { 'opacity-100': active })}>
                {active ? 'Ready' : ''}
              </span>
            </CardTitle>
            <div
              className={cn(
                'relative flex items-center justify-center font-ios text-xs w-full _bg-sky-200 h-7 overflow-hidden mx-1 md:mx-2',
                {
                  'text-emerald-600': result?.checkedIn,
                  'text-orange-600': result?.alreadyCheckedIn
                }
              )}>
              <div className='flex items-center space-x-2 md:space-x-3 absolute md:right-0 -right-2'>
                <div className='h-10 md:w-3 w-2 rounded-sm bg-slate-500 -skew-20 rotate-18 hidden md:flex'></div>
                <div className='h-10 md:w-3 w-2 rounded-sm md:bg-slate-500 bg-slate-400/80 -skew-20 rotate-18'></div>
                <div className='h-10 md:w-3 w-2 rounded-sm bg-slate-500 -skew-20 rotate-18'></div>
                <div className='h-10 md:w-3 w-2 rounded-sm bg-slate-500 -skew-20 rotate-18'></div>
                <div className='h-10 md:w-3 w-2 rounded-sm bg-slate-500 -skew-20 rotate-18'></div>
              </div>
              {result?.alreadyCheckedIn ? 'TICKET ALREADY SCANNED' : result?.checkedIn ? 'VALID TICKET SCANNED' : null}
            </div>
            <div className='min-w-16 grow-0 flex items-center justify-center'>
              <div
                className={cn(
                  'flex items-center space-x-1 h-7 bg-slate-500 px-1.5 rounded-sm border-2 border-slate-400 relative z-10',
                  { 'bg-foreground dark:bg-background': active }
                )}>
                <Icon
                  name={active ? 'camera' : 'camera-off-line'}
                  className={cn('size-4 text-white/80', { 'text-white size-4.5': active })}
                />
                <span className={cn('font-poly text-white text-sm leading-none mt-0.5', { ' text-green-500': active })}>
                  {active ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-0 p-0'>
          <div className='relative overflow-hidden rounded-none bg-black'>
            <video ref={videoRef} playsInline muted className='aspect-3/4 w-full object-cover sm:aspect-video' />
            <ResultPanel result={result} />
          </div>

          <div className='flex items-center space-x-4 w-full'>
            <Button
              type='button'
              size='2xl'
              onClick={active ? stopScanner : startScanner}
              className='bg-pink-500 hover:bg-pink-500/70 active:bg-pink-500/70 font-poly text-white text-base w-full rounded-xs border-none active:border-none transition-colors duration-300'>
              <Icon name={active ? 'chevron-double-left' : 'chevron-double-right'} className='size-5' />
              <span>{active ? 'Stop Scanner' : 'Start Scanner'}</span>
              <Icon name={active ? 'chevron-double-right' : 'chevron-double-left'} className='size-5' />
            </Button>
          </div>

          {errorMessage ? (
            <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
              {errorMessage}
            </div>
          ) : null}

          <div className='hidden space-y-2'>
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

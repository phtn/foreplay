'use client'

import { RegistrationTicketCard } from '@/components/tickets/registration-ticket-card'
import type { RegistrationTicketData } from '@/lib/tickets/registration-ticket'
import { renderElementAsPngBlob } from '@/lib/tickets/download-ticket-png'
import { useEffect, useRef } from 'react'

const EMAIL_TICKET_EXPORT_SCALE = 2
const EMAIL_TICKET_FALLBACK_SCALE = 1
const MAX_EMAIL_TICKET_BYTES = 3 * 1024 * 1024

export interface TicketEmailDeliveryResult {
  errorMessage: string | null
  failedCount: number
  sentCount: number
}

interface TicketEmailSenderProps {
  eventId: string
  onComplete: (result: TicketEmailDeliveryResult) => void
  subscriptionId: string
  tickets: RegistrationTicketData[]
}

const waitForTicketSurfaces = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to prepare the ticket image.'))
    reader.onload = () => {
      const result = reader.result

      if (typeof result !== 'string') {
        reject(new Error('Unable to prepare the ticket image.'))
        return
      }

      const separatorIndex = result.indexOf(',')
      if (separatorIndex < 0) {
        reject(new Error('Unable to prepare the ticket image.'))
        return
      }

      resolve(result.slice(separatorIndex + 1))
    }
    reader.readAsDataURL(blob)
  })

export function TicketEmailSender({ eventId, onComplete, subscriptionId, tickets }: TicketEmailSenderProps) {
  const ticketWrappersRef = useRef(new Map<string, HTMLDivElement>())

  useEffect(() => {
    let cancelled = false

    const sendTickets = async () => {
      await waitForTicketSurfaces()
      if (cancelled) return

      let sentCount = 0
      let failedCount = 0
      let errorMessage: string | null = null

      for (const ticket of tickets) {
        if (cancelled) return

        try {
          const wrapper = ticketWrappersRef.current.get(ticket.id)
          const ticketElement = wrapper?.querySelector<HTMLElement>('[data-ticket-export-root]')

          if (!ticketElement) {
            throw new Error(`Unable to render ${ticket.name}'s ticket.`)
          }

          let ticketPng = await renderElementAsPngBlob(ticketElement, EMAIL_TICKET_EXPORT_SCALE)
          if (ticketPng.size > MAX_EMAIL_TICKET_BYTES) {
            ticketPng = await renderElementAsPngBlob(ticketElement, EMAIL_TICKET_FALLBACK_SCALE)
          }
          if (ticketPng.size > MAX_EMAIL_TICKET_BYTES) {
            throw new Error(`${ticket.name}'s ticket image is too large to email.`)
          }
          const contentBase64 = await blobToBase64(ticketPng)
          const response = await fetch('/api/resend/tickets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contentBase64,
              eventId,
              registrationId: ticket.id,
              subscriptionId
            })
          })
          const result = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null

          if (!response.ok || !result?.ok) {
            throw new Error(result?.error ?? `Unable to email ${ticket.name}'s ticket.`)
          }

          sentCount += 1
        } catch (error) {
          failedCount += 1
          errorMessage ??= error instanceof Error ? error.message : 'One or more ticket emails could not be sent.'
        }
      }

      if (!cancelled) {
        onComplete({ errorMessage, failedCount, sentCount })
      }
    }

    void sendTickets()

    return () => {
      cancelled = true
    }
  }, [eventId, onComplete, subscriptionId, tickets])

  return (
    <div
      aria-hidden='true'
      inert
      className='pointer-events-none fixed left-[-20000px] top-0 z-[-1] w-[960px] bg-white'>
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          ref={(node) => {
            if (node) {
              ticketWrappersRef.current.set(ticket.id, node)
            } else {
              ticketWrappersRef.current.delete(ticket.id)
            }
          }}>
          <RegistrationTicketCard
            exportDisabled
            isActive
            registration={ticket}
            subscribeToCheckIn={false}
          />
        </div>
      ))}
    </div>
  )
}

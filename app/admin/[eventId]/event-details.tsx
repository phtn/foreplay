import { Badge } from '@/components/reui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import {
  formatCommission,
  formatEventDate,
  formatGateOpenTime,
  formatRegistrationFee,
  formatSlotsLabel,
  getPublicationLabel
} from '@/utils/formatters'

interface EventDetailsProps {
  event: Doc<'tournaments'>
}
export const EventDetails = ({ event }: EventDetailsProps) => {
  const publishedLabel = getPublicationLabel(event.published)
  const eventDateLabel = formatEventDate(event.gate_open_at, event.event_date)
  const gateOpenTimeLabel = formatGateOpenTime(event.gate_open_at)
  const slotsLabel = formatSlotsLabel(event.registered_slots, event.slots_limit)
  const sponsorshipTiers = event.sponsorship_tiers ?? []

  return (
    <div className='grid gap-5 lg:grid-cols-[1.1fr_0.9fr]'>
      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='text-xl'>Event setup</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-5 sm:grid-cols-2'>
          <DetailRow label='Public event ID' value={event.id ?? 'Missing'} />
          <DetailRow label='Document ID' value={event._id} />
          <DetailRow label='Venue' value={event.venue} />
          <DetailRow label='Event date' value={eventDateLabel} />
          <DetailRow label='Gate open' value={gateOpenTimeLabel} />
          <DetailRow label='Publication' value={publishedLabel} />
          <DetailRow label='Field size' value={slotsLabel} />
          <DetailRow label='Registered slots' value={String(event.registered_slots)} />
        </CardContent>
      </Card>

      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='text-xl'>Commercial</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-5 sm:grid-cols-2'>
          <DetailRow label='Entry fee' value={formatRegistrationFee(event.registration_fee)} />
          <DetailRow label='Commission' value={formatCommission(event.commission_type, event.commission_value)} />
          <DetailRow label='Sponsor phone' value={event.sponsor_contact_phone ?? 'Not provided'} />
          <DetailRow label='Sponsor email' value={event.sponsor_contact_email ?? 'Not provided'} />
          <DetailRow label='Primary color' value={event.ticket_primary_color ?? 'Not set'} />
          <DetailRow label='Secondary color' value={event.ticket_secondary_color ?? 'Not set'} />
        </CardContent>
      </Card>

      <Card className='border-border/70 lg:col-span-2'>
        <CardHeader>
          <CardTitle className='text-xl'>Sponsorship tiers</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {sponsorshipTiers.length ? (
            sponsorshipTiers.map((tier) => (
              <div key={tier.name} className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-okx text-sm text-foreground/85'>{tier.name}</p>
                    <p className='mt-1 text-xs text-muted-foreground'>{tier.playing_access}</p>
                  </div>
                  <Badge variant='secondary' size='lg' radius='full'>
                    {tier.investment_label}
                  </Badge>
                </div>

                {tier.access_note ? <p className='mt-3 text-sm text-muted-foreground'>{tier.access_note}</p> : null}

                <div className='mt-4 space-y-2'>
                  {tier.benefits.map((benefit) => (
                    <div key={benefit} className='flex items-start gap-2 text-sm text-foreground/80'>
                      <Icon name='check' className='mt-0.5 size-4 text-primary' />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>No sponsorship tiers configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1'>
      <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>{label}</p>
      <p className='font-okx text-sm text-foreground/85'>{value}</p>
    </div>
  )
}

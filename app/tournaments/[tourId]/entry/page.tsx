import { api } from '@/convex/_generated/api'
import ProtectedLayout from '@/ctx/protected'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseTokenIdentifier } from '@/lib/firebase/server-session'
import { fetchQuery } from 'convex/nextjs'
import { Metadata } from 'next'
import { Content } from './content'

export const metadata: Metadata = {
  title: 'New Entry',
  description: 'description',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/favicon-32x32.svg'
    }
  ]
}
const createFormId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10)

interface PageProps {
  params: Promise<{ tourId: string }>
}

const parsePesoAmount = (value: string) => {
  const amount = Number(value.replace(/[^\d.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

const Page = async ({ params }: PageProps) => {
  const [{ tourId }, session] = await Promise.all([params, getVerifiedFirebaseSession()])
  const tournamentPromise = fetchQuery(api.tournaments.q.getByTournamentId, { id: tourId })
  const userPromise = session
    ? fetchQuery(api.users.q.getUserByTokenId, {
        tokenIdentifier: buildFirebaseTokenIdentifier(session.decodedToken)
      })
    : Promise.resolve(null)

  const [tournament, users] = await Promise.all([tournamentPromise, userPromise])
  const user = users?.[0]
  const entryFee = tournament?.registration_fee ?? 0
  const sponsorPricingOptions =
    tournament?.sponsorship_tiers?.map((tier) => ({
      label: `${tier.name} - ${tier.investment_label} (${tier.playing_access})`,
      value: tier.name,
      amount: parsePesoAmount(tier.investment_label)
    })) ?? []
  const divisionOptions = sponsorPricingOptions.length
    ? sponsorPricingOptions
    : (tournament?.divisions ?? ['Pro']).map((division) => ({
        label: division,
        value: division,
        amount: entryFee
      }))
  const initialDivision = divisionOptions[0]?.value ?? 'Pro'

  return (
    <ProtectedLayout>
      <Content
        tourId={tourId}
        initialFormId={createFormId()}
        initialDivision={initialDivision}
        initialEmail={user?.email ?? session?.decodedToken.email ?? ''}
        initialPhone={user?.phone ?? session?.decodedToken.phone_number ?? ''}
        tournament={{
          title: tournament?.title ?? tourId,
          venue: tournament?.venue ?? 'Venue pending',
          gateOpenAt: tournament?.gate_open_at ?? null,
          entryFee: tournament?.registration_fee ?? 0,
          entryFeeLabel: `₱${entryFee.toLocaleString('en-US')}`,
          divisionOptions
        }}
      />
    </ProtectedLayout>
  )
}
export default Page

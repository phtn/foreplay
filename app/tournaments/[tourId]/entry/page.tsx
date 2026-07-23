import { api } from '@/convex/_generated/api'
import ProtectedLayout from '@/ctx/protected'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import {
  buildFirebaseSubscriptionUserIds,
  buildFirebaseTokenIdentifier
} from '@/lib/firebase/server-session'
import { buildLoginPath } from '@/lib/routing/auth-redirect'
import { fetchQuery } from 'convex/nextjs'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const parsePesoAmount = (value: string) => {
  const amount = Number(value.replace(/[^\d.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

const getSearchParamValue = (value: string | string[] | undefined) => {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const buildEntryPath = (tourId: string, query: Awaited<PageProps['searchParams']>) => {
  const entrySearchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => entrySearchParams.append(key, item))
    } else if (value !== undefined) {
      entrySearchParams.set(key, value)
    }
  }

  const pathname = `/tournaments/${encodeURIComponent(tourId)}/entry`
  const search = entrySearchParams.toString()
  return search ? `${pathname}?${search}` : pathname
}

const Page = async ({ params, searchParams }: PageProps) => {
  const [{ tourId }, query, session] = await Promise.all([params, searchParams, getVerifiedFirebaseSession()])

  if (!session) {
    redirect(buildLoginPath(buildEntryPath(tourId, query)))
  }

  const requestedFormId = getSearchParamValue(query.formId)
  const userIds = buildFirebaseSubscriptionUserIds(session.decodedToken)
  const tournamentPromise = fetchQuery(api.tournaments.q.getByTournamentId, { id: tourId })
  const userPromise = fetchQuery(api.users.q.getUserByTokenId, {
    tokenIdentifier: buildFirebaseTokenIdentifier(session.decodedToken)
  })
  const subscriptionPromise = requestedFormId
    ? fetchQuery(api.subscriptions.q.getByTournamentIdAndFormId, {
        tournamentId: tourId,
        formId: requestedFormId,
        userIds
      })
    : Promise.resolve(null)
  const currentEntriesPromise = fetchQuery(api.subscriptions.q.listByTournamentIdForUserIds, {
    tournamentId: tourId,
    userIds
  })
  const paymentMethodPromise = fetchQuery(api.paymentMethods.q.getActiveManual)

  const [tournament, users, subscription, currentEntries, paymentMethod] = await Promise.all([
    tournamentPromise,
    userPromise,
    subscriptionPromise,
    currentEntriesPromise,
    paymentMethodPromise
  ])
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
  const initialFormId = subscription?.form_id ?? createFormId()

  return (
    <ProtectedLayout>
      <Content
        tourId={tourId}
        initialFormId={initialFormId}
        initialDivision={subscription?.division ?? initialDivision}
        initialFullName={user?.name ?? session.decodedToken.name ?? ''}
        initialEmail={user?.email ?? session.decodedToken.email ?? ''}
        initialPhone={user?.phone ?? session.decodedToken.phone_number ?? ''}
        isAdmin={session.customClaims.admin === true}
        initialSubscription={subscription}
        paymentMethod={
          paymentMethod
            ? {
                bankOrEwallet: paymentMethod.bankOrEwallet,
                accountName: paymentMethod.accountName,
                accountNumber: paymentMethod.accountNumber,
                qrCodeContent: paymentMethod.qrCodeContent ?? null
              }
            : null
        }
        currentEntries={currentEntries}
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

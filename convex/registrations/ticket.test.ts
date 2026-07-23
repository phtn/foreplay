import assert from 'node:assert/strict'
import test from 'node:test'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import {
  buildRegistrationDocument,
  reconcileSubscriptionTickets
} from './ticket'

const subscription = {
  _creationTime: 1,
  _id: 'subscription-1' as Id<'subscriptions'>,
  contact_email: 'CAPTAIN@EXAMPLE.COM',
  contact_phone: ' 09170000000 ',
  division: 'Open',
  form_id: 'form-1',
  handicap_index: '12',
  payment_status: 'pending',
  status: 'payment_review',
  team_name: ' Team Captain ',
  total_checked_in: '0',
  total_players: '2',
  tournament_id: 'event-1',
  tournament_name: 'Event',
  txn_ref_no: 'ref-1',
  user_id: 'user-1'
} as Doc<'subscriptions'>

test('registration documents normalize player data and inherit subscription fields', () => {
  const registration = buildRegistrationDocument({
    division: ' ',
    handicapIndex: ' 9 ',
    paymentStatus: 'paid',
    playerEmail: ' PLAYER@EXAMPLE.COM ',
    playerId: 'player-1',
    playerName: ' Player One ',
    playerPhone: ' 09171111111 ',
    shirtSize: ' M ',
    subscription,
    ticketToken: 'ticket-1',
    userId: 'user-1'
  })

  assert.equal(registration.player_name, 'Player One')
  assert.equal(registration.player_email, 'player@example.com')
  assert.equal(registration.player_phone, '09171111111')
  assert.equal(registration.handicap_index, '9')
  assert.equal(registration.division, 'Open')
  assert.equal(registration.shirt_size, 'M')
  assert.equal(registration.payment_status, 'paid')
  assert.equal(registration.subscription_id, subscription._id)
})

test('repeated payment confirmation creates at most one automatic ticket', async () => {
  const registrations: Doc<'registrations'>[] = []
  let insertCount = 0

  const ctx = {
    db: {
      insert: async (
        _table: 'registrations',
        value: Omit<Doc<'registrations'>, '_creationTime' | '_id'>
      ) => {
        insertCount += 1
        const id = `registration-${insertCount}` as Id<'registrations'>
        registrations.push({
          ...value,
          _creationTime: insertCount,
          _id: id
        })
        return id
      },
      patch: async (
        id: Id<'registrations'>,
        value: Partial<Doc<'registrations'>>
      ) => {
        const registration = registrations.find(
          (candidate) => candidate._id === id
        )
        assert.ok(registration)
        Object.assign(registration, value)
      },
      query: () => ({
        withIndex: (
          _index: string,
          applyIndex: (query: {
            eq: (field: string, value: unknown) => unknown
          }) => unknown
        ) => {
          applyIndex({
            eq: () => ({})
          })

          return {
            take: async (limit: number) =>
              registrations.slice(0, limit)
          }
        }
      })
    }
  } as unknown as MutationCtx

  await reconcileSubscriptionTickets(ctx, subscription, 'paid', true)
  await reconcileSubscriptionTickets(ctx, subscription, 'paid', true)

  assert.equal(insertCount, 1)
  assert.equal(registrations.length, 1)
  assert.equal(registrations[0]?.payment_status, 'paid')

  await reconcileSubscriptionTickets(
    ctx,
    subscription,
    'pending',
    false
  )

  assert.equal(registrations[0]?.payment_status, 'pending')
})

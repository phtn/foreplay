import assert from 'node:assert/strict'
import test from 'node:test'
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server'
import type { api } from '../_generated/api'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { confirmForAdmin } from '../subscriptions/m'
import { updatePairingForAdmin } from './m'
import { listForPairings } from './q'

function getHandler<Reference extends FunctionReference<'query' | 'mutation'>>(registration: object) {
  return (registration as {
    _handler: (ctx: MutationCtx, args: FunctionArgs<Reference>) => Promise<FunctionReturnType<Reference>>
  })._handler
}

const list = getHandler<typeof api.registrations.q.listForPairings>(listForPairings)
const update = getHandler<typeof api.registrations.m.updatePairingForAdmin>(updatePairingForAdmin)
const confirm = getHandler<typeof api.subscriptions.m.confirmForAdmin>(confirmForAdmin)

test('pending players can be paired before payment and keep their assignment after confirmation', async () => {
  const subscription: Doc<'subscriptions'> = {
    _id: 'subscription' as Id<'subscriptions'>,
    _creationTime: 1,
    user_id: 'owner',
    tournament_id: 'event',
    tournament_name: 'Tournament',
    team_name: 'Unpaid golfer',
    total_players: '1',
    total_checked_in: '0',
    payment_status: 'pending',
    status: 'pending_payment'
  }
  const cancelled = { ...subscription, _id: 'cancelled', status: 'cancelled' }
  const registrations: Doc<'registrations'>[] = []
  let admin = false
  const ctx = {
    auth: { getUserIdentity: async () => ({ admin, subject: 'staff' }) },
    db: {
      normalizeId: (table: string, id: string) => {
        if (table === 'registrations') return registrations.find((row) => row._id === id)?._id ?? null
        return id === subscription._id ? id : null
      },
      get: async (id: string) => id === subscription._id ? subscription : registrations.find((row) => row._id === id),
      insert: async (table: string, fields: Omit<Doc<'registrations'>, '_id' | '_creationTime'>) => {
        if (table === 'subscriptionStatusChanges') return 'status-change'
        const row = { ...fields, _id: 'registration' as Id<'registrations'>, _creationTime: 2 }
        registrations.push(row)
        return row._id
      },
      patch: async (id: string, fields: object) => {
        const row = id === subscription._id ? subscription : registrations.find((row) => row._id === id)
        assert.ok(row)
        Object.assign(row, fields)
      },
      query: (table: string) => ({
        withIndex: (_index: string, apply: (q: { eq: (field: string, value: string) => void }) => void) => {
          const rows = table === 'subscriptions' ? [subscription, cancelled] : registrations
          let matching: object[] = rows
          apply({ eq: (field, value) => { matching = matching.filter((row) => Reflect.get(row, field) === value) } })
          type Operand = (row: object) => unknown
          const results = {
            filter: (predicate: (q: { field: (field: string) => Operand; neq: (field: Operand, value: unknown) => Operand }) => Operand) => {
              matching = matching.filter(predicate({
                field: (field) => (row) => Reflect.get(row, field),
                neq: (operand, value) => (row) => operand(row) !== value
              }))
              return results
            },
            take: async (limit: number) => matching.slice(0, limit),
            first: async () => matching[0] ?? null
          }
          return results
        }
      })
    }
  } as unknown as MutationCtx

  const args = { tournamentId: subscription.tournament_id }
  const listPlayers = () => list(ctx, args)
  const pairing = { ...args, playerId: subscription._id, startHole: 9, pairingGroup: 'B' as const }

  assert.deepEqual((await listPlayers()).map((row) => row.player_name), ['Unpaid golfer'])
  await assert.rejects(update(ctx, pairing), /Unauthorized/)
  admin = true
  await update(ctx, pairing)

  assert.equal((await listPlayers())[0]?.start_hole, 9)
  assert.equal((await listPlayers())[0]?.pairing_group, 'B')
  assert.equal(registrations.length, 0)
  assert.equal(subscription.payment_status, 'pending')

  subscription.status = 'payment_review'
  assert.equal((await listPlayers())[0]?._id, subscription._id)

  await confirm(ctx, { ...args, subscriptionId: subscription._id })
  assert.equal(registrations[0]?.payment_status, 'paid')
  assert.equal(subscription.pending_pairing, undefined)
  assert.deepEqual((await listPlayers()).map((row) => [row._id, row.start_hole, row.pairing_group]), [
    [registrations[0]?._id, 9, 'B']
  ])

  await update(ctx, { ...pairing, startHole: 10 })
  assert.equal(registrations[0]?.start_hole, 10)
})

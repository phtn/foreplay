import type { Id } from '../_generated/dataModel'

export type AdminRegistrationDeletionPlan = {
  deleteSubscription: boolean
  registrationId: Id<'registrations'>
}

export function buildAdminRegistrationDeletionPlan(
  registrationIds: readonly Id<'registrations'>[],
  registrationId: Id<'registrations'>
): AdminRegistrationDeletionPlan {
  if (!registrationIds.includes(registrationId)) {
    throw new Error('The player registration does not belong to this subscription.')
  }

  return {
    deleteSubscription: registrationIds.length === 1,
    registrationId
  }
}

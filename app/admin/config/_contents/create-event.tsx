import { requireAdminSession } from '@/lib/firebase/server-auth'
import { CreateEventForm } from './create-event-form'

export const CreateEventContent = async () => {
  await requireAdminSession()

  return <CreateEventForm />
}

import { createFormHook } from '@tanstack/react-form'
import { SubmitButton } from './components'
import { fieldContext, formContext } from './ctx'
import { TextField } from './fields'

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  // We'll learn more about these options later
  fieldComponents: {
    TextField
  },
  formComponents: { SubmitButton }
})

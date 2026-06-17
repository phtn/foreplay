'use client'

import { createFormHook } from '@tanstack/react-form'
import { SubmitButton } from './components'
import { fieldContext, formContext } from './ctx'
import { SelectField, TextField } from './fields'

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    SelectField,
    TextField
  },
  formComponents: { SubmitButton }
})

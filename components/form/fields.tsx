'use client'

import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { type ComponentProps, type ReactNode, useState } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useFieldContext } from './ctx'

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return null
}

const getErrorMessages = (errors: readonly unknown[]) =>
  Array.from(new Set(errors.map(getErrorMessage).filter((message): message is string => Boolean(message))))

const getDescribedBy = (descriptionId: string | undefined, errorId: string | undefined) =>
  [descriptionId, errorId].filter(Boolean).join(' ') || undefined

interface TextFieldProps {
  id: string
  label?: string
  icon?: IconName
  type: ComponentProps<'input'>['type']
  autoComplete?: ComponentProps<'input'>['autoComplete']
  required?: boolean
  children?: ReactNode
  placeholder?: string
  containerClassName?: string
  showPasswordToggle?: boolean
}

export function TextField({
  label,
  id,
  icon,
  type,
  autoComplete,
  placeholder,
  required,
  children,
  containerClassName,
  showPasswordToggle,
  className,
  onBlur,
  onChange,
  autoFocus,
  disabled,
  ...inputProps
}: TextFieldProps & ComponentProps<'input'>) {
  // The `Field` infers that it should have a `value` type of `string`
  const field = useFieldContext<string>()
  const invalidProp = inputProps['aria-invalid']
  const isInvalid = field.state.meta.errors.length > 0 || invalidProp === true || invalidProp === 'true'
  const errorMessages = getErrorMessages(field.state.meta.errors)
  const errorId = errorMessages.length ? `${id}-error` : undefined
  const describedBy = getDescribedBy(inputProps['aria-describedby'], errorId)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const hasPasswordToggle = showPasswordToggle === true && type === 'password'
  const inputType = hasPasswordToggle && isPasswordVisible ? 'text' : type
  const isDisabled = field.state.meta.isValidating || disabled

  return (
    <div className={cn('mb-4 space-y-2 w-full', containerClassName)}>
      {label && (
        <div className='flex items-center justify-between'>
          <Label htmlFor={id} className='font-okx text-xs opacity-90'>
            {label}
            {required ? (
              <span aria-hidden='true' className='ms-0.5 text-destructive'>
                *
              </span>
            ) : null}
          </Label>

          {children}
        </div>
      )}
      <div className='relative'>
        {icon && (
          <Icon
            name={icon}
            className='absolute start-2 top-1/2 size-5 -translate-y-1/2 text-foreground/50 dark:text-foreground/70'
            aria-hidden='true'
          />
        )}
        <Input
          {...inputProps}
          id={id}
          type={inputType}
          name={field.name}
          value={field.state.value ?? ''}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onBlur={(event) => {
            field.handleBlur()
            onBlur?.(event)
          }}
          onChange={(event) => {
            field.handleChange(event.target.value)
            onChange?.(event)
          }}
          className={cn(
            'h-14 border-white/80 bg-foreground/4 text-base shadow-xs hover:bg-white focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/15 sm:text-sm dark:border-white/40 dark:bg-background/20 dark:placeholder:text-white/60 dark:focus-visible:bg-background/30 dark:focus-visible:ring-primary',
            !!icon ? 'ps-12' : 'px-3',
            hasPasswordToggle ? 'pe-12' : null,
            className
          )}
          disabled={isDisabled}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={isInvalid || undefined}
        />
        {hasPasswordToggle ? (
          <button
            type='button'
            aria-controls={id}
            aria-label={`${isPasswordVisible ? 'Hide' : 'Show'} ${label?.toLowerCase() ?? 'password'}`}
            aria-pressed={isPasswordVisible}
            className='absolute end-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50'
            disabled={isDisabled}
            onClick={() => setIsPasswordVisible((current) => !current)}>
            <Icon name={isPasswordVisible ? 'eye-close' : 'eye'} className='size-4.5' aria-hidden='true' />
          </button>
        ) : null}
      </div>
      {errorMessages.length ? (
        <div id={errorId} role='alert' className='text-sm leading-normal text-destructive'>
          {errorMessages.length === 1 ? (
            errorMessages[0]
          ) : (
            <ul className='ms-4 list-disc space-y-1'>
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

export interface SelectOption {
  label: ReactNode
  value: string
  disabled?: boolean
}

interface SelectFieldProps {
  label: string
  id: string
  options: SelectOption[]
  placeholder?: string
  children?: ReactNode
  containerClassName?: string
}

export function SelectField({
  label,
  id,
  options,
  placeholder,
  children,
  containerClassName,
  className,
  onBlur,
  onChange,
  autoFocus,
  disabled,
  ...selectProps
}: SelectFieldProps & ComponentProps<'select'>) {
  const field = useFieldContext<string>()
  const invalidProp = selectProps['aria-invalid']
  const isInvalid = field.state.meta.errors.length > 0 || invalidProp === true || invalidProp === 'true'
  const errorMessages = getErrorMessages(field.state.meta.errors)
  const errorId = errorMessages.length ? `${id}-error` : undefined
  const describedBy = getDescribedBy(selectProps['aria-describedby'], errorId)
  return (
    <div className={cn('mb-4 space-y-2 w-full', containerClassName)}>
      <div className='flex items-center justify-between'>
        <Label htmlFor={id} className='text-xs opacity-80'>
          {label}
          {selectProps.required ? (
            <span aria-hidden='true' className='ms-0.5 text-destructive'>
              *
            </span>
          ) : null}
        </Label>
        {children}
      </div>
      <select
        {...selectProps}
        id={id}
        name={field.name}
        value={field.state.value ?? ''}
        autoFocus={autoFocus}
        onBlur={(event) => {
          field.handleBlur()
          onBlur?.(event)
        }}
        onChange={(event) => {
          field.handleChange(event.target.value)
          onChange?.(event)
        }}
        className={cn(
          'h-9 w-full rounded-lg border border-input bg-input/30 px-3 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
          className
        )}
        disabled={field.state.meta.isValidating || disabled}
        aria-describedby={describedBy}
        aria-invalid={isInvalid || undefined}>
        {placeholder ? (
          <option value='' disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {errorMessages.length ? (
        <div id={errorId} role='alert' className='text-sm leading-normal text-destructive'>
          {errorMessages.length === 1 ? (
            errorMessages[0]
          ) : (
            <ul className='ms-4 list-disc space-y-1'>
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

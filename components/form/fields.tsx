'use client'

import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ComponentProps, ReactNode } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useFieldContext } from './ctx'

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
  return (
    <div className={cn('mb-4 space-y-2 w-full', containerClassName)}>
      {label && (
        <div className='flex items-center justify-between'>
          <Label htmlFor={id} className='capitalize opacity-80 text-xs'>
            {label}
          </Label>

          {children}
        </div>
      )}
      <div className='relative'>
        {icon && (
          <Icon
            name={icon}
            className='absolute left-2 top-1/2 size-5 -translate-y-1/2 dark:text-foreground/70 text-foreground/50'
            aria-hidden='true'
          />
        )}
        <Input
          {...inputProps}
          id={id}
          type={type}
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
            'h-12 bg-foreground/4 hover:bg-white dark:bg-background/20 border-white/80 dark:border-white/40 dark:focus-visible:bg-background/30 focus-visible:bg-white dark:focus-visible:ring-primary focus-visible:ring-primary/15 focus-visible:border-primary dark:placeholder:text-white/60 shadow-xs',
            !!icon ? 'pl-12' : 'px-3',
            className
          )}
          disabled={field.state.meta.isValidating || disabled}
          required={required}
          aria-invalid={isInvalid}
        />
      </div>
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
  return (
    <div className={cn('mb-4 space-y-2 w-full', containerClassName)}>
      <div className='flex items-center justify-between'>
        <Label htmlFor={id} className='capitalize opacity-80 text-xs'>
          {label}
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
          'h-9 w-full rounded-lg border border-input bg-input/30 px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
          className
        )}
        disabled={field.state.meta.isValidating || disabled}
        aria-invalid={isInvalid}>
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
    </div>
  )
}

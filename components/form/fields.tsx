import { Icon, IconName } from '@/lib/icons'
import { ComponentProps, ReactNode } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useFieldContext } from './ctx'

interface TextFieldProps {
  label: string
  id: string | number
  icon?: IconName
  type: ComponentProps<'input'>['type']
  autoComplete?: ComponentProps<'input'>['autoComplete']
  required?: boolean
  children?: ReactNode
  placeholder?: string
}

export function TextField({
  label,
  id,
  icon,
  type,
  autoComplete,
  placeholder,
  required,
  children
}: TextFieldProps & ComponentProps<'input'>) {
  // The `Field` infers that it should have a `value` type of `string`
  const field = useFieldContext<string>()
  return (
    <div className='mb-4 space-y-2'>
      <div className='flex items-center justify-between'>
        <Label htmlFor='email' className='capitalize opacity-80 text-xs'>
          {label}
        </Label>
        {children}
      </div>
      <div className='relative'>
        {icon && (
          <Icon
            name={icon}
            className='absolute left-2 top-1/2 size-5 -translate-y-1/2 dark:text-foreground/70 text-foreground/50'
            aria-hidden='true'
          />
        )}
        <Input
          id={id}
          autoFocus
          type={type}
          name={field.name}
          value={field.state.value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => field.handleChange(e.target.value)}
          className='h-12 pl-12 bg-foreground/4 hover:bg-white dark:bg-background/20 border-white/80 dark:border-white/40 dark:focus-visible:bg-background/30 focus-visible:bg-white dark:focus-visible:ring-primary focus-visible:ring-primary/15 focus-visible:border-primary dark:placeholder:text-white/60 shadow-xs'
          disabled={field.state.meta.isValidating}
          required={required}
        />
      </div>
    </div>
  )
}

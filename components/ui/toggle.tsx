import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import { Label } from './label'
import { Switch } from './switch'

interface ToggleProps {
  title: string
  label?: string
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: ClassName
}
export const Toggle = ({ title, checked, onChange, disabled, id, className, label }: ToggleProps) => {
  return (
    <div className='inline-flex items-center gap-x-2!'>
      {label && (
        <Label htmlFor={id} className='font-clash font-medium'>
          {label}
        </Label>
      )}
      <Switch
        id={id}
        aria-label={`Toggle ${title}`}
        size='sm'
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange ? onChange : (v) => !v}
        className={cn('scale-80', className)}></Switch>
    </div>
  )
}

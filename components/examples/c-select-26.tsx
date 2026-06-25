import { Field } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const statuses = [
  { value: 'A', label: 'A', color: 'bg-emerald-500' },
  { value: 'B', label: 'B', color: 'bg-orange-300' },
  { value: 'C', label: 'C', color: 'bg-indigo-500' }
]

type GroupOption = (typeof statuses)[number]

type GroupSelectProps = {
  disabled?: boolean
  onChange: (value: string) => void
  value: string
}

const getSelectedGroup = (value: string) => statuses.find((status) => status.value === value) ?? null

export function GroupSelect({ disabled, onChange, value }: GroupSelectProps) {
  const selectedGroup = getSelectedGroup(value)

  return (
    <Field className='max-w-24'>
      <Select
        value={selectedGroup}
        items={statuses}
        onValueChange={(nextValue) => {
          onChange((nextValue as GroupOption | null)?.value ?? '')
        }}>
        <SelectTrigger disabled={disabled}>
          <SelectValue>
            {(item: (typeof statuses)[number]) => (
              <span className='flex items-center gap-3'>
                {item?.color && <span className={`size-3 shrink-0 rounded-full ${item.color}`} />}
                <span className='font-poly font-medium'>{item?.label}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className='max-w-24'>
          <SelectGroup>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status} className='hover:bg-slate-300/10'>
                <span className='flex items-center gap-3'>
                  {status.color && <span className={`size-3 shrink-0 rounded-full ${status.color}`} />}
                  <span>{status.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

import { ContextMenu as CM } from '@base-ui/react/context-menu'
import { ReactNode } from 'react'

interface ContextMenuProps {
  children?: ReactNode
  menuItems?: ReactNode
}

export const ContextMenu = ({ children }: ContextMenuProps) => {
  return (
    <CM.Root>
      <CM.Trigger className='flex h-48 w-60 items-center justify-center rounded-none border border-neutral-950 bg-white text-neutral-950 select-none font-normal dark:border-white dark:bg-neutral-950 dark:text-white'>
        {children}
      </CM.Trigger>
      <CM.Portal>
        <CM.Positioner className='outline-hidden'>
          <CM.Popup className='origin-(--transform-origin) border border-neutral-950 bg-white py-1 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none'>
            <CM.Item className={itemClass}>Add to Library</CM.Item>
            <CM.Item className={itemClass}>Add to Playlist</CM.Item>
            <CM.Separator className='mx-1 my-1 h-px bg-neutral-950 dark:bg-white' />
            <CM.Item className={itemClass}>Play Next</CM.Item>
            <CM.Item className={itemClass}>Play Last</CM.Item>
            <CM.Separator className='mx-1 my-1 h-px bg-neutral-950 dark:bg-white' />
            <CM.Item className={itemClass}>Favorite</CM.Item>
            <CM.Item className={itemClass}>Share</CM.Item>
          </CM.Popup>
        </CM.Positioner>
      </CM.Portal>
    </CM.Root>
  )
}

const itemClass =
  "flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] data-disabled:text-neutral-500 dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white dark:data-disabled:text-neutral-400"

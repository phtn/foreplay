import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { Row } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '../ui/button'
import type {
  ActionAlign,
  ActionConfig,
  ActionItem
} from './create-column'

interface Props<T> {
  row: Row<T>
  actionConfig?: ActionConfig<T>
}

type ResolvedAction<T> = ActionItem<T> & { id: string }

const alignClassMap: Record<ActionAlign, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end'
}

const resolveRowCondition = <T,>(
  value: boolean | ((row: T) => boolean) | undefined,
  row: T
): boolean => {
  if (typeof value === 'function') return value(row)
  return Boolean(value)
}

const toActionId = (label: string, index: number) =>
  `${label.toLowerCase().replace(/\s+/g, '-')}-${index}`

export const RowActions = <T,>({ row, actionConfig }: Props<T>) => {
  const rowData = row.original
  const align = actionConfig?.align ?? 'center'
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingActionId, setPendingActionId] = useState<string | null>(
    null
  )
  const [actionFailed, setActionFailed] = useState(false)

  const actions = useMemo<ResolvedAction<T>[]>(() => {
    const configured = actionConfig?.actions ?? []
    const legacyCustom: ActionItem<T>[] =
      actionConfig?.customActions?.map((action, index) => ({
        id: `custom-${index}`,
        label: action.label,
        icon: action.icon,
        shortcut: action.shortcut,
        variant: action.variant,
        section: 'Actions',
        onClick: action.onClick
      })) ?? []

    const legacyDefault: ActionItem<T>[] = []
    if (actionConfig?.viewFn) {
      legacyDefault.push({
        id: 'view',
        label: 'View',
        icon: 'eye',
        section: 'Actions',
        onClick: actionConfig.viewFn
      })
    }
    if (actionConfig?.deleteFn) {
      legacyDefault.push({
        id: 'delete',
        label: 'Delete',
        icon: 'x',
        section: 'Danger',
        variant: 'destructive',
        shortcut: '⌘⌫',
        onClick: actionConfig.deleteFn
      })
    }

    const usedIds = new Set<string>()
    return [...configured, ...legacyCustom, ...legacyDefault]
      .filter(
        (action) => !resolveRowCondition(action.hidden, rowData)
      )
      .map((action, index) => {
        const baseId = action.id ?? toActionId(action.label, index)
        let id = baseId
        let suffix = index
        while (usedIds.has(id)) {
          id = `${baseId}-${suffix}`
          suffix += 1
        }
        usedIds.add(id)
        return { ...action, id }
      })
  }, [actionConfig, rowData])

  const groupedActions = useMemo(() => {
    const groups = new Map<string, ResolvedAction<T>[]>()

    for (const action of actions) {
      const section = action.section ?? 'Actions'
      const sectionActions = groups.get(section) ?? []
      sectionActions.push(action)
      groups.set(section, sectionActions)
    }

    return Array.from(groups, ([title, items]) => ({ title, items }))
  }, [actions])

  const runAction = useCallback(
    async (action: ResolvedAction<T>) => {
      if (
        pendingActionId ||
        resolveRowCondition(action.disabled, rowData)
      ) {
        return
      }

      setActionFailed(false)
      setPendingActionId(action.id)
      try {
        await action.onClick(rowData)
        setMenuOpen(false)
      } catch (error) {
        setActionFailed(true)
        actionConfig?.onActionError?.(error, rowData, action)
      } finally {
        setPendingActionId(null)
      }
    },
    [actionConfig, pendingActionId, rowData]
  )

  const triggerConfig = actionConfig?.trigger
  const defaultTrigger = (
    <Button
      size={!triggerConfig?.label ? 'sm' : 'default'}
      variant='secondary'
      className={cn(
        'cursor-pointer rounded-lg shadow-none hover:bg-terminal/10 data-[popup-open]:bg-terminal/10 dark:data-[popup-open]:bg-terminal/50',
        triggerConfig?.className
      )}
      aria-label={triggerConfig?.label ?? 'Row actions'}>
      <Icon
        name={
          pendingActionId
            ? 'spinner-ring'
            : (triggerConfig?.icon ?? 'document')
        }
        className='size-4 text-muted-foreground'
      />
      {triggerConfig?.label ? (
        <span>{triggerConfig.label}</span>
      ) : null}
    </Button>
  )

  const trigger = triggerConfig?.render
    ? triggerConfig.render({
        row,
        loading: pendingActionId !== null,
        defaultTrigger
      })
    : defaultTrigger

  const defaultDropdown = (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger render={trigger} />
      {menuOpen ? (
        <DropdownMenuContent
          side='bottom'
          className='rounded-3xl border-origin p-1.5 md:min-w-44'>
          {groupedActions.map((group, groupIndex) => (
            <DropdownMenuGroup key={group.title}>
              {groupedActions.length > 1 ? (
                <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
              ) : null}
              {group.items.map((action) => {
                const isDestructive =
                  action.variant === 'destructive'
                const isPending = pendingActionId === action.id
                const isDisabled =
                  pendingActionId !== null ||
                  resolveRowCondition(action.disabled, rowData)

                return (
                  <DropdownMenuItem
                    key={action.id}
                    variant={
                      isDestructive ? 'destructive' : 'default'
                    }
                    disabled={isDisabled}
                    onClick={() => void runAction(action)}
                    className={cn(
                      'h-10 rounded-xl',
                      action.className
                    )}>
                    <span className='inline-flex w-4 shrink-0 items-center justify-center'>
                      {isPending ? (
                        <Icon name='spinner-ring' className='size-4' />
                      ) : action.icon ? (
                        <Icon
                          name={action.icon}
                          className={cn(
                            'size-4',
                            isDestructive && 'text-danger'
                          )}
                        />
                      ) : null}
                    </span>
                    <span>{action.label}</span>
                    {action.shortcut ? (
                      <span className='ml-auto min-w-10 text-right text-xs opacity-70'>
                        {action.shortcut}
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                )
              })}
              {groupIndex < groupedActions.length - 1 ? (
                <DropdownMenuSeparator />
              ) : null}
            </DropdownMenuGroup>
          ))}
          {actionFailed ? (
            <p
              role='alert'
              className='px-3 py-2 text-xs text-destructive'>
              Action failed. Please try again.
            </p>
          ) : null}
        </DropdownMenuContent>
      ) : null}
    </DropdownMenu>
  )

  const defaultButtons = (
    <div
      className={cn(
        'flex w-full items-center gap-1',
        alignClassMap[align]
      )}>
      {actions.map((action) => {
        const isIconButton = action.appearance === 'icon-button'
        const isPending = pendingActionId === action.id
        const isDisabled =
          pendingActionId !== null ||
          resolveRowCondition(action.disabled, rowData)

        return (
          <Button
            key={action.id}
            size={isIconButton ? 'sm' : 'default'}
            variant='secondary'
            disabled={isDisabled}
            aria-label={isIconButton ? action.label : undefined}
            className={cn(
              'h-8 rounded-lg',
              isIconButton ? 'min-w-8 w-8' : 'gap-2 px-2',
              action.className
            )}
            onClick={() => void runAction(action)}>
            <span className='inline-flex w-4 shrink-0 items-center justify-center'>
              {isPending ? (
                <Icon name='spinner-ring' className='size-4' />
              ) : action.icon ? (
                <Icon name={action.icon} className='size-4' />
              ) : null}
            </span>
            {!isIconButton ? (
              <span className='whitespace-nowrap text-sm'>
                {action.label}
              </span>
            ) : null}
          </Button>
        )
      })}
      {actionFailed ? (
        <span role='alert' className='sr-only'>
          Action failed. Please try again.
        </span>
      ) : null}
    </div>
  )

  if (actionConfig?.render) {
    return actionConfig.render({
      row,
      actions,
      defaultDropdown,
      defaultButtons
    })
  }

  if (actions.length === 0) return null
  return actionConfig?.mode === 'buttons'
    ? defaultButtons
    : defaultDropdown
}

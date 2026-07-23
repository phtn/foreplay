import { cn } from '@/lib/utils'
import {
  HoverCardContent as HoverCardContentPrimitive,
  HoverCardPortal as HoverCardPortalPrimitive,
  HoverCard as HoverCardPrimitive,
  HoverCardTrigger as HoverCardTriggerPrimitive,
  type HoverCardContentProps as HoverCardContentPrimitiveProps,
  type HoverCardProps as HoverCardPrimitiveProps,
  type HoverCardTriggerProps as HoverCardTriggerPrimitiveProps
} from '@radix-ui/react-hover-card'

type HoverCardProps = HoverCardPrimitiveProps

function HoverCard(props: HoverCardProps) {
  return <HoverCardPrimitive {...props} />
}

type HoverCardTriggerProps = HoverCardTriggerPrimitiveProps

function HoverCardTrigger(props: HoverCardTriggerProps) {
  return <HoverCardTriggerPrimitive {...props} />
}

type HoverCardContentProps = HoverCardContentPrimitiveProps

function HoverCardContent({ className, align = 'center', sideOffset = 4, ...props }: HoverCardContentProps) {
  return (
    <HoverCardPortalPrimitive>
      <HoverCardContentPrimitive
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
          className
        )}
        {...props}
      />
    </HoverCardPortalPrimitive>
  )
}

export {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  type HoverCardContentProps,
  type HoverCardProps,
  type HoverCardTriggerProps
}

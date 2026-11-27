import type * as React from 'react'

import { Tooltip as TooltipPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function Tooltip({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return (
        <TooltipProvider>
            <TooltipPrimitive.Root data-slot="tooltip" {...props} />
        </TooltipProvider>
    )
}

function TooltipContent({
    children,
    className,
    sideOffset = 4,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                className={cn(
                    'z-50 max-w-[260px] origin-(--radix-tooltip-content-transform-origin) animate-in fade-in-0 zoom-in-95 rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] leading-snug text-neutral-50 shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 dark:bg-neutral-800',
                    className
                )}
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                {...props}>
                {children}
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    )
}

function TooltipProvider({
    delayDuration = 200,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return (
        <TooltipPrimitive.Provider
            data-slot="tooltip-provider"
            delayDuration={delayDuration}
            {...props}
        />
    )
}

function TooltipTrigger({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }

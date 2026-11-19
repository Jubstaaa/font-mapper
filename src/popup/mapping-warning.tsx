import { AlertTriangle } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { MappingWarningKind } from './mapping-warning-state'

interface MappingWarningProps {
    kind: MappingWarningKind
    label: string
    tooltip: string
}

export function MappingWarning({ kind, label, tooltip }: MappingWarningProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    tabIndex={0}
                    className={cn(
                        'outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                        'flex cursor-help items-center gap-1.5 border-t px-2.5 py-1.5 text-[10px] font-medium',
                        kind === 'missing'
                            ? 'border-amber-500/30 bg-amber-500/[0.06] text-amber-800 dark:text-amber-300'
                            : 'border-border/40 bg-muted/20 text-muted-foreground',
                    )}
                >
                    <AlertTriangle className="size-3 shrink-0" />
                    <span className="truncate">{label}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
                {tooltip}
            </TooltipContent>
        </Tooltip>
    )
}

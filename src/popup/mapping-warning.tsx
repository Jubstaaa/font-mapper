import { AlertTriangle } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type MappingWarningKind = 'orphan' | 'missing'

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
                    className={cn(
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

export function deriveMappingWarning(args: {
    sourceOnPage: boolean
    targetAvailable: boolean
    mappedName: string | null
}): { kind: MappingWarningKind; label: string; tooltip: string } | null {
    const { sourceOnPage, targetAvailable, mappedName } = args
    if (!sourceOnPage) {
        return {
            kind: 'orphan',
            label: 'Not used on this page',
            tooltip:
                "This site doesn't use this font, so the mapping is dormant here. It will still apply on sites that do use it.",
        }
    }
    if (mappedName && !targetAvailable) {
        return {
            kind: 'missing',
            label: 'Target font missing',
            tooltip: `"${mappedName}" isn't installed on this device, so this mapping isn't applied here. Install it locally or pick a different replacement.`,
        }
    }
    return null
}

import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useDebouncedCommit } from './use-debounced-commit'

const COLOR_DEFAULT = '#000000'

interface AdvancedColorProps {
    inert?: boolean
    onCommit: (value: string) => void
    onReset: () => void
    persistedValue: string | undefined
}

export function AdvancedColor({
    inert = false,
    onCommit,
    onReset,
    persistedValue,
}: AdvancedColorProps) {
    const effective = persistedValue ?? COLOR_DEFAULT
    const { cancel, change, draft, setDraft } = useDebouncedCommit<string>(
        effective,
        onCommit
    )

    const isOverridden = persistedValue !== undefined

    const handleReset = () => {
        cancel()
        setDraft(COLOR_DEFAULT)
        onReset()
    }

    return (
        <div
            className={cn(
                'flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5',
                inert && 'opacity-70'
            )}
            inert={inert}>
            <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Color
            </span>
            <input
                aria-label="Text color"
                className="h-6 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
                onChange={e => {
                    change(e.target.value)
                }}
                title="May affect syntax highlighting or semantic colors on the page"
                type="color"
                value={draft}
            />
            <span className="flex-1 text-[11px] font-mono uppercase tabular-nums text-muted-foreground">
                {isOverridden ? draft : '—'}
            </span>
            <Button
                aria-label="Reset color"
                className={cn(
                    'size-5 shrink-0 rounded-sm text-muted-foreground/70 transition-opacity',
                    'hover:text-foreground',
                    !isOverridden && 'disabled:opacity-0'
                )}
                disabled={!isOverridden}
                onClick={handleReset}
                size="icon-xs"
                type="button"
                variant="ghost">
                <RotateCcw className="size-3" />
            </Button>
        </div>
    )
}

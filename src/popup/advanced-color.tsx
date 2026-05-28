import { RotateCcw } from 'lucide-react'

import { useDebouncedCommit } from '@/hooks/use-debounced-commit.hooks'
import { cn } from '@/lib/utils'

const COLOR_DEFAULT = '#000000'

interface AdvancedColorProps {
    persistedValue: string | undefined
    onCommit: (value: string) => void
    onReset: () => void
    inert?: boolean
}

export function AdvancedColor({ persistedValue, onCommit, onReset, inert = false }: AdvancedColorProps) {
    const effective = persistedValue ?? COLOR_DEFAULT
    const { draft, setDraft, change, cancel } = useDebouncedCommit<string>(effective, onCommit)

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
                inert && 'pointer-events-none opacity-50',
            )}
        >
            <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Color
            </span>
            <input
                type="color"
                value={draft}
                onChange={e => change(e.target.value)}
                title="May affect syntax highlighting or semantic colors on the page"
                className="h-6 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
            />
            <span className="flex-1 text-[11px] font-mono uppercase tabular-nums text-muted-foreground">
                {isOverridden ? draft : '—'}
            </span>
            <button
                type="button"
                aria-label="Reset color"
                disabled={!isOverridden}
                onClick={handleReset}
                className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground/70 transition-opacity',
                    'hover:bg-accent hover:text-foreground',
                    !isOverridden && 'pointer-events-none opacity-0',
                )}
            >
                <RotateCcw className="size-3" />
            </button>
        </div>
    )
}

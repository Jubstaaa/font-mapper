import { RotateCcw } from 'lucide-react'

import { Slider } from '@/components/ui/slider'
import { useDebouncedCommit } from '@/hooks/use-debounced-commit.hooks'
import { cn } from '@/lib/utils'

interface LabeledSliderProps {
    label: string
    min: number
    max: number
    step: number
    defaultValue: number
    persistedValue: number
    formatValue: (value: number) => string
    onCommit: (value: number) => void
    onReset: () => void
    inert?: boolean
}

export function LabeledSlider({
    label,
    min,
    max,
    step,
    defaultValue,
    persistedValue,
    formatValue,
    onCommit,
    onReset,
    inert = false,
}: LabeledSliderProps) {
    const { draft, setDraft, change, commit, cancel } = useDebouncedCommit<number>(persistedValue, onCommit)

    const isAtDefault = Math.abs(draft - defaultValue) < step / 2

    const handleReset = () => {
        cancel()
        setDraft(defaultValue)
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
                {label}
            </span>
            <Slider
                value={[draft]}
                min={min}
                max={max}
                step={step}
                onValueChange={values => {
                    const v = values[0]
                    if (typeof v === 'number') change(v)
                }}
                onValueCommit={values => {
                    const v = values[0]
                    if (typeof v === 'number') commit(v)
                }}
                className="flex-1"
            />
            <span className="w-14 shrink-0 text-right text-[11px] font-medium tabular-nums text-foreground">
                {formatValue(draft)}
            </span>
            <button
                type="button"
                aria-label={`Reset ${label.toLowerCase()}`}
                disabled={isAtDefault}
                onClick={handleReset}
                className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground/70 transition-opacity',
                    'hover:bg-accent hover:text-foreground',
                    isAtDefault && 'pointer-events-none opacity-0',
                )}
            >
                <RotateCcw className="size-3" />
            </button>
        </div>
    )
}

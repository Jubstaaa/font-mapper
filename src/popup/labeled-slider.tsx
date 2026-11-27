import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

import { useDebouncedCommit } from './use-debounced-commit'

interface LabeledSliderProps {
    defaultValue: number
    formatValue: (value: number) => string
    inert?: boolean
    label: string
    max: number
    min: number
    onCommit: (value: number) => void
    onReset: () => void
    persistedValue: number
    step: number
}

export function LabeledSlider({
    defaultValue,
    formatValue,
    inert = false,
    label,
    max,
    min,
    onCommit,
    onReset,
    persistedValue,
    step,
}: LabeledSliderProps) {
    const { cancel, change, commit, draft, setDraft } =
        useDebouncedCommit<number>(persistedValue, onCommit)

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
                inert && 'opacity-70'
            )}
            inert={inert}>
            <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            <Slider
                aria-label={label}
                className="flex-1"
                max={max}
                min={min}
                onValueChange={values => {
                    const v = values[0]
                    if (typeof v === 'number') change(v)
                }}
                onValueCommit={values => {
                    const v = values[0]
                    if (typeof v === 'number') commit(v)
                }}
                step={step}
                value={[draft]}
            />
            <span className="w-14 shrink-0 text-right text-[11px] font-medium tabular-nums text-foreground">
                {formatValue(draft)}
            </span>
            <Button
                aria-label={`Reset ${label.toLowerCase()}`}
                className={cn(
                    'size-5 shrink-0 rounded-sm text-muted-foreground/70 transition-opacity',
                    'hover:text-foreground',
                    isAtDefault && 'disabled:opacity-0'
                )}
                disabled={isAtDefault}
                onClick={handleReset}
                size="icon-xs"
                type="button"
                variant="ghost">
                <RotateCcw className="size-3" />
            </Button>
        </div>
    )
}

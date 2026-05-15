import { ArrowRight, RotateCcw } from 'lucide-react'

import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

import { FontCombobox } from './font-combobox'
import type { FontMappingRowProps } from './popup.types'

const SCALE_MIN = 0.5
const SCALE_MAX = 2
const SCALE_STEP = 0.05
const SCALE_DEFAULT = 1

function escapeFontName(name: string): string {
    return name.replace(/'/g, "\\'")
}

export function FontMappingRow({
    source,
    mapping,
    options,
    onChange,
    onScaleChange,
    onHover,
}: FontMappingRowProps) {
    const mapped = mapping?.font ?? null
    const scale = mapping?.scale ?? SCALE_DEFAULT
    const scalePct = Math.round(scale * 100)
    const scaleAtDefault = Math.abs(scale - SCALE_DEFAULT) < 0.001

    return (
        <li
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={cn(
                'flex flex-col rounded-lg border bg-card transition-colors',
                mapped
                    ? 'border-primary/30 bg-primary/[0.03]'
                    : 'border-border/70 hover:border-border',
            )}
        >
            <div className="flex items-center gap-2 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                    <div
                        className="truncate text-[13px] text-foreground"
                        title={source}
                        style={{ fontFamily: `'${escapeFontName(source)}', sans-serif` }}
                    >
                        {source}
                    </div>
                </div>

                <ArrowRight className="size-3 shrink-0 text-muted-foreground/50" />

                <div className="min-w-0 flex-1">
                    <FontCombobox value={mapped} options={options} onSelect={onChange} />
                </div>
            </div>

            {mapped && (
                <div className="flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Scale
                    </span>
                    <Slider
                        value={[scale]}
                        min={SCALE_MIN}
                        max={SCALE_MAX}
                        step={SCALE_STEP}
                        onValueChange={values => {
                            const v = values[0]
                            if (typeof v === 'number') onScaleChange(v)
                        }}
                        className="flex-1"
                    />
                    <span className="w-10 text-right text-[11px] font-medium tabular-nums text-foreground">
                        {scalePct}%
                    </span>
                    <button
                        type="button"
                        aria-label="Reset scale"
                        disabled={scaleAtDefault}
                        onClick={() => onScaleChange(SCALE_DEFAULT)}
                        className={cn(
                            'flex size-5 items-center justify-center rounded-sm text-muted-foreground/70 transition-opacity',
                            'hover:bg-accent hover:text-foreground',
                            scaleAtDefault && 'pointer-events-none opacity-0',
                        )}
                    >
                        <RotateCcw className="size-3" />
                    </button>
                </div>
            )}
        </li>
    )
}

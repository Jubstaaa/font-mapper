import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

import { FontCombobox } from './font-combobox'
import type { FontMappingRowProps } from './popup.types'

function escapeFontName(name: string): string {
    return name.replace(/'/g, "\\'")
}

export function FontMappingRow({ source, mapped, options, onChange, onHover }: FontMappingRowProps) {
    return (
        <li
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={cn(
                'flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 transition-colors',
                mapped
                    ? 'border-primary/30 bg-primary/[0.03]'
                    : 'border-border/70 hover:border-border',
            )}
        >
            <div className="min-w-0 flex-1">
                <div
                    className="truncate text-left text-[13px] text-foreground"
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
        </li>
    )
}

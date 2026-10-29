import { useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

import { quoteFamily } from '@/lib/font-family'
import { cn } from '@/lib/utils'

import { AdvancedColor } from './advanced-color'
import { FontCombobox } from './font-combobox'
import type { FontMappingRowProps } from './font-mapping-row.types'
import { LabeledSlider } from './labeled-slider'
import { MappingWarning, deriveMappingWarning } from './mapping-warning'
import { StyleToggles } from './style-toggles'

const SCALE_MIN = 0.5
const SCALE_MAX = 2
const SCALE_STEP = 0.05
const SCALE_DEFAULT = 1

const LINE_HEIGHT_MIN = 0.8
const LINE_HEIGHT_MAX = 3
const LINE_HEIGHT_STEP = 0.05
const LINE_HEIGHT_DEFAULT = 1.5

const LETTER_SP_MIN = -0.1
const LETTER_SP_MAX = 0.5
const LETTER_SP_STEP = 0.01
const LETTER_SP_DEFAULT = 0

const WORD_SP_MIN = -0.2
const WORD_SP_MAX = 1
const WORD_SP_STEP = 0.05
const WORD_SP_DEFAULT = 0

function rowClassName(warningKind: 'orphan' | 'missing' | null, mapped: boolean): string {
    if (warningKind === 'orphan') return 'border-border/40 bg-muted/30'
    if (warningKind === 'missing') return 'border-amber-500/40 bg-amber-500/[0.04]'
    if (mapped) return 'border-primary/30 bg-primary/[0.03]'
    return 'border-border/70 hover:border-border'
}

export function FontMappingRow({
    source,
    mapping,
    options,
    variants,
    sourceOnPage,
    targetAvailable,
    onChange,
    onScaleChange,
    onStyleChange,
    onLineHeightChange,
    onLetterSpacingChange,
    onWordSpacingChange,
    onColorChange,
    onHover,
}: FontMappingRowProps) {
    const mapped = mapping?.name ?? null
    const [advancedOpen, setAdvancedOpen] = useState(false)

    const boldActive = mapping?.bold === true
    const italicActive = mapping?.italic === true
    const boldAvailable = Boolean(variants?.bold) || Boolean(variants?.boldItalic)
    const italicAvailable = Boolean(variants?.italic) || Boolean(variants?.boldItalic)

    const advancedActive =
        mapping?.lineHeight !== undefined
        || mapping?.letterSpacing !== undefined
        || mapping?.wordSpacing !== undefined
        || mapping?.color !== undefined

    const warning = deriveMappingWarning({ sourceOnPage, targetAvailable, mappedName: mapped })
    const inert = warning?.kind === 'orphan'
    const inertClass = inert ? 'pointer-events-none opacity-50' : ''

    return (
        <li
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={cn(
                'flex flex-col rounded-lg border bg-card transition-colors',
                rowClassName(warning?.kind ?? null, Boolean(mapped)),
            )}
        >
            <div className={cn('flex items-center gap-2 px-2.5 py-2', inertClass)}>
                <div className="min-w-0 flex-1">
                    <div
                        className="truncate text-left text-[13px] text-foreground"
                        title={source}
                        style={{ fontFamily: `${quoteFamily(source)}, sans-serif` }}
                    >
                        {source}
                    </div>
                </div>
                <ArrowRight className="size-3 shrink-0 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                    <FontCombobox value={mapped} options={options} onSelect={onChange} />
                </div>
            </div>

            {warning && <MappingWarning kind={warning.kind} label={warning.label} tooltip={warning.tooltip} />}

            {mapped && (
                <>
                    <LabeledSlider
                        label="Scale"
                        min={SCALE_MIN}
                        max={SCALE_MAX}
                        step={SCALE_STEP}
                        defaultValue={SCALE_DEFAULT}
                        persistedValue={mapping?.scale ?? SCALE_DEFAULT}
                        formatValue={v => `${Math.round(v * 100)}%`}
                        onCommit={onScaleChange}
                        onReset={() => onScaleChange(SCALE_DEFAULT)}
                        inert={inert}
                    />
                    <StyleToggles
                        boldActive={boldActive}
                        italicActive={italicActive}
                        boldAvailable={boldAvailable}
                        italicAvailable={italicAvailable}
                        mappedName={mapped}
                        inert={inert}
                        onChange={onStyleChange}
                    />
                    <button
                        type="button"
                        aria-expanded={advancedOpen}
                        onClick={() => setAdvancedOpen(o => !o)}
                        className={cn(
                            'flex items-center justify-between gap-2 border-t border-primary/15 px-2.5 py-1.5 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground',
                            inertClass,
                        )}
                    >
                        <span className="flex items-center gap-1.5">
                            Advanced
                            {advancedActive && !advancedOpen && (
                                <span className="size-1.5 rounded-full bg-primary" aria-label="has advanced overrides" />
                            )}
                        </span>
                        {advancedOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </button>
                    {advancedOpen && (
                        <>
                            <LabeledSlider
                                label="Line"
                                min={LINE_HEIGHT_MIN}
                                max={LINE_HEIGHT_MAX}
                                step={LINE_HEIGHT_STEP}
                                defaultValue={LINE_HEIGHT_DEFAULT}
                                persistedValue={mapping?.lineHeight ?? LINE_HEIGHT_DEFAULT}
                                formatValue={v => v.toFixed(2)}
                                onCommit={onLineHeightChange}
                                onReset={() => onLineHeightChange(undefined)}
                                inert={inert}
                            />
                            <LabeledSlider
                                label="Letter"
                                min={LETTER_SP_MIN}
                                max={LETTER_SP_MAX}
                                step={LETTER_SP_STEP}
                                defaultValue={LETTER_SP_DEFAULT}
                                persistedValue={mapping?.letterSpacing ?? LETTER_SP_DEFAULT}
                                formatValue={v => `${v.toFixed(2)}em`}
                                onCommit={onLetterSpacingChange}
                                onReset={() => onLetterSpacingChange(undefined)}
                                inert={inert}
                            />
                            <LabeledSlider
                                label="Word"
                                min={WORD_SP_MIN}
                                max={WORD_SP_MAX}
                                step={WORD_SP_STEP}
                                defaultValue={WORD_SP_DEFAULT}
                                persistedValue={mapping?.wordSpacing ?? WORD_SP_DEFAULT}
                                formatValue={v => `${v.toFixed(2)}em`}
                                onCommit={onWordSpacingChange}
                                onReset={() => onWordSpacingChange(undefined)}
                                inert={inert}
                            />
                            <AdvancedColor
                                persistedValue={mapping?.color}
                                onCommit={onColorChange}
                                onReset={() => onColorChange(undefined)}
                                inert={inert}
                            />
                        </>
                    )}
                </>
            )}
        </li>
    )
}

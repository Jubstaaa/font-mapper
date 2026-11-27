import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import type { LocalFontFamilyVariants } from '@/lib/chrome-fonts'
import type { FontMapping } from '@/lib/chrome-storage.types'

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { quoteFamily } from '@/lib/font-family'
import { cn } from '@/lib/utils'

import { AdvancedColor } from './advanced-color'
import { FontCombobox } from './font-combobox'
import { LabeledSlider } from './labeled-slider'
import { MappingWarning } from './mapping-warning'
import { deriveMappingWarning } from './mapping-warning-state'
import { StyleToggles } from './style-toggles'

interface FontMappingRowProps {
    mapping: FontMapping | null
    onChange: (value: null | string) => void
    onColorChange: (value: string | undefined) => void
    onHover: (hovering: boolean) => void
    onLetterSpacingChange: (value: number | undefined) => void
    onLineHeightChange: (value: number | undefined) => void
    onScaleChange: (scale: number) => void
    onStyleChange: (style: { bold?: boolean; italic?: boolean }) => void
    onWordSpacingChange: (value: number | undefined) => void
    options: string[]
    source: string
    sourceOnPage: boolean
    targetAvailable: boolean
    variants: LocalFontFamilyVariants | null
}

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

export function FontMappingRow({
    mapping,
    onChange,
    onColorChange,
    onHover,
    onLetterSpacingChange,
    onLineHeightChange,
    onScaleChange,
    onStyleChange,
    onWordSpacingChange,
    options,
    source,
    sourceOnPage,
    targetAvailable,
    variants,
}: FontMappingRowProps) {
    const mapped = mapping?.name ?? null
    const [advancedOpen, setAdvancedOpen] = useState(false)

    const boldActive = mapping?.bold === true
    const italicActive = mapping?.italic === true
    const boldAvailable =
        Boolean(variants?.bold) || Boolean(variants?.boldItalic)
    const italicAvailable =
        Boolean(variants?.italic) || Boolean(variants?.boldItalic)

    const advancedActive =
        mapping?.lineHeight !== undefined ||
        mapping?.letterSpacing !== undefined ||
        mapping?.wordSpacing !== undefined ||
        mapping?.color !== undefined

    const warning = deriveMappingWarning({
        mappedName: mapped,
        sourceOnPage,
        targetAvailable,
    })
    const inert = warning?.kind === 'orphan'
    const inertClass = inert ? 'opacity-70' : ''

    return (
        <li
            className={cn(
                'flex flex-col rounded-lg border bg-card transition-colors',
                rowClassName(warning?.kind ?? null, Boolean(mapped))
            )}
            onMouseEnter={() => {
                onHover(true)
            }}
            onMouseLeave={() => {
                onHover(false)
            }}>
            <div
                className={cn(
                    'flex items-center gap-2 px-2.5 py-2',
                    inertClass
                )}
                inert={inert}>
                <div className="min-w-0 flex-1">
                    <div
                        className="truncate text-left text-[13px] text-foreground"
                        style={{
                            fontFamily: `${quoteFamily(source)}, sans-serif`,
                        }}
                        title={source}>
                        {source}
                    </div>
                </div>
                <ArrowRight className="size-3 shrink-0 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                    <FontCombobox
                        label={`Replacement font for ${source}`}
                        onSelect={onChange}
                        options={options}
                        value={mapped}
                    />
                </div>
            </div>

            {warning && (
                <MappingWarning
                    kind={warning.kind}
                    label={warning.label}
                    tooltip={warning.tooltip}
                />
            )}

            {mapped && (
                <>
                    <LabeledSlider
                        defaultValue={SCALE_DEFAULT}
                        formatValue={v => `${Math.round(v * 100)}%`}
                        inert={inert}
                        label="Scale"
                        max={SCALE_MAX}
                        min={SCALE_MIN}
                        onCommit={onScaleChange}
                        onReset={() => {
                            onScaleChange(SCALE_DEFAULT)
                        }}
                        persistedValue={mapping?.scale ?? SCALE_DEFAULT}
                        step={SCALE_STEP}
                    />
                    <StyleToggles
                        boldActive={boldActive}
                        boldAvailable={boldAvailable}
                        inert={inert}
                        italicActive={italicActive}
                        italicAvailable={italicAvailable}
                        mappedName={mapped}
                        onChange={onStyleChange}
                    />
                    <Collapsible
                        className="flex flex-col"
                        onOpenChange={setAdvancedOpen}
                        open={advancedOpen}>
                        <CollapsibleTrigger
                            className={cn(
                                'flex items-center justify-between gap-2 border-t border-primary/15 px-2.5 py-1.5 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground',
                                inertClass
                            )}
                            inert={inert}>
                            <span className="flex items-center gap-1.5">
                                Advanced
                                {advancedActive && !advancedOpen && (
                                    <>
                                        <span className="sr-only">
                                            {' '}
                                            (overrides set)
                                        </span>
                                        <span
                                            aria-hidden
                                            className="size-1.5 rounded-full bg-primary"
                                        />
                                    </>
                                )}
                            </span>
                            {advancedOpen ? (
                                <ChevronUp className="size-3" />
                            ) : (
                                <ChevronDown className="size-3" />
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="flex flex-col">
                            <LabeledSlider
                                defaultValue={LINE_HEIGHT_DEFAULT}
                                formatValue={v => v.toFixed(2)}
                                inert={inert}
                                label="Line"
                                max={LINE_HEIGHT_MAX}
                                min={LINE_HEIGHT_MIN}
                                onCommit={onLineHeightChange}
                                onReset={() => {
                                    onLineHeightChange(undefined)
                                }}
                                persistedValue={
                                    mapping?.lineHeight ?? LINE_HEIGHT_DEFAULT
                                }
                                step={LINE_HEIGHT_STEP}
                            />
                            <LabeledSlider
                                defaultValue={LETTER_SP_DEFAULT}
                                formatValue={v => `${v.toFixed(2)}em`}
                                inert={inert}
                                label="Letter"
                                max={LETTER_SP_MAX}
                                min={LETTER_SP_MIN}
                                onCommit={onLetterSpacingChange}
                                onReset={() => {
                                    onLetterSpacingChange(undefined)
                                }}
                                persistedValue={
                                    mapping?.letterSpacing ?? LETTER_SP_DEFAULT
                                }
                                step={LETTER_SP_STEP}
                            />
                            <LabeledSlider
                                defaultValue={WORD_SP_DEFAULT}
                                formatValue={v => `${v.toFixed(2)}em`}
                                inert={inert}
                                label="Word"
                                max={WORD_SP_MAX}
                                min={WORD_SP_MIN}
                                onCommit={onWordSpacingChange}
                                onReset={() => {
                                    onWordSpacingChange(undefined)
                                }}
                                persistedValue={
                                    mapping?.wordSpacing ?? WORD_SP_DEFAULT
                                }
                                step={WORD_SP_STEP}
                            />
                            <AdvancedColor
                                inert={inert}
                                onCommit={onColorChange}
                                onReset={() => {
                                    onColorChange(undefined)
                                }}
                                persistedValue={mapping?.color}
                            />
                        </CollapsibleContent>
                    </Collapsible>
                </>
            )}
        </li>
    )
}

function rowClassName(
    warningKind: 'missing' | 'orphan' | null,
    mapped: boolean
): string {
    if (warningKind === 'orphan') return 'border-border/40 bg-muted/30'
    if (warningKind === 'missing')
        return 'border-amber-500/40 bg-amber-500/[0.04]'
    if (mapped) return 'border-primary/30 bg-primary/[0.03]'
    return 'border-border/70 hover:border-border'
}

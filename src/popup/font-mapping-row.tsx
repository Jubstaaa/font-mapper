import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, Bold, ChevronDown, ChevronUp, Italic, RotateCcw } from 'lucide-react'

import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { FontCombobox } from './font-combobox'
import type { FontMappingRowProps } from './popup.types'

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

const COLOR_DEFAULT = '#000000'
const COMMIT_DEBOUNCE_MS = 180

function escapeFontName(name: string): string {
    return name.replace(/'/g, "\\'")
}

interface AdvancedSliderProps {
    label: string
    min: number
    max: number
    step: number
    defaultValue: number
    persistedValue: number | undefined
    formatValue: (v: number) => string
    onCommit: (v: number | undefined) => void
}

function AdvancedSlider({
    label,
    min,
    max,
    step,
    defaultValue,
    persistedValue,
    formatValue,
    onCommit,
}: AdvancedSliderProps) {
    const effective = persistedValue ?? defaultValue
    const [draft, setDraft] = useState(effective)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        setDraft(effective)
    }, [effective])

    useEffect(() => () => {
        if (timerRef.current != null) window.clearTimeout(timerRef.current)
    }, [])

    const cancelTimer = () => {
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    const isOverridden = persistedValue !== undefined

    return (
        <div className="flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5">
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
                    if (typeof v !== 'number') return
                    setDraft(v)
                    cancelTimer()
                    timerRef.current = window.setTimeout(() => {
                        timerRef.current = null
                        onCommit(v)
                    }, COMMIT_DEBOUNCE_MS)
                }}
                onValueCommit={values => {
                    const v = values[0]
                    if (typeof v !== 'number') return
                    cancelTimer()
                    onCommit(v)
                }}
                className="flex-1"
            />
            <span className="w-14 shrink-0 text-right text-[11px] font-medium tabular-nums text-foreground">
                {formatValue(draft)}
            </span>
            <button
                type="button"
                aria-label={`Reset ${label.toLowerCase()}`}
                disabled={!isOverridden}
                onClick={() => {
                    setDraft(defaultValue)
                    cancelTimer()
                    onCommit(undefined)
                }}
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

interface AdvancedColorProps {
    persistedValue: string | undefined
    onCommit: (v: string | undefined) => void
}

function AdvancedColor({ persistedValue, onCommit }: AdvancedColorProps) {
    const [draft, setDraft] = useState(persistedValue ?? COLOR_DEFAULT)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        setDraft(persistedValue ?? COLOR_DEFAULT)
    }, [persistedValue])

    useEffect(() => () => {
        if (timerRef.current != null) window.clearTimeout(timerRef.current)
    }, [])

    const cancelTimer = () => {
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    const isOverridden = persistedValue !== undefined

    return (
        <div className="flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5">
            <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Color
            </span>
            <input
                type="color"
                value={draft}
                onChange={e => {
                    const v = e.target.value
                    setDraft(v)
                    cancelTimer()
                    timerRef.current = window.setTimeout(() => {
                        timerRef.current = null
                        onCommit(v)
                    }, COMMIT_DEBOUNCE_MS)
                }}
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
                onClick={() => {
                    setDraft(COLOR_DEFAULT)
                    cancelTimer()
                    onCommit(undefined)
                }}
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
    const persistedScale = mapping?.scale ?? SCALE_DEFAULT
    const [draftScale, setDraftScale] = useState(persistedScale)
    const scaleTimerRef = useRef<number | null>(null)
    const [advancedOpen, setAdvancedOpen] = useState(false)

    useEffect(() => {
        setDraftScale(persistedScale)
    }, [persistedScale])

    useEffect(() => () => {
        if (scaleTimerRef.current != null) {
            window.clearTimeout(scaleTimerRef.current)
            scaleTimerRef.current = null
        }
    }, [])

    const scalePct = Math.round(draftScale * 100)
    const scaleAtDefault = Math.abs(draftScale - SCALE_DEFAULT) < 0.001

    const boldActive = mapping?.bold === true
    const italicActive = mapping?.italic === true
    const boldAvailable = Boolean(variants?.bold) || Boolean(variants?.boldItalic)
    const italicAvailable = Boolean(variants?.italic) || Boolean(variants?.boldItalic)

    const advancedActive =
        mapping?.lineHeight !== undefined
        || mapping?.letterSpacing !== undefined
        || mapping?.wordSpacing !== undefined
        || mapping?.color !== undefined

    const targetMissing = Boolean(mapped) && !targetAvailable
    const warning = !sourceOnPage
        ? {
            kind: 'orphan' as const,
            label: 'Not used on this page',
            tooltip: 'This site doesn\'t use this font, so the mapping is dormant here. It will still apply on sites that do use it.',
        }
        : targetMissing
            ? {
                kind: 'missing' as const,
                label: 'Target font missing',
                tooltip: `"${mapped}" isn't installed on this device, so this mapping isn't applied here. Install it locally or pick a different replacement.`,
            }
            : null

    const inertClass = warning?.kind === 'orphan' ? 'pointer-events-none opacity-50' : ''

    return (
        <li
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={cn(
                'flex flex-col rounded-lg border bg-card transition-colors',
                warning?.kind === 'orphan'
                    ? 'border-border/40 bg-muted/30'
                    : warning?.kind === 'missing'
                        ? 'border-amber-500/40 bg-amber-500/[0.04]'
                        : mapped
                            ? 'border-primary/30 bg-primary/[0.03]'
                            : 'border-border/70 hover:border-border',
            )}
        >
            <div className={cn('flex items-center gap-2 px-2.5 py-2', inertClass)}>
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
            </div>

            {warning && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                'flex cursor-help items-center gap-1.5 border-t px-2.5 py-1.5 text-[10px] font-medium',
                                warning.kind === 'missing'
                                    ? 'border-amber-500/30 bg-amber-500/[0.06] text-amber-800 dark:text-amber-300'
                                    : 'border-border/40 bg-muted/20 text-muted-foreground',
                            )}
                        >
                            <AlertTriangle className="size-3 shrink-0" />
                            <span className="truncate">{warning.label}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start">
                        {warning.tooltip}
                    </TooltipContent>
                </Tooltip>
            )}

            {mapped && (
                <>
                    <div className={cn('flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5', inertClass)}>
                        <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Scale
                        </span>
                        <Slider
                            value={[draftScale]}
                            min={SCALE_MIN}
                            max={SCALE_MAX}
                            step={SCALE_STEP}
                            onValueChange={values => {
                                const v = values[0]
                                if (typeof v !== 'number') return
                                setDraftScale(v)
                                if (scaleTimerRef.current != null) window.clearTimeout(scaleTimerRef.current)
                                scaleTimerRef.current = window.setTimeout(() => {
                                    scaleTimerRef.current = null
                                    onScaleChange(v)
                                }, COMMIT_DEBOUNCE_MS)
                            }}
                            onValueCommit={values => {
                                const v = values[0]
                                if (typeof v !== 'number') return
                                if (scaleTimerRef.current != null) {
                                    window.clearTimeout(scaleTimerRef.current)
                                    scaleTimerRef.current = null
                                }
                                onScaleChange(v)
                            }}
                            className="flex-1"
                        />
                        <span className="w-14 shrink-0 text-right text-[11px] font-medium tabular-nums text-foreground">
                            {scalePct}%
                        </span>
                        <button
                            type="button"
                            aria-label="Reset scale"
                            disabled={scaleAtDefault}
                            onClick={() => {
                                setDraftScale(SCALE_DEFAULT)
                                if (scaleTimerRef.current != null) {
                                    window.clearTimeout(scaleTimerRef.current)
                                    scaleTimerRef.current = null
                                }
                                onScaleChange(SCALE_DEFAULT)
                            }}
                            className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground/70 transition-opacity',
                                'hover:bg-accent hover:text-foreground',
                                scaleAtDefault && 'pointer-events-none opacity-0',
                            )}
                        >
                            <RotateCcw className="size-3" />
                        </button>
                    </div>
                    <div className={cn('flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5', inertClass)}>
                        <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Style
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                aria-label="Bold"
                                aria-pressed={boldActive}
                                disabled={!boldAvailable}
                                title={boldAvailable ? 'Bold' : `No bold variant available for ${mapped}`}
                                onClick={() => onStyleChange({ bold: !boldActive, italic: italicActive })}
                                className={cn(
                                    'flex size-6 items-center justify-center rounded-sm border text-foreground transition-colors',
                                    boldActive
                                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'border-border bg-background hover:bg-accent',
                                    !boldAvailable && 'pointer-events-none opacity-40',
                                )}
                            >
                                <Bold className="size-3" />
                            </button>
                            <button
                                type="button"
                                aria-label="Italic"
                                aria-pressed={italicActive}
                                disabled={!italicAvailable}
                                title={italicAvailable ? 'Italic' : `No italic variant available for ${mapped}`}
                                onClick={() => onStyleChange({ bold: boldActive, italic: !italicActive })}
                                className={cn(
                                    'flex size-6 items-center justify-center rounded-sm border text-foreground transition-colors',
                                    italicActive
                                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'border-border bg-background hover:bg-accent',
                                    !italicAvailable && 'pointer-events-none opacity-40',
                                )}
                            >
                                <Italic className="size-3" />
                            </button>
                        </div>
                    </div>
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
                        <div className={cn('flex flex-col', inertClass)}>
                            <AdvancedSlider
                                label="Line"
                                min={LINE_HEIGHT_MIN}
                                max={LINE_HEIGHT_MAX}
                                step={LINE_HEIGHT_STEP}
                                defaultValue={LINE_HEIGHT_DEFAULT}
                                persistedValue={mapping?.lineHeight}
                                formatValue={v => v.toFixed(2)}
                                onCommit={onLineHeightChange}
                            />
                            <AdvancedSlider
                                label="Letter"
                                min={LETTER_SP_MIN}
                                max={LETTER_SP_MAX}
                                step={LETTER_SP_STEP}
                                defaultValue={LETTER_SP_DEFAULT}
                                persistedValue={mapping?.letterSpacing}
                                formatValue={v => `${v.toFixed(2)}em`}
                                onCommit={onLetterSpacingChange}
                            />
                            <AdvancedSlider
                                label="Word"
                                min={WORD_SP_MIN}
                                max={WORD_SP_MAX}
                                step={WORD_SP_STEP}
                                defaultValue={WORD_SP_DEFAULT}
                                persistedValue={mapping?.wordSpacing}
                                formatValue={v => `${v.toFixed(2)}em`}
                                onCommit={onWordSpacingChange}
                            />
                            <AdvancedColor
                                persistedValue={mapping?.color}
                                onCommit={onColorChange}
                            />
                        </div>
                    )}
                </>
            )}
        </li>
    )
}

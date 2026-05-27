import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, RotateCcw, Type } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { getFamilyVariants, type LocalFont } from '@/lib/chrome-fonts'
import {
    FONT_CACHE_VERSION,
    loadCachedLocalFonts,
    loadCachedLocalFontsVersion,
    loadMappingsForHost,
    saveMappingsForHost,
    type FontMap,
} from '@/lib/chrome-storage'
import {
    POPUP_PORT_NAME,
    sendToTab,
    type ApplyMappingsResponse,
    type GetUsedFontsResponse,
    type PortMessage,
} from '@/lib/chrome-messaging'

import { FontMappingRow } from './font-mapping-row'
import type { PopupStatus } from './popup.types'

export function Popup() {
    const [status, setStatus] = useState<PopupStatus>('loading')
    const [tabId, setTabId] = useState<number | null>(null)
    const [hostname, setHostname] = useState('')
    const [usedFonts, setUsedFonts] = useState<string[]>([])
    const [localFonts, setLocalFonts] = useState<LocalFont[]>([])
    const [mappings, setMappings] = useState<FontMap>({})
    const [cacheStale, setCacheStale] = useState(false)

    const familyOptions = useMemo(() => {
        const seen = new Set<string>()
        const list: string[] = []
        for (const f of localFonts) {
            if (seen.has(f.family)) continue
            seen.add(f.family)
            list.push(f.family)
        }
        return list
    }, [localFonts])

    const localFontIndex = useMemo(() => {
        const map = new Map<string, string>()
        for (const family of familyOptions) {
            const variants = getFamilyVariants(family, localFonts)
            const target = variants.regular
            if (target) map.set(family, target.postscriptName)
        }
        return map
    }, [familyOptions, localFonts])

    const portRef = useRef<chrome.runtime.Port | null>(null)
    const saveTimerRef = useRef<number | null>(null)

    const mappedCount = useMemo(() => Object.keys(mappings).length, [mappings])
    const totalCount = usedFonts.length

    const persistDebounced = useCallback(
        (host: string, next: FontMap) => {
            if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current)
            saveTimerRef.current = window.setTimeout(() => {
                void saveMappingsForHost(host, next)
            }, 200)
        },
        [],
    )

    const persistNow = useCallback(
        async (host: string, next: FontMap) => {
            if (saveTimerRef.current != null) {
                window.clearTimeout(saveTimerRef.current)
                saveTimerRef.current = null
            }
            await saveMappingsForHost(host, next)
        },
        [],
    )

    const handleChange = useCallback(
        async (source: string, target: string | null) => {
            const next: FontMap = { ...mappings }
            if (target === null) {
                delete next[source]
            } else {
                const psName = localFontIndex.get(target)
                const prevScale = next[source]?.scale
                next[source] = {
                    name: target,
                    ...(psName ? { id: psName } : {}),
                    ...(prevScale ? { scale: prevScale } : {}),
                }
            }
            setMappings(next)
            await persistNow(hostname, next)
            if (tabId != null) {
                await sendToTab<ApplyMappingsResponse>(tabId, { type: 'APPLY_MAPPINGS', mappings: next })
            }
        },
        [mappings, hostname, tabId, localFontIndex, persistNow],
    )

    const handleScaleChange = useCallback(
        (source: string, scale: number) => {
            const current = mappings[source]
            if (!current) return
            const nextMapping = { ...current, scale: scale === 1 ? undefined : scale }
            const next: FontMap = { ...mappings, [source]: nextMapping }
            setMappings(next)
            if (tabId != null) {
                void sendToTab<ApplyMappingsResponse>(tabId, { type: 'APPLY_MAPPINGS', mappings: next })
            }
            persistDebounced(hostname, next)
        },
        [mappings, hostname, tabId, persistDebounced],
    )

    const handleStyleChange = useCallback(
        (source: string, style: { bold?: boolean; italic?: boolean }) => {
            const current = mappings[source]
            if (!current) return
            const next: FontMap = {
                ...mappings,
                [source]: {
                    ...current,
                    bold: style.bold ? true : undefined,
                    italic: style.italic ? true : undefined,
                },
            }
            setMappings(next)
            if (tabId != null) {
                void sendToTab<ApplyMappingsResponse>(tabId, { type: 'APPLY_MAPPINGS', mappings: next })
            }
            persistDebounced(hostname, next)
        },
        [mappings, hostname, tabId, persistDebounced],
    )

    const applyMappingUpdate = useCallback(
        (source: string, patch: Partial<typeof mappings[string]>) => {
            const current = mappings[source]
            if (!current) return
            const next: FontMap = { ...mappings, [source]: { ...current, ...patch } }
            setMappings(next)
            if (tabId != null) {
                void sendToTab<ApplyMappingsResponse>(tabId, { type: 'APPLY_MAPPINGS', mappings: next })
            }
            persistDebounced(hostname, next)
        },
        [mappings, hostname, tabId, persistDebounced],
    )

    const handleLineHeightChange = useCallback(
        (source: string, value: number | undefined) => {
            applyMappingUpdate(source, { lineHeight: value })
        },
        [applyMappingUpdate],
    )

    const handleLetterSpacingChange = useCallback(
        (source: string, value: number | undefined) => {
            applyMappingUpdate(source, { letterSpacing: value })
        },
        [applyMappingUpdate],
    )

    const handleWordSpacingChange = useCallback(
        (source: string, value: number | undefined) => {
            applyMappingUpdate(source, { wordSpacing: value })
        },
        [applyMappingUpdate],
    )

    const handleColorChange = useCallback(
        (source: string, value: string | undefined) => {
            applyMappingUpdate(source, { color: value })
        },
        [applyMappingUpdate],
    )

    const handleHover = useCallback((source: string, hovering: boolean) => {
        const port = portRef.current
        if (!port) return
        try {
            const message: PortMessage = hovering
                ? { type: 'HIGHLIGHT_FONT', font: source }
                : { type: 'CLEAR_HIGHLIGHT' }
            port.postMessage(message)
        } catch {}
    }, [])

    const handleReset = useCallback(async () => {
        setMappings({})
        await persistNow(hostname, {})
        if (tabId != null) {
            await sendToTab<ApplyMappingsResponse>(tabId, { type: 'APPLY_MAPPINGS', mappings: {} })
        }
    }, [hostname, tabId, persistNow])

    const handleReload = useCallback(() => {
        if (tabId != null) chrome.tabs.reload(tabId)
        window.close()
    }, [tabId])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

            if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
                if (!cancelled) setStatus('restricted')
                return
            }

            const fonts = await loadCachedLocalFonts()
            if (cancelled) return

            if (!fonts.length) {
                setStatus('permission-required')
                return
            }

            const cachedVersion = await loadCachedLocalFontsVersion()
            if (cancelled) return
            setCacheStale(cachedVersion < FONT_CACHE_VERSION)

            const response = await sendToTab<GetUsedFontsResponse>(tab.id, { type: 'GET_USED_FONTS' })
            if (cancelled) return

            const host = response?.hostname || new URL(tab.url).hostname
            const saved = await loadMappingsForHost(host)
            if (cancelled) return

            setTabId(tab.id)
            setHostname(host)
            setLocalFonts(fonts)
            setMappings(saved)

            if (!response) {
                setStatus('no-script')
                return
            }

            setUsedFonts(response.fonts || [])
            setStatus('ready')
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const handleOpenOptions = useCallback(() => {
        chrome.runtime.openOptionsPage()
        window.close()
    }, [])

    const handleRefreshFonts = useCallback(() => {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html?refresh=1') })
        window.close()
    }, [])

    useEffect(() => {
        if (tabId == null) return
        try {
            const port = chrome.tabs.connect(tabId, { name: POPUP_PORT_NAME })
            portRef.current = port
            port.onDisconnect.addListener(() => {
                portRef.current = null
            })
            return () => {
                try {
                    port.disconnect()
                } catch {}
                portRef.current = null
            }
        } catch {
            return
        }
    }, [tabId])

    return (
        <div className="flex flex-col">
            <header className="border-b border-white/5 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 px-4 py-3.5 text-neutral-50">
                <div className="flex items-center gap-2.5">
                    <img
                        src="/icon-128.png"
                        alt="FontMapper"
                        className="size-6 shrink-0 rounded-md ring-1 ring-white/10"
                    />
                    <h1 className="text-sm font-semibold tracking-tight">FontMapper</h1>
                    {status === 'ready' && totalCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-auto h-5 border-0 bg-white/10 px-1.5 text-[10px] font-medium text-white/85"
                        >
                            {mappedCount}/{totalCount} mapped
                        </Badge>
                    )}
                </div>
                <p className="mt-1 truncate text-[11px] text-neutral-400" title={hostname}>
                    {hostname || '—'}
                </p>
            </header>

            <main className="min-h-[200px]">
                {status === 'loading' && (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        <p className="text-xs">Scanning fonts…</p>
                    </div>
                )}

                {status === 'restricted' && (
                    <div className="flex flex-col items-center justify-center gap-2 px-8 py-12 text-center text-muted-foreground">
                        <Type className="size-5" />
                        <p className="text-xs leading-relaxed">
                            FontMapper only works on regular http(s) pages.
                        </p>
                    </div>
                )}

                {status === 'no-script' && (
                    <div className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center">
                        <Type className="size-5 text-muted-foreground" />
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            Reload this tab to enable FontMapper on this page.
                        </p>
                        <Button size="sm" variant="outline" onClick={handleReload} className="h-7 text-[11px]">
                            <RefreshCw className="mr-1 size-3" />
                            Reload tab
                        </Button>
                    </div>
                )}

                {status === 'permission-required' && (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                        <Type className="size-5 text-muted-foreground" />
                        <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                            Open settings to grant access to your local fonts. This is a one-time setup.
                        </p>
                        <Button size="sm" onClick={handleOpenOptions} className="h-7 text-[11px]">
                            Open settings
                        </Button>
                    </div>
                )}

                {status === 'ready' && totalCount === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 px-8 py-12 text-center text-muted-foreground">
                        <Type className="size-5" />
                        <p className="text-xs">No fonts detected on this page.</p>
                    </div>
                )}

                {status === 'ready' && cacheStale && (
                    <button
                        type="button"
                        onClick={handleRefreshFonts}
                        className="flex w-full items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-[11px] text-amber-900 transition-colors hover:bg-amber-500/15 dark:text-amber-200"
                    >
                        <span className="leading-tight">
                            Update font list to enable <strong className="font-semibold">Bold</strong> and{' '}
                            <strong className="font-semibold">Italic</strong> toggles.
                        </span>
                        <span className="flex shrink-0 items-center gap-1 font-medium underline-offset-2 hover:underline">
                            <RefreshCw className="size-3" />
                            Update
                        </span>
                    </button>
                )}

                {status === 'ready' && totalCount > 0 && (
                    <ScrollArea className="h-[420px]">
                        <ul className="flex flex-col gap-1.5 p-3">
                            {usedFonts.map(font => {
                                const mapping = mappings[font] ?? null
                                return (
                                    <FontMappingRow
                                        key={font}
                                        source={font}
                                        mapping={mapping}
                                        options={familyOptions}
                                        variants={mapping ? getFamilyVariants(mapping.name, localFonts) : null}
                                        onChange={value => handleChange(font, value)}
                                        onScaleChange={scale => handleScaleChange(font, scale)}
                                        onStyleChange={style => handleStyleChange(font, style)}
                                        onLineHeightChange={value => handleLineHeightChange(font, value)}
                                        onLetterSpacingChange={value => handleLetterSpacingChange(font, value)}
                                        onWordSpacingChange={value => handleWordSpacingChange(font, value)}
                                        onColorChange={value => handleColorChange(font, value)}
                                        onHover={hovering => handleHover(font, hovering)}
                                    />
                                )
                            })}
                        </ul>
                    </ScrollArea>
                )}
            </main>

            {status === 'ready' && totalCount > 0 && (
                <>
                    <Separator />
                    <footer className="flex items-center justify-between px-3 py-2">
                        <span className="text-[11px] text-muted-foreground">
                            {totalCount} font{totalCount === 1 ? '' : 's'} detected
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            disabled={mappedCount === 0}
                            className="h-7 px-2 text-[11px]"
                        >
                            <RotateCcw className="mr-1 size-3" />
                            Reset site
                        </Button>
                    </footer>
                    <button
                        type="button"
                        onClick={handleRefreshFonts}
                        className="flex w-full items-center justify-center gap-1 border-t border-border/60 bg-muted/30 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <RefreshCw className="size-2.5" />
                        Refresh local fonts ({localFonts.length} cached)
                    </button>
                </>
            )}
        </div>
    )
}

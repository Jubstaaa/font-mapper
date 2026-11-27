import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import type { FontMap, FontMapping } from '@/lib/chrome-storage.types'

import { getFamilyVariants, type LocalFont } from '@/lib/chrome-fonts'
import {
    type ApplyMappingsResponse,
    type GetUsedFontsResponse,
    POPUP_PORT_NAME,
    type PortMessage,
    sendToTab,
} from '@/lib/chrome-messaging'
import {
    FONT_CACHE_VERSION,
    loadCachedLocalFonts,
    loadCachedLocalFontsVersion,
    loadMappingsForHost,
    saveMappingsForHost,
} from '@/lib/chrome-storage'
import { httpHostname } from '@/lib/page-host'

type PopupStatus =
    'loading' | 'no-script' | 'permission-required' | 'ready' | 'restricted'

const PERSIST_DEBOUNCE_MS = 200

export function usePopupController() {
    const [status, setStatus] = useState<PopupStatus>('loading')
    const [tabId, setTabId] = useState<null | number>(null)
    const [hostname, setHostname] = useState('')
    const [usedFonts, setUsedFonts] = useState<string[]>([])
    const [localFonts, setLocalFonts] = useState<LocalFont[]>([])
    const [mappings, setMappings] = useState<FontMap>({})
    const [cacheStale, setCacheStale] = useState(false)

    const portRef = useRef<chrome.runtime.Port | null>(null)
    const persistDebounced = useDebouncedCallback(
        (host: string, next: FontMap) => void saveMappingsForHost(host, next),
        PERSIST_DEBOUNCE_MS
    )

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

    const mappedCount = useMemo(() => Object.keys(mappings).length, [mappings])
    const totalCount = usedFonts.length
    const usedFontsSet = useMemo(() => new Set(usedFonts), [usedFonts])
    const allSources = useMemo(() => {
        const orphans = Object.keys(mappings)
            .filter(k => !usedFontsSet.has(k))
            .sort((a, b) => a.localeCompare(b))
        return [...usedFonts, ...orphans]
    }, [usedFonts, mappings, usedFontsSet])

    const persistNow = useCallback(
        async (host: string, next: FontMap) => {
            persistDebounced.cancel()
            await saveMappingsForHost(host, next)
        },
        [persistDebounced]
    )

    const sendApply = useCallback(
        (next: FontMap) => {
            if (tabId != null) {
                void sendToTab<ApplyMappingsResponse>(tabId, {
                    mappings: next,
                    type: 'APPLY_MAPPINGS',
                })
            }
        },
        [tabId]
    )

    const handleChange = useCallback(
        async (source: string, target: null | string) => {
            const next: FontMap =
                target === null
                    ? Object.fromEntries(
                          Object.entries(mappings).filter(
                              ([key]) => key !== source
                          )
                      )
                    : { ...mappings }
            if (target !== null) {
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
            sendApply(next)
        },
        [mappings, hostname, localFontIndex, persistNow, sendApply]
    )

    const patchMapping = useCallback(
        (source: string, patch: Partial<FontMapping>) => {
            const current = mappings[source]
            if (!current) return
            const next: FontMap = {
                ...mappings,
                [source]: { ...current, ...patch },
            }
            setMappings(next)
            sendApply(next)
            persistDebounced(hostname, next)
        },
        [mappings, hostname, persistDebounced, sendApply]
    )

    const handleScaleChange = useCallback(
        (source: string, scale: number) => {
            patchMapping(source, { scale: scale === 1 ? undefined : scale })
        },
        [patchMapping]
    )

    const handleStyleChange = useCallback(
        (source: string, style: { bold?: boolean; italic?: boolean }) => {
            patchMapping(source, {
                bold: style.bold ? true : undefined,
                italic: style.italic ? true : undefined,
            })
        },
        [patchMapping]
    )

    const handleLineHeightChange = useCallback(
        (source: string, value: number | undefined) => {
            patchMapping(source, { lineHeight: value })
        },
        [patchMapping]
    )

    const handleLetterSpacingChange = useCallback(
        (source: string, value: number | undefined) => {
            patchMapping(source, { letterSpacing: value })
        },
        [patchMapping]
    )

    const handleWordSpacingChange = useCallback(
        (source: string, value: number | undefined) => {
            patchMapping(source, { wordSpacing: value })
        },
        [patchMapping]
    )

    const handleColorChange = useCallback(
        (source: string, value: string | undefined) => {
            patchMapping(source, { color: value })
        },
        [patchMapping]
    )

    const handleHover = useCallback((source: string, hovering: boolean) => {
        const port = portRef.current
        if (!port) return
        try {
            const message: PortMessage = hovering
                ? { font: source, type: 'HIGHLIGHT_FONT' }
                : { type: 'CLEAR_HIGHLIGHT' }
            port.postMessage(message)
        } catch {}
    }, [])

    const handleReset = useCallback(async () => {
        setMappings({})
        await persistNow(hostname, {})
        sendApply({})
    }, [hostname, persistNow, sendApply])

    const handleReload = useCallback(() => {
        if (tabId != null) void chrome.tabs.reload(tabId)
        window.close()
    }, [tabId])

    const handleOpenOptions = useCallback(() => {
        void chrome.runtime.openOptionsPage()
        window.close()
    }, [])

    const handleRefreshFonts = useCallback(() => {
        void chrome.tabs.create({
            url: chrome.runtime.getURL('options.html?refresh=1'),
        })
        window.close()
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        const aborted = () => controller.signal.aborted
        void (async () => {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            })

            const tabHost = httpHostname(tab?.url)
            if (!tab?.id || !tabHost) {
                if (!aborted()) setStatus('restricted')
                return
            }

            const fonts = await loadCachedLocalFonts()
            if (aborted()) return

            if (!fonts.length) {
                setStatus('permission-required')
                return
            }

            const cachedVersion = await loadCachedLocalFontsVersion()
            if (aborted()) return
            setCacheStale(cachedVersion < FONT_CACHE_VERSION)

            const response = await sendToTab<GetUsedFontsResponse>(tab.id, {
                type: 'GET_USED_FONTS',
            })
            if (aborted()) return

            const host = response?.hostname || tabHost
            const saved = await loadMappingsForHost(host)
            if (aborted()) return

            setTabId(tab.id)
            setHostname(host)
            setLocalFonts(fonts)
            setMappings(saved)

            if (!response) {
                setStatus('no-script')
                return
            }

            setUsedFonts(response.fonts)
            setStatus('ready')
        })()
        return () => {
            controller.abort()
        }
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

    return {
        allSources,
        cacheStale,
        familyOptions,
        handleChange,
        handleColorChange,
        handleHover,
        handleLetterSpacingChange,
        handleLineHeightChange,
        handleOpenOptions,
        handleRefreshFonts,
        handleReload,
        handleReset,
        handleScaleChange,
        handleStyleChange,
        handleWordSpacingChange,
        hostname,
        localFontIndex,
        localFonts,
        mappedCount,
        mappings,
        status,
        totalCount,
        usedFonts,
        usedFontsSet,
    }
}

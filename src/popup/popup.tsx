import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, RotateCcw, Type } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { listLocalFonts } from '@/lib/chrome-fonts'
import {
    POPUP_PORT_NAME,
    sendToTab,
    type ApplyMappingsResponse,
    type GetUsedFontsResponse,
    type PortMessage,
} from '@/lib/chrome-messaging'
import { loadMappingsForHost, saveMappingsForHost, type FontMap } from '@/lib/chrome-storage'

import { FontMappingRow } from './font-mapping-row'
import { Logo } from './logo'
import type { PopupStatus } from './popup.types'

export function Popup() {
    // ━━━ 4. LOCAL STATE ━━━
    const [status, setStatus] = useState<PopupStatus>('loading')
    const [tabId, setTabId] = useState<number | null>(null)
    const [hostname, setHostname] = useState('')
    const [usedFonts, setUsedFonts] = useState<string[]>([])
    const [localFonts, setLocalFonts] = useState<string[]>([])
    const [mappings, setMappings] = useState<FontMap>({})

    const portRef = useRef<chrome.runtime.Port | null>(null)

    // ━━━ 6. DERIVED STATE ━━━
    const mappedCount = useMemo(() => Object.keys(mappings).length, [mappings])
    const totalCount = usedFonts.length

    // ━━━ 7. EVENT HANDLERS ━━━
    const handleChange = useCallback(
        async (source: string, target: string | null) => {
            const next: FontMap = { ...mappings }
            if (target === null) {
                delete next[source]
            } else {
                next[source] = target
            }
            setMappings(next)
            await saveMappingsForHost(hostname, next)
            if (tabId != null) {
                await sendToTab<ApplyMappingsResponse>(tabId, { type: 'APPLY_MAPPINGS', mappings: next })
            }
        },
        [mappings, hostname, tabId],
    )

    const handleHover = useCallback((source: string, hovering: boolean) => {
        const port = portRef.current
        if (!port) return
        try {
            const message: PortMessage = hovering
                ? { type: 'HIGHLIGHT_FONT', font: source }
                : { type: 'CLEAR_HIGHLIGHT' }
            port.postMessage(message)
        } catch {
            // port may have disconnected
        }
    }, [])

    const handleReset = useCallback(async () => {
        setMappings({})
        await saveMappingsForHost(hostname, {})
        if (tabId != null) {
            await sendToTab<ApplyMappingsResponse>(tabId, { type: 'APPLY_MAPPINGS', mappings: {} })
        }
    }, [hostname, tabId])

    const handleReload = useCallback(() => {
        if (tabId != null) chrome.tabs.reload(tabId)
        window.close()
    }, [tabId])

    // ━━━ 8. EFFECTS ━━━
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

            if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
                if (!cancelled) setStatus('restricted')
                return
            }

            const fonts = await listLocalFonts()
            const response = await sendToTab<GetUsedFontsResponse>(tab.id, { type: 'GET_USED_FONTS' })
            if (cancelled) return

            const host = response?.hostname || new URL(tab.url).hostname
            const saved = await loadMappingsForHost(host)
            if (cancelled) return

            setTabId(tab.id)
            setHostname(host)
            setLocalFonts(fonts.map(f => f.displayName))
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
                } catch {
                    // ignore
                }
                portRef.current = null
            }
        } catch {
            return
        }
    }, [tabId])

    // ━━━ 9. RETURN ━━━
    return (
        <div className="flex flex-col">
            <header className="border-b border-white/5 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 px-4 py-3.5 text-neutral-50">
                <div className="flex items-center gap-2.5">
                    <Logo className="size-6 shrink-0 rounded-md" />
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

                {status === 'ready' && totalCount === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 px-8 py-12 text-center text-muted-foreground">
                        <Type className="size-5" />
                        <p className="text-xs">No fonts detected on this page.</p>
                    </div>
                )}

                {status === 'ready' && totalCount > 0 && (
                    <ScrollArea className="h-[420px]">
                        <ul className="flex flex-col gap-1.5 p-3">
                            {usedFonts.map(font => (
                                <FontMappingRow
                                    key={font}
                                    source={font}
                                    mapped={mappings[font] ?? null}
                                    options={localFonts}
                                    onChange={value => handleChange(font, value)}
                                    onHover={hovering => handleHover(font, hovering)}
                                />
                            ))}
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
                </>
            )}
        </div>
    )
}

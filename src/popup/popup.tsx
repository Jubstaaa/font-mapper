import { Loader2, RefreshCw, RotateCcw, Type } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { getFamilyVariants } from '@/lib/chrome-fonts'

import { FontMappingRow } from './font-mapping-row'
import { usePopupController } from './popup.hooks'

export function Popup() {
    const {
        status,
        hostname,
        localFonts,
        mappings,
        cacheStale,
        familyOptions,
        localFontIndex,
        mappedCount,
        totalCount,
        usedFontsSet,
        allSources,
        handleChange,
        handleScaleChange,
        handleStyleChange,
        handleLineHeightChange,
        handleLetterSpacingChange,
        handleWordSpacingChange,
        handleColorChange,
        handleHover,
        handleReset,
        handleReload,
        handleOpenOptions,
        handleRefreshFonts,
    } = usePopupController()

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
                    {status === 'ready' && allSources.length > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-auto h-5 border-0 bg-white/10 px-1.5 text-[10px] font-medium text-white/85"
                        >
                            {mappedCount}/{allSources.length} mapped
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

                {status === 'ready' && allSources.length === 0 && (
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

                {status === 'ready' && allSources.length > 0 && (
                    <ScrollArea className="h-[420px]">
                        <ul className="flex flex-col gap-1.5 p-3">
                            {allSources.map(font => {
                                const mapping = mappings[font] ?? null
                                const sourceOnPage = usedFontsSet.has(font)
                                const targetAvailable = !mapping?.name || localFontIndex.has(mapping.name)
                                return (
                                    <FontMappingRow
                                        key={font}
                                        source={font}
                                        mapping={mapping}
                                        options={familyOptions}
                                        variants={mapping ? getFamilyVariants(mapping.name, localFonts) : null}
                                        sourceOnPage={sourceOnPage}
                                        targetAvailable={targetAvailable}
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

            {status === 'ready' && allSources.length > 0 && (
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

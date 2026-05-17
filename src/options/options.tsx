import { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, RefreshCw, ShieldAlert, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { isLocalFontsApiAvailable, listLocalFonts } from '@/lib/chrome-fonts'
import { loadCachedLocalFonts, saveCachedLocalFonts } from '@/lib/chrome-storage'

import '@/index.css'

type Status = 'checking' | 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

function Options() {
    const [status, setStatus] = useState<Status>('checking')
    const [fontCount, setFontCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleGrant = useCallback(async () => {
        setStatus('loading')
        setErrorMessage(null)
        try {
            const fonts = await listLocalFonts()
            await saveCachedLocalFonts(fonts)
            setFontCount(fonts.length)
            setStatus('granted')
        } catch (err) {
            setStatus('denied')
            setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
        }
    }, [])

    useEffect(() => {
        if (!isLocalFontsApiAvailable()) {
            setStatus('unsupported')
            return
        }
        const autoRefresh = new URLSearchParams(window.location.search).get('refresh') === '1'
        if (autoRefresh) {
            void handleGrant()
            return
        }
        loadCachedLocalFonts().then(cached => {
            if (cached.length) {
                setFontCount(cached.length)
                setStatus('granted')
            } else {
                setStatus('idle')
            }
        })
    }, [handleGrant])

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
            <div className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-12">
                <header className="flex flex-col items-center gap-4 text-center">
                    <img
                        src="/icon-128.png"
                        alt=""
                        className="size-16 rounded-2xl ring-1 ring-black/5 dark:ring-white/10"
                    />
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">FontMapper Settings</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Grant access to your local fonts so FontMapper can swap them on any site.
                        </p>
                    </div>
                </header>

                <main className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    {status === 'checking' && (
                        <p className="text-center text-sm text-muted-foreground">Checking permissions…</p>
                    )}

                    {status === 'unsupported' && (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <ShieldAlert className="size-8 text-destructive" />
                            <h2 className="text-base font-medium">Browser not supported</h2>
                            <p className="text-sm text-muted-foreground">
                                FontMapper needs the Local Font Access API, available in Chrome 103 or later. Please
                                update your browser.
                            </p>
                        </div>
                    )}

                    {status === 'idle' && (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <Sparkles className="size-8 text-primary" />
                            <h2 className="text-base font-medium">One-time font access</h2>
                            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                                Click below and Chrome will ask if FontMapper can view the fonts installed on your
                                computer. Nothing leaves your device — the list is cached locally so swaps are instant.
                            </p>
                            <Button onClick={handleGrant} size="lg" className="mt-2">
                                Grant font access
                            </Button>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <RefreshCw className="size-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Waiting for permission…</p>
                        </div>
                    )}

                    {status === 'granted' && (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Check className="size-5" />
                            </div>
                            <h2 className="text-base font-medium">You're all set</h2>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{fontCount}</span> local fonts cached.
                                Open the FontMapper popup on any site to start mapping.
                            </p>
                            <Button onClick={handleGrant} variant="outline" size="sm">
                                <RefreshCw className="mr-1.5 size-3.5" />
                                Refresh font list
                            </Button>
                        </div>
                    )}

                    {status === 'denied' && (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <X className="size-5" />
                            </div>
                            <h2 className="text-base font-medium">Permission not granted</h2>
                            <p className="text-sm text-muted-foreground">
                                FontMapper cannot read your local fonts without permission. Try again or check Chrome's
                                site settings.
                            </p>
                            {errorMessage && (
                                <code className="rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                                    {errorMessage}
                                </code>
                            )}
                            <Button onClick={handleGrant} size="sm">
                                Try again
                            </Button>
                        </div>
                    )}
                </main>

                <footer className="text-center text-[11px] text-muted-foreground">
                    Your font list is stored only in this browser via{' '}
                    <code className="font-mono">chrome.storage.local</code>.
                </footer>
            </div>
        </div>
    )
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')
createRoot(root).render(<Options />)

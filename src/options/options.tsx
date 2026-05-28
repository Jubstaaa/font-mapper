import { createRoot } from 'react-dom/client'
import { Check, Download, RefreshCw, ShieldAlert, Sparkles, Trash2, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { useBackupActions, useFontAccess } from './options.hooks'

import '@/index.css'

function Options() {
    const { status, fontCount, errorMessage, handleGrant } = useFontAccess()
    const { backupMessage, importInputRef, handleExport, handleImportFile, handleReset } = useBackupActions()

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

                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Download className="size-4 text-muted-foreground" />
                        <h2 className="text-base font-medium">Backup &amp; restore</h2>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                        Save your font mappings to a JSON file, move them to another computer, or wipe them clean.
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={handleExport} variant="outline" size="sm">
                                <Download className="mr-1.5 size-3.5" />
                                Export mappings
                            </Button>
                            <Button onClick={() => importInputRef.current?.click()} variant="outline" size="sm">
                                <Upload className="mr-1.5 size-3.5" />
                                Import mappings
                            </Button>
                        </div>
                        <Separator />
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            size="sm"
                            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/60"
                        >
                            <Trash2 className="mr-1.5 size-3.5" />
                            Clear all mappings
                        </Button>
                        <input
                            ref={importInputRef}
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={async e => {
                                const file = e.target.files?.[0]
                                if (file) await handleImportFile(file)
                                e.target.value = ''
                            }}
                        />
                    </div>
                    {backupMessage && (
                        <p
                            className={
                                backupMessage.tone === 'ok'
                                    ? 'mt-3 text-[11px] text-emerald-600 dark:text-emerald-400'
                                    : 'mt-3 text-[11px] text-destructive'
                            }
                        >
                            {backupMessage.text}
                        </p>
                    )}
                    <p className="mt-3 text-[11px] text-muted-foreground">
                        Import replaces all current mappings with the file's contents.
                    </p>
                </section>

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

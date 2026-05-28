import { useCallback, useEffect, useRef, useState } from 'react'

import { isLocalFontsApiAvailable, listLocalFonts } from '@/lib/chrome-fonts'
import {
    clearAllSettings,
    exportAllSettings,
    importAllSettings,
    loadCachedLocalFonts,
    saveCachedLocalFonts,
} from '@/lib/chrome-storage'

import type { BackupMessage, FontAccessStatus } from './options.types'

export function useFontAccess() {
    const [status, setStatus] = useState<FontAccessStatus>('checking')
    const [fontCount, setFontCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleGrant = useCallback(async () => {
        const isRefresh = status === 'granted'
        if (!isRefresh) setStatus('loading')
        setErrorMessage(null)
        try {
            const fonts = await listLocalFonts()
            await saveCachedLocalFonts(fonts)
            setFontCount(fonts.length)
            if (!isRefresh) setStatus('granted')
        } catch (err) {
            setStatus('denied')
            setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
        }
    }, [status])

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

    return { status, fontCount, errorMessage, handleGrant }
}

export function useBackupActions() {
    const [backupMessage, setBackupMessage] = useState<BackupMessage>(null)
    const importInputRef = useRef<HTMLInputElement | null>(null)

    const handleExport = useCallback(async () => {
        try {
            const payload = await exportAllSettings()
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const stamp = new Date().toISOString().slice(0, 10)
            a.href = url
            a.download = `fontmapper-mappings-${stamp}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            const hostCount = Object.keys(payload.mappings).length
            setBackupMessage({
                tone: 'ok',
                text: `Exported mappings for ${hostCount} site${hostCount === 1 ? '' : 's'}.`,
            })
        } catch (err) {
            setBackupMessage({ tone: 'err', text: err instanceof Error ? err.message : 'Export failed' })
        }
    }, [])

    const handleImportFile = useCallback(async (file: File) => {
        try {
            const text = await file.text()
            const result = await importAllSettings(text, 'replace')
            setBackupMessage({
                tone: 'ok',
                text: `Imported ${result.mappingCount} mapping${result.mappingCount === 1 ? '' : 's'} across ${result.hostCount} site${result.hostCount === 1 ? '' : 's'}.`,
            })
        } catch (err) {
            setBackupMessage({ tone: 'err', text: err instanceof Error ? err.message : 'Import failed' })
        }
    }, [])

    const handleReset = useCallback(async () => {
        if (!window.confirm('Delete all font mappings on every site? This cannot be undone.')) return
        try {
            await clearAllSettings()
            setBackupMessage({ tone: 'ok', text: 'All mappings cleared.' })
        } catch (err) {
            setBackupMessage({ tone: 'err', text: err instanceof Error ? err.message : 'Reset failed' })
        }
    }, [])

    return {
        backupMessage,
        importInputRef,
        handleExport,
        handleImportFile,
        handleReset,
    }
}

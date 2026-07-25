import { useCallback, useEffect, useRef, useState } from 'react'

import { countFamilies, isLocalFontsApiAvailable, listLocalFonts } from '@/lib/chrome-fonts'
import {
    clearAllSettings,
    exportAllSettings,
    importAllSettings,
    loadCachedLocalFonts,
    saveCachedLocalFonts,
} from '@/lib/chrome-storage'

import type { BackupMessage, FontAccessStatus } from './options.types'

function describeFontError(err: unknown): string {
    if (err instanceof DOMException && err.name === 'SecurityError') {
        return /activation/i.test(err.message)
            ? 'Chrome only reads local fonts right after a click. Use the button above.'
            : err.message
    }
    if (err instanceof Error && err.message === 'LOCAL_FONTS_API_UNAVAILABLE') {
        return 'This browser does not expose the Local Font Access API.'
    }
    return err instanceof Error ? err.message : 'Unknown error'
}

export function useFontAccess() {
    const [status, setStatus] = useState<FontAccessStatus>('checking')
    const [fontCount, setFontCount] = useState(0)
    const [familyCount, setFamilyCount] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleGrant = useCallback(async () => {
        const isRefresh = status === 'granted' || status === 'refresh-pending'
        if (!isRefresh) setStatus('loading')
        setErrorMessage(null)
        try {
            const fonts = await listLocalFonts()
            await saveCachedLocalFonts(fonts)
            setFontCount(fonts.length)
            setFamilyCount(countFamilies(fonts))
            setStatus('granted')
        } catch (err) {
            setStatus(isRefresh ? 'granted' : 'denied')
            setErrorMessage(describeFontError(err))
        }
    }, [status])

    useEffect(() => {
        if (!isLocalFontsApiAvailable()) {
            setStatus('unsupported')
            return
        }
        const wantsRefresh = new URLSearchParams(window.location.search).get('refresh') === '1'
        void loadCachedLocalFonts().then(cached => {
            setFontCount(cached.length)
            setFamilyCount(countFamilies(cached))
            if (!cached.length) {
                setStatus('idle')
                return
            }
            setStatus(wantsRefresh ? 'refresh-pending' : 'granted')
        })
    }, [])

    return { status, fontCount, familyCount, errorMessage, handleGrant }
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

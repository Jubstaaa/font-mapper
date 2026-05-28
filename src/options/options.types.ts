export type FontAccessStatus = 'checking' | 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export type BackupMessage = { tone: 'ok' | 'err'; text: string } | null

export type FontAccessStatus =
    | 'checking'
    | 'idle'
    | 'loading'
    | 'granted'
    | 'refresh-pending'
    | 'denied'
    | 'unsupported'

export type BackupMessage = { tone: 'ok' | 'err'; text: string } | null

import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseDebouncedTimerResult {
    schedule: (callback: () => void) => void
    cancel: () => void
}

export interface UseDebouncedCommitResult<TValue> {
    draft: TValue
    setDraft: (value: TValue) => void
    change: (value: TValue) => void
    commit: (value: TValue) => void
    cancel: () => void
}

export function useDebouncedTimer(delay: number): UseDebouncedTimerResult {
    const timerRef = useRef<number | null>(null)

    const cancel = useCallback(() => {
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const schedule = useCallback(
        (callback: () => void) => {
            cancel()
            timerRef.current = window.setTimeout(() => {
                timerRef.current = null
                callback()
            }, delay)
        },
        [delay, cancel],
    )

    return { schedule, cancel }
}

export function useDebouncedCommit<TValue>(
    persisted: TValue,
    onCommit: (value: TValue) => void,
    delay = 180,
): UseDebouncedCommitResult<TValue> {
    const [draft, setDraft] = useState(persisted)
    const { schedule, cancel } = useDebouncedTimer(delay)

    useEffect(() => {
        setDraft(persisted)
    }, [persisted])

    useEffect(() => cancel, [cancel])

    const change = useCallback(
        (value: TValue) => {
            setDraft(value)
            schedule(() => onCommit(value))
        },
        [onCommit, schedule],
    )

    const commit = useCallback(
        (value: TValue) => {
            cancel()
            onCommit(value)
        },
        [onCommit, cancel],
    )

    return { draft, setDraft, change, commit, cancel }
}

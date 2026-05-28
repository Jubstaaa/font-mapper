import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseDebouncedCommitResult<TValue> {
    draft: TValue
    setDraft: (value: TValue) => void
    change: (value: TValue) => void
    commit: (value: TValue) => void
    cancel: () => void
}

export function useDebouncedCommit<TValue>(
    persisted: TValue,
    onCommit: (value: TValue) => void,
    delay = 180,
): UseDebouncedCommitResult<TValue> {
    const [draft, setDraft] = useState(persisted)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        setDraft(persisted)
    }, [persisted])

    const cancel = useCallback(() => {
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    useEffect(() => cancel, [cancel])

    const change = useCallback(
        (value: TValue) => {
            setDraft(value)
            cancel()
            timerRef.current = window.setTimeout(() => {
                timerRef.current = null
                onCommit(value)
            }, delay)
        },
        [onCommit, delay, cancel],
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

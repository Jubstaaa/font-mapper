import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

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
    const [lastPersisted, setLastPersisted] = useState(persisted)
    const debouncedCommit = useDebouncedCallback(onCommit, delay)

    if (!Object.is(persisted, lastPersisted)) {
        setLastPersisted(persisted)
        setDraft(persisted)
    }

    const change = (value: TValue) => {
        setDraft(value)
        debouncedCommit(value)
    }

    const commit = (value: TValue) => {
        debouncedCommit.cancel()
        onCommit(value)
    }

    return { draft, setDraft, change, commit, cancel: debouncedCommit.cancel }
}

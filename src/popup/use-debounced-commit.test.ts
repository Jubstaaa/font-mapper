import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedCommit } from './use-debounced-commit'

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('useDebouncedCommit', () => {
    it('updates the draft immediately and commits the last value after the default delay', () => {
        const onCommit = vi.fn()
        const { result } = renderHook(() => useDebouncedCommit<number>(1, onCommit))

        act(() => result.current.change(2))
        act(() => result.current.change(3))
        expect(result.current.draft).toBe(3)
        expect(onCommit).not.toHaveBeenCalled()

        act(() => vi.advanceTimersByTime(180))
        expect(onCommit).toHaveBeenCalledExactlyOnceWith(3)
    })

    it('honors a custom delay', () => {
        const onCommit = vi.fn()
        const { result } = renderHook(() => useDebouncedCommit<string>('a', onCommit, 500))

        act(() => result.current.change('b'))
        act(() => vi.advanceTimersByTime(499))
        expect(onCommit).not.toHaveBeenCalled()
        act(() => vi.advanceTimersByTime(1))
        expect(onCommit).toHaveBeenCalledExactlyOnceWith('b')
    })

    it('commit flushes immediately and drops the pending change', () => {
        const onCommit = vi.fn()
        const { result } = renderHook(() => useDebouncedCommit<number>(1, onCommit))

        act(() => result.current.change(2))
        act(() => result.current.commit(5))
        act(() => vi.runAllTimers())

        expect(onCommit).toHaveBeenCalledExactlyOnceWith(5)
    })

    it('cancel drops the pending change but keeps the draft', () => {
        const onCommit = vi.fn()
        const { result } = renderHook(() => useDebouncedCommit<number>(1, onCommit))

        act(() => result.current.change(2))
        act(() => result.current.cancel())
        act(() => vi.runAllTimers())

        expect(onCommit).not.toHaveBeenCalled()
        expect(result.current.draft).toBe(2)
    })

    it('setDraft changes the draft without committing', () => {
        const onCommit = vi.fn()
        const { result } = renderHook(() => useDebouncedCommit<number>(1, onCommit))

        act(() => result.current.setDraft(9))
        act(() => vi.runAllTimers())

        expect(result.current.draft).toBe(9)
        expect(onCommit).not.toHaveBeenCalled()
    })

    it('resyncs the draft when the persisted value changes', () => {
        const onCommit = vi.fn()
        const { result, rerender } = renderHook(({ persisted }) => useDebouncedCommit(persisted, onCommit), {
            initialProps: { persisted: 1 },
        })

        act(() => result.current.setDraft(2))
        rerender({ persisted: 7 })

        expect(result.current.draft).toBe(7)
    })

    it('cancels the pending commit on unmount', () => {
        const onCommit = vi.fn()
        const { result, unmount } = renderHook(() => useDebouncedCommit<number>(1, onCommit))

        act(() => result.current.change(2))
        unmount()
        vi.runAllTimers()

        expect(onCommit).not.toHaveBeenCalled()
    })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAllOverrides, hasMappings, walkAll } from './element-override'
import { onResize } from './observers'

vi.mock('./element-override', () => ({
    applyToElement: vi.fn(),
    clearAllOverrides: vi.fn(),
    hasMappings: vi.fn(() => true),
    walkAll: vi.fn(),
}))

beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('onResize', () => {
    it('re-applies overrides once, 200 ms after a burst of resize events', () => {
        onResize()
        vi.advanceTimersByTime(150)
        onResize()
        vi.advanceTimersByTime(199)
        expect(walkAll).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(clearAllOverrides).toHaveBeenCalledOnce()
        expect(walkAll).toHaveBeenCalledOnce()
    })

    it('does nothing when the page has no mappings', () => {
        vi.mocked(hasMappings).mockReturnValueOnce(false)

        onResize()
        vi.advanceTimersByTime(200)

        expect(walkAll).not.toHaveBeenCalled()
    })
})

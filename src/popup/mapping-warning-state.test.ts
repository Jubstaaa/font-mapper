import { describe, expect, it } from 'vitest'

import { deriveMappingWarning } from './mapping-warning-state'

describe('deriveMappingWarning', () => {
    it('marks a mapping whose source font is not on the page as orphan', () => {
        expect(deriveMappingWarning({ sourceOnPage: false, targetAvailable: true, mappedName: 'Inter' })?.kind).toBe(
            'orphan',
        )
    })

    it('marks a mapping whose target font is not installed as missing', () => {
        const warning = deriveMappingWarning({ sourceOnPage: true, targetAvailable: false, mappedName: 'Inter' })
        expect(warning?.kind).toBe('missing')
        expect(warning?.tooltip).toContain('"Inter"')
    })

    it('reports nothing for a healthy or unmapped row', () => {
        expect(deriveMappingWarning({ sourceOnPage: true, targetAvailable: true, mappedName: 'Inter' })).toBeNull()
        expect(deriveMappingWarning({ sourceOnPage: true, targetAvailable: false, mappedName: null })).toBeNull()
    })
})

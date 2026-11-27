import { describe, expect, it } from 'vitest'

import { deriveMappingWarning } from './mapping-warning-state'

describe('deriveMappingWarning', () => {
    it('marks a mapping whose source font is not on the page as orphan', () => {
        expect(
            deriveMappingWarning({
                mappedName: 'Inter',
                sourceOnPage: false,
                targetAvailable: true,
            })?.kind
        ).toBe('orphan')
    })

    it('marks a mapping whose target font is not installed as missing', () => {
        const warning = deriveMappingWarning({
            mappedName: 'Inter',
            sourceOnPage: true,
            targetAvailable: false,
        })
        expect(warning?.kind).toBe('missing')
        expect(warning?.tooltip).toContain('"Inter"')
    })

    it('reports nothing for a healthy or unmapped row', () => {
        expect(
            deriveMappingWarning({
                mappedName: 'Inter',
                sourceOnPage: true,
                targetAvailable: true,
            })
        ).toBeNull()
        expect(
            deriveMappingWarning({
                mappedName: null,
                sourceOnPage: true,
                targetAvailable: false,
            })
        ).toBeNull()
    })
})

import { describe, expect, it } from 'vitest'

import { quoteFamily } from './font-family'

describe('quoteFamily', () => {
    it('leaves plain identifiers unquoted', () => {
        expect(quoteFamily('Arial')).toBe('Arial')
        expect(quoteFamily('Inter-Var')).toBe('Inter-Var')
        expect(quoteFamily('_Private_Font')).toBe('_Private_Font')
    })

    it('quotes names that are not valid identifiers', () => {
        expect(quoteFamily('Times New Roman')).toBe('"Times New Roman"')
        expect(quoteFamily('3Dumb')).toBe('"3Dumb"')
        expect(quoteFamily('Font.Name')).toBe('"Font.Name"')
        expect(quoteFamily('')).toBe('""')
    })

    it('escapes backslashes and double quotes', () => {
        expect(quoteFamily('Foo\\Bar')).toBe('"Foo\\\\Bar"')
        expect(quoteFamily('It\'s "Q"')).toBe('"It\'s \\"Q\\""')
    })

    it('quotes generic keywords so they resolve as literal family names', () => {
        expect(quoteFamily('serif')).toBe('"serif"')
        expect(quoteFamily('Monospace')).toBe('"Monospace"')
        expect(quoteFamily('system-ui')).toBe('"system-ui"')
        expect(quoteFamily('BlinkMacSystemFont')).toBe('"BlinkMacSystemFont"')
        expect(quoteFamily('-apple-system')).toBe('"-apple-system"')
    })

    it('quotes CSS-wide keywords (unquoted `inherit` is not a family name)', () => {
        expect(quoteFamily('inherit')).toBe('"inherit"')
    })
})

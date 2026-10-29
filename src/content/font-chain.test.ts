import { describe, expect, it } from 'vitest'

import type { FontMapping } from '@/lib/chrome-storage'

import { matchChain, parseFontFamilyChain, pickPickerName } from './font-chain'

describe('parseFontFamilyChain', () => {
    it('splits unquoted and quoted families', () => {
        expect(parseFontFamilyChain('Arial, "Helvetica Neue", \'Open Sans\', sans-serif'))
            .toEqual(['Arial', 'Helvetica Neue', 'Open Sans', 'sans-serif'])
    })

    it('trims surrounding whitespace and keeps inner spaces of unquoted names', () => {
        expect(parseFontFamilyChain('  Times New Roman ,\n\tserif  ')).toEqual(['Times New Roman', 'serif'])
    })

    it('keeps commas inside quotes', () => {
        expect(parseFontFamilyChain('"Foo, Bar", baz')).toEqual(['Foo, Bar', 'baz'])
    })

    it('treats the other quote char as literal inside a quoted name', () => {
        expect(parseFontFamilyChain('"It\'s", \'Say "hi"\'')).toEqual(['It\'s', 'Say "hi"'])
    })

    it('unescapes backslash sequences inside quotes', () => {
        expect(parseFontFamilyChain('"Foo\\"Bar", "A\\\\B"')).toEqual(['Foo"Bar', 'A\\B'])
    })

    it('round-trips quoteFamily output', () => {
        expect(parseFontFamilyChain('"Foo\\\\Bar", "It\'s \\"Q\\""')).toEqual(['Foo\\Bar', 'It\'s "Q"'])
    })

    it('drops empty entries', () => {
        expect(parseFontFamilyChain('')).toEqual([])
        expect(parseFontFamilyChain(' , ,, ')).toEqual([])
        expect(parseFontFamilyChain('"", Arial')).toEqual(['Arial'])
    })

    it('reads an unterminated quote to the end', () => {
        expect(parseFontFamilyChain('"Foo, Bar')).toEqual(['Foo, Bar'])
    })

    it('collapses whitespace runs in unquoted names, per CSS', () => {
        expect(parseFontFamilyChain('Times   New  Roman')).toEqual(['Times New Roman'])
    })
})

describe('matchChain', () => {
    const inter: FontMapping = { name: 'Inter' }
    const mono: FontMapping = { name: 'JetBrains Mono' }
    const lookup = new Map([
        ['helvetica', inter],
        ['menlo', mono],
    ])

    it('returns the first mapped family, case-insensitively', () => {
        expect(matchChain(['Unknown', 'Menlo', 'Helvetica'], lookup)).toEqual({ sourceKey: 'menlo', mapping: mono })
        expect(matchChain(['HELVETICA'], lookup)).toEqual({ sourceKey: 'helvetica', mapping: inter })
    })

    it('skips CSS-wide keywords even when mapped', () => {
        const withKeyword = new Map([['inherit', inter]])
        expect(matchChain(['inherit', 'Initial'], withKeyword)).toBeNull()
    })

    it('returns null when nothing matches', () => {
        expect(matchChain([], lookup)).toBeNull()
        expect(matchChain(['Arial', 'sans-serif'], lookup)).toBeNull()
    })
})

describe('pickPickerName', () => {
    it('trims and strips surrounding quotes', () => {
        expect(pickPickerName('  "Helvetica Neue" ')).toBe('Helvetica Neue')
        expect(pickPickerName('\'Open Sans\'')).toBe('Open Sans')
        expect(pickPickerName('Arial')).toBe('Arial')
    })

    it('returns null for empty values and CSS-wide keywords', () => {
        expect(pickPickerName('')).toBeNull()
        expect(pickPickerName('   ')).toBeNull()
        expect(pickPickerName('""')).toBeNull()
        expect(pickPickerName('Inherit')).toBeNull()
        expect(pickPickerName('revert-layer')).toBeNull()
    })

    it('keeps generic families, which the caller filters separately', () => {
        expect(pickPickerName('sans-serif')).toBe('sans-serif')
    })
})

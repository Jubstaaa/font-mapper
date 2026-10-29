import { afterEach, describe, expect, it, vi } from 'vitest'

import {
    countFamilies,
    getFamilyVariants,
    isLocalFontsApiAvailable,
    isMappingInstalledLocally,
    listLocalFonts,
} from './chrome-fonts'
import type { LocalFont } from './chrome-fonts'

function font(family: string, style: string, fullName = `${family} ${style}`): LocalFont {
    return { family, fullName, postscriptName: `${family}-${style}`.replace(/\s+/g, ''), style }
}

describe('isMappingInstalledLocally', () => {
    const fonts = [font('Inter', 'Regular'), font('Fira Code', 'Bold', 'Fira Code Bold')]

    it('matches by family name', () => {
        expect(isMappingInstalledLocally({ name: 'Inter' }, fonts)).toBe(true)
    })

    it('matches by postscript id', () => {
        expect(isMappingInstalledLocally({ name: 'Renamed', id: 'FiraCode-Bold' }, fonts)).toBe(true)
    })

    it('matches by full name', () => {
        expect(isMappingInstalledLocally({ name: 'Fira Code Bold' }, fonts)).toBe(true)
    })

    it('is case-sensitive and ignores an empty id', () => {
        expect(isMappingInstalledLocally({ name: 'inter' }, fonts)).toBe(false)
        expect(isMappingInstalledLocally({ name: 'Missing', id: '' }, [{ ...fonts[0], postscriptName: '' }])).toBe(false)
    })

    it('returns false for no fonts', () => {
        expect(isMappingInstalledLocally({ name: 'Inter' }, [])).toBe(false)
    })
})

describe('countFamilies', () => {
    it('counts distinct families', () => {
        expect(countFamilies([font('Inter', 'Regular'), font('Inter', 'Bold'), font('Roboto', 'Regular')])).toBe(2)
        expect(countFamilies([])).toBe(0)
    })
})

describe('getFamilyVariants', () => {
    it('picks regular, bold, italic and bold italic faces', () => {
        const fonts = [
            font('Inter', 'Bold Italic'),
            font('Inter', 'Semibold'),
            font('Inter', 'Italic'),
            font('Inter', 'Extra Bold'),
            font('Inter', 'Bold'),
            font('Inter', 'Regular'),
            font('Roboto', 'Regular'),
        ]

        expect(getFamilyVariants('Inter', fonts)).toEqual({
            regular: fonts[5],
            bold: fonts[4],
            italic: fonts[2],
            boldItalic: fonts[0],
        })
    })

    it('treats oblique as italic and book/roman as regular', () => {
        const fonts = [font('Old', 'Oblique'), font('Old', 'Book')]

        expect(getFamilyVariants('Old', fonts)).toMatchObject({ regular: fonts[1], italic: fonts[0] })
    })

    it('falls back to the closest weight when no regular face exists', () => {
        const fonts = [font('Thin', 'Bold'), font('Thin', 'Light'), font('Thin', 'Medium')]

        expect(getFamilyVariants('Thin', fonts).regular).toBe(fonts[2])
    })

    it('returns all nulls for an unknown family', () => {
        expect(getFamilyVariants('Nope', [font('Inter', 'Regular')])).toEqual({
            regular: null,
            bold: null,
            italic: null,
            boldItalic: null,
        })
    })
})

describe('listLocalFonts', () => {
    afterEach(() => {
        delete window.queryLocalFonts
    })

    it('throws when the Local Font Access API is missing', async () => {
        expect(isLocalFontsApiAvailable()).toBe(false)
        await expect(listLocalFonts()).rejects.toThrow('LOCAL_FONTS_API_UNAVAILABLE')
    })

    it('sorts by family, then regular-ish faces first', async () => {
        window.queryLocalFonts = vi.fn().mockResolvedValue([
            { ...font('Roboto', 'Bold'), extra: true },
            font('Inter', 'Light'),
            font('Inter', 'Regular'),
            font('Inter', 'Book'),
        ])

        expect(isLocalFontsApiAvailable()).toBe(true)
        expect(await listLocalFonts()).toEqual([
            font('Inter', 'Regular'),
            font('Inter', 'Book'),
            font('Inter', 'Light'),
            font('Roboto', 'Bold'),
        ])
    })
})

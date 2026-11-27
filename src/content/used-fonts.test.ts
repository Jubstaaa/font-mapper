import { afterEach, describe, expect, it } from 'vitest'

import { collectUsedFonts, getCachedFontElements } from './used-fonts'

afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
})

describe('collectUsedFonts', () => {
    it('lists the first named family of each element, or its last generic keyword', () => {
        document.body.style.fontFamily = 'sans-serif'
        document.body.innerHTML = `
            <p id="a" style="font-family: 'Helvetica Neue', Arial, sans-serif">a</p>
            <code id="b" style="font-family: ui-monospace, monospace">b</code>
            <span id="c" style="font-family: inherit">c</span>
        `

        expect(collectUsedFonts()).toEqual([
            'Helvetica Neue',
            'monospace',
            'sans-serif',
        ])
    })

    it('indexes elements by font for hover highlighting', () => {
        document.body.innerHTML = `<p id="a" style="font-family: Inter">a</p>`

        collectUsedFonts()

        expect(
            getCachedFontElements('Inter')?.map(ref => ref.deref()?.id)
        ).toEqual(['a'])
    })
})

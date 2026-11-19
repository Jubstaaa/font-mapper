import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FontMapping } from '@/lib/chrome-storage.types'

import { FontMappingRow } from './font-mapping-row'

afterEach(cleanup)

const inter = { family: 'Inter', fullName: 'Inter', postscriptName: 'Inter-Regular', style: 'Regular' }
const interBold = { ...inter, postscriptName: 'Inter-Bold', style: 'Bold' }

function renderRow(mapping: FontMapping, onStyleChange = vi.fn(), sourceOnPage = true) {
    render(
        <FontMappingRow
            source="Arial"
            mapping={mapping}
            options={['Inter']}
            variants={{ regular: inter, bold: interBold, italic: null, boldItalic: null }}
            sourceOnPage={sourceOnPage}
            targetAvailable
            onChange={vi.fn()}
            onScaleChange={vi.fn()}
            onStyleChange={onStyleChange}
            onLineHeightChange={vi.fn()}
            onLetterSpacingChange={vi.fn()}
            onWordSpacingChange={vi.fn()}
            onColorChange={vi.fn()}
            onHover={vi.fn()}
        />,
    )
    return { onStyleChange }
}

describe('FontMappingRow', () => {
    it('toggles bold through a pressed-state control and disables unavailable styles', () => {
        const { onStyleChange } = renderRow({ name: 'Inter' })

        const bold = screen.getByRole('button', { name: 'Bold' })
        expect(bold.getAttribute('aria-pressed')).toBe('false')
        fireEvent.click(bold)
        expect(onStyleChange).toHaveBeenCalledWith({ bold: true, italic: false })

        expect((screen.getByRole('button', { name: 'Italic' }) as HTMLButtonElement).disabled).toBe(true)
    })

    it('announces when collapsed advanced settings hold overrides', () => {
        renderRow({ name: 'Inter', lineHeight: 1.8 })

        const advanced = screen.getByRole('button', { name: 'Advanced (overrides set)' })
        expect(advanced.getAttribute('aria-expanded')).toBe('false')

        fireEvent.click(advanced)
        expect(screen.getByRole('slider', { name: 'Line' })).toBeTruthy()
        expect(screen.getByLabelText('Text color')).toBeTruthy()
    })

    it('names the font picker after the source font it replaces', () => {
        renderRow({ name: 'Inter' })

        expect(screen.getByRole('combobox', { name: 'Replacement font for Arial' }).textContent).toContain('Inter')
    })

    it('takes the controls of a mapping dormant on this page out of the tab order and the accessibility tree', () => {
        renderRow({ name: 'Inter' }, vi.fn(), false)

        for (const name of ['Replacement font for Arial', 'Clear mapping', 'Bold']) {
            const control = screen.getByRole(name.startsWith('Replacement') ? 'combobox' : 'button', { name })
            expect(control.closest('[inert]'), name).not.toBeNull()
        }
        expect(screen.getByRole('slider', { name: 'Scale' }).closest('[inert]')).not.toBeNull()
        expect(screen.getByText('Not used on this page').closest('[inert]')).toBeNull()
    })
})

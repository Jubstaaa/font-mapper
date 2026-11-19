import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MappingWarning } from './mapping-warning'

afterEach(cleanup)

describe('MappingWarning', () => {
    it('can be reached with the keyboard and explains itself on focus', async () => {
        render(<MappingWarning kind="missing" label="Target font missing" tooltip="Install it locally." />)

        const trigger = screen.getByText('Target font missing').closest('[data-slot="tooltip-trigger"]') as HTMLElement
        expect(trigger.tabIndex).toBe(0)

        fireEvent.focus(trigger)
        expect((await screen.findByRole('tooltip')).textContent).toContain('Install it locally.')
    })
})

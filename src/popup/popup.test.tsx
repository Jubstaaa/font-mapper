import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Popup } from './popup'

afterEach(cleanup)

describe('Popup header', () => {
    it('does not announce the product name twice', async () => {
        render(<Popup />)

        expect(screen.getByRole('heading', { level: 1, name: 'FontMapper' })).toBeTruthy()
        expect(screen.queryByRole('img', { name: 'FontMapper' })).toBeNull()
    })
})

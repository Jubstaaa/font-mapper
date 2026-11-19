import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'

import { LabeledSlider } from './labeled-slider'

afterEach(cleanup)

const noop = () => {}

describe('LabeledSlider', () => {
    it('names the slider after its visible label', () => {
        render(
            <LabeledSlider
                label="Scale"
                min={0.5}
                max={2}
                step={0.05}
                defaultValue={1}
                persistedValue={1.2}
                formatValue={v => `${Math.round(v * 100)}%`}
                onCommit={noop}
                onReset={noop}
            />,
        )

        expect(screen.getByRole('slider', { name: 'Scale' }).getAttribute('aria-valuenow')).toBe('1.2')
    })
})

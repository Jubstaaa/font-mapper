import { render, screen } from '@testing-library/react'
import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LabeledSlider } from './labeled-slider'

afterEach(cleanup)

const noop = () => {}

describe('LabeledSlider', () => {
    it('names the slider after its visible label', () => {
        render(
            <LabeledSlider
                defaultValue={1}
                formatValue={v => `${Math.round(v * 100)}%`}
                label="Scale"
                max={2}
                min={0.5}
                onCommit={noop}
                onReset={noop}
                persistedValue={1.2}
                step={0.05}
            />
        )

        expect(
            screen
                .getByRole('slider', { name: 'Scale' })
                .getAttribute('aria-valuenow')
        ).toBe('1.2')
    })
})

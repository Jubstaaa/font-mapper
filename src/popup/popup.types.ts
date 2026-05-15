import type { FontMapping } from '@/lib/chrome-storage'

export type PopupStatus = 'loading' | 'restricted' | 'no-script' | 'ready'

export interface FontMappingRowProps {
    source: string
    mapping: FontMapping | null
    options: string[]
    onChange: (value: string | null) => void
    onScaleChange: (scale: number) => void
    onHover: (hovering: boolean) => void
}

export interface FontComboboxProps {
    value: string | null
    options: string[]
    placeholder?: string
    onSelect: (value: string | null) => void
}

import type { LocalFontFamilyVariants } from '@/lib/chrome-fonts'
import type { FontMapping } from '@/lib/chrome-storage'

export type PopupStatus =
    | 'loading'
    | 'restricted'
    | 'no-script'
    | 'permission-required'
    | 'ready'

export interface FontMappingRowProps {
    source: string
    mapping: FontMapping | null
    options: string[]
    variants: LocalFontFamilyVariants | null
    onChange: (value: string | null) => void
    onScaleChange: (scale: number) => void
    onStyleChange: (style: { bold?: boolean; italic?: boolean }) => void
    onHover: (hovering: boolean) => void
}

export interface FontComboboxProps {
    value: string | null
    options: string[]
    placeholder?: string
    onSelect: (value: string | null) => void
}

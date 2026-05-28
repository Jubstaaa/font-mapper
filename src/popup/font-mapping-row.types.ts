import type { LocalFontFamilyVariants } from '@/lib/chrome-fonts'
import type { FontMapping } from '@/lib/chrome-storage'

export interface FontMappingRowProps {
    source: string
    mapping: FontMapping | null
    options: string[]
    variants: LocalFontFamilyVariants | null
    sourceOnPage: boolean
    targetAvailable: boolean
    onChange: (value: string | null) => void
    onScaleChange: (scale: number) => void
    onStyleChange: (style: { bold?: boolean; italic?: boolean }) => void
    onLineHeightChange: (value: number | undefined) => void
    onLetterSpacingChange: (value: number | undefined) => void
    onWordSpacingChange: (value: number | undefined) => void
    onColorChange: (value: string | undefined) => void
    onHover: (hovering: boolean) => void
}

export type PopupStatus = 'loading' | 'restricted' | 'no-script' | 'ready'

export interface FontMappingRowProps {
    source: string
    mapped: string | null
    options: string[]
    onChange: (value: string | null) => void
}

export interface FontComboboxProps {
    value: string | null
    options: string[]
    placeholder?: string
    onSelect: (value: string | null) => void
}

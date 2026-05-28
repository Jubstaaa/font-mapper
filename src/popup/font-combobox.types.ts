export interface FontComboboxProps {
    value: string | null
    options: string[]
    placeholder?: string
    onSelect: (value: string | null) => void
}

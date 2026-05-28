import { Bold, Italic } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StyleToggleProps {
    icon: typeof Bold
    label: string
    active: boolean
    available: boolean
    unavailableHint: string
    onClick: () => void
}

function StyleToggle({ icon: Icon, label, active, available, unavailableHint, onClick }: StyleToggleProps) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            disabled={!available}
            title={available ? label : unavailableHint}
            onClick={onClick}
            className={cn(
                'flex size-6 items-center justify-center rounded-sm border text-foreground transition-colors',
                active
                    ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-border bg-background hover:bg-accent',
                !available && 'pointer-events-none opacity-40',
            )}
        >
            <Icon className="size-3" />
        </button>
    )
}

interface StyleTogglesProps {
    boldActive: boolean
    italicActive: boolean
    boldAvailable: boolean
    italicAvailable: boolean
    mappedName: string
    inert: boolean
    onChange: (next: { bold: boolean; italic: boolean }) => void
}

export function StyleToggles({
    boldActive,
    italicActive,
    boldAvailable,
    italicAvailable,
    mappedName,
    inert,
    onChange,
}: StyleTogglesProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5',
                inert && 'pointer-events-none opacity-50',
            )}
        >
            <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Style
            </span>
            <div className="flex items-center gap-1">
                <StyleToggle
                    icon={Bold}
                    label="Bold"
                    active={boldActive}
                    available={boldAvailable}
                    unavailableHint={`No bold variant available for ${mappedName}`}
                    onClick={() => onChange({ bold: !boldActive, italic: italicActive })}
                />
                <StyleToggle
                    icon={Italic}
                    label="Italic"
                    active={italicActive}
                    available={italicAvailable}
                    unavailableHint={`No italic variant available for ${mappedName}`}
                    onClick={() => onChange({ bold: boldActive, italic: !italicActive })}
                />
            </div>
        </div>
    )
}

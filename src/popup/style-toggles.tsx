import { Bold, Italic } from 'lucide-react'

import { Toggle } from '@/components/ui/toggle'
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
        <Toggle
            variant="outline"
            aria-label={label}
            pressed={active}
            onPressedChange={onClick}
            disabled={!available}
            title={available ? label : unavailableHint}
            className="size-6 min-w-6 rounded-sm px-0 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
        >
            <Icon className="size-3" />
        </Toggle>
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
            inert={inert}
            className={cn('flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5', inert && 'opacity-70')}
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

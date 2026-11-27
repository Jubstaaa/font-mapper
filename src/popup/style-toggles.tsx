import { Bold, Italic } from 'lucide-react'

import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

interface StyleToggleProps {
    active: boolean
    available: boolean
    icon: typeof Bold
    label: string
    onClick: () => void
    unavailableHint: string
}

interface StyleTogglesProps {
    boldActive: boolean
    boldAvailable: boolean
    inert: boolean
    italicActive: boolean
    italicAvailable: boolean
    mappedName: string
    onChange: (next: { bold: boolean; italic: boolean }) => void
}

export function StyleToggles({
    boldActive,
    boldAvailable,
    inert,
    italicActive,
    italicAvailable,
    mappedName,
    onChange,
}: StyleTogglesProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 border-t border-primary/15 px-2.5 py-1.5',
                inert && 'opacity-70'
            )}
            inert={inert}>
            <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Style
            </span>
            <div className="flex items-center gap-1">
                <StyleToggle
                    active={boldActive}
                    available={boldAvailable}
                    icon={Bold}
                    label="Bold"
                    onClick={() => {
                        onChange({ bold: !boldActive, italic: italicActive })
                    }}
                    unavailableHint={`No bold variant available for ${mappedName}`}
                />
                <StyleToggle
                    active={italicActive}
                    available={italicAvailable}
                    icon={Italic}
                    label="Italic"
                    onClick={() => {
                        onChange({ bold: boldActive, italic: !italicActive })
                    }}
                    unavailableHint={`No italic variant available for ${mappedName}`}
                />
            </div>
        </div>
    )
}

function StyleToggle({
    active,
    available,
    icon: Icon,
    label,
    onClick,
    unavailableHint,
}: StyleToggleProps) {
    return (
        <Toggle
            aria-label={label}
            className="size-6 min-w-6 rounded-sm px-0 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
            disabled={!available}
            onPressedChange={onClick}
            pressed={active}
            title={available ? label : unavailableHint}
            variant="outline">
            <Icon className="size-3" />
        </Toggle>
    )
}

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { quoteFamily } from '@/lib/font-family'
import { cn } from '@/lib/utils'

interface FontComboboxProps {
    label: string
    value: string | null
    options: string[]
    placeholder?: string
    onSelect: (value: string | null) => void
}

export function FontCombobox({
    label,
    value,
    options,
    placeholder = 'Map to local font…',
    onSelect,
}: FontComboboxProps) {
    const [open, setOpen] = useState(false)

    return (
        <div className="flex w-full min-w-0 items-center gap-1">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-label={label}
                        aria-expanded={open}
                        className={cn(
                            'h-8 min-w-0 flex-1 justify-between gap-1 px-2.5 text-xs font-normal',
                            !value && 'text-muted-foreground',
                        )}
                    >
                        <span
                            className="min-w-0 flex-1 truncate text-left"
                            style={value ? { fontFamily: `${quoteFamily(value)}, sans-serif` } : undefined}
                        >
                            {value || placeholder}
                        </span>
                        {!value && <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end" sideOffset={4}>
                    <Command>
                        <CommandInput placeholder="Search fonts…" className="h-9" />
                        <CommandList className="max-h-[220px]">
                            <CommandEmpty>No matching font.</CommandEmpty>
                            <CommandGroup>
                                {options.map(opt => (
                                    <CommandItem
                                        key={opt}
                                        value={opt}
                                        onSelect={() => {
                                            onSelect(opt === value ? null : opt)
                                            setOpen(false)
                                        }}
                                        className="text-xs"
                                        style={{ fontFamily: `${quoteFamily(opt)}, sans-serif` }}
                                    >
                                        <span className="min-w-0 flex-1 truncate">{opt}</span>
                                        <Check
                                            className={cn(
                                                'ml-auto size-3.5 shrink-0',
                                                value === opt ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Clear mapping"
                    onClick={() => onSelect(null)}
                    className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                >
                    <X className="size-3" />
                </Button>
            )}
        </div>
    )
}

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import type { FontComboboxProps } from './popup.types'

function escapeFontName(name: string): string {
    return name.replace(/'/g, "\\'")
}

export function FontCombobox({ value, options, placeholder = 'Map to local font…', onSelect }: FontComboboxProps) {
    const [open, setOpen] = useState(false)

    return (
        <div className="relative w-full min-w-0">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            'h-8 w-full min-w-0 justify-between gap-1 px-2.5 pr-7 text-xs font-normal',
                            !value && 'text-muted-foreground',
                        )}
                    >
                        <span
                            className="min-w-0 flex-1 truncate text-left"
                            style={value ? { fontFamily: `'${escapeFontName(value)}', sans-serif` } : undefined}
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
                                        style={{ fontFamily: `'${escapeFontName(opt)}', sans-serif` }}
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
                <button
                    type="button"
                    aria-label="Clear mapping"
                    onClick={e => {
                        e.stopPropagation()
                        onSelect(null)
                    }}
                    onPointerDown={e => e.stopPropagation()}
                    className="absolute right-1.5 top-1/2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-accent hover:text-foreground"
                >
                    <X className="size-3" />
                </button>
            )}
        </div>
    )
}

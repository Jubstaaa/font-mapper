import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { quoteFamily } from '@/lib/font-family'
import { cn } from '@/lib/utils'

interface FontComboboxProps {
    label: string
    onSelect: (value: null | string) => void
    options: string[]
    placeholder?: string
    value: null | string
}

export function FontCombobox({
    label,
    onSelect,
    options,
    placeholder = 'Map to local font…',
    value,
}: FontComboboxProps) {
    const [open, setOpen] = useState(false)

    return (
        <div className="flex w-full min-w-0 items-center gap-1">
            <Popover onOpenChange={setOpen} open={open}>
                <PopoverTrigger asChild>
                    <Button
                        aria-expanded={open}
                        aria-label={label}
                        className={cn(
                            'h-8 min-w-0 flex-1 justify-between gap-1 px-2.5 text-xs font-normal',
                            !value && 'text-muted-foreground'
                        )}
                        role="combobox"
                        variant="outline">
                        <span
                            className="min-w-0 flex-1 truncate text-left"
                            style={
                                value
                                    ? {
                                          fontFamily: `${quoteFamily(value)}, sans-serif`,
                                      }
                                    : undefined
                            }>
                            {value || placeholder}
                        </span>
                        {!value && (
                            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="end"
                    className="w-[260px] p-0"
                    sideOffset={4}>
                    <Command>
                        <CommandInput
                            className="h-9"
                            placeholder="Search fonts…"
                        />
                        <CommandList className="max-h-[220px]">
                            <CommandEmpty>No matching font.</CommandEmpty>
                            <CommandGroup>
                                {options.map(opt => (
                                    <CommandItem
                                        className="text-xs"
                                        key={opt}
                                        onSelect={() => {
                                            onSelect(opt === value ? null : opt)
                                            setOpen(false)
                                        }}
                                        style={{
                                            fontFamily: `${quoteFamily(opt)}, sans-serif`,
                                        }}
                                        value={opt}>
                                        <span className="min-w-0 flex-1 truncate">
                                            {opt}
                                        </span>
                                        <Check
                                            className={cn(
                                                'ml-auto size-3.5 shrink-0',
                                                value === opt
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
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
                    aria-label="Clear mapping"
                    className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        onSelect(null)
                    }}
                    size="icon-xs"
                    type="button"
                    variant="ghost">
                    <X className="size-3" />
                </Button>
            )}
        </div>
    )
}

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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Option {
    value: string
    label: string
}

interface MultiSelectProps {
    options: Option[]
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
}

export function MultiSelect({ options, value, onChange, placeholder = 'Select...' }: MultiSelectProps) {
    const [open, setOpen] = useState(false)

    const toggle = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue))
        } else {
            onChange([...value, optionValue])
        }
    }

    const remove = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(value.filter(v => v !== optionValue))
    }

    const selectedLabels = value.map(v => options.find(o => o.value === v)?.label ?? v)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-9 py-1.5"
                >
                    <div className="flex flex-wrap gap-1">
                        {value.length === 0 ? (
                            <span className="text-muted-foreground font-normal">{placeholder}</span>
                        ) : (
                            selectedLabels.map((label, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                    {label}
                                    <span
                                        role="button"
                                        onClick={(e) => remove(value[i], e)}
                                        className="ml-1 cursor-pointer hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </span>
                                </Badge>
                            ))
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => toggle(option.value)}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value.includes(option.value) ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
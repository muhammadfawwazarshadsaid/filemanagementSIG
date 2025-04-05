// app/components/filters-clear.tsx
'use client';

import * as React from 'react';
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Column } from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { FilterOption } from './schema'; // Impor dari schema.ts

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>;
    title?: string;
    options: FilterOption[];
    disabled?: boolean;
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
    disabled = false,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const currentFilterValue = column?.getFilterValue();
    const selectedValues = React.useMemo(() => {
        if (Array.isArray(currentFilterValue)) {
            return new Set(currentFilterValue as string[]);
        }
        return new Set<string>();
    }, [currentFilterValue]);

    const [isOpen, setIsOpen] = React.useState(false);

    const handleClearFilters = () => {
        column?.setFilterValue(undefined);
        setIsOpen(false);
    };

    const handleSelect = (value: string) => {
        const newSelectedValues = new Set(selectedValues);
        if (newSelectedValues.has(value)) {
            newSelectedValues.delete(value);
        } else {
            newSelectedValues.add(value);
        }

        if (newSelectedValues.size > 0) {
            column?.setFilterValue(Array.from(newSelectedValues));
        } else {
            column?.setFilterValue(undefined); // Kunci inklusivitas!
        }
        // Biarkan popover terbuka untuk multi-pilih
    };

    // Pastikan options adalah array sebelum mapping
    const validOptions = Array.isArray(options) ? options : [];

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-dashed"
                    disabled={disabled}
                >
                    <PlusCircledIcon className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} dipilih
                                    </Badge>
                                ) : (
                                    validOptions // Gunakan validOptions
                                        .filter((option) => selectedValues.has(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                        <CommandGroup>
                            {validOptions.map((option) => { // Gunakan validOptions
                                const isSelected = selectedValues.has(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                    >
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible'
                                            )}
                                        >
                                            <CheckIcon className={cn('h-4 w-4')} />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={handleClearFilters}
                                        className="justify-center text-center cursor-pointer"
                                    >
                                        Bersihkan Filter
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
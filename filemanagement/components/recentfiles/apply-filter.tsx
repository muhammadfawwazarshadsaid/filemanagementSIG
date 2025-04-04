"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Cross2Icon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarDatePicker } from "../calendar-date-picker";
import { DateRange } from "react-day-picker";
import { FilterIcon, LayoutGrid, ListCollapse, ListFilterIcon, SortDescIcon } from "lucide-react";
import { DataTableFacetedFilter } from "./filters-clear";
import React from "react";
import { Separator } from "@radix-ui/react-separator";

interface DataTableApplyFilterProps<TData> {
    isFilter: boolean;
    table: Table<TData>;
    dateRangeCreatedAt: DateRange;
    dateRangeLastModified: DateRange;
    isFiltered: boolean;
    uniqueFolder: {
        value: string;
        label: string;
    }[];
    handleCreatedAt: (range: { from: Date; to: Date; }) => void;
    handleLastModified: (range: { from: Date; to: Date; }) => void;
}


export function DataTableApplyFilter<TData>({
  isFilter, table, dateRangeCreatedAt, dateRangeLastModified, isFiltered, uniqueFolder, handleCreatedAt, handleLastModified
}: DataTableApplyFilterProps<TData>) {

    const toggleisFilter = () => {
        isFilter = !isFilter
    }
    return (
        <div className="gap-4 flex-1 overflow items-end p-4 outline outline-black/10 rounded-lg">
            <div className="mb-2">
                <p className="text-xs text-black/50">Dibuat pada:</p>
                <CalendarDatePicker onClick={toggleisFilter}
                date={dateRangeCreatedAt}
                onDateSelect={handleCreatedAt}
                className="w-[250px] h-8"
                variant="outline"
                />
            </div>
            <div className="mb-2">
                <p className="text-xs text-black/50">Diperbarui terakhir:</p>
                <CalendarDatePicker onClick={toggleisFilter}
                date={dateRangeLastModified}
                onDateSelect={handleLastModified}
                className="w-[250px] h-8"
                variant="outline"
                />
            </div>
            <div className="mb-2">
                <p className="text-xs text-black/50">Dari folder:</p>
                {table.getColumn("pathname") && (
                <DataTableFacetedFilter
                    column={table.getColumn("pathname")}
                    title="Folder"
                    options={uniqueFolder}
                />
                )}
            </div>
    
            {isFiltered && (
                <Button
                variant="ghost"
                onClick={() => table.resetColumnFilters()}
                className="h-8 px-2 lg:px-3"
                >
                Reset
                <Cross2Icon className="ml-2 h-4 w-4" />
                </Button>
            )}
            </div>
  );
}
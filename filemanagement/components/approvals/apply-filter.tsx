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
    dateRangeDisahkanPada: DateRange;
    // dateRangeCreatedAt dihapus
    dateRangeLastModified: DateRange;
    isFiltered: boolean;
    uniqueFolder: {
        value: string;
        label: string;
    }[];
    uniqueType: {
        value: string;
        label: string;
    }[];
    handleDisahkanPada: (range: { from: Date; to: Date; }) => void;
    // handleCreatedAt dihapus
    handleLastModified: (range: { from: Date; to: Date; }) => void;
}


export function DataTableApplyFilter<TData>({
  isFilter, table, dateRangeDisahkanPada, /* dateRangeCreatedAt dihapus */ dateRangeLastModified, isFiltered, uniqueFolder, uniqueType, /* handleCreatedAt dihapus */ handleLastModified, handleDisahkanPada
}: DataTableApplyFilterProps<TData>) {

    const toggleisFilter = () => {
        // Variabel isFilter di sini adalah lokal untuk fungsi ini,
        // Anda mungkin perlu state management (useState) di komponen induk
        // jika Anda ingin toggle ini benar-benar mengubah tampilan filter
        // Untuk sekarang, logika ini tidak akan berpengaruh pada tampilan luar.
        // isFilter = !isFilter
    }
    return (
        <div className="gap-4 flex-1 overflow items-end p-4 outline outline-black/10 rounded-lg">
            {/* Filter Disahkan pada */}
            <div className="mb-2">
                <p className="text-xs text-black/50">Disahkan pada:</p>
                <CalendarDatePicker
                    date={dateRangeDisahkanPada}
                    onDateSelect={handleDisahkanPada}
                    className="w-[250px] h-8"
                    variant="outline"
                />
            </div>

            {/* Filter Dibuat pada (DIHAPUS) */}
            {/*
            <div className="mb-2">
                <p className="text-xs text-black/50">Dibuat pada:</p>
                <CalendarDatePicker
                    date={dateRangeCreatedAt} // Dihapus
                    onDateSelect={handleCreatedAt} // Dihapus
                    className="w-[250px] h-8"
                    variant="outline"
                />
            </div>
             */}

            {/* Filter Diperbarui terakhir */}
            <div className="mb-2">
                <p className="text-xs text-black/50">Diperbarui terakhir:</p>
                <CalendarDatePicker
                    date={dateRangeLastModified}
                    onDateSelect={handleLastModified}
                    className="w-[250px] h-8"
                    variant="outline"
                />
            </div>

            {/* Filter Folder */}
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

            {/* Filter Tipe File */}
            <div className="mb-2">
                <p className="text-xs text-black/50">Tipe File:</p>
                {table.getColumn("mimeType") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("mimeType")}
                        title="Tipe File"
                        options={uniqueType}
                    />
                )}
            </div>

            {/* Tombol Reset */}
            {isFiltered && (
                <Button
                    variant="ghost"
                    onClick={() => table.resetColumnFilters()}
                    className="h-8 px-2 lg:px-3 mt-2" // Tambah margin top jika perlu
                >
                    Reset
                    <Cross2Icon className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
  );
}
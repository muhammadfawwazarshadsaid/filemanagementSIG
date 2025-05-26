"use client";

import * as React from "react";
import {
    ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
    flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues,
    getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
    TableMeta,
    Table as ReactTable,
} from "@tanstack/react-table";
import { SupabaseClient } from '@supabase/supabase-js';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/recentfiles/pagination";
import { DataTableToolbar } from "@/components/recentfiles/filters";
import { Schema } from "./schema";

// --- Interface untuk Meta (diperbarui) ---
export interface MyTableMeta extends TableMeta<Schema> {
    accessToken: string | null;
    onActionComplete: () => void;
    supabase: SupabaseClient | null;
    userId: string | undefined | null;
    workspaceOrFolderId: string | null | undefined;
    // --- Fungsi untuk preview ---
    onSelectFileForPreview?: (file: Schema) => void; // Untuk set data
    onOpenPreviewSheet?: () => void; // <-- Untuk membuka sheet
    // --------------------------
}

// --- Props untuk DataTable ---
interface DataTableProps<TData, TValue, TMeta extends MyTableMeta = MyTableMeta> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    meta?: TMeta;
}

// --- Komponen DataTable ---
export function DataTable<TData extends Schema, TValue, TMeta extends MyTableMeta = MyTableMeta>({
    columns,
    data,
    meta,
}: DataTableProps<TData, TValue, TMeta>) {
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnVisibility, rowSelection, columnFilters },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        meta: meta,
    });

    // --- Render JSX ---
    return (
        <div className="space-y-4">
             <DataTableToolbar
                 // @ts-ignore
                 table={table}
                 supabase={meta?.supabase ?? null}
                 onRefresh={meta?.onActionComplete ?? (() => {})}
                 accessToken={meta?.accessToken ?? null}
                 userId={meta?.userId ?? null}
                 workspaceId={meta?.workspaceOrFolderId ?? null}
             />
             <div className="overflow-x-auto rounded-md border">
                 <Table>
                     <TableHeader>
                         {table.getHeaderGroups().map((headerGroup) => (
                             <TableRow key={headerGroup.id}>
                                 {headerGroup.headers.map((header) => (
                                     <TableHead className="px-4 py-2 whitespace-nowrap" key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                                         {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                     </TableHead>
                                 ))}
                             </TableRow>
                         ))}
                     </TableHeader>
                     <TableBody>
                         {table.getRowModel().rows?.length ? (
                             table.getRowModel().rows.map((row) => (
                                 <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                     {row.getVisibleCells().map((cell) => (
                                         <TableCell className="px-4 py-1.5" key={cell.id} style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}>
                                             {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                         </TableCell>
                                     ))}
                                 </TableRow>
                             ))
                         ) : (
                             <TableRow>
                                 <TableCell colSpan={columns.length} className="h-24 text-center">
                                     Tidak ada hasil.
                                 </TableCell>
                             </TableRow>
                         )}
                     </TableBody>
                 </Table>
             </div>
             <DataTablePagination table={table} />
        </div>
    );
}
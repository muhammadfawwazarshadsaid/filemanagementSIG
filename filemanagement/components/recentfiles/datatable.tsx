// src/components/recentfiles/datatable.tsx
"use client";

import * as React from "react";
import {
  ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues,
  getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  TableMeta, // <-- Impor TableMeta
  Table as ReactTable,
} from "@tanstack/react-table";
import { SupabaseClient } from '@supabase/supabase-js'; // <-- Impor SupabaseClient

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/recentfiles/pagination";
import { DataTableToolbar } from "@/components/recentfiles/filters";

// --- Interface untuk Meta ---
// Definisikan struktur data yang akan Anda teruskan melalui meta
interface MyTableMeta {
  accessToken: string | null;
  onActionComplete: () => void;
  supabase: SupabaseClient | null; // Klien Supabase
  userId: string | undefined | null; // ID User
  workspaceOrFolderId: string | null | undefined; // ID Workspace/Folder induk
}

// --- Props untuk DataTable ---
// Gunakan TMeta generik yang merujuk ke MyTableMeta
interface DataTableProps<TData, TValue, TMeta extends MyTableMeta | undefined = MyTableMeta | undefined> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: TMeta; // Prop meta opsional
}

// --- Komponen DataTable ---
export function DataTable<TData, TValue, TMeta extends MyTableMeta | undefined = MyTableMeta | undefined>({
  columns,
  data,
  meta, // Terima prop meta
}: DataTableProps<TData, TValue, TMeta>) {
  // State Tabel (tidak berubah)
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Inisialisasi useReactTable (tidak berubah)
  const table: ReactTable<TData> = useReactTable({
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
    // Teruskan meta ke useReactTable (sudah benar)
    meta: meta,
  });

  // --- Render JSX (tidak berubah) ---
  return (
      <div className="space-y-4">
        
        <DataTableToolbar
            table={table as any} // Pass the table instance
            supabase={meta?.supabase ?? null} // Pass supabase from meta, default to null if meta or supabase is undefined/null
            onRefresh={meta?.onActionComplete ?? (() => { console.warn("onActionComplete/onRefresh callback missing from table meta"); })} // Pass onActionComplete as onRefresh, provide fallback
            accessToken={meta?.accessToken ?? null} // Pass accessToken from meta, default to null
            userId={meta?.userId ?? null} // Pass userId from meta, default to null
            workspaceId={meta?.workspaceOrFolderId ?? null} // Pass workspaceOrFolderId as workspaceId, default to null
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
                  // --- Pastikan tidak ada spasi/baris baru setelah <TableRow> ---
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{
                    // --- Map dimulai langsung ---
                    row.getVisibleCells().map((cell) => (
                      <TableCell className="px-4 py-1.5" key={cell.id} style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}>{
                        // --- flexRender dimulai langsung ---
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                        // --- Akhir flexRender ---
                      }</TableCell> // --- TableCell ditutup langsung ---
                    ))
                    // --- Akhir map ---
                  }</TableRow> // --- TableRow ditutup langsung ---
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
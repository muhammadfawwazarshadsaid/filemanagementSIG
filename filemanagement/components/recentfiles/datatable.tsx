"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  // Impor TableMeta jika menggunakan constraint
  TableMeta,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Sesuaikan path

import { DataTablePagination } from "@/components/recentfiles/pagination"; // Sesuaikan path
import { DataTableToolbar } from "@/components/recentfiles/filters";   // Sesuaikan path

// **** PERBAIKAN 1: Tambahkan TMeta dan meta prop ****
// TMeta dibatasi agar kompatibel dengan TableMeta atau undefined
interface DataTableProps<TData, TValue, TMeta extends TableMeta<TData> | undefined = TableMeta<TData> | undefined> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: TMeta; // Tambahkan prop meta (opsional)
}

// **** PERBAIKAN 2: Gunakan TMeta dan terima prop meta ****
export function DataTable<TData, TValue, TMeta extends TableMeta<TData> | undefined = TableMeta<TData> | undefined>({
  columns,
  data,
  meta, // Terima prop meta di sini
}: DataTableProps<TData, TValue, TMeta>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
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
    // **** PERBAIKAN 3: Teruskan meta ke useReactTable ****
    meta: meta, // <-- Tambahkan baris ini
  });

  // --- Render JSX (tidak berubah signifikan) ---
  return (
    <div className="space-y-4">
      {/* Toolbar dan Pagination mungkin perlu 'meta' juga jika mereka membutuhkannya */}
      <DataTableToolbar table={table as any} /* meta={meta} */ />
      <div className="overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className="px-4 py-2"
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className="px-4 py-1.5" // Padding bisa disesuaikan
                      key={cell.id}
                      style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                      >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(), // Konteks ini akan berisi akses ke table.options.meta
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Tidak ada hasil.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} /* meta={meta} */ />
    </div>
  );
}
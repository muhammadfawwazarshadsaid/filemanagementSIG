// app/components/approvals/datatable.tsx
"use client";

import * as React from "react";
import {
  ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues,
  getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  TableMeta
} from "@tanstack/react-table";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/approvals/pagination"; // Reusing
import { ApprovalSchema, ApprovalTableMeta } from "./schema"; // Approval-specific schema
import { ApprovalsToolbar } from "./filters";

// Ensure TMeta extends ApprovalTableMeta
interface DataTableProps<TData extends ApprovalSchema, TValue, TMeta extends ApprovalTableMeta<TData> = ApprovalTableMeta<TData>> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: TMeta; // Pass meta for actions, etc.
  isLoading?: boolean;
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function ApprovalsDataTable<TData extends ApprovalSchema, TValue, TMeta extends ApprovalTableMeta<TData> = ApprovalTableMeta<TData>>({
  columns,
  data,
  meta,
  isLoading = false,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onLimitChange,
}: DataTableProps<TData, TValue, TMeta>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');


  const pageCount = Math.ceil(totalItems / itemsPerPage);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: itemsPerPage,
      },
    },
    pageCount,
    manualPagination: true, // Crucial for server-side pagination
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    // getPaginationRowModel: getPaginationRowModel(), // Not needed for manual pagination
    meta: meta, // Pass down meta for use in columns/actions
  });

  return (
    <div className="space-y-4">
      <ApprovalsToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined, minWidth: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination 
        table={table} 
        // These props are for client-side pagination, adjust if reusing for server-side
        // For server-side, DataTablePagination needs to be adapted or controlled differently
        // Or, pass server-side pagination handlers to it.
        // For this example, assuming DataTablePagination can be adapted.
        // We need to pass the correct props for server-side pagination.
        // Let's modify DataTablePagination or create a new one for server-side.
        // For now, we'll pass the server-side state.
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={onPageChange} // Propagate page changes
        canPreviousPage={currentPage > 1}
        canNextPage={currentPage < pageCount}
        onLimitChange={onLimitChange} // Propagate limit changes
        itemsPerPage={itemsPerPage}

      />
    </div>
  );
}

// Note: You might need to adjust DataTablePagination to work with server-side pagination logic,
// or create a new pagination component that takes pageCount, currentPage, onPageChange, etc.
// The one from `recentfiles` might be for client-side pagination.
// For this example, I'm assuming you'll adapt it or pass the right props.
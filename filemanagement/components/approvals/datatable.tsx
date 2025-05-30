// File: components/approvals/datatable.tsx
"use client";

import {
    ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
    flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues,
    getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
    Table as TanstackTable // Alias Table from tanstack to avoid conflict with our UI Table
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApprovalDataTableToolbar } from "./filters";
// Import ProcessedApprovalRequest, bukan Approval asli untuk constraint TData
import { ProcessedApprovalRequest } from "./schema";
import { ApprovalsTableMeta } from "./columns"; // Impor meta yang sesuai
import React from "react";
import { Loader2 } from "lucide-react";
import { DataTablePagination } from "./pagination";

// Interface Props diupdate untuk menggunakan ProcessedApprovalRequest sebagai TData
interface ApprovalDataTableProps<TData extends ProcessedApprovalRequest, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    meta: ApprovalsTableMeta; // Meta type should be compatible
    isLoading: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    setItemsPerPage: (size: number) => void;
    externalGlobalFilter: string;
    onExternalGlobalFilterChange: (filterValue: string) => void;
}

export function ApprovalDataTable<TData extends ProcessedApprovalRequest, TValue>({
    columns, data, meta, isLoading, isRefreshing,
    onRefresh,
    currentPage, totalPages, onPageChange, itemsPerPage, setItemsPerPage,
    externalGlobalFilter,
    onExternalGlobalFilterChange,
}: ApprovalDataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table: TanstackTable<TData> = useReactTable<TData>({ // TData sekarang adalah ProcessedApprovalRequest
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            globalFilter: externalGlobalFilter,
            pagination: { pageIndex: currentPage - 1, pageSize: itemsPerPage },
        },
        pageCount: totalPages,
        manualPagination: true,
        manualFiltering: true, // Karena global filter ditangani server-side/data-processing
        manualSorting: false, // Set true jika sorting juga server-side
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: onExternalGlobalFilterChange,
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newPaginationState = updater({ pageIndex: currentPage - 1, pageSize: itemsPerPage });
                onPageChange(newPaginationState.pageIndex + 1);
                setItemsPerPage(newPaginationState.pageSize);
            } else {
                onPageChange(updater.pageIndex + 1);
                setItemsPerPage(updater.pageSize);
            }
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(), // Tetap berguna untuk struktur tabel
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        meta: meta, // Pastikan tipe meta sesuai
    });

    const showTableLoading = isLoading && data.length === 0;
    const showRefreshOrSearchLoading = isRefreshing;

    return (
        <div className="space-y-4">
            <ApprovalDataTableToolbar
                table={table as any}
                globalFilter={externalGlobalFilter}
                setGlobalFilter={onExternalGlobalFilterChange}
                onRefreshApprovals={onRefresh}
                isFetchingApprovals={showRefreshOrSearchLoading}
            />
            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead className="px-3 py-2 whitespace-nowrap" key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {showTableLoading ? (
                             <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Memuat data approval...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => ( // row.original sekarang adalah ProcessedApprovalRequest
                                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell className="px-3 py-1" key={cell.id} style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Tidak ada hasil approval.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {totalPages > 0 && table.getRowModel().rows.length > 0 && <DataTablePagination table={table} />}
        </div>
    );
}
// app/components/subject-list-data-table.tsx
'use client';

import * as React from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    getFacetedRowModel, // Model untuk filter faceted
    getFacetedUniqueValues, // Model untuk filter faceted
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { subjectListColumns } from './subject-list-columns';
// Pastikan tipe SubjectSummary di schema sudah punya academicYear
import { SubjectSummary, ComponentSummary } from './schema';
import { DataTablePagination } from './pagination';
import { SubjectListToolbar } from './subject-list-toolbar'; // Pastikan impor benar

// Tipe opsi filter
interface FilterOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
}

// Props komponen
interface SubjectListDataTableProps {
  data: SubjectSummary[]; // Menerima array data SubjectSummary
}

export function SubjectListDataTable({ data }: SubjectListDataTableProps) {
    // State tabel
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    // Memoize kolom
    const columns = React.useMemo(() => subjectListColumns, []);

    // Inisialisasi tabel
    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnVisibility, rowSelection, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        // enableRowSelection: true, // Aktifkan jika perlu
        // onRowSelectionChange: setRowSelection,
    });

    // Hitung opsi komponen unik (jika toolbar memerlukannya)
    const uniqueComponentsForSubjectList = React.useMemo(() => {
        const componentNameSet = new Set<string>();
        data.forEach(subject => {
            subject.components?.forEach(component => {
                if (component.name) componentNameSet.add(component.name);
            });
        });
        return Array.from(componentNameSet).sort().map(name => ({ label: name, value: name }));
    }, [data]);

    // Hitung opsi tahun ajaran unik
    const uniqueAcademicYearOptions = React.useMemo(() => {
        const years = new Set<string>();
        data.forEach(item => {
            if (item.academicYear) years.add(item.academicYear);
        });
        // Urutkan descending
        return Array.from(years).sort((a, b) => b.localeCompare(a)).map(year => ({
            label: year,
            value: year,
        }));
    }, [data]);

    // Render JSX
    return (
        <div className="space-y-4 w-full">
            {/* Render Toolbar dengan prop baru */}
            <SubjectListToolbar
                table={table}
                uniqueComponentOptions={uniqueComponentsForSubjectList}
                uniqueAcademicYearOptions={uniqueAcademicYearOptions} // <-- Teruskan prop baru
            />

            {/* Wadah Tabel */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Tidak ada data mata pelajaran ditemukan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Render Pagination */}
            <DataTablePagination table={table} />
        </div>
    );
}
// app/components/grade-data-table-toolbar.tsx
'use client';

import * as React from 'react';
import { Table, Row } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XCircle, Ban, Loader2, Save, Edit } from 'lucide-react';
import { DataTableViewOptions } from './actions-menu';
import { GradeTableRowData, FilterOption } from './schema';

// Props untuk toolbar ini
interface GradeDataTableToolbarProps {
    table: Table<GradeTableRowData>;
    // Untuk Reset
    onResetSelected: (selectedRows: Row<GradeTableRowData>[]) => void;
    // Untuk Edit Semua
    isEditingAll: boolean;
    isSavingAll: boolean;
    onEditAll: () => void;
    onSaveAll: () => Promise<void>;
    onCancelAll: () => void;
    // Status lain
    isRowEditing: boolean; // Apakah ada baris individual yg sdg diedit?
    // Opsi Filter Tambahan (jika ada)
    uniqueComponentOptions?: FilterOption[]; // Opsional, jika ingin filter per komponen
    finalGradeOptions?: FilterOption[]; // Opsional, jika ingin filter nilai akhir
}

export function GradeDataTableToolbar({
    table,
    onResetSelected,
    isEditingAll,
    isSavingAll,
    onEditAll,
    onSaveAll,
    onCancelAll,
    isRowEditing,
    uniqueComponentOptions, // Terima opsi filter
    finalGradeOptions
}: GradeDataTableToolbarProps) {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedRowCount = selectedRows.length;
    const isFiltered = table.getState().columnFilters.length > 0;

    // Dapatkan instance kolom untuk filter
    const nameColumn = table.getColumn('name');
    // const finalGradeColumn = table.getColumn('finalScore'); // Jika Anda menambahkan filter nilai akhir

    return (
        <div className="flex items-center justify-between flex-wrap gap-2">
            {/* --- Sisi Kiri (Filter) --- */}
            <div className="flex flex-1 items-center space-x-2 flex-wrap">
                {nameColumn && (
                     <Input
                        placeholder="Cari nama siswa..."
                        value={(nameColumn.getFilterValue() as string) ?? ''}
                        onChange={(event) => nameColumn.setFilterValue(event.target.value)}
                        className="h-8 w-[150px] lg:w-[250px]"
                        aria-label="Filter nama siswa"
                        disabled={isEditingAll || isRowEditing}
                     />
                 )}

                 {/* Contoh Filter Nilai Akhir (Jika diimplementasikan) */}
                 {/* {finalGradeColumn && finalGradeOptions && (
                     <DataTableFacetedFilter
                        column={finalGradeColumn}
                        title="Nilai Akhir"
                        options={finalGradeOptions}
                        disabled={isEditingAll || isRowEditing}
                     />
                 )} */}

                 {isFiltered && (
                    <Button
                      variant="ghost"
                      onClick={() => table.resetColumnFilters()}
                      className="h-8 px-2 lg:px-3"
                      disabled={isEditingAll || isRowEditing}
                      aria-label="Reset semua filter"
                     >
                        Reset Filter <XCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* --- Sisi Kanan (Aksi Edit/Simpan & View) --- */}
            <div className="flex items-center space-x-2 flex-shrink-0">
                {isEditingAll ? (
                    <>
                         <span className='text-sm text-muted-foreground hidden md:inline'>Mode Edit Semua...</span>
                         <Button variant="outline" size="sm" className="h-8" onClick={onCancelAll} disabled={isSavingAll} aria-label="Batal edit semua">
                            <Ban className="mr-2 h-4 w-4"/> Batal Semua
                        </Button>
                        <Button size="sm" className="h-8" onClick={onSaveAll} disabled={isSavingAll} aria-label="Simpan semua perubahan">
                            {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Simpan Semua
                        </Button>
                    </>
                ) : (
                    <>
                        {selectedRowCount > 0 && !isRowEditing && (
                             <Button
                                 variant="outline"
                                 size="sm"
                                 className="h-8 border-destructive text-destructive hover:bg-destructive/10"
                                 onClick={() => onResetSelected(selectedRows)}
                                 disabled={isSavingAll} // Disable juga saat save all berjalan
                                 aria-label={`Reset nilai ${selectedRowCount} siswa terpilih`}
                             >
                                 <XCircle className='mr-2 h-4 w-4' /> Reset ({selectedRowCount})
                             </Button>
                         )}
                         <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={onEditAll}
                            disabled={isRowEditing || selectedRowCount > 0 || isSavingAll}
                            aria-label="Edit semua nilai siswa"
                        >
                             <Edit className="mr-2 h-4 w-4" /> Edit Semua Nilai
                         </Button>
                    </>
                )}
                <DataTableViewOptions table={table} />
            </div>
        </div>
    );
}
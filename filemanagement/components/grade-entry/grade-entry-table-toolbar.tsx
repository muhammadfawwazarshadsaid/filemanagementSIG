// app/components/grade-data-table-toolbar.tsx
'use client';

import * as React from 'react';
import { Table, Row } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XCircle, Ban, Loader2, Save, Edit, RotateCcw } from 'lucide-react';
import { DataTableViewOptions } from './actions-menu'; // Komponen toggle kolom
// !! Impor komponen filter faceted dan tipe opsi !!
import { GradeTableRowData, FilterOption } from './schema';
import { toast } from 'sonner';
import { DataTableFacetedFilter } from './filters-clear';

// Props untuk toolbar ini (MODIFIKASI: tambah classFilterOptions)
interface GradeDataTableToolbarProps {
    table: Table<GradeTableRowData>;
    onResetSelected: () => void;
    isEditingAll: boolean;
    isSavingAll: boolean;
    onEditAll: () => void;
    onSaveAll: () => Promise<void>;
    onCancelAll: () => void;
    isRowEditing: boolean;
    // !! Opsi untuk filter kelas (BARU) !!
    nameFilterOptions: FilterOption[];
    classFilterOptions: FilterOption[];
    finalScoreFilterOptions: FilterOption[];
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
    // !! Terima prop opsi filter kelas !!
    nameFilterOptions,
    classFilterOptions,
    finalScoreFilterOptions
}: GradeDataTableToolbarProps) {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedRowCount = selectedRows.length;
    const isFiltered = table.getState().columnFilters.length > 0;

    // Dapatkan instance kolom 'name' dan 'class'
    const nameColumn = table.getColumn('name');
    const classColumn = table.getColumn('class'); // <-- Kolom kelas
    const finalScoreColumn = table.getColumn('finalScore'); // <-- Kolom kelas

    const handleResetClick = () => { if (selectedRowCount === 0) { toast.info("Pilih siswa."); return; } onResetSelected(); };

    return (
        <div className="flex items-center justify-between flex-wrap gap-2">
            {/* --- Sisi Kiri (Filter) --- */}
            <div className="flex flex-1 items-center space-x-2 flex-wrap min-w-[200px]">
                {/* Filter Nama Siswa */}
                {nameColumn && (
                     <Input
                        placeholder="Cari nama..."
                        value={(nameColumn.getFilterValue() as string) ?? ''}
                        onChange={(event) => nameColumn.setFilterValue(event.target.value)}
                        className="h-8 w-[150px] lg:w-[200px]" // Sedikit lebih kecil
                        aria-label="Filter nama siswa"
                        disabled={isEditingAll || isRowEditing}
                     />
                 )}

                 {/* !! Filter Kelas (BARU) !! */}
                 {classColumn && (
                    <DataTableFacetedFilter
                        column={nameColumn}
                        title="Nama Siswa"
                        options={nameFilterOptions} // Gunakan opsi dari props
                        disabled={isEditingAll || isRowEditing} // Disable saat edit
                    />
                )}
                
                 {/* !! Filter Kelas (BARU) !! */}
                 {classColumn && (
                    <DataTableFacetedFilter
                        column={classColumn}
                        title="Kelas"
                        options={classFilterOptions} // Gunakan opsi dari props
                        disabled={isEditingAll || isRowEditing} // Disable saat edit
                    />
                 )}
                
                 {/* !! Filter Kelas (BARU) !! */}
                 {finalScoreColumn && (
                    <DataTableFacetedFilter
                        column={finalScoreColumn}
                        title="Rentang Nilai"
                        options={finalScoreFilterOptions} // Gunakan opsi dari props
                        disabled={isEditingAll || isRowEditing} // Disable saat edit
                    />
                 )}

                 {/* Tombol Reset Filter */}
                 {isFiltered && (
                    <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3" disabled={isEditingAll || isRowEditing} >
                        Reset <XCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* --- Sisi Kanan (Aksi Edit/Simpan & View) --- */}
            <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Tombol Aksi Reset, Edit All, Save All, Cancel All */}
                 {isEditingAll ? ( <> <span className='text-sm text-muted-foreground hidden md:inline italic'>Mode Edit Semua...</span> <Button variant="outline" size="sm" className="h-8" onClick={onCancelAll} disabled={isSavingAll}><Ban className="mr-2 h-4 w-4"/> Batal Semua</Button> <Button size="sm" className="h-8" onClick={onSaveAll} disabled={isSavingAll}>{isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Simpan Semua</Button> </> ) : ( <> {selectedRowCount > 0 && ( <Button variant="outline" size="sm" className="h-8 border-destructive text-destructive hover:bg-destructive/10" onClick={handleResetClick} disabled={isRowEditing || isSavingAll}><RotateCcw className='mr-2 h-4 w-4' /> Reset ({selectedRowCount})</Button> )} <Button variant="outline" size="sm" className="h-8" onClick={onEditAll} disabled={isRowEditing || selectedRowCount > 0 || isSavingAll}><Edit className="mr-2 h-4 w-4" /> Edit Semua Nilai</Button> </> )}
                <DataTableViewOptions table={table} />
            </div>
        </div>
    );
}
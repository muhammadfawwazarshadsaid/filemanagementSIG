// app/components/grade-data-table-toolbar.tsx
'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XCircle, Ban, Loader2, Save, Edit, RotateCcw } from 'lucide-react';
import { DataTableViewOptions } from './actions-menu'; // Pastikan path ini benar
import { GradeTableRowData, FilterOption } from './schema';
import { toast } from 'sonner';
import { DataTableFacetedFilter } from './filters-clear';

interface GradeDataTableToolbarProps {
    table: Table<GradeTableRowData>;
    onResetSelected: () => void; // Handler untuk tombol reset nilai
    isEditingAll: boolean;
    isSavingAll: boolean;
    onEditAll: () => void;
    onSaveAll: () => Promise<void>;
    onCancelAll: () => void;
    isRowEditing: boolean;
    nameFilterOptions: FilterOption[];
    classFilterOptions: FilterOption[];
    finalScoreFilterOptions: FilterOption[];
    isResetting: boolean; // <-- Tambahkan prop ini
}

export function GradeDataTableToolbar({
    table,
    onResetSelected, // Terima prop ini
    isEditingAll,
    isSavingAll,
    onEditAll,
    onSaveAll,
    onCancelAll,
    isRowEditing,
    nameFilterOptions,
    classFilterOptions,
    finalScoreFilterOptions,
    isResetting, // <-- Terima prop ini
}: GradeDataTableToolbarProps) {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedRowCount = selectedRows.length;
    const isColumnFiltered = table.getState().columnFilters.length > 0;
    const isFiltered = isColumnFiltered;

    const nameColumn = table.getColumn('name');
    const classColumn = table.getColumn('class');
    const finalScoreColumn = table.getColumn('finalScore');

    // Handler untuk tombol reset nilai (memanggil prop)
    const handleResetClick = () => {
        if (selectedRowCount === 0) {
            toast.info("Pilih satu atau lebih siswa untuk direset nilainya.");
            return;
        }
        onResetSelected(); // Panggil fungsi dari parent (GradeEntryDataTable)
    };

    // Fungsi untuk mereset semua filter (kolom & global)
    const resetAllFilters = () => {
        table.resetColumnFilters();
    }

    return (
        <div className="flex items-center justify-between flex-wrap gap-2">
            {/* --- Sisi Kiri (Filter) --- */}
            <div className="flex flex-1 items-center space-x-2 flex-wrap min-w-[200px]">
                 {nameColumn && (
                     <Input
                        placeholder="Cari nama..."
                        value={(typeof nameColumn.getFilterValue() === 'string' ? nameColumn.getFilterValue() : '') as string}
                        onChange={(event) => nameColumn.setFilterValue(event.target.value)}
                        className="h-8 w-[150px] lg:w-[180px]"
                        aria-label="Filter nama siswa (teks)"
                        disabled={isEditingAll || isRowEditing || isResetting} // <-- Tambah isResetting
                     />
                 )}
                {nameColumn && (
                    <DataTableFacetedFilter
                        column={nameColumn}
                        title="Pilih Nama"
                        options={nameFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting} // <-- Tambah isResetting
                    />
                )}
                {classColumn && (
                    <DataTableFacetedFilter
                        column={classColumn}
                        title="Kelas"
                        options={classFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting} // <-- Tambah isResetting
                    />
                )}
                {finalScoreColumn && (
                    <DataTableFacetedFilter
                        column={finalScoreColumn}
                        title="Rentang Nilai"
                        options={finalScoreFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting} // <-- Tambah isResetting
                    />
                )}
                {isFiltered && (
                    <Button variant="ghost" onClick={resetAllFilters} className="h-8 px-2 lg:px-3" disabled={isEditingAll || isRowEditing || isResetting} > {/* <-- Tambah isResetting */}
                        Reset Filter <XCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* --- Sisi Kanan (Aksi Edit/Simpan & View) --- */}
            <div className="flex items-center space-x-2 flex-shrink-0">
                {isEditingAll ? (
                    <>
                        <span className='text-sm text-muted-foreground hidden md:inline italic'>Mode Edit Semua...</span>
                        <Button variant="outline" size="sm" className="h-8" onClick={onCancelAll} disabled={isSavingAll || isResetting}> {/* <-- Tambah isResetting */}
                            <Ban className="mr-2 h-4 w-4" /> Batal Semua
                        </Button>
                        <Button size="sm" className="h-8" onClick={onSaveAll} disabled={isSavingAll || isResetting}> {/* <-- Tambah isResetting */}
                            {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Semua
                        </Button>
                    </>
                ) : (
                    <>
                        {selectedRowCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-destructive text-destructive hover:bg-destructive/10"
                                onClick={handleResetClick} // Panggil handler reset nilai
                                // Disable jika sedang edit baris, menyimpan semua, ATAU sedang mereset
                                disabled={isRowEditing || isSavingAll || isResetting} // <-- Tambah isResetting
                            >
                                {isResetting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RotateCcw className='mr-2 h-4 w-4' />} {/* <-- Tampilkan Loader */}
                                Reset Nilai ({selectedRowCount})
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={onEditAll}
                            // Disable jika ada baris diedit, ada siswa terpilih, sedang menyimpan semua, ATAU sedang mereset
                            disabled={isRowEditing || selectedRowCount > 0 || isSavingAll || isResetting} // <-- Tambah isResetting
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
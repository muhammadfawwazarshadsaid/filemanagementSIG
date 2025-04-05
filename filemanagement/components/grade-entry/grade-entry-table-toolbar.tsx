// app/components/grade-data-table-toolbar.tsx
'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input'; // Import Input lagi
import { Button } from '@/components/ui/button';
import { XCircle, Ban, Loader2, Save, Edit, RotateCcw } from 'lucide-react';
import { DataTableViewOptions } from './actions-menu';
import { GradeTableRowData, FilterOption } from './schema';
import { toast } from 'sonner';
import { DataTableFacetedFilter } from './filters-clear';

interface GradeDataTableToolbarProps {
    table: Table<GradeTableRowData>;
    onResetSelected: () => void;
    isEditingAll: boolean;
    isSavingAll: boolean;
    onEditAll: () => void;
    onSaveAll: () => Promise<void>;
    onCancelAll: () => void;
    isRowEditing: boolean;
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
    nameFilterOptions,
    classFilterOptions,
    finalScoreFilterOptions
}: GradeDataTableToolbarProps) {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedRowCount = selectedRows.length;
    // Cek apakah ada filter aktif, termasuk filter global jika ada
    const isFiltered = table.getState().columnFilters.length > 0 || table.getState().globalFilter;

    const nameColumn = table.getColumn('name');
    const classColumn = table.getColumn('class');
    const finalScoreColumn = table.getColumn('finalScore');

    const handleResetClick = () => {
        if (selectedRowCount === 0) {
            toast.info("Pilih siswa.");
            return;
        }
        onResetSelected();
    };

    // Fungsi untuk mereset semua filter
    const resetAllFilters = () => {
        table.resetColumnFilters(); // Reset filter kolom
        // table.setGlobalFilter(''); // Reset filter global jika Anda menggunakannya
    }

    return (
        <div className="flex items-center justify-between flex-wrap gap-2">
            {/* --- Sisi Kiri (Filter) --- */}
            <div className="flex flex-1 items-center space-x-2 flex-wrap min-w-[200px]">
                {/* Input Teks Pencarian Nama (Ditambahkan Kembali) */}
                {/* PERHATIAN: Menggunakan input teks DAN faceted filter di kolom yg sama */}
                {/* bisa konflik. Input ini biasanya untuk global filter atau perlu custom fn. */}
                {/* Jika Anda HANYA ingin faceted, hapus Input ini. */}
                 {nameColumn && (
                     <Input
                        placeholder="Cari nama..."
                        // Nilai filter untuk kolom 'name'. Bisa string (dari input ini) atau array (dari faceted)
                        value={(nameColumn.getFilterValue() as string) ?? ''}
                        onChange={(event) => nameColumn.setFilterValue(event.target.value)} // Ini akan menimpa filter faceted
                        className="h-8 w-[150px] lg:w-[180px]"
                        aria-label="Filter nama siswa (teks)"
                        disabled={isEditingAll || isRowEditing}
                     />
                 )}

                {/* !! Filter Nama Siswa (Faceted) !! */}
                {nameColumn && (
                    <DataTableFacetedFilter
                        column={nameColumn}
                        title="Pilih Nama" // Ubah judul agar beda dari input teks
                        options={nameFilterOptions}
                        disabled={isEditingAll || isRowEditing}
                    />
                )}

                {/* !! Filter Kelas (Faceted) !! */}
                {classColumn && (
                    <DataTableFacetedFilter
                        column={classColumn}
                        title="Kelas"
                        options={classFilterOptions}
                        disabled={isEditingAll || isRowEditing}
                    />
                )}

                {/* !! Filter Nilai Akhir (Faceted) !! */}
                {finalScoreColumn && (
                    <DataTableFacetedFilter
                        column={finalScoreColumn}
                        title="Rentang Nilai"
                        options={finalScoreFilterOptions}
                        disabled={isEditingAll || isRowEditing}
                    />
                )}

                {/* Tombol Reset Filter */}
                {isFiltered && (
                    <Button variant="ghost" onClick={resetAllFilters} className="h-8 px-2 lg:px-3" disabled={isEditingAll || isRowEditing} >
                        Reset Filter <XCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* --- Sisi Kanan (Aksi Edit/Simpan & View) --- */}
            <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Tombol Aksi Reset, Edit All, Save All, Cancel All */}
                {isEditingAll ? (
                    <>
                        <span className='text-sm text-muted-foreground hidden md:inline italic'>Mode Edit Semua...</span>
                        <Button variant="outline" size="sm" className="h-8" onClick={onCancelAll} disabled={isSavingAll}>
                            <Ban className="mr-2 h-4 w-4" /> Batal Semua
                        </Button>
                        <Button size="sm" className="h-8" onClick={onSaveAll} disabled={isSavingAll}>
                            {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Semua
                        </Button>
                    </>
                ) : (
                    <>
                        {selectedRowCount > 0 && (
                            <Button variant="outline" size="sm" className="h-8 border-destructive text-destructive hover:bg-destructive/10" onClick={handleResetClick} disabled={isRowEditing || isSavingAll}>
                                <RotateCcw className='mr-2 h-4 w-4' /> Reset ({selectedRowCount})
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-8" onClick={onEditAll} disabled={isRowEditing || selectedRowCount > 0 || isSavingAll}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Semua Nilai
                        </Button>
                    </>
                )}
                {/* Tombol View Options (Toggle Kolom) */}
                <DataTableViewOptions table={table} />
            </div>
        </div>
    );
}
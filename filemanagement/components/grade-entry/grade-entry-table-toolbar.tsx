// app/components/grade-data-table-toolbar.tsx
'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XCircle, Ban, Loader2, Save, Edit, RotateCcw, AlertTriangle } from 'lucide-react'; // Impor AlertTriangle
import { DataTableViewOptions } from './actions-menu'; // Pastikan path ini benar
import { GradeTableRowData, FilterOption } from './schema';
import { toast } from 'sonner'; // Masih bisa digunakan untuk notifikasi lain
import { DataTableFacetedFilter } from './filters-clear';
// Impor komponen Dialog dari shadcn/ui (sesuaikan path jika perlu)
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose // Impor DialogClose untuk tombol batal
} from "@/components/ui/dialog";

interface GradeDataTableToolbarProps {
    table: Table<GradeTableRowData>;
    onResetSelected: () => void; // Handler untuk menjalankan aksi reset sebenarnya
    isEditingAll: boolean;
    isSavingAll: boolean;
    onEditAll: () => void;
    onSaveAll: () => Promise<void>;
    onCancelAll: () => void;
    isRowEditing: boolean;
    nameFilterOptions: FilterOption[];
    classFilterOptions: FilterOption[];
    finalScoreFilterOptions: FilterOption[];
    isResetting: boolean; // State loading dari parent
}

export function GradeDataTableToolbar({
    table,
    onResetSelected, // Fungsi ini dipanggil setelah konfirmasi dialog
    isEditingAll,
    isSavingAll,
    onEditAll,
    onSaveAll,
    onCancelAll,
    isRowEditing,
    nameFilterOptions,
    classFilterOptions,
    finalScoreFilterOptions,
    isResetting, // Terima prop loading
}: GradeDataTableToolbarProps) {
    // State untuk mengontrol visibilitas dialog konfirmasi
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedRowCount = selectedRows.length;
    const isColumnFiltered = table.getState().columnFilters.length > 0;
    const isFiltered = isColumnFiltered;

    const nameColumn = table.getColumn('name');
    const classColumn = table.getColumn('class');
    const finalScoreColumn = table.getColumn('finalScore');

    // Handler untuk tombol KONFIRMASI di dalam dialog
    const handleConfirmReset = () => {
        console.log("Tombol Konfirmasi Reset diklik. Memanggil onResetSelected...");
        onResetSelected(); // Jalankan fungsi reset dari parent
        setIsConfirmDialogOpen(false); // Tutup dialog setelah konfirmasi
    };

    // Fungsi untuk mereset semua filter
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
                        disabled={isEditingAll || isRowEditing || isResetting}
                     />
                 )}
                {nameColumn && (
                    <DataTableFacetedFilter
                        column={nameColumn}
                        title="Nama"
                        options={nameFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting}
                    />
                )}
                {classColumn && (
                    <DataTableFacetedFilter
                        column={classColumn}
                        title="Kelas"
                        options={classFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting}
                    />
                )}
                {finalScoreColumn && (
                    <DataTableFacetedFilter
                        column={finalScoreColumn}
                        title="Rentang Nilai"
                        options={finalScoreFilterOptions}
                        disabled={isEditingAll || isRowEditing || isResetting}
                    />
                )}
                {isFiltered && (
                    <Button variant="ghost" onClick={resetAllFilters} className="h-8 px-2 lg:px-3" disabled={isEditingAll || isRowEditing || isResetting} >
                        Reset Filter <XCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* --- Sisi Kanan (Aksi Edit/Simpan & View) --- */}
            <div className="flex items-center space-x-2 flex-shrink-0">
                {isEditingAll ? (
                    <>
                        {/* Tombol saat mode Edit Semua */}
                        <span className='text-sm text-muted-foreground hidden md:inline italic'>Mode Edit Semua...</span>
                        <Button variant="outline" size="sm" className="h-8" onClick={onCancelAll} disabled={isSavingAll || isResetting}>
                            <Ban className="mr-2 h-4 w-4" /> Batal Semua
                        </Button>
                        <Button size="sm" className="h-8" onClick={onSaveAll} disabled={isSavingAll || isResetting}>
                            {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Semua
                        </Button>
                    </>
                ) : (
                    <>
                        {/* Tombol Reset Nilai (sekarang memicu Dialog) */}
                        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                            <DialogTrigger asChild>
                                {/* Tombol yang membuka dialog */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-destructive text-destructive hover:bg-destructive/10"
                                    // Tombol ini di-disable jika tidak ada baris dipilih,
                                    // atau jika sedang edit baris lain, atau sedang menyimpan semua, atau sedang mereset
                                    disabled={selectedRowCount === 0 || isRowEditing || isSavingAll || isResetting}
                                    aria-label={`Reset Nilai ${selectedRowCount} Siswa`}
                                >
                                    {isResetting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RotateCcw className='mr-2 h-4 w-4' />}
                                    Reset Nilai {selectedRowCount > 0 ? `(${selectedRowCount})` : ''}
                                </Button>
                            </DialogTrigger>
                            {/* Konten Dialog */}
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        <div className="flex items-center gap-2">
                                             <AlertTriangle className="h-5 w-5 text-destructive" /> {/* Ikon Peringatan */}
                                            Konfirmasi Reset Nilai
                                        </div>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Anda yakin ingin mereset nilai untuk <strong className='font-medium'>{selectedRowCount}</strong> siswa terpilih?
                                        Semua nilai komponen siswa yang dipilih akan dikosongkan dan disimpan.
                                        <br/>
                                        <strong className="text-destructive">Tindakan ini tidak dapat dibatalkan.</strong>
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    {/* Tombol Batal (menggunakan DialogClose) */}
                                    <DialogClose asChild>
                                        <Button variant="outline">Batal</Button>
                                    </DialogClose>
                                    {/* Tombol Konfirmasi */}
                                    <Button
                                        variant="destructive"
                                        onClick={handleConfirmReset} // Panggil handler konfirmasi
                                        disabled={isResetting} // Disable juga tombol ini saat proses reset berjalan
                                    >
                                        {/* Tampilkan loader di tombol konfirmasi jika sedang proses */}
                                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Ya, Reset Nilai
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Tombol Edit Semua */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={onEditAll}
                            disabled={isRowEditing || selectedRowCount > 0 || isSavingAll || isResetting}
                            aria-label="Edit Semua Nilai"
                        >
                            <Edit className="mr-2 h-4 w-4" /> Edit Semua Nilai
                        </Button>
                    </>
                )}
                {/* Tombol View Options */}
                <DataTableViewOptions table={table} />
            </div>
        </div>
    );
}
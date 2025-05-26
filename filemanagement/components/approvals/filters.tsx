// src/components/recentfiles/data-table-toolbar.tsx
"use client";

import { Cross2Icon, ArrowDownIcon, ArrowUpIcon, DropdownMenuIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/recentfiles/filters-clear";
import { useState, useMemo } from "react"; // <-- Tambahkan useMemo
import { DataTableViewOptions } from "@/components/recentfiles/actions-menu";
import { TrashIcon, Check, ChevronDown, FilterX, FilterXIcon, LucideFilter, LucideListFilter, LucideFilterX, ChevronUp, Filter, Loader2, AlertTriangle, Ban } from "lucide-react"; // <-- Tambahkan Ban
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Toaster } from "../ui/sooner";
import { toast } from "sonner";
import { CalendarDatePicker } from "../calendar-date-picker";
import { DataTableApplyFilter } from "./apply-filter";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@radix-ui/react-accordion";
import { Dropdown } from "react-day-picker";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import React from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Schema } from "./schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // <-- Tambahkan Tooltip

interface RowData {
  pathname: string;
  mimeType: string;
}
// --- Props Interface ---
// Memastikan ada accessToken, selain id, pathname, mimeType, is_self_file
interface TDataWithRequiredProps extends Schema {
    id: string; // Wajib ada ID
    pathname: string;
    mimeType: string;
    // --- MODIFIKASI: Tambahkan is_self_file sebagai properti opsional ---
    is_self_file?: boolean | null;
    // -------------------------------------------------------------------
    // Tambahkan properti lain dari Schema jika diperlukan di sini
}

interface DataTableToolbarProps<TData extends TDataWithRequiredProps> {
  table: Table<TData>;
  supabase: SupabaseClient | null;
  onRefresh: () => void;
  accessToken: string | null;
  userId: string | null;
  workspaceId: string | null;
}

// Helper untuk mendapatkan nama tipe file yang ramah pengguna (tidak berubah)
function getFriendlyFileType(mimeType: string): string {
    if (!mimeType) { return 'Tidak Dikenal';}
    if (mimeType.startsWith('image/')) return 'Gambar'; if (mimeType.startsWith('video/')) return 'Video'; if (mimeType.startsWith('audio/')) return 'Audio'; if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-zip-compressed')) return 'Arsip ZIP'; if (mimeType === 'application/pdf') return 'Dokumen PDF'; if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'Dokumen Word'; if (mimeType === 'application/vnd.ms-powerpoint' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'Presentasi PPT'; if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'Spreadsheet Excel'; if (mimeType === 'text/plain') return 'Teks Biasa'; if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml') return 'Dokumen Web'; if (mimeType.startsWith('text/')) return 'Dokumen Teks'; if (mimeType === 'application/vnd.google-apps.folder') return 'Folder'; if (mimeType.includes('/')) { const mainType = mimeType.split('/')[0]; let subType = mimeType.split('/')[1]; subType = subType.replace(/^vnd\.|\.|\+xml|x-/g, ' ').trim(); subType = subType.charAt(0).toUpperCase() + subType.slice(1); if (mainType === 'application') return `${subType}`; } return 'File Lain';
}

export function DataTableToolbar<TData extends TDataWithRequiredProps>({
  table,
  supabase,
  onRefresh,
  accessToken,
  userId,
  workspaceId,
}: DataTableToolbarProps<TData>) {

  const allRows = table.getCoreRowModel().rows;

  const uniqueFolder = [
    ...new Set(allRows.map((row) => row.original.pathname))
  ].map((pathname) => ({
    value: pathname,
    label: String(pathname),
  }));

  const uniqueType = [
    ...new Set(
      allRows
        .map((row) => row.original.mimeType)
        .filter((m): m is string => m != null && m !== '')
    ),
  ].map((mimeType) => ({
    value: mimeType,
    label: getFriendlyFileType(mimeType) || mimeType,
  }));

  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedRowsCount = selectedRows.length;

  // --- MODIFIKASI: Cek apakah SEMUA item terpilih dapat dihapus ---
  const canDeleteSelected = useMemo(() => {
    if (selectedRowsCount === 0) return false;
    // Bisa dihapus jika semua item terpilih memiliki is_self_file !== false
    return selectedRows.every(row => row.original.is_self_file !== false);
  }, [selectedRows, selectedRowsCount]);
  // -------------------------------------------------------------

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const GOOGLE_API_BASE_URL = "https://www.googleapis.com/drive/v3/files";

  // --- Handler untuk Konfirmasi Hapus File ---
  const handleDeleteConfirm = async () => {
    if (!supabase || !accessToken || !userId || !workspaceId) {
      toast.error("Gagal menghapus: Konfigurasi tidak lengkap.");
      return;
    }
    if (selectedRowsCount === 0) return;

    // --- MODIFIKASI: Guard tambahan di dalam handler ---
    if (!canDeleteSelected) {
        toast.error("Beberapa item terpilih tidak dapat Anda hapus.");
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        return;
    }
    // ---------------------------------------------------

    setIsDeleting(true);
    const results = { success: 0, gdriveFail: 0, dbFail: 0, skipped: 0 };
    // Ambil hanya data file yang bisa dihapus (sebenarnya sudah dicek oleh canDeleteSelected, tapi double check)
    const filesToDelete = selectedRows
                            .map(row => row.original)
                            .filter(file => file.is_self_file !== false);

    if (filesToDelete.length !== selectedRowsCount) {
        results.skipped = selectedRowsCount - filesToDelete.length;
        console.warn(`Skipping ${results.skipped} items because is_self_file is false.`);
    }

    if (filesToDelete.length === 0) {
        toast.info("Tidak ada item yang dapat dihapus.");
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        table.resetRowSelection(); // Tetap reset selection
        return;
    }


    console.log("TOOLBAR: Access Token being used:", accessToken);
    console.log("TOOLBAR: Deleting File IDs:", filesToDelete.map(f => f.id));

    const successfullyDeletedGdriveIds: string[] = [];
    const gdriveDeletionErrors: { filename: string, message: string }[] = []; // Simpan nama file juga

    // 1. Hapus dari Google Drive (Paralel)
    const gdriveDeletePromises = filesToDelete.map(file =>
      fetch(`${GOOGLE_API_BASE_URL}/${file.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(async response => { // Jadikan async untuk membaca body error
        const ok = response.ok || response.status === 204 || response.status === 404; // Anggap 404 OK (sudah hilang)
        let errorData: any = null;
        if (!ok) {
            try { errorData = await response.json(); } catch (e) { errorData = {}; }
        }
        return ({
            ok: ok,
            status: response.status,
            id: file.id,
            filename: file.filename,
            errorData: errorData,
        });
      }).catch(networkError => ({ // Tangani network error juga
          ok: false,
          status: 0, // Atau status custom untuk network error
          id: file.id,
          filename: file.filename,
          errorData: { message: networkError.message || 'Network Error' }
      }))
    );


    const gdriveResults = await Promise.allSettled(gdriveDeletePromises);

    // Proses hasil GDrive
    gdriveResults.forEach((result, index) => {
      const originalFile = filesToDelete[index];
      if (result.status === 'fulfilled' && result.value.ok) {
        successfullyDeletedGdriveIds.push(result.value.id); // Kumpulkan ID yang sukses atau sudah hilang
      } else {
        results.gdriveFail++;
        let errorMsg = `GDrive (${originalFile.filename || originalFile.id})`;
        if (result.status === 'fulfilled') { // Fetch berhasil tapi status tidak OK
           errorMsg += `: ${result.value.status}`;
           if (result.value.errorData && result.value.errorData.error?.message) {
             errorMsg += ` - ${result.value.errorData.error.message}`;
           } else if (result.value.errorData?.message) {
             errorMsg += ` - ${result.value.errorData.message}`;
           }
           if (result.value.status === 401 || result.value.status === 403) {
             errorMsg += " (Sesi/Izin?)";
           }
        } else { // Fetch gagal (network error, etc.)
          errorMsg += `: ${result.reason?.value?.errorData?.message || result.reason?.message || 'Error tidak diketahui'}`;
        }
        gdriveDeletionErrors.push({filename: originalFile.filename || originalFile.id, message: errorMsg});
        console.error(errorMsg, result);
      }
    });

    // Tampilkan error GDrive jika ada
    if (gdriveDeletionErrors.length > 0) {
        const errorSummary = gdriveDeletionErrors.slice(0, 3).map(e => e.message).join('\n- ');
        toast.warning(`Gagal hapus GDrive (${gdriveDeletionErrors.length} item):\n- ${errorSummary}${gdriveDeletionErrors.length > 3 ? '\n- ... (lihat konsol)' : ''}`, { duration: 8000 });
    }

    // 2. Hapus dari Supabase (Bulk untuk yang berhasil di GDrive atau sudah hilang)
    let supabaseErrorOccurred = false;
    if (successfullyDeletedGdriveIds.length > 0) {
      try {
        // Hapus HANYA record yang sesuai dengan user_id dan workspace_id saat ini
        const { error: supabaseError, count } = await supabase
          .from('file')
          .delete({ count: 'exact' })
          .in('id', successfullyDeletedGdriveIds)
          .match({ workspace_id: workspaceId, user_id: userId }); // Pastikan user hanya hapus miliknya

        if (supabaseError) {
          throw supabaseError;
        }

        const actualDeletedCount = count ?? 0;
        results.success = actualDeletedCount;
        // Hitung kegagalan DB sebagai selisih antara yg sukses di GDrive dan yg sukses dihapus di DB
        results.dbFail = successfullyDeletedGdriveIds.length - actualDeletedCount;

        if (results.dbFail > 0) {
             console.warn(`Supabase delete mismatch/partial: Expected up to ${successfullyDeletedGdriveIds.length}, deleted ${actualDeletedCount}. Possible non-owned metadata.`);
             // Tidak perlu toast error di sini, cukup warning di konsol.
             // Pengguna mungkin tidak memiliki metadata untuk file yang dihapus GDrive nya.
        }

      } catch (error: any) {
        supabaseErrorOccurred = true;
        // Jika error terjadi, anggap semua gagal di DB untuk ID yang sukses di GDrive
        results.dbFail = successfullyDeletedGdriveIds.length;
        results.success = 0; // Reset success count
        console.error("Supabase delete error:", error);
        toast.error(`Gagal sinkronisasi DB: ${error.message}`);
      }
    } else {
      // Jika tidak ada yang sukses di GDrive, tidak perlu panggil Supabase delete
      if (results.gdriveFail > 0) {
          // Toast error GDrive sudah muncul di atas.
          console.log("No files successfully deleted from GDrive, skipping Supabase delete.");
      } else if (filesToDelete.length > 0) {
          // Kasus aneh: tidak ada error GDrive, tapi tidak ada ID yg terkumpul?
          console.warn("No GDrive IDs were collected for deletion despite no reported GDrive errors.");
      } else {
          // Tidak ada file yang valid untuk dihapus dari awal
          console.log("No valid files to delete from GDrive.");
      }
    }

    // 3. Laporkan Hasil Akhir & Cleanup
    setIsDeleting(false);
    setDeleteDialogOpen(false);

    // Pesan sukses berdasarkan jumlah yang benar-benar dihapus dari DB
    if (results.success > 0) {
      toast.success(`${results.success} item berhasil dihapus sepenuhnya.`);
    }
    // Pesan warning jika ada yg gagal di GDrive ATAU DB
    if (results.gdriveFail > 0 || results.dbFail > 0) {
        let summary = [];
        if (results.gdriveFail > 0) summary.push(`${results.gdriveFail} gagal GDrive`);
        if (results.dbFail > 0) summary.push(`${results.dbFail} gagal sinkron DB`);
        if (results.skipped > 0) summary.push(`${results.skipped} dilewati (bukan milik Anda)`);
        if (results.success === 0 && summary.length > 0) {
            toast.warning(`Tidak ada item yang dihapus. (${summary.join(', ')})`);
        } else if (summary.length > 0 && results.success > 0) {
             toast.warning(`Selesai dengan catatan: ${summary.join(', ')}.`);
        }
    } else if (results.success === 0 && results.skipped > 0) {
        toast.info(`${results.skipped} item dilewati karena bukan milik Anda. Tidak ada item lain yang dihapus.`);
    } else if (results.success === 0 && results.gdriveFail === 0 && results.dbFail === 0 && results.skipped === 0 && selectedRowsCount > 0) {
        // Jika tidak ada sukses, gagal, atau skip, tapi ada item terpilih? Aneh.
        toast.info("Tidak ada operasi penghapusan yang dilakukan.");
    }


    // Refresh data jika ada potensi perubahan (sukses GDrive atau ada yg dihapus DB)
    if (successfullyDeletedGdriveIds.length > 0 || results.success > 0) {
        table.resetRowSelection();
        onRefresh();
    } else {
        table.resetRowSelection(); // Selalu reset selection
    }
  };


  const [dateRangeDisahkanPada, setDateRangeDisahkanPada] = useState<{ from: Date; to: Date }>({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() });
  const [dateRangeCreatedAt, setDateRangeCreatedAt] = useState<{ from: Date; to: Date }>({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() });
  const [dateRangeLastModified, setDateRangeLastModified] = useState<{ from: Date; to: Date }>({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() });

  const handleDisahkanPada = ({ from, to }: { from: Date; to: Date }) => { setDateRangeDisahkanPada({ from, to }); table.getColumn("pengesahan_pada")?.setFilterValue([from, to]); };
  const handleCreatedAt = ({ from, to }: { from: Date; to: Date }) => { setDateRangeCreatedAt({ from, to }); table.getColumn("createdat")?.setFilterValue([from, to]); };
  const handleLastModified = ({ from, to }: { from: Date; to: Date }) => { setDateRangeLastModified({ from, to }); table.getColumn("lastmodified")?.setFilterValue([from, to]); };

  const [isFilter, setIsFilter] = React.useState(false)
  const toggleisFilter = () => { setIsFilter(!isFilter) }

  return (
    <TooltipProvider delayDuration={100}>
        <div className="flex flex-wrap items-start justify-between">
          {/* Filter Accordion */}
          <div className={`h-auto rounded-lg items-start justify-start outline} border-black/2 mb-4`}>
            <Accordion onClick={toggleisFilter} type="single" collapsible>
                <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className="flex font-medium items-center h-4 gap-2 text-sm outline outline-black/10 h-8 w-auto px-2 rounded-full">
                        <LucideFilter size={14}></LucideFilter> Filter {isFilter ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="mt-4">
                  <DataTableApplyFilter
                    isFilter={isFilter}
                    table={table}
                    isFiltered={isFiltered}
                    uniqueFolder={uniqueFolder}
                    uniqueType={uniqueType}
                    dateRangeDisahkanPada={dateRangeDisahkanPada}
                    dateRangeLastModified={dateRangeLastModified}
                    // dateRangeCreatedAt={dateRangeCreatedAt}
                    handleDisahkanPada={handleDisahkanPada}
                    // handleCreatedAt={handleCreatedAt}
                    handleLastModified={handleLastModified}
                  />
                  </AccordionContent>
                </AccordionItem>
            </Accordion>
          </div>
          <Toaster/>

           <div className="flex flex-wrap items-end gap-2">
            {/* --- MODIFIKASI: Tombol Delete dengan Tooltip & Disable Check --- */}
            {selectedRowsCount > 0 && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* Bungkus DialogTrigger dalam span agar tooltip muncul saat disabled */}
                        <span className={!canDeleteSelected ? 'cursor-not-allowed' : ''} tabIndex={!canDeleteSelected ? 0 : undefined}>
                          <DialogTrigger asChild>
                            <Button
                                className="h-8 px-2 sm:px-3"
                                variant="destructive"
                                disabled={!accessToken || !canDeleteSelected || isDeleting} // Disable jika tidak ada token ATAU tidak semua bisa dihapus ATAU sedang proses
                            >
                              {!canDeleteSelected ? <Ban className="mr-1 sm:mr-2 size-4" /> : <TrashIcon className="mr-1 sm:mr-2 size-4" />}
                              Delete ({selectedRowsCount})
                            </Button>
                          </DialogTrigger>
                        </span>
                    </TooltipTrigger>
                    {!canDeleteSelected && (
                        <TooltipContent>
                            <p>Beberapa item terpilih tidak dapat Anda hapus.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
                <DialogContent className="sm:max-w-md rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20}/>
                        Konfirmasi Hapus File
                    </DialogTitle>
                    <DialogDescription>
                      Anda akan menghapus {selectedRowsCount} item terpilih
                      {/* Pesan tambahan jika ada yang tidak bisa dihapus */}
                      {!canDeleteSelected && ` (beberapa item mungkin tidak dapat Anda hapus)`}
                      . Tindakan ini <span className="font-bold">permanen</span> dan tidak dapat diurungkan. Lanjutkan?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
                    <DialogClose asChild>
                      <Button type="button" className="h-9 px-3" variant={"outline"} disabled={isDeleting}>
                        Batal
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      className="h-9 px-3"
                      onClick={handleDeleteConfirm}
                      variant="destructive"
                      // Disable jika tidak bisa delete, sedang proses, atau data penting hilang
                      disabled={!canDeleteSelected || isDeleting || !accessToken || !supabase || !userId || !workspaceId}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Ya, Hapus"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {/* ---------------------------------------------------------------- */}

            <Input
              placeholder="Cari nama file, deskripsi, folder..."
              value={table.getState().globalFilter ?? ""}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="h-8 w-[250px] text-sm"
            />
            <DataTableViewOptions table={table} />
          </div>
        </div>
    </TooltipProvider>
  );
}
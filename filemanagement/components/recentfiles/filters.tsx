"use client";

import { Cross2Icon, ArrowDownIcon, ArrowUpIcon, DropdownMenuIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/recentfiles/filters-clear";
import { useState } from "react";
import { DataTableViewOptions } from "@/components/recentfiles/actions-menu";
import { TrashIcon, Check, ChevronDown, FilterX, FilterXIcon, LucideFilter, LucideListFilter, LucideFilterX, ChevronUp, Filter, Loader2, AlertTriangle } from "lucide-react";
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

interface RowData {
  pathname: string;
  mimeType: string;
}
// --- Props Interface ---
// Memastikan ada accessToken, selain id, pathname, mimeType
interface TDataWithRequiredProps extends Schema {
    id: string; // Wajib ada ID
    pathname: string;
    mimeType: string;
    // Tambahkan properti lain dari Schema jika diperlukan di sini
}

interface DataTableToolbarProps<TData extends TDataWithRequiredProps> {
  table: Table<TData>;
  supabase: SupabaseClient | null;
  onRefresh: () => void;
  // --- Akses Token Diperlukan untuk GDrive API ---
  // Anda perlu cara untuk mendapatkan access token ini di toolbar.
  // Bisa dari context, state parent, atau prop. Mari tambahkan sebagai prop:
  accessToken: string | null;
  userId: string | null;        // Diperlukan untuk Supabase delete match
  workspaceId: string | null; // Diperlukan untuk Supabase delete match
}

// Helper untuk mendapatkan nama tipe file yang ramah pengguna
function getFriendlyFileType(mimeType: string): string {
    if (!mimeType) {
        return 'Tidak Dikenal'; // Default jika mimeType kosong
    }

    // Cek berdasarkan awalan (contoh)
    if (mimeType.startsWith('image/')) return 'Gambar';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-zip-compressed')) return 'Arsip ZIP';
    if (mimeType === 'application/pdf') return 'Dokumen PDF';
    if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'Dokumen Word';
    if (mimeType === 'application/vnd.ms-powerpoint' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'Presentasi PPT';
    if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'Spreadsheet Excel';
    if (mimeType === 'text/plain') return 'Teks Biasa';
    if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml') return 'Dokumen Web';
    if (mimeType.startsWith('text/')) return 'Dokumen Teks'; // Fallback untuk text/* lain
    if (mimeType === 'application/vnd.google-apps.folder') return 'Folder'; // Jika Anda menangani folder Google Drive

    // Coba ekstrak bagian setelah '/' jika application/* atau tipe lain
    if (mimeType.includes('/')) {
        const mainType = mimeType.split('/')[0];
        let subType = mimeType.split('/')[1];
        // Bersihkan subType dari prefix vendor/eksperimental jika perlu
        subType = subType.replace(/^vnd\.|\.|\+xml|x-/g, ' ').trim(); // Hapus prefix umum & ganti titik/plus/x-
        // Kapitalisasi
        subType = subType.charAt(0).toUpperCase() + subType.slice(1);
        if (mainType === 'application') return `${subType}`; // Misal: 'Pdf', 'Zip', 'Json'
        // Anda bisa menambahkan logika lain di sini
    }


    return 'File Lain'; // Default jika tidak ada yang cocok
}

export function DataTableToolbar<TData extends TDataWithRequiredProps>({
  table,
  supabase,
  onRefresh,
  accessToken, // Terima accessToken
  userId,       // Terima userId
  workspaceId,  // Terima workspaceId
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
        .filter((m): m is string => m != null && m !== '') // Filter null/undefined/empty mimeTypes
    ),
  ].map((mimeType) => ({
    value: mimeType,
    label: getFriendlyFileType(mimeType) || mimeType,
  }));

  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows; // Ambil baris terpilih
  const selectedRowsCount = selectedRows.length; // Hitung jumlahnya

  // --- AKHIR PERBAIKAN ---

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false); // State dialog konfirmasi hapus
  const [isDeleting, setIsDeleting] = useState(false); // State loading saat proses hapus
  
  // --- URL Google Drive API ---
  const GOOGLE_API_BASE_URL = "https://www.googleapis.com/drive/v3/files";

  // --- Handler untuk Konfirmasi Hapus File (Logika Baru) ---
  const handleDeleteConfirm = async () => {
    // Validasi Awal
    if (!supabase || !accessToken || !userId || !workspaceId) {
      toast.error("Gagal menghapus: Konfigurasi tidak lengkap (DB/Auth/User/Workspace).");
      console.error("Delete aborted: Missing required props.", { hasSupabase: !!supabase, hasToken: !!accessToken, userId, workspaceId });
      return;
    }
    
    if (selectedRowsCount === 0) return;

    setIsDeleting(true);
    const results = { success: 0, gdriveFail: 0, dbFail: 0 };
    const filesToDelete = selectedRows.map(row => row.original); // Ambil data asli
    // ---> TAMBAHKAN LOG DI SINI <---
    console.log("TOOLBAR: Access Token being used:", accessToken);
    console.log("TOOLBAR: Deleting File IDs:", filesToDelete.map(f => f.id));
    // ---> AKHIR LOG <---

    const successfullyDeletedGdriveIds: string[] = [];
    const gdriveDeletionErrors: string[] = [];

    // 1. Hapus dari Google Drive (Paralel)
    const gdriveDeletePromises = filesToDelete.map(file =>
      fetch(`${GOOGLE_API_BASE_URL}/${file.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(response => ({ // Kembalikan objek dengan status dan ID
        ok: response.ok || response.status === 204, // Anggap 204 OK
        status: response.status,
        id: file.id,
        filename: file.filename,
        errorData: response.ok || response.status === 204 ? null : response.json().catch(() => ({})), // Coba parse error jika gagal
      }))
    );

    const gdriveResults = await Promise.allSettled(gdriveDeletePromises);

    // Proses hasil GDrive
    gdriveResults.forEach((result, index) => {
      const originalFile = filesToDelete[index];
      if (result.status === 'fulfilled' && result.value.ok) {
        successfullyDeletedGdriveIds.push(result.value.id); // Kumpulkan ID yang sukses
      } else {
        results.gdriveFail++;
        let errorMsg = `Gagal hapus GDrive (${originalFile.filename})`;
        if (result.status === 'fulfilled') { // Fetch berhasil tapi status tidak OK
           errorMsg += `: Status ${result.value.status}`;
           if (result.value.errorData && result.value.status) {
             errorMsg += ` - ${result.value.status}`;
           }
           if (result.value.status === 401 || result.value.status === 403) {
             errorMsg += " (Sesi berakhir?)";
           }
        } else { // Fetch gagal (network error, etc.)
          errorMsg += `: ${result.reason?.message || 'Error tidak diketahui'}`;
        }
        gdriveDeletionErrors.push(errorMsg);
        console.error(errorMsg, result);
      }
    });

    // Tampilkan error GDrive jika ada (sebelum lanjut ke DB)
    if (gdriveDeletionErrors.length > 0) {
        toast.warning(`Sebagian gagal dihapus dari GDrive:\n- ${gdriveDeletionErrors.slice(0, 3).join('\n- ')}${gdriveDeletionErrors.length > 3 ? '\n- ... (lihat konsol)' : ''}`, { duration: 8000 });
    }

    // 2. Hapus dari Supabase (Bulk untuk yang berhasil di GDrive)
    let supabaseErrorOccurred = false;
    if (successfullyDeletedGdriveIds.length > 0) {
      try {
        // **PENTING:** Ganti 'your_files_table' dengan nama tabel Anda
        const { error: supabaseError, count } = await supabase
          .from('file') // <-- Nama tabel sudah diganti menjadi 'file'
          .delete({ count: 'exact' }) // Minta hitungan untuk verifikasi
          .in('id', successfullyDeletedGdriveIds)
          // Sesuaikan match jika perlu (misal hanya boleh hapus milik user tsb)
          .match({ workspace_id: workspaceId, user_id: userId }); // Pastikan user hanya hapus miliknya di workspace ini

        if (supabaseError) {
          throw supabaseError; // Lempar error untuk ditangkap di catch
        }

        // Verifikasi jumlah yang dihapus (opsional tapi bagus)
        if (count !== successfullyDeletedGdriveIds.length) {
             console.warn(`Supabase delete count mismatch: Expected ${successfullyDeletedGdriveIds.length}, deleted ${count}`);
             toast.warning("Sinkronisasi metadata mungkin tidak lengkap.");
             // Hitung kegagalan DB berdasarkan perbedaan count
             results.dbFail = successfullyDeletedGdriveIds.length - (count ?? 0);
             results.success = count ?? 0; // Sukses hanya yang benar2 terhapus di DB
        } else {
             results.success = count ?? 0; // Semua yang sukses di GDrive, sukses juga di DB
        }

      } catch (error: any) {
        supabaseErrorOccurred = true;
        results.dbFail = successfullyDeletedGdriveIds.length; // Anggap semua gagal di DB jika ada error
        console.error("Supabase delete error:", error);
        toast.error(`Gagal sinkronisasi penghapusan di database: ${error.message}`);
      }
    } else {
      // Jika tidak ada yang sukses di GDrive, tidak perlu panggil Supabase delete
      if (results.gdriveFail > 0) {
          toast.error("Semua file gagal dihapus dari Google Drive. Tidak ada perubahan di database.");
      } else {
          // Kasus aneh: tidak ada yg dipilih atau array kosong?
          toast.info("Tidak ada file untuk dihapus dari Google Drive.");
      }
    }

    // 3. Laporkan Hasil Akhir & Cleanup
    setIsDeleting(false);
    setDeleteDialogOpen(false);

    if (results.success > 0) {
      toast.success(`${results.success} file berhasil dihapus sepenuhnya.`);
    }
    if (results.dbFail > 0) {
        // Error ini sudah ditangani di blok catch Supabase, mungkin tidak perlu toast lagi
        console.error(`${results.dbFail} file gagal dihapus dari database meskipun mungkin sudah terhapus dari GDrive.`);
    }
     if (results.gdriveFail > 0 && results.success === 0 && !supabaseErrorOccurred){
        // Jika semua gagal di GDrive, toast error sudah muncul di atas.
     }


    // Refresh data jika ada perubahan (sukses atau gagal di DB setelah sukses di GDrive)
    if (successfullyDeletedGdriveIds.length > 0) {
        table.resetRowSelection();
        onRefresh();
    } else if (results.gdriveFail === 0 && selectedRowsCount > 0) {
         // Jika tidak ada error GDrive tapi tidak ada ID yg terkumpul? Kasus aneh.
         console.warn("No GDrive IDs were collected for deletion despite no reported GDrive errors.");
         table.resetRowSelection(); // Tetap reset selection
    }


  };


  const [dateRangeCreatedAt, setDateRangeCreatedAt] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  });
  const [dateRangeLastModified, setDateRangeLastModified] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  });

  const handleCreatedAt = ({ from, to }: { from: Date; to: Date }) => {
    setDateRangeCreatedAt({ from, to });
    // Filter table data based on selected date range
    table.getColumn("createdat")?.setFilterValue([from, to]);
  };


  const handleLastModified = ({ from, to }: { from: Date; to: Date }) => {
    setDateRangeLastModified({ from, to });
    // Filter table data based on selected date range
    table.getColumn("lastmodified")?.setFilterValue([from, to]);
  };

  const [isFilter, setIsFilter] = React.useState(false)
  const toggleisFilter = () => {
    setIsFilter(!isFilter)
  }

  return (
    <div className="flex flex-wrap items-start justify-between">

      <div className={`h-auto rounded-lg items-start justify-start outline} border-black/2`}>
        <Accordion onClick={toggleisFilter} type="single" collapsible>
            <AccordionItem value="item-1">
            <AccordionTrigger>

              {isFilter ? 
                <div className="flex font-medium items-center h-4 gap-2 text-sm outline outline-black/10 h-8 w-auto px-2 rounded-full">
                  <LucideFilter size={14}></LucideFilter> Filter
                </div>
                  :
                <div className="flex font-medium items-center h-4 gap-2 text-sm outline outline-black/10 h-8 w-auto px-2 rounded-full">
                  <LucideFilter size={14}></LucideFilter> Filter
                </div>
              }

          </AccordionTrigger>
            <AccordionContent className="mt-4">
              <DataTableApplyFilter
                isFilter={isFilter}
                table={table}
                isFiltered={isFiltered}
                uniqueFolder={uniqueFolder} // <--- Perbaiki jadi uniqueFolder
                uniqueType={uniqueType}
                dateRangeLastModified={dateRangeLastModified}
                dateRangeCreatedAt={dateRangeCreatedAt}
                handleCreatedAt={handleCreatedAt}
                handleLastModified={handleLastModified}
              />
              </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
      <Toaster/>

       <div className="flex flex-wrap items-end gap-2">
        {/* Tombol Delete */}
        {selectedRowsCount > 0 && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 px-2 sm:px-3" variant="destructive" disabled={!accessToken}> {/* Disable jika tidak ada token */}
                <TrashIcon className="mr-1 sm:mr-2 size-4" />
                Delete ({selectedRowsCount})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"> {/* Tambah ikon */}
                    <AlertTriangle className="text-red-500" size={20}/>
                    Konfirmasi Hapus File
                </DialogTitle>
                <DialogDescription>
                  Anda akan menghapus {selectedRowsCount} item terpilih dari Google Drive dan database.
                  Tindakan ini <span className="font-bold">permanen</span> dan tidak dapat diurungkan. Lanjutkan?
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
                  disabled={isDeleting || !accessToken || !supabase || !userId || !workspaceId} // Disable juga jika data penting hilang
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Ya, Hapus Permanen"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      <Input
        placeholder="Cari nama file, deskripsi, folder..."
        value={table.getState().globalFilter ?? ""}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className="h-8 w-[250px]"
      />
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

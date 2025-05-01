// src/components/recentfiles/data-table-row-actions.tsx
"use client";

// React & Libraries
import React, { useState, useEffect, useMemo } from "react";
import { Row } from "@tanstack/react-table";
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";
// Import lebih banyak helper dan tipe Month dari date-fns
import {
    isValid, format, startOfDay, parseISO,
    getDate, getMonth, getYear, setDate, setMonth, setYear,
    getDaysInMonth, isBefore, isAfter,
    Month // <-- Tambahkan impor tipe Month
} from 'date-fns';
import { id as localeID } from "date-fns/locale";

// Lucide Icons
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Pencil, Download, Trash2, Loader2, AlertTriangle, XIcon, Ban } from "lucide-react"; // <-- Tambahkan Ban

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // <-- Tambahkan Tooltip

// Tipe Lokal
import { Schema } from "@/components/recentfiles/schema"; // Sesuaikan path jika perlu

// --- Props Interface ---
export interface DataTableRowActionsProps {
  row: Row<Schema>;
  accessToken: string | null;
  onActionComplete: () => void;
  supabase: SupabaseClient;
  userId: string;
  workspaceId: string;
}

const GOOGLE_API_BASE_URL = "https://www.googleapis.com/drive/v3/files";

// --- Konstanta Tanggal ---
const MIN_YEAR = 1970;
const CURRENT_YEAR = new Date().getFullYear(); // Ambil tahun saat ini
const MAX_YEAR = CURRENT_YEAR + 10; // Tambahkan 10 tahun

// --- Komponen Utama ---
export function DataTableRowActions({
  row,
  accessToken,
  onActionComplete,
  supabase,
  userId,
  workspaceId,
}: DataTableRowActionsProps) {
  const item = row.original;
  // --- MODIFIKASI: Cek apakah file ini milik pengguna saat ini ---
  // Anggap 'true', 'null', atau 'undefined' berarti milik sendiri atau boleh dimodifikasi.
  // Hanya 'false' yang secara eksplisit melarang modifikasi.
  const canModify = item.is_self_file !== false;
  // ------------------------------------------------------------

  // State Dialog Edit
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(item.filename);
  const [editedDescription, setEditedDescription] = useState(item.description || "");
  const [editedPengesahanPada, setEditedPengesahanPada] = useState<Date | null>(null);
  const [initialPengesahanPada, setInitialPengesahanPada] = useState<Date | null>(null);

  // State Lain
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Efek Inisialisasi Form Edit
  useEffect(() => {
    if (isEditDialogOpen) {
      // --- MODIFIKASI: Jangan buka dialog jika tidak bisa modify ---
      if (!canModify) {
        toast.warning("Anda tidak memiliki izin untuk mengedit item ini.");
        setIsEditDialogOpen(false);
        return;
      }
      // ----------------------------------------------------------
      setEditedName(item.filename);
      setEditedDescription(item.description || "");
      const initialDateRaw = item.pengesahan_pada ? parseISO(item.pengesahan_pada) : null;
      const validInitialDate = initialDateRaw && isValid(initialDateRaw) ? startOfDay(initialDateRaw) : null;
      setEditedPengesahanPada(validInitialDate);
      setInitialPengesahanPada(validInitialDate);
    }
  }, [isEditDialogOpen, item, canModify]); // <-- Tambahkan canModify ke dependency

  // Cek Perubahan
  const hasChanges = useMemo(() => {
    const nameChanged = editedName !== item.filename;
    const descriptionChanged = editedDescription !== (item.description || "");
    const pengesahanChanged = (editedPengesahanPada?.getTime() ?? null) !== (initialPengesahanPada?.getTime() ?? null);
    return nameChanged || descriptionChanged || pengesahanChanged;
  }, [editedName, editedDescription, editedPengesahanPada, item.filename, item.description, initialPengesahanPada]);

  // --- Helper untuk Dropdown Tanggal ---
  const currentDay = useMemo(() => editedPengesahanPada ? getDate(editedPengesahanPada) : null, [editedPengesahanPada]);
  const currentMonth = useMemo(() => editedPengesahanPada ? getMonth(editedPengesahanPada) : null, [editedPengesahanPada]); // 0-11
  const currentYear = useMemo(() => editedPengesahanPada ? getYear(editedPengesahanPada) : null, [editedPengesahanPada]);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
      years.push({ value: y.toString(), label: y.toString() });
    }
    return years;
  }, []);

  // --- Perbaiki monthOptions dengan Type Assertion ---
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i.toString(), // 0-11
      // Gunakan type assertion 'as Month' di sini
      label: localeID.localize?.month(i as Month, { width: 'wide' }) || (i + 1).toString(),
    }));
  }, []);

  const dayOptions = useMemo(() => {
    const days = [];
    const relevantYear = currentYear ?? new Date().getFullYear();
    const relevantMonth = currentMonth ?? 0; // Default ke Januari (0) jika null
    // Pastikan relevantMonth adalah number saat memanggil getDaysInMonth
    const daysInMonth = getDaysInMonth(new Date(relevantYear, relevantMonth as number));

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ value: d.toString(), label: d.toString() });
    }
    return days;
  }, [currentMonth, currentYear]);

  // --- Handler Perubahan Dropdown Tanggal ---
  const handleDatePartChange = (part: 'day' | 'month' | 'year', valueStr: string) => {
    const value = parseInt(valueStr, 10);
    if (isNaN(value)) return;

    let baseDate = editedPengesahanPada ?? startOfDay(new Date());

    let currentDayNumber: number = getDate(baseDate);
    let currentMonthNumber: number = getMonth(baseDate); // 0-11
    let currentYearNumber: number = getYear(baseDate);

    let targetDay: number = currentDayNumber;
    let targetMonth: number = currentMonthNumber;
    let targetYear: number = currentYearNumber;

    if (part === 'day') {
      targetDay = value;
    } else if (part === 'month') {
      targetMonth = value as number; // Ini adalah index 0-11
    } else { // part === 'year'
      targetYear = value;
    }

    // --- Validasi dan Penyesuaian Hari ---
    const daysInTargetMonth = getDaysInMonth(new Date(targetYear, targetMonth as number));

    if (targetDay > daysInTargetMonth) {
      targetDay = daysInTargetMonth;
    }

    // Gunakan 'as number' untuk konsistensi
    let newDate = new Date(targetYear, targetMonth as number, targetDay);

    // --- Validasi Rentang Tanggal (Gunakan MIN/MAX YEAR) ---
    const minAllowedDate = new Date(MIN_YEAR, 0, 1);
    const maxAllowedDate = new Date(MAX_YEAR, 11, 31);

    if (!isValid(newDate) || isBefore(newDate, minAllowedDate) || isAfter(newDate, maxAllowedDate)) {
       console.warn(`Tanggal tidak valid atau di luar rentang (${MIN_YEAR}-${MAX_YEAR}):`, newDate);
       toast.warning(`Tanggal tidak valid atau di luar rentang (${MIN_YEAR}-${MAX_YEAR}).`);
       return;
    }

    setEditedPengesahanPada(startOfDay(newDate));
  };


  // *** Handler Edit ***
  const handleEditSave = async () => {
    // --- MODIFIKASI: Guard di awal fungsi ---
    if (!canModify) {
        toast.error("Anda tidak diizinkan mengedit item ini.");
        setIsEditDialogOpen(false); // Tutup dialog jika terbuka secara tidak sengaja
        return;
    }
    // -----------------------------------------

    if (!item.id || !accessToken || isSaving || !supabase || !userId || !workspaceId) { toast.error("Data tidak lengkap."); return; }
    if (editedName.trim() === '') { toast.error("Nama file kosong."); return; }
    if (!hasChanges) { setIsEditDialogOpen(false); return; }
    setIsSaving(true);
    let gdriveUpdateSuccess = true;
    try {
      const nameChanged = editedName !== item.filename;
      const descriptionChanged = editedDescription !== (item.description || "");
      if (nameChanged || descriptionChanged) {
          const bodyGdrive: { name?: string; description?: string } = {};
          if (nameChanged) bodyGdrive.name = editedName;
          // Selalu kirim deskripsi jika berubah ATAU jika memang ada isinya (untuk menghapus deskripsi GDrive jika dikosongkan di UI)
          if (descriptionChanged || editedDescription) bodyGdrive.description = editedDescription;
          console.log("Updating GDrive:", bodyGdrive);
          const responseGdrive = await fetch(`${GOOGLE_API_BASE_URL}/${item.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(bodyGdrive) });
          if (!responseGdrive.ok) { gdriveUpdateSuccess = false; const d = await responseGdrive.json().catch(() => ({})); throw new Error(d.error?.message || `Gagal update GDrive (${responseGdrive.status})`); }
      }
      const supabaseDataToUpsert: any = { id: item.id, workspace_id: workspaceId, user_id: userId };
      let metadataChanged = false;
      const pengesahanChanged = (editedPengesahanPada?.getTime() ?? null) !== (initialPengesahanPada?.getTime() ?? null);

      // Periksa apakah deskripsi berubah atau memang ada isinya (untuk konsistensi)
      if (descriptionChanged || editedDescription) {
          supabaseDataToUpsert.description = editedDescription;
          metadataChanged = true;
      }
      if (pengesahanChanged) {
          supabaseDataToUpsert.pengesahan_pada = editedPengesahanPada ? editedPengesahanPada.toISOString() : null;
          metadataChanged = true;
      }
      // Pastikan is_self_file tetap true (atau sesuai nilai aslinya) saat user mengedit item miliknya
      // Tidak perlu mengirim is_self_file karena ini hanya terjadi jika canModify=true (yang berarti is_self_file !== false)
      // Jika diperlukan logika khusus, bisa ditambahkan di sini.

      if (metadataChanged) {
          console.log("Upserting Supabase:", supabaseDataToUpsert);
          // Gunakan upsert untuk membuat atau memperbarui record metadata
          const { error: supabaseError } = await supabase.from('file').upsert(supabaseDataToUpsert, { onConflict: 'id, workspace_id, user_id' });
          if (supabaseError) { console.error("Supabase Upsert Error:", supabaseError); if (gdriveUpdateSuccess && (nameChanged || descriptionChanged)) { toast.warning("GDrive sukses, tapi gagal simpan metadata DB."); } else { throw new Error(`Gagal simpan metadata DB: ${supabaseError.message}`); } }
          else { toast.success(`Perubahan metadata untuk "${editedName}" disimpan.`); }
      } else {
          // Jika hanya nama GDrive yang berubah
          if (gdriveUpdateSuccess && nameChanged) { toast.success(`Nama file "${editedName}" diperbarui di GDrive.`); }
          // Jika hanya deskripsi GDrive yang berubah (dan tidak ada perubahan metadata lain)
          else if (gdriveUpdateSuccess && descriptionChanged && !nameChanged) { toast.success(`Deskripsi untuk "${editedName}" berhasil diperbarui.`);}
          else { console.log("Tidak ada metadata DB yang perlu disimpan."); }
      }
      setIsEditDialogOpen(false);
      onActionComplete();
    } catch (error: any) { console.error("Save Error:", error); toast.error(error.message || "Gagal menyimpan."); }
    finally { setIsSaving(false); }
  };

  // Handler Unduh (Tidak ada perubahan)
  const handleDownload = async () => { /* ... kode sama ... */ if(!item.id||!accessToken||isDownloading||item.isFolder)return;const isGoogleDoc=item.mimeType?.includes('google-apps')&&!item.mimeType.includes('folder');let exportMimeType='application/pdf',downloadFilename=item.filename||'download';if(isGoogleDoc){if(item.mimeType?.includes('spreadsheet')){exportMimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';downloadFilename=`${item.filename||'spreadsheet'}.xlsx`;}else if(item.mimeType?.includes('presentation')){exportMimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation';downloadFilename=`${item.filename||'presentation'}.pptx`;}else if(item.mimeType?.includes('document')){exportMimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document';downloadFilename=`${item.filename||'document'}.docx`;}else if(item.mimeType?.includes('drawing')){exportMimeType='image/png';downloadFilename=`${item.filename||'drawing'}.png`;}} const downloadUrl=isGoogleDoc?`${GOOGLE_API_BASE_URL}/${item.id}/export?mimeType=${encodeURIComponent(exportMimeType)}`:`${GOOGLE_API_BASE_URL}/${item.id}?alt=media`;setIsDownloading(true);toast.info(`Mulai unduh "${downloadFilename}"...`,{duration:4000});try{const response=await fetch(downloadUrl,{method:'GET',headers:{'Authorization':`Bearer ${accessToken}`}});if(!response.ok){const s=response.status;const d=await response.json().catch(()=>({}));throw new Error(d.error?.message||`Gagal unduh (${s})`+(s===401||s===403?'. Sesi mungkin berakhir.':''));} const blob=await response.blob();const url=window.URL.createObjectURL(blob);const a=document.createElement('a');a.style.display='none';a.href=url;a.download=downloadFilename;document.body.appendChild(a);a.click();window.URL.revokeObjectURL(url);a.remove();}catch(error:any){console.error("Download Error:",error);toast.error(error.message||"Gagal unduh.");}finally{setIsDownloading(false);}};

  // Handler Hapus
  const handleDeleteConfirm = async () => {
     // --- MODIFIKASI: Guard di awal fungsi ---
     if (!canModify) {
        toast.error("Anda tidak diizinkan menghapus item ini.");
        setIsDeleteDialogOpen(false); // Tutup dialog jika terbuka secara tidak sengaja
        return;
    }
    // -----------------------------------------
    if(!item.id||!accessToken||isDeleting||!supabase||!userId||!workspaceId)return;
    setIsDeleting(true);
    try{
        const responseGdrive=await fetch(`${GOOGLE_API_BASE_URL}/${item.id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${accessToken}`}});
        // Periksa status 404 (Not Found) juga, mungkin file sudah dihapus di GDrive
        if(responseGdrive.status!==204 && responseGdrive.status !== 404 && !responseGdrive.ok){
            const s=responseGdrive.status;
            const d=await responseGdrive.json().catch(()=>({}));
            throw new Error(d.error?.message||`Gagal hapus GDrive (${s})`+(s===401||s===403?'. Sesi mungkin berakhir.':''));
        }
        // Hapus metadata dari Supabase HANYA jika milik user ini
        const{error:supabaseError}=await supabase.from('file').delete().match({id:item.id,workspace_id:workspaceId,user_id:userId});
        if(supabaseError){
            console.error("Supabase delete error:",supabaseError);
            // Beri warning jika GDrive berhasil (atau sudah tidak ada) tapi DB gagal
            if(responseGdrive.ok || responseGdrive.status === 404) {
                 toast.warning("GDrive dihapus/tidak ada, tapi gagal sinkron metadata DB.");
            } else {
                 // Jika GDrive juga gagal, tampilkan error GDrive utama
                 toast.error(`Gagal hapus metadata DB: ${supabaseError.message}`);
            }
        } else {
            toast.success(`"${item.filename}" dihapus.`);
        }
        onActionComplete();
    } catch(error:any){
        console.error("Delete Error:",error);
        toast.error(error.message||"Gagal hapus.");
    } finally{
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
    }
  };

  // --- Render JSX ---
  if (!accessToken || !userId || !workspaceId || !supabase) {
    return <div className="w-8 h-8 flex items-center justify-center text-muted-foreground" title="Aksi tidak tersedia"><DotsHorizontalIcon /></div>;
  }

  return (
    <TooltipProvider delayDuration={100}>
      {/* Dropdown Menu Aksi */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                <DotsHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {/* -- MODIFIKASI: Tambahkan disabled dan Tooltip jika !canModify -- */}
          <Tooltip>
             <TooltipTrigger asChild>
                {/* Bungkus DropdownMenuItem dalam span agar Tooltip bisa menargetkannya saat disabled */}
                <span className={!canModify ? 'block cursor-not-allowed' : ''} tabIndex={!canModify ? 0 : undefined}>
                    <DropdownMenuItem
                        onSelect={() => { if (canModify) setIsEditDialogOpen(true); }}
                        disabled={!canModify || isSaving}
                        className={!canModify ? 'cursor-not-allowed !text-muted-foreground' : ''}
                    >
                        {!canModify ? <Ban className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                        Edit
                    </DropdownMenuItem>
                </span>
             </TooltipTrigger>
             {!canModify && <TooltipContent side="left"><p>Anda tidak dapat mengedit item ini</p></TooltipContent>}
          </Tooltip>
          {/* ---------------------------------------------------------------- */}
          <DropdownMenuItem onClick={handleDownload} disabled={isDownloading || !!item.isFolder}>
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Unduh
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* -- MODIFIKASI: Tambahkan disabled dan Tooltip jika !canModify -- */}
           <Tooltip>
             <TooltipTrigger asChild>
                <span className={!canModify ? 'block cursor-not-allowed' : ''} tabIndex={!canModify ? 0 : undefined}>
                    <DropdownMenuItem
                        className={`text-red-600 focus:bg-red-50 focus:text-red-700 ${!canModify ? 'cursor-not-allowed !text-muted-foreground !focus:bg-transparent' : ''}`}
                        onSelect={(e) => {
                            if (!canModify) {
                                e.preventDefault(); // Cegah penutupan dropdown
                                toast.warning("Anda tidak dapat menghapus item ini.");
                            } else {
                                e.preventDefault();
                                setIsDeleteDialogOpen(true);
                            }
                        }}
                        disabled={!canModify || isDeleting}
                    >
                        {!canModify ? <Ban className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Hapus
                    </DropdownMenuItem>
                </span>
             </TooltipTrigger>
             {!canModify && <TooltipContent side="left"><p>Anda tidak dapat menghapus item ini</p></TooltipContent>}
          </Tooltip>
          {/* ---------------------------------------------------------------- */}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog Edit (Hanya render jika bisa modify) */}
      {canModify && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Edit Detail</DialogTitle>
                    <DialogDescription>Ubah detail: <strong className="break-all">{item.filename}</strong></DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Nama */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`edit-name-${item.id}`} className="text-right">Nama</Label>
                        <Input id={`edit-name-${item.id}`} value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" disabled={isSaving} required />
                    </div>
                    {/* Deskripsi */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor={`edit-description-${item.id}`} className="text-right pt-2">Deskripsi</Label>
                        <Textarea id={`edit-description-${item.id}`} value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="col-span-3" placeholder="(Opsional)" disabled={isSaving} rows={3} />
                    </div>
                    {/* Input Tanggal */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Disahkan</Label>
                        <div className="col-span-3 flex items-center gap-x-2">
                            <Select value={currentDay?.toString()} onValueChange={(value) => handleDatePartChange('day', value)} disabled={isSaving}>
                                <SelectTrigger id={`edit-day-${item.id}`} className="w-[80px] rounded-lg"><SelectValue placeholder="Hari" /></SelectTrigger>
                                <SelectContent>{dayOptions.map(opt => (<SelectItem key={`day-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                            </Select>
                            <Select value={currentMonth?.toString()} onValueChange={(value) => handleDatePartChange('month', value)} disabled={isSaving}>
                                <SelectTrigger id={`edit-month-${item.id}`} className="flex-1 rounded-lg"><SelectValue placeholder="Bulan" /></SelectTrigger>
                                <SelectContent>{monthOptions.map(opt => (<SelectItem key={`month-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                            </Select>
                            <Select value={currentYear?.toString()} onValueChange={(value) => handleDatePartChange('year', value)} disabled={isSaving}>
                                <SelectTrigger id={`edit-year-${item.id}`} className="w-[100px] rounded-lg"><SelectValue placeholder="Tahun" /></SelectTrigger>
                                <SelectContent>{yearOptions.map(opt => (<SelectItem key={`year-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                            </Select>
                            {editedPengesahanPada && (
                                <Button variant="ghost" size="icon" type="button" className="h-9 w-9 text-muted-foreground hover:text-destructive p-0 ml-1" onClick={() => setEditedPengesahanPada(null)} disabled={isSaving} aria-label="Kosongkan Tanggal Pengesahan">
                                <XIcon className="h-4 w-4" /><span className="sr-only">Kosongkan</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Batal</Button></DialogClose>
                    <Button type="button" onClick={handleEditSave} disabled={isSaving || editedName.trim() === '' || !hasChanges}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {/* AlertDialog Hapus (Hanya render jika bisa modify) */}
      {canModify && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="text-red-500" /> Konfirmasi Hapus
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                      Yakin ingin hapus {item.isFolder ? 'folder' : 'file'} <strong className="break-all">"{item.filename}"</strong>? Tindakan ini tidak dapat diurungkan.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                  <AlertDialogAction
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500"
                  >
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ya, Hapus
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </TooltipProvider>
  );
}
// src/components/recentfiles/actions.tsx atau path yang sesuai
"use client";

// React & Libraries
import React, { useState, useEffect, useMemo } from "react";
import { Row } from "@tanstack/react-table";
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";
// Fungsi date-fns yang dibutuhkan
import {
    isValid, format, startOfDay,
    getDate, getMonth, getYear, setDate, setMonth, setYear,
    getDaysInMonth
} from 'date-fns';
import { id as localeID } from "date-fns/locale";

// Lucide Icons
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Pencil, Download, Trash2, Loader2, AlertTriangle, XIcon } from "lucide-react";

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Impor Select ShadCN
import { cn } from "@/lib/utils";

// Tipe Lokal
import { Schema } from "@/components/recentfiles/schema";

// --- Props Interface ---
// (Tetap sama)
export interface DataTableRowActionsProps {
    row: Row<Schema>;
    accessToken: string | null;
    onActionComplete: () => void;
    supabase: SupabaseClient;
    userId: string;
    workspaceId: string;
}

const GOOGLE_API_BASE_URL = "https://www.googleapis.com/drive/v3/files";

// --- Helper Data ---
const currentFullYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 20 }, (_, i) => (currentFullYear - 10 + i).toString()); // Rentang 20 tahun
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(), // 0-11
  label: format(new Date(2000, i, 1), "MMMM", { locale: localeID }) // Nama bulan Indonesia
}));

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

    // State Dialog Edit
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editedName, setEditedName] = useState(item.filename);
    const [editedDescription, setEditedDescription] = useState(item.description || "");
    const [editedPengesahanPada, setEditedPengesahanPada] = useState<Date | null>(null);
    const [initialPengesahanPada, setInitialPengesahanPada] = useState<Date | null>(null);

    // State Lain (Tetap sama)
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Efek Inisialisasi Form Edit
    useEffect(() => {
        if (isEditDialogOpen) {
            setEditedName(item.filename);
            setEditedDescription(item.description || "");
            const initialDateISO = item.pengesahan_pada;
            let validInitialDate: Date | null = null;
            if (initialDateISO) {
                const parsedDate = new Date(initialDateISO);
                if (isValid(parsedDate)) {
                    validInitialDate = startOfDay(parsedDate);
                }
            }
            setEditedPengesahanPada(validInitialDate);
            setInitialPengesahanPada(validInitialDate);
        }
    }, [isEditDialogOpen, item]);

    // Helper untuk format tanggal ke yyyy-MM-dd (untuk perbandingan)
    const formatDateOnlyString = (d: Date | null): string | null => {
        return d && isValid(d) ? format(startOfDay(d), 'yyyy-MM-dd') : null;
    }

    // Cek Perubahan (Bandingkan hanya bagian tanggal)
    const hasChanges = useMemo(() => {
        const nameChanged = editedName !== item.filename;
        const descriptionChanged = editedDescription !== (item.description || "");
        const initialDateString = formatDateOnlyString(initialPengesahanPada);
        const editedDateString = formatDateOnlyString(editedPengesahanPada);
        const pengesahanChanged = initialDateString !== editedDateString;
        return nameChanged || descriptionChanged || pengesahanChanged;
    }, [editedName, editedDescription, editedPengesahanPada, item.filename, item.description, initialPengesahanPada]);

    // --- Handler Perubahan Dropdown Tanggal/Bulan/Tahun ---
    const handleDatePartChange = (value: string, part: 'day' | 'month' | 'year') => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) return;

        // Ambil tanggal saat ini atau buat tanggal baru jika null (misal, hari ini)
        const currentDate = editedPengesahanPada || startOfDay(new Date());
        let newDate = new Date(currentDate); // Salin

        try {
            if (part === 'year') {
                newDate = setYear(newDate, numValue);
            } else if (part === 'month') {
                newDate = setMonth(newDate, numValue); // numValue sudah 0-11
            } else if (part === 'day') {
                newDate = setDate(newDate, numValue);
            }

            // Validasi: Pastikan tanggal yang di-set valid (misal tidak set 31 di bulan Februari)
            // Jika setelah setYear/setMonth, tanggal menjadi tidak valid (misal 31 Feb),
            // date-fns biasanya akan otomatis menggulir ke bulan berikutnya (misal 3 Maret).
            // Kita perlu perbaiki ini agar sesuai dengan tanggal yang dipilih pengguna, jika memungkinkan.
            if (part === 'month' || part === 'year') {
                 const daysInMonth = getDaysInMonth(newDate);
                 if (getDate(newDate) > daysInMonth) {
                     newDate = setDate(newDate, daysInMonth); // Set ke hari terakhir bulan itu
                 }
            }

            // Validasi akhir: pastikan hasil akhir valid
             if (!isValid(newDate)) {
                 console.warn("Kombinasi tanggal tidak valid:", value, part);
                 toast.error("Kombinasi tanggal, bulan, tahun tidak valid.");
                 return; // Jangan update state jika tidak valid
             }


            setEditedPengesahanPada(startOfDay(newDate));

        } catch (error) {
            console.error("Error setting date part:", error);
            toast.error("Gagal mengubah tanggal.");
        }
    };

    // --- Handler Pemilihan Tanggal dari Kalender ---
    const handleCalendarSelect = (selectedDate: Date | undefined) => {
        if (selectedDate === undefined) {
            setEditedPengesahanPada(null);
        } else if (isValid(selectedDate)) {
            setEditedPengesahanPada(startOfDay(selectedDate));
        }
    };

    // Handler Edit (Tetap sama)
    const handleEditSave = async () => { /* ... logika simpan ... */
        if (!item.id || !accessToken || isSaving || !supabase || !userId || !workspaceId) { toast.error("Data tidak lengkap untuk menyimpan."); return; }
        if (editedName.trim() === '') { toast.error("Nama file tidak boleh kosong."); return; }
        if (!hasChanges) { setIsEditDialogOpen(false); return; }
        setIsSaving(true);
        let gdriveUpdateSuccess = true;
        try {
            const nameChanged = editedName !== item.filename;
            const descriptionChanged = editedDescription !== (item.description || "");
            const initialDateString = formatDateOnlyString(initialPengesahanPada);
            const editedDateString = formatDateOnlyString(editedPengesahanPada);
            const pengesahanChanged = initialDateString !== editedDateString;
            if (nameChanged) { /* ... update GDrive ... */
                 const responseGdrive = await fetch(`${GOOGLE_API_BASE_URL}/${item.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editedName }) });
                 if (!responseGdrive.ok) { gdriveUpdateSuccess = false; const d = await responseGdrive.json().catch(() => ({})); throw new Error(d.error?.message || `Gagal update GDrive (${responseGdrive.status})`); }
            }
            const metadataDbChanged = descriptionChanged || pengesahanChanged;
            if (metadataDbChanged || nameChanged) {
                const supabaseDataToUpdate: Partial<Schema> = {};
                if (descriptionChanged) supabaseDataToUpdate.description = editedDescription;
                if (pengesahanChanged) supabaseDataToUpdate.pengesahan_pada = editedPengesahanPada ? editedPengesahanPada.toISOString() : null;
                if (Object.keys(supabaseDataToUpdate).length > 0) { /* ... update Supabase ... */
                    const { error: supabaseError } = await supabase.from('file').update(supabaseDataToUpdate).match({ id: item.id, workspace_id: workspaceId, user_id: userId });
                    if (supabaseError) { if (gdriveUpdateSuccess && nameChanged) { toast.warning("GDrive diupdate, tapi gagal simpan DB."); } else { throw new Error(`Gagal simpan DB: ${supabaseError.message}`); } }
                    else { toast.success(`Perubahan detail untuk "${editedName}" berhasil disimpan.`); }
                } else if (gdriveUpdateSuccess && nameChanged) { toast.success(`Nama GDrive untuk "${editedName}" berhasil diubah.`); }
            } else if (gdriveUpdateSuccess && nameChanged) { toast.success(`Nama GDrive untuk "${editedName}" berhasil diubah.`); }
            setIsEditDialogOpen(false); onActionComplete();
        } catch (error: any) { console.error("Save Error:", error); toast.error(error.message || "Gagal menyimpan."); }
        finally { setIsSaving(false); }
     };

    // Handler Unduh & Hapus (Tetap sama)
    const handleDownload = async () => { /* ... logika unduh ... */ if(!item.id||!accessToken||isDownloading||item.isFolder)return;const isGoogleDoc=item.mimeType?.includes('google-apps')&&!item.mimeType.includes('folder');let exportMimeType='application/pdf',downloadFilename=item.filename||'download';if(isGoogleDoc){if(item.mimeType?.includes('spreadsheet')){exportMimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';downloadFilename=`${item.filename||'spreadsheet'}.xlsx`;}else if(item.mimeType?.includes('presentation')){exportMimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation';downloadFilename=`${item.filename||'presentation'}.pptx`;}else if(item.mimeType?.includes('document')){exportMimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document';downloadFilename=`${item.filename||'document'}.docx`;}else if(item.mimeType?.includes('drawing')){exportMimeType='image/png';downloadFilename=`${item.filename||'drawing'}.png`;}} const downloadUrl=isGoogleDoc?`${GOOGLE_API_BASE_URL}/${item.id}/export?mimeType=${encodeURIComponent(exportMimeType)}`:`${GOOGLE_API_BASE_URL}/${item.id}?alt=media`;setIsDownloading(true);toast.info(`Mulai unduh "${downloadFilename}"...`,{duration:4000});try{const response=await fetch(downloadUrl,{method:'GET',headers:{'Authorization':`Bearer ${accessToken}`}});if(!response.ok){const s=response.status;const d=await response.json().catch(()=>({}));throw new Error(d.error?.message||`Gagal unduh (${s})`+(s===401||s===403?'. Sesi mungkin berakhir.':''));} const blob=await response.blob();const url=window.URL.createObjectURL(blob);const a=document.createElement('a');a.style.display='none';a.href=url;a.download=downloadFilename;document.body.appendChild(a);a.click();window.URL.revokeObjectURL(url);a.remove();}catch(error:any){console.error("Download Error:",error);toast.error(error.message||"Gagal unduh.");}finally{setIsDownloading(false);}};
    const handleDeleteConfirm = async () => { /* ... logika hapus ... */ if(!item.id||!accessToken||isDeleting||!supabase||!userId||!workspaceId)return;setIsDeleting(true);try{const responseGdrive=await fetch(`${GOOGLE_API_BASE_URL}/${item.id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${accessToken}`}}); if(responseGdrive.status!==204&&!responseGdrive.ok){const s=responseGdrive.status;const d=await responseGdrive.json().catch(()=>({}));throw new Error(d.error?.message||`Gagal hapus GDrive (${s})`+(s===401||s===403?'. Sesi mungkin berakhir.':''));} const{error:supabaseError}=await supabase.from('file').delete().match({id:item.id,workspace_id:workspaceId,user_id:userId}); if(supabaseError){console.error("Supabase delete error:",supabaseError);toast.warning("GDrive dihapus, tapi gagal sinkron metadata DB.");}else{toast.success(`"${item.filename}" berhasil dihapus.`);} onActionComplete();}catch(error:any){console.error("Delete Error:",error);toast.error(error.message||"Gagal hapus.");}finally{setIsDeleting(false);setIsDeleteDialogOpen(false);}};


    // --- Mendapatkan nilai dan opsi untuk dropdown ---
    const selectedDate = editedPengesahanPada ? getDate(editedPengesahanPada).toString() : undefined;
    const selectedMonth = editedPengesahanPada ? getMonth(editedPengesahanPada).toString() : undefined; // 0-11
    const selectedYear = editedPengesahanPada ? getYear(editedPengesahanPada).toString() : undefined;

    // Opsi hari dinamis berdasarkan bulan dan tahun terpilih
    const daysInSelectedMonth = useMemo(() => {
        return editedPengesahanPada ? getDaysInMonth(editedPengesahanPada) : 31; // Default 31 jika belum ada tanggal
    }, [editedPengesahanPada]);
    const dayOptions = Array.from({ length: daysInSelectedMonth }, (_, i) => (i + 1).toString());


    // Render JSX
    if (!accessToken || !userId || !workspaceId || !supabase) {
        return <div className="w-8 h-8 flex items-center justify-center text-muted-foreground" title="Aksi tidak tersedia"><DotsHorizontalIcon /></div>;
    }

    return (
        <>
            {/* Dropdown Menu (Tetap Sama) */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"><DotsHorizontalIcon className="h-4 w-4" /> <span className="sr-only">Menu</span></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)} disabled={isSaving}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload} disabled={isDownloading || !!item.isFolder}>{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Unduh</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onSelect={(e) => { e.preventDefault(); setIsDeleteDialogOpen(true); }} disabled={isDeleting}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog Edit (Dropdown Tgl/Bln/Thn + Calendar) */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-lg"> {/* Mungkin perlu sedikit lebih lebar */}
                    <DialogHeader>
                        <DialogTitle>Edit Detail</DialogTitle>
                        <DialogDescription>Ubah detail untuk: <strong className="break-all">{item.filename}</strong></DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Nama & Deskripsi (Tetap Sama) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={`edit-name-${item.id}`} className="text-right">Nama</Label>
                            <Input id={`edit-name-${item.id}`} value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" disabled={isSaving} required />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor={`edit-description-${item.id}`} className="text-right pt-2">Deskripsi</Label>
                            <Textarea id={`edit-description-${item.id}`} value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="col-span-3" placeholder="(Opsional)" disabled={isSaving} rows={3} />
                        </div>

                        {/* ================================================== */}
                        {/* INPUT TANGGAL (Dropdown Tgl/Bln/Thn + Calendar)   */}
                        {/* ================================================== */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Disahkan</Label>
                            <div className="col-span-3 space-y-3">

                                {/* --- Dropdown Tanggal/Bulan/Tahun --- */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Select Tanggal */}
                                     <Select
                                        value={selectedDate}
                                        onValueChange={(value) => handleDatePartChange(value, 'day')}
                                        disabled={!editedPengesahanPada || isSaving} // Disable jika belum ada tanggal
                                    >
                                        <SelectTrigger className="h-9 w-[70px] shrink-0">
                                            <SelectValue placeholder="Tgl" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dayOptions.map(day => (
                                                <SelectItem key={day} value={day}>{day}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Select Bulan */}
                                    <Select
                                        value={selectedMonth} // 0-11
                                        onValueChange={(value) => handleDatePartChange(value, 'month')}
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger className="h-9 flex-1 min-w-[100px]">
                                            <SelectValue placeholder="Bulan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {monthOptions.map(month => (
                                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                     {/* Select Tahun */}
                                      <Select
                                        value={selectedYear}
                                        onValueChange={(value) => handleDatePartChange(value, 'year')}
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger className="h-9 w-[90px] shrink-0">
                                            <SelectValue placeholder="Tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                     {/* Tombol Clear */}
                                    {editedPengesahanPada && (
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => setEditedPengesahanPada(null)}
                                            disabled={isSaving} type="button" aria-label="Kosongkan Tanggal"
                                            title="Kosongkan Tanggal"
                                        >
                                            <XIcon className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                 {/* Pesan jika tanggal belum dipilih */}
                                 {!editedPengesahanPada && (
                                     <p className="text-xs text-muted-foreground -mt-2">Pilih tanggal di kalender atau atur bulan/tahun untuk memulai.</p>
                                 )}

                            </div>
                        </div>
                        {/* ================================================== */}
                        {/* AKHIR INPUT TANGGAL                             */}
                        {/* ================================================== */}

                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Batal</Button></DialogClose>
                        <Button type="button" onClick={handleEditSave} disabled={isSaving || editedName.trim() === '' || !hasChanges}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog Hapus (Tetap Sama) */}
             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                 <AlertDialogContent> {/* ... content ... */} </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
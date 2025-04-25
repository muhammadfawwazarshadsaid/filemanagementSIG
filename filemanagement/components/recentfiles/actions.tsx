// src/components/recentfiles/actions.tsx atau path yang sesuai
"use client";

// React & Libraries
import React, { useState, useEffect, useMemo } from "react";
import { Row } from "@tanstack/react-table";
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { isValid, format } from 'date-fns';
import { id as localeID } from "date-fns/locale"; // Import locale Indonesia

// Lucide Icons
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Pencil, Download, Trash2, Loader2, AlertTriangle, XIcon, CalendarIcon } from "lucide-react"; // Tambah CalendarIcon

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input"; // Input masih dipakai untuk Nama
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Tambah Popover
import { Calendar } from "@/components/ui/calendar"; // Tambah Calendar
import { cn } from "@/lib/utils"; // Import cn jika belum

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

// Helper (tidak perlu lagi formatToDateTimeLocal/parseFromDateTimeLocal)
// Kita akan menggunakan format dari date-fns

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
    const [isCalendarOpen, setIsCalendarOpen] = useState(false); // State untuk Popover Kalender

    // State Lain
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Efek Inisialisasi Form Edit
    useEffect(() => {
        if (isEditDialogOpen) {
            setEditedName(item.filename);
            setEditedDescription(item.description || "");
            const initialDate = item.pengesahan_pada ? new Date(item.pengesahan_pada) : null;
            const validInitialDate = initialDate && isValid(initialDate) ? initialDate : null;
            setEditedPengesahanPada(validInitialDate);
            setInitialPengesahanPada(validInitialDate);
            setIsCalendarOpen(false); // Pastikan kalender tertutup saat dialog baru dibuka
        }
    }, [isEditDialogOpen, item]);

    // Cek Perubahan
    const hasChanges = useMemo(() => {
        const nameChanged = editedName !== item.filename;
        const descriptionChanged = editedDescription !== (item.description || "");
        const pengesahanChanged = (editedPengesahanPada?.getTime() ?? null) !== (initialPengesahanPada?.getTime() ?? null);
        return nameChanged || descriptionChanged || pengesahanChanged;
    }, [editedName, editedDescription, editedPengesahanPada, item.filename, item.description, initialPengesahanPada]);

    // *** Handler Edit (Tetap Sama - Pakai Upsert Tanpa Filename) ***
    const handleEditSave = async () => {
        // Validasi Awal
        if (!item.id || !accessToken || isSaving || !supabase || !userId || !workspaceId) { toast.error("Data tidak lengkap."); return; }
        if (editedName.trim() === '') { toast.error("Nama file kosong."); return; }
        if (!hasChanges) { setIsEditDialogOpen(false); return; }

        setIsSaving(true);
        let gdriveUpdateSuccess = true;

        try {
            // 1. Update Google Drive
            const nameChanged = editedName !== item.filename;
            const descriptionChanged = editedDescription !== (item.description || "");
            if (nameChanged || descriptionChanged) {
                const bodyGdrive: { name?: string; description?: string } = {};
                if (nameChanged) bodyGdrive.name = editedName;
                if (descriptionChanged) bodyGdrive.description = editedDescription;
                console.log("Updating GDrive:", bodyGdrive);
                const responseGdrive = await fetch(`${GOOGLE_API_BASE_URL}/${item.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(bodyGdrive) });
                if (!responseGdrive.ok) { gdriveUpdateSuccess = false; const d = await responseGdrive.json().catch(() => ({})); throw new Error(d.error?.message || `Gagal update GDrive (${responseGdrive.status})`); }
            }

            // 2. Persiapan Data Upsert Supabase
            const supabaseDataToUpsert: any = { id: item.id, workspace_id: workspaceId, user_id: userId };
            let metadataChanged = false;
            const pengesahanChanged = (editedPengesahanPada?.getTime() ?? null) !== (initialPengesahanPada?.getTime() ?? null);

            if (descriptionChanged || editedDescription) { // Kirim deskripsi jika berubah atau ada isinya
                 supabaseDataToUpsert.description = editedDescription;
                 metadataChanged = true;
            }
            if (pengesahanChanged) { // Hanya kirim tanggal jika benar-benar berubah
                 supabaseDataToUpsert.pengesahan_pada = editedPengesahanPada ? editedPengesahanPada.toISOString() : null;
                 metadataChanged = true;
            }

            // 3. Eksekusi Upsert Supabase (jika metadata berubah)
            if (metadataChanged) {
                console.log("Upserting Supabase:", supabaseDataToUpsert);
                const { error: supabaseError } = await supabase.from('file').upsert(supabaseDataToUpsert, { onConflict: 'id, workspace_id, user_id' });
                if (supabaseError) { console.error("Supabase Upsert Error:", supabaseError); if (gdriveUpdateSuccess && (nameChanged || descriptionChanged)) { toast.warning("GDrive sukses, tapi gagal simpan metadata DB."); } else { throw new Error(`Gagal simpan metadata DB: ${supabaseError.message}`); } }
                else { toast.success(`Perubahan metadata untuk "${editedName}" disimpan.`); }
            } else {
                 if (gdriveUpdateSuccess && nameChanged) { toast.success(`Nama file "${editedName}" diperbarui di GDrive.`); }
                 else if (gdriveUpdateSuccess && descriptionChanged && !nameChanged) { toast.success(`Deskripsi untuk "${editedName}" berhasil diperbarui.`);}
                 else { console.log("Tidak ada metadata DB yang perlu disimpan."); }
            }

            // 4. Tutup dialog & refresh
            setIsEditDialogOpen(false);
            onActionComplete();
        } catch (error: any) { console.error("Save Error:", error); toast.error(error.message || "Gagal menyimpan."); }
        finally { setIsSaving(false); }
    };

    // Handler Unduh (Sama)
    const handleDownload = async () => { /* ... kode ... */ if(!item.id||!accessToken||isDownloading||item.isFolder)return;const isGoogleDoc=item.mimeType?.includes('google-apps')&&!item.mimeType.includes('folder');let exportMimeType='application/pdf',downloadFilename=item.filename||'download';if(isGoogleDoc){if(item.mimeType?.includes('spreadsheet')){exportMimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';downloadFilename=`${item.filename||'spreadsheet'}.xlsx`;}else if(item.mimeType?.includes('presentation')){exportMimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation';downloadFilename=`${item.filename||'presentation'}.pptx`;}else if(item.mimeType?.includes('document')){exportMimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document';downloadFilename=`${item.filename||'document'}.docx`;}else if(item.mimeType?.includes('drawing')){exportMimeType='image/png';downloadFilename=`${item.filename||'drawing'}.png`;}} const downloadUrl=isGoogleDoc?`${GOOGLE_API_BASE_URL}/${item.id}/export?mimeType=${encodeURIComponent(exportMimeType)}`:`${GOOGLE_API_BASE_URL}/${item.id}?alt=media`;setIsDownloading(true);toast.info(`Mulai unduh "${downloadFilename}"...`,{duration:4000});try{const response=await fetch(downloadUrl,{method:'GET',headers:{'Authorization':`Bearer ${accessToken}`}});if(!response.ok){const s=response.status;const d=await response.json().catch(()=>({}));throw new Error(d.error?.message||`Gagal unduh (${s})`+(s===401||s===403?'. Sesi mungkin berakhir.':''));} const blob=await response.blob();const url=window.URL.createObjectURL(blob);const a=document.createElement('a');a.style.display='none';a.href=url;a.download=downloadFilename;document.body.appendChild(a);a.click();window.URL.revokeObjectURL(url);a.remove();}catch(error:any){console.error("Download Error:",error);toast.error(error.message||"Gagal unduh.");}finally{setIsDownloading(false);}};

    // Handler Hapus (Sama)
    const handleDeleteConfirm = async () => { /* ... kode ... */ if(!item.id||!accessToken||isDeleting||!supabase||!userId||!workspaceId)return;setIsDeleting(true);try{const responseGdrive=await fetch(`${GOOGLE_API_BASE_URL}/${item.id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${accessToken}`}}); if(responseGdrive.status!==204&&!responseGdrive.ok){const s=responseGdrive.status;const d=await responseGdrive.json().catch(()=>({}));throw new Error(d.error?.message||`Gagal hapus GDrive (${s})`+(s===401||s===403?'. Sesi mungkin berakhir.':''));} const{error:supabaseError}=await supabase.from('file').delete().match({id:item.id,workspace_id:workspaceId,user_id:userId}); if(supabaseError){console.error("Supabase delete error:",supabaseError);toast.warning("GDrive dihapus, tapi gagal sinkron metadata DB.");}else{toast.success(`"${item.filename}" dihapus.`);} onActionComplete();}catch(error:any){console.error("Delete Error:",error);toast.error(error.message||"Gagal hapus.");}finally{setIsDeleting(false);setIsDeleteDialogOpen(false);}};

    // Render JSX
    if (!accessToken || !userId || !workspaceId || !supabase) { return <div className="w-8 h-8 flex items-center justify-center text-muted-foreground" title="Aksi tidak tersedia"><DotsHorizontalIcon /></div>;}

    return (
        <>
            {/* Dropdown Menu (Sama) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"><DotsHorizontalIcon className="h-4 w-4" /> <span className="sr-only">Menu</span></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)} disabled={isSaving}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload} disabled={isDownloading || !!item.isFolder}>{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Unduh</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onSelect={(e) => { e.preventDefault(); setIsDeleteDialogOpen(true); }} disabled={isDeleting}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog Edit (Input Tanggal Diubah) */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
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

                        {/* ============================================= */}
                        {/* Input Tanggal ShadCN UI            */}
                        {/* ============================================= */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Disahkan</Label> {/* Tidak perlu htmlFor karena trigger bukan input asli */}
                            <div className="col-span-3 flex items-center gap-x-2"> {/* Flexbox untuk align button & clear */}
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                    <Button
                                        // Tambahkan ini untuk tes:
                                        onClick={() => console.log("Popover Trigger Button Clicked!")}
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] justify-start text-left font-normal rounded-lg",
                                            !editedPengesahanPada && "text-muted-foreground"
                                        )}
                                        disabled={isSaving} // Sementara bisa di-comment untuk tes
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {editedPengesahanPada ? (
                                            format(editedPengesahanPada, "PPP", { locale: localeID })
                                        ) : (
                                            <span>Pilih tanggal</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={editedPengesahanPada ?? undefined} // Kirim undefined jika null
                                            onSelect={(date) => {
                                                // Hanya set jika tanggal valid atau undefined (untuk clear)
                                                if (date === undefined || isValid(date)) {
                                                    setEditedPengesahanPada(date || null);
                                                }
                                                setIsCalendarOpen(false); // Tutup popover setelah pilih
                                            }}
                                            disabled={(date) => date > new Date() || date < new Date("1970-01-01")} // Batasi tanggal (opsional)
                                            initialFocus // Fokus ke kalender saat dibuka
                                            locale={localeID} // Gunakan Bahasa Indonesia
                                        />
                                    </PopoverContent>
                                </Popover>
                                {/* Tombol Clear Tanggal (XIcon) */}
                                {editedPengesahanPada && (
                                    <Button
                                        variant="ghost" size="icon" type="button"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive p-0" // Ukuran disesuaikan
                                        onClick={() => setEditedPengesahanPada(null)}
                                        disabled={isSaving}
                                        aria-label="Kosongkan Tanggal Pengesahan"
                                    >
                                        <XIcon className="h-4 w-4" /><span className="sr-only">Kosongkan</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                         {/* ============================================= */}
                         {/* Akhir Input Tanggal ShadCN UI         */}
                         {/* ============================================= */}

                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Batal</Button></DialogClose>
                        <Button type="button" onClick={handleEditSave} disabled={isSaving || editedName.trim() === '' || !hasChanges}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog Hapus (Sama) */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                {/* ... konten alert dialog ... */}
                 <AlertDialogContent>
                     <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" /> Konfirmasi Hapus</AlertDialogTitle><AlertDialogDescription>Yakin ingin hapus {item.isFolder ? 'folder' : 'file'} <strong className="break-all">"{item.filename}"</strong>?</AlertDialogDescription></AlertDialogHeader>
                     <AlertDialogFooter>
                         <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                         <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ya, Hapus</AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
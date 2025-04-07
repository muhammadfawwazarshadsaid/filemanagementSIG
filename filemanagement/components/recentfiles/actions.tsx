// src/components/recentfiles/actions.tsx
"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import React, { useState } from "react";
import { toast } from "sonner";
import { Pencil, Download, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { SupabaseClient } from '@supabase/supabase-js';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Schema } from "@/components/recentfiles/schema"; // Sesuaikan path

// --- Props Diperbarui ---
// Interface ini MENDIFINISIKAN apa yang diharapkan oleh komponen ini
export interface DataTableRowActionsProps {
    row: Row<Schema>;
    accessToken: string | null; // Bisa null jika user belum auth
    onActionComplete: () => void; // Callback wajib
    supabase: SupabaseClient; // Klien Supabase wajib
    userId: string;           // ID User wajib
    workspaceId: string;    // ID Workspace/Folder Induk wajib
    // onError?: (error: Error) => void;
}

const GOOGLE_API_BASE_URL = "https://www.googleapis.com/drive/v3/files";

// Komponen Aksi
export function DataTableRowActions({
    row,
    accessToken,
    onActionComplete,
    supabase,
    userId,
    workspaceId,
    // onError,
}: DataTableRowActionsProps) { // Terima props sesuai interface
    const item = row.original;
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editedName, setEditedName] = useState(item.filename);
    const [editedDescription, setEditedDescription] = useState(item.description || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handler Edit (dengan update Supabase)
    const handleEditSave = async () => {
        // Validasi lebih ketat di awal
        if (!item.id || !accessToken || isSaving || editedName.trim() === '' || !supabase || !userId || !workspaceId) {
             toast.error("Tidak bisa menyimpan: Data tidak lengkap atau token tidak valid.");
             console.warn("Edit save aborted: Missing required props or state.", {item_id:item.id, hasToken:!!accessToken, isSaving, editedName, hasSupabase:!!supabase, userId, workspaceId});
            return;
        }
        if (editedName === item.filename && editedDescription === (item.description || "")) { setIsEditDialogOpen(false); return; }
        setIsSaving(true);
        try {
            const bodyGdrive: { name?: string; description?: string } = {};
            if (editedName !== item.filename) bodyGdrive.name = editedName;
            if (editedDescription !== (item.description || "")) bodyGdrive.description = editedDescription;
            const responseGdrive = await fetch(`${GOOGLE_API_BASE_URL}/${item.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(bodyGdrive) });
            if (!responseGdrive.ok) { const s = responseGdrive.status; const d = await responseGdrive.json().catch(() => ({})); throw new Error(d.error?.message || `Gagal update GDrive (${s})` + (s === 401 || s === 403 ? '. Sesi mungkin berakhir.' : '')); }
            const { error: supabaseError } = await supabase.from('file').upsert({ id: item.id, workspace_id: workspaceId, user_id: userId, description: editedDescription }, { onConflict: 'id, workspace_id, user_id' });
            if (supabaseError) { console.error("Supabase Upsert Error:", supabaseError); toast.warning("GDrive sukses, tapi gagal sinkronisasi metadata."); }
            else { toast.success(`"${editedName}" diperbarui.`); }
            setIsEditDialogOpen(false); onActionComplete();
        } catch (error: any) { console.error("Save Error:", error); toast.error(error.message || "Gagal menyimpan."); } finally { setIsSaving(false); }
    };

    // Handler Unduh (tidak berubah)
    const handleDownload = async () => { /* ... implementasi ... */
        if (!item.id || !accessToken || isDownloading || item.isFolder) return;
        const isGoogleDoc = item.mimeType.includes('google-apps') && !item.mimeType.includes('folder');
        let exportMimeType = 'application/pdf', downloadFilename = item.filename;
        if (isGoogleDoc) { /* ... logika export type ... */
             if (item.mimeType.includes('spreadsheet')) { exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; downloadFilename = `${item.filename}.xlsx`; }
             else if (item.mimeType.includes('presentation')) { exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; downloadFilename = `${item.filename}.pptx`; }
             else if (item.mimeType.includes('document')) { exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; downloadFilename = `${item.filename}.docx`; }
             else if (item.mimeType.includes('drawing')) { exportMimeType = 'image/png'; downloadFilename = `${item.filename}.png`; }
        }
        const downloadUrl = isGoogleDoc ? `${GOOGLE_API_BASE_URL}/${item.id}/export?mimeType=${encodeURIComponent(exportMimeType)}` : `${GOOGLE_API_BASE_URL}/${item.id}?alt=media`;
        setIsDownloading(true); toast.info(`Mulai mengunduh "${downloadFilename}"...`, { duration: 4000 });
        try {
            const response = await fetch(downloadUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) { const s = response.status; const d = await response.json().catch(() => ({})); throw new Error(d.error?.message || `Gagal unduh (${s})` + (s === 401 || s === 403 ? '. Sesi mungkin berakhir.' : '')); }
            const blob = await response.blob(); const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = downloadFilename;
            document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
        } catch (error: any) { console.error("Download Error:", error); toast.error(error.message || "Gagal mengunduh."); } finally { setIsDownloading(false); }
     };

    // Handler Hapus (dengan delete Supabase)
    const handleDeleteConfirm = async () => { /* ... implementasi ... */
         if (!item.id || !accessToken || isDeleting || !supabase || !userId || !workspaceId) return;
         setIsDeleting(true);
         try {
             const responseGdrive = await fetch(`${GOOGLE_API_BASE_URL}/${item.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });

                // ---> TAMBAHKAN LOG DI SINI <---
                console.log("ACTIONS: Access Token being used:", accessToken);
                console.log("ACTIONS: Deleting File IDs:", item.id);
                // ---> AKHIR LOG <---
             if (responseGdrive.status !== 204 && !responseGdrive.ok) { const s = responseGdrive.status; const d = await responseGdrive.json().catch(() => ({})); throw new Error(d.error?.message || `Gagal hapus GDrive (${s})` + (s === 401 || s === 403 ? '. Sesi mungkin berakhir.' : '')); }
             const { error: supabaseError } = await supabase.from('file').delete().match({ id: item.id, workspace_id: workspaceId, user_id: userId });
             if (supabaseError) { console.error("Supabase delete error:", supabaseError); toast.warning("GDrive dihapus, tapi gagal sinkronisasi metadata."); }
             toast.success(`"${item.filename}" dihapus.`); onActionComplete();
         } catch (error: any) { console.error("Delete Error:", error); toast.error(error.message || "Gagal menghapus."); }
         finally { setIsDeleting(false); setIsDeleteDialogOpen(false); }
     };

    // Render (tidak berubah)
    if (!accessToken) { /* ... menu disabled ... */ }
    return (
        <>
            {/* Dropdown Menu */}
            <DropdownMenu> <DropdownMenuTrigger asChild><Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"><DotsHorizontalIcon className="h-4 w-4" /> <span className="sr-only">Menu</span></Button></DropdownMenuTrigger> <DropdownMenuContent align="end" className="w-[160px]"> <DropdownMenuItem onSelect={() => { setEditedName(item.filename); setEditedDescription(item.description || ""); setIsEditDialogOpen(true); }} disabled={isSaving}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem> <DropdownMenuItem onClick={handleDownload} disabled={isDownloading || item.isFolder}>{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Unduh</DropdownMenuItem> <DropdownMenuSeparator /> <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onSelect={(e) => { e.preventDefault(); setIsDeleteDialogOpen(true); }} disabled={isDeleting}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem> </DropdownMenuContent> </DropdownMenu>
            {/* Dialog Edit */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}> <DialogContent className="sm:max-w-[425px]"> <DialogHeader><DialogTitle>Edit Detail</DialogTitle><DialogDescription>Ubah detail untuk: <strong className="break-all">{item.filename}</strong></DialogDescription></DialogHeader> <div className="grid gap-4 py-4"> <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor={`edit-name-${item.id}`} className="text-right">Nama</Label><Input id={`edit-name-${item.id}`} value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" disabled={isSaving} required /></div> <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor={`edit-description-${item.id}`} className="text-right pt-2">Deskripsi</Label><Textarea id={`edit-description-${item.id}`} value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="col-span-3" placeholder="(Opsional)" disabled={isSaving} rows={3} /></div> </div> <DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Batal</Button></DialogClose><Button type="button" onClick={handleEditSave} disabled={isSaving || editedName.trim() === '' || (editedName === item.filename && editedDescription === (item.description || ""))}><>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan</></Button></DialogFooter> </DialogContent> </Dialog>
            {/* AlertDialog Hapus */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}> <AlertDialogContent> <AlertDialogHeader><AlertDialogTitle className="flex items-center"><AlertTriangle className="text-red-500 mr-2" /> Konfirmasi Hapus</AlertDialogTitle><AlertDialogDescription>Yakin ingin menghapus {item.isFolder ? 'folder' : 'file'} <strong className="break-all">"{item.filename}"</strong>? Tindakan ini permanen.</AlertDialogDescription></AlertDialogHeader> <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500"><>{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ya, Hapus</></AlertDialogAction></AlertDialogFooter> </AlertDialogContent> </AlertDialog>
        </>
    );
}
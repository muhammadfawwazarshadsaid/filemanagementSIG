"use client";
// page.tsx (Kode Lengkap Final - Dengan Penanganan Join & Logging Referensi)

// --- Impor ---
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link2Icon, Search, Loader2, X, ZoomIn, ZoomOut, RotateCcw, Share2, UserPlus, Link as LinkIcon, Check, Copy, UserX } from "lucide-react"; // Impor ikon lengkap
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/recentfiles/datatable";
import { columns } from "@/components/recentfiles/columns";
import { supabase } from "@/lib/supabaseClient";
import { useStackApp, useUser as useStackframeUserHook, useUser } from "@stackframe/stack";
import { Schema } from "@/components/recentfiles/schema";
import FolderSelector from "@/components/folder-homepage"; // Pastikan path ini benar
import { SupabaseClient } from "@supabase/supabase-js";
import {
    CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Impor toast dari sonner
import { Badge } from "@/components/ui/badge"; // Impor Badge

// --- IMPOR react-pdf ---
import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { on } from "events";

// --- Konfigurasi Worker PDF.js ---
try {
     pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
} catch (error) {
     console.error("Gagal mengkonfigurasi worker pdf.js.", error);
     pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}
// --------------------------------

// --- Interface ---
interface AppSupabaseUser { id: string; displayname: string | null; primaryemail: string | null; is_admin: boolean | null; }
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string; createdTime?: string; modifiedTime?: string; iconLink?: string; }
interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; nextPageToken?: string; }
interface SupabaseWorkspaceMetadata { name: string | null; url: string; color: string | null; /* kolom lain jika perlu */}
interface SupabaseFolderMetadata { id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
interface SupabaseFileMetadata { id: string; description?: string | null; color?: string | null; labels?: string[] | null; pengesahan_pada?: string | null; is_self_file?: boolean | null; }
interface MyTableMeta { accessToken: string | null; onActionComplete: () => void; supabase: SupabaseClient | null; userId: string | undefined | null; workspaceOrFolderId: string | null | undefined; onSelectFileForPreview?: (file: Schema) => void; onOpenPreviewSheet?: () => void; }

// --- Konstanta ---
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const PDF_MAX_SCALE = 3.0; const PDF_MIN_SCALE = 0.4; const PDF_SCALE_STEP = 0.2;
const INTERSECTION_THRESHOLD = 0.01; const INTERSECTION_ROOT_MARGIN = "0px 0px 0px 0px";

// ========================================================================
// Helper Functions (getFileIcon, getFriendlyFileType)
// ========================================================================
function getFileIcon(mimeType: string | undefined, isFolder: boolean | undefined, iconLink?: string | null): string {
    const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false;
    if (effectiveIsFolder) return iconLink || '/folder.svg'; if (iconLink) return iconLink;
    if (!effectiveMimeType) return '/file.svg'; if (effectiveMimeType.startsWith('image/')) return '/picture.svg'; if (effectiveMimeType.startsWith('video/')) return '/video.svg'; if (effectiveMimeType.startsWith('audio/')) return '/music.svg'; if (effectiveMimeType.startsWith('application/zip')) return '/zip.svg'; if (effectiveMimeType === 'application/pdf') return '/pdf.svg'; if (effectiveMimeType.includes('word')) return '/word.svg'; if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return '/ppt.svg'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return '/xlsx.svg'; if (effectiveMimeType === 'text/plain') return '/txt.svg'; if (effectiveMimeType.includes('html')) return '/web.svg'; if (effectiveMimeType.startsWith('text/')) return '/txt.svg'; if (effectiveMimeType === 'application/vnd.google-apps.document') return '/gdoc.svg'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg'; if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg'; return '/file.svg';
}
function getFriendlyFileType(mimeType: string | undefined, isFolder: boolean | undefined): string {
    const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false;
    if (effectiveIsFolder) return 'Folder'; if (!effectiveMimeType) return 'Tidak Dikenal';
    if (effectiveMimeType.startsWith('image/')) return 'Gambar'; if (effectiveMimeType.startsWith('video/')) return 'Video'; if (effectiveMimeType.startsWith('audio/')) return 'Audio'; if (effectiveMimeType.startsWith('application/zip')) return 'Arsip ZIP'; if (effectiveMimeType === 'application/pdf') return 'Dokumen PDF'; if (effectiveMimeType.includes('word')) return 'Dokumen Word'; if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return 'Presentasi PPT'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return 'Spreadsheet Excel'; if (effectiveMimeType === 'text/plain') return 'Teks Biasa'; if (effectiveMimeType.includes('html')) return 'Dokumen Web'; if (effectiveMimeType.startsWith('text/')) return 'Dokumen Teks'; if (effectiveMimeType === 'application/vnd.google-apps.folder') return 'Folder Google'; if (effectiveMimeType === 'application/vnd.google-apps.document') return 'Google Docs'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return 'Google Slides'; if (effectiveMimeType.includes('/')) { const sub = effectiveMimeType.split('/')[1].replace(/^vnd\.|\.|\+xml|x-|google-apps\./g, ' ').trim(); return sub.charAt(0).toUpperCase() + sub.slice(1); } return 'File Lain';
}

// ========================================================================
// Komponen Share Workspace Modal (Definisi Langsung - Termasuk Fitur Hapus & Copy Metadata)
// ========================================================================
interface ShareWorkspaceModalProps {
    isOpen: boolean; onClose: () => void; workspaceId: string; workspaceName: string; workspaceUrl: string; supabase: SupabaseClient; currentUser: AppSupabaseUser;
}

function ShareWorkspaceModal({
    isOpen, onClose, workspaceId, workspaceName, workspaceUrl, supabase, currentUser,
}: ShareWorkspaceModalProps) {
    // ... (Kode Komponen ShareWorkspaceModal Tetap Sama) ...
    const [allUsers, setAllUsers] = useState<AppSupabaseUser[]>([]);
    const [members, setMembers] = useState<string[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isAddingUsers, setIsAddingUsers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);
    const [justAddedUsers, setJustAddedUsers] = useState<AppSupabaseUser[]>([]);
    const [removingUserId, setRemovingUserId] = useState<string | null>(null);

    const inviteLink = useMemo(() => {
        if (typeof window !== 'undefined' && workspaceId) { return `${window.location.origin}/join-workspace?workspace=${workspaceId}`; }
        return null;
    }, [workspaceId]);

    const fetchData = useCallback(async () => {
        if (!isOpen || !supabase || !workspaceId || !currentUser?.id) return;
        setIsLoadingUsers(true); setIsLoadingMembers(true); setError(null); setMembers([]); setAllUsers([]);
        try {
            const { data: usersData, error: usersError } = await supabase .from('user').select('id, displayname, primaryemail, is_admin') .neq('id', currentUser.id);
            if (usersError) throw usersError; setAllUsers((usersData || []) as AppSupabaseUser[]);
            const { data: membersData, error: membersError } = await supabase .from('workspace').select('user_id').eq('id', workspaceId);
            if (membersError) throw membersError; setMembers((membersData || []).map(m => m.user_id));
        } catch (err: any) { const errorMessage = `Gagal memuat data: ${err.message}`; setError(errorMessage); toast.error("Error Pemuatan Data", { description: errorMessage }); }
        finally { setIsLoadingUsers(false); setIsLoadingMembers(false); }
    }, [isOpen, supabase, workspaceId, currentUser?.id]);

    useEffect(() => {
        fetchData();
        if (!isOpen) { setSelectedUserIds(new Set()); setSearchTerm(''); setCopied(false); setError(null); setJustAddedUsers([]); setRemovingUserId(null); }
    }, [isOpen, workspaceId, fetchData]);

    const handleCheckboxChange = (userId: string) => { setSelectedUserIds(prev => { const newSet = new Set(prev); if (newSet.has(userId)) newSet.delete(userId); else newSet.add(userId); return newSet; }); };

    const handleAddSelectedUsers = async () => {
        if (selectedUserIds.size === 0) return; setIsAddingUsers(true); setError(null);
        const usersToAddIds = Array.from(selectedUserIds); let newlyAddedUserObjects: AppSupabaseUser[] = [];
        try {
            newlyAddedUserObjects = allUsers.filter(u => usersToAddIds.includes(u.id));
            // 1. Ambil detail workspace ASLI dari admin
            const { data: originalWsData, error: wsDetailsError } = await supabase .from('workspace') .select('name, url, color') .eq('id', workspaceId) .eq('user_id', currentUser.id) .single();
            if (wsDetailsError || !originalWsData) throw new Error(`Gagal ambil detail workspace asli: ${wsDetailsError?.message || 'Data tidak ditemukan'}`);
            // 2. Dapatkan ID unik folder & file
            const { data: folderIdsData, error: folderIdError } = await supabase.from('folder').select('id').eq('workspace_id', workspaceId); if(folderIdError) throw new Error(`Gagal ambil ID folder: ${folderIdError.message}`); const distinctFolderIds = [...new Set((folderIdsData || []).map(f => f.id))];
            const { data: fileIdsData, error: fileIdError } = await supabase.from('file').select('id').eq('workspace_id', workspaceId); if(fileIdError) throw new Error(`Gagal ambil ID file: ${fileIdError.message}`); const distinctFileIds = [...new Set((fileIdsData || []).map(f => f.id))];

            if (distinctFolderIds.length === 0 && distinctFileIds.length === 0) {
                 const workspaceInsertsOnly = usersToAddIds.map(userId => ({ id: workspaceId, user_id: userId, url: originalWsData.url, name: originalWsData.name, color: originalWsData.color, is_self_workspace: false, }));
                 const { error: wsOnlyError } = await supabase.from('workspace').insert(workspaceInsertsOnly); if (wsOnlyError) throw new Error(`Gagal insert workspace: ${wsOnlyError.message}`);
            } else {
                // 3. Fetch metadata ASLI dari folder & file (milik admin)
                const folderMetadataMap = new Map<string, SupabaseFolderMetadata>();
                if (distinctFolderIds.length > 0) {
                    const { data: folderMetadata, error: folderMetaError } = await supabase .from('folder') .select('id, description, color, labels') .eq('workspace_id', workspaceId) .eq('user_id', currentUser.id) .in('id', distinctFolderIds);
                    if (folderMetaError) throw new Error(`Gagal ambil metadata folder: ${folderMetaError.message}`); (folderMetadata || []).forEach(meta => folderMetadataMap.set(meta.id, meta));
                }
                const fileMetadataMap = new Map<string, SupabaseFileMetadata>();
                if (distinctFileIds.length > 0) {
                    const { data: fileMetadata, error: fileMetaError } = await supabase .from('file') .select('id, description, color, labels, pengesahan_pada') .eq('workspace_id', workspaceId) .eq('user_id', currentUser.id) .in('id', distinctFileIds);
                    if (fileMetaError) throw new Error(`Gagal ambil metadata file: ${fileMetaError.message}`); (fileMetadata || []).forEach(meta => fileMetadataMap.set(meta.id, meta));
                }
                // 4. Siapkan data insert DENGAN SEMUA metadata yang disalin
                const workspaceInserts = usersToAddIds.map(userId => ({ id: workspaceId, user_id: userId, url: originalWsData.url, name: originalWsData.name, color: originalWsData.color, is_self_workspace: false, }));
                const folderInserts = usersToAddIds.flatMap(userId => distinctFolderIds.map(folderId => { const meta = folderMetadataMap.get(folderId); return { id: folderId, workspace_id: workspaceId, user_id: userId, is_self_folder: false, description: meta?.description ?? null, color: meta?.color ?? null, labels: meta?.labels ?? null }; }));
                const fileInserts = usersToAddIds.flatMap(userId => distinctFileIds.map(fileId => { const meta = fileMetadataMap.get(fileId); return { id: fileId, workspace_id: workspaceId, user_id: userId, is_self_file: false, description: meta?.description ?? null, color: meta?.color ?? null, labels: meta?.labels ?? null, pengesahan_pada: meta?.pengesahan_pada ?? null }; }));
                // 5. Lakukan Insert
                const { error: wsError } = await supabase.from('workspace').insert(workspaceInserts); if (wsError) throw new Error(`Gagal insert workspace: ${wsError.message}`);
                if (folderInserts.length > 0) { const { error: fldrError } = await supabase.from('folder').insert(folderInserts); if(fldrError) console.warn("Warn insert folder:", fldrError.message); }
                if (fileInserts.length > 0) { const { error: flError } = await supabase.from('file').insert(fileInserts); if(flError) console.warn("Warn insert file:", flError.message); }
            }
            // 6. Update UI
            toast.success("Sukses", { description: `${usersToAddIds.length} pengguna ditambahkan.` }); setSelectedUserIds(new Set()); setJustAddedUsers(prev => [...prev, ...newlyAddedUserObjects]); await fetchData();
        } catch (err: any) { const errorMessage = `Gagal menambahkan pengguna: ${err.message}`; setError(errorMessage); toast.error("Error Penambahan", { description: errorMessage }); }
        finally { setIsAddingUsers(false); }
    };

    const handleRemoveUser = async (userIdToRemove: string) => {
        if (!supabase || !workspaceId || !userIdToRemove || removingUserId) return;
        setRemovingUserId(userIdToRemove); setError(null);
        try {
            const { error: fileDeleteError } = await supabase.from('file').delete().eq('workspace_id', workspaceId).eq('user_id', userIdToRemove); if (fileDeleteError) throw fileDeleteError;
            const { error: folderDeleteError } = await supabase.from('folder').delete().eq('workspace_id', workspaceId).eq('user_id', userIdToRemove); if (folderDeleteError) throw folderDeleteError;
            const { error: workspaceDeleteError } = await supabase.from('workspace').delete().eq('id', workspaceId).eq('user_id', userIdToRemove); if (workspaceDeleteError) throw workspaceDeleteError;
            toast.success("Pengguna Dihapus", { description: `Pengguna berhasil dikeluarkan.` });
            setJustAddedUsers(prev => prev.filter(u => u.id !== userIdToRemove)); await fetchData();
        } catch (err: any) { const errorMessage = `Gagal mengeluarkan pengguna: ${err.message}`; setError(errorMessage); toast.error("Error Hapus", { description: errorMessage }); }
        finally { setRemovingUserId(null); }
    };

    const handleCopyLink = () => { if (!inviteLink) return; navigator.clipboard.writeText(inviteLink) .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("Link Undangan Disalin!"); }) .catch(err => { toast.error("Gagal Menyalin Link"); }); };
    const filteredUsersToDisplay = useMemo(() => allUsers.filter(user => user.id !== currentUser.id), [allUsers, currentUser.id]);
    const searchTermLower = searchTerm.toLowerCase();

return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Pastikan DialogContent memiliki flex flex-col dan max-h */}
            <DialogContent className="sm:max-w-[525px] flex flex-col max-h-[90vh]">

                {/* HEADER (Tetap di luar area scroll) */}
                <DialogHeader className="px-4 pt-4 pb-4 border-b"> {/* Tambahkan padding & border jika perlu */}
                    <DialogTitle>Bagikan & Kelola Anggota: {workspaceName}</DialogTitle>
                <DialogDescription> Tambahkan pengguna baru, keluarkan anggota, atau salin link undangan. </DialogDescription>
                    {/* Invite Link Section */}
                    <div className="pt-4  space-y-2"> {/* Hapus px-6, mt-4 dari sini, border bisa di sini atau di wrapper user list */}
                        <h4 className="text-sm font-medium"> Link Undangan</h4>
                        {inviteLink ? (
                            <div className="flex space-x-2 items-center justify-center">
                                <Input value={inviteLink} readOnly className="h-8 text-xs bg-muted" />
                                <Button variant="outline" size="icon" className="h-8 w-8 self-start sm:self-center" onClick={handleCopyLink} title="Salin link">
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">Link undangan akan muncul di sini.</p>
                        )}
                    </div>
                        <div> {/* Hapus px-6 dari sini */}
                            <Label htmlFor="search-user" className="mb-1 block text-sm font-medium">Cari Pengguna</Label>
                            <Input
                                id="search-user"
                                placeholder="Cari berdasarkan nama atau email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={isLoadingUsers || isLoadingMembers}
                            />
                        </div>
                </DialogHeader>

                {/* === AREA KONTEN YANG BISA SCROLL === */}
                <div className="flex-1 overflow-y-auto px-6  space-y-4"> {/* flex-1, overflow-y-auto, padding, space-y */}

                    {/* Error Message */}
                    {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

                    {/* Just Added Users */}
                    {justAddedUsers.length > 0 && (
                        <div> {/* Hapus px-6 pt-4 dari sini */}
                            <Label className="text-xs font-medium text-muted-foreground">Baru ditambahkan:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {justAddedUsers.map(user => (
                                    <Badge key={user.id} variant="secondary">
                                        {user.displayname || user.primaryemail || 'Pengguna'}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search and User List Section */}
                    {/* Hapus div pembungkus luar dengan border-t/b, -mx-6, mt-3 */}
                    <div className="space-y-3"> {/* Beri jarak antar search dan list */}

                        {/* Ubah h-[200px] menjadi max-h-[...] atau hapus */}
                        <ScrollArea className="w-full"> {/* Ganti h jadi max-h, tambahkan border untuk visual */}
                             {/* Hapus px-6 dari sini */}
                            <div className="space-y-1"> {/* Tambahkan padding internal untuk ScrollArea */}
                                {(isLoadingUsers || isLoadingMembers) && (
                                    <div className="flex justify-center items-center p-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-muted-foreground">Memuat...</span>
                                    </div>
                                )}
                                {/* ... (render user list seperti sebelumnya) ... */}
                                 {!isLoadingUsers && !isLoadingMembers && filteredUsersToDisplay.length === 0 && <p className="text-sm text-center text-muted-foreground p-4">Tidak ada pengguna lain.</p>}
                                 {!isLoadingUsers && !isLoadingMembers && filteredUsersToDisplay
                                     .filter(user => user.displayname?.toLowerCase().includes(searchTermLower) || user.primaryemail?.toLowerCase().includes(searchTermLower))
                                     .map(user => {
                                         const isMember = members.includes(user.id);
                                         const isSelected = selectedUserIds.has(user.id);
                                         const isBeingRemoved = removingUserId === user.id;
                                         return (
                                             <div key={user.id} className={`flex items-start space-x-3 `}> {/* Tambah hover effect */}
                                                 {!isMember && (
                                                     <Checkbox id={`user-add-${user.id}`} checked={isSelected} onCheckedChange={() => handleCheckboxChange(user.id)} disabled={isAddingUsers || removingUserId !== null} aria-label={`Pilih ${user.displayname || user.primaryemail}`} />
                                                 )}
                                                 <Label htmlFor={!isMember ? `user-add-${user.id}` : undefined} className={`flex-col items-start text-sm ${!isMember ? 'cursor-pointer' : ''}`}>
                                                     <span className="font-medium">{user.displayname || '(No name)'}</span>
                                                     <span className="block text-xs text-muted-foreground mb-4">{user.primaryemail || '(No email)'}</span>
                                                 </Label>
                                                 <div className="w-16 text-right flex-shrink-0"> {/* Tambah flex-shrink-0 */}
                                                     {isMember ? (
                                                          isBeingRemoved ? (
                                                             <Loader2 className="h-4 w-4 animate-spin text-muted-foreground inline-block" />
                                                         ) : (
                                                             <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleRemoveUser(user.id)} disabled={removingUserId !== null} title={`Keluarkan ${user.displayname || user.primaryemail}`}>
                                                                 <UserX className="h-4 w-4" />
                                                             </Button>
                                                         )
                                                     ) : (
                                                         <Badge variant="outline" className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>Pilih</Badge>
                                                     )}
                                                 </div>
                                             </div>
                                         );
                                    })
                                }
                            </div>
                        </ScrollArea>
                    </div>


                </div>
                {/* === AKHIR AREA KONTEN YANG BISA SCROLL === */}

                {/* FOOTER (Tetap di luar area scroll) */}
                <DialogFooter className="px-6 py-4 border-t"> {/* Tambahkan padding & border jika perlu */}
                    <Button type="button" variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                    {/* Add Selected Users Button */}
                    <div> {/* Hapus px-6 pt-2 dari sini */}
                        <Button
                            onClick={handleAddSelectedUsers}
                            disabled={selectedUserIds.size === 0 || isAddingUsers || isLoadingUsers || isLoadingMembers || removingUserId !== null}
                            className="w-full"
                        >
                            {isAddingUsers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                             Tambahkan {selectedUserIds.size > 0 ? `${selectedUserIds.size} ` : ''}Pengguna Terpilih
                        </Button>
                    </div>

                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}


// ========================================================================
// Fungsi Helper untuk Proses Join Workspace (Reusable)
// ========================================================================
async function performWorkspaceJoin(
    userId: string,
    workspaceToJoinId: string,
    supabaseClient: SupabaseClient,
    onSuccess?: (workspaceName: string) => void,
    onError?: (errorMsg: string) => void
) {
    console.log(`[page.tsx] Attempting to join workspace ${workspaceToJoinId} for user ${userId}`); // Tambahkan prefix
    try {
        // 1. Cek keanggotaan
        const { data: existingMembership, error: checkError } = await supabaseClient .from('workspace') .select('id') .eq('id', workspaceToJoinId) .eq('user_id', userId) .maybeSingle();
        if (checkError) throw new Error(`Gagal cek keanggotaan: ${checkError.message}`);
        if (existingMembership) {
            console.log(`[page.tsx] User ${userId} already member of ${workspaceToJoinId}`);
            // Panggil onSuccess agar sessionStorage dihapus
            const { data: wsData } = await supabaseClient.from('workspace').select('name').eq('id', workspaceToJoinId).maybeSingle();
            onSuccess?.(wsData?.name || 'workspace ini'); // Beritahu sudah member
            return; // Keluar
        }

        // 2. Dapatkan ID user referensi
         const referenceUserId = await getReferenceUserId(supabaseClient, workspaceToJoinId); // Panggil helper
         if (!referenceUserId) {
            // **ERROR UTAMA DARI LOG ANDA ADA DI SINI**
            // Jika ini terjadi, artinya getReferenceUserId gagal menemukan siapapun
            // di workspace itu (baik owner asli maupun fallback)
            throw new Error("Tidak dapat menemukan pengguna referensi untuk menyalin metadata.");
         }

        // 3. Ambil detail workspace asli dari user referensi
        const { data: workspaceDetails, error: detailsError } = await supabaseClient .from('workspace') .select('name, url, color') .eq('id', workspaceToJoinId) .eq('user_id', referenceUserId) .single();
        if (detailsError || !workspaceDetails) throw new Error(`Gagal mengambil detail workspace: ${detailsError?.message || 'Detail tidak ada'}`);
        const joinedWorkspaceName = workspaceDetails.name || 'Workspace';

        // 4. Ambil ID unik folder & file
         const { data: folderIdsData, error: folderIdError } = await supabaseClient.from('folder').select('id').eq('workspace_id', workspaceToJoinId); if(folderIdError) throw folderIdError; const distinctFolderIds = [...new Set((folderIdsData || []).map(f => f.id))];
         const { data: fileIdsData, error: fileIdError } = await supabaseClient.from('file').select('id').eq('workspace_id', workspaceToJoinId); if(fileIdError) throw fileIdError; const distinctFileIds = [...new Set((fileIdsData || []).map(f => f.id))];

         // 5. Fetch metadata ASLI dari folder & file (milik user referensi)
         const folderMetadataMap = new Map<string, SupabaseFolderMetadata>();
         if (distinctFolderIds.length > 0) {
              const { data: folderMetadataList, error: folderMetaError } = await supabaseClient .from('folder') .select('id, description, color, labels') .in('id', distinctFolderIds) .eq('workspace_id', workspaceToJoinId) .eq('user_id', referenceUserId);
              if (folderMetaError) throw folderMetaError; (folderMetadataList || []).forEach(meta => folderMetadataMap.set(meta.id, meta));
         }
         const fileMetadataMap = new Map<string, SupabaseFileMetadata>();
         if (distinctFileIds.length > 0) {
              const { data: fileMetadataList, error: fileMetaError } = await supabaseClient .from('file') .select('id, description, color, labels, pengesahan_pada') .in('id', distinctFileIds) .eq('workspace_id', workspaceToJoinId) .eq('user_id', referenceUserId);
               if (fileMetaError) throw fileMetaError; (fileMetadataList || []).forEach(meta => fileMetadataMap.set(meta.id, meta));
         }

         // 6. Siapkan data insert DENGAN metadata untuk user BARU (userId)
        const workspaceInsert = { id: workspaceToJoinId, user_id: userId, url: workspaceDetails.url, name: workspaceDetails.name, is_self_workspace: false, color: workspaceDetails.color };
        const folderInserts = distinctFolderIds.map(folderId => { const meta = folderMetadataMap.get(folderId); return { id: folderId, workspace_id: workspaceToJoinId, user_id: userId, is_self_folder: false, description: meta?.description ?? null, color: meta?.color ?? null, labels: meta?.labels ?? null }; });
        const fileInserts = distinctFileIds.map(fileId => { const meta = fileMetadataMap.get(fileId); return { id: fileId, workspace_id: workspaceToJoinId, user_id: userId, is_self_file: false, description: meta?.description ?? null, color: meta?.color ?? null, labels: meta?.labels ?? null, pengesahan_pada: meta?.pengesahan_pada ?? null }; });

        // 7. Lakukan Insert (RLS PENTING)
        const { error: wsError } = await supabaseClient.from('workspace').insert(workspaceInsert); if (wsError) throw new Error(`Gagal insert workspace: ${wsError.message}`);
        if (folderInserts.length > 0) { const { error: fldrError } = await supabaseClient.from('folder').insert(folderInserts); if(fldrError) console.warn("[page.tsx] Warn insert folder:", fldrError.message); }
        if (fileInserts.length > 0) { const { error: flError } = await supabaseClient.from('file').insert(fileInserts); if(flError) console.warn("[page.tsx] Warn insert file:", flError.message); }

        // 8. Panggil callback sukses
        onSuccess?.(joinedWorkspaceName);

    } catch (err: any) {
        console.error("[page.tsx] Error performing workspace join:", err); // Tambah prefix
        onError?.(err.message || "Terjadi kesalahan saat bergabung ke workspace.");
    }
}

// Fungsi helper getReferenceUserId (Dengan Logging Tambahan)
async function getReferenceUserId(supabaseClient: SupabaseClient, workspaceId: string): Promise<string | null> {
    console.log(`[getReferenceUserId] Searching for owner (is_self_workspace=true) for workspace: ${workspaceId}`);
    const { data: ownerData, error: ownerError } = await supabaseClient
        .from('workspace')
        .select('user_id')
        .eq('id', workspaceId)
        .eq('is_self_workspace', true) // Cari pemilik asli
        .limit(1)
        .maybeSingle();

    if (ownerError) {
        console.error("[getReferenceUserId] Error finding reference user (owner query):", ownerError);
        // Jangan return null dulu, coba fallback
    }
    if (ownerData) {
        console.log(`[getReferenceUserId] Found owner: ${ownerData.user_id}`);
        return ownerData.user_id;
    }

    // Jika owner tidak ditemukan, coba fallback
    console.warn(`[getReferenceUserId] Could not find original owner (is_self_workspace=true), falling back to first user found for workspace: ${workspaceId}`);
    const { data: firstUserData, error: firstUserError } = await supabaseClient
        .from('workspace')
        .select('user_id')
        .eq('id', workspaceId) // Cari user mana saja di workspace itu
        .limit(1)
        .maybeSingle();

    if (firstUserError) {
        console.error("[getReferenceUserId] Error finding any user (fallback query):", firstUserError);
        return null; // Gagal total jika fallback juga error
    }
    if (firstUserData) {
         console.log(`[getReferenceUserId] Found fallback user: ${firstUserData.user_id}`);
         return firstUserData.user_id;
    }

    // Jika fallback juga tidak menemukan user
    console.error(`[getReferenceUserId] No user found for workspace ${workspaceId} in both owner and fallback queries.`);
    return null; // Gagal total
}
// ========================================================================
// Komponen Utama Page
// ========================================================================
export default function Page() {
    // --- State (Sama seperti sebelumnya) ---
    const router = useRouter(); const app = useUser(); const stackframeUser = useUser();
    const account = stackframeUser
    const accessToken = localStorage.getItem("accessToken")

    const [currentUser, setCurrentUser] = useState<AppSupabaseUser | null>(null); const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false); const isAdmin = useMemo(() => !!currentUser?.is_admin, [currentUser]);
    const [isLoadingPageInit, setIsLoadingPageInit] = useState(true); const [isFetchingItems, setIsFetchingItems] = useState(false); const [error, setError] = useState(''); const [allFormattedFiles, setAllFormattedFiles] = useState<Schema[]>([]); const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null); const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>('Memuat...'); const [activeWorkspaceUrl, setActiveWorkspaceUrl] = useState<string>('Memuat...'); const [isSearchOpen, setIsSearchOpen] = useState(false); const [searchQuery, setSearchQuery] = useState(''); const [selectedFileForPreview, setSelectedFileForPreview] = useState<Schema | null>(null); const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState<boolean>(false); const [pdfFile, setPdfFile] = useState<Blob | string | null>(null); const [pdfLoading, setPdfLoading] = useState<boolean>(false); const [pdfError, setPdfError] = useState<string | null>(null); const [numPages, setNumPages] = useState<number | null>(null); const [pageNumber, setPageNumber] = useState(1); const [pdfScale, setPdfScale] = useState(1.0);

    // --- Refs (Sama seperti sebelumnya) ---
    const pdfContainerRef = useRef<HTMLDivElement>(null); const pdfPreviewAreaRef = useRef<HTMLDivElement>(null); const pageRefs = useRef<(HTMLDivElement | null)[]>([]); const pageObserver = useRef<IntersectionObserver | null>(null); const [pdfContainerWidth, setPdfContainerWidth] = useState<number | null>(null);

    // --- Helper API Call (Sama seperti sebelumnya) ---

const makeApiCall = useCallback(async <T = any>(
    url: string,
    method: string = 'GET',
    body: any = null,
    headers: Record<string, string> = {}
): Promise<T | null> => {
    if (!accessToken) {
        setError("Akses token Google tidak tersedia.");
        // Pertimbangkan redirect di sini jika tidak ada token sama sekali,
        // ini bisa menandakan masalah autentikasi yang lebih dalam.
        // Contoh: router.push('/masuk?error=no_token_available');
        return null;
    }

    const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
    if (!(body instanceof FormData) && body && method !== 'GET') {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    const options: RequestInit = { method, headers: defaultHeaders };
    if (body) {
        options.body = (body instanceof FormData) ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let d = {};
            try {
                d = await response.json();
            } catch (e) {}
            const m = (d as any)?.error?.message || (d as any)?.error_description || response.statusText || `HTTP error ${response.status}`;

            if (response.status === 401) {
                // Token tidak valid atau kedaluwarsa
                setError("Sesi Google Anda telah berakhir. Anda akan diarahkan ke halaman masuk.");
                toast.error("Sesi Berakhir", { description: "Silakan masuk kembali." }); // Notifikasi ke pengguna

                try {
                    await app?.signOut(); // Mencoba sign out dari StackFrame
                } catch (signOutError) {
                    console.error("Error saat sign out dari StackFrame:", signOutError);
                    // Tetap lanjutkan redirect meskipun sign out gagal
                }

                // Arahkan ke halaman login
                // Tambahkan parameter query untuk memberi tahu halaman login alasan redirect (opsional)
                router.push('/masuk');
                return null; // Hentikan pemrosesan lebih lanjut
            } else {
                setError(`Google API Error (${response.status}): ${m}`);
            }
            return null;
        }
        if (response.status === 204) return null; // No content
        return response.json() as Promise<T>;
    } catch (err: any) {
        setError(`Gagal menghubungi Google API: ${err.message}`);
        return null;
    }
}, [accessToken, router, app, setError]);

    // --- Callback Update Workspace (Sama seperti sebelumnya) ---
    const handleWorkspaceUpdate = useCallback((workspaceId: string | null, workspaceName: string | null, workspaceUrl: string | null) => {
        if (activeWorkspaceId !== workspaceId) {
            setActiveWorkspaceId(workspaceId); setActiveWorkspaceName(workspaceName || '...'); setActiveWorkspaceUrl(workspaceUrl || '...');
            setAllFormattedFiles([]); setIsFetchingItems(!!workspaceId); setError(''); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); setIsShareModalOpen(false);
        } else if (workspaceId) {
            setActiveWorkspaceName(workspaceName || '?'); setActiveWorkspaceUrl(workspaceUrl || '?');
        }
    }, [activeWorkspaceId]);

    // --- Fungsi Fetch Data User Supabase & Cek Onboarding (Sama seperti sebelumnya) ---
     useEffect(() => {
        const fetchUserDataAndCheckStatus = async () => {
            // ... (kode fetchUserDataAndCheckStatus tetap sama) ...
            if (!stackframeUser?.id || !supabase) { setCurrentUser(null); setIsLoadingPageInit(false); return; }
            let onboardingCompleted = false; let fetchedUserData: AppSupabaseUser | null = null;
            try {
                 const { data: onboardingData, error: onboardingError } = await supabase.from('onboarding_status').select('is_completed').eq('user_id', stackframeUser.id).maybeSingle();
                 if (onboardingError) throw new Error(`Gagal cek onboarding: ${onboardingError.message}`);
                 if (!onboardingData?.is_completed) {
                     const { data: tempUserData, error: tempUserError } = await supabase.from('user').select('id, displayname, primaryemail, is_admin').eq('id', stackframeUser.id).single();
                     if(tempUserData) setCurrentUser(tempUserData as AppSupabaseUser);
                     router.push('/selesaikanpendaftaran'); return;
                 }
                onboardingCompleted = true;
                 const { data: userData, error: userError } = await supabase.from('user').select('id, displayname, primaryemail, is_admin').eq('id', stackframeUser.id).single();
                 if (userError) throw new Error(`Gagal ambil data user: ${userError.message}`);
                 fetchedUserData = userData as AppSupabaseUser; setCurrentUser(fetchedUserData);
            } catch (err: any) { console.error("Error init:", err); setError(err.message); setCurrentUser(null); toast.error("Error Inisialisasi", { description: err.message }); }
            finally { setIsLoadingPageInit(false); }
        };
        fetchUserDataAndCheckStatus();
    }, [stackframeUser?.id, supabase, router]);

    // --- useEffect untuk Cek Pending Join dari sessionStorage (SAMA, INI YANG UTAMA) ---

// useEffect untuk Cek Pending Join dari sessionStorage (MODIFIKASI)
useEffect(() => {
    const checkAndPerformJoin = async () => {
        // Pastikan currentUser dan supabase sudah ada/terload sebelum lanjut
        if (currentUser && currentUser.id && supabase) {
            console.log("[page.tsx] Checking onboarding status and pending join..."); // Logging

            // 1. Cek dulu status onboarding user INI
            let isOnboardingComplete = false;
            try {
                const { data: onboardingData, error: onboardingError } = await supabase
                    .from('onboarding_status')
                    .select('is_completed')
                    .eq('user_id', currentUser.id)
                    .maybeSingle();

                if (onboardingError) {
                    console.warn("[page.tsx] Gagal cek status onboarding saat cek pending join:", onboardingError.message);
                    return; // Jangan lanjutkan jika gagal cek status
                }
                isOnboardingComplete = onboardingData?.is_completed ?? false;

            } catch (err) {
                console.error("[page.tsx] Error saat cek status onboarding:", err);
                return; // Jangan lanjutkan jika error
            }

            console.log(`[page.tsx] Onboarding status: ${isOnboardingComplete}`); // Logging

            // 2. HANYA proses pending join jika onboarding SUDAH SELESAI
            if (isOnboardingComplete) {
                const pendingWorkspaceId = sessionStorage.getItem('pendingJoinWorkspaceId');
                console.log(`[page.tsx] Found pendingJoinWorkspaceId: ${pendingWorkspaceId}`); // Logging

                if (pendingWorkspaceId) {
                    console.log(`[page.tsx] Onboarding complete. Attempting join for workspace ID: ${pendingWorkspaceId}.`);

                    // --- Definisikan handler Sukses ---
                    const handleJoinSuccess = (joinedName: string) => {
                        console.log(`[page.tsx] Successfully joined "${joinedName}". Removing item and refreshing.`);
                        toast.success(`Berhasil bergabung ke workspace "${joinedName}"! Memuat ulang data...`);

                        // !!! PENTING: Hapus item dari sessionStorage SEKARANG !!!
                        sessionStorage.removeItem('pendingJoinWorkspaceId');

                        // Refresh data & UI. router.refresh() lebih baik dari reload.
                        // Ini akan memicu ulang pemanggilan data di server component (jika ada)
                        // dan memperbarui state di client component yang bergantung pada data baru.
                        window.location.reload();

                        // Jika refresh saja tidak cukup (misal sidebar tidak update),
                        // coba push ke '/' lagi baru refresh, tapi biasanya refresh cukup.
                        // router.push('/');
                        // setTimeout(() => router.refresh(), 50);
                    };

                    // --- Definisikan handler Gagal ---
                    const handleJoinError = (errorMsg: string) => {
                        console.error(`[page.tsx] Failed to automatically join workspace ${pendingWorkspaceId}: ${errorMsg}`);
                        toast.error("Gagal bergabung otomatis", { description: errorMsg });

                        // Pertimbangkan menghapus item jika errornya permanen
                        // untuk mencegah loop tak terbatas pada link yang rusak/invalid.
                        const isPermanentError = errorMsg.includes("Tidak dapat menemukan pengguna referensi") ||
                                                 errorMsg.includes("Workspace tidak ditemukan") ||
                                                 errorMsg.includes("Gagal mengambil detail workspace"); // Tambahkan kondisi error permanen lain jika ada

                        if (isPermanentError) {
                            console.warn(`[page.tsx] Permanent join error detected for ${pendingWorkspaceId}. Removing item to prevent loop.`);
                            sessionStorage.removeItem('pendingJoinWorkspaceId'); // Hapus jika error permanen
                        }
                        // Jika error sementara (misal jaringan), biarkan item agar bisa dicoba lagi nanti.
                    };

                    // --- Panggil fungsi join ---
                    // Tidak perlu `await` di sini jika kita tidak melakukan apa pun setelahnya
                    // di dalam `checkAndPerformJoin`
                    performWorkspaceJoin(
                        currentUser.id,
                        pendingWorkspaceId,
                        supabase,
                        handleJoinSuccess, // Berikan handler sukses
                        handleJoinError   // Berikan handler gagal
                    );
                } else {
                    // console.log("[page.tsx] Onboarding complete, but no pending workspace join found.");
                }
            } else {
                // Jika onboarding BELUM selesai, tidak melakukan apa-apa di sini.
                // Pengguna akan diarahkan ke /selesaikanpendaftaran oleh useEffect lain.
                console.log("[page.tsx] Onboarding not complete. Skipping pending join check.");
            }
        } else {
             // console.log("[page.tsx] Waiting for currentUser and supabase to be ready...");
        }
    };

    // Panggil fungsi pengecekan saat komponen dimuat atau dependensi berubah
    checkAndPerformJoin();
}, [currentUser, supabase]); // Dependensi tetap sama


    // --- Fungsi Fetch SEMUA FILE (Sama seperti sebelumnya) ---
     const fetchWorkspaceSubfolderFiles = useCallback(async () => {
         // ... (kode fetchWorkspaceSubfolderFiles tetap sama) ...
        if (!activeWorkspaceId || !activeWorkspaceName || !currentUser?.id || !accessToken || !supabase) { setAllFormattedFiles([]); setIsFetchingItems(false); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); return; }
        setIsFetchingItems(true); setError(''); let collectedFilesData: Omit<Schema, 'description' | 'other' | 'foldername' | 'pengesahan_pada'>[] = []; const allFileIds: string[] = [];
        try {
            const folderFields = "files(id, name)"; const folderQuery = `'${activeWorkspaceId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`; const folderUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(folderQuery)}&fields=${encodeURIComponent(folderFields)}&orderBy=name`;
            const folderData = await makeApiCall<GoogleDriveFilesListResponse>(folderUrl); if (folderData === null) throw new Error(error || `Gagal ambil folder.`); const subfoldersLevel1 = folderData.files || []; if (subfoldersLevel1.length === 0) { setAllFormattedFiles([]); setIsFetchingItems(false); return; }
            const fileFetchPromises = subfoldersLevel1.map(async (subfolder) => { if (!subfolder?.id || !subfolder?.name) return []; const fileFields = "files(id, name, mimeType, webViewLink, createdTime, modifiedTime)"; const fileQuery = `'${subfolder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`; const fileUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(fileQuery)}&fields=${encodeURIComponent(fileFields)}&orderBy=name`; const fileData = await makeApiCall<GoogleDriveFilesListResponse>(fileUrl); if (fileData === null) { setError(prev => `${prev || ''} Gagal load file dari folder "${subfolder.name}".`.trim()); return []; } const filesInSubfolder = fileData.files || []; const currentPathname = `${activeWorkspaceName} / ${subfolder.name}`; return filesInSubfolder.map(file => { allFileIds.push(file.id); return { id: file.id, filename: file.name, pathname: currentPathname, mimeType: file.mimeType, webViewLink: file.webViewLink || undefined, createdat: file.createdTime || undefined, lastmodified: file.modifiedTime || file.createdTime || undefined, isFolder: false, iconLink: undefined, }; }); });
            const filesFromSubfoldersArrays = await Promise.all(fileFetchPromises); collectedFilesData = filesFromSubfoldersArrays.flat(); if (collectedFilesData.length === 0) { setAllFormattedFiles([]); setIsFetchingItems(false); return; }
            let metadataMap: Record<string, SupabaseFileMetadata> = {};
            if (allFileIds.length > 0 && currentUser?.id) {
                const chunkSize = 150; for (let i = 0; i < allFileIds.length; i += chunkSize) { const chunkIds = allFileIds.slice(i, i + chunkSize);
                    const { data: metadataList, error: metaError } = await supabase .from('file') .select('id, description, labels, color, pengesahan_pada, is_self_file') .in('id', chunkIds) .eq('workspace_id', activeWorkspaceId) .eq('user_id', currentUser.id);
                    if (metaError) { console.warn("Meta fetch warning:", metaError.message); setError(prev => prev ? `${prev} | Gagal load metadata.` : `Warning: Gagal memuat sebagian metadata.`); }
                    if (metadataList) { metadataList.forEach((meta: any) => { metadataMap[meta.id] = meta; }); }
                }
            }
             const finalFormattedFiles: Schema[] = collectedFilesData.map(fileData => ({
                ...fileData,
                isFolder: false,
                foldername: null,
                description: metadataMap[fileData.id]?.description ?? undefined,
                pengesahan_pada: metadataMap[fileData.id]?.pengesahan_pada ?? null,
                is_self_file: metadataMap[fileData.id]?.is_self_file
            }));

            finalFormattedFiles.sort((a, b) => { const pathCompare = (a.pathname ?? '').localeCompare(b.pathname ?? ''); if (pathCompare !== 0) return pathCompare; return a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()); });
            setAllFormattedFiles(finalFormattedFiles);
            if (selectedFileForPreview && !finalFormattedFiles.some(f => f.id === selectedFileForPreview.id)) { setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); }
        } catch (err: any) { setError(err.message || 'Gagal memuat file.'); }
         finally { setIsFetchingItems(false); }
    }, [activeWorkspaceId, activeWorkspaceName, currentUser?.id, accessToken, supabase, makeApiCall, setError, selectedFileForPreview, error]); // Dependencies

    // --- Fungsi Fetch Konten PDF (Sama seperti sebelumnya) ---
    const fetchPdfContent = useCallback(async (fileId: string) => {
         // ... (kode fetchPdfContent tetap sama) ...
        if (!accessToken || !fileId) return; setPdfLoading(true); setPdfError(null); setPdfFile(null); setNumPages(null); setPageNumber(1); setPdfScale(1.0); setPdfContainerWidth(null); pageRefs.current = []; pageObserver.current?.disconnect();
        const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${fileId}?alt=media`;
        try {
            const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) { let eMsg = `Gagal ambil PDF (${response.status})`; try { const eData = await response.json(); eMsg += `: ${eData?.error?.message||'?'}`; } catch (e) {} throw new Error(eMsg); }
            const blob = await response.blob(); const objectUrl = URL.createObjectURL(blob); setPdfFile(objectUrl);
        } catch (err: any) { console.error("Error fetching PDF:", err); setPdfError(err.message || "Gagal memuat preview PDF."); }
        finally { setPdfLoading(false); }
    }, [accessToken]);

    // --- Trigger fetch PDF (Sama seperti sebelumnya) ---
    useEffect(() => {
        // ... (kode useEffect fetchPdfContent tetap sama) ...
        let objectUrlToRevoke: string | null = null;
        if (selectedFileForPreview?.mimeType === 'application/pdf' && selectedFileForPreview.id && isPreviewSheetOpen) {
            if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) { URL.revokeObjectURL(pdfFile); setPdfFile(null); }
            fetchPdfContent(selectedFileForPreview.id);
        } else {
            if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) { objectUrlToRevoke = pdfFile; }
            setPdfFile(null); setPdfLoading(false); setPdfError(null); setNumPages(null); setPageNumber(1); setPdfScale(1.0); pageRefs.current = []; pageObserver.current?.disconnect();
        }
        return () => { if (objectUrlToRevoke) { URL.revokeObjectURL(objectUrlToRevoke); } pageObserver.current?.disconnect(); };
    }, [selectedFileForPreview, isPreviewSheetOpen, fetchPdfContent]);

    // --- Callback react-pdf: onDocumentLoadSuccess (Sama seperti sebelumnya) ---
     function onDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }): void {
          // ... (kode onDocumentLoadSuccess tetap sama) ...
         setNumPages(loadedNumPages); setPageNumber(1); setPdfScale(1.0);
         if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0; pageRefs.current = Array(loadedNumPages).fill(null);
         setTimeout(() => { if (pdfPreviewAreaRef.current) { const width = pdfPreviewAreaRef.current.offsetWidth; setPdfContainerWidth(width > 30 ? width - 20 : null); } }, 100);
     }

    // --- Fungsi Handler Zoom & Navigasi Halaman PDF (Sama seperti sebelumnya) ---
    const handleZoomIn = () => { /* ... */ setPdfScale(prev => Math.min(prev + PDF_SCALE_STEP, PDF_MAX_SCALE)); };
    const handleZoomOut = () => { /* ... */ setPdfScale(prev => Math.max(prev - PDF_SCALE_STEP, PDF_MIN_SCALE)); };
    const handleResetZoom = () => { /* ... */ setPdfScale(1.0); if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0; };
    const goToPage = (targetPage: number) => { /* ... */ if (targetPage >= 1 && targetPage <= (numPages ?? 0)) { const pageElement = pageRefs.current[targetPage - 1]; if (pageElement) { pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' }); setPageNumber(targetPage); } else { setPageNumber(targetPage); if (pdfContainerRef.current && numPages) { const approxPageHeight = pdfContainerRef.current.scrollHeight / numPages; pdfContainerRef.current.scrollTo({ top: approxPageHeight * (targetPage - 1), behavior: 'smooth' }); } } } };
    const goToPrevPage = () => goToPage(pageNumber - 1);
    const goToNextPage = () => goToPage(pageNumber + 1);

    // --- useEffects Lainnya (Sama seperti sebelumnya) ---
    useEffect(() => { if (activeWorkspaceId && activeWorkspaceName && currentUser?.id && accessToken && !isLoadingPageInit) { fetchWorkspaceSubfolderFiles(); } else if (!activeWorkspaceId && !isLoadingPageInit) { setAllFormattedFiles([]); setIsFetchingItems(false); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); } }, [activeWorkspaceId, activeWorkspaceName, currentUser?.id, accessToken, fetchWorkspaceSubfolderFiles, isLoadingPageInit]);
    useEffect(() => { const down = (e: KeyboardEvent) => { if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsSearchOpen((open) => !open); } }; document.addEventListener("keydown", down); return () => document.removeEventListener("keydown", down); }, []);
    useEffect(() => { if (!pdfFile || !numPages || numPages <= 0 || !pdfContainerRef.current) { pageObserver.current?.disconnect(); return; } const scrollContainer = pdfContainerRef.current; pageObserver.current?.disconnect(); const options = { root: scrollContainer, rootMargin: INTERSECTION_ROOT_MARGIN, threshold: INTERSECTION_THRESHOLD }; const observerCallback = (entries: IntersectionObserverEntry[]) => { let topVisiblePage = -1; let maxIntersectionRatio = -1; entries.forEach((entry) => { if (entry.isIntersecting) { const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '0', 10); if (entry.intersectionRatio > maxIntersectionRatio) { maxIntersectionRatio = entry.intersectionRatio; topVisiblePage = pageNum; } else if (entry.intersectionRatio === maxIntersectionRatio) { if (topVisiblePage === -1 || pageNum < topVisiblePage) { topVisiblePage = pageNum; } } } }); if (topVisiblePage > 0) { setPageNumber(currentPageNumber => currentPageNumber !== topVisiblePage ? topVisiblePage : currentPageNumber); } }; pageObserver.current = new IntersectionObserver(observerCallback, options); const observer = pageObserver.current; const observeTimeout = setTimeout(() => { pageRefs.current.forEach((pageEl) => { if (pageEl) { observer.observe(pageEl); } }); }, 150); return () => { clearTimeout(observeTimeout); observer.disconnect(); }; }, [pdfFile, numPages]);

    // --- Logika Filter Pencarian (Sama seperti sebelumnya) ---
    const filteredFiles = useMemo(() => { if (!searchQuery) return allFormattedFiles; const lcq = searchQuery.toLowerCase(); return allFormattedFiles.filter(f => f.filename.toLowerCase().includes(lcq) || f.pathname?.toLowerCase().includes(lcq) || getFriendlyFileType(f.mimeType, f.isFolder).toLowerCase().includes(lcq) || f.description?.toLowerCase().includes(lcq)); }, [allFormattedFiles, searchQuery]);

    // --- Render (Sama seperti sebelumnya) ---
    if (isLoadingPageInit) { return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Memuat...</div>; }
        if (!account) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <p className='text-red-600 font-semibold'>Gagal memuat data pengguna atau akun Google.</p>
                {error && <p className='text-sm text-muted-foreground'>Detail: {error}</p>}
                <p className='text-sm'>Perlu masuk kembali ke akun.</p> {/* Ubah teks jika diinginkan */}
                <Button onClick={async () => { // Opsi 1: Tetap Reload
                    window.location.reload();

                    try {
                        await app?.signOut();
                    } catch (e) {
                        console.error("Gagal sign out pada halaman error:", e);
                    }
                    router.push('/masuk');
                }}>
                    Masuk Lagi
                </Button>
            </div>
        );
    }
    // --- Render Utama (Sama seperti sebelumnya) ---
    return (
        <TooltipProvider delayDuration={200}>
            <SidebarProvider>
                <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdate} />
                <SidebarInset>
                    {/* --- Header (Sama) --- */}
                     <header className="flex w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                         <div className="flex w-full items-center gap-2 px-4">
                             <SidebarTrigger className="-ml-1" />
                             <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                             <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4"> <h4 className="scroll-m-20 lg:text-lg text-3xl font-bold tracking-tight mr-2 truncate" title={activeWorkspaceName || ''}>{(activeWorkspaceName || 'Pilih Folder')}</h4> </div>
                             <div className="flex-1 items-right justify-right md:items-center"> <Button className="h-12 md:w-full w-11 h-10 md:justify-between justify-center md:pr-1" variant={"outline"} title="Cari file di folder ini (Ctrl+K)" onClick={() => setIsSearchOpen(true)}> <p className="text-gray-600 hidden md:inline text-md text-light">Temukan file...</p> <div className=" sm:w-8 w-2 h-8 rounded-md items-center justify-center flex gap-2 px-2"><Search className="text-primary h-4 w-4" /></div> </Button> </div>
                             <NavUser />
                         </div>
                     </header>

                    {/* --- KONTEN UTAMA (Sama) --- */}
                     <div className="flex-1 h-[calc(100vh-theme(space.12))] overflow-y-auto">
                        <div className="flex flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">
                            {/* Alert Error (Sama) */}
                            {error && activeWorkspaceId && !isFetchingItems && ( <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><span className="block sm:inline">{error}</span><Button variant="outline" size="sm" className="ml-4" onClick={fetchWorkspaceSubfolderFiles} disabled={isFetchingItems || !activeWorkspaceId}>{isFetchingItems ? <Loader2 className="h-3 w-3 animate-spin" /> : "Coba Lagi"}</Button></div> )}
                            {/* Info Workspace (Sama) */}
                            <div className="bg-muted/50 gap-4 p-4 inline-flex overflow-hidden flex-col rounded-xl bg-white">
                                <div><h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">Lokasi Workspace</h2><p className="text-xs text-gray-500">Workspace Aktif: {activeWorkspaceName || '...'}</p></div>
                                {activeWorkspaceUrl && activeWorkspaceUrl !== 'Memuat...' && activeWorkspaceUrl !== 'Menampilkan URL...' && activeWorkspaceId ? (
                                    <>
                                        <div className="flex items-center gap-2 bg-[oklch(0.971_0.014_246.32)] border-2 border-[oklch(0.55_0.2408_261.8)] p-2 rounded-md overflow-hidden"> <Link2Icon className="text-gray-500 flex-shrink-0" size={20} color="#095FF9"></Link2Icon> <h1 className="break-words whitespace-normal flex-1 font-semibold underline text-[oklch(0.55_0.2408_261.8)] text-sm"><a href={activeWorkspaceUrl} target="_blank" rel="noopener noreferrer" title={`Buka ${activeWorkspaceName} di Google Drive`}>{activeWorkspaceUrl}</a></h1> </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Button variant={"outline"} size="sm" className="w-fit"> <a href={activeWorkspaceUrl} target="_blank" rel="noopener noreferrer">Kunjungi di Drive</a> </Button>
                                            {isAdmin && ( <Button variant={"secondary"} size="sm" className="w-fit flex items-center gap-1" onClick={() => setIsShareModalOpen(true)} title="Bagikan akses workspace ini (Admin)"> <Share2 className="h-4 w-4" /> Share Workspace </Button> )}
                                        </div>
                                    </>
                                ) : ( <p className="text-sm text-gray-500">{activeWorkspaceId ? 'Memuat URL...' : 'Pilih workspace.'}</p> )}
                            </div>
                            {/* Folder Selector (Sama) */}
                            <FolderSelector initialTargetWorkspaceId={activeWorkspaceId} />
                            {/* Tabel File (Sama) */}
                             <div className="bg-muted/50 gap-4 p-4 inline-flex overflow-hidden flex-col rounded-xl bg-white">
                                 <div className="flex justify-between items-center mb-2"><div><h2 className="scroll-m-20 text-lg font-semibold tracking-tight lg:text-md truncate" title={`Semua file di Subfolder ${activeWorkspaceName}`}>Semua File di Folder</h2><p className="text-xs text-gray-500">Semua file yang berada pada folder suatu workspace ditampilkan di sini.</p></div></div>
                                 {isFetchingItems ? ( <div className="flex flex-col justify-center items-center p-6 text-gray-600"><Loader2 className="mb-2 h-6 w-6 animate-spin" /> Memuat...</div> ) : !activeWorkspaceId ? ( <div className="text-center p-6 text-gray-500">Pilih workspace.</div> ) : allFormattedFiles.length === 0 && !isFetchingItems && !error ? ( <div className="text-center p-6 text-gray-500">Tidak ada file di subfolder workspace ini.</div> ) : error && allFormattedFiles.length === 0 && !isFetchingItems ? ( <div className="text-center p-6 text-red-500">Gagal memuat file.</div> ) : (
                                     allFormattedFiles.length > 0 &&
                                     <DataTable<Schema, unknown, MyTableMeta>
                                         data={allFormattedFiles}
                                         columns={columns}
                                         meta={{
                                             accessToken: accessToken,
                                             onActionComplete: fetchWorkspaceSubfolderFiles,
                                             supabase: supabase as SupabaseClient,
                                             userId: currentUser?.id ?? undefined,
                                             workspaceOrFolderId: activeWorkspaceId,
                                             onSelectFileForPreview: setSelectedFileForPreview,
                                             onOpenPreviewSheet: () => setIsPreviewSheetOpen(true),
                                         }}
                                     />
                                 )}
                             </div>
                        </div>
                    </div>

                    {/* --- Dialog Pencarian (Sama) --- */}
                     <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                         {/* ... (kode command dialog) ... */}
                         <CommandInput placeholder="Cari..." value={searchQuery} onValueChange={setSearchQuery} />
                         <CommandList>
                             <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                             {filteredFiles.length > 0 && ( <CommandGroup heading={`Hasil (${filteredFiles.length})`}> {filteredFiles.map((file) => { const icon = getFileIcon(file.mimeType, file.isFolder, file.iconLink); const type = getFriendlyFileType(file.mimeType, file.isFolder); return ( <CommandItem key={file.id} value={`${file.filename} ${file.pathname} ${type} ${file.description}`} onSelect={() => { setSelectedFileForPreview(file); setIsPreviewSheetOpen(true); setIsSearchOpen(false); setSearchQuery(''); }} className="cursor-pointer flex items-start gap-2" title={`${file.filename} (${type})`} > <img src={icon} alt={type} className="mr-2 h-4 w-4 flex-shrink-0 mt-1" aria-hidden="true"/> <div className="flex flex-col overflow-hidden"><span className="truncate font-medium">{file.filename}</span><span className="text-xs text-gray-500 truncate">{file.pathname} - <span className="italic">{type}</span></span></div> </CommandItem> ); })} </CommandGroup> )}
                         </CommandList>
                     </CommandDialog>

                    {/* --- SHEET PREVIEW (Sama) --- */}
                    <Sheet open={isPreviewSheetOpen} onOpenChange={setIsPreviewSheetOpen}>
                        {/* ... (kode sheet preview) ... */}
                        <SheetContent side="right" className="w-full sm:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[1000px] flex flex-col p-0 h-screen overflow-hidden">
                             <SheetHeader className="px-6 pt-6 pb-4 border-b relative shrink-0"> <SheetTitle>Detail File</SheetTitle> <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 rounded-full" onClick={() => setIsPreviewSheetOpen(false)}> <X className="h-5 w-5" /><span className="sr-only">Tutup</span> </Button> </SheetHeader>
                             <div className="px-6 py-5 space-y-4 border-b shrink-0"> {selectedFileForPreview ? ( <> <div className="flex items-center space-x-3"> <img src={getFileIcon(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder, selectedFileForPreview.iconLink)} alt={getFriendlyFileType(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder)} className="h-9 w-9 flex-shrink-0" /> <span className="font-semibold break-all text-base" title={selectedFileForPreview.filename}>{selectedFileForPreview.filename}</span> </div> <div className="flex gap-2 flex-wrap"> {selectedFileForPreview.webViewLink && <Button variant="default" size="sm" asChild className="text-xs px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white"><a href={selectedFileForPreview.webViewLink} target="_blank" rel="noopener noreferrer">Buka di Drive</a></Button>} </div> <Separator /> <div className="space-y-1 text-sm text-gray-800"> <p><strong>Tipe:</strong> <span className="text-gray-600">{getFriendlyFileType(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder)}</span></p> {selectedFileForPreview.pathname && <p><strong>Lokasi:</strong> <span className="break-words text-gray-600">{selectedFileForPreview.pathname}</span></p>} {selectedFileForPreview.description && <p><strong>Deskripsi:</strong> <span className="break-words whitespace-pre-wrap text-gray-600">{selectedFileForPreview.description}</span></p>} </div> </> ) : ( <div className="flex items-center justify-center h-20 text-gray-500"> Memuat detail... </div> )} </div>
                             <div ref={pdfPreviewAreaRef} className="preview-content-area flex-1 min-h-0 flex flex-col bg-gray-200">
                                <div className="flex-1 min-h-0 overflow-hidden">
                                     {selectedFileForPreview?.mimeType === 'application/pdf' && ( <div className="flex-1 flex flex-col min-h-0 h-full"> {pdfLoading && ( <div className="flex-1 flex items-center justify-center text-gray-500 p-4"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat...</div> )} {pdfError && ( <div className="flex-1 flex items-center justify-center text-red-600 bg-red-50 p-4 text-center text-sm">Error: {pdfError}</div> )} {pdfFile && !pdfLoading && !pdfError && ( <div ref={pdfContainerRef} className="react-pdf-scroll-container flex-1 overflow-auto bg-gray-300"> <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess} onLoadError={(error) => setPdfError(`Gagal load PDF: ${error.message}`)} loading={null} error={<div className="p-4 text-center text-red-500 text-sm">Gagal memuat PDF.</div>} className="flex flex-col items-center py-4 pdf-document" > {Array.from(new Array(numPages ?? 0), (el, index) => ( <div key={`page_wrap_${index + 1}`} ref={(el) => { pageRefs.current[index] = el; }} data-page-number={index + 1} className="relative mb-4 bg-white shadow-lg" > <PdfPage pageNumber={index + 1} scale={pdfScale} width={pdfContainerWidth ? pdfContainerWidth : undefined} renderTextLayer={true} renderAnnotationLayer={false} loading={<div className={`bg-gray-200 animate-pulse mx-auto`} style={{height: pdfContainerWidth ? (pdfContainerWidth*1.414) : 800, width: pdfContainerWidth ?? 'auto'}}></div>} error={<div className="my-2 p-2 text-red-500 text-xs text-center">Gagal load hal {index + 1}.</div>} className="pdf-page-render" /> <div className="absolute bottom-2 right-2 z-10"> <span className="bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded-sm shadow"> {index + 1} </span> </div> </div> ))} </Document> </div> )} </div> )}
                                    {selectedFileForPreview && selectedFileForPreview.mimeType !== 'application/pdf' && ( <div className="flex-1 flex items-center justify-center p-4 h-full"> {selectedFileForPreview.mimeType?.includes('google-apps') && !selectedFileForPreview.mimeType.includes('folder') && selectedFileForPreview.webViewLink ? ( <iframe src={selectedFileForPreview.webViewLink.replace('/edit', '/preview').replace('/view', '/preview')} className="w-full h-full border-0" title={`Preview ${selectedFileForPreview.filename}`} sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe> ) : selectedFileForPreview.mimeType?.startsWith('image/') ? ( <div className="w-full h-full flex items-center justify-center"><p className="text-sm text-gray-500 italic">(Preview gambar belum ada)</p></div> ) : ( <p className="text-sm text-gray-500 italic">Preview tidak tersedia.</p> )} </div> )}
                                    {!selectedFileForPreview && ( <div className="flex-1 flex items-center justify-center text-gray-500"> Memuat detail... </div> )}
                                </div>
                                {selectedFileForPreview?.mimeType === 'application/pdf' && pdfFile && !pdfLoading && !pdfError && ( <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b bg-gray-100 shrink-0"> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={pdfScale <= PDF_MIN_SCALE}><ZoomOut className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Perkecil</TooltipContent></Tooltip> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetZoom} disabled={pdfScale === 1.0}><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Reset Zoom</TooltipContent></Tooltip> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={pdfScale >= PDF_MAX_SCALE}><ZoomIn className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Perbesar</TooltipContent></Tooltip> <span className="text-xs font-medium text-gray-600 w-12 text-center tabular-nums">{(pdfScale * 100).toFixed(0)}%</span> <Separator orientation="vertical" className="h-5 mx-1 sm:mx-2" /> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-8 px-3" onClick={goToPrevPage} disabled={pageNumber <= 1}>Prev</Button></TooltipTrigger><TooltipContent>Hal Sblm</TooltipContent></Tooltip> <span className="text-xs font-medium px-2 min-w-[70px] text-center justify-center"> Hal {pageNumber} / {numPages ?? '?'} </span> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-8 px-3" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages}>Next</Button></TooltipTrigger><TooltipContent>Hal Brikut</TooltipContent></Tooltip> </div> )}
                            </div>
                        </SheetContent>
                    </Sheet>
                    {/* --- Akhir Sheet Preview --- */}

                    {/* --- Render Modal Share Workspace (Sama) --- */}
                    {isAdmin && activeWorkspaceId && supabase && currentUser && activeWorkspaceName && activeWorkspaceUrl && (
                        <ShareWorkspaceModal
                            isOpen={isShareModalOpen}
                            onClose={() => setIsShareModalOpen(false)}
                            workspaceId={activeWorkspaceId}
                            workspaceName={activeWorkspaceName}
                            workspaceUrl={activeWorkspaceUrl}
                            supabase={supabase}
                            currentUser={currentUser}
                        />
                    )}
                    {/* --- Akhir Render Modal --- */}

                </SidebarInset>
            </SidebarProvider>
             {/* PENTING: Render <Toaster /> Anda di root layout (app/layout.tsx) */}
        </TooltipProvider>
    );
}
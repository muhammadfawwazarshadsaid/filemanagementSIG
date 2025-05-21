// src/components/FolderSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useUser } from "@stackframe/stack"; // Pastikan library ini terinstal dan dikonfigurasi
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import { Loader2 } from 'lucide-react';
import FolderHomepageUI from './folder-homepage-ui';
import router from 'next/router';
import { toast } from 'sonner';
// Ganti import UI ke UI yang benar jika berbeda
// import FolderSelectorUI from './folder-homepage-ui'; // Sesuaikan jika perlu

// --- Definisi Tipe Data ---
interface GoogleDriveFile {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
    webViewLink?: string; // Link untuk membuka file di GDrive
}

interface GoogleDriveFilesListResponse {
    files: GoogleDriveFile[];
    nextPageToken?: string;
}

// Interface Metadata Supabase (Folder) - Tambahkan is_self_folder
interface SupabaseFolderMetadata {
    id: string; // GDrive ID (PK)
    workspace_id: string; // GDrive ID of the workspace (PK)
    user_id: string; // User ID (diasumsikan bagian dari constraint atau untuk filtering)
    description?: string | null;
    color?: string | null;
    labels?: string[] | null;
    created_at?: string;
    updated_at?: string;
    is_self_folder?: boolean | null; // <-- BARU: Status kepemilikan folder
}

// Interface ManagedItem - Tambahkan is_self_folder
export interface ManagedItem extends GoogleDriveFile {
    metadata?: SupabaseFolderMetadata | null; // Gunakan interface yang diperbarui
    fileCount?: number;
    is_self_folder?: boolean | null; // <-- BARU: Hoist properti untuk akses mudah
}

// Interface Workspace - Tambahkan is_self_workspace
export interface Workspace {
    id: string;
    user_id: string;
    url: string;
    name: string;
    color?: string | null;
    is_self_workspace?: boolean | null; // <-- BARU: Status kepemilikan workspace
}

interface GoogleDriveFileDetail {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
}

export interface FolderPathItem {
    id: string;
    name: string;
}

// --- Konstanta ---
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

const defaultColors: { [key: string]: string } = {
    "blue": 'bg-blue-500', "green": 'bg-green-500', "red": 'bg-red-500',
    "yellow": 'bg-yellow-500', "purple": 'bg-purple-500', "pink": 'bg-pink-500',
    "indigo": 'bg-indigo-500', "gray": 'bg-gray-500',
};
const DEFAULT_FOLDER_COLOR_VALUE = Object.values(defaultColors)[0] || 'bg-gray-500';

// --- Props Komponen ---
interface FolderHomepageProps {
    onFolderExistenceChange?: (hasFolders: boolean) => void;
    initialTargetWorkspaceId?: string | null; // <-- PROP BARU untuk ID target awal
}


// --- Komponen Utama ---
const FolderHomepage: React.FC<FolderHomepageProps> = ({ onFolderExistenceChange, initialTargetWorkspaceId }) => {
    const user = useUser();
    const app = useUser();
    const account = user ? user.useConnectedAccount('google', {
        scopes: ['https://www.googleapis.com/auth/drive'] // Scope penuh
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    const [isAddingWorkspace, setIsAddingWorkspace] = useState<boolean>(false);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
    const [newWorkspaceColor, setNewWorkspaceColor] = useState<string>(Object.values(defaultColors)[0] || 'bg-gray-500');
    const [isAllFolderDialogOpen, setIsAllFolderDialogOpen] = useState<boolean>(false);

    const [selectedWorkspaceForBrowse, setSelectedWorkspaceForBrowse] = useState<Workspace | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [itemsInCurrentFolder, setItemsInCurrentFolder] = useState<ManagedItem[]>([]); // Gunakan ManagedItem yang sudah diperbarui
    const [isLoadingFolderContent, setIsLoadingFolderContent] = useState<boolean>(false);
    const [folderError, setFolderError] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<FolderPathItem[]>([]);
    const [currentFolderIsSelf, setCurrentFolderIsSelf] = useState<boolean>(true); // <-- BARU: State untuk status folder saat ini

    const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isEditMetadataDialogOpen, setIsEditMetadataDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [folderBeingManaged, setFolderBeingManaged] = useState<ManagedItem | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [addDescription, setAddDescription] = useState('');
    const [addLabels, setAddLabels] = useState<string[]>([]);
    const [addFolderColor, setAddFolderColor] = useState<string>(DEFAULT_FOLDER_COLOR_VALUE);
    const [editFolderName, setEditFolderName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLabels, setEditLabels] = useState<string[]>([]);
    const [editFolderColor, setEditFolderColor] = useState<string>(DEFAULT_FOLDER_COLOR_VALUE);
    const [isProcessingFolderAction, setIsProcessingFolderAction] = useState(false);

    // --- Helper Panggil API Google (sama seperti sebelumnya) ---
// ...
const makeApiCall = useCallback(async <T = any>(
    url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
): Promise<T | null> => {
    if (!accessToken) {
        setWorkspaceError("Token Google tidak tersedia."); // Atau error yang lebih spesifik
        setFolderError("Token Google tidak tersedia.");
        // Pertimbangkan redirect jika tidak ada token sama sekali
        // router.push('/masuk?error=no_token_fs');
        return null;
    }

    const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
    if (!(body instanceof FormData) && body && method !== 'GET' && method !== 'DELETE') {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    const options: RequestInit = { method, headers: defaultHeaders };
    if (body) {
        options.body = (body instanceof FormData) ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorData: any = {};
            try { errorData = await response.json(); } catch (e) {}
            const message = errorData?.error?.message || errorData?.error_description || response.statusText || `HTTP error ${response.status}`;

            if (response.status === 401) {
                // Token tidak valid atau kedaluwarsa
                const uiErrorMessage = "Sesi Google Anda telah berakhir. Silakan masuk kembali.";
                setWorkspaceError(uiErrorMessage);
                setFolderError(uiErrorMessage);
                toast.error("Sesi Berakhir", { description: "Anda akan diarahkan ke halaman login." });

                try {
                    await app?.signOut(); // Mencoba sign out dari StackFrame
                } catch (signOutError) {
                    console.error("Error saat sign out dari StackFrame (FolderHomepage):", signOutError);
                }

                router.push('/masuk'); // Arahkan ke login
                return null; // Hentikan pemrosesan
            }

            // Untuk error HTTP lainnya (bukan 401)
            const generalApiError = `Google API Error (${response.status}): ${message}`;
            setWorkspaceError(generalApiError); // Sesuaikan konteks error jika perlu
            setFolderError(generalApiError);
            throw new Error(generalApiError); // Lempar error agar ditangkap oleh blok catch di bawah
        }

        if (response.status === 204) { return null; } // No Content
        return response.json() as Promise<T>;

    } catch (err: any) {
        // Menangkap error dari 'throw new Error' di atas atau error jaringan
        console.error(`FolderHomepage makeApiCall Gagal (${method} ${url}):`, err.message);
        // Set error hanya jika belum di-set oleh penanganan 401
        // (Meskipun jika 401, return null akan menghentikan eksekusi sebelum baris ini)
        // Jika err.message sudah mengandung "Google API Error", tidak perlu diubah.
        // Jika ini adalah error jaringan (misal, "Failed to fetch"), err.message akan sesuai.
        setWorkspaceError(err.message || "Terjadi kesalahan jaringan atau koneksi.");
        setFolderError(err.message || "Terjadi kesalahan jaringan atau koneksi.");
        return null;
    }
}, [accessToken, router, app, setFolderError, setWorkspaceError]); // <-- PERBARUI DEPENDENSI
    // --- Fetch Konten Folder (MODIFIED: Ambil is_self_folder) ---
    const fetchFolderContent = useCallback(async (folderIdToFetch: string, targetWorkspaceId: string, targetUserId: string) => {
        if (!accessToken || !targetUserId || !targetWorkspaceId) { /* ... handling error ... */ return; }
        setIsLoadingFolderContent(true); setFolderError(null);
        let googleDriveItems: GoogleDriveFile[] = []; let combinedItems: ManagedItem[] = []; let foldersExistInResult = false;
        try {
            // 1. Fetch GDrive items
            const fieldsToFetch = "files(id, name, mimeType, parents, webViewLink)";
            const query = `'${folderIdToFetch}' in parents and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsToFetch)}&orderBy=folder,name`;
            const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);
            if (!gDriveData) { /* ... handling error ... */ return; }
            googleDriveItems = gDriveData.files || [];

            // 2. Fetch metadata from Supabase (MODIFIED: Select is_self_folder)
            let metadataMap: Record<string, SupabaseFolderMetadata> = {};
            if (googleDriveItems.length > 0) {
                const itemIds = googleDriveItems.map(item => item.id);
                const { data: metadataList, error: metaError } = await supabase
                    .from('folder') // Nama tabel folder
                    .select('id, description, labels, color, is_self_folder') // <-- TAMBAHKAN is_self_folder
                    .in('id', itemIds)
                    .eq('workspace_id', targetWorkspaceId)
                    .eq('user_id', targetUserId);
                if (metaError) { console.warn("Supabase meta fetch warning:", metaError.message); }
                if (metadataList) { metadataList.forEach(meta => { metadataMap[meta.id] = meta as SupabaseFolderMetadata; }); }
            }

            // 3. Fetch file counts (Tetap sama)
            const folderItems = googleDriveItems.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
            let fileCountsMap: Record<string, number> = {};
            if (folderItems.length > 0) { /* ... kode fetch count tetap sama ... */
                const countPromises = folderItems.map(async (folder) => {
                    const countQuery = `'${folder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`;
                    const countUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(countQuery)}&fields=files(id)&pageSize=1000`;
                    try {
                        const countResult = await makeApiCall<GoogleDriveFilesListResponse>(countUrl);
                        if (!countResult) return { folderId: folder.id, count: -1 };
                        return { folderId: folder.id, count: (countResult.files || []).length };
                    } catch (countErr: any) { return { folderId: folder.id, count: -1 }; }
                });
                const counts = await Promise.all(countPromises);
                counts.forEach(result => { if (result.count >= 0) fileCountsMap[result.folderId] = result.count; });
            }

            // 4. Combine all data (MODIFIED: Map is_self_folder)
            combinedItems = googleDriveItems.map(gItem => {
                const isFolder = gItem.mimeType === 'application/vnd.google-apps.folder';
                const fileCount = isFolder ? fileCountsMap[gItem.id] : undefined;
                const itemMetadata = metadataMap[gItem.id] || null; // Ambil metadata item ini

                return {
                    ...gItem,
                    metadata: itemMetadata, // Gunakan metadata yang sudah diambil
                    fileCount: fileCount !== undefined && fileCount >= 0 ? fileCount : undefined,
                    is_self_folder: itemMetadata?.is_self_folder, // <-- MAP is_self_folder dari metadata
                };
            });

            setItemsInCurrentFolder(combinedItems);
            foldersExistInResult = combinedItems.some(item => item.mimeType === 'application/vnd.google-apps.folder');

        } catch (err: any) { /* ... handling error ... */ }
        finally {
            setIsLoadingFolderContent(false);
            if (onFolderExistenceChange) onFolderExistenceChange(foldersExistInResult);
        }
    }, [accessToken, makeApiCall, supabase, user?.id, folderError, onFolderExistenceChange]); // Dependensi tetap sama

    // --- Handler Pemilihan Workspace (MODIFIED: Set currentFolderIsSelf) ---
     const handleSelectWorkspaceForBrowse = useCallback((workspace: Workspace) => {
         if (!user?.id) return;
         if (selectedWorkspaceForBrowse?.id === workspace.id) { /* ... refresh logic ... */ return; }
         setSelectedWorkspaceForBrowse(workspace);
         setCurrentFolderId(workspace.id);
         const initialPath = [{ id: workspace.id, name: workspace.name }];
         setFolderPath(initialPath);
         setItemsInCurrentFolder([]); setFolderError(null); setIsLoadingFolderContent(true);
         // --- BARU: Set status folder saat ini berdasarkan workspace ---
         setCurrentFolderIsSelf(workspace.is_self_workspace !== false);
         // -----------------------------------------------------------
         setIsAddFolderDialogOpen(false); /* ... reset dialogs ... */ setIsRenameDialogOpen(false); setIsEditMetadataDialogOpen(false); setIsDeleteDialogOpen(false); setFolderBeingManaged(null);
         if (onFolderExistenceChange) onFolderExistenceChange(false);
         fetchFolderContent(workspace.id, workspace.id, user.id);
    }, [user?.id, fetchFolderContent, selectedWorkspaceForBrowse?.id, currentFolderId, onFolderExistenceChange]);

    // --- Memuat Workspace (MODIFIED: Fetch is_self_workspace) ---
    const loadWorkspaces = useCallback(async (targetId: string | null = null) => {
         if (!user?.id || !accessToken) { /* ... handling loading ... */ return; }
         setIsLoadingWorkspaces(true); setWorkspaceError(null);
         let foundWorkspaces: Workspace[] = [];
         try {
             // --- MODIFIED: Select is_self_workspace ---
             const { data: supabaseWorkspaces, error: supabaseError } = await supabase
                .from('workspace')
                .select('*, is_self_workspace') // <-- TAMBAHKAN is_self_workspace
                .eq('user_id', user.id);
             // ---------------------------------------
             if (supabaseError) throw new Error(`Supabase Error: ${supabaseError.message}`);
             foundWorkspaces = (supabaseWorkspaces as Workspace[]) || [];
             setWorkspaces(foundWorkspaces);
             let workspaceToSelect: Workspace | null = null;
             // ... (logika pemilihan workspace tetap sama) ...
              if (targetId) { workspaceToSelect = foundWorkspaces.find(ws => ws.id === targetId) || null; if (!workspaceToSelect && foundWorkspaces.length > 0) workspaceToSelect = foundWorkspaces[0]; }
              else { const currentSelection = selectedWorkspaceForBrowse; const currentExists = currentSelection && foundWorkspaces.some(ws => ws.id === currentSelection.id); if (currentExists) workspaceToSelect = currentSelection; else if (foundWorkspaces.length > 0) workspaceToSelect = foundWorkspaces[0]; }

             if (workspaceToSelect) {
                 if (selectedWorkspaceForBrowse?.id !== workspaceToSelect.id) handleSelectWorkspaceForBrowse(workspaceToSelect);
                 else if (onFolderExistenceChange) onFolderExistenceChange(true);
             } else {
                 setSelectedWorkspaceForBrowse(null); setCurrentFolderId(null); setItemsInCurrentFolder([]); setFolderPath([]); if (onFolderExistenceChange) onFolderExistenceChange(false);
             }
         } catch (err: any) { /* ... handling error ... */ setWorkspaceError(err.message); setWorkspaces([]); setSelectedWorkspaceForBrowse(null); if (onFolderExistenceChange) onFolderExistenceChange(false); }
         finally { setIsLoadingWorkspaces(false); }
    }, [ user?.id, accessToken, supabase, handleSelectWorkspaceForBrowse, onFolderExistenceChange, selectedWorkspaceForBrowse ]);


    // --- useEffect untuk memanggil loadWorkspaces (sama seperti sebelumnya) ---
    useEffect(() => {
         const targetIdToLoad = initialTargetWorkspaceId || null;
         if (user?.id && accessToken) {
             loadWorkspaces(targetIdToLoad);
         }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, accessToken, initialTargetWorkspaceId]); // loadWorkspaces di-exclude karena useCallback sudah handle dependensinya

    // --- Fungsi CRUD Workspace (MODIFIED: Set is_self_workspace on Add) ---
    const extractFolderIdFromLink = (link: string): string | null => { const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/); return match ? match[1] : null; };
    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
         e.preventDefault(); setWorkspaceError(null);
         if (!user?.id || !accessToken) { setWorkspaceError("User tidak terautentikasi."); return; }
         const folderId = extractFolderIdFromLink(newWorkspaceLink);
         if (!folderId) { setWorkspaceError("Link folder Google Drive tidak valid."); return; }
         if (workspaces.some(ws => ws.id === folderId)) { setWorkspaceError(`Workspace dengan folder ID tersebut sudah ditambahkan.`); return; }
         setIsAddingWorkspace(true);
         try {
             const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
             const folderDetails = await makeApiCall<GoogleDriveFileDetail>(verifyUrl);
             if (!folderDetails) { throw new Error(workspaceError || `Folder GDrive ${folderId} tidak ditemukan.`); }
             if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') { throw new Error(`Item bukan folder.`); }
             const workspaceName = newWorkspaceName.trim() || folderDetails.name;
             // --- MODIFIED: Set is_self_workspace ke true saat user menambahkan ---
             const newWorkspaceData = {
                 id: folderDetails.id, user_id: user.id, url: newWorkspaceLink, name: workspaceName, color: newWorkspaceColor, is_self_workspace: true // <-- BARU
             };
             const { error: insertError } = await supabase.from('workspace').insert([newWorkspaceData]);
             if (insertError) { if (insertError.code === '23505') throw new Error(`Workspace ID ${folderId} sudah ada.`); else throw new Error(`DB Error: ${insertError.message}`); }
             await loadWorkspaces(folderId);
             setNewWorkspaceLink(''); setNewWorkspaceName(''); setNewWorkspaceColor(DEFAULT_FOLDER_COLOR_VALUE);
         } catch (err: any) { if (!workspaceError) setWorkspaceError(`Gagal: ${err.message}`); }
         finally { setIsAddingWorkspace(false); }
    };
    const handleRemoveWorkspace = async (idToRemove: string) => {
        if (!user?.id) return;
         const wsToRemove = workspaces.find(ws => ws.id === idToRemove);
         if (!window.confirm(`Hapus workspace "${wsToRemove?.name || idToRemove}" dari daftar?\n(Folder asli GDrive TIDAK terhapus)`)) return;
         setIsLoadingWorkspaces(true); setWorkspaceError(null);
         try {
             const { error: deleteError } = await supabase.from('workspace').delete().match({ id: idToRemove, user_id: user.id });
             if (deleteError) throw new Error(`DB Error: ${deleteError.message}`);
             await loadWorkspaces();
         } catch (err: any) { setWorkspaceError(`Gagal hapus: ${err.message}`); setIsLoadingWorkspaces(false); }
    };

    // --- Navigasi Folder (MODIFIED: Set currentFolderIsSelf) ---
    const navigateToFolder = (folderId: string, folderName: string) => {
        if (!user?.id || !selectedWorkspaceForBrowse) return;
        // --- BARU: Dapatkan status 'is_self_folder' dari item yang diklik SEBELUM state diubah ---
        const clickedFolderItem = itemsInCurrentFolder.find(item => item.id === folderId);
        const nextFolderIsSelf = clickedFolderItem ? clickedFolderItem.is_self_folder !== false : true; // Default true jika tidak ketemu (seharusnya tidak terjadi)
        setCurrentFolderId(folderId);
        setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
        setItemsInCurrentFolder([]); setFolderError(null); setIsLoadingFolderContent(true);
        // --- BARU: Update status folder saat ini ---
        setCurrentFolderIsSelf(nextFolderIsSelf);
        if (onFolderExistenceChange) onFolderExistenceChange(false);
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

    // --- Navigasi Breadcrumb (MODIFIED: Set currentFolderIsSelf) ---
    const navigateViaBreadcrumb = (folderId: string, index: number) => {
        if (!user?.id || !selectedWorkspaceForBrowse || index === folderPath.length - 1) return;
        setCurrentFolderId(folderId);
        setFolderPath(prev => prev.slice(0, index + 1));
        setItemsInCurrentFolder([]); setFolderError(null); setIsLoadingFolderContent(true);
        // --- BARU: Update status folder saat ini berdasarkan level ---
        if (index === 0) setCurrentFolderIsSelf(selectedWorkspaceForBrowse?.is_self_workspace !== false);
        else setCurrentFolderIsSelf(true); // Asumsi bisa ditambah, UI akan handle disable lebih lanjut
        if (onFolderExistenceChange) onFolderExistenceChange(false);
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

    // --- Trigger Dialog CRUD (MODIFIED: Cek izin sebelum buka dialog) ---
    const triggerAddFolder = () => {
        // Cek izin folder saat ini
        if (!currentFolderIsSelf) {
            console.warn("Tidak bisa menambah folder di lokasi ini (bukan milik Anda).");
            // toast.warning("Anda tidak dapat menambah folder di lokasi ini."); // Aktifkan jika pakai toast
            return; // Jangan buka dialog
        }
        setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_FOLDER_COLOR_VALUE); setFolderError(null); setIsAddFolderDialogOpen(true);
    };
    const triggerAllFolder = () => { setFolderError(null); setIsAllFolderDialogOpen(true); };
    const triggerRenameFolder = (folder: ManagedItem) => {
        // Cek izin folder spesifik ini
        if (folder.is_self_folder === false) {
            console.warn(`Tidak bisa rename folder "${folder.name}" (bukan milik Anda).`);
            // toast.warning(`Anda tidak dapat me-rename folder "${folder.name}".`); // Aktifkan jika pakai toast
            return; // Jangan buka dialog
        }
        setFolderBeingManaged(folder); setEditFolderName(folder.name); setFolderError(null); setIsRenameDialogOpen(true);
    };
    const triggerEditMetadata = (folder: ManagedItem) => {
        // Cek izin folder spesifik ini
        if (folder.is_self_folder === false) {
            console.warn(`Tidak bisa edit metadata folder "${folder.name}" (bukan milik Anda).`);
            // toast.warning(`Anda tidak dapat mengedit detail folder "${folder.name}".`); // Aktifkan jika pakai toast
            return; // Jangan buka dialog
        }
        setFolderBeingManaged(folder); setEditDescription(folder.metadata?.description || ''); setEditLabels(folder.metadata?.labels || []); setEditFolderColor(folder.metadata?.color || DEFAULT_FOLDER_COLOR_VALUE); setFolderError(null); setIsEditMetadataDialogOpen(true);
    };
    const triggerDeleteFolder = (folder: ManagedItem) => {
        // Cek izin folder spesifik ini
        if (folder.is_self_folder === false) {
            console.warn(`Tidak bisa hapus folder "${folder.name}" (bukan milik Anda).`);
            // toast.warning(`Anda tidak dapat menghapus folder "${folder.name}".`); // Aktifkan jika pakai toast
            return; // Jangan buka dialog
        }
        setFolderBeingManaged(folder); setFolderError(null); setIsDeleteDialogOpen(true);
    };

    // --- Fungsi Aksi CRUD Folder (MODIFIED: Tambahkan is_self_folder saat Add & Cek Izin) ---
    const handleAddFolderAction = async () => {
         if (!user?.id || !accessToken || !currentFolderId || !selectedWorkspaceForBrowse || !newFolderName.trim()) { /* ... error handling ... */ return; }
         // --- BARU: Cek lagi izin folder parent sebelum proses ---
         if (!currentFolderIsSelf) {
             setFolderError("Anda tidak diizinkan menambah folder di lokasi ini.");
             setIsAddFolderDialogOpen(false); // Tutup dialog jika terbuka secara tidak sengaja
             return;
         }
         setIsProcessingFolderAction(true); setFolderError(null);
         const parentFolderId = currentFolderId; const workspaceId = selectedWorkspaceForBrowse.id; const userId = user.id;
         const folderName = newFolderName.trim(); const descriptionToAdd = addDescription.trim() || null;
         const labelsToAdd = addLabels.filter(l => l.trim()); const colorToAdd = addFolderColor;
         const gdriveMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] };
         try {
             const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', gdriveMetadata);
             if (!createdFolder) { throw new Error(folderError || "Gagal membuat folder GDrive."); }
             const newFolderId = createdFolder.id;
             // --- MODIFIED: Set is_self_folder ke true saat user membuat ---
              const metadataToSave: Partial<SupabaseFolderMetadata> & { id: string; workspace_id: string; user_id: string } = {
                 id: newFolderId, workspace_id: workspaceId, user_id: userId,
                 description: descriptionToAdd,
                 labels: labelsToAdd.length > 0 ? labelsToAdd : null,
                 color: colorToAdd,
                 is_self_folder: true // <-- BARU: Tandai sebagai milik sendiri
             };
             // Selalu upsert untuk memastikan record ada dengan is_self_folder=true
             const { error: upsertMetaError } = await supabase.from('folder').upsert(metadataToSave, { onConflict: 'id, workspace_id, user_id' });
             if (upsertMetaError) { console.error("Gagal simpan metadata:", upsertMetaError); setFolderError(`Folder dibuat, tapi gagal simpan detail: ${upsertMetaError.message}.`); }
             else { console.log("Metadata berhasil disimpan/diperbarui."); }

             setIsAddFolderDialogOpen(false); /* ... reset form ... */ setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_FOLDER_COLOR_VALUE);
             fetchFolderContent(parentFolderId, workspaceId, userId);
         } catch (err: any) { if (!folderError) setFolderError(err.message); }
         finally { setIsProcessingFolderAction(false); }
    };
    const handleRenameFolderAction = async () => {
        // --- BARU: Cek izin di awal ---
        if (folderBeingManaged?.is_self_folder === false) {
            setFolderError("Anda tidak diizinkan me-rename folder ini.");
            setIsRenameDialogOpen(false); return;
        }
        if (!user?.id || !accessToken || !folderBeingManaged || !editFolderName.trim()) { /* ... error handling ... */ return; }
        const folderId = folderBeingManaged.id; const newName = editFolderName.trim();
        if (newName === folderBeingManaged.name) { setIsRenameDialogOpen(false); return; }
        setIsProcessingFolderAction(true); setFolderError(null);
         try {
             const updatedFolder = await makeApiCall<GoogleDriveFile>(`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`, 'PATCH', { name: newName });
             if (!updatedFolder) { throw new Error(folderError || "Gagal rename GDrive."); }
             setIsRenameDialogOpen(false); setFolderBeingManaged(null);
             if (currentFolderId && selectedWorkspaceForBrowse) { fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, user.id); }
         } catch (err: any) { if (!folderError) setFolderError(err.message); }
         finally { setIsProcessingFolderAction(false); }
    };
    const handleEditMetadataAction = async () => {
        // --- BARU: Cek izin di awal ---
        if (folderBeingManaged?.is_self_folder === false) {
            setFolderError("Anda tidak diizinkan mengedit detail folder ini.");
            setIsEditMetadataDialogOpen(false); return;
        }
        if (!user?.id || !selectedWorkspaceForBrowse || !folderBeingManaged) { /* ... error handling ... */ return; }
        const { id: folderId } = folderBeingManaged; const { id: workspaceId } = selectedWorkspaceForBrowse; const userId = user.id;
        const descriptionToSave = editDescription.trim() || null; const labelsToSave = editLabels.filter(l => l.trim()); const colorToSave = editFolderColor;
        const metadataToSave: Partial<SupabaseFolderMetadata> & { id: string; workspace_id: string; user_id: string } = {
            id: folderId, workspace_id: workspaceId, user_id: userId,
            description: descriptionToSave, labels: labelsToSave.length > 0 ? labelsToSave : null, color: colorToSave,
        };
        setIsProcessingFolderAction(true); setFolderError(null);
         try {
             const { error: upsertError } = await supabase.from('folder').upsert(metadataToSave, { onConflict: 'id, workspace_id, user_id' });
             if (upsertError) { throw new Error(`Gagal simpan detail: ${upsertError.message}`); }
             setIsEditMetadataDialogOpen(false); setFolderBeingManaged(null);
             if (currentFolderId && selectedWorkspaceForBrowse) { fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, userId); }
         } catch (err: any) { if (!folderError) setFolderError(err.message); }
         finally { setIsProcessingFolderAction(false); }
    };
    const handleDeleteFolderAction = async () => {
        // --- BARU: Cek izin di awal ---
        if (folderBeingManaged?.is_self_folder === false) {
            setFolderError("Anda tidak diizinkan menghapus folder ini.");
            setIsDeleteDialogOpen(false); return;
        }
        if (!user?.id || !accessToken || !folderBeingManaged || !selectedWorkspaceForBrowse) { /* ... error handling ... */ return; }
        const { id: folderId, name: folderName } = folderBeingManaged; const { id: workspaceId } = selectedWorkspaceForBrowse;
        if (!window.confirm(`PERINGATAN!\nHapus folder "${folderName}" & ISINYA permanen dari GDrive?\nTIDAK DAPAT DIBATALKAN.`)) { setIsDeleteDialogOpen(false); return; }
        setIsProcessingFolderAction(true); setFolderError(null);
        try {
             const deleteResult = await makeApiCall<null>(`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`, 'DELETE');
             if (deleteResult !== null || folderError) { if (!folderError) setFolderError("Gagal hapus GDrive."); setIsDeleteDialogOpen(false); setIsProcessingFolderAction(false); return; }
             const { error: metaDeleteError } = await supabase.from('folder').delete().match({ id: folderId, workspace_id: workspaceId, user_id: user.id });
             if (metaDeleteError) { console.error("Gagal hapus metadata:", metaDeleteError); }
             setIsDeleteDialogOpen(false); setFolderBeingManaged(null);
             if (currentFolderId && selectedWorkspaceForBrowse) { fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, user.id); }
        } catch (err: any) { if (!folderError) setFolderError(`Gagal hapus: ${err.message}`); }
        finally { setIsProcessingFolderAction(false); }
    };


    // --- Render ---
    if (!user?.id || !account || !accessToken) { /* ... kode loading state ... */
        let message = "Memuat user...";
        if(user?.id && !account) message = "Menghubungkan Google...";
        if(user?.id && account && !accessToken) message = "Mengambil akses token...";
        return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> {message}</div>;
    }

    // Pastikan semua props diteruskan ke UI Component
    return (
        <FolderHomepageUI
            // Props Workspace
            error={workspaceError}
            newWorkspaceLink={newWorkspaceLink}
            setNewWorkspaceLink={setNewWorkspaceLink}
            workspaces={workspaces}
            isLoading={isLoadingWorkspaces}
            isAdding={isAddingWorkspace}
            accessToken={accessToken} // Pass jika UI butuh
            handleAddWorkspace={handleAddWorkspace}
            handleRemoveWorkspace={handleRemoveWorkspace}
            handleSelectWorkspaceForBrowse={handleSelectWorkspaceForBrowse}
            newWorkspaceName={newWorkspaceName}
            setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor}
            setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={defaultColors}

            // Props Folder Browser
            selectedWorkspaceForBrowse={selectedWorkspaceForBrowse}
            itemsInCurrentFolder={itemsInCurrentFolder} // ManagedItem kini punya is_self_folder
            isLoadingFolderContent={isLoadingFolderContent}
            folderError={folderError}
            folderPath={folderPath}
            onNavigate={navigateToFolder}
            onNavigateBreadcrumb={navigateViaBreadcrumb}

            // --- Folder Action Props (MODIFIED: Tambahkan currentFolderIsSelf) ---
            isProcessingFolderAction={isProcessingFolderAction}
            currentFolderIsSelf={currentFolderIsSelf} // <-- KIRIM STATUS FOLDER SAAT INI
            onTriggerAddFolder={triggerAddFolder}
            onTriggerAllFolder={triggerAllFolder}
            onTriggerRenameFolder={triggerRenameFolder}
            onTriggerEditMetadata={triggerEditMetadata}
            onTriggerDeleteFolder={triggerDeleteFolder}
            // -------------------------------------------------------------

            // Props Dialog Add Folder
            isAddFolderDialogOpen={isAddFolderDialogOpen}
            setIsAddFolderDialogOpen={setIsAddFolderDialogOpen}
            isAllFolderDialogOpen={isAllFolderDialogOpen} // Kirim state dialog all folders
            setIsAllFolderDialogOpen={setIsAllFolderDialogOpen} // Kirim setter state
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            addDescription={addDescription}
            setAddDescription={setAddDescription}
            addLabels={addLabels}
            setAddLabels={setAddLabels}
            addFolderColor={addFolderColor}
            setAddFolderColor={setAddFolderColor}
            handleAddFolderAction={handleAddFolderAction}

            // Props Dialog Rename Folder
            isRenameDialogOpen={isRenameDialogOpen}
            setIsRenameDialogOpen={setIsRenameDialogOpen}
            folderBeingManaged={folderBeingManaged} // ManagedItem punya is_self_folder
            editFolderName={editFolderName}
            setEditFolderName={setEditFolderName}
            handleRenameFolderAction={handleRenameFolderAction}

            // Props Dialog Edit Metadata
            isEditMetadataDialogOpen={isEditMetadataDialogOpen}
            setIsEditMetadataDialogOpen={setIsEditMetadataDialogOpen}
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            editLabels={editLabels}
            setEditLabels={setEditLabels}
            editFolderColor={editFolderColor}
            setEditFolderColor={setEditFolderColor}
            handleEditMetadataAction={handleEditMetadataAction}

            // Props Dialog Delete Folder
            isDeleteDialogOpen={isDeleteDialogOpen}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            handleDeleteFolderAction={handleDeleteFolderAction}
        />
    );
};

export default FolderHomepage;
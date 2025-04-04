// src/components/FolderSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useUser } from "@stackframe/stack"; // Pastikan library ini terinstal dan dikonfigurasi
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import { Loader2 } from 'lucide-react';
import FolderSelectorUI from './folder-homepage-ui'; // Impor komponen UI

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

// Sesuaikan dengan nama tabel dan kolom di Supabase Anda
interface SupabaseItemMetadata {
    id: string; // GDrive ID (PK)
    workspace_id: string; // GDrive ID of the workspace (PK)
    user_id: string; // User ID (diasumsikan bagian dari constraint atau untuk filtering)
    description?: string | null;
    color?: string | null;
    labels?: string[] | null;
    created_at?: string;
    updated_at?: string;
}

export interface ManagedItem extends GoogleDriveFile {
    metadata?: SupabaseItemMetadata | null;
}

export interface Workspace {
    id: string;
    user_id: string;
    url: string;
    name: string;
    color?: string | null;
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

// --- Props Komponen ---
interface FolderSelectorProps {
    onFolderExistenceChange?: (hasFolders: boolean) => void;
    initialTargetWorkspaceId?: string | null; // <-- PROP BARU untuk ID target awal
}

// --- Komponen Utama ---
const FolderSelector: React.FC<FolderSelectorProps> = ({ onFolderExistenceChange, initialTargetWorkspaceId }) => {
    const user = useUser({ or: 'redirect' });
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: ['https://www.googleapis.com/auth/drive'] // Scope penuh
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    const defaultColors: { [key: string]: string } = {
    "blue": 'bg-blue-500', "green": 'bg-green-500', "red": 'bg-red-500',
    "yellow": 'bg-yellow-500', "purple": 'bg-purple-500', "pink": 'bg-pink-500',
    "indigo": 'bg-indigo-500', "gray": 'bg-gray-500',
    };
    // **BARU:** Warna default untuk folder baru
    const DEFAULT_FOLDER_COLOR_VALUE = Object.values(defaultColors)[0] || 'bg-gray-500';

    // --- State ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    const [isAddingWorkspace, setIsAddingWorkspace] = useState<boolean>(false);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
    const [newWorkspaceColor, setNewWorkspaceColor] = useState<string>(Object.values(defaultColors)[0] || 'bg-gray-500');

    const [selectedWorkspaceForBrowse, setSelectedWorkspaceForBrowse] = useState<Workspace | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [itemsInCurrentFolder, setItemsInCurrentFolder] = useState<ManagedItem[]>([]);
    const [isLoadingFolderContent, setIsLoadingFolderContent] = useState<boolean>(false);
    const [folderError, setFolderError] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<FolderPathItem[]>([]);

    const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isEditMetadataDialogOpen, setIsEditMetadataDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [folderBeingManaged, setFolderBeingManaged] = useState<ManagedItem | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    // **BARU:** State spesifik untuk input di dialog TAMBAH folder
    const [addDescription, setAddDescription] = useState('');
    const [addLabels, setAddLabels] = useState<string[]>([]);
    // **BARU:** State untuk warna folder saat menambah
    const [addFolderColor, setAddFolderColor] = useState<string>(DEFAULT_FOLDER_COLOR_VALUE);
    const [editFolderName, setEditFolderName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLabels, setEditLabels] = useState<string[]>([]);
    // **BARU:** State untuk warna folder saat mengedit
    const [editFolderColor, setEditFolderColor] = useState<string>(DEFAULT_FOLDER_COLOR_VALUE);
    const [isProcessingFolderAction, setIsProcessingFolderAction] = useState(false);

    // --- Helper Panggil API Google ---
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
        if (!accessToken) {
            const errorMsg = "Akses token Google tidak tersedia.";
            if (selectedWorkspaceForBrowse) setFolderError(errorMsg); else setWorkspaceError(errorMsg);
            console.error("makeApiCall Error: Access Token missing.");
            setIsLoadingFolderContent(false); setIsProcessingFolderAction(false); return null;
        }
        const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
        if (!(body instanceof FormData) && body && method !== 'GET' && method !== 'DELETE') { defaultHeaders['Content-Type'] = 'application/json'; }
        const options: RequestInit = { method, headers: defaultHeaders };
        if (body) { options.body = (body instanceof FormData) ? body : JSON.stringify(body); }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                let errorData: any = {}; try { errorData = await response.json(); } catch (e) {}
                const message = errorData?.error?.message || errorData?.message || `HTTP error ${response.status}`;
                console.error("Google API Call Error:", response.status, message, errorData);
                throw new Error(`Google API Error (${response.status}): ${message}`);
            }
            if (response.status === 204) { return null; }
            return response.json() as Promise<T>;
        } catch (err: any) {
            console.error(`Gagal ${method} ${url}:`, err);
            const errorMsg = err.message || `Gagal menghubungi Google Drive API (${method}).`;
            if (selectedWorkspaceForBrowse) setFolderError(errorMsg); else setWorkspaceError(errorMsg);
            return null;
        }
    }, [accessToken, selectedWorkspaceForBrowse]);

   // --- Fetch Konten Folder ---
    const fetchFolderContent = useCallback(async (folderIdToFetch: string, targetWorkspaceId: string, targetUserId: string) => {
        if (!accessToken || !targetUserId || !targetWorkspaceId) { setFolderError("Data fetch tidak lengkap."); setItemsInCurrentFolder([]); return; }
        setIsLoadingFolderContent(true); setFolderError(null);
        let googleDriveItems: GoogleDriveFile[] = []; let combinedItems: ManagedItem[] = [];
        let foldersExistInResult = false; // Flag lokal untuk hasil fetch ini

        try {
            const fieldsToFetch = "files(id, name, mimeType, parents, webViewLink)";
            const query = `'${folderIdToFetch}' in parents and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsToFetch)}&orderBy=folder,name`;
            const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);
            googleDriveItems = gDriveData?.files || [];
            if (!gDriveData && folderError) throw new Error(folderError);

            let metadataMap: Record<string, SupabaseItemMetadata> = {};
            if (googleDriveItems.length > 0) {
                const itemIds = googleDriveItems.map(item => item.id);
                const { data: metadataList, error: metaError } = await supabase.from('folder').select('id, description, labels, color').in('id', itemIds).eq('workspace_id', targetWorkspaceId).eq('user_id', targetUserId);
                if (metaError) { console.warn("Supabase meta fetch warning:", metaError.message); setFolderError(`Warning: Gagal load sebagian metadata (${metaError.message}).`); }
                if (metadataList) { metadataList.forEach(meta => { metadataMap[meta.id] = meta as SupabaseItemMetadata; }); }
            }
            combinedItems = googleDriveItems.map(gItem => ({ ...gItem, metadata: metadataMap[gItem.id] || null }));
            setItemsInCurrentFolder(combinedItems);
             // Cek apakah ada folder di hasil fetch ini
            foldersExistInResult = combinedItems.some(item => item.mimeType === 'application/vnd.google-apps.folder');

         } catch (err: any) {
             console.error("Error fetching folder content:", err); if (!folderError) setFolderError(err.message || 'Gagal muat folder.');
             setItemsInCurrentFolder([]); // Kosongkan jika error
             foldersExistInResult = false; // Pastikan false jika error
        } finally {
            const foldersExistInResult = combinedItems.some(item => item.mimeType === 'application/vnd.google-apps.folder');
            console.log('[FolderSelector] fetch finally: foldersExistInResult =', foldersExistInResult); // <-- LOG 1
            console.log('[FolderSelector] fetch finally: Is onFolderExistenceChange defined?', !!onFolderExistenceChange); // <-- LOG 2
            if (onFolderExistenceChange) {
                console.log(`[FolderSelector] fetch finally: ===> CALLING onFolderExistenceChange(${foldersExistInResult})`); // <-- LOG 3
                onFolderExistenceChange(foldersExistInResult);
            }

             setIsLoadingFolderContent(false);
             // Panggil callback dengan status folder dari hasil fetch terakhir
             if (onFolderExistenceChange) {
                 console.log(`WorkspaceFolderContent finally - calling onFolderExistenceChange(${foldersExistInResult})`);
                 onFolderExistenceChange(foldersExistInResult);
             }
         }
    }, [accessToken, makeApiCall, supabase, user?.id, folderError, onFolderExistenceChange]); // Tambahkan onFolderExistenceChange


 // --- Handler Pemilihan Workspace ---
    const handleSelectWorkspaceForBrowse = useCallback((workspace: Workspace) => {
          if (!user?.id) return;
          if (selectedWorkspaceForBrowse?.id === workspace.id) { fetchFolderContent(currentFolderId || workspace.id, workspace.id, user.id); return; }
          console.log("Selecting workspace:", workspace.name);
          setSelectedWorkspaceForBrowse(workspace); setCurrentFolderId(workspace.id);
          const initialPath = [{ id: workspace.id, name: workspace.name }]; setFolderPath(initialPath);
          setItemsInCurrentFolder([]); setFolderError(null); setIsLoadingFolderContent(true);
          setIsAddFolderDialogOpen(false); setIsRenameDialogOpen(false); setIsEditMetadataDialogOpen(false); setIsDeleteDialogOpen(false); setFolderBeingManaged(null);
          // Panggil callback false saat mulai load workspace baru (karena belum tahu isinya)
          if (onFolderExistenceChange) {
             onFolderExistenceChange(false);
          }
          fetchFolderContent(workspace.id, workspace.id, user.id);
    }, [user?.id, fetchFolderContent, selectedWorkspaceForBrowse?.id, currentFolderId, onFolderExistenceChange]); // Tambahkan onFolderExistenceChange


    // --- Memuat Workspace (Menggunakan targetId dari prop) ---
    const loadWorkspaces = useCallback(async (targetId: string | null = null) => {
        if (!user?.id || !accessToken) { setIsLoadingWorkspaces(true); return; }
        setIsLoadingWorkspaces(true); setWorkspaceError(null);
        let foundWorkspaces: Workspace[] = [];
        try {
            const { data: supabaseWorkspaces, error: supabaseError } = await supabase.from('workspace').select('*').eq('user_id', user.id);
            if (supabaseError) throw new Error(`Supabase Error: ${supabaseError.message}`);
            foundWorkspaces = (supabaseWorkspaces as Workspace[]) || [];
            setWorkspaces(foundWorkspaces);

            let workspaceToSelect: Workspace | null = null;
            if (targetId) { // Gunakan targetId jika ada
                workspaceToSelect = foundWorkspaces.find(ws => ws.id === targetId) || null;
                if (!workspaceToSelect && foundWorkspaces.length > 0) {
                    console.warn(`Target workspace ID "${targetId}" not found. Falling back to the first.`);
                    workspaceToSelect = foundWorkspaces[0];
                }
            } else { // Jika tidak ada targetId, fallback ke logika default
                const currentSelection = selectedWorkspaceForBrowse;
                const currentExists = currentSelection && foundWorkspaces.some(ws => ws.id === currentSelection.id);
                if (currentExists) workspaceToSelect = currentSelection;
                else if (foundWorkspaces.length > 0) workspaceToSelect = foundWorkspaces[0];
            }

            if (workspaceToSelect) {
                if (selectedWorkspaceForBrowse?.id !== workspaceToSelect.id) {
                    handleSelectWorkspaceForBrowse(workspaceToSelect);
                } else if (onFolderExistenceChange) {
                     // Jika seleksi sama, pastikan onFolderExistenceChange terpanggil true jika ada workspace
                     onFolderExistenceChange(true);
                }
            } else {
                setSelectedWorkspaceForBrowse(null);
                setCurrentFolderId(null);
                setItemsInCurrentFolder([]);
                setFolderPath([]);
                if (onFolderExistenceChange) onFolderExistenceChange(false);
            }
        } catch (err: any) {
             console.error("Gagal load workspaces:", err); setWorkspaceError(err.message);
             setWorkspaces([]); setSelectedWorkspaceForBrowse(null); /* reset */
             if (onFolderExistenceChange) onFolderExistenceChange(false);
        } finally { setIsLoadingWorkspaces(false); }
    // Perbarui dependensi useCallback
    }, [
        user?.id, accessToken, supabase, handleSelectWorkspaceForBrowse, onFolderExistenceChange,
        selectedWorkspaceForBrowse, // Tambahkan ini jika logika fallback bergantung padanya
        setSelectedWorkspaceForBrowse, setCurrentFolderId, setItemsInCurrentFolder, setFolderPath // Tambahkan setter state yang dipanggil
    ]);
    // ---------------------------------------------------------

    // --- useEffect untuk memanggil loadWorkspaces ---
    useEffect(() => {
        // Gunakan nilai dari prop initialTargetWorkspaceId
        const targetIdToLoad = initialTargetWorkspaceId || null;

        if (user?.id && accessToken) {
            // Panggil loadWorkspaces dengan ID target dari prop
            loadWorkspaces(targetIdToLoad);
        }
    // Tambahkan initialTargetWorkspaceId dan loadWorkspaces ke dependensi
    }, [user?.id, accessToken, initialTargetWorkspaceId, loadWorkspaces]);
    // ----------------------------------------------

    // --- Fungsi CRUD Workspace ---
    const extractFolderIdFromLink = (link: string): string | null => {
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/); return match ? match[1] : null;
    };

    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setWorkspaceError(null);
        if (!user?.id || !accessToken) { setWorkspaceError("User tidak terautentikasi."); return; }
        const folderId = extractFolderIdFromLink(newWorkspaceLink);
        if (!folderId) { setWorkspaceError("Link folder tidak valid."); return; }
        if (workspaces.some(ws => ws.id === folderId)) { setWorkspaceError(`Workspace sudah ada.`); return; }
        setIsAddingWorkspace(true);
        try {
            const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            const folderDetails = await makeApiCall<GoogleDriveFileDetail>(verifyUrl);
            if (!folderDetails) { throw new Error(workspaceError || `Folder ${folderId} tidak ditemukan/diakses.`); }
            if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') { throw new Error(`Link bukan folder.`); }
            const workspaceName = newWorkspaceName.trim() || folderDetails.name;
            const newWorkspaceData = { id: folderDetails.id, user_id: user.id, url: newWorkspaceLink, name: workspaceName, color: newWorkspaceColor };
            const { error: insertError } = await supabase.from('workspace').insert([newWorkspaceData]);
            if (insertError) {
                if (insertError.code === '23505') throw new Error(`Workspace ID ${folderId} sudah ada di DB.`);
                throw new Error(`Supabase Insert Error: ${insertError.message}`);
            }
            await loadWorkspaces(); // Reload untuk auto-select jika ini yg pertama
            setNewWorkspaceLink(''); setNewWorkspaceName(''); setNewWorkspaceColor(Object.values(defaultColors)[0] || 'bg-gray-500');
        } catch (err: any) {
            console.error("Error tambah workspace:", err); if (!workspaceError) setWorkspaceError(`Gagal menambahkan: ${err.message}`);
        } finally { setIsAddingWorkspace(false); }
    };

    const handleRemoveWorkspace = async (idToRemove: string) => {
        if (!user?.id) return;
        const wsToRemove = workspaces.find(ws => ws.id === idToRemove);
        if (!window.confirm(`Yakin hapus workspace "${wsToRemove?.name || idToRemove}" dari daftar?\n(Folder asli GDrive TIDAK terhapus)`)) return;
        setIsLoadingWorkspaces(true); setWorkspaceError(null);
        try {
            const { error: deleteError } = await supabase.from('workspace').delete().match({ id: idToRemove, user_id: user.id });
            if (deleteError) throw new Error(`Supabase Delete Error: ${deleteError.message}`);
            console.log(`Workspace ${idToRemove} dihapus.`);
            await loadWorkspaces(); // Reload daftar
        } catch (err: any) {
            console.error("Error hapus workspace:", err); setWorkspaceError(`Gagal menghapus: ${err.message}`);
            setIsLoadingWorkspaces(false);
        }
    };

 // --- Navigasi Folder & Breadcrumb ---
    const navigateToFolder = (folderId: string, folderName: string) => {
        if (!user?.id || !selectedWorkspaceForBrowse) return;
        setCurrentFolderId(folderId); setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
        setItemsInCurrentFolder([]); setFolderError(null); setIsLoadingFolderContent(true);
        // Panggil callback false saat mulai load subfolder (karena belum tahu isinya)
         if (onFolderExistenceChange) {
             onFolderExistenceChange(false);
         }
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };
    const navigateViaBreadcrumb = (folderId: string, index: number) => {
        if (!user?.id || !selectedWorkspaceForBrowse || index === folderPath.length - 1) return;
        setCurrentFolderId(folderId); setFolderPath(prev => prev.slice(0, index + 1));
        setItemsInCurrentFolder([]); setFolderError(null); setIsLoadingFolderContent(true);
        // Panggil callback false saat mulai load parent folder
         if (onFolderExistenceChange) {
             onFolderExistenceChange(false);
         }
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

    // --- Trigger Dialog CRUD ---
    const triggerAddFolder = () => { setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_FOLDER_COLOR_VALUE); setFolderError(null); setIsAddFolderDialogOpen(true); };
    const triggerRenameFolder = (folder: ManagedItem) => { setFolderBeingManaged(folder); setEditFolderName(folder.name); setFolderError(null); setIsRenameDialogOpen(true); };
    const triggerEditMetadata = (folder: ManagedItem) => { setFolderBeingManaged(folder); setEditDescription(folder.metadata?.description || ''); setEditLabels(folder.metadata?.labels || []); setEditFolderColor(folder.metadata?.color || DEFAULT_FOLDER_COLOR_VALUE); setFolderError(null); setIsEditMetadataDialogOpen(true); };
    const triggerDeleteFolder = (folder: ManagedItem) => { setFolderBeingManaged(folder); setFolderError(null); setIsDeleteDialogOpen(true); };

    // --- Fungsi Aksi CRUD Folder ---
    const handleAddFolderAction = async () => {
        if (!user?.id || !accessToken || !currentFolderId || !selectedWorkspaceForBrowse || !newFolderName.trim()) { setFolderError("Nama folder kosong."); return; }
        setIsProcessingFolderAction(true); setFolderError(null);
        const parentFolderId = currentFolderId; const workspaceId = selectedWorkspaceForBrowse.id; const userId = user.id;
        const folderName = newFolderName.trim(); const descriptionToAdd = addDescription.trim() || null;
        const labelsToAdd = addLabels.filter(l => l.trim()).length > 0 ? addLabels.filter(l => l.trim()) : null;
        const colorToAdd = addFolderColor;
        const gdriveMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] };
        try {
            const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', gdriveMetadata);
            if (!createdFolder) { throw new Error(folderError || "Gagal buat folder GDrive."); }
            const newFolderId = createdFolder.id;
            if (descriptionToAdd || labelsToAdd || colorToAdd !== DEFAULT_FOLDER_COLOR_VALUE) {
                const metadataToSave = { id: newFolderId, workspace_id: workspaceId, user_id: userId, description: descriptionToAdd, labels: labelsToAdd, color: colorToAdd };
                console.log('INSERT Supabase:', metadataToSave);
                const { error: insertMetaError } = await supabase.from('folder').insert(metadataToSave);
                if (insertMetaError) { console.error("Supabase Insert Error:", insertMetaError); setFolderError(`Folder dibuat, gagal simpan metadata: ${insertMetaError.message}`); }
                else { console.log("Metadata saved to Supabase."); }
            }
            setIsAddFolderDialogOpen(false); setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_FOLDER_COLOR_VALUE);
            fetchFolderContent(parentFolderId, workspaceId, userId); // Refresh
        } catch (err: any) { if (!folderError) { setFolderError(err.message); } console.error("Error add folder:", err); }
        finally { setIsProcessingFolderAction(false); }
    };

    const handleEditMetadataAction = async () => {
        if (!user?.id || !selectedWorkspaceForBrowse || !folderBeingManaged) { setFolderError("Data tidak lengkap."); return; }
        const { id: folderId } = folderBeingManaged; const { id: workspaceId, user_id: userId } = selectedWorkspaceForBrowse;
        const descriptionToSave = editDescription.trim() || null;
        const labelsToSave = editLabels.filter(l => l.trim()).length > 0 ? editLabels.filter(l => l.trim()) : null;
        const colorToSave = editFolderColor;
        const metadataToSave = { id: folderId, workspace_id: workspaceId, user_id: userId, description: descriptionToSave, labels: labelsToSave, color: colorToSave };
        setIsProcessingFolderAction(true); setFolderError(null);
        console.log('UPSERT Supabase:', metadataToSave);
        const { error: upsertError } = await supabase.from('folder').upsert(metadataToSave, { onConflict: 'id, workspace_id' });
        console.log('Supabase UPSERT result:', { upsertError });
        if (upsertError) { console.error("Supabase Upsert Error:", upsertError); setFolderError(`Gagal simpan metadata: ${upsertError.message}`); }
        else { console.log("Metadata saved."); setIsEditMetadataDialogOpen(false); setFolderBeingManaged(null); fetchFolderContent(currentFolderId!, selectedWorkspaceForBrowse.id, user.id); }
        setIsProcessingFolderAction(false);
    };


    const handleRenameFolderAction = async () => {
        if (!user?.id || !accessToken || !folderBeingManaged || !editFolderName.trim()) { setFolderError("Nama folder kosong."); return; }
        const folderId = folderBeingManaged.id; const newName = editFolderName.trim();
        if (newName === folderBeingManaged.name) { setIsRenameDialogOpen(false); return; }
        setIsProcessingFolderAction(true); setFolderError(null);
        const updatedFolder = await makeApiCall<GoogleDriveFile>(`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`, 'PATCH', { name: newName });
        if (updatedFolder) {
            setIsRenameDialogOpen(false); setFolderBeingManaged(null);
            fetchFolderContent(currentFolderId!, selectedWorkspaceForBrowse!.id, user.id); // Refresh
        }
        setIsProcessingFolderAction(false);
    };


    const handleDeleteFolderAction = async () => {
        if (!user?.id || !accessToken || !folderBeingManaged || !selectedWorkspaceForBrowse) { setFolderError("Data tidak lengkap."); return; }
        const { id: folderId, name: folderName } = folderBeingManaged;
        const { id: workspaceId } = selectedWorkspaceForBrowse; // user_id tidak selalu perlu untuk match delete

        if (!window.confirm(`ANDA YAKIN hapus folder "${folderName}" & SEMUA ISINYA permanen dari GDrive?\n\nTIDAK DAPAT DIBATALKAN.`)) { setIsDeleteDialogOpen(false); return; }
        setIsProcessingFolderAction(true); setFolderError(null);
        console.log(`Deleting folder ${folderId}`);

        // 1. Hapus GDrive
        const deleteResult = await makeApiCall<null>(`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`, 'DELETE');
        let gdriveDeleteSuccess = false;
        if (deleteResult === null && !folderError) { gdriveDeleteSuccess = true; console.log("GDrive folder deleted."); }
        else { console.error("Failed GDrive delete."); }
        if (!gdriveDeleteSuccess) { setIsProcessingFolderAction(false); setIsDeleteDialogOpen(false); return; } // Hentikan jika GDrive gagal

        // 2. Hapus Supabase Metadata
        console.log(`Deleting metadata for folder ${folderId}`);
        const { error: metaDeleteError } = await supabase.from('folder')
            .delete().match({ id: folderId, workspace_id: workspaceId }); // Match PK
        if (metaDeleteError) {
            console.error("Supabase metadata delete Error:", metaDeleteError);
            setFolderError(`Folder dihapus, tapi gagal hapus metadata: ${metaDeleteError.message}`); // Warning
        } else console.log("Supabase metadata deleted.");

        // 3. Refresh & Close Dialog
        setIsDeleteDialogOpen(false); setFolderBeingManaged(null);
        fetchFolderContent(currentFolderId!, selectedWorkspaceForBrowse.id, user.id); // Refresh list
        setIsProcessingFolderAction(false);
    };

    // --- Render ---
    if (!user?.id) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Memuat user...</div>;
    if (!account) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Menghubungkan Google...</div>;

    return (
        <FolderSelectorUI
            // Pass semua state dan handler
            error={workspaceError} accessToken={accessToken}
            newWorkspaceLink={newWorkspaceLink} setNewWorkspaceLink={setNewWorkspaceLink}
            workspaces={workspaces} isLoading={isLoadingWorkspaces} isAdding={isAddingWorkspace}
            handleAddWorkspace={handleAddWorkspace} handleRemoveWorkspace={handleRemoveWorkspace}
            handleSelectWorkspaceForBrowse={handleSelectWorkspaceForBrowse}
            newWorkspaceName={newWorkspaceName} setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor} setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={defaultColors} selectedWorkspaceForBrowse={selectedWorkspaceForBrowse}
            itemsInCurrentFolder={itemsInCurrentFolder} isLoadingFolderContent={isLoadingFolderContent}
            folderError={folderError} folderPath={folderPath} onNavigate={navigateToFolder}
            onNavigateBreadcrumb={navigateViaBreadcrumb} isProcessingFolderAction={isProcessingFolderAction}
            onTriggerAddFolder={triggerAddFolder} onTriggerRenameFolder={triggerRenameFolder}
            onTriggerEditMetadata={triggerEditMetadata} onTriggerDeleteFolder={triggerDeleteFolder}
            // Add Dialog
            isAddFolderDialogOpen={isAddFolderDialogOpen} setIsAddFolderDialogOpen={setIsAddFolderDialogOpen}
            newFolderName={newFolderName} setNewFolderName={setNewFolderName}
            addDescription={addDescription} setAddDescription={setAddDescription}
            addLabels={addLabels} setAddLabels={setAddLabels}
            addFolderColor={addFolderColor} setAddFolderColor={setAddFolderColor}
            handleAddFolderAction={handleAddFolderAction}
            // Rename Dialog
            isRenameDialogOpen={isRenameDialogOpen} setIsRenameDialogOpen={setIsRenameDialogOpen}
            folderBeingManaged={folderBeingManaged} editFolderName={editFolderName} setEditFolderName={setEditFolderName}
            handleRenameFolderAction={handleRenameFolderAction}
            // Edit Dialog
            isEditMetadataDialogOpen={isEditMetadataDialogOpen} setIsEditMetadataDialogOpen={setIsEditMetadataDialogOpen}
            // folderBeingManaged sudah ada
            editDescription={editDescription} setEditDescription={setEditDescription}
            editLabels={editLabels} setEditLabels={setEditLabels}
            editFolderColor={editFolderColor} setEditFolderColor={setEditFolderColor}
            handleEditMetadataAction={handleEditMetadataAction}
            // Delete Dialog
            isDeleteDialogOpen={isDeleteDialogOpen} setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            // folderBeingManaged sudah ada
            handleDeleteFolderAction={handleDeleteFolderAction}
        />
    );
};

export default FolderSelector;
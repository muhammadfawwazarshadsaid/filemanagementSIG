// src/components/WorkspaceSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useUser } from "@stackframe/stack";
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import WorkspaceSelectorUI from './workspace-selector-ui'; // Import komponen UI

// --- Definisi Tipe Data ---
// Tipe data dari Google Drive API
interface GoogleDriveFile {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
}

interface GoogleDriveFilesListResponse {
    kind: string;
    incompleteSearch: boolean;
    files: GoogleDriveFile[];
}

// Tipe data Metadata dari Supabase (sesuaikan jika perlu)
interface SupabaseItemMetadata {
    id: string;
    workspace_id: string;
    user_id: string;
    description?: string | null;
    color?: string | null;
    labels?: string[] | null;
}

// Tipe data item yang dikelola (gabungan GDrive + Supabase)
export interface ManagedItem extends GoogleDriveFile {
    metadata?: SupabaseItemMetadata | null;
}

// Tipe data Workspace dari Supabase
interface WorkspaceSupabaseData {
    id: string;          // ID Folder GDrive
    user_id: string;
    url: string;
    name: string;        // Nama workspace (bisa dari user atau GDrive)
    color?: string | null; // Warna profil (string, misal, class Tailwind)
}
export interface Workspace extends WorkspaceSupabaseData {} // Ekspor jika UI butuh

// Tipe detail file/folder GDrive (untuk verifikasi)
interface GoogleDriveFileDetail {
    kind: string;
    id: string;
    name: string;
    mimeType: string;
}

// --- Konstanta ---
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

// Palet warna default untuk workspace baru
const color = {
    "color1": 'bg-blue-500',
    "color2": 'bg-green-500',
    "color3": 'bg-red-500',
    "color4": 'bg-gray-500',
    "color5": 'bg-purple-500',
    "color6": 'bg-orange-500',
};

// Props komponen (MODIFIED: Added onWorkspaceUpdate)
interface WorkspaceSelectorProps {
    // Callback untuk memberitahu parent apakah workspace ada/tidak
    onWorkspaceUpdate: (workspaceExists: boolean) => void;
    // onWorkspaceSelected?: (workspaceId: string) => void; // Optional: Keep if used elsewhere
}

// --- Komponen Utama ---
const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ onWorkspaceUpdate }) => { // <-- MODIFIED: Receive prop
    // --- Hooks & Autentikasi ---
    const user = useUser({ or: 'redirect' });
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: ['https://www.googleapis.com/auth/drive']
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State Daftar Workspace ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    const [isAddingWorkspace, setIsAddingWorkspace] = useState<boolean>(false);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
    const [newWorkspaceColor, setNewWorkspaceColor] = useState<string>(color.color1);

    // --- State Browser Folder Terintegrasi ---
    const [selectedWorkspaceForBrowse, setSelectedWorkspaceForBrowse] = useState<Workspace | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
    const [itemsInCurrentFolder, setItemsInCurrentFolder] = useState<ManagedItem[]>([]);
    const [isBrowseWorkspace, setIsBrowseWorkspace] = useState<boolean>(false);
    const [isLoadingFolderContent, setIsLoadingFolderContent] = useState<boolean>(false);
    const [folderError, setFolderError] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
    const [newSubFolderName, setNewSubFolderName] = useState<string>('');

    // --- Helper Panggil API Google ---
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
        if (!accessToken) {
            const setError = isBrowseWorkspace ? setFolderError : setWorkspaceError;
            setError("Akses token Google tidak tersedia..."); // Shortened message
            console.error("makeApiCall Error: Access Token is missing.");
            return null;
        }
        const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
        if (!(body instanceof FormData) && method !== 'GET' && method !== 'DELETE') {
            defaultHeaders['Content-Type'] = 'application/json';
        }
        const options: RequestInit = { method, headers: defaultHeaders };
        if (body) {
            options.body = (body instanceof FormData) ? body : JSON.stringify(body);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                let errorData: any = null;
                try { errorData = await response.json(); }
                catch (e) { try { errorData = await response.text(); }
                catch (e2) { errorData = response.statusText; } }
                console.error("Google API Call Error:", response.status, errorData);
                const message = errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : `HTTP error ${response.status}`);
                throw new Error(`API Error (${response.status}): ${message}`);
            }
            if (response.status === 204) { return null; }
            return response.json() as Promise<T>;
        } catch (err: any) {
            console.error(`Gagal ${method} ${url}:`, err);
            throw err;
        }
    }, [accessToken, isBrowseWorkspace]); // Dependencies remain the same

    // --- Memuat Daftar Workspace dari Supabase ---
    const loadWorkspaces = useCallback(async () => {
        if (!user?.id || !accessToken) { // Added accessToken check here too for early exit
             if (workspaces.length === 0) setIsLoadingWorkspaces(true);
             // Optionally set an error or message indicating waiting for connection
             // setWorkspaceError("Menunggu koneksi pengguna atau Google...");
             return;
        }

        console.log("Memuat workspaces dari Supabase untuk user:", user.id);
        setIsLoadingWorkspaces(true);
        setWorkspaceError(null);
        let workspacesExist = false; // Flag to track existence

        try {
            const { data: supabaseWorkspaces, error: supabaseError } = await supabase
                .from('workspace')
                .select('id, user_id, url, name, color')
                .eq('user_id', user.id);

            if (supabaseError) {
                throw new Error(`Supabase Error: ${supabaseError.message}`);
            }

            const fetchedWorkspaces = (supabaseWorkspaces as Workspace[]) || [];
            setWorkspaces(fetchedWorkspaces);
            workspacesExist = fetchedWorkspaces.length > 0; // Check if any workspace exists

        } catch (err: any) {
            console.error("Gagal memuat workspaces:", err);
            setWorkspaceError(`Gagal memuat workspace: ${err.message}`);
            setWorkspaces([]); // Ensure state is empty on error
            workspacesExist = false; // No workspaces if error
        } finally {
            setIsLoadingWorkspaces(false);
            console.log("WorkspaceSelector - loadWorkspaces - Notifying parent:", workspacesExist); // Debug
            onWorkspaceUpdate(workspacesExist); // <-- MODIFIED: CALL THE CALLBACK HERE
        }
    // }, [user?.id, accessToken]); // Original dependencies
    }, [user?.id, accessToken, supabase, onWorkspaceUpdate]); // <-- MODIFIED: ADDED supabase & onWorkspaceUpdate

    // Effect untuk memuat workspace saat user atau token siap
    useEffect(() => {
        if (user?.id && accessToken) {
            loadWorkspaces();
        }
    }, [user?.id, accessToken, loadWorkspaces]);


    // --- Fungsi CRUD Workspace ---
    const extractFolderIdFromLink = (link: string): string | null => {
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setWorkspaceError(null);
        if (!user?.id || !accessToken) {
            setWorkspaceError("User tidak terautentikasi atau koneksi Google belum siap.");
            return;
        }
        const folderId = extractFolderIdFromLink(newWorkspaceLink);
        if (!folderId) {
            setWorkspaceError("Format link Google Drive Folder tidak valid.");
            return;
        }
        if (workspaces.some(ws => ws.id === folderId)) {
            setWorkspaceError(`Workspace dengan folder ID ${folderId} sudah ada.`);
            return;
        }

        setIsAddingWorkspace(true);
        try {
            const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            const folderDetails = await makeApiCall<GoogleDriveFileDetail>(verifyUrl);

            if (!folderDetails) {
                throw new Error(`Gagal memverifikasi folder ID ${folderId}.`);
            }
            if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') {
                throw new Error(`Item bukan folder (tipe: ${folderDetails.mimeType}).`);
            }

            const workspaceName = newWorkspaceName.trim() !== '' ? newWorkspaceName.trim() : folderDetails.name;
            const newWorkspaceData: Omit<WorkspaceSupabaseData, 'user_id'> & { user_id: string } = {
                id: folderDetails.id,
                user_id: user.id,
                url: newWorkspaceLink,
                name: workspaceName,
                color: newWorkspaceColor,
            };

            const { error: insertError } = await supabase
                .from('workspace')
                .insert([newWorkspaceData]);

            if (insertError) {
                if (insertError.code === '23505') {
                    setWorkspaceError(`Workspace dengan folder ID ${folderId} sudah ada di database.`);
                } else {
                    throw new Error(`Supabase Insert Error: ${insertError.message}`);
                }
            } else {
                // Success:
                setWorkspaces(prev => [...prev, newWorkspaceData as Workspace]);
                setNewWorkspaceLink('');
                setNewWorkspaceName('');
                setNewWorkspaceColor(color.color1);
                console.log("WorkspaceSelector - handleAddWorkspace - Notifying parent:", true); // Debug
                onWorkspaceUpdate(true); // <-- MODIFIED: CALL CALLBACK (true because one was just added)
            }
        } catch (err: any) {
            console.error("Error saat menambah workspace:", err);
            setWorkspaceError(`Gagal menambahkan workspace: ${err.message}`);
             // No callback call on failure
        } finally {
            setIsAddingWorkspace(false);
        }
    };

    const handleRemoveWorkspace = async (idToRemove: string) => {
        if (!user?.id) {
            setWorkspaceError("User tidak terautentikasi.");
            return;
        }
        const workspaceToRemove = workspaces.find(ws => ws.id === idToRemove);
        if (!window.confirm(`Anda yakin ingin menghapus workspace "${workspaceToRemove?.name || idToRemove}" dari daftar ini?\n\n(Folder asli di Google Drive TIDAK akan terhapus)`)) {
            return;
        }
        if (isBrowseWorkspace && selectedWorkspaceForBrowse?.id === idToRemove) {
            handleExitBrowse();
        }

        setIsLoadingWorkspaces(true); // Use workspace loading state for simplicity
        setWorkspaceError(null);
        let deleteError: any = null; // Store potential delete error
        let remainingWorkspacesExist = false; // Flag

        try {
            const { error } = await supabase
                .from('workspace')
                .delete()
                .match({ id: idToRemove, user_id: user.id });

            deleteError = error; // Store error (or null if success)
            if (deleteError) {
                throw new Error(`Supabase Delete Error: ${deleteError.message}`);
            }

            // Success: Update local state
            const updatedWorkspaces = workspaces.filter(ws => ws.id !== idToRemove);
            setWorkspaces(updatedWorkspaces);
            remainingWorkspacesExist = updatedWorkspaces.length > 0; // Check if any remain
            console.log(`Workspace ${idToRemove} berhasil dihapus dari daftar.`);

        } catch (err: any) {
            console.error("Error saat menghapus workspace:", err);
            setWorkspaceError(`Gagal menghapus workspace: ${err.message}`);
            // No callback call on failure
        } finally {
            setIsLoadingWorkspaces(false);
            // Call callback ONLY IF delete was successful
            if (!deleteError) {
                 console.log("WorkspaceSelector - handleRemoveWorkspace - Notifying parent:", remainingWorkspacesExist); // Debug
                 onWorkspaceUpdate(remainingWorkspacesExist); // <-- MODIFIED: CALL CALLBACK
            }
        }
    };

    // --- Logika Browser Folder Terintegrasi --- (No changes needed here for the callback logic)
    const fetchFolderContent = useCallback(async (folderIdToFetch: string, targetWorkspaceId: string, targetUserId: string) => {
        if (!accessToken || !targetUserId) { /* ... */ return; }
        setIsLoadingFolderContent(true);
        setFolderError(null);
        console.log(`Workspaceing GDrive items for folder: ${folderIdToFetch}, Workspace: ${targetWorkspaceId}`);
        let googleDriveItems: GoogleDriveFile[] = [];
        try {
            const fieldsToFetch = "files(id, name, mimeType, parents)";
            const query = `'${folderIdToFetch}' in parents and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsToFetch)}&orderBy=folder,name`;
            const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);
            googleDriveItems = gDriveData?.files || [];

            // Optional: Fetch Supabase metadata (simplified example)
            let combinedItems: ManagedItem[] = googleDriveItems.map(gItem => ({ ...gItem, metadata: null }));
            if (googleDriveItems.length > 0) {
                const itemIds = googleDriveItems.map(item => item.id);
                try {
                    // Combine metadata fetching if possible, or handle separately
                    const { data: metaData, error: metaError } = await supabase
                         .from('folder') // Assuming 'folder' table holds metadata for both files/folders, or adjust as needed
                         .select('id, description, color, labels') // Adjust columns
                         .in('id', itemIds)
                         .eq('workspace_id', targetWorkspaceId)
                         .eq('user_id', targetUserId);

                    if (metaError) console.warn("Supabase metadata error:", metaError.message);

                    if (metaData) {
                        const metadataMap = new Map<string, Partial<SupabaseItemMetadata>>();
                        metaData.forEach(meta => metadataMap.set(meta.id, meta));
                        combinedItems = googleDriveItems.map(gItem => ({
                            ...gItem,
                            metadata: (metadataMap.get(gItem.id) as SupabaseItemMetadata | null) || null
                        }));
                    }
                } catch (metaErr: any) {
                     console.error("Gagal mengambil metadata Supabase:", metaErr);
                     setFolderError(prev => prev ? `${prev}\nWarning: Gagal memuat detail.` : `Warning: Gagal memuat detail.`);
                }
            }
            setItemsInCurrentFolder(combinedItems);
        } catch (err: any) {
            console.error("Error fetching Google Drive folder content:", err);
            setFolderError(`Gagal memuat isi folder: ${err.message}`);
            setItemsInCurrentFolder([]);
        } finally {
            setIsLoadingFolderContent(false);
        }
    }, [accessToken, makeApiCall, supabase]);

    const handleSelectWorkspaceForBrowse = (workspace: Workspace) => {
        if (!user?.id) return;
        console.log("Masuk mode Browse untuk workspace:", workspace.name, `(ID: ${workspace.id})`);
        setSelectedWorkspaceForBrowse(workspace);
        setCurrentFolderId(workspace.id);
        setCurrentFolderName(workspace.name);
        setFolderPath([{ id: workspace.id, name: workspace.name }]);
        setIsBrowseWorkspace(true);
        setItemsInCurrentFolder([]);
        setFolderError(null);
        setNewSubFolderName('');
        fetchFolderContent(workspace.id, workspace.id, user.id);
    };

    const viewFolderContents = (folderId: string, folderName: string) => {
        if (!user?.id || !selectedWorkspaceForBrowse) return;
        console.log(`Navigasi ke folder: ${folderName} (ID: ${folderId})`);
        setCurrentFolderId(folderId);
        setCurrentFolderName(folderName);
        setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
        setItemsInCurrentFolder([]);
        setFolderError(null);
        setNewSubFolderName('');
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

    const navigateToFolder = (folderIdToGo: string, folderIndexInPath: number) => {
        if (!user?.id || !selectedWorkspaceForBrowse) return;
        if (folderIndexInPath === folderPath.length - 1) return;
        console.log(`Navigasi via breadcrumb ke index ${folderIndexInPath}: ${folderPath[folderIndexInPath].name} (ID: ${folderIdToGo})`);
        const newPath = folderPath.slice(0, folderIndexInPath + 1);
        const targetFolder = newPath[newPath.length - 1];
        setFolderPath(newPath);
        setCurrentFolderId(targetFolder.id);
        setCurrentFolderName(targetFolder.name);
        setItemsInCurrentFolder([]);
        setFolderError(null);
        setNewSubFolderName('');
        fetchFolderContent(targetFolder.id, selectedWorkspaceForBrowse.id, user.id);
    };

    const handleCreateSubFolder = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newSubFolderName.trim() || !accessToken || !user?.id || !currentFolderId || !selectedWorkspaceForBrowse) {
            setFolderError("Nama folder tidak boleh kosong atau sesi tidak valid.");
            return;
        }
        setIsLoadingFolderContent(true);
        setFolderError(null);
        try {
           const body = {
               name: newSubFolderName.trim(),
               mimeType: 'application/vnd.google-apps.folder',
               parents: [currentFolderId]
           };
           const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', body);
           if (createdFolder) {
               setNewSubFolderName('');
               fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, user.id); // Refresh
           } else {
               throw new Error("Pembuatan folder berhasil tetapi tidak ada data folder yang diterima.");
           }
        } catch (err: any) {
            setFolderError(`Gagal membuat folder: ${err.message}`);
            setIsLoadingFolderContent(false);
        }
    };

    const handleExitBrowse = () => {
        console.log("Keluar dari mode Browse.");
        setIsBrowseWorkspace(false);
        setSelectedWorkspaceForBrowse(null);
        setCurrentFolderId(null);
        setCurrentFolderName(null);
        setFolderPath([]);
        setItemsInCurrentFolder([]);
        setFolderError(null);
        setNewSubFolderName('');
    };

    // --- Render ---
    if (!user?.id) return <div className="p-4 text-center text-gray-500">Memuat data pengguna...</div>;
    if (!account) return <div className="p-4 text-center text-gray-500">Menghubungkan ke akun Google... (Pastikan popup tidak diblokir)</div>;
    // Optional: Add loading indicator while accessToken is null after account is ready
    // if (!accessToken) return <div className="p-4 text-center text-gray-500">Menunggu token akses Google...</div>;

    // Render the UI component, passing down all necessary state and handlers
    return (
        <WorkspaceSelectorUI
            // Props for Workspace List & Add Form
            error={workspaceError} // Combined error state for list/add
            newWorkspaceLink={newWorkspaceLink}
            setNewWorkspaceLink={setNewWorkspaceLink}
            workspaces={workspaces}
            isLoading={isLoadingWorkspaces} // Loading for the list
            isAdding={isAddingWorkspace} // Specific loading for add action
            accessToken={accessToken} // Pass token if UI needs it (e.g., disable add button)
            handleAddWorkspace={handleAddWorkspace}
            handleRemoveWorkspace={handleRemoveWorkspace}
            // handleSelectWorkspaceForBrowse={handleSelectWorkspaceForBrowse} // Pass the handler to trigger browse mode
            newWorkspaceName={newWorkspaceName}
            setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor}
            setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={color}

            // Props for Integrated Folder Browser
            // isBrowseWorkspace={isBrowseWorkspace}
            // selectedWorkspaceForBrowse={selectedWorkspaceForBrowse}
            // itemsInCurrentFolder={itemsInCurrentFolder}
            // isLoadingFolderContent={isLoadingFolderContent}
            // folderError={folderError}
            // folderPath={folderPath}
            // currentFolderName={currentFolderName}
            // handleCreateSubFolder={handleCreateSubFolder}
            // viewFolderContents={viewFolderContents}
            // navigateToFolder={navigateToFolder}
            // handleExitBrowse={handleExitBrowse}
            // newSubFolderName={newSubFolderName}
            // setNewSubFolderName={setNewSubFolderName}

             // Pass a dummy or no-op function for the old handleSelectWorkspace if the UI component still expects it
             // Or better, remove the expectation from WorkspaceSelectorUI if it's not used.
            handleSelectWorkspace={() => { /* console.warn("handleSelectWorkspace is deprecated for main selection") */ }}
        />
    );
};

export default WorkspaceSelector;
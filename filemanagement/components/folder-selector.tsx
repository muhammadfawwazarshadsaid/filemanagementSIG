// File: src/components/FolderSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useUser } from "@stackframe/stack"; // Pastikan library ini terinstal dan dikonfigurasi
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import { Loader2 } from 'lucide-react';
import FolderSelectorUI from './folder-selector-ui'; // Impor komponen UI
import router from 'next/router';
import { toast } from 'sonner';

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

// Definisikan defaultColors di luar komponen agar bisa diakses oleh DEFAULT_FOLDER_COLOR_VALUE
const defaultColors: { [key: string]: string } = {
    "blue": 'bg-blue-500', "green": 'bg-green-500', "red": 'bg-red-500',
    "yellow": 'bg-yellow-500', "purple": 'bg-purple-500', "pink": 'bg-pink-500',
    "indigo": 'bg-indigo-500', "gray": 'bg-gray-500',
};

interface FolderSelectorProps {
    onFolderExistenceChange?: (hasFolders: boolean) => void;
}

// --- Komponen Utama ---
const FolderSelector: React.FC<FolderSelectorProps> = ({ onFolderExistenceChange }) => {
    const user = useUser();
    const account = user ? user.useConnectedAccount('google', {
        scopes: ['https://www.googleapis.com/auth/drive'] // Scope penuh
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

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
    const app =useUser()
    // --- Helper Panggil API Google ---
const makeApiCall = useCallback(async <T = any>(
    url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
): Promise<T | null> => {
    if (!accessToken) {
        const errorMsg = "Akses token Google tidak tersedia.";
        if (selectedWorkspaceForBrowse) setFolderError(errorMsg); else setWorkspaceError(errorMsg);
        console.error("makeApiCall Error (FolderSelector): Access Token missing.");
        setIsLoadingFolderContent(false);
        setIsProcessingFolderAction(false);
        // Pertimbangkan redirect langsung jika tidak ada token
        // router.push('/masuk?error=no_token_fs_v2');
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
            const message = errorData?.error?.message || errorData?.message || errorData?.error_description || response.statusText || `HTTP error ${response.status}`;

            if (response.status === 401) {
                // Token tidak valid atau kedaluwarsa
                const uiErrorMessage = "Sesi Google Anda telah berakhir. Silakan masuk kembali.";
                setWorkspaceError(uiErrorMessage); // Atau error yang lebih spesifik tergantung konteks
                setFolderError(uiErrorMessage);
                toast.error("Sesi Berakhir", { description: "Anda akan diarahkan ke halaman login." });

                try {
                    await app?.signOut(); // Mencoba sign out dari StackFrame
                } catch (signOutError) {
                    console.error("Error saat sign out dari StackFrame (FolderSelector):", signOutError);
                }

                router.push('/masuk'); // Arahkan ke login
                return null; // Hentikan pemrosesan
            }

            // Untuk error HTTP lainnya (bukan 401)
            const generalApiError = `Google API Error (${response.status}): ${message}`;
            // Logika set error lokal seperti yang sudah ada di implementasi Anda
            if (url.includes(GOOGLE_DRIVE_API_FILES_ENDPOINT) && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
                setFolderError(generalApiError);
            } else if (url.includes(GOOGLE_DRIVE_API_FILES_ENDPOINT) && method === 'GET') {
                if (selectedWorkspaceForBrowse) setFolderError(generalApiError); else setWorkspaceError(generalApiError);
            } else {
                setWorkspaceError(generalApiError);
            }
            throw new Error(generalApiError); // Lempar error agar ditangkap oleh blok catch
        }

        if (response.status === 204) { return null; } // No Content
        return response.json() as Promise<T>;

    } catch (err: any) {
        // Menangkap error dari 'throw new Error' di atas atau error jaringan
        console.error(`FolderSelector makeApiCall Gagal (${method} ${url}):`, err.message);
        const errorMsgToShow = err.message || `Gagal menghubungi Google Drive API (${method}).`;

        // Set error lokal (mirip dengan logika asli di catch block Anda)
        if (url.includes(GOOGLE_DRIVE_API_FILES_ENDPOINT) && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
            setFolderError(errorMsgToShow);
        } else if (url.includes(GOOGLE_DRIVE_API_FILES_ENDPOINT) && method === 'GET') {
            if (selectedWorkspaceForBrowse) setFolderError(errorMsgToShow); else setWorkspaceError(errorMsgToShow);
        } else {
            setWorkspaceError(errorMsgToShow);
        }
        // Pastikan loading state di-reset jika ada error
        setIsLoadingFolderContent(false);
        setIsProcessingFolderAction(false);
        return null;
    }
}, [
    accessToken,
    selectedWorkspaceForBrowse,
    router,
    app,
    setFolderError,
    setWorkspaceError,
    setIsLoadingFolderContent,
    setIsProcessingFolderAction
]); // <-- PERBARUI DEPENDENSI DENGAN LENGKAP

   // --- Fetch Konten Folder ---
    const fetchFolderContent = useCallback(async (folderIdToFetch: string, targetWorkspaceId: string, targetUserId: string) => {
        if (!accessToken || !targetUserId || !targetWorkspaceId) {
            setFolderError("Data untuk mengambil konten folder tidak lengkap.");
            setItemsInCurrentFolder([]);
            if (onFolderExistenceChange) onFolderExistenceChange(false);
            return;
        }
        setIsLoadingFolderContent(true);
        setFolderError(null); // Reset folder error before fetching
        let googleDriveItems: GoogleDriveFile[] = [];
        let combinedItems: ManagedItem[] = [];
        let foldersExistInResult = false;

        try {
            const fieldsToFetch = "files(id, name, mimeType, parents, webViewLink)";
            const query = `'${folderIdToFetch}' in parents and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsToFetch)}&orderBy=folder,name`;

            const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);
            // If makeApiCall returned null due to an error, it would have set folderError.
            // We should check folderError state after makeApiCall if it's critical.
            // For now, assume gDriveData might be null if an error occurred and was handled in makeApiCall.
            googleDriveItems = gDriveData?.files || [];

            // If gDriveData is null and folderError was set by makeApiCall, throw to catch block
            if (!gDriveData && folderError) {
                throw new Error(folderError); // Propagate error if makeApiCall set it
            }


            const metadataMap: Record<string, SupabaseItemMetadata> = {};

            if (googleDriveItems.length > 0) {
                const itemIds = googleDriveItems.map(item => item.id);

                // 1. Ambil metadata yang sudah ada dari Supabase 'folder' table
                const { data: existingMetadataList, error: metaFetchError } = await supabase
                    .from('folder') // Tabel Supabase yang menyimpan metadata
                    .select('id, workspace_id, user_id, description, labels, color')
                    .in('id', itemIds)
                    .eq('workspace_id', targetWorkspaceId)
                    .eq('user_id', targetUserId);

                if (metaFetchError) {
                    console.warn("Peringatan saat mengambil metadata dari Supabase:", metaFetchError.message);
                    // setFolderError(`Peringatan: Gagal memuat sebagian metadata (${metaFetchError.message}).`);
                }

                if (existingMetadataList) {
                    existingMetadataList.forEach(meta => {
                        metadataMap[meta.id] = meta as SupabaseItemMetadata;
                    });
                }

                // 2. Identifikasi item dari GDrive yang belum ada di Supabase 'folder' table
                const itemsToInsert: SupabaseItemMetadata[] = [];
                googleDriveItems.forEach(gItem => {
                    if (!metadataMap[gItem.id]) {
                        const newItemMetadata: SupabaseItemMetadata = {
                            id: gItem.id,
                            workspace_id: targetWorkspaceId,
                            user_id: targetUserId,
                            description: null,
                            labels: [],
                            color: null,
                        };
                        itemsToInsert.push(newItemMetadata);
                        metadataMap[gItem.id] = newItemMetadata; // Add to map immediately
                    }
                });

                // 3. Masukkan item baru ke Supabase jika ada
                if (itemsToInsert.length > 0) {
                    console.log(`Menemukan ${itemsToInsert.length} item baru dari GDrive untuk ditambahkan ke tabel 'folder' Supabase.`);
                    const { error: insertError } = await supabase
                        .from('folder')
                        .insert(itemsToInsert);

                    if (insertError) {
                        console.error("Error saat batch insert item baru ke Supabase 'folder':", insertError.message);
                        // Don't overwrite a more specific GDrive API error if it exists
                        if (!folderError) {
                            setFolderError(`Error: Gagal sinkronisasi beberapa item baru ke database: ${insertError.message}`);
                        }
                    } else {
                        console.log(`${itemsToInsert.length} item baru berhasil dimasukkan ke tabel 'folder' Supabase.`);
                    }
                }
            }

            // 4. Gabungkan item GDrive dengan metadata mereka
            combinedItems = googleDriveItems.map(gItem => ({
                ...gItem,
                metadata: metadataMap[gItem.id] || {
                    id: gItem.id,
                    workspace_id: targetWorkspaceId,
                    user_id: targetUserId,
                    description: null,
                    labels: [],
                    color: null,
                }
            }));

            setItemsInCurrentFolder(combinedItems);
            foldersExistInResult = combinedItems.some(item => item.mimeType === 'application/vnd.google-apps.folder');

        } catch (err: any) {
            console.error("Error saat mengambil konten folder (catch block):", err);
            // If folderError is already set (e.g., by makeApiCall), don't overwrite it
            // unless the new error is more generic.
            if (!folderError || (err.message && !err.message.includes("Google API Error"))) {
                 setFolderError(err.message || 'Gagal memuat konten folder.');
            }
            setItemsInCurrentFolder([]);
            foldersExistInResult = false;
        } finally {
            setIsLoadingFolderContent(false);
            if (onFolderExistenceChange) {
                console.log(`[FolderSelector] fetchFolderContent finally - calling onFolderExistenceChange(${foldersExistInResult})`);
                onFolderExistenceChange(foldersExistInResult);
            }
        }
    }, [accessToken, makeApiCall, supabase, user?.id, onFolderExistenceChange, folderError]); // Removed folderError from here if it causes loops, manage it inside.


    // --- Handler Pemilihan Workspace ---
    const handleSelectWorkspaceForBrowse = useCallback((workspace: Workspace) => {
        if (!user?.id) return;
        if (selectedWorkspaceForBrowse?.id === workspace.id && currentFolderId) {
            fetchFolderContent(currentFolderId, workspace.id, user.id);
            return;
        }

        console.log("Memilih workspace:", workspace.name);
        setSelectedWorkspaceForBrowse(workspace);
        const initialFolderId = workspace.id;
        setCurrentFolderId(initialFolderId);
        const initialPath = [{ id: initialFolderId, name: workspace.name }];
        setFolderPath(initialPath);
        setItemsInCurrentFolder([]);
        setFolderError(null); // Reset folder error when changing workspace
        setIsLoadingFolderContent(true);

        setIsAddFolderDialogOpen(false);
        setIsRenameDialogOpen(false);
        setIsEditMetadataDialogOpen(false);
        setIsDeleteDialogOpen(false);
        setFolderBeingManaged(null);

        if (onFolderExistenceChange) {
            onFolderExistenceChange(false);
        }
        fetchFolderContent(initialFolderId, workspace.id, user.id);
    }, [user?.id, fetchFolderContent, selectedWorkspaceForBrowse?.id, currentFolderId, onFolderExistenceChange]);


    // Trigger loadWorkspaces saat user/token siap
    useEffect(() => {
        if (user?.id && accessToken) { loadWorkspaces(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, accessToken]);

    // --- Fungsi CRUD Workspace ---
    const extractFolderIdFromLink = (link: string): string | null => {
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/); return match ? match[1] : null;
    };

    const loadWorkspaces = useCallback(async (targetId: string | null = null) => {
        if (!user?.id || !accessToken) {
            console.warn("loadWorkspaces: User atau Access Token belum siap.");
            setIsLoadingWorkspaces(true);
            return;
        }
        setIsLoadingWorkspaces(true);
        setWorkspaceError(null);
        let foundWorkspaces: Workspace[] = [];
        try {
            const { data: supabaseWorkspaces, error: supabaseError } = await supabase
                .from('workspace')
                .select('id, user_id, url, name, color')
                .eq('user_id', user.id);
            if (supabaseError) {
                throw new Error(`Supabase Error: ${supabaseError.message}`);
            }
            foundWorkspaces = (supabaseWorkspaces as Workspace[]) || [];
            setWorkspaces(foundWorkspaces);
            let workspaceToSelect: Workspace | null = null;
            if (targetId) {
                workspaceToSelect = foundWorkspaces.find(ws => ws.id === targetId) || null;
                if (!workspaceToSelect && foundWorkspaces.length > 0) {
                    workspaceToSelect = foundWorkspaces[0];
                }
            } else {
                const currentSelection = selectedWorkspaceForBrowse;
                const currentSelectionStillExists = currentSelection && foundWorkspaces.some(ws => ws.id === currentSelection.id);
                if (currentSelectionStillExists) {
                    workspaceToSelect = currentSelection;
                } else if (foundWorkspaces.length > 0) {
                    workspaceToSelect = foundWorkspaces[0];
                }
            }
            if (workspaceToSelect) {
                if (selectedWorkspaceForBrowse?.id !== workspaceToSelect.id) {
                    handleSelectWorkspaceForBrowse(workspaceToSelect);
                } else {
                     // If same workspace is already selected, check if we need to update folder existence
                     if (onFolderExistenceChange) {
                        const hasFolders = itemsInCurrentFolder.some(item => item.mimeType === 'application/vnd.google-apps.folder');
                        onFolderExistenceChange(hasFolders);
                     }
                }
            } else { // No workspace to select (either target not found or no workspaces at all)
                setSelectedWorkspaceForBrowse(null);
                setCurrentFolderId(null);
                setItemsInCurrentFolder([]);
                setFolderPath([]);
                if (onFolderExistenceChange) onFolderExistenceChange(false);
            }
        } catch (err: any) {
             console.error("Gagal memuat atau menyeleksi workspaces:", err);
             setWorkspaceError(`Gagal memuat workspace: ${err.message}`);
             setWorkspaces([]);
             setSelectedWorkspaceForBrowse(null);
             setCurrentFolderId(null);
             setItemsInCurrentFolder([]);
             setFolderPath([]);
             if (onFolderExistenceChange) onFolderExistenceChange(false);
        } finally {
            setIsLoadingWorkspaces(false);
        }
    }, [user?.id, accessToken, supabase, handleSelectWorkspaceForBrowse, onFolderExistenceChange, selectedWorkspaceForBrowse, itemsInCurrentFolder]);

    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setWorkspaceError(null);
        if (!user?.id || !accessToken) { setWorkspaceError("User tidak terautentikasi."); return; }
        const folderId = extractFolderIdFromLink(newWorkspaceLink);
        if (!folderId) { setWorkspaceError("Link folder tidak valid."); return; }
        if (workspaces.some(ws => ws.id === folderId)) { setWorkspaceError(`Workspace dengan ID folder ini sudah ada.`); return; }
        setIsAddingWorkspace(true);
        try {
            const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            const folderDetails = await makeApiCall<GoogleDriveFileDetail>(verifyUrl);
            if (!folderDetails) { throw new Error(workspaceError || `Folder Google Drive dengan ID ${folderId} tidak ditemukan atau tidak dapat diakses.`); }
            if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') { throw new Error(`Item yang ditautkan bukanlah sebuah folder Google Drive.`); }
            const workspaceName = newWorkspaceName.trim() || folderDetails.name; // Gunakan nama GDrive jika nama kustom kosong
            const newWorkspaceData = { id: folderDetails.id, user_id: user.id, url: newWorkspaceLink, name: workspaceName, color: newWorkspaceColor };

            const { error: insertError } = await supabase.from('workspace').insert([newWorkspaceData]);
            if (insertError) {
                if (insertError.code === '23505') throw new Error(`Workspace dengan ID ${folderId} sudah terdaftar di database.`); // Lebih spesifik
                throw new Error(`Gagal menyimpan workspace ke database: ${insertError.message}`);
            }

            await loadWorkspaces(folderDetails.id);
            setNewWorkspaceLink(''); setNewWorkspaceName(''); setNewWorkspaceColor(Object.values(defaultColors)[0] || 'bg-gray-500');
        } catch (err: any) {
            console.error("Error tambah workspace:", err);
            // Jangan menimpa error spesifik dari makeApiCall atau Supabase jika sudah ada
            if (!workspaceError && !err.message.includes("Google API Error") && !err.message.includes("Supabase Error")) {
                 setWorkspaceError(`Gagal menambahkan workspace: ${err.message}`);
            } else if (!workspaceError) {
                setWorkspaceError(err.message); // Gunakan error dari catch jika workspaceError belum diset
            }
        } finally { setIsAddingWorkspace(false); }
    };

    const handleRemoveWorkspace = async (idToRemove: string) => {
        if (!user?.id) return;
        const wsToRemove = workspaces.find(ws => ws.id === idToRemove);
        if (!window.confirm(`Yakin hapus workspace "${wsToRemove?.name || idToRemove}" dari daftar?\n(Folder asli di Google Drive TIDAK akan terhapus)`)) return;

        // Optimistic UI: remove from state first, then call API
        const originalWorkspaces = [...workspaces];
        setWorkspaces(prev => prev.filter(ws => ws.id !== idToRemove));
        if (selectedWorkspaceForBrowse?.id === idToRemove) {
            setSelectedWorkspaceForBrowse(null);
            setCurrentFolderId(null);
            setItemsInCurrentFolder([]);
            setFolderPath([]);
            if (onFolderExistenceChange) onFolderExistenceChange(false);
        }

        setWorkspaceError(null);
        // setIsLoadingWorkspaces(true); // Mungkin tidak perlu jika optimistik

        try {
            const { error: deleteError } = await supabase.from('workspace').delete().match({ id: idToRemove, user_id: user.id });
            if (deleteError) {
                setWorkspaces(originalWorkspaces); // Rollback on error
                throw new Error(`Gagal menghapus workspace dari database: ${deleteError.message}`);
            }
            console.log(`Workspace ${idToRemove} berhasil dihapus dari database.`);
            // Jika setelah penghapusan tidak ada workspace yang terpilih, dan masih ada workspace lain,
            // panggil loadWorkspaces untuk memilih yang pertama secara otomatis.
            if (!selectedWorkspaceForBrowse && workspaces.filter(ws => ws.id !== idToRemove).length > 0) {
                await loadWorkspaces();
            } else if (workspaces.filter(ws => ws.id !== idToRemove).length === 0) {
                // Jika tidak ada workspace tersisa
                setSelectedWorkspaceForBrowse(null);
                setCurrentFolderId(null);
                setItemsInCurrentFolder([]);
                setFolderPath([]);
                if (onFolderExistenceChange) onFolderExistenceChange(false);
            }

        } catch (err: any) {
            console.error("Error hapus workspace:", err);
            setWorkspaceError(err.message);
            // setIsLoadingWorkspaces(false); // Set loading false jika error
        }
        // finally { setIsLoadingWorkspaces(false); } // Mungkin tidak perlu jika optimistik
    };

    const navigateToFolder = (folderId: string, folderName: string) => {
        if (!user?.id || !selectedWorkspaceForBrowse) return;
        setCurrentFolderId(folderId); setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
        setItemsInCurrentFolder([]); setFolderError(null); setIsLoadingFolderContent(true);
        if (onFolderExistenceChange) {
             onFolderExistenceChange(false);
         }
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };
    const navigateViaBreadcrumb = (folderId: string, index: number) => {
        if (!user?.id || !selectedWorkspaceForBrowse || index === folderPath.length - 1) return; // Jangan navigasi ke folder saat ini
        setCurrentFolderId(folderId); setFolderPath(prev => prev.slice(0, index + 1));
        setItemsInCurrentFolder([]); setFolderError(null); setIsLoadingFolderContent(true);
        if (onFolderExistenceChange) {
             onFolderExistenceChange(false);
         }
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

    const triggerAddFolder = () => { setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_FOLDER_COLOR_VALUE); setFolderError(null); setIsAddFolderDialogOpen(true); };
    const triggerRenameFolder = (folder: ManagedItem) => { setFolderBeingManaged(folder); setEditFolderName(folder.name); setFolderError(null); setIsRenameDialogOpen(true); };
    const triggerEditMetadata = (item: ManagedItem) => { // Ganti nama parameter ke 'item' agar lebih generik
        setFolderBeingManaged(item);
        setEditDescription(item.metadata?.description || '');
        setEditLabels(item.metadata?.labels || []);
        setEditFolderColor(item.metadata?.color || DEFAULT_FOLDER_COLOR_VALUE);
        setFolderError(null);
        setIsEditMetadataDialogOpen(true);
    };
    const triggerDeleteFolder = (folder: ManagedItem) => { setFolderBeingManaged(folder); setFolderError(null); setIsDeleteDialogOpen(true); };

    const handleAddFolderAction = async () => {
        if (!user?.id || !accessToken || !currentFolderId || !selectedWorkspaceForBrowse || !newFolderName.trim()) {
            setFolderError("Nama folder tidak boleh kosong."); return;
        }
        setIsProcessingFolderAction(true); setFolderError(null);
        const parentFolderId = currentFolderId; const workspaceId = selectedWorkspaceForBrowse.id; const userId = user.id;
        const folderName = newFolderName.trim(); const descriptionToAdd = addDescription.trim() || null;
        const labelsToAdd = addLabels.filter(l => l.trim()); // Tidak perlu cek length, biarkan array kosong jika memang kosong
        const colorToAdd = addFolderColor;
        const gdriveMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] };
        try {
            const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', gdriveMetadata);
            if (!createdFolder) { throw new Error(folderError || "Gagal membuat folder di Google Drive."); }

            const newFolderId = createdFolder.id;
            const metadataToSave: SupabaseItemMetadata = {
                id: newFolderId,
                workspace_id: workspaceId,
                user_id: userId,
                description: descriptionToAdd,
                labels: labelsToAdd,
                color: colorToAdd !== DEFAULT_FOLDER_COLOR_VALUE ? colorToAdd : null
            };
            console.log('INSERT Supabase (Add Folder):', metadataToSave);
            const { error: insertMetaError } = await supabase.from('folder').insert(metadataToSave);
            if (insertMetaError) {
                console.error("Supabase Insert Error (Add Folder):", insertMetaError);
                // Jangan timpa error GDrive jika ada
                if(!folderError) setFolderError(`Folder GDrive dibuat, tapi gagal menyimpan metadata ke database: ${insertMetaError.message}`);
            } else {
                console.log("Metadata untuk folder baru berhasil disimpan ke Supabase.");
            }
            setIsAddFolderDialogOpen(false);
            setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_FOLDER_COLOR_VALUE);
            fetchFolderContent(parentFolderId, workspaceId, userId); // Refresh konten folder
        } catch (err: any) {
            if (!folderError) { setFolderError(err.message); } // Hanya set jika belum ada error dari makeApiCall
            console.error("Error saat menambahkan folder:", err);
        }
        finally { setIsProcessingFolderAction(false); }
    };

    const handleEditMetadataAction = async () => {
        if (!user?.id || !selectedWorkspaceForBrowse || !folderBeingManaged) {
            setFolderError("Data tidak lengkap untuk edit metadata."); return;
        }
        const { id: itemId } = folderBeingManaged; // Ganti nama variabel agar lebih generik (bisa file/folder)
        const { id: workspaceId } = selectedWorkspaceForBrowse;
        const userId = user.id;
        const descriptionToSave = editDescription.trim() || null;
        const labelsToSave = editLabels.filter(l => l.trim());
        const colorToSave = editFolderColor !== DEFAULT_FOLDER_COLOR_VALUE ? editFolderColor : null;

        const metadataToSave: SupabaseItemMetadata = {
            id: itemId,
            workspace_id: workspaceId,
            user_id: userId,
            description: descriptionToSave,
            labels: labelsToSave,
            color: colorToSave
        };

        setIsProcessingFolderAction(true); setFolderError(null);
        console.log('UPSERT Supabase (Edit Metadata):', metadataToSave);

        // Menggunakan upsert untuk membuat entri jika belum ada, atau update jika sudah ada.
        // Ini penting karena file mungkin belum memiliki entri metadata sebelumnya.
        const { error: upsertError } = await supabase.from('folder').upsert(metadataToSave, {
            onConflict: 'id, workspace_id, user_id'
        });

        console.log('Supabase UPSERT result (Edit Metadata):', { upsertError });
        if (upsertError) {
            console.error("Supabase Upsert Error (Edit Metadata):", upsertError);
            setFolderError(`Gagal menyimpan detail: ${upsertError.message}`);
        } else {
            console.log("Detail berhasil disimpan.");
            setIsEditMetadataDialogOpen(false);
            setFolderBeingManaged(null);
            // Pastikan currentFolderId tidak null sebelum fetch
            if (currentFolderId) {
                fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, userId);
            } else {
                console.warn("currentFolderId adalah null, tidak bisa refresh konten setelah edit metadata.");
                // Mungkin perlu load ulang workspace jika currentFolderId tidak ada
                loadWorkspaces(selectedWorkspaceForBrowse.id);
            }
        }
        setIsProcessingFolderAction(false);
    };

    const handleRenameFolderAction = async () => {
        // Fungsi ini spesifik untuk folder, jadi folderBeingManaged harus folder
        if (!user?.id || !accessToken || !folderBeingManaged || folderBeingManaged.mimeType !== 'application/vnd.google-apps.folder' || !editFolderName.trim()) {
            setFolderError("Nama folder baru tidak boleh kosong atau item yang dipilih bukan folder.");
            return;
        }
        const folderId = folderBeingManaged.id; const newName = editFolderName.trim();
        if (newName === folderBeingManaged.name) { setIsRenameDialogOpen(false); return; } // Tidak ada perubahan

        setIsProcessingFolderAction(true); setFolderError(null);
        const updatedFolder = await makeApiCall<GoogleDriveFile>(`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`, 'PATCH', { name: newName });

        if (updatedFolder) {
            setIsRenameDialogOpen(false);
            setFolderBeingManaged(null);
            if (currentFolderId && selectedWorkspaceForBrowse) { // Pastikan ada untuk refresh
                 fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, user.id);
            }
        } else if (!folderError) { // Hanya set error jika makeApiCall tidak set
            setFolderError("Gagal mengganti nama folder di Google Drive.");
        }
        setIsProcessingFolderAction(false);
    };

    const handleDeleteFolderAction = async () => {
        // Fungsi ini spesifik untuk folder
        if (!user?.id || !accessToken || !folderBeingManaged || folderBeingManaged.mimeType !== 'application/vnd.google-apps.folder' || !selectedWorkspaceForBrowse) {
            setFolderError("Data tidak lengkap atau item yang dipilih bukan folder."); return;
        }
        const { id: folderId, name: folderName } = folderBeingManaged;
        const { id: workspaceId } = selectedWorkspaceForBrowse;
        const userId = user.id;

        // Konfirmasi ulang karena ini destruktif
        // if (!window.confirm(`ANDA YAKIN ingin menghapus folder "${folderName}" beserta SEMUA ISINYA secara permanen dari Google Drive?\n\nTindakan ini TIDAK DAPAT DIBATALKAN.`)) {
        //     setIsDeleteDialogOpen(false); return;
        // }
        setIsProcessingFolderAction(true); setFolderError(null);
        console.log(`Menghapus folder GDrive: ${folderId}`);

        const deleteResult = await makeApiCall<null>(`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`, 'DELETE');
        let gdriveDeleteSuccess = false;
        if (deleteResult === null && !folderError) { // Berhasil jika null dan tidak ada error dari makeApiCall
            gdriveDeleteSuccess = true;
            console.log("Folder GDrive berhasil dihapus.");
        } else {
            console.error("Gagal menghapus folder GDrive.");
            if(!folderError) setFolderError("Gagal menghapus folder dari Google Drive."); // Set error jika belum ada
        }
        if (!gdriveDeleteSuccess) {
            setIsProcessingFolderAction(false);
            // Jangan tutup dialog jika GDrive gagal, biarkan user tahu ada masalah
            return;
        }

        console.log(`Menghapus metadata untuk folder ${folderId} dari Supabase.`);
        const { error: metaDeleteError } = await supabase.from('folder')
            .delete().match({ id: folderId, workspace_id: workspaceId, user_id: userId });

        if (metaDeleteError) {
            console.error("Error hapus metadata Supabase:", metaDeleteError);
            // Tetap informasikan user, meskipun GDrive berhasil
            setFolderError(`Folder GDrive dihapus, tapi gagal hapus data terkait dari database: ${metaDeleteError.message}`);
        } else {
            console.log("Metadata Supabase berhasil dihapus.");
        }

        setIsDeleteDialogOpen(false); // Tutup dialog setelah semua proses
        setFolderBeingManaged(null);
        if (currentFolderId && selectedWorkspaceForBrowse) { // Pastikan ada untuk refresh
            fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, userId);
        }
        setIsProcessingFolderAction(false);
    };


    if (!user?.id) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Memuat user...</div>;
    if (!account) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Menghubungkan Google...</div>;
    if (!accessToken && !isLoadingWorkspaces) return <div className="p-10 text-center text-red-500">Gagal mendapatkan akses token Google. Silakan coba hubungkan ulang akun Google Anda atau refresh halaman.</div>;


    return (
        <FolderSelectorUI
            error={workspaceError} accessToken={accessToken} // accessToken mungkin tidak perlu di UI
            newWorkspaceLink={newWorkspaceLink} setNewWorkspaceLink={setNewWorkspaceLink}
            workspaces={workspaces} isLoading={isLoadingWorkspaces} isAdding={isAddingWorkspace}
            handleAddWorkspace={handleAddWorkspace} handleRemoveWorkspace={handleRemoveWorkspace}
            handleSelectWorkspaceForBrowse={handleSelectWorkspaceForBrowse}
            newWorkspaceName={newWorkspaceName} setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor} setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={defaultColors}

            selectedWorkspaceForBrowse={selectedWorkspaceForBrowse}
            itemsInCurrentFolder={itemsInCurrentFolder}
            isLoadingFolderContent={isLoadingFolderContent}
            folderError={folderError}
            folderPath={folderPath}
            onNavigate={navigateToFolder}
            onNavigateBreadcrumb={navigateViaBreadcrumb}

            isProcessingFolderAction={isProcessingFolderAction}
            onTriggerAddFolder={triggerAddFolder}
            onTriggerRenameFolder={triggerRenameFolder}
            onTriggerEditMetadata={triggerEditMetadata}
            onTriggerDeleteFolder={triggerDeleteFolder}

            isAddFolderDialogOpen={isAddFolderDialogOpen}
            setIsAddFolderDialogOpen={setIsAddFolderDialogOpen}
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            addDescription={addDescription}
            setAddDescription={setAddDescription}
            addLabels={addLabels}
            setAddLabels={setAddLabels}
            addFolderColor={addFolderColor}
            setAddFolderColor={setAddFolderColor}
            handleAddFolderAction={handleAddFolderAction}

            isRenameDialogOpen={isRenameDialogOpen}
            setIsRenameDialogOpen={setIsRenameDialogOpen}
            folderBeingManaged={folderBeingManaged}
            editFolderName={editFolderName}
            setEditFolderName={setEditFolderName}
            handleRenameFolderAction={handleRenameFolderAction}

            isEditMetadataDialogOpen={isEditMetadataDialogOpen}
            setIsEditMetadataDialogOpen={setIsEditMetadataDialogOpen}
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            editLabels={editLabels}
            setEditLabels={setEditLabels}
            editFolderColor={editFolderColor}
            setEditFolderColor={setEditFolderColor}
            handleEditMetadataAction={handleEditMetadataAction}

            isDeleteDialogOpen={isDeleteDialogOpen}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            handleDeleteFolderAction={handleDeleteFolderAction}
        />
    );
};

export default FolderSelector;

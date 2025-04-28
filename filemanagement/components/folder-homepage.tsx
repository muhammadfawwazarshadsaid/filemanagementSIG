// src/components/FolderSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useUser } from "@stackframe/stack"; // Pastikan library ini terinstal dan dikonfigurasi
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import { Loader2 } from 'lucide-react';
// Ganti import UI ke UI yang benar jika berbeda
// import FolderSelectorUI from './folder-selector-ui'; // Asumsi nama file UI yang benar
import FolderSelectorUI from './folder-homepage-ui'; // Sesuaikan dengan nama file UI Anda


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

// Pastikan ManagedItem di sini juga punya fileCount
export interface ManagedItem extends GoogleDriveFile {
    metadata?: SupabaseItemMetadata | null;
    fileCount?: number; // <-- Pastikan ini ada
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
// **BARU:** Warna default untuk folder baru
const DEFAULT_FOLDER_COLOR_VALUE = Object.values(defaultColors)[0] || 'bg-gray-500';

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

    // --- State (sama seperti sebelumnya) ---
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
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
        // ... (kode makeApiCall tetap sama)
        if (!accessToken) {
            const errorMsg = "Akses token Google tidak tersedia.";
            if (url.includes(GOOGLE_DRIVE_API_FILES_ENDPOINT)) setFolderError(errorMsg); // Lebih spesifik
            else setWorkspaceError(errorMsg);
            console.error("makeApiCall Error: Access Token missing.");
             // Pastikan loading state dimatikan jika error token
             if (url.includes(GOOGLE_DRIVE_API_FILES_ENDPOINT)) {
                 setIsLoadingFolderContent(false);
                 setIsProcessingFolderAction(false);
             } else {
                 setIsLoadingWorkspaces(false);
                 setIsAddingWorkspace(false);
             }
            return null;
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
                // Jangan throw error di sini agar bisa return null, tapi set error state
                const errorMsg = `Google API Error (${response.status}): ${message}`;
                if (url.includes(GOOGLE_DRIVE_API_FILES_ENDPOINT)) setFolderError(errorMsg);
                else setWorkspaceError(errorMsg);
                return null; // Return null on error
            }
            if (response.status === 204) { return null; } // No Content
            return response.json() as Promise<T>;
        } catch (err: any) {
            console.error(`Gagal ${method} ${url}:`, err);
            const errorMsg = err.message || `Gagal menghubungi Google Drive API (${method}).`;
             if (url.includes(GOOGLE_DRIVE_API_FILES_ENDPOINT)) setFolderError(errorMsg);
             else setWorkspaceError(errorMsg);
            return null; // Return null on fetch error
        }
    }, [accessToken, setFolderError, setWorkspaceError]); // Tambahkan setter error

    // --- Fetch Konten Folder --- MODIFIED ---
    const fetchFolderContent = useCallback(async (folderIdToFetch: string, targetWorkspaceId: string, targetUserId: string) => {
        if (!accessToken || !targetUserId || !targetWorkspaceId) {
            setFolderError("Data fetch tidak lengkap.");
            setItemsInCurrentFolder([]);
            setIsLoadingFolderContent(false); // Pastikan loading berhenti
             if (onFolderExistenceChange) onFolderExistenceChange(false); // Set ke false jika data tidak lengkap
            return;
        }
        setIsLoadingFolderContent(true);
        setFolderError(null);
        let googleDriveItems: GoogleDriveFile[] = [];
        let combinedItems: ManagedItem[] = [];
        let foldersExistInResult = false;

        try {
            // 1. Fetch items (folders and files) directly inside folderIdToFetch
            const fieldsToFetch = "files(id, name, mimeType, parents, webViewLink)";
            const query = `'${folderIdToFetch}' in parents and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsToFetch)}&orderBy=folder,name`;
            const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);

            // Jika gDriveData null karena error API, error sudah di-set oleh makeApiCall, hentikan proses
            if (!gDriveData) {
                 console.error("Gagal mengambil daftar item utama dari Google Drive.");
                 // folderError sudah di-set oleh makeApiCall
                 setItemsInCurrentFolder([]);
                 setIsLoadingFolderContent(false);
                  if (onFolderExistenceChange) onFolderExistenceChange(false); // Pastikan false jika fetch gagal
                 return;
            }

            googleDriveItems = gDriveData.files || [];

            // 2. Fetch metadata from Supabase (sama seperti sebelumnya)
            let metadataMap: Record<string, SupabaseItemMetadata> = {};
            if (googleDriveItems.length > 0) {
                const itemIds = googleDriveItems.map(item => item.id);
                const { data: metadataList, error: metaError } = await supabase
                    .from('folder') // Pastikan nama tabel benar
                    .select('id, description, labels, color') // Sesuaikan kolom
                    .in('id', itemIds)
                    .eq('workspace_id', targetWorkspaceId) // Filter berdasarkan workspace
                    .eq('user_id', targetUserId); // Filter berdasarkan user

                if (metaError) {
                    console.warn("Supabase meta fetch warning:", metaError.message);
                    // Jangan set error utama, cukup log atau tampilkan warning kecil
                    // setFolderError(`Warning: Gagal load sebagian metadata (${metaError.message}).`);
                }
                if (metadataList) {
                    metadataList.forEach(meta => {
                        metadataMap[meta.id] = meta as SupabaseItemMetadata;
                    });
                }
            }

            // 3. Fetch file counts for subfolders (INI BAGIAN BARU)
            const folderItems = googleDriveItems.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
            let fileCountsMap: Record<string, number> = {};

            if (folderItems.length > 0) {
                const countPromises = folderItems.map(async (folder) => {
                    // Query untuk MENGHITUNG file (BUKAN folder) di dalam subfolder ini
                    const countQuery = `'${folder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`;
                    // Hanya perlu tahu jumlahnya, bisa pakai pageSize kecil dan cek total (jika API mendukung) atau fetch ID saja
                    const countUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(countQuery)}&fields=files(id)&pageSize=1000`; // Ambil ID saja, max 1000
                    try {
                        const countResult = await makeApiCall<GoogleDriveFilesListResponse>(countUrl);
                         // Jika countResult null karena error API, kembalikan -1 atau indikator error
                        if (!countResult) {
                            console.warn(`Gagal menghitung file di folder ${folder.name} (${folder.id})`);
                            return { folderId: folder.id, count: -1 }; // Indikator error
                        }
                        return { folderId: folder.id, count: (countResult.files || []).length };
                    } catch (countErr: any) {
                        console.error(`Error counting files in folder ${folder.id}:`, countErr);
                        return { folderId: folder.id, count: -1 }; // Indikator error
                    }
                });

                const counts = await Promise.all(countPromises);
                counts.forEach(result => {
                    if (result.count >= 0) { // Hanya simpan jika tidak error (-1)
                         fileCountsMap[result.folderId] = result.count;
                    }
                });
            }

            // 4. Combine all data
            combinedItems = googleDriveItems.map(gItem => {
                const isFolder = gItem.mimeType === 'application/vnd.google-apps.folder';
                const fileCount = isFolder ? fileCountsMap[gItem.id] : undefined; // Ambil count jika folder

                return {
                    ...gItem,
                    metadata: metadataMap[gItem.id] || null,
                     // Tambahkan fileCount ke item. Undefined jika bukan folder atau gagal hitung
                    fileCount: fileCount !== undefined && fileCount >= 0 ? fileCount : undefined
                };
            });

            setItemsInCurrentFolder(combinedItems);
            foldersExistInResult = combinedItems.some(item => item.mimeType === 'application/vnd.google-apps.folder');

        } catch (err: any) {
            console.error("Error dalam proses fetchFolderContent:", err);
            if (!folderError) { // Hanya set error jika belum ada dari makeApiCall
                 setFolderError(err.message || 'Gagal memuat isi folder.');
            }
            setItemsInCurrentFolder([]); // Kosongkan jika error
            foldersExistInResult = false; // Pastikan false jika error
        } finally {
            setIsLoadingFolderContent(false);
            // Panggil callback setelah semua proses selesai
            if (onFolderExistenceChange) {
                console.log(`[FolderSelector] fetch finally: calling onFolderExistenceChange(${foldersExistInResult})`);
                onFolderExistenceChange(foldersExistInResult);
            }
        }
    }, [accessToken, makeApiCall, supabase, user?.id, folderError, onFolderExistenceChange]); // Dependensi tetap sama

    // --- Handler Pemilihan Workspace (sama seperti sebelumnya) ---
     const handleSelectWorkspaceForBrowse = useCallback((workspace: Workspace) => {
         if (!user?.id) return;
         // ... (kode handleSelectWorkspaceForBrowse tetap sama)
          if (selectedWorkspaceForBrowse?.id === workspace.id) {
               // Jika workspace sama, panggil fetch lagi (misalnya untuk refresh)
               fetchFolderContent(currentFolderId || workspace.id, workspace.id, user.id);
               return;
          }
         console.log("Selecting workspace:", workspace.name);
          setSelectedWorkspaceForBrowse(workspace);
          setCurrentFolderId(workspace.id);
          const initialPath = [{ id: workspace.id, name: workspace.name }];
          setFolderPath(initialPath);
          setItemsInCurrentFolder([]); // Kosongkan dulu
          setFolderError(null);
          setIsLoadingFolderContent(true); // Set loading true di sini

          // Reset dialog states
          setIsAddFolderDialogOpen(false);
          setIsRenameDialogOpen(false);
          setIsEditMetadataDialogOpen(false);
          setIsDeleteDialogOpen(false);
          setFolderBeingManaged(null);

          // Panggil callback false saat mulai load workspace baru
          if (onFolderExistenceChange) {
              onFolderExistenceChange(false);
          }

          fetchFolderContent(workspace.id, workspace.id, user.id);
    }, [user?.id, fetchFolderContent, selectedWorkspaceForBrowse?.id, currentFolderId, onFolderExistenceChange]);

    // --- Memuat Workspace (sama seperti sebelumnya) ---
    const loadWorkspaces = useCallback(async (targetId: string | null = null) => {
        // ... (kode loadWorkspaces tetap sama)
         if (!user?.id || !accessToken) { setIsLoadingWorkspaces(true); return; }
         setIsLoadingWorkspaces(true); setWorkspaceError(null);
         let foundWorkspaces: Workspace[] = [];
         try {
             const { data: supabaseWorkspaces, error: supabaseError } = await supabase.from('workspace').select('*').eq('user_id', user.id);
             if (supabaseError) throw new Error(`Supabase Error: ${supabaseError.message}`);
             foundWorkspaces = (supabaseWorkspaces as Workspace[]) || [];
             setWorkspaces(foundWorkspaces);

             let workspaceToSelect: Workspace | null = null;
             if (targetId) {
                 workspaceToSelect = foundWorkspaces.find(ws => ws.id === targetId) || null;
                 if (!workspaceToSelect && foundWorkspaces.length > 0) {
                     console.warn(`Target workspace ID "${targetId}" not found. Falling back to the first.`);
                     workspaceToSelect = foundWorkspaces[0];
                 }
             } else {
                 const currentSelection = selectedWorkspaceForBrowse;
                 const currentExists = currentSelection && foundWorkspaces.some(ws => ws.id === currentSelection.id);
                 if (currentExists) workspaceToSelect = currentSelection;
                 else if (foundWorkspaces.length > 0) workspaceToSelect = foundWorkspaces[0];
             }

             if (workspaceToSelect) {
                 if (selectedWorkspaceForBrowse?.id !== workspaceToSelect.id) {
                     // handleSelectWorkspaceForBrowse akan memanggil onFolderExistenceChange(false)
                     handleSelectWorkspaceForBrowse(workspaceToSelect);
                 } else {
                     // Jika seleksi sama dan ada workspace, set true (asumsi sudah ada folder/dicek)
                     if (onFolderExistenceChange) onFolderExistenceChange(true);
                     // Mungkin perlu panggil fetchFolderContent lagi jika logic refresh diperlukan
                     // fetchFolderContent(currentFolderId || workspaceToSelect.id, workspaceToSelect.id, user.id);
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
              setWorkspaces([]); setSelectedWorkspaceForBrowse(null);
              if (onFolderExistenceChange) onFolderExistenceChange(false);
         } finally { setIsLoadingWorkspaces(false); }
    }, [
        user?.id, accessToken, supabase, handleSelectWorkspaceForBrowse, onFolderExistenceChange,
        selectedWorkspaceForBrowse, // Tambahkan ini jika logika fallback bergantung padanya
        // Tidak perlu tambahkan setter state di sini karena sudah masuk scope useCallback
    ]);


    // --- useEffect untuk memanggil loadWorkspaces (sama seperti sebelumnya) ---
    useEffect(() => {
        // ... (kode useEffect loadWorkspaces tetap sama)
         const targetIdToLoad = initialTargetWorkspaceId || null;
         if (user?.id && accessToken) {
             loadWorkspaces(targetIdToLoad);
         }
    }, [user?.id, accessToken, initialTargetWorkspaceId, loadWorkspaces]);

    // --- Fungsi CRUD Workspace (sama seperti sebelumnya) ---
    const extractFolderIdFromLink = (link: string): string | null => {
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/); return match ? match[1] : null;
    };
    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        // ... (kode handleAddWorkspace tetap sama)
         e.preventDefault(); setWorkspaceError(null);
         if (!user?.id || !accessToken) { setWorkspaceError("User tidak terautentikasi."); return; }
         const folderId = extractFolderIdFromLink(newWorkspaceLink);
         if (!folderId) { setWorkspaceError("Link folder Google Drive tidak valid."); return; }
         if (workspaces.some(ws => ws.id === folderId)) { setWorkspaceError(`Workspace dengan folder ID tersebut sudah ditambahkan.`); return; }

         setIsAddingWorkspace(true);
         try {
             // Verifikasi folder di Google Drive
             const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
             const folderDetails = await makeApiCall<GoogleDriveFileDetail>(verifyUrl);

             // Jika folderDetails null, error sudah di-set oleh makeApiCall
             if (!folderDetails) {
                 // workspaceError should be set by makeApiCall
                 throw new Error(workspaceError || `Folder Google Drive dengan ID ${folderId} tidak ditemukan atau tidak dapat diakses.`);
             }
             if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') {
                 throw new Error(`Item yang ditautkan bukan folder Google Drive.`);
             }

             // Tentukan nama workspace
             const workspaceName = newWorkspaceName.trim() || folderDetails.name;

             // Simpan ke Supabase
             const newWorkspaceData = {
                 id: folderDetails.id,
                 user_id: user.id,
                 url: newWorkspaceLink, // Simpan link asli yang dimasukkan pengguna
                 name: workspaceName,
                 color: newWorkspaceColor
             };
             const { error: insertError } = await supabase.from('workspace').insert([newWorkspaceData]);

             if (insertError) {
                 if (insertError.code === '23505') { // Kode error untuk unique violation
                     throw new Error(`Workspace dengan folder ID ${folderId} sudah ada di database Anda.`);
                 }
                 throw new Error(`Gagal menyimpan workspace ke database: ${insertError.message}`);
             }

             console.log(`Workspace '${workspaceName}' (ID: ${folderId}) berhasil ditambahkan.`);
             // Reload workspaces, akan otomatis memilih jika ini yang pertama
             await loadWorkspaces(folderId); // Coba langsung select yang baru ditambahkan
             // Reset form
             setNewWorkspaceLink(''); setNewWorkspaceName(''); setNewWorkspaceColor(Object.values(defaultColors)[0] || 'bg-gray-500');

         } catch (err: any) {
             console.error("Error saat menambahkan workspace:", err);
             // Set error state jika belum di-set oleh makeApiCall
             if (!workspaceError) {
                 setWorkspaceError(`Gagal menambahkan workspace: ${err.message}`);
             }
         } finally {
             setIsAddingWorkspace(false);
         }
    };
    const handleRemoveWorkspace = async (idToRemove: string) => {
        // ... (kode handleRemoveWorkspace tetap sama)
        if (!user?.id) return;
         const wsToRemove = workspaces.find(ws => ws.id === idToRemove);
         if (!window.confirm(`Anda yakin ingin menghapus workspace "${wsToRemove?.name || idToRemove}" dari daftar?\n\n(Folder asli di Google Drive TIDAK akan terhapus)`)) return;

         setIsLoadingWorkspaces(true); // Atau state lain yang sesuai
         setWorkspaceError(null);

         try {
             const { error: deleteError } = await supabase
                 .from('workspace')
                 .delete()
                 .match({ id: idToRemove, user_id: user.id }); // Pastikan user ID cocok

             if (deleteError) {
                 throw new Error(`Gagal menghapus workspace dari database: ${deleteError.message}`);
             }

             console.log(`Workspace ${idToRemove} berhasil dihapus dari Supabase.`);
             // Reload daftar workspace
             await loadWorkspaces();

         } catch (err: any) {
             console.error("Error saat menghapus workspace:", err);
             setWorkspaceError(`Gagal menghapus workspace: ${err.message}`);
             // Matikan loading state jika error
             setIsLoadingWorkspaces(false);
         }
         // Loading state akan dimatikan oleh loadWorkspaces jika berhasil
    };

    // --- Navigasi Folder & Breadcrumb (sama seperti sebelumnya) ---
    const navigateToFolder = (folderId: string, folderName: string) => {
        // ... (kode navigateToFolder tetap sama)
         if (!user?.id || !selectedWorkspaceForBrowse) return;
         setCurrentFolderId(folderId);
         setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
         setItemsInCurrentFolder([]); // Kosongkan saat navigasi
         setFolderError(null);
         setIsLoadingFolderContent(true); // Mulai loading

         // Panggil callback false saat mulai load subfolder
          if (onFolderExistenceChange) {
              onFolderExistenceChange(false);
          }

         fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };
    const navigateViaBreadcrumb = (folderId: string, index: number) => {
        // ... (kode navigateViaBreadcrumb tetap sama)
        if (!user?.id || !selectedWorkspaceForBrowse || index === folderPath.length - 1) return;
         setCurrentFolderId(folderId);
         setFolderPath(prev => prev.slice(0, index + 1)); // Potong path
         setItemsInCurrentFolder([]); // Kosongkan saat navigasi
         setFolderError(null);
         setIsLoadingFolderContent(true); // Mulai loading

         // Panggil callback false saat mulai load parent folder
          if (onFolderExistenceChange) {
              onFolderExistenceChange(false);
          }

         fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

    // --- Trigger Dialog CRUD (sama seperti sebelumnya) ---
    const triggerAddFolder = () => { setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_FOLDER_COLOR_VALUE); setFolderError(null); setIsAddFolderDialogOpen(true); };
    const triggerAllFolder = () => { setFolderError(null); setIsAllFolderDialogOpen(true); }; // Pastikan ini ada jika UI memanggilnya
    const triggerRenameFolder = (folder: ManagedItem) => { setFolderBeingManaged(folder); setEditFolderName(folder.name); setFolderError(null); setIsRenameDialogOpen(true); };
    const triggerEditMetadata = (folder: ManagedItem) => { setFolderBeingManaged(folder); setEditDescription(folder.metadata?.description || ''); setEditLabels(folder.metadata?.labels || []); setEditFolderColor(folder.metadata?.color || DEFAULT_FOLDER_COLOR_VALUE); setFolderError(null); setIsEditMetadataDialogOpen(true); };
    const triggerDeleteFolder = (folder: ManagedItem) => { setFolderBeingManaged(folder); setFolderError(null); setIsDeleteDialogOpen(true); };

    // --- Fungsi Aksi CRUD Folder (sama seperti sebelumnya) ---
    const handleAddFolderAction = async () => {
        // ... (kode handleAddFolderAction tetap sama)
         if (!user?.id || !accessToken || !currentFolderId || !selectedWorkspaceForBrowse || !newFolderName.trim()) {
              if (!newFolderName.trim()) setFolderError("Nama folder tidak boleh kosong.");
              else setFolderError("Data tidak lengkap untuk membuat folder.");
              return;
         }
         setIsProcessingFolderAction(true); setFolderError(null);

         const parentFolderId = currentFolderId;
         const workspaceId = selectedWorkspaceForBrowse.id;
         const userId = user.id;
         const folderName = newFolderName.trim();
         const descriptionToAdd = addDescription.trim() || null; // null jika kosong
         const labelsToAdd = addLabels.filter(l => l.trim()); // Ambil yang tidak kosong
         const colorToAdd = addFolderColor; // Ambil warna dari state

         const gdriveMetadata = {
             name: folderName,
             mimeType: 'application/vnd.google-apps.folder',
             parents: [parentFolderId]
         };

         try {
             // 1. Buat folder di Google Drive
             const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', gdriveMetadata);

             // Jika createdFolder null, error sudah di-set oleh makeApiCall
             if (!createdFolder) {
                  // folderError sudah di-set oleh makeApiCall
                 throw new Error(folderError || "Gagal membuat folder di Google Drive.");
             }

             const newFolderId = createdFolder.id;
             console.log(`Folder '${folderName}' (ID: ${newFolderId}) berhasil dibuat di Google Drive.`);

             // 2. Simpan metadata ke Supabase jika ada deskripsi, label, atau warna non-default
             const hasMetadataToSave = descriptionToAdd || labelsToAdd.length > 0 || colorToAdd !== DEFAULT_FOLDER_COLOR_VALUE;

             if (hasMetadataToSave) {
                 const metadataToSave = {
                     id: newFolderId, // Primary Key GDrive ID
                     workspace_id: workspaceId, // Foreign Key / Bagian dari PK
                     user_id: userId, // Foreign Key / Bagian dari PK
                     description: descriptionToAdd,
                     labels: labelsToAdd.length > 0 ? labelsToAdd : null, // Simpan null jika array kosong
                     color: colorToAdd
                 };

                 console.log('Menyimpan metadata ke Supabase:', metadataToSave);
                 const { error: insertMetaError } = await supabase
                     .from('folder') // Pastikan nama tabel benar
                     .insert(metadataToSave);

                 if (insertMetaError) {
                     // Jangan gagalkan seluruh proses, tapi beri warning
                     console.error("Gagal menyimpan metadata ke Supabase:", insertMetaError);
                     // Set error untuk ditampilkan di dialog atau sebagai notifikasi
                     setFolderError(`Folder berhasil dibuat di GDrive, tetapi gagal menyimpan detail metadata: ${insertMetaError.message}. Anda bisa mengedit detail nanti.`);
                 } else {
                     console.log("Metadata berhasil disimpan ke Supabase.");
                 }
             }

             // 3. Tutup dialog dan refresh folder list
             setIsAddFolderDialogOpen(false);
             setNewFolderName(''); // Reset form
             setAddDescription('');
             setAddLabels([]);
             setAddFolderColor(DEFAULT_FOLDER_COLOR_VALUE);

             fetchFolderContent(parentFolderId, workspaceId, userId); // Refresh konten folder saat ini

         } catch (err: any) {
             console.error("Error saat menambahkan folder:", err);
             // Set error state jika belum ada (misalnya dari validasi awal)
             if (!folderError) {
                 setFolderError(err.message);
             }
         } finally {
             setIsProcessingFolderAction(false);
         }
    };
    const handleRenameFolderAction = async () => {
        // ... (kode handleRenameFolderAction tetap sama)
         if (!user?.id || !accessToken || !folderBeingManaged || !editFolderName.trim()) {
              if (!editFolderName.trim()) setFolderError("Nama folder baru tidak boleh kosong.");
              else setFolderError("Data tidak lengkap untuk rename folder.");
              return;
          }
         const folderId = folderBeingManaged.id;
         const newName = editFolderName.trim();

         // Jika nama tidak berubah, tutup dialog saja
         if (newName === folderBeingManaged.name) {
             setIsRenameDialogOpen(false);
             return;
         }

         setIsProcessingFolderAction(true);
         setFolderError(null);

         try {
             // Panggil API Google Drive untuk update nama
             const updatedFolder = await makeApiCall<GoogleDriveFile>(
                 `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`,
                 'PATCH',
                 { name: newName } // Body hanya berisi field yang diubah
             );

             // Jika updatedFolder null, error sudah di-set oleh makeApiCall
             if (!updatedFolder) {
                  // folderError sudah di-set oleh makeApiCall
                 throw new Error(folderError || "Gagal merename folder di Google Drive.");
             }

             console.log(`Folder ${folderId} berhasil direname menjadi '${newName}'.`);

             // Tutup dialog dan refresh
             setIsRenameDialogOpen(false);
             setFolderBeingManaged(null);
             if (currentFolderId && selectedWorkspaceForBrowse) {
                 fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, user.id); // Refresh konten folder saat ini
             }

         } catch (err: any) {
             console.error("Error saat merename folder:", err);
             if (!folderError) {
                 setFolderError(err.message);
             }
         } finally {
             setIsProcessingFolderAction(false);
         }
    };
    const handleEditMetadataAction = async () => {
        // ... (kode handleEditMetadataAction tetap sama)
         if (!user?.id || !selectedWorkspaceForBrowse || !folderBeingManaged) {
             setFolderError("Data tidak lengkap untuk menyimpan detail.");
             return;
         }

         const { id: folderId } = folderBeingManaged;
         const { id: workspaceId } = selectedWorkspaceForBrowse; // User ID diambil dari state `user`
         const userId = user.id;

         // Siapkan data untuk di-upsert
         const descriptionToSave = editDescription.trim() || null; // null jika kosong
         const labelsToSave = editLabels.filter(l => l.trim()); // Ambil yang tidak kosong
         const colorToSave = editFolderColor;

         // Buat objek metadata, pastikan sesuai dengan struktur tabel Supabase Anda
         const metadataToSave = {
             id: folderId,               // Primary Key GDrive ID
             workspace_id: workspaceId,  // Foreign Key / Bagian dari PK
             user_id: userId,            // Foreign Key / Bagian dari PK
             description: descriptionToSave,
             labels: labelsToSave.length > 0 ? labelsToSave : null, // Simpan null jika array kosong
             color: colorToSave
         };

         setIsProcessingFolderAction(true);
         setFolderError(null);
         console.log('Upserting metadata ke Supabase:', metadataToSave);

         try {
             // Gunakan upsert untuk insert jika belum ada, atau update jika sudah ada
             // Pastikan onConflict menunjuk ke Primary Key (id, workspace_id, user_id jika composite)
             const { error: upsertError } = await supabase
                 .from('folder') // Nama tabel metadata Anda
                 .upsert(metadataToSave, {
                     // Tentukan kolom constraint (Primary Key) untuk onConflict
                     // Sesuaikan jika PK Anda berbeda
                     onConflict: 'id, workspace_id, user_id'
                 });

             if (upsertError) {
                 console.error("Supabase Upsert Error:", upsertError);
                 throw new Error(`Gagal menyimpan detail metadata: ${upsertError.message}`);
             }

             console.log("Metadata berhasil disimpan/diperbarui di Supabase.");

             // Tutup dialog dan refresh
             setIsEditMetadataDialogOpen(false);
             setFolderBeingManaged(null);
             if (currentFolderId && selectedWorkspaceForBrowse) {
                 fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, userId); // Refresh konten folder
             }

         } catch (err: any) {
             console.error("Error saat menyimpan metadata:", err);
             if (!folderError) {
                 setFolderError(err.message);
             }
         } finally {
             setIsProcessingFolderAction(false);
         }
    };
    const handleDeleteFolderAction = async () => {
        // ... (kode handleDeleteFolderAction tetap sama)
        if (!user?.id || !accessToken || !folderBeingManaged || !selectedWorkspaceForBrowse) {
             setFolderError("Data tidak lengkap untuk menghapus folder.");
             return;
         }
         const { id: folderId, name: folderName } = folderBeingManaged;
         const { id: workspaceId } = selectedWorkspaceForBrowse; // user_id bisa diambil dari state `user`

         // Konfirmasi ulang (Mungkin perlu dialog yang lebih baik daripada window.confirm)
         if (!window.confirm(`PERINGATAN!\n\nAnda akan menghapus folder "${folderName}" beserta SEMUA ISINYA secara permanen dari Google Drive.\n\nTindakan ini TIDAK DAPAT DIBATALKAN.\n\nYakin ingin melanjutkan?`)) {
             setIsDeleteDialogOpen(false); // Tutup dialog jika batal
             return;
         }

         setIsProcessingFolderAction(true);
         setFolderError(null);
         console.log(`Memulai proses penghapusan folder ID: ${folderId}`);

         try {
             // 1. Hapus folder dari Google Drive
             console.log(`Menghapus folder ${folderId} dari Google Drive...`);
             // makeApiCall return null on success (204 No Content) or error
             const deleteResult = await makeApiCall<null>(`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`, 'DELETE');

             // Jika deleteResult TIDAK null, berarti ada error (sudah di-set oleh makeApiCall)
             if (deleteResult !== null || folderError) {
                 console.error("Gagal menghapus folder dari Google Drive.", folderError);
                 // Jangan lanjutkan ke penghapusan Supabase jika GDrive gagal
                 // folderError sudah di-set oleh makeApiCall atau blok catch ini
                 if (!folderError) setFolderError("Gagal menghapus folder dari Google Drive.");
                 // Tutup dialog, biarkan error ditampilkan
                 setIsDeleteDialogOpen(false);
                 setIsProcessingFolderAction(false);
                 return;
             }
             console.log(`Folder ${folderId} berhasil dihapus dari Google Drive.`);


             // 2. Hapus metadata dari Supabase (opsional, tergantung kebutuhan)
             // Jika folder GDrive sudah tidak ada, mungkin metadata tidak relevan lagi
             console.log(`Menghapus metadata untuk folder ${folderId} dari Supabase...`);
             const { error: metaDeleteError } = await supabase
                 .from('folder') // Nama tabel metadata Anda
                 .delete()
                 .match({ id: folderId, workspace_id: workspaceId, user_id: user.id }); // Match berdasarkan PK

             if (metaDeleteError) {
                 // Jangan gagalkan total proses, tapi log error ini
                 console.error("Gagal menghapus metadata dari Supabase:", metaDeleteError);
                 // Mungkin beri notifikasi non-blocking
                 // setFolderError(`Folder dihapus, tapi gagal hapus metadata: ${metaDeleteError.message}`);
             } else {
                 console.log(`Metadata untuk folder ${folderId} berhasil dihapus dari Supabase.`);
             }

             // 3. Tutup dialog dan refresh
             setIsDeleteDialogOpen(false);
             setFolderBeingManaged(null);
             if (currentFolderId && selectedWorkspaceForBrowse) {
                 fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, user.id); // Refresh konten folder saat ini
             }

         } catch (err: any) { // Catch error umum jika terjadi di luar makeApiCall/Supabase call
             console.error("Error saat proses penghapusan folder:", err);
             if (!folderError) {
                 setFolderError(`Terjadi kesalahan saat menghapus folder: ${err.message}`);
             }
         } finally {
             setIsProcessingFolderAction(false);
         }
    };


    // --- Render ---
    if (!user?.id) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Memuat user...</div>;
    if (!account) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Menghubungkan Google...</div>;
    if (!accessToken) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Mengambil akses token...</div>; // Tambahkan ini

    // Pastikan semua props diteruskan ke UI Component
    return (
        <FolderSelectorUI
            // Workspace Props
            error={workspaceError}
            newWorkspaceLink={newWorkspaceLink}
            setNewWorkspaceLink={setNewWorkspaceLink}
            workspaces={workspaces}
            isLoading={isLoadingWorkspaces}
            isAdding={isAddingWorkspace}
            accessToken={accessToken} // Mungkin tidak perlu di UI, tapi pass jika dibutuhkan
            handleAddWorkspace={handleAddWorkspace}
            handleRemoveWorkspace={handleRemoveWorkspace}
            handleSelectWorkspaceForBrowse={handleSelectWorkspaceForBrowse}
            newWorkspaceName={newWorkspaceName}
            setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor}
            setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={defaultColors}

            // Folder Browser Props
            selectedWorkspaceForBrowse={selectedWorkspaceForBrowse}
            itemsInCurrentFolder={itemsInCurrentFolder} // Kirim data yang sudah ada fileCount
            isLoadingFolderContent={isLoadingFolderContent}
            folderError={folderError}
            folderPath={folderPath}
            onNavigate={navigateToFolder}
            onNavigateBreadcrumb={navigateViaBreadcrumb}

            // Folder Action Props
            isProcessingFolderAction={isProcessingFolderAction}
            onTriggerAddFolder={triggerAddFolder}
            onTriggerAllFolder={triggerAllFolder} // Pastikan ini ada
            onTriggerRenameFolder={triggerRenameFolder}
            onTriggerEditMetadata={triggerEditMetadata}
            onTriggerDeleteFolder={triggerDeleteFolder}

            // Dialog Add Folder
            isAddFolderDialogOpen={isAddFolderDialogOpen}
            setIsAddFolderDialogOpen={setIsAddFolderDialogOpen}
            isAllFolderDialogOpen={isAllFolderDialogOpen} // Pastikan ini ada
            setIsAllFolderDialogOpen={setIsAllFolderDialogOpen} // Pastikan ini ada
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            addDescription={addDescription}
            setAddDescription={setAddDescription}
            addLabels={addLabels}
            setAddLabels={setAddLabels}
            addFolderColor={addFolderColor}
            setAddFolderColor={setAddFolderColor}
            handleAddFolderAction={handleAddFolderAction}

            // Dialog Rename Folder
            isRenameDialogOpen={isRenameDialogOpen}
            setIsRenameDialogOpen={setIsRenameDialogOpen}
            folderBeingManaged={folderBeingManaged}
            editFolderName={editFolderName}
            setEditFolderName={setEditFolderName}
            handleRenameFolderAction={handleRenameFolderAction}

            // Dialog Edit Metadata
            isEditMetadataDialogOpen={isEditMetadataDialogOpen}
            setIsEditMetadataDialogOpen={setIsEditMetadataDialogOpen}
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            editLabels={editLabels}
            setEditLabels={setEditLabels}
            editFolderColor={editFolderColor}
            setEditFolderColor={setEditFolderColor}
            handleEditMetadataAction={handleEditMetadataAction}

            // Dialog Delete Folder
            isDeleteDialogOpen={isDeleteDialogOpen}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            handleDeleteFolderAction={handleDeleteFolderAction}
        />
    );
};

export default FolderSelector;
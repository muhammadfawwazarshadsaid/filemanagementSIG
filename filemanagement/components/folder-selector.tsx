// src/components/FolderSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useUser } from "@stackframe/stack"; // Pastikan library ini terinstal dan dikonfigurasi
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import { Loader2 } from 'lucide-react';
import FolderSelectorUI from './folder-selector-ui'; // Impor komponen UI
import { toast } from 'sonner'; // Impor toast untuk notifikasi (opsional)


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
// Diasumsikan 'folder' menyimpan metadata FOLDER GDrive
interface SupabaseFolderMetadata {
    id: string; // GDrive FOLDER ID (PK)
    workspace_id: string; // GDrive ID of the workspace (PK)
    user_id: string; // User ID (PK)
    description?: string | null;
    color?: string | null;
    labels?: string[] | null;
    created_at?: string;
    updated_at?: string;
}

// Item yang ditampilkan di browser (bisa folder GDrive atau file GDrive)
export interface ManagedItem extends GoogleDriveFile {
    // Metadata diambil dari Supabase (jika itemnya adalah FOLDER)
    metadata?: SupabaseFolderMetadata | null;
}

// Representasi Workspace dari tabel 'workspace' di Supabase
export interface Workspace {
    id: string;             // GDrive Folder ID (PK)
    user_id: string;        // User ID (PK)
    url: string;            // URL GDrive asli
    name: string;           // Nama workspace (bisa custom)
    color?: string | null;  // Warna kustom
    is_self_workspace: boolean; // <-- FLAG KEPEMILIKAN
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

// Warna default yang bisa dipilih
const defaultColors: { [key: string]: string } = {
    "blue": 'bg-blue-500', "green": 'bg-green-500', "red": 'bg-red-500',
    "yellow": 'bg-yellow-500', "purple": 'bg-purple-500', "pink": 'bg-pink-500',
    "indigo": 'bg-indigo-500', "gray": 'bg-gray-500',
};

interface FolderSelectorProps {
    onFolderExistenceChange?: (hasFolders: boolean) => void;
    // Optional: Jika komponen ini digunakan dalam konteks workspace spesifik
    initialTargetWorkspaceId?: string | null;
}

// --- Komponen Utama ---
const FolderSelector: React.FC<FolderSelectorProps> = ({
    onFolderExistenceChange,
    initialTargetWorkspaceId = null // Terima initialTargetWorkspaceId
}) => {
    const user = useUser({ or: 'redirect' });
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: ['https://www.googleapis.com/auth/drive'] // Scope penuh
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // Warna default untuk workspace/folder baru
    const DEFAULT_COLOR_VALUE = Object.values(defaultColors)[0] || 'bg-gray-500';

    // --- State ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    const [isAddingWorkspace, setIsAddingWorkspace] = useState<boolean>(false);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
    const [newWorkspaceColor, setNewWorkspaceColor] = useState<string>(DEFAULT_COLOR_VALUE);

    const [selectedWorkspaceForBrowse, setSelectedWorkspaceForBrowse] = useState<Workspace | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [itemsInCurrentFolder, setItemsInCurrentFolder] = useState<ManagedItem[]>([]);
    const [isLoadingFolderContent, setIsLoadingFolderContent] = useState<boolean>(false);
    const [folderError, setFolderError] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<FolderPathItem[]>([]);

    // Dialog states
    const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isEditMetadataDialogOpen, setIsEditMetadataDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [folderBeingManaged, setFolderBeingManaged] = useState<ManagedItem | null>(null); // Folder context for dialogs

    // Add Folder Dialog states
    const [newFolderName, setNewFolderName] = useState('');
    const [addDescription, setAddDescription] = useState('');
    const [addLabels, setAddLabels] = useState<string[]>([]);
    const [addFolderColor, setAddFolderColor] = useState<string>(DEFAULT_COLOR_VALUE);

    // Edit/Rename Folder Dialog states
    const [editFolderName, setEditFolderName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLabels, setEditLabels] = useState<string[]>([]);
    const [editFolderColor, setEditFolderColor] = useState<string>(DEFAULT_COLOR_VALUE);

    const [isProcessingFolderAction, setIsProcessingFolderAction] = useState(false); // Generic loading for CRUD actions

    // --- Helper Panggil API Google ---
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
        if (!accessToken) {
            const errorMsg = "Akses token Google tidak tersedia.";
            // Set error ke state yang relevan (workspace atau folder)
            if (selectedWorkspaceForBrowse) setFolderError(errorMsg); else setWorkspaceError(errorMsg);
            console.error("makeApiCall Error: Access Token missing.");
            setIsLoadingWorkspaces(false); setIsLoadingFolderContent(false); setIsProcessingFolderAction(false);
            return null;
        }
        const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
        // Hanya set Content-Type jika ada body dan bukan GET/DELETE/FormData
        if (!(body instanceof FormData) && body && !['GET', 'DELETE'].includes(method.toUpperCase())) {
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
                try { errorData = await response.json(); } catch (e) { /* Abaikan jika body bukan JSON */ }
                const message = errorData?.error?.message || errorData?.message || `HTTP error ${response.status}`;
                console.error("Google API Call Error:", response.status, message, errorData);
                // Lempar error agar bisa ditangkap oleh block catch pemanggil
                throw new Error(`Google API Error (${response.status}): ${message}`);
            }
            // Handle 204 No Content (sering terjadi pada DELETE)
            if (response.status === 204) {
                return null; // Return null untuk indikasi sukses tanpa body
            }
            return response.json() as Promise<T>; // Return body JSON
        } catch (err: any) {
            console.error(`Gagal ${method} ${url}:`, err);
            const errorMsg = err.message || `Gagal menghubungi Google Drive API (${method}).`;
             // Set error ke state yang relevan
            if (selectedWorkspaceForBrowse) setFolderError(errorMsg); else setWorkspaceError(errorMsg);
            return null; // Return null untuk indikasi kegagalan
        }
    }, [accessToken, selectedWorkspaceForBrowse]); // selectedWorkspaceForBrowse ada di sini untuk menentukan state error mana yang diupdate

    // --- Fetch Konten Folder (dari GDrive & Supabase) ---
    const fetchFolderContent = useCallback(async (folderIdToFetch: string, targetWorkspaceId: string, targetUserId: string) => {
        if (!accessToken || !targetUserId || !targetWorkspaceId) {
            setFolderError("Informasi untuk mengambil data folder tidak lengkap.");
            setItemsInCurrentFolder([]);
            setIsLoadingFolderContent(false); // Pastikan loading berhenti
            if (onFolderExistenceChange) onFolderExistenceChange(false); // Callback jika ada error data
            return;
        }
        setIsLoadingFolderContent(true);
        setFolderError(null);
        let googleDriveItems: GoogleDriveFile[] = [];
        let combinedItems: ManagedItem[] = [];
        let foldersExistInResult = false;

        try {
            // 1. Ambil item dari Google Drive
            const fieldsToFetch = "files(id, name, mimeType, parents, webViewLink)";
            // Cari item (folder & file) yang parent-nya adalah folderIdToFetch
            const query = `'${folderIdToFetch}' in parents and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsToFetch)}&orderBy=folder,name`; // Urutkan folder dulu
            const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);
            // Jika makeApiCall mengembalikan null karena error, folderError sudah di-set di dalamnya
            if (!gDriveData && folderError) { throw new Error(folderError); } // Lempar error yang sudah ada
            googleDriveItems = gDriveData?.files || [];

            // 2. Ambil metadata dari Supabase HANYA untuk item yang merupakan FOLDER GDrive
            let metadataMap: Record<string, SupabaseFolderMetadata> = {};
            const folderIdsFromGDrive = googleDriveItems
                .filter(item => item.mimeType === 'application/vnd.google-apps.folder')
                .map(item => item.id);

            if (folderIdsFromGDrive.length > 0) {
                const { data: metadataList, error: metaError } = await supabase
                    .from('folder') // Tabel metadata folder
                    .select('id, description, labels, color') // Ambil kolom metadata
                    .in('id', folderIdsFromGDrive) // Filter berdasarkan ID folder GDrive
                    .eq('workspace_id', targetWorkspaceId) // Filter berdasarkan workspace
                    .eq('user_id', targetUserId); // Filter berdasarkan user

                if (metaError) {
                    console.warn("Supabase meta fetch warning:", metaError.message);
                    // Tampilkan warning, tapi jangan gagalkan seluruh proses fetch
                    setFolderError((prev) => prev ? `${prev} | Gagal load metadata folder: ${metaError.message}` : `Warning: Gagal load metadata folder (${metaError.message}).`);
                }
                if (metadataList) {
                    metadataList.forEach(meta => {
                        metadataMap[meta.id] = meta as SupabaseFolderMetadata;
                    });
                }
            }

            // 3. Gabungkan data GDrive dan Supabase
            combinedItems = googleDriveItems.map(gItem => ({
                ...gItem,
                // Masukkan metadata HANYA jika item ini adalah folder dan metadatanya ditemukan
                metadata: gItem.mimeType === 'application/vnd.google-apps.folder' ? metadataMap[gItem.id] || null : null
            }));

            setItemsInCurrentFolder(combinedItems);

            // 4. Cek apakah ada folder di hasil fetch ini
            foldersExistInResult = combinedItems.some(item => item.mimeType === 'application/vnd.google-apps.folder');

        } catch (err: any) {
            console.error("Error fetching folder content:", err);
            // Hanya set error jika belum ada error sebelumnya (dari makeApiCall)
            if (!folderError) setFolderError(err.message || 'Gagal memuat isi folder.');
            setItemsInCurrentFolder([]); // Kosongkan jika error
            foldersExistInResult = false; // Pastikan false jika error
        } finally {
            setIsLoadingFolderContent(false);
            // Panggil callback dengan status folder dari hasil fetch terakhir
            if (onFolderExistenceChange) {
                console.log(`[FolderSelector] fetch finally: Calling onFolderExistenceChange(${foldersExistInResult})`);
                onFolderExistenceChange(foldersExistInResult);
            }
        }
    }, [accessToken, makeApiCall, supabase, user?.id, onFolderExistenceChange, folderError]); // Dependensi

    // --- Handler Pemilihan Workspace ---
    const handleSelectWorkspaceForBrowse = useCallback((workspace: Workspace) => {
        if (!user?.id) return;
        // Jika workspace yang sama diklik lagi, refresh kontennya
        if (selectedWorkspaceForBrowse?.id === workspace.id) {
            fetchFolderContent(currentFolderId || workspace.id, workspace.id, user.id);
            return;
        }

        console.log("Selecting workspace:", workspace.name, `(Owned: ${workspace.is_self_workspace})`);
        setSelectedWorkspaceForBrowse(workspace); // Update workspace terpilih
        setCurrentFolderId(workspace.id); // Set folder saat ini ke root workspace
        const initialPath = [{ id: workspace.id, name: workspace.name }]; // Path awal adalah workspace itu sendiri
        setFolderPath(initialPath);
        setItemsInCurrentFolder([]); // Kosongkan item saat ganti workspace
        setFolderError(null); // Reset error folder
        setIsLoadingFolderContent(true); // Mulai loading

        // Reset state dialog dan folder context
        setIsAddFolderDialogOpen(false); setIsRenameDialogOpen(false);
        setIsEditMetadataDialogOpen(false); setIsDeleteDialogOpen(false);
        setFolderBeingManaged(null);

        // Panggil callback false saat mulai load workspace baru (karena belum tahu isinya)
        if (onFolderExistenceChange) {
            onFolderExistenceChange(false);
        }

        // Fetch konten root workspace yang baru dipilih
        fetchFolderContent(workspace.id, workspace.id, user.id);

    }, [user?.id, fetchFolderContent, selectedWorkspaceForBrowse?.id, currentFolderId, onFolderExistenceChange]); // Dependensi

   // --- Memuat Workspace & Auto-Select dengan Target ID ---
    const loadWorkspaces = useCallback(async (targetId: string | null = null) => {
        if (!user?.id || !accessToken) { /* ... */ setIsLoadingWorkspaces(true); return; }
        setIsLoadingWorkspaces(true); setWorkspaceError(null);
        let foundWorkspaces: Workspace[] = [];

        try {
            const { data: supabaseWorkspaces, error: supabaseError } = await supabase
                .from('workspace')
                // Ambil SEMUA kolom termasuk is_self_workspace
                .select('id, user_id, url, name, color, is_self_workspace')
                .eq('user_id', user.id);

            if (supabaseError) { throw new Error(`Supabase Error: ${supabaseError.message}`); }
            foundWorkspaces = (supabaseWorkspaces as Workspace[]) || [];
            setWorkspaces(foundWorkspaces);

            let workspaceToSelect: Workspace | null = null;

            // 1. Prioritaskan targetId jika ada
            if (targetId) {
                workspaceToSelect = foundWorkspaces.find(ws => ws.id === targetId) || null;
                // Fallback ke workspace pertama jika targetId tidak ditemukan tapi ada workspace lain
                if (!workspaceToSelect && foundWorkspaces.length > 0) {
                    console.warn(`Target workspace ID "${targetId}" not found or user doesn't have access. Falling back to the first available.`);
                    workspaceToSelect = foundWorkspaces[0];
                } else if (!workspaceToSelect) {
                     console.warn(`Target workspace ID "${targetId}" not found or no workspaces available.`);
                }
            // 2. Jika tidak ada targetId, coba pertahankan seleksi saat ini
            } else {
                const currentSelection = selectedWorkspaceForBrowse;
                const currentSelectionStillExists = currentSelection && foundWorkspaces.some(ws => ws.id === currentSelection.id);
                if (currentSelectionStillExists) {
                    workspaceToSelect = currentSelection; // Pertahankan
                } else if (foundWorkspaces.length > 0) {
                    workspaceToSelect = foundWorkspaces[0]; // Pilih yang pertama jika tidak ada seleksi valid
                }
                 // Jika foundWorkspaces kosong, workspaceToSelect tetap null
            }

            // 3. Lakukan Seleksi Otomatis
            if (workspaceToSelect) {
                 // Hanya panggil handleSelect jika workspace berbeda ATAU belum ada yg dipilih
                 if (selectedWorkspaceForBrowse?.id !== workspaceToSelect.id) {
                    handleSelectWorkspaceForBrowse(workspaceToSelect);
                 } else {
                      // Jika sama, mungkin tidak perlu panggil handleSelect, tapi pastikan konten sudah/akan di-load
                      // Panggil fetchFolderContent jika belum loading atau jika currentFolderId tidak sesuai
                      if (!isLoadingFolderContent && currentFolderId !== workspaceToSelect.id) {
                          fetchFolderContent(workspaceToSelect.id, workspaceToSelect.id, user.id);
                      }
                     // Pastikan callback dipanggil jika workspace ada
                     if (onFolderExistenceChange) {
                          // Cek apakah sudah ada item folder di state saat ini (meskipun mungkin belum ter-render)
                          // Atau panggil true secara default jika workspace ada? Lebih aman panggil true jika ada workspace.
                          onFolderExistenceChange(true); // Asumsikan workspace ada = potensi folder ada
                     }
                 }
            } else {
                // Tidak ada workspace sama sekali
                setSelectedWorkspaceForBrowse(null); setCurrentFolderId(null);
                setItemsInCurrentFolder([]); setFolderPath([]);
                if (onFolderExistenceChange) onFolderExistenceChange(false);
            }

        } catch (err: any) {
             console.error("Gagal memuat atau menyeleksi workspaces:", err);
             setWorkspaceError(`Gagal memuat workspace: ${err.message}`);
             setWorkspaces([]); // Reset
             setSelectedWorkspaceForBrowse(null); setCurrentFolderId(null);
             setItemsInCurrentFolder([]); setFolderPath([]);
             if (onFolderExistenceChange) onFolderExistenceChange(false);
        } finally {
            setIsLoadingWorkspaces(false);
        }
    }, [
        user?.id, accessToken, supabase, handleSelectWorkspaceForBrowse,
        onFolderExistenceChange, selectedWorkspaceForBrowse, // Tambahkan selectedWorkspaceForBrowse ke deps
        isLoadingFolderContent, currentFolderId // Tambahkan state loading/current folder
    ]);

    // Trigger loadWorkspaces saat user/token siap atau initialTargetWorkspaceId berubah
    useEffect(() => {
        if (user?.id && accessToken) {
            // Gunakan initialTargetWorkspaceId saat load pertama jika ada
            loadWorkspaces(initialTargetWorkspaceId);
        }
    // Jangan tambahkan loadWorkspaces ke dependency array ini untuk mencegah loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, accessToken, initialTargetWorkspaceId]);


    // --- Fungsi CRUD Workspace ---
    const extractFolderIdFromLink = (link: string): string | null => {
        // Regex untuk mencocokkan ID folder GDrive dari URL
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]{20,})/); // ID biasanya > 20 char
        return match ? match[1] : null;
    };

    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setWorkspaceError(null);
        if (!user?.id || !accessToken) { setWorkspaceError("User tidak terautentikasi."); return; }

        const folderId = extractFolderIdFromLink(newWorkspaceLink);
        if (!folderId) { setWorkspaceError("Link folder Google Drive tidak valid atau tidak dikenal."); return; }

        // Cek duplikasi berdasarkan ID di state lokal dulu
        if (workspaces.some(ws => ws.id === folderId)) {
            setWorkspaceError(`Workspace dengan ID folder ini sudah ada dalam daftar Anda.`);
            return;
        }
        setIsAddingWorkspace(true);
        try {
            // 1. Verifikasi folder di Google Drive
            const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            const folderDetails = await makeApiCall<GoogleDriveFileDetail>(verifyUrl);
            // Jika makeApiCall return null, error sudah di-set
            if (!folderDetails) {
                throw new Error(workspaceError || `Folder GDrive tidak ditemukan atau Anda tidak punya akses.`);
            }
            if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') {
                throw new Error(`Link yang dimasukkan bukanlah folder Google Drive.`);
            }

            // 2. Siapkan data untuk Supabase
            const workspaceName = newWorkspaceName.trim() || folderDetails.name; // Gunakan nama GDrive jika nama kustom kosong
            const newWorkspaceData = {
                id: folderDetails.id,
                user_id: user.id,
                url: newWorkspaceLink,
                name: workspaceName,
                color: newWorkspaceColor,
                is_self_workspace: true // Workspace yang ditambah manual dianggap milik sendiri
            };

            // 3. Insert ke Supabase
            const { error: insertError } = await supabase.from('workspace').insert([newWorkspaceData]);
            if (insertError) {
                // Handle potensi error (misal: unique constraint violation jika logic cek lokal gagal)
                if (insertError.code === '23505') { // Kode error untuk unique violation di PostgreSQL
                    throw new Error(`Workspace ini sudah terdaftar (DB Constraint).`);
                }
                throw new Error(`Gagal simpan ke database: ${insertError.message}`);
            }

            toast.success(`Workspace "${workspaceName}" berhasil ditambahkan!`);
            // Reset form dan reload daftar workspace (akan otomatis memilih yang baru jika itu yg pertama)
            setNewWorkspaceLink(''); setNewWorkspaceName(''); setNewWorkspaceColor(DEFAULT_COLOR_VALUE);
            await loadWorkspaces(folderDetails.id); // Reload dan targetkan ID baru untuk auto-select

        } catch (err: any) {
            console.error("Error tambah workspace:", err);
            // Hanya set error jika belum diset oleh makeApiCall
            if (!workspaceError) setWorkspaceError(`Gagal menambahkan: ${err.message}`);
        } finally {
            setIsAddingWorkspace(false);
        }
    };

    const handleRemoveWorkspace = async (idToRemove: string) => {
        if (!user?.id) return;
        const wsToRemove = workspaces.find(ws => ws.id === idToRemove);
        const confirmationMsg = wsToRemove?.is_self_workspace
            ? `Yakin hapus workspace "${wsToRemove?.name || idToRemove}" dari daftar Anda?\n(Folder asli di Google Drive TIDAK akan terhapus)`
            : `Yakin keluar dari workspace bersama "${wsToRemove?.name || idToRemove}"?\n(Anda akan kehilangan akses dari aplikasi ini)`;

        if (!window.confirm(confirmationMsg)) return;

        // Set loading sementara di state workspace list (bukan folder)
        setIsLoadingWorkspaces(true);
        setWorkspaceError(null);
        try {
            // Hapus entri dari Supabase untuk user ini
            const { error: deleteError } = await supabase.from('workspace')
                .delete()
                .match({ id: idToRemove, user_id: user.id }); // Cocokkan ID dan user_id

            if (deleteError) {
                throw new Error(`Gagal hapus dari database: ${deleteError.message}`);
            }

            toast.info(`Workspace "${wsToRemove?.name || idToRemove}" telah ${wsToRemove?.is_self_workspace ? 'dihapus dari daftar' : 'ditinggalkan'}.`);

            // Jika workspace yang dihapus adalah yang sedang dipilih, reset tampilan browse
            if (selectedWorkspaceForBrowse?.id === idToRemove) {
                 setSelectedWorkspaceForBrowse(null);
                 setCurrentFolderId(null);
                 setItemsInCurrentFolder([]);
                 setFolderPath([]);
                 if (onFolderExistenceChange) onFolderExistenceChange(false);
             }

            // Muat ulang daftar workspace (akan otomatis memilih workspace lain jika ada)
            await loadWorkspaces();

        } catch (err: any) {
            console.error("Error hapus/keluar workspace:", err);
            setWorkspaceError(`Gagal menghapus/keluar: ${err.message}`);
             // Hentikan loading jika error
            setIsLoadingWorkspaces(false);
        }
        // Loading akan dihentikan oleh loadWorkspaces() jika berhasil
    };

    // --- Navigasi Folder & Breadcrumb ---
    const navigateToFolder = (folderId: string, folderName: string) => {
        if (!user?.id || !selectedWorkspaceForBrowse || isLoadingFolderContent) return; // Tambah cek loading
        console.log(`Navigating to folder: ${folderName} (${folderId})`);
        setCurrentFolderId(folderId);
        // Tambahkan item baru ke path
        setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
        setItemsInCurrentFolder([]); // Kosongkan item lama
        setFolderError(null); // Reset error
        setIsLoadingFolderContent(true); // Mulai loading

        // Panggil callback false saat mulai load subfolder
        if (onFolderExistenceChange) {
            onFolderExistenceChange(false);
        }
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

    const navigateViaBreadcrumb = (folderId: string, index: number) => {
        // Jangan lakukan apa-apa jika klik breadcrumb terakhir atau sedang loading
        if (!user?.id || !selectedWorkspaceForBrowse || isLoadingFolderContent || index === folderPath.length - 1) return;
        console.log(`Navigating via breadcrumb to: ${folderPath[index].name} (${folderId})`);
        setCurrentFolderId(folderId);
        // Potong path sampai index yang diklik
        setFolderPath(prev => prev.slice(0, index + 1));
        setItemsInCurrentFolder([]); // Kosongkan item lama
        setFolderError(null); // Reset error
        setIsLoadingFolderContent(true); // Mulai loading

        // Panggil callback false saat mulai load parent folder
        if (onFolderExistenceChange) {
            onFolderExistenceChange(false);
        }
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

    // --- Trigger Dialog CRUD ---
    const triggerAddFolder = () => {
        // Hanya buka jika user adalah owner workspace yang dipilih
        if (!selectedWorkspaceForBrowse?.is_self_workspace) {
            toast.warning("Tidak dapat menambah folder pada workspace yang dibagikan.");
            return;
        }
        // Reset form tambah
        setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_COLOR_VALUE);
        setFolderError(null); // Reset error spesifik folder
        setIsAddFolderDialogOpen(true);
    };

    const triggerRenameFolder = (folder: ManagedItem) => {
        if (!selectedWorkspaceForBrowse?.is_self_workspace) {
             toast.warning("Tidak dapat mengubah nama folder pada workspace yang dibagikan.");
             return;
         }
        setFolderBeingManaged(folder); // Set folder yang akan di-manage
        setEditFolderName(folder.name); // Isi nama saat ini ke input
        setFolderError(null);
        setIsRenameDialogOpen(true);
    };

    const triggerEditMetadata = (folder: ManagedItem) => {
        // Boleh buka dialog meskipun bukan owner, tapi input akan disabled
        setFolderBeingManaged(folder);
        // Isi form edit dengan data saat ini atau default
        setEditDescription(folder.metadata?.description || '');
        setEditLabels(folder.metadata?.labels || []);
        setEditFolderColor(folder.metadata?.color || DEFAULT_COLOR_VALUE);
        setFolderError(null);
        setIsEditMetadataDialogOpen(true);
    };

    const triggerDeleteFolder = (folder: ManagedItem) => {
         if (!selectedWorkspaceForBrowse?.is_self_workspace) {
             toast.warning("Tidak dapat menghapus folder pada workspace yang dibagikan.");
             return;
         }
        setFolderBeingManaged(folder);
        setFolderError(null);
        setIsDeleteDialogOpen(true);
    };

    // --- Fungsi Aksi CRUD Folder ---

    // ADD FOLDER
    const handleAddFolderAction = async () => {
        // Validasi dasar & kepemilikan
        if (!user?.id || !accessToken || !currentFolderId || !selectedWorkspaceForBrowse || !selectedWorkspaceForBrowse.is_self_workspace) {
            setFolderError("Aksi tidak diizinkan atau data tidak lengkap."); return;
        }
        if (!newFolderName.trim()) { setFolderError("Nama folder tidak boleh kosong."); return; }

        setIsProcessingFolderAction(true); setFolderError(null);
        const parentFolderId = currentFolderId; // Folder GDrive tempat folder baru akan dibuat
        const workspaceId = selectedWorkspaceForBrowse.id; // ID workspace untuk metadata Supabase
        const userId = user.id;
        const folderName = newFolderName.trim();
        const descriptionToAdd = addDescription.trim() || null;
        const labelsToAdd = addLabels.filter(l => l.trim()).length > 0 ? addLabels.filter(l => l.trim()) : null;
        const colorToAdd = addFolderColor;

        // Metadata untuk GDrive API
        const gdriveMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] };

        try {
            // 1. Buat folder di Google Drive
            const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', gdriveMetadata);
            if (!createdFolder) { throw new Error(folderError || "Gagal membuat folder di Google Drive."); }
            const newFolderId = createdFolder.id;
            console.log(`GDrive folder created: ${newFolderId}`);

            // 2. Siapkan dan simpan metadata ke Supabase (jika ada deskripsi/label/warna)
            if (descriptionToAdd || labelsToAdd || colorToAdd !== DEFAULT_COLOR_VALUE) {
                const metadataToSave: SupabaseFolderMetadata = {
                    id: newFolderId,
                    workspace_id: workspaceId,
                    user_id: userId, // Pastikan user ID disimpan
                    description: descriptionToAdd,
                    labels: labelsToAdd,
                    color: colorToAdd
                };
                console.log('Inserting Supabase metadata:', metadataToSave);
                const { error: insertMetaError } = await supabase.from('folder').insert(metadataToSave);
                if (insertMetaError) {
                     // Log error, tapi mungkin tidak perlu menggagalkan total jika GDrive berhasil
                    console.error("Supabase Insert Metadata Error:", insertMetaError);
                    // Tampilkan warning ke user
                    toast.warning(`Folder "${folderName}" dibuat, namun gagal menyimpan detail (deskripsi/label/warna).`);
                    // Set error agar bisa dilihat di dialog jika masih terbuka (meskipun akan ditutup)
                    // setFolderError(`Folder dibuat, gagal simpan metadata: ${insertMetaError.message}`);
                } else {
                    console.log("Supabase metadata saved successfully.");
                }
            }

            toast.success(`Folder "${folderName}" berhasil dibuat.`);
            setIsAddFolderDialogOpen(false); // Tutup dialog
            // Reset form (sudah dilakukan di triggerAddFolder, tapi pastikan lagi)
            setNewFolderName(''); setAddDescription(''); setAddLabels([]); setAddFolderColor(DEFAULT_COLOR_VALUE);
            // Refresh konten folder saat ini
            fetchFolderContent(parentFolderId, workspaceId, userId);

        } catch (err: any) {
             // Set error jika belum ada (mungkin sudah diset oleh makeApiCall)
            if (!folderError) { setFolderError(err.message); }
            console.error("Error adding folder:", err);
            toast.error("Gagal membuat folder", { description: err.message });
        } finally {
            setIsProcessingFolderAction(false);
        }
    };

    // EDIT METADATA FOLDER
    const handleEditMetadataAction = async () => {
        if (!user?.id || !selectedWorkspaceForBrowse || !folderBeingManaged || !selectedWorkspaceForBrowse.is_self_workspace) {
            setFolderError("Aksi tidak diizinkan atau data tidak lengkap."); return;
        }
        const { id: folderId } = folderBeingManaged;
        const { id: workspaceId } = selectedWorkspaceForBrowse; // ID workspace
        const userId = user.id; // ID user

        // Siapkan data metadata untuk di-upsert
        const descriptionToSave = editDescription.trim() || null;
        const labelsToSave = editLabels.filter(l => l.trim()).length > 0 ? editLabels.filter(l => l.trim()) : null;
        const colorToSave = editFolderColor;

        const metadataToUpsert = {
            id: folderId,
            workspace_id: workspaceId,
            user_id: userId, // Pastikan user_id disertakan untuk primary key / RLS
            description: descriptionToSave,
            labels: labelsToSave,
            color: colorToSave
        };

        setIsProcessingFolderAction(true); setFolderError(null);
        console.log('Upserting Supabase metadata:', metadataToUpsert);

        // Gunakan upsert untuk insert jika belum ada, atau update jika sudah ada
        // Pastikan onConflict menargetkan primary key (id, workspace_id, user_id)
        const { error: upsertError } = await supabase
            .from('folder')
            .upsert(metadataToUpsert, { onConflict: 'id, user_id, workspace_id' }); // Sesuaikan onConflict dengan PK tabel Anda

        if (upsertError) {
            console.error("Supabase Upsert Metadata Error:", upsertError);
            setFolderError(`Gagal menyimpan detail: ${upsertError.message}`);
            toast.error("Gagal menyimpan detail folder.");
        } else {
            console.log("Supabase metadata saved successfully.");
            toast.success("Detail folder berhasil diperbarui.");
            setIsEditMetadataDialogOpen(false); // Tutup dialog
            setFolderBeingManaged(null); // Reset context
            // Refresh konten folder untuk menampilkan perubahan
            fetchFolderContent(currentFolderId!, selectedWorkspaceForBrowse.id, user.id);
        }
        setIsProcessingFolderAction(false);
    };

    // RENAME FOLDER
    const handleRenameFolderAction = async () => {
        if (!user?.id || !accessToken || !folderBeingManaged || !selectedWorkspaceForBrowse?.is_self_workspace) {
            setFolderError("Aksi tidak diizinkan atau data tidak lengkap."); return;
        }
        const folderId = folderBeingManaged.id;
        const newName = editFolderName.trim();
        if (!newName) { setFolderError("Nama folder baru tidak boleh kosong."); return; }
        // Jangan lakukan apa-apa jika nama tidak berubah
        if (newName === folderBeingManaged.name) { setIsRenameDialogOpen(false); return; }

        setIsProcessingFolderAction(true); setFolderError(null);

        try {
            // Panggil GDrive API untuk rename
            const renamePayload = { name: newName };
            const updatedFolder = await makeApiCall<GoogleDriveFile>(
                `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`,
                'PATCH', // Method PATCH untuk update GDrive
                renamePayload
            );

            // Jika makeApiCall return null karena error, folderError sudah di-set
            if (!updatedFolder && folderError) { throw new Error(folderError); }
             if (!updatedFolder && !folderError) { throw new Error("Gagal mengubah nama folder di Google Drive."); } // Fallback error

            console.log(`Folder ${folderId} renamed to "${newName}"`);
            toast.success(`Folder berhasil diubah namanya menjadi "${newName}".`);
            setIsRenameDialogOpen(false); // Tutup dialog
            setFolderBeingManaged(null); // Reset context
            // Refresh konten folder saat ini
            fetchFolderContent(currentFolderId!, selectedWorkspaceForBrowse!.id, user.id);

        } catch (err: any) {
             // Set error jika belum ada
            if (!folderError) { setFolderError(err.message); }
            console.error("Error renaming folder:", err);
            toast.error("Gagal mengubah nama folder", { description: err.message });
        } finally {
            setIsProcessingFolderAction(false);
        }
    };

    // DELETE FOLDER
    const handleDeleteFolderAction = async () => {
        if (!user?.id || !accessToken || !folderBeingManaged || !selectedWorkspaceForBrowse?.is_self_workspace) {
            setFolderError("Aksi tidak diizinkan atau data tidak lengkap."); return;
        }
        const { id: folderId, name: folderName } = folderBeingManaged;
        const { id: workspaceId } = selectedWorkspaceForBrowse;
        const userId = user.id;

        // Konfirmasi ulang (meskipun dialog sudah ada)
        if (!window.confirm(`ANDA YAKIN ingin menghapus folder "${folderName}" beserta SEMUA ISINYA secara permanen dari Google Drive?\n\nTindakan ini TIDAK DAPAT DIBATALKAN.`)) {
            // setIsDeleteDialogOpen(false); // Biarkan dialog terbuka jika batal
            return;
        }

        setIsProcessingFolderAction(true); setFolderError(null);
        console.log(`Attempting to delete folder ${folderId} (${folderName})`);

        try {
            // 1. Hapus Folder dari Google Drive
            // Method DELETE, tidak perlu body
            const deleteResult = await makeApiCall<null>(`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}`, 'DELETE');

            // makeApiCall akan return null jika sukses (204 No Content) atau jika error
            // Cek folderError yang mungkin di-set oleh makeApiCall
            if (deleteResult !== null || folderError) {
                 throw new Error(folderError || "Gagal menghapus folder dari Google Drive.");
            }
            console.log(`GDrive folder ${folderId} deleted successfully.`);

            // 2. Hapus Metadata dari Supabase (jika ada)
            // Tidak wajib, tapi baik untuk kebersihan data
            console.log(`Deleting Supabase metadata for folder ${folderId}`);
            const { error: metaDeleteError } = await supabase.from('folder')
                .delete()
                .match({ id: folderId, user_id: userId, workspace_id: workspaceId }); // Cocokkan PK

            if (metaDeleteError) {
                console.error("Supabase metadata delete Error:", metaDeleteError);
                // Jangan gagalkan total, tapi beri warning
                toast.warning(`Folder "${folderName}" dihapus, namun gagal membersihkan metadata terkait.`);
            } else {
                console.log("Supabase metadata deleted successfully.");
            }

            toast.success(`Folder "${folderName}" dan isinya telah dihapus permanen.`);
            setIsDeleteDialogOpen(false); // Tutup dialog
            setFolderBeingManaged(null); // Reset context
            // Refresh konten folder parent
            fetchFolderContent(currentFolderId!, selectedWorkspaceForBrowse.id, user.id);

        } catch (err: any) {
             // Set error jika belum ada
            if (!folderError) { setFolderError(err.message); }
            console.error("Error deleting folder:", err);
            toast.error("Gagal menghapus folder", { description: err.message });
        } finally {
            setIsProcessingFolderAction(false);
        }
    };


    // --- Render ---
    if (!user?.id) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Memuat user...</div>;
    if (!account) return <div className="p-10 text-center"><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Menghubungkan Google...</div>;
    if (!accessToken) return <div className="p-10 text-center text-red-600">Gagal mendapatkan akses token Google. Coba refresh.</div>;


    // Kirim semua state dan handler ke komponen UI
    return (
        <FolderSelectorUI
            // Props Workspace
            error={workspaceError}
            newWorkspaceLink={newWorkspaceLink}
            setNewWorkspaceLink={setNewWorkspaceLink}
            workspaces={workspaces}
            isLoading={isLoadingWorkspaces}
            isAdding={isAddingWorkspace}
            accessToken={accessToken} // Meskipun tidak digunakan langsung di UI, mungkin berguna di masa depan
            handleAddWorkspace={handleAddWorkspace}
            handleRemoveWorkspace={handleRemoveWorkspace}
            handleSelectWorkspaceForBrowse={handleSelectWorkspaceForBrowse}
            newWorkspaceName={newWorkspaceName}
            setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor}
            setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={defaultColors} // Kirim daftar warna

            // Props Folder Browser
            selectedWorkspaceForBrowse={selectedWorkspaceForBrowse} // Kirim object workspace lengkap
            itemsInCurrentFolder={itemsInCurrentFolder}
            isLoadingFolderContent={isLoadingFolderContent}
            folderError={folderError}
            folderPath={folderPath}
            onNavigate={navigateToFolder}
            onNavigateBreadcrumb={navigateViaBreadcrumb}

            // Props Aksi & Dialog Trigger
            isProcessingFolderAction={isProcessingFolderAction}
            onTriggerAddFolder={triggerAddFolder}
            onTriggerRenameFolder={triggerRenameFolder}
            onTriggerEditMetadata={triggerEditMetadata}
            onTriggerDeleteFolder={triggerDeleteFolder}

            // State & Handler Dialog Add Folder
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

            // State & Handler Dialog Rename Folder
            isRenameDialogOpen={isRenameDialogOpen}
            setIsRenameDialogOpen={setIsRenameDialogOpen}
            folderBeingManaged={folderBeingManaged} // Kirim context folder
            editFolderName={editFolderName}
            setEditFolderName={setEditFolderName}
            handleRenameFolderAction={handleRenameFolderAction}

            // State & Handler Dialog Edit Metadata
            isEditMetadataDialogOpen={isEditMetadataDialogOpen}
            setIsEditMetadataDialogOpen={setIsEditMetadataDialogOpen}
            // folderBeingManaged sudah ada
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            editLabels={editLabels}
            setEditLabels={setEditLabels}
            editFolderColor={editFolderColor} // Kirim state warna edit
            setEditFolderColor={setEditFolderColor} // Kirim setter warna edit
            handleEditMetadataAction={handleEditMetadataAction}

            // State & Handler Dialog Delete Folder
            isDeleteDialogOpen={isDeleteDialogOpen}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            // folderBeingManaged sudah ada
            handleDeleteFolderAction={handleDeleteFolderAction}
        />
    );
};

export default FolderSelector;
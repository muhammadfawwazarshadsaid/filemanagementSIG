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
    color?: string | null; // Sebaiknya string (misal, '#RRGGBB' atau class Tailwind)
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

// Tipe Error Google API (opsional, untuk detail error)
// interface GoogleApiErrorDetail { domain?: string; reason?: string; message: string; }
// interface GoogleApiError { code: number; message: string; errors: GoogleApiErrorDetail[]; }
// interface GoogleApiErrorResponse { error: GoogleApiError; }

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

// Props komponen (jika ada)
interface WorkspaceSelectorProps {
    // onWorkspaceSelected?: (workspaceId: string) => void;
}

// --- Komponen Utama ---
const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = (/*{ onWorkspaceSelected }*/) => {
    // --- Hooks & Autentikasi ---
    const user = useUser({ or: 'redirect' }); // Pastikan user terautentikasi
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect', // Redirect jika belum terhubung ke Google
        scopes: ['https://www.googleapis.com/auth/drive'] // Scope minimal untuk baca/tulis Drive
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State Daftar Workspace ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]); // Daftar workspace dari Supabase
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true); // Loading daftar workspace
    const [isAddingWorkspace, setIsAddingWorkspace] = useState<boolean>(false); // Loading saat menambah workspace
    const [workspaceError, setWorkspaceError] = useState<string | null>(null); // Error terkait daftar/tambah workspace
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>(''); // Input link GDrive
    const [newWorkspaceName, setNewWorkspaceName] = useState<string>(''); // Input nama workspace (opsional)
    const [newWorkspaceColor, setNewWorkspaceColor] = useState<string>(color.color1); // Warna default

    // --- State Browser Folder Terintegrasi ---
    const [selectedWorkspaceForBrowse, setSelectedWorkspaceForBrowse] = useState<Workspace | null>(null); // Workspace yg sedang di-browse
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // ID folder GDrive yg sedang dilihat
    const [currentFolderName, setCurrentFolderName] = useState<string | null>(null); // Nama folder yg sedang dilihat (untuk breadcrumb)
    const [itemsInCurrentFolder, setItemsInCurrentFolder] = useState<ManagedItem[]>([]); // Daftar folder/file di folder saat ini
    const [isBrowseWorkspace, setIsBrowseWorkspace] = useState<boolean>(false); // Flag mode: true=browser, false=daftar workspace
    const [isLoadingFolderContent, setIsLoadingFolderContent] = useState<boolean>(false); // Loading isi folder
    const [folderError, setFolderError] = useState<string | null>(null); // Error terkait browser folder
    const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]); // Path untuk breadcrumbs [{id: root, name: wsName}, {id: sub, name: subName}, ...]
    const [newSubFolderName, setNewSubFolderName] = useState<string>(''); // Input nama folder baru di dalam browser

    // --- Helper Panggil API Google ---
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
        if (!accessToken) {
            // Set error sesuai konteks (sedang Browse atau tidak)
            const setError = isBrowseWorkspace ? setFolderError : setWorkspaceError;
            setError("Akses token Google tidak tersedia. Silakan coba refresh halaman atau hubungkan ulang akun Google Anda.");
            console.error("makeApiCall Error: Access Token is missing.");
            return null;
        }
        // Header default
        const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
        // Set Content-Type jika bukan GET/DELETE dan bukan FormData
        if (!(body instanceof FormData) && method !== 'GET' && method !== 'DELETE') {
            defaultHeaders['Content-Type'] = 'application/json';
        }
        // Opsi request
        const options: RequestInit = { method, headers: defaultHeaders };
        if (body) {
            options.body = (body instanceof FormData) ? body : JSON.stringify(body);
        }

        // Fetch API
        try {
            const response = await fetch(url, options);
            // Handle response error
            if (!response.ok) {
                let errorData: any = null;
                try { errorData = await response.json(); } // Coba parse JSON error
                catch (e) { try { errorData = await response.text(); } // Coba ambil teks error
                catch (e2) { errorData = response.statusText; } } // Fallback ke status text
                console.error("Google API Call Error:", response.status, errorData);
                const message = errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : `HTTP error ${response.status}`);
                throw new Error(`API Error (${response.status}): ${message}`);
            }
            // Handle No Content response
            if (response.status === 204) { return null; }
            // Parse JSON sukses
            return response.json() as Promise<T>;
        } catch (err: any) {
            console.error(`Gagal ${method} ${url}:`, err);
            throw err; // Lempar error lagi agar ditangkap oleh fungsi pemanggil
        }
    }, [accessToken, isBrowseWorkspace]); // makeApiCall bergantung pada accessToken & konteks Browse

    // --- Memuat Daftar Workspace dari Supabase ---
    const loadWorkspaces = useCallback(async () => {
        if (!user?.id) {
             // Jika user belum siap, jangan lakukan apa-apa, tunggu useEffect user
             // Bisa set loading true jika belum ada data
             if (workspaces.length === 0) setIsLoadingWorkspaces(true);
             return;
        }
        // Jika token belum siap, juga tunggu
        if (!accessToken) {
             if (workspaces.length === 0) setIsLoadingWorkspaces(true);
             // Mungkin set error atau pesan?
             // setWorkspaceError("Menunggu koneksi Google...");
             return;
        }

        console.log("Memuat workspaces dari Supabase untuk user:", user.id);
        setIsLoadingWorkspaces(true);
        setWorkspaceError(null);
        try {
            // Ambil data dari tabel 'workspace'
            const { data: supabaseWorkspaces, error: supabaseError } = await supabase
                .from('workspace')
                .select('id, user_id, url, name, color') // Kolom yang diambil
                .eq('user_id', user.id); // Filter berdasarkan user ID

            // Handle error Supabase
            if (supabaseError) {
                throw new Error(`Supabase Error: ${supabaseError.message}`);
            }

            // Update state dengan data, atau array kosong jika tidak ada data
            setWorkspaces((supabaseWorkspaces as Workspace[]) || []);

        } catch (err: any) {
            console.error("Gagal memuat workspaces:", err);
            setWorkspaceError(`Gagal memuat workspace: ${err.message}`);
            setWorkspaces([]); // Kosongkan jika gagal
        } finally {
            setIsLoadingWorkspaces(false); // Selesai loading
        }
    }, [user?.id, accessToken]); // loadWorkspaces bergantung pada user.id dan accessToken

    // Effect untuk memuat workspace saat user atau token siap
    useEffect(() => {
        // Hanya panggil loadWorkspaces jika user dan token sudah ada
        if (user?.id && accessToken) {
            loadWorkspaces();
        }
        // Jika tidak, state loading akan tetap true atau di-handle oleh logic di loadWorkspaces
    }, [user?.id, accessToken, loadWorkspaces]); // Re-run jika user, token, atau fungsi loadWorkspaces berubah


    // --- Fungsi CRUD Workspace ---

    // Helper: Ekstrak ID folder dari link Google Drive
    const extractFolderIdFromLink = (link: string): string | null => {
        // Mencocokkan pola URL Google Drive untuk folder
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null; // Kembalikan ID atau null jika tidak cocok
    };

    // Handler: Menambah workspace baru
    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Cegah submit form default
        setWorkspaceError(null); // Reset error sebelumnya

        // Validasi user & token
        if (!user?.id || !accessToken) {
            setWorkspaceError("User tidak terautentikasi atau koneksi Google belum siap.");
            return;
        }

        // Validasi & ekstrak ID folder dari link
        const folderId = extractFolderIdFromLink(newWorkspaceLink);
        if (!folderId) {
            setWorkspaceError("Format link Google Drive Folder tidak valid. Pastikan link mengarah ke folder.");
            return;
        }

        // Cek duplikasi berdasarkan ID folder
        if (workspaces.some(ws => ws.id === folderId)) {
            setWorkspaceError(`Workspace dengan folder ID ${folderId} sudah ada dalam daftar Anda.`);
            // Pertimbangkan untuk tidak mengosongkan link jika hanya error duplikasi
            // setNewWorkspaceLink('');
            return;
        }

        setIsAddingWorkspace(true); // Mulai loading tambah
        try {
            // 1. Verifikasi ke Google Drive bahwa ID tersebut adalah folder
            const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            const folderDetails = await makeApiCall<GoogleDriveFileDetail>(verifyUrl);

            // Handle jika folder tidak ditemukan atau bukan folder
            if (!folderDetails) {
                throw new Error(`Gagal memverifikasi folder ID ${folderId}. Pastikan link benar dan Anda memiliki akses.`);
            }
            if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') {
                throw new Error(`Item yang ditunjuk oleh link bukanlah sebuah folder (tipe: ${folderDetails.mimeType}).`);
            }

            // 2. Tentukan nama workspace (prioritaskan input user, fallback ke nama GDrive)
            const workspaceName = newWorkspaceName.trim() !== '' ? newWorkspaceName.trim() : folderDetails.name;

            // 3. Siapkan data untuk dimasukkan ke Supabase
            const newWorkspaceData: Omit<WorkspaceSupabaseData, 'user_id'> & { user_id: string } = {
                id: folderDetails.id,      // ID dari GDrive
                user_id: user.id,          // ID user saat ini
                url: newWorkspaceLink,     // URL asli yang dimasukkan user
                name: workspaceName,       // Nama workspace
                color: newWorkspaceColor,  // Warna profil yang dipilih
            };

            // 4. Insert data ke tabel 'workspace' di Supabase
            const { error: insertError } = await supabase
                .from('workspace')
                .insert([newWorkspaceData]);

            // Handle error insert Supabase
            if (insertError) {
                // Error spesifik jika terjadi duplikasi (meski sudah dicek di awal, just in case race condition)
                if (insertError.code === '23505') { // Kode error unique violation PostgreSQL
                    setWorkspaceError(`Workspace dengan folder ID ${folderId} sudah ada di database.`);
                } else {
                    throw new Error(`Supabase Insert Error: ${insertError.message}`);
                }
            } else {
                // Sukses: tambahkan ke state lokal & reset form
                setWorkspaces(prev => [...prev, newWorkspaceData as Workspace]);
                setNewWorkspaceLink('');
                setNewWorkspaceName('');
                setNewWorkspaceColor(color.color1); // Reset warna ke default
                // Mungkin panggil callback onWorkspaceAdded jika ada
            }
        } catch (err: any) {
            console.error("Error saat menambah workspace:", err);
            setWorkspaceError(`Gagal menambahkan workspace: ${err.message}`);
        } finally {
            setIsAddingWorkspace(false); // Selesai loading tambah
        }
    };

    // Handler: Menghapus workspace dari daftar
    const handleRemoveWorkspace = async (idToRemove: string) => {
        // Validasi user
        if (!user?.id) {
            setWorkspaceError("User tidak terautentikasi.");
            return;
        }

        // Konfirmasi pengguna
        const workspaceToRemove = workspaces.find(ws => ws.id === idToRemove);
        if (!window.confirm(`Anda yakin ingin menghapus workspace "${workspaceToRemove?.name || idToRemove}" dari daftar ini?\n\n(Folder asli di Google Drive TIDAK akan terhapus)`)) {
            return;
        }

        // Jika workspace yang sedang di-browse adalah yang akan dihapus, keluar dari mode browse dulu
        if (isBrowseWorkspace && selectedWorkspaceForBrowse?.id === idToRemove) {
            handleExitBrowse();
        }

        setIsLoadingWorkspaces(true); // Bisa gunakan loading workspace atau state loading khusus
        setWorkspaceError(null);
        try {
            // Hapus dari tabel 'workspace' di Supabase berdasarkan id dan user_id
            const { error: deleteError } = await supabase
                .from('workspace')
                .delete()
                .match({ id: idToRemove, user_id: user.id }); // Pastikan hanya user yg bersangkutan yg bisa hapus

            // Handle error delete Supabase
            if (deleteError) {
                throw new Error(`Supabase Delete Error: ${deleteError.message}`);
            }

            // Sukses: Hapus dari state lokal
            setWorkspaces(prev => prev.filter(ws => ws.id !== idToRemove));
            console.log(`Workspace ${idToRemove} berhasil dihapus dari daftar.`);

        } catch (err: any) {
            console.error("Error saat menghapus workspace:", err);
            setWorkspaceError(`Gagal menghapus workspace: ${err.message}`);
        } finally {
            setIsLoadingWorkspaces(false); // Selesai loading
        }
    };

    // --- Logika Browser Folder Terintegrasi ---

    /**
     * Mengambil konten (folder/file) dari folder Google Drive tertentu.
     * @param folderIdToFetch ID folder GDrive yang akan diambil isinya.
     * @param targetWorkspaceId ID workspace (root folder) untuk konteks (jika perlu untuk metadata).
     * @param targetUserId ID user untuk filter metadata Supabase (jika perlu).
     */
    const fetchFolderContent = useCallback(async (folderIdToFetch: string, targetWorkspaceId: string, targetUserId: string) => {
        // Validasi token & user ID (meskipun makeApiCall juga cek token)
        if (!accessToken || !targetUserId) {
            setFolderError("Akses token atau User ID tidak tersedia.");
            setItemsInCurrentFolder([]);
            setIsLoadingFolderContent(false);
            return;
        }

        setIsLoadingFolderContent(true); // Mulai loading isi folder
        setFolderError(null); // Reset error folder
        console.log(`Workspaceing GDrive items for folder: ${folderIdToFetch}, Workspace: ${targetWorkspaceId}`);

        let googleDriveItems: GoogleDriveFile[] = [];
        try {
            // --- Ambil Item dari Google Drive ---
            const fieldsToFetch = "files(id, name, mimeType, parents)"; // Informasi minimal yang dibutuhkan
            // Query untuk mengambil SEMUA item (folder DAN file) di dalam folderIdToFetch
            const query = `'${folderIdToFetch}' in parents and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsToFetch)}&orderBy=folder,name`; // Urutkan: folder dulu, lalu nama

            // Panggil API Google
            const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);
            googleDriveItems = gDriveData?.files || []; // Ambil daftar files, atau array kosong jika null

            // --- (Opsional) Ambil Metadata dari Supabase ---
            let combinedItems: ManagedItem[] = googleDriveItems.map(gItem => ({ ...gItem, metadata: null })); // Default tanpa metadata

            if (googleDriveItems.length > 0) {
                const itemIds = googleDriveItems.map(item => item.id);

                // Tentukan tabel metadata berdasarkan tipe item (jika tabel terpisah)
                // Atau jika satu tabel, query langsung
                // Contoh sederhana: Query kedua tabel (folder & file) jika ada pemisahan
                try {
                    const { data: folderMeta, error: folderMetaError } = await supabase
                        .from('folder') // Asumsi tabel metadata folder
                        .select('id, description, color, labels')
                        .in('id', itemIds)
                        .eq('workspace_id', targetWorkspaceId)
                        .eq('user_id', targetUserId);
                    if (folderMetaError) console.warn("Supabase folder meta error:", folderMetaError.message);

                    const { data: fileMeta, error: fileMetaError } = await supabase
                        .from('file') // Asumsi tabel metadata file
                        .select('id, description, color, labels')
                        .in('id', itemIds)
                        .eq('workspace_id', targetWorkspaceId)
                        .eq('user_id', targetUserId);
                    if (fileMetaError) console.warn("Supabase file meta error:", fileMetaError.message);

                    // Gabungkan metadata ke item
                    const metadataMap = new Map<string, Partial<SupabaseItemMetadata>>();
                    if (folderMeta) folderMeta.forEach(meta => metadataMap.set(meta.id, meta));
                    if (fileMeta) fileMeta.forEach(meta => metadataMap.set(meta.id, meta)); // Timpa jika ID sama (tidak mungkin jika ID GDrive unik)

                    combinedItems = googleDriveItems.map(gItem => ({
                        ...gItem,
                        metadata: (metadataMap.get(gItem.id) as SupabaseItemMetadata | null) || null // Tambahkan metadata jika ada
                    }));

                } catch (metaErr: any) {
                     // Tangani error saat fetch metadata, tapi jangan sampai menggagalkan load item GDrive
                     console.error("Gagal mengambil metadata Supabase:", metaErr);
                     setFolderError(prev => prev ? `${prev}\nWarning: Gagal memuat detail tambahan.` : `Warning: Gagal memuat detail tambahan.`);
                }
            }
            // Update state dengan item yang sudah digabung (atau hanya item GDrive jika tak ada metadata)
            setItemsInCurrentFolder(combinedItems);

        } catch (err: any) {
            console.error("Error fetching Google Drive folder content:", err);
            setFolderError(`Gagal memuat isi folder: ${err.message}`);
            setItemsInCurrentFolder([]); // Kosongkan jika gagal total
        } finally {
            setIsLoadingFolderContent(false); // Selesai loading isi folder
        }
    }, [accessToken, makeApiCall, supabase]); // Dependency: token, helper API, supabase client

    // Handler: Dipanggil saat tombol '>' (ChevronRight) di item workspace diklik
    const handleSelectWorkspaceForBrowse = (workspace: Workspace) => {
        // Validasi user (meski harusnya sudah login)
        if (!user?.id) return;

        console.log("Masuk mode Browse untuk workspace:", workspace.name, `(ID: ${workspace.id})`);

        // Set state untuk mode Browse
        setSelectedWorkspaceForBrowse(workspace);     // Tandai workspace yg dipilih
        setCurrentFolderId(workspace.id);             // Folder awal = root workspace
        setCurrentFolderName(workspace.name);           // Nama folder awal
        setFolderPath([{ id: workspace.id, name: workspace.name }]); // Inisialisasi breadcrumb
        setIsBrowseWorkspace(true);                 // Aktifkan mode browser
        setItemsInCurrentFolder([]);                  // Kosongkan item dari browse sebelumnya (jika ada)
        setFolderError(null);                         // Reset error folder
        setNewSubFolderName('');                      // Reset input folder baru

        // Panggil fungsi untuk mengambil isi folder root workspace
        fetchFolderContent(workspace.id, workspace.id, user.id);

        // Panggil callback jika ada komponen parent yg perlu tahu
        // if (onWorkspaceSelected) onWorkspaceSelected(workspace.id);
    };

    // Handler: Dipanggil saat item FOLDER di dalam browser diklik
    const viewFolderContents = (folderId: string, folderName: string) => {
        // Validasi user & state Browse
        if (!user?.id || !selectedWorkspaceForBrowse) return;

        console.log(`Navigasi ke folder: ${folderName} (ID: ${folderId})`);

        // Update state navigasi
        setCurrentFolderId(folderId);
        setCurrentFolderName(folderName);
        setFolderPath(prev => [...prev, { id: folderId, name: folderName }]); // Tambahkan ke path breadcrumb
        setItemsInCurrentFolder([]); // Kosongkan tampilan sebelum memuat yg baru
        setFolderError(null);       // Reset error
        setNewSubFolderName('');    // Reset input

        // Ambil isi folder yang diklik
        fetchFolderContent(folderId, selectedWorkspaceForBrowse.id, user.id);
    };

     // Handler: Dipanggil saat item BREADCRUMB diklik
    const navigateToFolder = (folderIdToGo: string, folderIndexInPath: number) => {
        // Validasi user & state Browse
        if (!user?.id || !selectedWorkspaceForBrowse) return;

        // Jangan lakukan apa-apa jika mengklik breadcrumb terakhir (folder saat ini)
        if (folderIndexInPath === folderPath.length - 1) return;

        console.log(`Navigasi via breadcrumb ke index ${folderIndexInPath}: ${folderPath[folderIndexInPath].name} (ID: ${folderIdToGo})`);

        // Potong path breadcrumb sesuai index yang diklik
        const newPath = folderPath.slice(0, folderIndexInPath + 1);
        const targetFolder = newPath[newPath.length - 1]; // Folder tujuan adalah elemen terakhir path baru

        // Update state navigasi
        setFolderPath(newPath);
        setCurrentFolderId(targetFolder.id);
        setCurrentFolderName(targetFolder.name);
        setItemsInCurrentFolder([]); // Kosongkan tampilan
        setFolderError(null);       // Reset error
        setNewSubFolderName('');    // Reset input

        // Ambil isi folder tujuan
        fetchFolderContent(targetFolder.id, selectedWorkspaceForBrowse.id, user.id);
    };

    // Handler: Membuat folder baru di dalam folder yang sedang di-browse
    const handleCreateSubFolder = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Cegah submit form

        // Validasi input & state
        if (!newSubFolderName.trim() || !accessToken || !user?.id || !currentFolderId || !selectedWorkspaceForBrowse) {
            setFolderError("Nama folder tidak boleh kosong atau sesi tidak valid.");
            return;
        }

        setIsLoadingFolderContent(true); // Gunakan loading isi folder
        setFolderError(null);
        try {
           // Siapkan body request ke Google Drive API
           const body = {
               name: newSubFolderName.trim(),                     // Nama folder dari input
               mimeType: 'application/vnd.google-apps.folder',   // Tipe item = folder
               parents: [currentFolderId]                         // Parent = folder yg sedang dibuka
           };
           // Panggil API untuk membuat folder
           const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', body);

           // Jika sukses, reset input dan refresh tampilan folder saat ini
           if (createdFolder) {
               setNewSubFolderName(''); // Kosongkan input
               // Panggil fetchFolderContent lagi untuk refresh
               fetchFolderContent(currentFolderId, selectedWorkspaceForBrowse.id, user.id);
           } else {
               // Seharusnya tidak terjadi jika API call berhasil, tapi jaga-jaga
               throw new Error("Pembuatan folder berhasil tetapi tidak ada data folder yang diterima.");
           }
        } catch (err: any) {
            setFolderError(`Gagal membuat folder: ${err.message}`);
            setIsLoadingFolderContent(false); // Matikan loading jika error di sini (fetch tidak dipanggil)
        }
        // State loading akan otomatis false jika fetchFolderContent dipanggil dan selesai
    };


    // Handler: Keluar dari mode browser kembali ke daftar workspace
    const handleExitBrowse = () => {
        console.log("Keluar dari mode Browse.");
        setIsBrowseWorkspace(false);                  // Matikan mode browser
        setSelectedWorkspaceForBrowse(null);          // Hapus workspace yg dipilih
        setCurrentFolderId(null);                     // Reset ID folder
        setCurrentFolderName(null);                   // Reset nama folder
        setFolderPath([]);                            // Kosongkan path breadcrumb
        setItemsInCurrentFolder([]);                  // Kosongkan item
        setFolderError(null);                         // Reset error folder
        setNewSubFolderName('');                      // Reset input folder baru
        // Tidak perlu loadWorkspaces lagi karena datanya sudah ada di state
    };

    // --- Render ---
    // Tampilkan loading awal jika user atau akun Google belum siap
    if (!user?.id) return <div className="flex justify-center items-center h-screen">Memuat data pengguna...</div>;
    if (!account) return <div className="flex justify-center items-center h-screen">Menghubungkan ke akun Google... (Pastikan popup tidak diblokir)</div>;
    // if (!accessToken) return <div className="flex justify-center items-center h-screen">Menunggu token akses Google...</div>; // Bisa ditambahkan jika perlu

    // Kirim semua state dan handler yang relevan ke komponen UI
    return (
        <WorkspaceSelectorUI
            // Props untuk Daftar Workspace & Form Tambah
            error={workspaceError}
            newWorkspaceLink={newWorkspaceLink}
            setNewWorkspaceLink={setNewWorkspaceLink}
            workspaces={workspaces}
            isLoading={isLoadingWorkspaces || isAddingWorkspace} // Loading jika memuat daftar ATAU menambah
            isAdding={isAddingWorkspace}
            accessToken={accessToken} // Mungkin dibutuhkan UI untuk disable input
            handleAddWorkspace={handleAddWorkspace}
            handleRemoveWorkspace={handleRemoveWorkspace}
            // handleSelectWorkspaceForBrowse={handleSelectWorkspaceForBrowse} // Handler utama untuk klik '>'
            newWorkspaceName={newWorkspaceName}
            setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor}
            setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={color}

            // Props untuk Browser Folder Terintegrasi
            // isBrowseWorkspace={isBrowseWorkspace}
            // selectedWorkspaceForBrowse={selectedWorkspaceForBrowse}
            // itemsInCurrentFolder={itemsInCurrentFolder}
            // isLoadingFolderContent={isLoadingFolderContent}
            // folderError={folderError}
            // folderPath={folderPath}
            // currentFolderName={currentFolderName} // Kirim nama folder saat ini untuk UI
            // handleCreateSubFolder={handleCreateSubFolder}
            // viewFolderContents={viewFolderContents}
            // navigateToFolder={navigateToFolder}
            // handleExitBrowse={handleExitBrowse}
            // newSubFolderName={newSubFolderName}
            // setNewSubFolderName={setNewSubFolderName}

            // Prop handleSelectWorkspace asli tidak dipakai lagi untuk navigasi utama,
            // tapi mungkin masih dirujuk di UI, jadi pass no-op atau fungsi kosong.
            handleSelectWorkspace={() => { console.warn("handleSelectWorkspace dipanggil, seharusnya tidak dipakai untuk navigasi utama lagi.")}}
        />
    );
};

export default WorkspaceSelector;
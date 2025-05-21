// src/components/WorkspaceSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useUser } from "@stackframe/stack";
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import WorkspaceSelectorUI from './workspace-selector-ui'; // Import komponen UI
import { toast } from 'sonner'; // Impor toast untuk notifikasi
import router from 'next/router';

// --- Definisi Tipe Data ---
// Tipe data dari Google Drive API (Tetap Sama)
interface GoogleDriveFile {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
    webViewLink?: string; // Ditambahkan di UI sebelumnya, pastikan ada jika dipakai
}
interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; nextPageToken?: string; }
interface GoogleDriveFileDetail { id: string; name: string; mimeType: string; }

// Tipe data Metadata dari Supabase (Tetap Sama)
interface SupabaseItemMetadata { id: string; workspace_id: string; user_id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
export interface ManagedItem extends GoogleDriveFile { metadata?: SupabaseItemMetadata | null; }
export interface FolderPathItem { id: string; name: string; }

// --- Tipe data Workspace dari Supabase (DIPERBARUI) ---
export interface Workspace { // Langsung definisikan tipe lengkap di sini
    id: string;          // ID Folder GDrive (PK)
    user_id: string;     // User ID (PK)
    url: string;         // URL GDrive asli
    name: string;        // Nama workspace
    color?: string | null;// Warna profil
    is_self_workspace: boolean; // <<< FLAG KEPEMILIKAN DITAMBAHKAN >>>
}


// --- Konstanta ---
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

// Palet warna default untuk workspace baru
const defaultColors: { [key: string]: string } = { // Ganti nama variabel 'color' agar tidak konflik
    "blue": 'bg-blue-500', "green": 'bg-green-500', "red": 'bg-red-500',
    "yellow": 'bg-yellow-500', "purple": 'bg-purple-500', "pink": 'bg-pink-500',
    "indigo": 'bg-indigo-500', "gray": 'bg-gray-500',
};

// Props komponen
interface WorkspaceSelectorProps {
    onWorkspaceUpdate: (workspaceExists: boolean) => void;
    // Callback ini tidak digunakan di UI terakhir, tapi pertahankan jika perlu
    onWorkspaceSelected?: (workspace: Workspace) => void;
}

// --- Komponen Utama ---
const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ onWorkspaceUpdate, onWorkspaceSelected }) => {
    // --- Hooks & Autentikasi ---
    const user = useUser();
    const app = useUser();
    const account = user ? user.useConnectedAccount('google', {
        scopes: ['https://www.googleapis.com/auth/drive']
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State Daftar Workspace (Gunakan Tipe Workspace yang diperbarui) ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]); // <<< Tipe diperbarui
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    const [isAddingWorkspace, setIsAddingWorkspace] = useState<boolean>(false);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
    const [newWorkspaceColor, setNewWorkspaceColor] = useState<string>(Object.values(defaultColors)[0] || 'bg-gray-500'); // Ambil nilai warna pertama

    // --- Helper Panggil API Google (Tetap Sama) ---
    const makeApiCall = useCallback(async <T = any>(
    url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
): Promise<T | null> => {
    if (!accessToken) {
        setWorkspaceError("Akses token Google tidak tersedia. Silakan coba login kembali.");
        // Pertimbangkan redirect langsung jika ini adalah kondisi kritis
        // router.push('/masuk?error=no_token_wsel');
        return null;
    }

    const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
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
            try { errorData = await response.json(); } catch (e) {}
            const message = errorData?.error?.message || errorData?.message || errorData?.error_description || response.statusText || `HTTP error ${response.status}`;

            if (response.status === 401 || response.status === 403) {
                // Token tidak valid atau kedaluwarsa, atau masalah izin
                setWorkspaceError("Sesi Google Anda telah berakhir atau izin tidak memadai. Anda akan diarahkan ke halaman login.");
                toast.error("Sesi Berakhir", { description: "Silakan masuk kembali." });
                try {
                    await app?.signOut();
                } catch (signOutError) {
                    console.error("Error saat sign out dari StackFrame (WorkspaceSelector):", signOutError);
                }
                router.push('/masuk');
                // Jika makeApiCall dipanggil dari dalam dialog, mungkin perlu menutup dialog tersebut
                // Contoh: if (setIsDialogComponentOpen) setIsDialogComponentOpen(false);
                return null; // Hentikan eksekusi
            }
            // Untuk error HTTP lainnya, lempar error agar ditangkap oleh blok catch
            throw new Error(`API Error (${response.status}): ${message}`);
        }

        if (response.status === 204) { return null; } // No Content
        return response.json() as Promise<T>;

    } catch (err: any) {
        // Menangkap error dari 'throw new Error' di atas atau error jaringan
        console.error(`Gagal ${method} ${url} (WorkspaceSelector):`, err.message);
        setWorkspaceError(err.message || 'Gagal menghubungi API Google.');
        return null;
    }
}, [accessToken, router, app, setWorkspaceError]); // <-- PERBARUI DEPENDENSI

    // --- Memuat Daftar Workspace dari Supabase (DIPERBARUI) ---
    const loadWorkspaces = useCallback(async () => {
        if (!user?.id || !accessToken) { return; }
        setIsLoadingWorkspaces(true); setWorkspaceError(null); let workspacesExist = false;

        try {
            const { data: supabaseWorkspaces, error: supabaseError } = await supabase
                .from('workspace')
                // <<< MINTA KOLOM is_self_workspace DARI SUPABASE >>>
                .select('id, user_id, url, name, color, is_self_workspace')
                .eq('user_id', user.id);

            if (supabaseError) { throw new Error(`Supabase Error: ${supabaseError.message}`); }

            // <<< Pastikan casting menggunakan tipe Workspace yang sudah ada is_self_workspace >>>
            const fetchedWorkspaces = (supabaseWorkspaces as Workspace[]) || [];
            setWorkspaces(fetchedWorkspaces);
            workspacesExist = fetchedWorkspaces.length > 0;

        } catch (err: any) {
            console.error("Gagal memuat workspaces:", err);
            setWorkspaceError(`Gagal memuat workspace: ${err.message}`);
            setWorkspaces([]); workspacesExist = false;
        } finally {
            setIsLoadingWorkspaces(false);
            onWorkspaceUpdate(workspacesExist); // Callback ke parent
        }
    }, [user?.id, accessToken, supabase, onWorkspaceUpdate]); // Tambahkan supabase dan onWorkspaceUpdate

    // Effect untuk memuat workspace saat user atau token siap - Tidak Diubah
    useEffect(() => {
        if (user?.id && accessToken) { loadWorkspaces(); }
    }, [user?.id, accessToken, loadWorkspaces]);


    // --- Fungsi CRUD Workspace ---
    const extractFolderIdFromLink = (link: string): string | null => { /* ... (sama) */ const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]{20,})/); return match ? match[1] : null; };

    // --- handleAddWorkspace (DIPERBARUI) ---
    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setWorkspaceError(null);
        if (!user?.id || !accessToken) { setWorkspaceError("User tidak terautentikasi."); return; }
        const folderId = extractFolderIdFromLink(newWorkspaceLink);
        if (!folderId) { setWorkspaceError("Link folder Google Drive tidak valid."); return; }
        if (workspaces.some(ws => ws.id === folderId)) { setWorkspaceError(`Workspace sudah ada.`); return; }

        setIsAddingWorkspace(true);
        try {
            const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            const folderDetails = await makeApiCall<GoogleDriveFileDetail>(verifyUrl);
            if (!folderDetails) { throw new Error(workspaceError || `Folder GDrive tidak ditemukan.`); }
            if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') { throw new Error(`Link bukan folder.`); }

            const workspaceName = newWorkspaceName.trim() || folderDetails.name;
            // <<< BUAT DATA DENGAN TIPE Workspace LENGKAP >>>
            const newWorkspaceData: Workspace = {
                id: folderDetails.id,
                user_id: user.id,
                url: newWorkspaceLink,
                name: workspaceName,
                color: newWorkspaceColor,
                is_self_workspace: true // <<< Set ke true saat menambah >>>
            };

            const { error: insertError } = await supabase.from('workspace').insert([newWorkspaceData]);
            if (insertError) { /* ... (error handling sama) ... */ if (insertError.code === '23505') { throw new Error(`Workspace ini sudah terdaftar (DB Constraint).`); } throw new Error(`Gagal simpan ke database: ${insertError.message}`); }
            else {
                toast.success(`Workspace "${workspaceName}" berhasil ditambahkan!`);
                // <<< Set state dengan tipe Workspace yang benar >>>
                setWorkspaces(prev => [...prev, newWorkspaceData]);
                setNewWorkspaceLink(''); setNewWorkspaceName(''); setNewWorkspaceColor(Object.values(defaultColors)[0]);
                onWorkspaceUpdate(true); // Callback ke parent
            }
        } catch (err: any) { /* ... (error handling sama) ... */ console.error("Error tambah workspace:", err); setWorkspaceError(`Gagal menambahkan workspace: ${err.message}`); }
        finally { setIsAddingWorkspace(false); }
    };

    // --- handleRemoveWorkspace (DIPERBARUI untuk callback) ---
    const handleRemoveWorkspace = async (idToRemove: string) => {
        if (!user?.id) { setWorkspaceError("User tidak terautentikasi."); return; }
        const workspaceToRemove = workspaces.find(ws => ws.id === idToRemove);
        // <<< Gunakan is_self_workspace untuk pesan konfirmasi >>>
        const confirmationMsg = workspaceToRemove?.is_self_workspace
            ? `Yakin hapus workspace "${workspaceToRemove?.name || idToRemove}" dari daftar Anda?\n(Folder asli di Google Drive TIDAK akan terhapus)`
            : `Yakin keluar dari workspace bersama "${workspaceToRemove?.name || idToRemove}"?\n(Anda akan kehilangan akses dari aplikasi ini)`;

        if (!window.confirm(confirmationMsg)) { return; }

        setIsLoadingWorkspaces(true); setWorkspaceError(null);
        let deleteError: any = null; let remainingWorkspacesExist = false;

        try {
            const { error } = await supabase.from('workspace').delete().match({ id: idToRemove, user_id: user.id });
            deleteError = error;
            if (deleteError) { throw new Error(`Supabase Delete Error: ${deleteError.message}`); }

            const updatedWorkspaces = workspaces.filter(ws => ws.id !== idToRemove);
            setWorkspaces(updatedWorkspaces);
            remainingWorkspacesExist = updatedWorkspaces.length > 0;
            toast.info(`Workspace "${workspaceToRemove?.name || idToRemove}" telah ${workspaceToRemove?.is_self_workspace ? 'dihapus dari daftar' : 'ditinggalkan'}.`);

        } catch (err: any) { /* ... (error handling sama) ... */ console.error("Error hapus/keluar workspace:", err); setWorkspaceError(`Gagal menghapus/keluar: ${err.message}`); }
        finally {
            setIsLoadingWorkspaces(false);
            // <<< Panggil callback SETELAH delete berhasil >>>
            if (!deleteError) {
                 onWorkspaceUpdate(remainingWorkspacesExist);
            }
        }
    };

     // --- Handler untuk Meneruskan Pemilihan Workspace ke Parent (jika diperlukan) ---
     // Fungsi ini dipanggil oleh UI ketika user mengklik item workspace di list
     const handleSelectWorkspace = (workspace: Workspace) => {
         console.log(`Workspace selected in logic component: ${workspace.name}`);
         // Panggil callback onWorkspaceSelected JIKA prop tersebut diberikan oleh parent
         if (onWorkspaceSelected) {
             onWorkspaceSelected(workspace);
         }
         // Anda mungkin ingin melakukan hal lain di sini, atau hanya mengandalkan parent
         // untuk bereaksi terhadap callback onWorkspaceSelected.
         // Misalnya, jika komponen ini *juga* bertanggung jawab untuk menampilkan
         // isi folder, Anda akan memanggil handleSelectWorkspaceForBrowse di sini.
         // Namun, berdasarkan UI terakhir, sepertinya pemilihan hanya untuk memberi tahu parent.
     };


    // --- Render ---
    if (!user?.id) return <div className="p-4 text-center text-gray-500">Memuat data pengguna...</div>;
    if (!account) return <div className="p-4 text-center text-gray-500">Menghubungkan ke akun Google...</div>;

    return (
        <WorkspaceSelectorUI
            error={workspaceError}
            newWorkspaceLink={newWorkspaceLink}
            setNewWorkspaceLink={setNewWorkspaceLink}
            // <<< Pass state 'workspaces' yang tipenya sudah benar >>>
            workspaces={workspaces}
            isLoading={isLoadingWorkspaces}
            isAdding={isAddingWorkspace}
            accessToken={accessToken}
            handleAddWorkspace={handleAddWorkspace}
            handleRemoveWorkspace={handleRemoveWorkspace}
            // <<< Pass handler pemilihan workspace ke UI >>>
            handleSelectWorkspace={handleSelectWorkspace}
            newWorkspaceName={newWorkspaceName}
            setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor}
            setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={defaultColors} // Kirim map warna
        />
    );
};

export default WorkspaceSelector;
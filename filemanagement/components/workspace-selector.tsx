// src/components/WorkspaceSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useUser } from "@stackframe/stack";
import GoogleDriveManager from './google-drive-manager';

// --- Definisi Tipe ---
interface Workspace {
    id: string;
    name: string;
}
// Tipe untuk respons detail file/folder dari Google API
interface GoogleDriveFileDetail {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
}
interface GoogleApiErrorDetail { domain?: string; reason?: string; message: string; }
interface GoogleApiError { code: number; message: string; errors: GoogleApiErrorDetail[]; }
interface GoogleApiErrorResponse { error: GoogleApiError; }

// --- Konstanta ---
const LOCAL_STORAGE_KEY = 'googleDriveWorkspaces';
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files'; // Perlu juga di sini

const WorkspaceSelector: React.FC = () => {
    const user = useUser({ or: 'redirect' });
    const account = user ? user.useConnectedAccount('google', {
      or: 'redirect',
      scopes: ['https://www.googleapis.com/auth/drive'] // Scope yang sama diperlukan di sini
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // --- Helper untuk memanggil Google API (Mirip dengan di GoogleDriveManager) ---
    // Anda bisa mengekstrak ini ke file utilitas terpisah jika mau
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
        if (!accessToken) {
          setError("Akses token tidak tersedia. Coba refresh halaman atau hubungkan ulang akun Google.");
          return null;
        }
        // ... (Implementasi sama seperti di GoogleDriveManager) ...
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
              let errorData: GoogleApiErrorResponse | { message: string } | string | null = null;
              try { errorData = await response.json(); } catch (e) { try { errorData = await response.text(); } catch(e2) { errorData = response.statusText; } }
              console.error("API Call Error Status:", response.status); console.error("API Call Error Data:", errorData);
              const message = (errorData && typeof errorData === 'object' && 'error' in errorData) ? (errorData as GoogleApiErrorResponse).error.message : (errorData && typeof errorData === 'object' && 'message' in errorData) ? (errorData as { message: string }).message : typeof errorData === 'string' ? errorData : `HTTP error ${response.status}`;
              throw new Error(`Error ${response.status}: ${message}`);
            }
            if (response.status === 204) { return null; }
            return response.json() as Promise<T>;
        } catch (err: any) {
            console.error(`Failed to ${method} ${url}:`, err);
            setError(`API Call Failed: ${err.message}`);
            return null; // Return null on failure
        }
    }, [accessToken]); // Bergantung pada accessToken

    // --- Fungsi untuk mengekstrak Folder ID dari URL ---
    const extractFolderIdFromLink = (link: string): string | null => {
        // Mencocokkan /folders/ID atau /drive/folders/ID
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    // --- Muat workspace dari localStorage saat komponen dimuat ---
    useEffect(() => {
        const storedWorkspaces = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedWorkspaces) {
            try {
                const parsedWorkspaces = JSON.parse(storedWorkspaces);
                // Validasi sederhana bahwa itu array
                if (Array.isArray(parsedWorkspaces)) {
                    setWorkspaces(parsedWorkspaces);
                } else {
                    console.warn("Invalid data found in localStorage for workspaces.");
                    localStorage.removeItem(LOCAL_STORAGE_KEY); // Hapus data invalid
                }
            } catch (e) {
                console.error("Failed to parse workspaces from localStorage:", e);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Hapus data corrupt
            }
        }
    }, []); // Hanya dijalankan sekali saat mount

    // --- Simpan workspace ke localStorage setiap kali berubah ---
    useEffect(() => {
        // Jangan simpan state awal yang kosong jika belum dimuat
        if (workspaces.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY)) {
             localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(workspaces));
        }
    }, [workspaces]);

    // --- Fungsi untuk menambah workspace ---
    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const folderId = extractFolderIdFromLink(newWorkspaceLink);

        if (!folderId) {
            setError("Format link Google Drive Folder tidak valid. Pastikan link mengandung '/folders/...'");
            return;
        }

        // Cek apakah workspace sudah ada
        if (workspaces.some(ws => ws.id === folderId)) {
            setError(`Workspace dengan ID ${folderId} sudah ada.`);
            setNewWorkspaceLink(''); // Kosongkan input
            return;
        }

        if (!accessToken) {
            setError("Akses token Google belum siap. Silakan tunggu atau refresh.");
            return;
        }

        setIsLoading(true);
        try {
            // Panggil API untuk mendapatkan detail folder (nama dan verifikasi tipe)
            const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            const folderDetails = await makeApiCall<GoogleDriveFileDetail>(url);

            if (folderDetails && folderDetails.mimeType === 'application/vnd.google-apps.folder') {
                const newWorkspace: Workspace = { id: folderDetails.id, name: folderDetails.name };
                setWorkspaces(prev => [...prev, newWorkspace]);
                setNewWorkspaceLink(''); // Kosongkan input setelah berhasil
            } else if (folderDetails) {
                setError(`Item dengan ID ${folderId} bukanlah sebuah folder.`);
            } else {
                // Jika makeApiCall return null dan tidak set error sebelumnya (misal token hilang saat request)
                 if(!error) setError(`Gagal memverifikasi folder dengan ID ${folderId}. Pastikan link benar dan Anda memiliki izin akses.`);
            }
        } catch (err: any) {
            // Error sudah di set oleh makeApiCall atau catch di sini
             console.error("Error adding workspace:", err);
             if (!error) setError(`Gagal menambahkan workspace: ${err.message}`); // Fallback error message
        } finally {
            setIsLoading(false);
        }
    };

    // --- Fungsi untuk menghapus workspace ---
    const handleRemoveWorkspace = (idToRemove: string) => {
        if (window.confirm(`Yakin ingin menghapus workspace ini dari daftar? (Folder di Google Drive tidak akan terhapus)`)) {
            setWorkspaces(prev => prev.filter(ws => ws.id !== idToRemove));
        }
    };

    // --- Fungsi untuk memilih workspace ---
    const handleSelectWorkspace = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setError(null); // Hapus error sebelumnya saat masuk workspace
    };

    // --- Fungsi untuk keluar dari workspace ---
    const handleExitWorkspace = () => {
        setSelectedWorkspace(null);
    };


    // --- Render Logic ---
    if (!user) return <div>Loading user data...</div>;
    if (!account) return <div>Connecting to Google... (Check console if stuck)</div>;
    // Tidak perlu menunggu accessToken di sini secara eksplisit,
    // karena aksi (add workspace) akan memeriksanya.

    // Jika workspace dipilih, tampilkan GoogleDriveManager
    if (selectedWorkspace) {
        return (
            <GoogleDriveManager
                workspaceRootId={selectedWorkspace.id}
                workspaceName={selectedWorkspace.name}
                onExitWorkspace={handleExitWorkspace}
            />
        );
    }

    // Jika tidak ada workspace yang dipilih, tampilkan daftar workspace
    return (
        <div>
            <h2>Pilih Workspace (Folder Google Drive)</h2>

            {/* Tampilkan Error jika ada */}
            {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px 0' }}>Error: {error}</p>}

            {/* Form Tambah Workspace Baru */}
            <form onSubmit={handleAddWorkspace} style={{ margin: '20px 0', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <label htmlFor="workspaceLink" style={{ display: 'block', marginBottom: '5px' }}>Tambahkan Workspace dari Link Folder Google Drive:</label>
                <input
                    id="workspaceLink"
                    type="url" // Tipe url untuk validasi dasar browser
                    value={newWorkspaceLink}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewWorkspaceLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    disabled={isLoading || !accessToken} // Disable jika loading atau token belum siap
                    required
                    style={{ width: '70%', minWidth: '250px', marginRight: '10px', padding: '8px' }}
                />
                <button type="submit" disabled={isLoading || !newWorkspaceLink.trim() || !accessToken}>
                    {isLoading ? 'Memverifikasi...' : '+ Tambah Workspace'}
                </button>
                 {!accessToken && <p style={{fontSize: '0.8em', color: 'orange', marginTop: '5px'}}>Menunggu koneksi Google...</p>}
            </form>

            {/* Daftar Workspace */}
            <h3>Daftar Workspace Tersimpan:</h3>
            {workspaces.length === 0 ? (
                <p>Belum ada workspace ditambahkan. Gunakan form di atas untuk menambahkan.</p>
            ) : (
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {workspaces.map((ws) => (
                        <li key={ws.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold', cursor: 'pointer', color: 'blue', textDecoration: 'underline' }} onClick={() => handleSelectWorkspace(ws)}>
                                📁 {ws.name} ({ws.id.substring(0, 8)}...) {/* Tampilkan nama dan sebagian ID */}
                            </span>
                            <button onClick={() => handleRemoveWorkspace(ws.id)} disabled={isLoading} style={{ color: 'red', background: 'none', border: '1px solid red', borderRadius:'3px', cursor: 'pointer', padding: '3px 8px' }}>
                                Hapus
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default WorkspaceSelector;
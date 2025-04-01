// src/components/GoogleDriveManager.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent, MouseEvent } from 'react';
import { useUser } from "@stackframe/stack"; // Sesuaikan path jika perlu

// --- Definisi Tipe ---
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; }
interface GoogleDriveFilesListResponse { kind: string; incompleteSearch: boolean; files: GoogleDriveFile[]; }
interface GoogleApiErrorDetail { domain?: string; reason?: string; message: string; }
interface GoogleApiError { code: number; message: string; errors: GoogleApiErrorDetail[]; }
interface GoogleApiErrorResponse { error: GoogleApiError; }

// --- Konstanta ---
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const GOOGLE_DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

// --- Props Baru ---
interface GoogleDriveManagerProps {
    workspaceRootId: string; // ID folder yang menjadi root workspace ini
    workspaceName: string;   // Nama workspace (untuk tampilan)
    onExitWorkspace: () => void; // Fungsi untuk kembali ke daftar workspace
}

const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({ workspaceRootId, workspaceName, onExitWorkspace }) => {
    const user = useUser({ or: 'redirect' });
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: ['https://www.googleapis.com/auth/drive']
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State Awal Disesuaikan ---
    const [files, setFiles] = useState<GoogleDriveFile[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string>(workspaceRootId); // Mulai dari workspaceRootId
    const [folderHistory, setFolderHistory] = useState<string[]>([workspaceRootId]); // History dimulai dari workspaceRootId
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState<string>('');
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [newName, setNewName] = useState<string>('');

    // --- makeApiCall (tetap sama) ---
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
        if (!accessToken) {
            console.error("Attempted API call without Access Token.");
            setError("Akses token tidak tersedia. Coba refresh halaman atau hubungkan ulang akun Google.");
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
              let errorData: GoogleApiErrorResponse | { message: string } | string | null = null;
              try { errorData = await response.json(); } catch (e) {
                try { errorData = await response.text(); } catch(e2) { errorData = response.statusText; }
              }
              console.error("API Call Error Status:", response.status);
              console.error("API Call Error Data:", errorData);
              const message = (errorData && typeof errorData === 'object' && 'error' in errorData) ? (errorData as GoogleApiErrorResponse).error.message
                             : (errorData && typeof errorData === 'object' && 'message' in errorData) ? (errorData as { message: string }).message
                             : typeof errorData === 'string' ? errorData
                             : `HTTP error ${response.status}`;
              throw new Error(`Error ${response.status}: ${message}`);
            }
            if (response.status === 204) { // No Content
              return null;
            }
            return response.json() as Promise<T>;
        } catch (err: any) {
            console.error(`Failed to ${method} ${url}:`, err);
            setError(`API Call Failed: ${err.message}`);
            // throw err; // Re-throw tidak perlu jika error sudah di-set
            return null; // Return null on failure after setting error
        }
    }, [accessToken]);

    // Fungsi fetchFiles (mengambil daftar file/folder)
    const fetchFiles = useCallback(async (folderId: string): Promise<void> => {
      // Hanya jalankan jika accessToken sudah ada
      if (!accessToken) {
        console.log("fetchFiles skipped: Access Token not available yet.");
        return;
      }
      setIsLoading(true); setError(null);
      console.log(`Workspaceing files for folder: ${folderId}`);
      const fields = "files(id, name, mimeType, parents)";
      const query = `'${folderId}' in parents and trashed=false`;
      const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=folder,name`;
      try {
        const data = await makeApiCall<GoogleDriveFilesListResponse>(url);
        setFiles(data?.files || []);
      } catch (err: any) {
        // Error sudah di-set di dalam makeApiCall, tapi bisa ditambahkan logging spesifik di sini
        console.error("Error specific to fetching files:", err);
        setFiles([]); // Kosongkan files jika gagal
      } finally {
        setIsLoading(false);
      }
    }, [makeApiCall, accessToken]); // Tambahkan accessToken sebagai dependency

    
    // Fungsi handleCreateFolder (membuat folder baru)
    const handleCreateFolder = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!newFolderName.trim() || !accessToken) return;
        setIsLoading(true); setError(null);
        const body = { name: newFolderName.trim(), mimeType: 'application/vnd.google-apps.folder', parents: [currentFolderId] };
        try {
            await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', body);
            setNewFolderName('');
            fetchFiles(currentFolderId); // Refresh list
        } catch (err: any) {
          console.error("Error creating folder:", err);
          // Error state sudah di-set oleh makeApiCall
        } finally {
            setIsLoading(false);
        }
    };

    // Fungsi handleDelete (menghapus file/folder)
    const handleDelete = async (itemId: string, itemName: string): Promise<void> => {
        if (!window.confirm(`Yakin ingin menghapus "${itemName}"?`) || !accessToken) return;
        setIsLoading(true); setError(null);
        const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${itemId}`;
        try {
            await makeApiCall(url, 'DELETE');
            fetchFiles(currentFolderId); // Refresh list
        } catch (err: any) {
            console.error("Error deleting item:", err);
            // Error state sudah di-set oleh makeApiCall
        } finally {
            setIsLoading(false);
        }
    };

    // Fungsi handleFileUpload (mengunggah file)
    const handleFileUpload = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!fileToUpload || !accessToken) return;
        setIsUploading(true); setIsLoading(true); setError(null);
        const metadata = { name: fileToUpload.name, parents: [currentFolderId] };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', fileToUpload);
        try {
            await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_UPLOAD_ENDPOINT, 'POST', formData, {}); // Headers dikosongkan krn FormData
            setFileToUpload(null);
            const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
            if (fileInput) fileInput.value = ''; // Reset input file
            fetchFiles(currentFolderId); // Refresh list
        } catch (err: any) {
            console.error("Error uploading file:", err);
            // Error state sudah di-set oleh makeApiCall
        } finally {
            setIsUploading(false);
            setIsLoading(false);
        }
    };

     // Fungsi startRename (memulai mode rename)
     const startRename = (item: GoogleDriveFile): void => {
       setRenameId(item.id);
       setNewName(item.name);
     };

     // Fungsi handleRename (menyimpan nama baru)
     const handleRename = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
         e.preventDefault();
         if (!renameId || !newName.trim() || !accessToken) return;
         setIsLoading(true); setError(null);
         const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${renameId}`;
         const body = { name: newName.trim() };
         try {
             await makeApiCall<GoogleDriveFile>(url, 'PATCH', body);
             setRenameId(null);
             setNewName('');
             fetchFiles(currentFolderId); // Refresh list
         } catch (err: any) {
            console.error("Error renaming item:", err);
            // Error state sudah di-set oleh makeApiCall
         } finally {
             setIsLoading(false);
         }
     };

     // Fungsi cancelRename (membatalkan rename)
     const cancelRename = () => {
        setRenameId(null);
        setNewName('');
     }

    // Fungsi navigateToFolder (pindah ke folder lain)
    const navigateToFolder = (folderId: string): void => {
        console.log(`Navigating to folder: ${folderId}`);
        setCurrentFolderId(folderId);
        // Hanya tambahkan ke history jika berbeda dari yang terakhir
        if (folderHistory[folderHistory.length - 1] !== folderId) {
          setFolderHistory(prevHistory => [...prevHistory, folderId]);
        }
    };

    // Fungsi navigateUp (kembali ke folder induk)
     const navigateUp = (): void => {
        // Hanya izinkan navigasi naik jika kita TIDAK berada di root workspace
        if (currentFolderId !== workspaceRootId && folderHistory.length > 1) {
            const newHistory = folderHistory.slice(0, -1);
            setFolderHistory(newHistory);
            const parentFolderId = newHistory[newHistory.length - 1];
            console.log(`Navigating up to folder: ${parentFolderId}`);
            setCurrentFolderId(parentFolderId);
        } else {
            console.log("Already at workspace root, cannot navigate up further using this button.");
            // Opsional: Beri feedback ke user bahwa mereka sudah di root workspace
        }
    };

  // --- Effects ---
  // Fetch files ketika accessToken atau currentFolderId berubah
  useEffect(() => {
    if (accessToken) {
      console.log("Access Token available, fetching files...");
      fetchFiles(currentFolderId);
    } else {
      console.log("Waiting for Access Token...");
      // Jika accessToken menjadi null setelah sebelumnya ada (misal: token expired),
      // mungkin perlu membersihkan state file atau menampilkan pesan.
      setFiles([]); // Kosongkan file jika token hilang
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, currentFolderId, fetchFiles]); // fetchFiles dimasukkan karena dibuat dgn useCallback

  // --- Render Logic ---
  // Tampilkan loading jika user atau account belum siap
  if (!user) {
      return <div>Loading user data...</div>;
  }
  // Tampilkan pesan jika proses koneksi Google sedang berlangsung (menunggu account)
  // atau jika token belum siap (menunggu accessToken).
  if (!account || !accessToken) return <div>Loading Google connection and access token... (Check console if stuck)</div>;


    // --- Render Utama Komponen ---
    return (
        <div>
            {/* Tombol Kembali ke Daftar Workspace */}
            <button onClick={onExitWorkspace} style={{ marginBottom: '15px', padding: '8px 12px', cursor: 'pointer' }}>
                ← Kembali ke Daftar Workspace
            </button>

            <h2>Workspace: {workspaceName}</h2>
            <p>Current Path ID: {currentFolderId === workspaceRootId ? '(Root)' : currentFolderId}</p>

            {/* Tombol Navigasi Naik - Hanya tampil jika tidak di root workspace */}
            {currentFolderId !== workspaceRootId && folderHistory.length > 1 && (
                <button onClick={navigateUp} disabled={isLoading} style={{ marginBottom: '10px' }}>
                    ⬆️ Go Up
                </button>
            )}

            {/* Tampilkan Error jika ada */}
            {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px 0' }}>Error: {error}</p>}

            {/* Form Buat Folder Baru */}
            <form onSubmit={handleCreateFolder} style={{ margin: '10px 0' }}>
                {/* ... input dan button ... */}
                <input type="text" value={newFolderName} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)} placeholder="Nama Folder Baru" disabled={isLoading} style={{ marginRight: '5px' }} />
                <button type="submit" disabled={isLoading || !newFolderName.trim()}>+ Buat Folder</button>
            </form>

            {/* Form Upload File */}
            <form onSubmit={handleFileUpload} style={{ margin: '10px 0' }}>
                {/* ... input dan button ... */}
                <input id="fileInput" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setFileToUpload(e.target.files ? e.target.files[0] : null)} disabled={isLoading || isUploading} style={{ marginRight: '5px' }} />
                <button type="submit" disabled={isLoading || isUploading || !fileToUpload}> {isUploading ? `Uploading...` : '⤒ Upload File'} </button>
            </form>

            {/* Daftar File dan Folder */}
            <h3>Files and Folders:</h3>
            {/* ... (Logic daftar file dan folder tetap sama) ... */}
            {isLoading && !isUploading ? <p>Loading list...</p> : (
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {files.map((item: GoogleDriveFile) => (
                    <li key={item.id} style={{ margin: '5px 0', borderBottom: '1px solid #eee', paddingBottom: '5px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                       {/* Bagian Nama Item */}
                       <div style={{ flexGrow: 1, minWidth: '150px' }}>
                           {renameId === item.id ? (
                               <form onSubmit={handleRename} style={{ display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
                                   <input type="text" value={newName} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} autoFocus disabled={isLoading} onBlur={cancelRename} style={{ marginRight: '5px' }}/>
                                   <button type="submit" disabled={isLoading || !newName.trim()}>Save</button>
                                   <button type="button" onClick={cancelRename} disabled={isLoading}>Cancel</button>
                               </form>
                           ) : (
                               <>
                                   <span style={{ marginRight: '5px', cursor: 'default' }}>{item.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄'}</span>
                                   {item.mimeType === 'application/vnd.google-apps.folder' ? (
                                       <a href="#" onClick={(e: MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); if (!isLoading) navigateToFolder(item.id); }} style={{ cursor: isLoading ? 'default' : 'pointer', wordBreak: 'break-all', textDecoration: isLoading ? 'none' : 'underline' }}>
                                           {item.name}
                                       </a>
                                   ) : (
                                       <span style={{ wordBreak: 'break-all' }}>{item.name}</span>
                                   )}
                               </>
                           )}
                       </div>
                       {/* Tombol Aksi */}
                       {renameId !== item.id && (
                           <div style={{ whiteSpace: 'nowrap' }}>
                               <button onClick={() => startRename(item)} disabled={isLoading} style={{ marginRight: '5px' }}>Rename</button>
                               <button onClick={() => handleDelete(item.id, item.name)} disabled={isLoading} style={{ color: 'red' }}>Delete</button>
                           </div>
                       )}
                    </li>
                  ))}
                </ul>
              )}
              { !isLoading && files.length === 0 && <p>Folder workspace ini kosong.</p> }
        </div>
    );
}

export default GoogleDriveManager;
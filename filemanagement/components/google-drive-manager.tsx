// src/components/GoogleDriveManager.tsx
'use client';

import { supabase } from '@/lib/supabaseClient';
import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent, CSSProperties } from 'react';

// --- Definisi Tipe ---
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; }
interface GoogleDriveFilesListResponse { kind: string; incompleteSearch: boolean; files: GoogleDriveFile[]; }
interface GoogleApiErrorDetail { domain?: string; reason?: string; message: string; }
interface GoogleApiError { code: number; message: string; errors: GoogleApiErrorDetail[]; }
interface GoogleApiErrorResponse { error: GoogleApiError; }

interface SupabaseItemMetadata {
    id: string;
    workspace_id: string;
    user_id: string;
    description?: string | null;
    color?: string | null;
    labels?: string[] | null;
}

interface ManagedItem extends GoogleDriveFile {
    metadata?: SupabaseItemMetadata | null;
}

interface ManagedFileWithParent extends GoogleDriveFile {
    parentFolderName: string;
    metadata?: SupabaseItemMetadata | null;
}

// --- Konstanta ---
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const GOOGLE_DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

// --- Props ---
interface GoogleDriveManagerProps {
    workspaceRootId: string;
    workspaceName: string;
    userId: string;
    accessToken: string | null;
    onExitWorkspace: () => void;
}

type BrowseState = 'listing_folders' | 'listing_files';

const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
    workspaceRootId,
    workspaceName,
    userId,
    accessToken,
    onExitWorkspace
}) => {
    // --- State Utama ---
    const [filesAndFolders, setFilesAndFolders] = useState<ManagedItem[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string>(workspaceRootId);
    const [folderHistory, setFolderHistory] = useState<string[]>([workspaceRootId]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState<string>('');
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [newName, setNewName] = useState<string>('');
    const [browseState, setBrowseState] = useState<BrowseState>('listing_folders');
    const [currentFolderName, setCurrentFolderName] = useState<string>(workspaceName);

    // --- State "File dari Folder Utama" ---
    const [filesInTopFolders, setFilesInTopFolders] = useState<ManagedFileWithParent[]>([]);
    const [isFetchingTopFolderFiles, setIsFetchingTopFolderFiles] = useState<boolean>(false);
    const [topFolderFilesError, setTopFolderFilesError] = useState<string | null>(null);
    const [showTopFolderFilesView, setShowTopFolderFilesView] = useState<boolean>(false);

    // --- State untuk Edit Metadata ---
    const [editingMetadataId, setEditingMetadataId] = useState<string | null>(null);
    const [editingDescription, setEditingDescription] = useState<string>('');
    const [editingColor, setEditingColor] = useState<string>('');
    const [editingLabels, setEditingLabels] = useState<string>('');

    // --- Helper: Panggil Google API ---
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
         if (!accessToken) {
           setError("Akses token Google tidak tersedia.");
           console.error("makeApiCall: Access Token is missing.");
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
              try { errorData = await response.json(); } catch (e) { try { errorData = await response.text(); } catch(e2) { errorData = response.statusText; } }
              console.error("API Call Error:", response.status, errorData);
              const message = errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : `HTTP error ${response.status}`);
              throw new Error(`API Error (${response.status}): ${message}`);
            }
            if (response.status === 204) { return null; }
            return response.json() as Promise<T>;
        } catch (err: any) {
             console.error(`Failed to ${method} ${url}:`, err);
             throw err;
         }
    }, [accessToken]);

    // --- Fetch Item Utama (GDrive + Supabase Metadata) ---
    const fetchItems = useCallback(async (folderId: string, state: BrowseState): Promise<void> => {
        if (!accessToken || !userId) {
            setError("Akses token atau User ID tidak tersedia.");
            setFilesAndFolders([]); setIsLoading(false); return;
        }
        setIsLoading(true); setError(null);
        console.log(`Workspaceing items for folder: ${folderId}, State: ${state}, User: ${userId}`);

        let googleDriveItems: GoogleDriveFile[] = [];
        try {
            const fields = "files(id, name, mimeType, parents)";
            let query = `'${folderId}' in parents and trashed=false`;
            query += state === 'listing_folders' ? ` and mimeType='application/vnd.google-apps.folder'` : ` and mimeType!='application/vnd.google-apps.folder'`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name`;

            const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);
            googleDriveItems = gDriveData?.files || [];

            if (folderId !== workspaceRootId && currentFolderName === workspaceName) {
                 const folderDetailUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=name`;
                 const folderDetails = await makeApiCall<{name: string}>(folderDetailUrl);
                 if (folderDetails) setCurrentFolderName(folderDetails.name);
            } else if (folderId === workspaceRootId) {
                setCurrentFolderName(workspaceName);
            }

        } catch (err: any) {
            console.error("Error fetching from Google Drive:", err);
            setError(`Gagal memuat item GDrive: ${err.message}`);
        }

        let combinedItems: ManagedItem[] = googleDriveItems.map(g => ({ ...g, metadata: null }));

        if (googleDriveItems.length > 0) {
            const itemIds = googleDriveItems.map(item => item.id);
            const tableName = state === 'listing_folders' ? 'folder' : 'file';

            console.log(`Workspaceing metadata from Supabase '${tableName}'...`);
            try {
                const { data: metadataList, error: metaError } = await supabase
                    .from(tableName)
                    .select('id, workspace_id, user_id, description, color, labels')
                    .in('id', itemIds)
                    .eq('workspace_id', workspaceRootId)
                    .eq('user_id', userId);

                if (metaError) {
                    throw new Error(`Supabase Metadata Error: ${metaError.message}`);
                }

                if (metadataList && metadataList.length > 0) {
                    const metadataMap = new Map(metadataList.map(meta => [meta.id, meta as SupabaseItemMetadata]));
                    combinedItems = googleDriveItems.map(gDriveItem => ({
                        ...gDriveItem,
                        metadata: metadataMap.get(gDriveItem.id) || null
                    }));
                }
                 console.log("Metadata fetched and merged.");

            } catch (metaErr: any) {
                console.error("Error fetching/merging Supabase metadata:", metaErr);
                setError(prev => prev ? `${prev}\nWarning: Gagal memuat detail tambahan.` : `Warning: Gagal memuat detail tambahan.`);
            }
        } else {
            console.log("No items found in Google Drive for this view.");
        }

        setFilesAndFolders(combinedItems);
        setIsLoading(false);

    }, [accessToken, userId, workspaceRootId, makeApiCall, currentFolderName, workspaceName]);

    // --- Navigasi ---
    const viewFilesInFolder = (folderId: string, folderName: string): void => {
        console.log(`Viewing files in folder: ${folderId} (${folderName})`);
        setCurrentFolderId(folderId);
        setCurrentFolderName(folderName);
        setBrowseState('listing_files');
        setFolderHistory(prevHistory => [...prevHistory, folderId]);
    };

    const navigateUp = (): void => {
        if (currentFolderId === workspaceRootId && browseState === 'listing_folders') return;

        if (browseState === 'listing_files') {
            setBrowseState('listing_folders');
        } else {
            if (folderHistory.length > 1) {
                const newHistory = folderHistory.slice(0, -1);
                const parentFolderId = newHistory[newHistory.length - 1];
                setFolderHistory(newHistory);
                setCurrentFolderId(parentFolderId);
                setCurrentFolderName(parentFolderId === workspaceRootId ? workspaceName : "[Parent Folder]");
            }
        }
    };

    // --- Aksi CRUD ---
     const refreshCurrentView = useCallback(() => {
         console.log(`Refreshing view for folder ${currentFolderId} with state ${browseState}`);
         fetchItems(currentFolderId, browseState);
     }, [currentFolderId, browseState, fetchItems]);

     const handleCreateFolder = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
         e.preventDefault();
         if (!newFolderName.trim() || !accessToken || !userId) return;
         if (browseState !== 'listing_folders') { setError("Hanya bisa buat folder di tampilan folder."); return; }
         setIsLoading(true); setError(null);
         try {
            const body = { name: newFolderName.trim(), mimeType: 'application/vnd.google-apps.folder', parents: [currentFolderId] };
            const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', body);
            if (createdFolder) {
                setNewFolderName('');
                refreshCurrentView();
            }
         } catch (err: any) { setError(`Gagal buat folder: ${err.message}`); }
         finally { setIsLoading(false); }
     };

     const handleDelete = async (itemId: string, itemName: string, itemType: 'folder' | 'file'): Promise<void> => {
         if (!window.confirm(`Yakin hapus "${itemName}"? Ini juga akan hapus metadata terkait di aplikasi.`) || !accessToken || !userId) return;
         setIsLoading(true); setError(null);
         let gDriveSuccess = false;
         try {
             const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${itemId}`;
             await makeApiCall(url, 'DELETE');
             gDriveSuccess = true;
             console.log(`GDrive item ${itemId} deleted.`);
         } catch (err: any) {
             console.error(`GDrive delete failed for ${itemId}:`, err);
             setError(`Gagal hapus dari GDrive: ${err.message}. Coba hapus metadata saja.`);
         }

         const tableName = itemType === 'folder' ? 'folder' : 'file';
         try {
             console.log(`Deleting metadata from '${tableName}' for ID: ${itemId}`);
             const { error: metaDeleteError } = await supabase
                 .from(tableName)
                 .delete()
                 .match({ id: itemId, user_id: userId, workspace_id: workspaceRootId });
             if (metaDeleteError) throw metaDeleteError;
             console.log(`Supabase metadata for ${itemId} deleted.`);
         } catch (metaErr: any) {
             console.error(`Supabase metadata delete failed for ${itemId}:`, metaErr);
             setError(prev => prev ? `${prev}\nError hapus metadata Supabase: ${metaErr.message}` : `Error hapus metadata Supabase: ${metaErr.message}`);
         } finally {
             setIsLoading(false);
             if (gDriveSuccess || window.confirm('GDrive delete mungkin gagal. Tetap refresh tampilan?')) {
                 refreshCurrentView();
             }
         }
     };

     const handleFileUpload = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
         if (!fileToUpload || !accessToken || !userId) return;
         if (browseState !== 'listing_files') { setError("Masuk ke folder dulu untuk upload."); return; }
         setIsUploading(true); setIsLoading(true); setError(null);
         try {
             const metadata = { name: fileToUpload.name, parents: [currentFolderId] };
             const formData = new FormData();
             formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
             formData.append('file', fileToUpload);
             const uploadedFile = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_UPLOAD_ENDPOINT, 'POST', formData, {});
             if (uploadedFile) {
                 setFileToUpload(null);
                 const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
                 if (fileInput) fileInput.value = '';
                 refreshCurrentView();
             }
         } catch (err: any) { setError(`Gagal upload file: ${err.message}`); }
         finally { setIsUploading(false); setIsLoading(false); }
     };

     const startRename = (item: ManagedItem): void => { setRenameId(item.id); setNewName(item.name); setError(null); };
     const cancelRename = () => { setRenameId(null); setNewName(''); };

     const handleRename = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
         e.preventDefault();
         if (!renameId || !newName.trim() || !accessToken) return;
         setIsLoading(true); setError(null);
         try {
             const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${renameId}`;
             const body = { name: newName.trim() };
             const renamedItem = await makeApiCall<GoogleDriveFile>(url, 'PATCH', body);
             if (renamedItem) {
                 setRenameId(null); setNewName('');
                 refreshCurrentView();
             }
         } catch (err: any) { setError(`Gagal rename: ${err.message}`); }
         finally { setIsLoading(false); }
     };

    // --- Metadata Handling ---
    const startEditMetadata = (item: ManagedItem) => {
        setEditingMetadataId(item.id);
        setEditingDescription(item.metadata?.description || '');
        setEditingColor(item.metadata?.color || '');
        setEditingLabels(item.metadata?.labels?.join(',') || '');
        setError(null);
    };

    const cancelEditMetadata = () => {
        setEditingMetadataId(null);
        setEditingDescription('');
        setEditingColor('');
        setEditingLabels('');
    };

    const handleSaveMetadata = async (e: FormEvent<HTMLFormElement>, itemId: string, itemType: 'folder' | 'file') => {
        e.preventDefault();
        if (!userId) return;
        setIsLoading(true); setError(null);
        const tableName = itemType === 'folder' ? 'folder' : 'file';
        const labelsArray = editingLabels.split(',').map(label => label.trim()).filter(label => label !== '');

        try {
            const { data, error: updateError } = await supabase
                .from(tableName)
                .upsert([
                    {
                        id: itemId,
                        workspace_id: workspaceRootId,
                        user_id: userId,
                        description: editingDescription,
                        color: editingColor,
                        labels: labelsArray,
                    }
                ], { onConflict: 'id,workspace_id' });

            if (updateError) {
                throw new Error(`Gagal menyimpan metadata: ${updateError.message}`);
            }

            setEditingMetadataId(null);
            setEditingDescription('');
            setEditingColor('');
            setEditingLabels('');
            refreshCurrentView();

        } catch (err: any) {
            setError(`Gagal menyimpan metadata: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Fetch Files dari Top-Level Folders ---
    const fetchFilesInTopFolders = useCallback(async (): Promise<void> => {
        if (!accessToken || !userId) {
            setTopFolderFilesError("Token atau User ID tidak tersedia."); return;
        }
        setIsFetchingTopFolderFiles(true); setTopFolderFilesError(null); setFilesInTopFolders([]);
        let accumulatedErrors: string[] = [];
        let allGDriveFiles: ManagedFileWithParent[] = [];

        try {
            const foldersQuery = `'${workspaceRootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const foldersUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(foldersQuery)}&fields=files(id,name)&orderBy=name`;
            const topFoldersResponse = await makeApiCall<GoogleDriveFilesListResponse>(foldersUrl);
            const topFolders = topFoldersResponse?.files || [];
            if (topFolders.length === 0) { setIsFetchingTopFolderFiles(false); return; }

            const fileFetchPromises = topFolders.map(async (folder) => {
                const filesQuery = `'${folder.id}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`;
                const filesUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(filesQuery)}&fields=files(id,name,mimeType)&orderBy=name`;
                try {
                     const filesResponse = await makeApiCall<GoogleDriveFilesListResponse>(filesUrl);
                     return filesResponse?.files?.map(file => ({ ...file, parentFolderName: folder.name, metadata: null })) || [];
                } catch (innerErr: any) {
                     accumulatedErrors.push(`Gagal ambil file dari "${folder.name}": ${innerErr.message}`); return [];
                }
            });
            const results = await Promise.all(fileFetchPromises);
            allGDriveFiles = results.flat();

        } catch (err: any) {
             console.error("Error fetching top folders/files GDrive:", err);
             accumulatedErrors.push(`Error GDrive: ${err.message}`);
        }

        if (allGDriveFiles.length > 0) {
            const fileIds = allGDriveFiles.map(file => file.id);
            try {
                const { data: metadataList, error: metaError } = await supabase
                    .from('file')
                    .select('id, workspace_id, user_id, description, color, labels')
                    .in('id', fileIds)
                    .eq('workspace_id', workspaceRootId)
                    .eq('user_id', userId);
                if (metaError) throw metaError;

                if (metadataList && metadataList.length > 0) {
                    const metadataMap = new Map(metadataList.map(meta => [meta.id, meta as SupabaseItemMetadata]));
                    allGDriveFiles = allGDriveFiles.map(file => ({ ...file, metadata: metadataMap.get(file.id) || null }));
                }
            } catch (metaErr: any) {
                console.error("Error fetching Supabase metadata for top files:", metaErr);
                accumulatedErrors.push(`Warning: Gagal memuat detail tambahan: ${metaErr.message}`);
            }
        }

        setFilesInTopFolders(allGDriveFiles);
        setIsFetchingTopFolderFiles(false);
        if (accumulatedErrors.length > 0) {
             setTopFolderFilesError(accumulatedErrors.join('\n'));
        }

    }, [accessToken, userId, workspaceRootId, makeApiCall]);

    const handleShowTopFolderFiles = () => { setShowTopFolderFilesView(true); fetchFilesInTopFolders(); };

    // --- Effects ---
    useEffect(() => {
        if (accessToken && userId) {
            fetchItems(currentFolderId, browseState);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, userId, currentFolderId, browseState]);

    // --- Render Helpers ---
    const getItemStyle = (item: ManagedItem | ManagedFileWithParent): CSSProperties => ({
        backgroundColor: item.metadata?.color || 'transparent',
        padding: '8px', margin: '8px 0', border: '1px solid #f0f0f0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
    });

    const renderLabels = (labels: string[] | null | undefined) => {
        if (!labels || labels.length === 0) return null;
        return (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                {labels.map((label, index) => (
                    <span key={index} style={{ backgroundColor: '#e0e0e0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75em' }}>
                        {label}
                    </span>
                ))}
            </div>
        );
    };

    // --- Render Utama ---
    if (!userId || !accessToken) {
        return <div>Memeriksa otentikasi dan koneksi Google...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
             {/* Header & Navigasi */}
            <button onClick={onExitWorkspace} style={{ marginBottom: '15px', padding: '8px 12px' }}>← Kembali</button>
            <h2>Workspace: {workspaceName}</h2>
            <p style={{ fontStyle: 'italic', color: '#555' }}>
                Lokasi: {workspaceName} / {currentFolderName !== workspaceName ? `${currentFolderName} /` : ''}
                ({browseState === 'listing_folders' ? 'Lihat Folder' : 'Lihat File'})
            </p>
            {(currentFolderId !== workspaceRootId || browseState === 'listing_files') && (
                 <button onClick={navigateUp} disabled={isLoading} style={{ marginBottom: '10px' }}>↑ Naik</button>
            )}

             {/* Error & Loading Utama */}
            {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px 0', whiteSpace: 'pre-wrap'}}>Error: {error}</p>}
            {isLoading && !isUploading && <p>Memuat...</p>}

            {/* Forms CRUD Kontekstual */}
             {!isLoading && browseState === 'listing_folders' && (
                <form onSubmit={handleCreateFolder} style={{ margin: '10px 0', padding: '10px', border: '1px solid #eee' }}>
                    <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nama Folder Baru" required disabled={isLoading}/>
                    <button type="submit" disabled={isLoading || !newFolderName.trim()}>+ Buat Folder</button>
                </form>
             )}
             {!isLoading && browseState === 'listing_files' && (
                <form onSubmit={handleFileUpload} style={{ margin: '10px 0', padding: '10px', border: '1px solid #eee' }}>
                    <input id="fileInput" type="file" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} required disabled={isUploading || isLoading} />
                    <button type="submit" disabled={isUploading || isLoading || !fileToUpload}>{isUploading ? 'Mengupload...' : 'Upload File'}</button>
                </form>
             )}

            {/* Daftar Item Utama */}
             {!isLoading && filesAndFolders.length === 0 && <p>Tidak ada item di sini.</p>}
             {!isLoading && filesAndFolders.length > 0 && (
                 <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '20px' }}>
                     {filesAndFolders.map((item) => (
                         <li key={item.id} style={getItemStyle(item)}>
                             {renameId === item.id ? (
                                 <form onSubmit={handleRename} style={{ flexGrow: 1, display: 'flex', gap: '5px' }}>
                                     <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={cancelRename} autoFocus required style={{ flexGrow: 1 }} />
                                     <button type="submit" disabled={isLoading}>Simpan</button>
                                     <button type="button" onClick={cancelRename} disabled={isLoading}>Batal</button>
                                 </form>
                             ) : editingMetadataId === item.id ? (
                                 <form onSubmit={(e) => handleSaveMetadata(e, item.id, item.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file')} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                     <div>
                                         <label htmlFor={`description-${item.id}`} style={{ display: 'block', fontSize: '0.9em', color: '#333' }}>Deskripsi:</label>
                                         <textarea id={`description-${item.id}`} value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9em' }} />
                                     </div>
                                     <div>
                                         <label htmlFor={`color-${item.id}`} style={{ display: 'block', fontSize: '0.9em', color: '#333' }}>Warna:</label>
                                         <input type="color" id={`color-${item.id}`} value={editingColor} onChange={(e) => setEditingColor(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                     </div>
                                     <div>
                                         <label htmlFor={`labels-${item.id}`} style={{ display: 'block', fontSize: '0.9em', color: '#333' }}>Label (pisahkan dengan koma):</label>
                                         <input type="text" id={`labels-${item.id}`} value={editingLabels} onChange={(e) => setEditingLabels(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9em' }} />
                                     </div>
                                     <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                         <button type="submit" disabled={isLoading}>Simpan Detail</button>
                                         <button type="button" onClick={cancelEditMetadata} disabled={isLoading}>Batal</button>
                                     </div>
                                 </form>
                             ) : (
                                 <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                         {item.mimeType === 'application/vnd.google-apps.folder' ? (
                                             <span style={{ fontWeight: 'bold', cursor: 'pointer', color: 'blue' }} onClick={() => viewFilesInFolder(item.id, item.name)}>📁 {item.name}</span>
                                         ) : (
                                             <span>📄 {item.name}</span>
                                         )}
                                         <button onClick={() => startRename(item)} disabled={isLoading} style={{ fontSize: '0.8em' }}>Rename</button>
                                         <button onClick={() => handleDelete(item.id, item.name, item.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file')} disabled={isLoading} style={{ color: 'red' }}>Hapus</button>
                                         <button onClick={() => startEditMetadata(item)} disabled={isLoading} style={{ fontSize: '0.8em', fontStyle: 'italic' }}>Edit Details</button>
                                     </div>
                                     {item.metadata?.description && <p style={{ fontSize: '0.85em', color: '#444', margin: '4px 0 0 0', fontStyle: 'italic' }}>{item.metadata.description}</p>}
                                     {renderLabels(item.metadata?.labels)}
                                 </div>
                             )}
                         </li>
                     ))}
                 </ul>
             )}

            {/* Section File dari Folder Utama */}
             <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #aaa' }}>
                 <h3>File dari Folder Utama di "{workspaceName}"</h3>
                 <button onClick={handleShowTopFolderFiles} disabled={isLoading || isFetchingTopFolderFiles || !accessToken}>
                     {isFetchingTopFolderFiles ? 'Memuat...' : 'Tampilkan / Refresh'}
                 </button>
                 {showTopFolderFilesView && (
                     <div style={{ marginTop: '15px' }}>
                         {isFetchingTopFolderFiles && <p>Mencari file...</p>}
                         {topFolderFilesError && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>Error: {topFolderFilesError}</p>}
                         {!isFetchingTopFolderFiles && !topFolderFilesError && filesInTopFolders.length === 0 && <p>Tidak ada file ditemukan.</p>}
                         {!isFetchingTopFolderFiles && filesInTopFolders.length > 0 && (
                             <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                 <thead><tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}><th style={{ padding: '8px', width: '45%' }}>File & Details</th><th style={{ padding: '8px', width: '55%' }}>Folder Induk</th></tr></thead>
                                 <tbody>
                                     {filesInTopFolders.map(file => (
                                         <tr key={file.id} style={{ borderBottom: '1px solid #eee', backgroundColor: file.metadata?.color || 'transparent' }}>
                                             <td style={{ padding: '8px', wordWrap: 'break-word' }}>
                                                 <div>📄 {file.name}</div>
                                                 {file.metadata?.description && <p style={{ fontSize: '0.85em', fontStyle: 'italic', color: '#444', margin: '4px 0 0 0' }}>{file.metadata.description}</p>}
                                                 {renderLabels(file.metadata?.labels)}
                                             </td>
                                             <td style={{ padding: '8px', color: '#555', wordWrap: 'break-word' }}>📁 {file.parentFolderName}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         )}
                     </div>
                 )}
             </div>
        </div>
    );
};

export default GoogleDriveManager;
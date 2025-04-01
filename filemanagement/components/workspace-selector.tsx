'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useUser } from "@stackframe/stack"; // Pastikan path import benar
import GoogleDriveManager from './google-drive-manager'; // Pastikan path import benar
import { supabase } from '@/lib/supabaseClient';

// --- Definisi Tipe ---

interface WorkspaceSupabaseData {
    id: string;
    user_id: string;
    url: string;
    color?: string | null;
}

interface Workspace extends WorkspaceSupabaseData {
    name: string;
}

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
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

const WorkspaceSelector: React.FC = () => {
    // --- Hooks & Auth ---
    const user = useUser({ or: 'redirect' });
    const account = user ? user.useConnectedAccount('google', {
      or: 'redirect',
      scopes: ['https://www.googleapis.com/auth/drive']
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State Komponen ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // --- State untuk Edit Warna ---
    const [editingColorId, setEditingColorId] = useState<string | null>(null);
    const [editColor, setEditColor] = useState<string>('#ffffff'); // Default color

    // --- Helper: Panggil Google API ---
    const makeApiCall = useCallback(async <T = any>(
        url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
    ): Promise<T | null> => {
        if (!accessToken) {
          setError("Akses token Google tidak tersedia.");
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
              const message: any = errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : `Error ${response.status}}`);
              throw new Error(`Error ${response.status}: ${message}`);
            }
            if (response.status === 204) { return null; }
            return response.json() as Promise<T>;
        } catch (err: any) {
            console.error(`Failed to ${method} ${url}:`, err);
            throw err;
        }
    }, [accessToken]);

    // --- Helper: Ekstrak Folder ID dari Link ---
    const extractFolderIdFromLink = (link: string): string | null => {
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    // --- Muat Workspace dari Supabase ---
    const loadWorkspaces = useCallback(async () => {
        if (!user?.id || !accessToken) {
            if (workspaces.length === 0) setIsLoading(true);
            return;
        }

        console.log("Loading workspaces from Supabase for user:", user.id);
        setIsLoading(true);
        setError(null);

        try {
            const { data: supabaseWorkspaces, error: supabaseError } = await supabase
                .from('workspace')
                .select('id, user_id, url, color')
                .eq('user_id', user.id);

            if (supabaseError) {
                throw new Error(`Supabase Error: ${supabaseError.message}`);
            }

            if (!supabaseWorkspaces || supabaseWorkspaces.length === 0) {
                setWorkspaces([]);
                setIsLoading(false);
                return;
            }

            const workspaceDetailsPromises = supabaseWorkspaces.map(async (wsData) => {
                const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${wsData.id}?fields=id,name`;
                try {
                    const folderDetails = await makeApiCall<{ id: string, name: string }>(url);
                    if (folderDetails) {
                        return { ...wsData, name: folderDetails.name } as Workspace;
                    } else {
                         console.warn(`Could not fetch name for workspace ID ${wsData.id}. It might be deleted or inaccessible.`);
                         return { ...wsData, name: `[Folder Tidak Ditemukan: ${wsData.id.substring(0,5)}...]` } as Workspace;
                    }
                } catch (fetchError: any) {
                    console.error(`Error fetching name for workspace ${wsData.id}:`, fetchError);
                    return { ...wsData, name: `[Error Fetching Name: ${wsData.id.substring(0,5)}...]` } as Workspace;
                }
            });

            const resolvedWorkspaces = await Promise.all(workspaceDetailsPromises);
            setWorkspaces(resolvedWorkspaces);

        } catch (err: any) {
            console.error("Failed to load workspaces:", err);
            setError(`Gagal memuat workspace: ${err.message}`);
            setWorkspaces([]);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, accessToken, makeApiCall]);

    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    const handleAddWorkspace = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!user?.id || !accessToken) {
             setError("User atau koneksi Google belum siap.");
             return;
         }

        const folderId = extractFolderIdFromLink(newWorkspaceLink);
        if (!folderId) {
            setError("Format link Google Drive Folder tidak valid.");
            return;
        }

        if (workspaces.some(ws => ws.id === folderId)) {
            setError(`Workspace dengan ID ${folderId} sudah ada.`);
            setNewWorkspaceLink('');
            return;
        }

        setIsAdding(true);

        try {
            const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            const folderDetails = await makeApiCall<GoogleDriveFileDetail>(url);

            if (!folderDetails) {
                throw new Error(`Gagal memverifikasi folder ID ${folderId}. Pastikan link benar dan Anda punya akses.`);
            }
            if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') {
                 throw new Error(`Item dengan ID ${folderId} bukan folder.`);
            }

            const newWorkspaceData: Omit<WorkspaceSupabaseData, 'color'> = {
                id: folderDetails.id,
                user_id: user.id,
                url: newWorkspaceLink,
            };

            const { error: insertError } = await supabase
                .from('workspace')
                .insert([newWorkspaceData]);

            if (insertError) {
                if (insertError.code === '23505') {
                     setError(`Workspace dengan ID ${folderId} sudah ada di database Anda.`);
                } else {
                    throw new Error(`Supabase Insert Error: ${insertError.message}`);
                }
            } else {
                const newWorkspaceForState: Workspace = {
                    ...newWorkspaceData,
                    name: folderDetails.name,
                    color: null
                };
                setWorkspaces(prev => [...prev, newWorkspaceForState]);
                setNewWorkspaceLink('');
            }

        } catch (err: any) {
            console.error("Error adding workspace:", err);
            setError(`Gagal menambahkan workspace: ${err.message}`);
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveWorkspace = async (idToRemove: string) => {
        if (!user?.id) {
             setError("User tidak terautentikasi.");
             return;
         }

        if (window.confirm(`Yakin ingin menghapus workspace ini dari daftar? (Folder di Google Drive tidak akan terhapus, tapi metadata terkait di aplikasi ini akan hilang)`)) {
             setIsLoading(true);
             setError(null);

             try {
                const { error: deleteError } = await supabase
                    .from('workspace')
                    .delete()
                    .match({ id: idToRemove, user_id: user.id });

                if (deleteError) {
                    throw new Error(`Supabase Delete Error: ${deleteError.message}`);
                }

                setWorkspaces(prev => prev.filter(ws => ws.id !== idToRemove));
                if (selectedWorkspace?.id === idToRemove) {
                    setSelectedWorkspace(null);
                }
                console.log(`Workspace ${idToRemove} removed successfully.`);

             } catch (err: any) {
                 console.error("Error removing workspace:", err);
                 setError(`Gagal menghapus workspace: ${err.message}`);
             } finally {
                setIsLoading(false);
             }
        }
    };

    const handleSelectWorkspace = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setError(null);
    };
    const handleExitWorkspace = () => {
        setSelectedWorkspace(null);
    };

    const startEditColor = (workspaceId: string, currentColor: string | null | undefined) => {
        setEditingColorId(workspaceId);
        setEditColor(currentColor || '#ffffff');
    };

    const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
        setEditColor(event.target.value);
    };

    const saveWorkspaceColor = async (workspaceId: string) => {
        if (!user?.id) {
            setError("User tidak terautentikasi.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('workspace')
                .update({ color: editColor })
                .match({ id: workspaceId, user_id: user.id });

            if (updateError) {
                throw new Error(`Gagal menyimpan warna: ${updateError.message}`);
            }

            // Update state secara langsung untuk responsif UI
            setWorkspaces(prev =>
                prev.map(ws =>
                    ws.id === workspaceId ? { ...ws, color: editColor } : ws
                )
            );
            setEditingColorId(null);
            console.log(`Warna workspace ${workspaceId} diperbarui menjadi ${editColor}`);

        } catch (err: any) {
            console.error("Error saving workspace color:", err);
            setError(`Gagal menyimpan warna workspace: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const cancelEditColor = () => {
        setEditingColorId(null);
    };

    if (!user?.id) return <div>Memuat data pengguna...</div>;
    if (!account) return <div>Menghubungkan ke akun Google... (Pastikan popup tidak diblokir)</div>;

    if (selectedWorkspace) {
        if (!accessToken) return <div>Menunggu token akses Google...</div>;
        return (
            <GoogleDriveManager
                workspaceRootId={selectedWorkspace.id}
                workspaceName={selectedWorkspace.name}
                userId={user.id}
                accessToken={accessToken}
                onExitWorkspace={handleExitWorkspace}
            />
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Pilih Workspace (Folder Google Drive)</h2>

            {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px 0' }}>Error: {error}</p>}

            <form onSubmit={handleAddWorkspace} style={{ margin: '20px 0', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <label htmlFor="workspaceLink" style={{ display: 'block', marginBottom: '5px' }}>Tambahkan Link Folder Google Drive:</label>
                <input
                    id="workspaceLink"
                    type="url"
                    value={newWorkspaceLink}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewWorkspaceLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    disabled={isAdding || isLoading || !accessToken}
                    required
                    style={{ width: '70%', minWidth: '250px', marginRight: '10px', padding: '8px' }}
                />
                <button type="submit" disabled={isAdding || isLoading || !newWorkspaceLink.trim() || !accessToken}>
                    {isAdding ? 'Memverifikasi...' : '+ Tambah'}
                </button>
                 {(!accessToken && !isAdding && !isLoading) && <p style={{fontSize: '0.8em', color: 'orange', marginTop: '5px'}}>Menunggu koneksi Google...</p>}
            </form>

            <h3>Daftar Workspace Tersimpan:</h3>
            {isLoading && <p>Memuat daftar workspace...</p>}
            {!isLoading && workspaces.length === 0 && (
                <p>Belum ada workspace. Tambahkan menggunakan form di atas.</p>
            )}
            {!isLoading && workspaces.length > 0 && (
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {workspaces.map((ws) => (
                        <li key={ws.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', backgroundColor: ws.color || 'transparent' }}>
                            <span style={{ fontWeight: 'bold', cursor: 'pointer', color: 'blue', textDecoration: 'underline', wordBreak: 'break-word' }} onClick={() => handleSelectWorkspace(ws)}>
                                📁 {ws.name} <span style={{fontSize: '0.8em', color: '#666'}}>({ws.id.substring(0, 8)}...)</span>
                            </span>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {editingColorId === ws.id ? (
                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                        <input type="color" value={editColor} onChange={handleColorChange} style={{ height: '30px', width: '50px' }} />
                                        <button onClick={() => saveWorkspaceColor(ws.id)} disabled={isLoading} style={{ fontSize: '0.8em' }}>Simpan</button>
                                        <button onClick={cancelEditColor} disabled={isLoading} style={{ fontSize: '0.8em' }}>Batal</button>
                                    </div>
                                ) : (
                                    <button onClick={() => startEditColor(ws.id, ws.color)} disabled={isLoading} style={{ background: 'none', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer', padding: '3px 8px', fontSize: '0.8em' }}>
                                        Pilih Warna
                                    </button>
                                )}
                                <button onClick={() => handleRemoveWorkspace(ws.id)} disabled={isLoading} style={{ color: 'red', background: 'none', border: '1px solid red', borderRadius:'3px', cursor: 'pointer', padding: '3px 8px', flexShrink: 0 }}>
                                    Hapus
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default WorkspaceSelector;
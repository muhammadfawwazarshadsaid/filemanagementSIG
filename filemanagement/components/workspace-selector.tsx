'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useUser } from "@stackframe/stack";
import GoogleDriveManager from './google-drive-manager';
import { supabase } from '@/lib/supabaseClient';
import WorkspaceSelectorUI from './workspace-selector-ui';

interface WorkspaceSupabaseData {
    id: string;
    user_id: string;
    url: string;
    name: string;
    color?: string | null;
}

export interface Workspace extends WorkspaceSupabaseData {}

interface GoogleDriveFileDetail {
    kind: string;
    id: string;
    name: string;
    mimeType: string;
}
interface GoogleApiErrorDetail { domain?: string; reason?: string; message: string; }
interface GoogleApiError { code: number; message: string; errors: GoogleApiErrorDetail[]; }
interface GoogleApiErrorResponse { error: GoogleApiError; }

const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

const color = {
    "color1": 'bg-blue-500',
    "color2": 'bg-green-500',
    "color3": 'bg-red-500',
    "color4": 'bg-gray-500',
    "color5": 'bg-purple-500',
    "color6": 'bg-orange-500',
};

interface WorkspaceSelectorProps { // Tambahkan interface props
    onWorkspaceSelected?: () => void;
    setWorkspaces?: React.Dispatch<React.SetStateAction<{ id: string; name: string; }[]>>;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ onWorkspaceSelected }) => { // Gunakan interface props
    const user = useUser({ or: 'redirect' });
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: ['https://www.googleapis.com/auth/drive']
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
    const [newWorkspaceColor, setNewWorkspaceColor] = useState<string>(color.color1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [editingColorId, setEditingColorId] = useState<string | null>(null);
    const [editColor, setEditColor] = useState<string>('#ffffff');

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
                const message = errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : `Error ${response.status}`);
                throw new Error(`Error ${response.status}: ${message}`);
            }
            if (response.status === 204) { return null; }
            return response.json() as Promise<T>;
        } catch (err: any) {
            console.error(`Failed to ${method} ${url}:`, err);
            throw err;
        }
    }, [accessToken]);

    const extractFolderIdFromLink = (link: string): string | null => {
        const match = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

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
                .select('id, user_id, url, name, color')
                .eq('user_id', user.id);

            if (supabaseError) {
                throw new Error(`Supabase Error: ${supabaseError.message}`);
            }

            if (!supabaseWorkspaces || supabaseWorkspaces.length === 0) {
                setWorkspaces([]);
                setIsLoading(false);
                return;
            }

            setWorkspaces(supabaseWorkspaces as Workspace[]);

        } catch (err: any) {
            console.error("Failed to load workspaces:", err);
            setError(`Gagal memuat workspace: ${err.message}`);
            setWorkspaces([]);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, accessToken]);

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

            const workspaceName = newWorkspaceName.trim() !== '' ? newWorkspaceName : folderDetails.name;

            const newWorkspaceData: Omit<WorkspaceSupabaseData, 'color'> & Pick<WorkspaceSupabaseData, 'color'> = {
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
                    setError(`Workspace dengan ID ${folderId} sudah ada di database Anda.`);
                } else {
                    throw new Error(`Supabase Insert Error: ${insertError.message}`);
                }
            } else {
                const newWorkspaceForState: Workspace = {
                    ...newWorkspaceData,
                };
                setWorkspaces(prev => [...prev, newWorkspaceForState]);
                setNewWorkspaceLink('');
                setNewWorkspaceName('');
                // onWorkspaceSelected() ; // Panggil callback setelah berhasil menambahkan
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

        if (window.confirm(`Yakin ingin menghapus workspace "${workspaces.find(ws => ws.id === idToRemove)?.name}" dari daftar? (Folder di Google Drive tidak akan terhapus, tapi metadata terkait di aplikasi ini akan hilang)`)) {
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
        // onWorkspaceSelected(); // Panggil callback saat workspace dipilih
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
        <WorkspaceSelectorUI
            error={error}
            newWorkspaceLink={newWorkspaceLink}
            setNewWorkspaceLink={setNewWorkspaceLink}
            workspaces={workspaces}
            isLoading={isLoading}
            isAdding={isAdding}
            accessToken={accessToken}
            // editingColorId={editingColorId}
            // editColor={editColor}
            handleAddWorkspace={handleAddWorkspace}
            handleRemoveWorkspace={handleRemoveWorkspace}
            handleSelectWorkspace={handleSelectWorkspace}
            // handleColorChange={handleColorChange}
            // saveWorkspaceColor={saveWorkspaceColor}
            // cancelEditColor={cancelEditColor}
            // startEditColor={startEditColor}
            newWorkspaceName={newWorkspaceName}
            setNewWorkspaceName={setNewWorkspaceName}
            newWorkspaceColor={newWorkspaceColor}
            setNewWorkspaceColor={setNewWorkspaceColor}
            availableColors={color}
        />
    );
};

export default WorkspaceSelector;
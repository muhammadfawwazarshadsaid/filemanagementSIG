// src/components/WorkspaceFolderSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ManagedItem } from './google-drive-manager'; // Import ManagedItem type

interface WorkspaceFolderSelectorProps {
    workspaceRootId: string;
    workspaceName: string;
    userId: string;
    accessToken: string | null;
    onFolderSelected: (folderId: string, folderName: string) => void; // Callback saat folder dipilih
}

interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; }
interface GoogleDriveFilesListResponse { kind: string; incompleteSearch: boolean; files: GoogleDriveFile[]; }

const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

const WorkspaceFolderSelector: React.FC<WorkspaceFolderSelectorProps> = ({
    workspaceRootId,
    workspaceName,
    userId,
    accessToken,
    onFolderSelected
}) => {
    const [folders, setFolders] = useState<ManagedItem[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    const fetchFolders = useCallback(async () => {
        if (!accessToken || !userId || !workspaceRootId) {
            setError("Informasi otentikasi atau Workspace tidak lengkap.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const query = `'${workspaceRootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const fields = "files(id, name)";
            const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name`;
            const response = await makeApiCall<GoogleDriveFilesListResponse>(url);
            setFolders(response?.files as ManagedItem[] || []);
        } catch (err: any) {
            console.error("Gagal memuat folder:", err);
            setError(`Gagal memuat folder di workspace: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, userId, workspaceRootId, makeApiCall]);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    const handleFolderChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const folderId = event.target.value;
        const selectedFolder = folders.find(f => f.id === folderId);
        if (selectedFolder) {
            setSelectedFolderId(folderId);
            onFolderSelected(folderId, selectedFolder.name);
        } else {
            setSelectedFolderId(null);
            onFolderSelected('', ''); // Atau logika lain jika tidak ada yang dipilih
        }
    };

    const handleCreateFolder = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newFolderName.trim() || !accessToken || !userId || !workspaceRootId) return;
        setIsLoading(true);
        setError(null);
        try {
            const body = { name: newFolderName.trim(), mimeType: 'application/vnd.google-apps.folder', parents: [workspaceRootId] };
            const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', body);
            if (createdFolder) {
                setNewFolderName('');
                fetchFolders(); // Refresh daftar folder setelah membuat
            }
        } catch (err: any) {
            setError(`Gagal membuat folder: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2>Pilih atau Buat Folder di Workspace "{workspaceName}"</h2>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {isLoading && <p>Memuat folder...</p>}

            <div>
                <label htmlFor="folderSelect">Pilih Folder:</label>
                <select id="folderSelect" onChange={handleFolderChange} value={selectedFolderId || ''}>
                    <option value="" disabled>-- Pilih Folder --</option>
                    {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Buat Folder Baru:</h3>
                <form onSubmit={handleCreateFolder}>
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Nama Folder Baru"
                        required
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !newFolderName.trim()}>Buat</button>
                </form>
            </div>
        </div>
    );
};

export default WorkspaceFolderSelector;
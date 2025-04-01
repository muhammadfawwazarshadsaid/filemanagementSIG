// src/components/WorkspaceSelectorUI.tsx
import React, { ChangeEvent, FormEvent } from 'react';
import { Workspace } from './workspace-selector'; // Pastikan path import benar

interface WorkspaceSelectorUIProps {
    error: string | null;
    newWorkspaceLink: string;
    setNewWorkspaceLink: React.Dispatch<React.SetStateAction<string>>; // Tambahkan ini
    workspaces: Workspace[];
    isLoading: boolean;
    isAdding: boolean;
    accessToken: string | null;
    editingColorId: string | null;
    editColor: string;
    handleAddWorkspace: (e: FormEvent<HTMLFormElement>) => Promise<void>; // Perbaiki tipe ini
    handleRemoveWorkspace: (idToRemove: string) => Promise<void>;
    handleSelectWorkspace: (workspace: Workspace) => void;
    handleColorChange: (event: ChangeEvent<HTMLInputElement>) => void;
    saveWorkspaceColor: (workspaceId: string) => Promise<void>;
    cancelEditColor: () => void;
    startEditColor: (workspaceId: string, currentColor: string | null | undefined) => void;
}

const WorkspaceSelectorUI: React.FC<WorkspaceSelectorUIProps> = ({
    error,
    newWorkspaceLink,
    setNewWorkspaceLink, // Tambahkan ini
    workspaces,
    isLoading,
    isAdding,
    accessToken,
    editingColorId,
    editColor,
    handleAddWorkspace,
    handleRemoveWorkspace,
    handleSelectWorkspace,
    handleColorChange,
    saveWorkspaceColor,
    cancelEditColor,
    startEditColor,
}) => {
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

export default WorkspaceSelectorUI;
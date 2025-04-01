// src/components/GoogleDriveManagerUI.tsx
import React, { ChangeEvent, FormEvent, CSSProperties } from 'react';
import { ManagedFileWithParent, ManagedItem } from './google-drive-manager'; // Pastikan path import benar

interface GoogleDriveManagerUIProps {
    workspaceName: string;
    currentFolderName: string;
    browseState: 'listing_folders' | 'listing_files';
    currentFolderId: string;
    workspaceRootId: string;
    error: string | null;
    isLoading: boolean;
    isUploading: boolean;
    filesAndFolders: ManagedItem[];
    renameId: string | null;
    newName: string;
    setNewName: React.Dispatch<React.SetStateAction<string>>; // Tambahkan ini
    editingMetadataId: string | null;
    editingDescription: string;
    setEditingDescription: React.Dispatch<React.SetStateAction<string>>; // Tambahkan ini
    editingColor: string;
    setEditingColor: React.Dispatch<React.SetStateAction<string>>; // Tambahkan ini
    editingLabels: string;
    setEditingLabels: React.Dispatch<React.SetStateAction<string>>; // Tambahkan ini
    filesInTopFolders: ManagedFileWithParent[];
    isFetchingTopFolderFiles: boolean;
    topFolderFilesError: string | null;
    showTopFolderFilesView: boolean;
    onExitWorkspace: () => void;
    navigateUp: () => void;
    handleCreateFolder: (e: FormEvent<HTMLFormElement>) => Promise<void>;
    handleFileUpload: (e: FormEvent<HTMLFormElement>) => Promise<void>;
    viewFilesInFolder: (folderId: string, folderName: string) => void;
    startRename: (item: ManagedItem) => void;
    cancelRename: () => void;
    handleRename: (e: FormEvent<HTMLFormElement>) => Promise<void>;
    handleDelete: (itemId: string, itemName: string, itemType: 'folder' | 'file') => Promise<void>; // Tambahkan ini
    startEditMetadata: (item: ManagedItem) => void;
    cancelEditMetadata: () => void;
    handleSaveMetadata: (e: FormEvent<HTMLFormElement>, itemId: string, itemType: 'folder' | 'file') => Promise<void>;
    handleShowTopFolderFiles: () => void;
    getItemStyle: (item: ManagedItem | ManagedFileWithParent) => CSSProperties;
    renderLabels: (labels: string[] | null | undefined) => React.ReactNode;
    setNewFolderName: React.Dispatch<React.SetStateAction<string>>;
    newFolderName: string;
    setFileToUpload: React.Dispatch<React.SetStateAction<File | null>>;
}

const GoogleDriveManagerUI: React.FC<GoogleDriveManagerUIProps> = ({
    workspaceName,
    currentFolderName,
    browseState,
    currentFolderId,
    workspaceRootId,
    error,
    isLoading,
    isUploading,
    filesAndFolders,
    renameId,
    newName,
    setNewName, // Tambahkan ini
    editingMetadataId,
    editingDescription,
    setEditingDescription, // Tambahkan ini
    editingColor,
    setEditingColor, // Tambahkan ini
    editingLabels,
    setEditingLabels, // Tambahkan ini
    filesInTopFolders,
    isFetchingTopFolderFiles,
    topFolderFilesError,
    showTopFolderFilesView,
    onExitWorkspace,
    navigateUp,
    handleCreateFolder,
    handleFileUpload,
    viewFilesInFolder,
    startRename,
    cancelRename,
    handleRename,
    handleDelete, // Tambahkan ini
    startEditMetadata,
    cancelEditMetadata,
    handleSaveMetadata,
    handleShowTopFolderFiles,
    getItemStyle,
    renderLabels,
    setNewFolderName,
    newFolderName,
    setFileToUpload,
}) => {
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
                    <button type="submit" disabled={isUploading || isLoading || !setFileToUpload}>{isUploading ? 'Mengupload...' : 'Upload File'}</button>
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
                 <button onClick={handleShowTopFolderFiles} disabled={isLoading || isFetchingTopFolderFiles}>
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

export default GoogleDriveManagerUI;
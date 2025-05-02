// src/components/folder-selector-ui.tsx
import React from 'react';
// Impor ikon dan komponen UI yang diperlukan
import {
    Building2, ChevronRight, Loader2, Trash, Folder, File as FileIcon, Home,
    Plus, MoreHorizontal, Trash2, Edit, Tag, FileText, FolderPlus, X, Save, AlertTriangle,
    Ellipsis,
    FolderCog2Icon,
    LucideFolderUp,
    Pencil,
    FileStack, // Added for file count
    Ban // <-- Impor ikon Ban
} from 'lucide-react';
import { Label } from './ui/label'; // Asumsi path benar
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from './ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from './ui/dialog'; // Impor komponen Dialog
import { Textarea } from './ui/textarea'; // Untuk deskripsi
// Update ManagedItem to potentially include fileCount
import { Workspace, ManagedItem as OriginalManagedItem, FolderPathItem } from './folder-selector'; // <-- Sesuaikan path jika perlu
// import { FoldersMenu } from './recentfiles/folders-menu'; // Komen jika tidak dipakai
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // <-- Ganti path import jika perlu
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Extend ManagedItem to include optional file count & is_self_folder
interface ManagedItem extends OriginalManagedItem {
    fileCount?: number; // Optional: Number of files inside the folder
    is_self_folder?: boolean | null; // <-- Tambahkan dari FolderSelector
}

// Interface props diperbarui - Tambahkan currentFolderIsSelf
interface FolderSelectorUIProps {
    // Props Utama Workspace
    error: string | null;
    newWorkspaceLink: string;
    setNewWorkspaceLink: React.Dispatch<React.SetStateAction<string>>;
    workspaces: Workspace[];
    isLoading: boolean; // Loading utama (list/add workspace)
    isAdding: boolean; // Adding workspace
    accessToken: string | null;
    handleAddWorkspace: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    handleRemoveWorkspace: (idToRemove: string) => Promise<void>;
    handleSelectWorkspaceForBrowse: (workspace: Workspace) => void;
    newWorkspaceName: string;
    setNewWorkspaceName: React.Dispatch<React.SetStateAction<string>>;
    newWorkspaceColor: "" | string;
    setNewWorkspaceColor: React.Dispatch<React.SetStateAction<string>>;
    availableColors: { [key: string]: string };

    // Props untuk Folder Browser & Manager
    selectedWorkspaceForBrowse: Workspace | null;
    itemsInCurrentFolder: ManagedItem[]; // Use extended ManagedItem
    isLoadingFolderContent: boolean; // Loading spesifik folder content
    folderError: string | null; // Error spesifik folder content/action
    folderPath: FolderPathItem[]; // Untuk breadcrumbs
    onNavigate: (folderId: string, folderName: string) => void; // Klik sub-folder
    onNavigateBreadcrumb: (folderId: string, index: number) => void; // Klik breadcrumb

    // Props Aksi CRUD & Dialog
    isProcessingFolderAction: boolean; // Loading saat CRUD folder
    currentFolderIsSelf: boolean; // <--- TAMBAHKAN PROPERTI INI
    onTriggerAddFolder: () => void;
    onTriggerAllFolder: () => void;
    onTriggerRenameFolder: (folder: ManagedItem) => void;
    onTriggerEditMetadata: (folder: ManagedItem) => void;
    onTriggerDeleteFolder: (folder: ManagedItem) => void;

    // State & Handler Dialog Add Folder
    isAddFolderDialogOpen: boolean;
    setIsAddFolderDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAllFolderDialogOpen: boolean;
    setIsAllFolderDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    newFolderName: string;
    setNewFolderName: React.Dispatch<React.SetStateAction<string>>;
    addDescription: string;
    setAddDescription: React.Dispatch<React.SetStateAction<string>>;
    addLabels: string[];
    setAddLabels: React.Dispatch<React.SetStateAction<string[]>>;
    handleAddFolderAction: () => Promise<void>;

    addFolderColor: string;
    setAddFolderColor: React.Dispatch<React.SetStateAction<string>>;
    editFolderColor: string;
    setEditFolderColor: React.Dispatch<React.SetStateAction<string>>;

    // State & Handler Dialog Rename Folder
    isRenameDialogOpen: boolean;
    setIsRenameDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    folderBeingManaged: ManagedItem | null; // Untuk konteks dialog
    editFolderName: string;
    setEditFolderName: React.Dispatch<React.SetStateAction<string>>;
    handleRenameFolderAction: () => Promise<void>;

    // State & Handler Dialog Edit Metadata
    isEditMetadataDialogOpen: boolean;
    setIsEditMetadataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editDescription: string;
    setEditDescription: React.Dispatch<React.SetStateAction<string>>;
    editLabels: string[];
    setEditLabels: React.Dispatch<React.SetStateAction<string[]>>; // Kelola sebagai array
    handleEditMetadataAction: () => Promise<void>;

    // State & Handler Dialog Delete Folder
    isDeleteDialogOpen: boolean;
    setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleDeleteFolderAction: () => Promise<void>;
}

// Helper untuk input tag/label (sederhana) - MODIFIED to add '#' prefix
const TagsInput: React.FC<{ value: string[], onChange: (tags: string[]) => void, disabled?: boolean }> = ({ value, onChange, disabled }) => {
    const [inputValue, setInputValue] = React.useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim().replace(/^#/, '');
            if (newTag && !value.includes(newTag)) {
                onChange([...value, newTag]); // Store without '#'
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove)); // Remove based on original value
    };

    return (
        <div>
            <div className="flex flex-wrap gap-1 mb-2">
                {/* Add '#' prefix when displaying */}
                {value.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        #{tag}
                        {!disabled && (
                            <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-500 hover:text-red-600">
                                <X size={12} />
                            </button>
                        )}
                    </Badge>
                ))}
            </div>
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? '' : "Ketik label lalu Enter/koma..."}
                disabled={disabled}
                className="text-sm"
            />
        </div>
    );
};


const FolderSelectorUI: React.FC<FolderSelectorUIProps> = ({
    // Props Workspace
    error: workspaceMainError,
    newWorkspaceLink, setNewWorkspaceLink, workspaces, isLoading: isLoadingWorkspaces, isAdding: isAddingWorkspace,
    handleAddWorkspace, handleRemoveWorkspace, handleSelectWorkspaceForBrowse,
    newWorkspaceName, setNewWorkspaceName, newWorkspaceColor, setNewWorkspaceColor, availableColors,

    // Props Folder Browser & Manager
    selectedWorkspaceForBrowse, itemsInCurrentFolder, isLoadingFolderContent, folderError,
    folderPath, onNavigate, onNavigateBreadcrumb,

    // Props Aksi CRUD & Dialog
    isProcessingFolderAction,
    currentFolderIsSelf, // <-- Ambil prop baru
    onTriggerAddFolder, onTriggerAllFolder, onTriggerRenameFolder, onTriggerEditMetadata, onTriggerDeleteFolder,

    // Dialog Add
    isAllFolderDialogOpen, setIsAllFolderDialogOpen, isAddFolderDialogOpen, setIsAddFolderDialogOpen,
    newFolderName, setNewFolderName, handleAddFolderAction,
    addFolderColor, setAddFolderColor, editFolderColor, setEditFolderColor,
    addDescription, setAddDescription, addLabels, setAddLabels,

    // Dialog Rename
    isRenameDialogOpen, setIsRenameDialogOpen, folderBeingManaged,
    editFolderName, setEditFolderName, handleRenameFolderAction,

    // Dialog Edit Metadata
    isEditMetadataDialogOpen, setIsEditMetadataDialogOpen, editDescription, setEditDescription,
    editLabels, setEditLabels, handleEditMetadataAction,

    // Dialog Delete
    isDeleteDialogOpen, setIsDeleteDialogOpen, handleDeleteFolderAction,
    // Hapus accessToken dari destrukturisasi jika tidak digunakan
}) => {
    const DEFAULT_BG_COLOR_CLASS = 'bg-gray-400';
    const hasWorkspaces = workspaces.length > 0;

    const getBgColorClass = (colorString?: string | null): string => {
        if (colorString) {
            if (colorString.startsWith('bg-')) return colorString;
            if (colorString.startsWith('#')) return `bg-[${colorString}]`;
        }
        return DEFAULT_BG_COLOR_CLASS;
    };

    // Helper untuk render breadcrumbs (Tetap Sama)
    const renderBreadcrumbs = () => (
        <nav className="flex items-center space-x-1 text-sm text-gray-600 flex-wrap ">
             {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                    {index > 0 && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                    <button
                        onClick={() => onNavigateBreadcrumb(folder.id, index)}
                        disabled={isLoadingFolderContent || isProcessingFolderAction || index === folderPath.length - 1}
                        className={`hover:text-blue-600 disabled:text-gray-500 disabled:cursor-not-allowed px-1 py-0.5 rounded ${index === folderPath.length - 1 ? 'font-semibold text-gray-800 bg-gray-100' : 'hover:bg-gray-50'}`}
                        title={index === folderPath.length - 1 ? `Current folder: ${folder.name}` : `Go to ${folder.name}`}
                    >
                        {index === 0 ? <Home size={14} className="inline mr-1 mb-0.5" /> : null}
                        <span className='truncate max-w-[150px] inline-block align-bottom'>{(folder.name)}</span>
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );

    const route = useRouter()
    // Helper untuk render item folder/file - MODIFIED (Tambahkan validasi di Dropdown)
    const renderItem = (item: ManagedItem) => {
        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
        const Icon = isFolder ? Folder : FileIcon;
        const itemBgColorClass = getBgColorClass(item.metadata?.color);
        // --- BARU: Cek izin modifikasi untuk item ini ---
        const canModifyThisItem = item.is_self_folder !== false;
        // ------------------------------------------------

        const handleItemClick = () => {
            if (isFolder) {
                // Navigasi internal atau push route
                if (selectedWorkspaceForBrowse?.id && item.id) {
                    // Panggil onNavigate jika hanya perlu update state di parent
                    onNavigate(item.id, item.name);
                    // atau push route jika ini halaman utama aplikasi
                    // route.push(`/app/workspace/${selectedWorkspaceForBrowse.id}/folder/${item.id}`);
                }
            } else if (item.webViewLink) {
                window.open(item.webViewLink, '_blank'); // Buka file GDrive
            }
        };


        return (
            <div key={item.id} className="p-4 col-span-1 rounded-3xl outline outline-black/5 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className={`${itemBgColorClass} col-span-1 w-9 h-9 flex items-center justify-center rounded-2xl outline outline-black/5 flex-shrink-0`}>
                            <svg width="20" height="20" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 4.75h1.745c.304 0 .598.11.826.312L8.92 6.25H3.75V6c0-.69.56-1.25 1.25-1.25m6.661 1.5a1.25 1.25 0 0 1-.826-.312L8.562 3.936a2.75 2.75 0 0 0-1.817-.686H5A2.75 2.70 0 0 0 2.25 6v12A2.75 2.75 0 0 0 5 20.75h14A2.75 2.75 0 0 0 21.75 18V9A2.75 2.75 0 0 0 19 6.25z" /></svg>
                        </div>
                        {isFolder && (
                            <div className="ml-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" className="h-7 w-7 rounded-full" variant={"ghost"} disabled={!selectedWorkspaceForBrowse} onClick={(e) => e.stopPropagation()} aria-label="Folder actions">
                                            <Ellipsis className="h-4 w-4 text-gray-500"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleItemClick(); }} disabled={isProcessingFolderAction}>
                                            <LucideFolderUp className="mr-2 h-4 w-4"/><span>Ke Folder</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                         {/* --- MODIFIKASI: Tambahkan disabled dan Tooltip --- */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className={!canModifyThisItem ? 'block cursor-not-allowed' : ''} tabIndex={!canModifyThisItem ? 0 : undefined}>
                                                    <DropdownMenuItem
                                                        onSelect={(e) => { e.stopPropagation(); if (canModifyThisItem) onTriggerRenameFolder(item); }}
                                                        disabled={!canModifyThisItem || isProcessingFolderAction}
                                                        className={!canModifyThisItem ? 'cursor-not-allowed !text-muted-foreground' : ''}
                                                    >
                                                        {!canModifyThisItem ? <Ban className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                                                        Ubah Nama
                                                    </DropdownMenuItem>
                                                </span>
                                            </TooltipTrigger>
                                            {!canModifyThisItem && <TooltipContent side="left"><p>Anda tidak dapat me-rename folder ini</p></TooltipContent>}
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <span className={!canModifyThisItem ? 'block cursor-not-allowed' : ''} tabIndex={!canModifyThisItem ? 0 : undefined}>
                                                    <DropdownMenuItem
                                                        onSelect={(e) => { e.stopPropagation(); if (canModifyThisItem) onTriggerEditMetadata(item); }}
                                                        disabled={!canModifyThisItem || isProcessingFolderAction}
                                                        className={!canModifyThisItem ? 'cursor-not-allowed !text-muted-foreground' : ''}
                                                    >
                                                         {!canModifyThisItem ? <Ban className="mr-2 h-4 w-4" /> : <FolderCog2Icon className="mr-2 h-4 w-4" />}
                                                        Edit Detail
                                                    </DropdownMenuItem>
                                                </span>
                                            </TooltipTrigger>
                                            {!canModifyThisItem && <TooltipContent side="left"><p>Anda tidak dapat mengedit detail folder ini</p></TooltipContent>}
                                        </Tooltip>
                                        <DropdownMenuSeparator />
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className={!canModifyThisItem ? 'block cursor-not-allowed' : ''} tabIndex={!canModifyThisItem ? 0 : undefined}>
                                                    <DropdownMenuItem
                                                        className={`text-red-600 focus:bg-red-50 focus:text-red-700 ${!canModifyThisItem ? 'cursor-not-allowed !text-muted-foreground !focus:bg-transparent' : ''}`}
                                                        onSelect={(e) => { e.stopPropagation(); if (canModifyThisItem) onTriggerDeleteFolder(item); }}
                                                        disabled={!canModifyThisItem || isProcessingFolderAction}
                                                    >
                                                         {!canModifyThisItem ? <Ban className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                                        Delete Folder
                                                    </DropdownMenuItem>
                                                </span>
                                            </TooltipTrigger>
                                            {!canModifyThisItem && <TooltipContent side="left"><p>Anda tidak dapat menghapus folder ini</p></TooltipContent>}
                                        </Tooltip>
                                         {/* -------------------------------------------------- */}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                    <p className={`font-semibold truncate text-foreground text-sm mb-1 flex items-center ${isFolder ? 'cursor-pointer hover:text-blue-600' : 'cursor-default'}`} onClick={handleItemClick} title={item.name}>
                        {item.name}
                    </p>
                     {/* Deskripsi & Add Desc Badge */}
                     {(() => { const fullDescription = item.metadata?.description || ''; return (<> {fullDescription ? ( <div className="mb-1 h-10"> <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><span className="font-light text-xs text-gray-500 cursor-default line-clamp-2">{fullDescription}</span></TooltipTrigger><TooltipContent side="top" align="start" className="bg-black text-white text-xs rounded px-2 py-1 max-w-[250px] break-words shadow-lg z-50"><p>{fullDescription}</p></TooltipContent></Tooltip></TooltipProvider></div> ) : ( isFolder && canModifyThisItem && <div className="mt-0.5 h-10 flex items-start"> <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-dashed border-gray-200 text-gray-500 hover:border-gray-600 hover:text-gray-700 cursor-pointer" onClick={(e) => { e.stopPropagation(); onTriggerEditMetadata(item); }} title="Tambahkan deskripsi"><Plus size={10} className="mr-1 text-xs text-gray-400" /> Add Desc</Badge></div> )} </> ); })()}
                    {/* File Count */}
                    {isFolder && ( <div className="mt-1 text-xs text-gray-400 flex items-center"><FileStack size={12} className="mr-1" /><span>{item.fileCount !== undefined ? `${item.fileCount} files` : '... files'}</span></div> )}
                </div>
                {/* Labels & Add Labels Badge */}
                <div className="mt-auto pt-3">
                    {(() => { const labels = item.metadata?.labels || []; if (labels.length === 0 && isFolder && canModifyThisItem) { return ( <div className="mt-2"><Badge variant="outline" className="text-xs px-1.5 py-0.5 border-dashed border-gray-200 text-gray-500 hover:border-gray-600 hover:text-gray-700 cursor-pointer" onClick={(e) => { e.stopPropagation(); onTriggerEditMetadata(item); }} title="Tambahkan label"><Plus size={10} className="mr-1 text-xs text-gray-400" /> Add Labels</Badge></div> ); } if (labels.length === 0) return <div className="h-6 mt-2"></div>; const maxVisibleLabels = 2; const visibleLabels = labels.slice(0, maxVisibleLabels); const hiddenLabelCount = labels.length - maxVisibleLabels; const hasMoreLabels = hiddenLabelCount > 0; const hiddenLabelsTooltip = hasMoreLabels ? labels.slice(maxVisibleLabels).map(l => `#${l}`).join(', ') : ''; const visibleLabelsTooltip = visibleLabels.map(l => `#${l}`).join(', '); return ( <div className="flex flex-wrap items-center gap-1">{visibleLabels.map(label => (<Badge key={label} variant="secondary" className='text-xs px-1.5 py-0 bg-gray-100 text-gray-600'>#{label.length > 8 ? `${label.slice(0, 8)}...` : label}</Badge>))}{hasMoreLabels && (<TooltipProvider delayDuration={300}><Tooltip><TooltipTrigger asChild><Badge variant="secondary" className='text-xs px-1.5 py-0 bg-gray-200 text-gray-700 cursor-default' aria-label={`Show ${hiddenLabelCount} more labels`}>+{hiddenLabelCount}</Badge></TooltipTrigger><TooltipContent side="top" align="center" className="bg-black text-white text-xs rounded px-2 py-1 max-w-[200px] break-words shadow-lg z-50"><p className="text-xs max-w-xs break-words">{visibleLabelsTooltip}{hiddenLabelCount > 0 ? ', ' : ''}{hiddenLabelsTooltip}</p></TooltipContent></Tooltip></TooltipProvider>)}</div> ); })()}
                </div>
            </div>
        );
    };


    // Pisahkan Folder dan File (Tetap Sama)
    const folders = itemsInCurrentFolder.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
    const files = itemsInCurrentFolder.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');

    return (
        <TooltipProvider delayDuration={100}> {/* Provider Tooltip di root UI */}
            <div>
                {/* Error Utama (Tetap Sama) */}
                {workspaceMainError && <div className='text-sm text-red-500 ...'>{workspaceMainError}</div>}
                {folderError &&( <div className='text-sm text-red-600 py-2 px-3 mb-3 font-medium bg-red-50 border border-red-200 rounded'><span className="font-bold">Error Folder:</span> {folderError}</div> )}

                {/* Loading Folder (Tetap Sama) */}
                {isLoadingFolderContent && ( /* ... kode loading ... */
                     <div className="grid rounded-xl bg-white h-auto gap-4 p-4"><div><h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">Folder di Workspace</h2></div><div className="grid lg:grid-cols-6 md:grid-cols-4 gap-4 sm:grid-cols-3 xs:grid-cols-2 grid-cols-1"><div className='col-span-full flex items-center justify-center text-sm text-gray-500 py-6'><Loader2 className="inline mr-2 h-5 w-5 animate-spin text-blue-500" /> Memuat isi folder...</div></div><div className="flex gap-2 items-center"><Button variant={"secondary"} className='h-8 w-8' disabled><Plus /></Button><Button variant={"outline"} className="w-40 h-8" disabled>Lihat Semua Folder</Button></div></div>
                 )}

                {/* Folder Display */}
                {!isLoadingFolderContent && selectedWorkspaceForBrowse && ( // Pastikan workspace dipilih
                <div className="grid rounded-xl bg-white h-auto gap-4 p-4">
                    <div className='flex items-center justify-between'> {/* Breadcrumbs and Title */}
                        <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">Folder di Workspace</h2>
                        {folderPath.length > 0 && renderBreadcrumbs()} {/* Tampilkan breadcrumb jika ada path */}
                    </div>
                    {itemsInCurrentFolder.length === 0 && !folderError && ( <p className="text-sm text-center text-gray-500 italic py-4">Folder ini kosong.</p> )}
                    {itemsInCurrentFolder.length > 0 && ( <div className="grid lg:grid-cols-6 md:grid-cols-4 gap-4 sm:grid-cols-3 xs:grid-cols-2 grid-cols-1 auto-rows-fr">{folders.map(folder => renderItem(folder))}</div> )}
                    <div className="flex gap-2 items-center mt-4">
                         {/* --- MODIFIKASI: Tambahkan disabled dan Tooltip untuk Add Folder --- */}
                         <Tooltip>
                             <TooltipTrigger asChild>
                                 <span className={!currentFolderIsSelf ? 'cursor-not-allowed' : ''} tabIndex={!currentFolderIsSelf ? 0 : undefined}>
                                     <Button variant={"secondary"} onClick={onTriggerAddFolder} className='h-8 w-8'
                                         disabled={!currentFolderIsSelf || isLoadingFolderContent || isProcessingFolderAction} // <-- Tambahkan !currentFolderIsSelf
                                         title="Tambah Folder Baru"
                                     ><Plus /></Button>
                                 </span>
                             </TooltipTrigger>
                             {!currentFolderIsSelf && ( <TooltipContent><p>Anda tidak dapat menambah folder di lokasi ini.</p></TooltipContent> )}
                         </Tooltip>
                          {/* -------------------------------------------------- */}
                        <Button variant={"outline"} onClick={onTriggerAllFolder} className="w-40 h-8" disabled={isLoadingFolderContent || isProcessingFolderAction}>Lihat Semua Folder</Button>
                    </div>
                </div>
                )}
                 {!selectedWorkspaceForBrowse && !isLoadingWorkspaces && (
                     <div className="text-center p-6 text-gray-500 italic">Pilih atau tambahkan workspace untuk melihat folder.</div>
                 )}

                {/* === DIALOGS (Tidak ada perubahan di sini) === */}
                {/* Dialog All Folders */}
                <Dialog open={isAllFolderDialogOpen} onOpenChange={setIsAllFolderDialogOpen}>
                    <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
                        <DialogHeader><DialogTitle>Semua Folder di Workspace</DialogTitle><DialogDescription>Menampilkan semua subfolder di '{folderPath.length > 0 ? folderPath[folderPath.length - 1].name : selectedWorkspaceForBrowse?.name}'.</DialogDescription></DialogHeader>
                        {isLoadingFolderContent && ( <div className="flex justify-center items-center py-10"><Loader2 className="h-6 w-6 animate-spin" /><span className="ml-2">Memuat folder...</span></div> )}
                        {!isLoadingFolderContent && folders.length === 0 && !folderError && ( <p className="text-sm text-center text-gray-500 italic py-4">Tidak ada folder di level ini.</p> )}
                        {!isLoadingFolderContent && folders.length > 0 && ( <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2 auto-rows-fr">{folders.map(folder => renderItem(folder))}</div> )}
                        {folderError && ( <p className="text-sm text-center text-red-500 py-4">{folderError}</p> )}
                        <DialogFooter><Button variant="outline" onClick={() => setIsAllFolderDialogOpen(false)}>Tutup</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog Add Folder */}
                <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader><DialogTitle>Tambah Folder Baru</DialogTitle><DialogDescription>Buat folder baru di dalam '{folderPath.length > 0 ? folderPath[folderPath.length - 1].name : selectedWorkspaceForBrowse?.name}'.</DialogDescription></DialogHeader>
                        {folderError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{folderError}</p>}
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="new-folder-name" className="text-right">Nama</Label><Input id="new-folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="col-span-3" placeholder="Nama Folder Baru" disabled={isProcessingFolderAction} /></div>
                            <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="add-description" className="text-right pt-2">Deskripsi</Label><Textarea id="add-description" value={addDescription} onChange={(e) => setAddDescription(e.target.value)} className="col-span-3" placeholder="Tambahkan deskripsi singkat (opsional)..." disabled={isProcessingFolderAction} rows={3}/></div>
                            <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="add-labels" className="text-right pt-2">Label</Label><div className="col-span-3"><TagsInput value={addLabels} onChange={setAddLabels} disabled={isProcessingFolderAction} /><p className="text-xs text-gray-500 mt-1">Pisahkan dengan Enter atau koma.</p></div></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Warna</Label><div className="col-span-3 flex flex-wrap gap-2 pt-1">{Object.entries(availableColors).map(([key, colorValue]) => { const uniqueId = `add-color-${key}`; return ( <div key={uniqueId} className="flex items-center"><Input type="radio" id={uniqueId} name="addFolderColorRadio" value={colorValue} checked={addFolderColor === colorValue} onChange={(e) => setAddFolderColor(e.target.value)} disabled={isProcessingFolderAction} className="sr-only peer" /><Label htmlFor={uniqueId} className={cn("w-6 h-6 rounded-md border border-gray-300 cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-blue-500", colorValue)} aria-label={`Warna ${key}`} /></div> ); })}</div></div>
                        </div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddFolderDialogOpen(false)} disabled={isProcessingFolderAction}>Batal</Button><Button type="button" className='bg-black hover:bg-gray-800' onClick={handleAddFolderAction} disabled={isProcessingFolderAction || !newFolderName.trim()}>{isProcessingFolderAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className='mr-2'/>} Buat Folder</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog Rename Folder */}
                <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader><DialogTitle>Rename Folder</DialogTitle><DialogDescription>Ubah nama folder '{folderBeingManaged?.name}'.</DialogDescription></DialogHeader>
                        {folderError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{folderError}</p>}
                        <div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-folder-name" className="text-right">Nama Baru</Label><Input id="edit-folder-name" value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} className="col-span-3" placeholder="Nama Folder Baru" disabled={isProcessingFolderAction} onKeyDown={(e) => { if (e.key === 'Enter' && editFolderName.trim() && editFolderName.trim() !== folderBeingManaged?.name) handleRenameFolderAction(); }}/></div></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)} disabled={isProcessingFolderAction}>Batal</Button><Button type="button" className='bg-black hover:bg-gray-800' onClick={handleRenameFolderAction} disabled={isProcessingFolderAction || !editFolderName.trim() || editFolderName.trim() === folderBeingManaged?.name}>{isProcessingFolderAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className='mr-2'/>} Simpan Nama</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog Edit Metadata */}
                <Dialog open={isEditMetadataDialogOpen} onOpenChange={setIsEditMetadataDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Edit Detail Folder</DialogTitle><DialogDescription>Ubah detail untuk folder '{folderBeingManaged?.name}'.</DialogDescription></DialogHeader>
                        {folderError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{folderError}</p>}
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-1.5"><Label htmlFor="edit-description">Deskripsi</Label><Textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Tambahkan deskripsi..." rows={3} disabled={isProcessingFolderAction}/></div>
                            <div className="grid gap-1.5"><Label htmlFor="edit-labels">Label</Label><TagsInput value={editLabels} onChange={setEditLabels} disabled={isProcessingFolderAction}/><p className="text-xs text-gray-500">Pisahkan dengan Enter atau koma.</p></div>
                            <div className="grid gap-1.5"><Label className='block'>Warna</Label><div className="flex flex-wrap gap-2 pt-1">{Object.entries(availableColors).map(([key, colorValue]) => { const uniqueId = `edit-color-${key}`; return ( <div key={uniqueId} className="flex items-center"><Input type="radio" id={uniqueId} name="editFolderColorRadio" value={colorValue} checked={editFolderColor === colorValue} onChange={(e) => setEditFolderColor(e.target.value)} disabled={isProcessingFolderAction} className="sr-only peer" /><Label htmlFor={uniqueId} className={cn("w-6 h-6 rounded-md border border-gray-300 cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-blue-500", colorValue)} aria-label={`Warna ${key}`} /></div> ); })}</div></div>
                        </div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditMetadataDialogOpen(false)} disabled={isProcessingFolderAction}>Batal</Button><Button type="button" className='bg-black hover:bg-gray-800' onClick={handleEditMetadataAction} disabled={isProcessingFolderAction}>{isProcessingFolderAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className='mr-2'/>} Simpan Detail</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog Delete Folder */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle className="flex items-center text-red-600"><AlertTriangle className="mr-2" /> Konfirmasi Hapus Folder</DialogTitle><DialogDescription className="py-4">Anda akan menghapus folder: <br /><strong className="text-gray-800 break-words">"{folderBeingManaged?.name}"</strong><br /><br /><span className='font-semibold text-red-700'>PERINGATAN:</span> Tindakan ini akan menghapus folder dan <strong className='underline'>SEMUA ISINYA</strong> (sub-folder dan file) secara permanen dari Google Drive.<br /> Aksi ini <strong className='underline'>TIDAK DAPAT DIBATALKAN</strong>.</DialogDescription></DialogHeader>
                        {folderError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{folderError}</p>}
                        <DialogFooter className="sm:justify-between gap-2"><Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessingFolderAction}>Batal</Button><Button type="button" variant="destructive" onClick={handleDeleteFolderAction} disabled={isProcessingFolderAction}>{isProcessingFolderAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 size={16} className='mr-2'/>} Ya, Hapus Permanen</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
};

export default FolderSelectorUI;
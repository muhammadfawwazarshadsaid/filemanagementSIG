// src/components/folder-selector-ui.tsx
import React from 'react';
// Impor ikon dan komponen UI yang diperlukan
import {
    Building2, ChevronRight, Loader2, Trash, Folder, File as FileIcon, Home,
    Plus, MoreHorizontal, Trash2, Edit, Tag, FileText, FolderPlus, X, Save, AlertTriangle,
    Ellipsis
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
import { Workspace, ManagedItem, FolderPathItem } from './folder-selector'; // Impor tipe dari komponen logic
import { FoldersMenu } from './recentfiles/folders-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

// Interface props diperbarui
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
    itemsInCurrentFolder: ManagedItem[];
    isLoadingFolderContent: boolean; // Loading spesifik folder content
    folderError: string | null; // Error spesifik folder content/action
    folderPath: FolderPathItem[]; // Untuk breadcrumbs
    onNavigate: (folderId: string, folderName: string) => void; // Klik sub-folder
    onNavigateBreadcrumb: (folderId: string, index: number) => void; // Klik breadcrumb

    // Props Aksi CRUD & Dialog
    isProcessingFolderAction: boolean; // Loading saat CRUD folder
    onTriggerAddFolder: () => void;
    onTriggerRenameFolder: (folder: ManagedItem) => void;
    onTriggerEditMetadata: (folder: ManagedItem) => void;
    onTriggerDeleteFolder: (folder: ManagedItem) => void;

    // State & Handler Dialog Add Folder
    isAddFolderDialogOpen: boolean;
    setIsAddFolderDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    newFolderName: string;
    setNewFolderName: React.Dispatch<React.SetStateAction<string>>;
    addDescription: string; // <-- Prop baru
    setAddDescription: React.Dispatch<React.SetStateAction<string>>; // <-- Prop baru
    addLabels: string[]; // <-- Prop baru
    setAddLabels: React.Dispatch<React.SetStateAction<string[]>>; // <-- Prop baru
    handleAddFolderAction: () => Promise<void>;

    addFolderColor: string; // <-- Prop baru
    setAddFolderColor: React.Dispatch<React.SetStateAction<string>>; 
    editFolderColor: string; // <-- Prop baru
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

// Helper untuk input tag/label (sederhana)
const TagsInput: React.FC<{ value: string[], onChange: (tags: string[]) => void, disabled?: boolean }> = ({ value, onChange, disabled }) => {
    const [inputValue, setInputValue] = React.useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !value.includes(newTag)) {
                onChange([...value, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-1 mb-2">
                {value.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
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
    error: workspaceMainError, // Rename agar tidak konflik dgn folderError
    newWorkspaceLink,
    setNewWorkspaceLink,
    workspaces,
    isLoading: isLoadingWorkspaces,
    isAdding: isAddingWorkspace,
    // accessToken, // Tidak perlu di UI
    handleAddWorkspace,
    handleRemoveWorkspace,
    handleSelectWorkspaceForBrowse,
    newWorkspaceName,
    setNewWorkspaceName,
    newWorkspaceColor,
    setNewWorkspaceColor,
    availableColors,

    // Props Folder Browser & Manager
    selectedWorkspaceForBrowse,
    itemsInCurrentFolder,
    isLoadingFolderContent,
    folderError, // Error spesifik folder
    folderPath,
    onNavigate,
    onNavigateBreadcrumb,

    // Props Aksi CRUD & Dialog
    isProcessingFolderAction,
    onTriggerAddFolder,
    onTriggerRenameFolder,
    onTriggerEditMetadata,
    onTriggerDeleteFolder,

    // Dialog Add
    isAddFolderDialogOpen,
    setIsAddFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    handleAddFolderAction,

    addFolderColor, setAddFolderColor,
    editFolderColor, setEditFolderColor,


    addDescription, setAddDescription, addLabels, setAddLabels,

    // Dialog Rename
    isRenameDialogOpen,
    setIsRenameDialogOpen,
    folderBeingManaged, // Digunakan di semua dialog edit/delete
    editFolderName,
    setEditFolderName,
    handleRenameFolderAction,

    // Dialog Edit Metadata
    isEditMetadataDialogOpen,
    setIsEditMetadataDialogOpen,
    editDescription,
    setEditDescription,
    editLabels,
    setEditLabels,
    handleEditMetadataAction,

    // Dialog Delete
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleDeleteFolderAction,
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

    // Helper untuk render breadcrumbs
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

    // Helper untuk render item folder/file
    const renderItem = (item: ManagedItem) => {
        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
        const Icon = isFolder ? Folder : FileIcon;
        // Buka file di tab baru jika link tersedia
        const handleItemClick = () => {
            if (isFolder) {
                onNavigate(item.id, item.name);
            } else if (item.webViewLink) {
                window.open(item.webViewLink, '_blank');
            }
        };

        // === PERBAIKAN WARNA IKON ===
        // Ambil kelas warna berdasarkan metadata item, gunakan helper
        const itemBgColorClass = getBgColorClass(item.metadata?.color);
        // ===========================

        return (
            <div key={item.id} className="p-4 col-span-1 rounded-3xl outline outline-black/5">
                {/* Konten Item */}
                <div
                    title={isFolder ? `${item.name}` : item.webViewLink ? `${item.name}` : item.name}
                    className={`flex justify-between flex-cols h-full  ${isFolder || item.webViewLink ? 'cursor-pointer' : 'cursor-default'} `}>
                        <div className="flex flex-col h-full justify-between md:w-28 ">
                            <div
                            className={`${itemBgColorClass} col-span-1 w-9 h-9 flex items-center justify-center rounded-2xl outline outline-black/5`}>
                            <svg
                                width="20"
                                height="20"
                                fill="white"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M5 4.75h1.745c.304 0 .598.11.826.312L8.92 6.25H3.75V6c0-.69.56-1.25 1.25-1.25m6.661 1.5a1.25 1.25 0 0 1-.826-.312L8.562 3.936a2.75 2.75 0 0 0-1.817-.686H5A2.75 2.70 0 0 0 2.25 6v12A2.75 2.75 0 0 0 5 20.75h14A2.75 2.75 0 0 0 21.75 18V9A2.75 2.75 0 0 0 19 6.25z" />
                            </svg>
                        </div>
                        <div>
                        
                        {(() => {
                            const fullDescription = item.metadata?.description || '';
                            let needsTooltip = false;
                            return (
                                <>
                                    {/* Nama Item (Selalu tampil) */}
                                    <p
                                        // onClick={handleItemClick}
                                        className="font-semibold truncate text-foreground text-sm mb-1 flex items-center pt-6" title={item.name}>
                                        {item.name.length > 14 ? `${item.name.slice(0, 14)}...` : item.name}
                                        {/* <ChevronRight className='text-gray-500' size={14}>Lihat File</ChevronRight> */}
                                    </p>

                                    {/* Kondisi: Tampilkan Deskripsi ATAU Badge Tambah Deskripsi */}
                                    {fullDescription ? (
                                        // Jika ADA deskripsi, tampilkan (dengan tooltip jika panjang)
                                        <div className=""> {/* Container untuk tooltip */}
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        {/* Teks yang ditampilkan (terpotong/utuh) dibungkus span */}
                                                        <span className="font-light text-xs text-gray-500 cursor-default line-clamp-2 lg:line-clamp-1">
                                                            {fullDescription}
                                                        </span>
                                                    </TooltipTrigger>
                                                    {/* HANYA render TooltipContent jika teks memang dipotong */}
                                                    {needsTooltip && (
                                                        <TooltipContent side="top" align="center" className="bg-black text-white text-xs rounded px-2 py-1 max-w-[250px] break-words shadow-lg">
                                                            <p>
                                                                {fullDescription} {/* Tampilkan deskripsi LENGKAP di tooltip */}
                                                            </p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                    ) : (
                                        // Jika TIDAK ADA deskripsi, tampilkan Badge "Add Description"
                                        <div className="mt-0.5 h-4"> {/* Fixed height */}
                                            <Badge
                                                variant="outline"
                                                className="text-xs px-1.5 py-0.5 border-dashed border-gray-200 text-gray-500 hover:border-gray-600 hover:text-gray-700 cursor-pointer"
                                                onClick={() => onTriggerEditMetadata(item)} // Panggil modal edit
                                                title="Tambahkan deskripsi"
                                            >
                                                <Plus size={10} className="mr-1 text-xs text-gray-400" /> Add Desc
                                            </Badge>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                        
                        {(() => {
                            const labels = item.metadata?.labels || [];

                            // Jika TIDAK ADA label, tampilkan Badge "Add Labels"
                            if (labels.length === 0) {
                                return (
                                    <div className="mt-2"> {/* Container untuk badge add label */}
                                        <Badge
                                            variant="outline"
                                            className="text-xs px-1.5 py-0.5 border-dashed border-gray-200 text-gray-500 hover:border-gray-600 hover:text-gray-700 cursor-pointer"
                                            onClick={() => onTriggerEditMetadata(item)} // Panggil modal edit
                                            title="Tambahkan label"
                                        >
                                            <Plus size={10} className="mr-1 text-xs text-gray-400" /> Add Labels
                                        </Badge>
                                    </div>
                                );
                            }

                            // --- Jika ADA label, lanjutkan logika sebelumnya ---
                            const maxVisibleLabels = 1;
                            const visibleLabels = labels.slice(0, maxVisibleLabels);
                            const hiddenLabelCount = labels.length - maxVisibleLabels;
                            const hasMoreLabels = hiddenLabelCount > 0;
                            const hiddenLabelsTooltip = hasMoreLabels ? labels.slice(maxVisibleLabels).join(', ') : '';

                            return (
                                <div className="pt-3 flex flex-wrap items-center gap-1">
                                    {/* Render visible labels */}
                                    {visibleLabels.map(label => (
                                        <Badge key={label} variant="secondary" className='text-xs px-1.5 py-0 bg-gray-100 text-gray-600'>
                                            {label.length > 8 ? `${label.slice(0, 8)}...` : label}
                                        </Badge>
                                    ))}
                                    {/* Render "+N" badge */}
                                    {hasMoreLabels && (
                                    <TooltipProvider delayDuration={300}> {/* Optional: control delay */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge
                                                    variant="secondary"
                                                    className='text-xs px-1.5 py-0 bg-gray-200 text-gray-700 cursor-default' // Keep cursor normal
                                                    aria-label={`Show ${hiddenLabelCount} more labels`} // Good for accessibility
                                                >
                                                    +{hiddenLabelCount}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                    side="top"
                                                    align="center"
                                                    // KELAS-KELAS INI SEHARUSNYA MEMBERI BACKGROUND HITAM & TEKS PUTIH:
                                                    className="bg-black text-white text-xs rounded px-2 py-1 max-w-[200px] break-words"
                                                >
                                                <p className="text-xs max-w-xs break-words"> {/* Style content */}
                                                    {visibleLabels}, {hiddenLabelsTooltip}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    )}
                                </div>
                            );
                        })()}


                        </div>
                        </div>
                        <div className='overflow-hidden'>
                    </div>
                        {/* Tombol Aksi hanya untuk Folder */}
                        {isFolder && (
                            <div className="">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="h-4 w-4" variant={"outline"}>
                                            <Ellipsis className="text-black/50"></Ellipsis>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                        <DropdownMenuItem onClick={() => onTriggerRenameFolder(item)} disabled={isProcessingFolderAction}>
                                        Ubah Nama
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onTriggerEditMetadata(item)} disabled={isProcessingFolderAction}>
                                        Edit Detail
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onTriggerDeleteFolder(item)} disabled={isProcessingFolderAction}>
                                        <Trash2 size={14}/> Delete Folder
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        {/* Tambahkan aksi untuk file jika perlu */}
                        </div>
                    </div>
        );
    };

                
    
    // Pisahkan Folder dan File
    const folders = itemsInCurrentFolder.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
    const files = itemsInCurrentFolder.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');

    return (
        
        <div>
            {folderError &&(
                <div className='text-sm text-red-600 py-2 px-3 mb-3 font-medium bg-red-50 border border-red-200 rounded'>
                    <span className="font-bold">Error Folder:</span> {folderError}
                </div>
            )}

            {/* Loading Folder */}
            {isLoadingFolderContent && (
            <div className="grid rounded-xl bg-white h-auto gap-4 p-4">
                <div>
                    <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">
                        Folder
                    </h2>
                </div>
                <div className="grid lg:grid-cols-6 md:grid-cols-4 gap-4 md:grid-cols-4 sm:grid-cols-3 xs:grid-cols-2 grid-cols-1">
                    <div className='flex items-center justify-center text-sm text-gray-500 py-6'>
                        <Loader2 className="inline mr-2 h-5 w-5 animate-spin text-blue-500" /> Memuat isi folder...
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <Button variant={"secondary"}  onClick={onTriggerAddFolder} className='h-8 w-8'
                        disabled={isLoadingFolderContent || isProcessingFolderAction}
                    ><Plus></Plus></Button>
                    <Button variant={"outline"} className="w-40 h-8">Lihat Semua Folder</Button>
                </div>
            </div>
            )}

            {!isLoadingFolderContent  && (
            <div className="grid rounded-xl bg-white h-auto gap-4 p-4">
                <div>
                    <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">
                        Folder di Workspace
                    </h2>
                </div>
                    {itemsInCurrentFolder.length === 0 && !folderError && (
                        <p className="text-sm text-center text-gray-500 italic py-4">Folder ini kosong.</p>
                    )}
                    {itemsInCurrentFolder.length > 0 && (
                        <div className="grid lg:grid-cols-6 md:grid-cols-4 gap-4 md:grid-cols-4 sm:grid-cols-3 xs:grid-cols-2 grid-cols-1">
                            {folders.map(folder => renderItem(folder))}
                        </div>
                        
                    )}
                <div className="flex gap-2 items-center">
                    <Button variant={"secondary"}  onClick={onTriggerAddFolder} className='h-8 w-8'
                        disabled={isLoadingFolderContent || isProcessingFolderAction}
                    ><Plus></Plus></Button>
                    <Button variant={"outline"} className="w-40 h-8">Lihat Semua Folder</Button>
                </div>
            </div>
    
)}
            
            
             {/* === DIALOGS === */}
            
            {/* Dialog Add Folder -- MODIFIKASI INPUT BINDING */}
            <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
                 <DialogContent className="sm:max-w-[425px]">
                     <DialogHeader>
                         <DialogTitle>Tambah Folder Baru</DialogTitle>
                         <DialogDescription>
                             Buat folder baru di dalam '{folderPath.length > 0 ? folderPath[folderPath.length - 1].name : selectedWorkspaceForBrowse?.name}'.
                         </DialogDescription>
                     </DialogHeader>
                      {folderError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{folderError}</p>}
                     <div className="grid gap-4 py-4">
                         {/* Nama Folder */}
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="new-folder-name" className="text-right">Nama</Label>
                             <Input id="new-folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="col-span-3" placeholder="Nama Folder Baru" disabled={isProcessingFolderAction} />
                         </div>
                         {/* Deskripsi (Gunakan state addDescription) */}
                         <div className="grid grid-cols-4 items-start gap-4">
                             <Label htmlFor="add-description" className="text-right pt-2">Deskripsi</Label>
                             <Textarea
                                 id="add-description"
                                 value={addDescription} // <-- Gunakan state addDescription
                                 onChange={(e) => setAddDescription(e.target.value)} // <-- Gunakan state addDescription
                                 className="col-span-3"
                                 placeholder="Tambahkan deskripsi singkat (opsional)..."
                                 disabled={isProcessingFolderAction}
                                 rows={3}
                             />
                         </div>
                         {/* Label (Gunakan state addLabels) */}
                          <div className="grid grid-cols-4 items-start gap-4">
                             <Label htmlFor="add-labels" className="text-right pt-2">Label</Label>
                             <div className="col-span-3">
                                <TagsInput
                                    value={addLabels} // <-- Gunakan state addLabels
                                    onChange={setAddLabels} // <-- Gunakan state addLabels
                                    disabled={isProcessingFolderAction}
                                />
                                <p className="text-xs text-gray-500 mt-1">Pisahkan dengan Enter atau koma.</p>
                             </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Warna</Label>
                            <div className="col-span-3 flex flex-wrap gap-2 pt-1">
                                {Object.entries(availableColors).map(([key, colorValue]) => { // Iterate using entries
                                    const uniqueId = `add-color-${key}`;
                                    return (
                                        <div key={uniqueId} className="flex items-center">
                                            <Input type="radio" id={uniqueId} name="editFolderColorRadio" value={colorValue}
                                                checked={addFolderColor === colorValue} onChange={(e) => setAddFolderColor(e.target.value)}
                                                disabled={isProcessingFolderAction} className="sr-only peer" />
                                            <Label htmlFor={uniqueId} className={cn("w-6 h-6 rounded-md border border-gray-300 cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-blue-500", colorValue)} aria-label={`Warna ${key}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                     </div>
                     <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsAddFolderDialogOpen(false)} disabled={isProcessingFolderAction}>Batal</Button>
                         <Button type="button" className='bg-black hover:bg-gray-800'  onClick={handleAddFolderAction} disabled={isProcessingFolderAction || !newFolderName.trim()}>
                             {isProcessingFolderAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className='mr-2 text-primary'/>} Buat Folder
                        </Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>


             {/* Dialog Rename Folder */}
             <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                 <DialogContent className="sm:max-w-[425px]">
                     <DialogHeader>
                         <DialogTitle>Rename Folder</DialogTitle>
                         <DialogDescription>
                             Ubah nama folder '{folderBeingManaged?.name}'.
                         </DialogDescription>
                     </DialogHeader>
                     {folderError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{folderError}</p>}
                     <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="edit-folder-name" className="text-right">
                                 Nama Baru
                             </Label>
                             <Input
                                 id="edit-folder-name"
                                 value={editFolderName}
                                 onChange={(e) => setEditFolderName(e.target.value)}
                                 className="col-span-3"
                                 placeholder="Nama Folder Baru"
                                 disabled={isProcessingFolderAction}
                                 onKeyDown={(e) => e.key === 'Enter' && handleRenameFolderAction()}
                             />
                         </div>
                     </div>
                     <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)} disabled={isProcessingFolderAction}>Batal</Button>
                         <Button type="button" className='bg-black hover:bg-gray-800' onClick={handleRenameFolderAction} disabled={isProcessingFolderAction || !editFolderName.trim() || editFolderName.trim() === folderBeingManaged?.name}>
                             {isProcessingFolderAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className='mr-2 text-primary'/>}
                             Simpan Nama
                         </Button>
                     </DialogFooter>
                 </DialogContent>
            </Dialog>
            
             {/* Dialog Edit Metadata -- PASTIKAN COLOR PICKER ADA */}
              <Dialog open={isEditMetadataDialogOpen} onOpenChange={setIsEditMetadataDialogOpen}>
                 <DialogContent className="sm:max-w-md">
                     <DialogHeader> <DialogTitle>Edit Detail Folder</DialogTitle> {/* ... */} </DialogHeader>
                     {folderError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{folderError}</p>}
                     <div className="grid gap-4 py-4">
                         {/* Deskripsi */}
                         <div> <Label htmlFor="edit-description" className='pb-2'>Deskripsi</Label> <Textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} /*...*/ /> </div>
                         {/* Label */}
                         <div> <Label htmlFor="edit-labels">Label</Label> <TagsInput value={editLabels} onChange={setEditLabels} /*...*/ /> {/*...*/} </div>
                         {/* Color Picker */}
                         <div>
                            <Label className='mb-1 block'>Warna</Label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {Object.entries(availableColors).map(([key, colorValue]) => { // Iterate using entries
                                    const uniqueId = `edit-color-${key}`;
                                    return (
                                        <div key={uniqueId} className="flex items-center">
                                            <Input type="radio" id={uniqueId} name="editFolderColorRadio" value={colorValue}
                                                checked={editFolderColor === colorValue} onChange={(e) => setEditFolderColor(e.target.value)}
                                                disabled={isProcessingFolderAction} className="sr-only peer" />
                                            <Label htmlFor={uniqueId} className={cn("w-6 h-6 rounded-md border border-gray-300 cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-blue-500", colorValue)} aria-label={`Warna ${key}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                     </div>
                     
                    <DialogFooter>
                         <Button type="button" variant="outline" onClick={() => setIsEditMetadataDialogOpen(false)} disabled={isProcessingFolderAction}>Batal</Button>
                         <Button type="button" className='bg-black hover:bg-gray-800' onClick={handleEditMetadataAction} disabled={isProcessingFolderAction}>
                            {isProcessingFolderAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className='mr-2 text-primary'></Save>}
                            <div className='pr-2'>
                                Simpan Detail
                            </div>
                         </Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>


             {/* Dialog Delete Folder */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-red-600">
                            <AlertTriangle className="mr-2" /> Konfirmasi Hapus Folder
                        </DialogTitle>
                        <DialogDescription className="py-4">
                            Anda akan menghapus folder: <br />
                            <strong className="text-gray-800 break-words">"{folderBeingManaged?.name}"</strong>
                            <br /><br />
                             <span className='font-semibold text-red-700'>PERINGATAN:</span> Tindakan ini akan menghapus folder dan <strong className='underline'>SEMUA ISINYA</strong> (sub-folder dan file) secara permanen dari Google Drive.
                            <br />
                             Aksi ini <strong className='underline'>TIDAK DAPAT DIBATALKAN</strong>.
                        </DialogDescription>
                    </DialogHeader>
                     {folderError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{folderError}</p>}
                    <DialogFooter className="sm:justify-between gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessingFolderAction}>
                            Batal
                        </Button>
                         <Button
                             type="button"
                             variant="destructive" // Warna merah
                             onClick={handleDeleteFolderAction}
                             disabled={isProcessingFolderAction}
                         >
                            {isProcessingFolderAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 size={16} className='mr-2'/>}
                             Ya, Hapus Permanen
                         </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div>
    );
};

export default FolderSelectorUI;
// src/components/folder-selector-ui.tsx
import React from 'react';
// Impor ikon dan komponen UI yang diperlukan
import {
    Building2, ChevronRight, Loader2, Trash, Folder, File as FileIcon, Home,
    Plus, MoreHorizontal, Trash2, Edit, Tag, FileText, FolderPlus, X, Save, AlertTriangle,
    Ellipsis, Lock // << Pastikan Lock diimpor
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
// Hapus impor FoldersMenu jika tidak digunakan di sini
// import { FoldersMenu } from './recentfiles/folders-menu';
// Pastikan Tooltip diimpor dari @radix-ui/react-tooltip atau wrapper shadcn/ui
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'; // << Sesuaikan path jika perlu
import { cn } from '@/lib/utils';

// Interface props (pastikan tipe Workspace menyertakan is_self_workspace)
interface FolderSelectorUIProps {
    // Props Utama Workspace
    error: string | null;
    newWorkspaceLink: string;
    setNewWorkspaceLink: React.Dispatch<React.SetStateAction<string>>;
    workspaces: Workspace[]; // << Tipe Workspace HARUS punya is_self_workspace
    isLoading: boolean;
    isAdding: boolean;
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
    selectedWorkspaceForBrowse: Workspace | null; // << Object ini HARUS punya is_self_workspace
    itemsInCurrentFolder: ManagedItem[];
    isLoadingFolderContent: boolean;
    folderError: string | null;
    folderPath: FolderPathItem[];
    onNavigate: (folderId: string, folderName: string) => void;
    onNavigateBreadcrumb: (folderId: string, index: number) => void;

    // Props Aksi CRUD & Dialog
    isProcessingFolderAction: boolean;
    onTriggerAddFolder: () => void;
    onTriggerRenameFolder: (folder: ManagedItem) => void;
    onTriggerEditMetadata: (folder: ManagedItem) => void;
    onTriggerDeleteFolder: (folder: ManagedItem) => void;

    // State & Handler Dialog Add Folder
    isAddFolderDialogOpen: boolean;
    setIsAddFolderDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    newFolderName: string;
    setNewFolderName: React.Dispatch<React.SetStateAction<string>>;
    addDescription: string;
    setAddDescription: React.Dispatch<React.SetStateAction<string>>;
    addLabels: string[];
    setAddLabels: React.Dispatch<React.SetStateAction<string[]>>;
    handleAddFolderAction: () => Promise<void>;
    addFolderColor: string;
    setAddFolderColor: React.Dispatch<React.SetStateAction<string>>;

    // State & Handler Dialog Rename Folder
    isRenameDialogOpen: boolean;
    setIsRenameDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    folderBeingManaged: ManagedItem | null;
    editFolderName: string;
    setEditFolderName: React.Dispatch<React.SetStateAction<string>>;
    handleRenameFolderAction: () => Promise<void>;

    // State & Handler Dialog Edit Metadata
    isEditMetadataDialogOpen: boolean;
    setIsEditMetadataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editDescription: string;
    setEditDescription: React.Dispatch<React.SetStateAction<string>>;
    editLabels: string[];
    setEditLabels: React.Dispatch<React.SetStateAction<string[]>>;
    editFolderColor: string;
    setEditFolderColor: React.Dispatch<React.SetStateAction<string>>;
    handleEditMetadataAction: () => Promise<void>;

    // State & Handler Dialog Delete Folder
    isDeleteDialogOpen: boolean;
    setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleDeleteFolderAction: () => Promise<void>;
}

// Helper untuk input tag/label (sederhana) - Tidak Diubah
const TagsInput: React.FC<{ value: string[], onChange: (tags: string[]) => void, disabled?: boolean }> = ({ value, onChange, disabled }) => {
    const [inputValue, setInputValue] = React.useState('');
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (disabled) return; const newTag = inputValue.trim(); if (newTag && !value.includes(newTag)) { onChange([...value, newTag]); } setInputValue(''); } else if (e.key === 'Backspace' && !inputValue && value.length > 0) { if (disabled) return; onChange(value.slice(0, -1)); } };
    const removeTag = (tagToRemove: string) => { if (disabled) return; onChange(value.filter(tag => tag !== tagToRemove)); };
    return ( <div><div className={cn("flex flex-wrap gap-1 mb-2", disabled && "opacity-70")}>{value.map(tag => (<Badge key={tag} variant="secondary" className="flex items-center gap-1">{tag}<button type="button" onClick={() => removeTag(tag)} className={cn("ml-1 text-gray-500 hover:text-red-600", disabled ? "cursor-not-allowed" : "")} disabled={disabled}><X size={12} /></button></Badge>))}</div><Input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={disabled ? '(Tidak dapat diedit)' : "Ketik label lalu Enter/koma..."} disabled={disabled} className="text-sm"/></div> );
};


const FolderSelectorUI: React.FC<FolderSelectorUIProps> = ({
    // Props Workspace
    error: workspaceMainError,
    newWorkspaceLink,
    setNewWorkspaceLink,
    workspaces,
    isLoading: isLoadingWorkspaces,
    isAdding: isAddingWorkspace,
    handleAddWorkspace,
    handleRemoveWorkspace,
    handleSelectWorkspaceForBrowse,
    newWorkspaceName,
    setNewWorkspaceName,
    newWorkspaceColor,
    setNewWorkspaceColor,
    availableColors,

    // Props Folder Browser & Manager
    selectedWorkspaceForBrowse, // <<< HARUS punya is_self_workspace
    itemsInCurrentFolder,
    isLoadingFolderContent,
    folderError,
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
    addDescription, setAddDescription, addLabels, setAddLabels,

    // Dialog Rename
    isRenameDialogOpen,
    setIsRenameDialogOpen,
    folderBeingManaged,
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
    editFolderColor, setEditFolderColor,
    handleEditMetadataAction,

    // Dialog Delete
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleDeleteFolderAction,
}) => {
    const DEFAULT_BG_COLOR_CLASS = 'bg-gray-400';
    const hasWorkspaces = workspaces.length > 0;

    // Helper warna - Tidak Diubah
    const getBgColorClass = (colorString?: string | null): string => {
        if (colorString) { if (colorString.startsWith('bg-')) return colorString; if (colorString.startsWith('#')) return `bg-[${colorString}]`; }
        return DEFAULT_BG_COLOR_CLASS;
    };

    // Helper render breadcrumbs - Tidak Diubah
    const renderBreadcrumbs = () => (
        <nav aria-label="breadcrumb" className="flex items-center space-x-1 text-sm text-gray-600 flex-wrap ">
             {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                    {index > 0 && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                    <button onClick={() => onNavigateBreadcrumb(folder.id, index)} disabled={isLoadingFolderContent || isProcessingFolderAction || index === folderPath.length - 1} className={`hover:text-blue-600 disabled:text-gray-500 disabled:cursor-not-allowed px-1 py-0.5 rounded ${index === folderPath.length - 1 ? 'font-semibold text-gray-800 bg-gray-100' : 'hover:bg-gray-50'}`} title={index === folderPath.length - 1 ? `Current folder: ${folder.name}` : `Go to ${folder.name}`}>
                        {index === 0 ? <Home size={14} className="inline mr-1 mb-0.5" /> : null}
                        <span className='truncate max-w-[150px] inline-block align-bottom'>{folder.name}</span>
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );

    // <<< Variabel untuk cek kepemilikan workspace yang SEDANG DIBROWSE >>>
    const isOwnerOfSelectedWorkspace = selectedWorkspaceForBrowse?.is_self_workspace === true;
    const restrictionTooltipMsg = "Aksi dibatasi pada workspace yang dibagikan.";

    // Helper untuk render item folder/file - DENGAN MODIFIKASI RESTRIKSI & Padding Internal
    const renderItem = (item: ManagedItem) => {
        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
        const itemBgColorClass = isFolder ? getBgColorClass(item.metadata?.color) : 'bg-gray-400';
        const canPerformAction = isOwnerOfSelectedWorkspace;

        const handleItemClick = () => { if (isFolder) {onNavigate(item.id, item.name);} else if (item.webViewLink) {window.open(item.webViewLink, '_blank');}};

        // <<< KARTU ITEM TETAP SAMA h-36 >>>
        // <<< Padding utama card p-4 tetap >>>
        return (
            <div key={item.id} className="p-4 mb-4 col-span-1 h-64 rounded-3xl outline outline-black/5 bg-white" >
                 {/* <<< flex justify-between h-full tetap >>> */}
                <div title={isFolder ? `Buka folder: ${item.name}` : item.webViewLink ? `Buka file: ${item.name}` : item.name} className={`flex justify-between flex-cols h-full ${isFolder || item.webViewLink ? 'cursor-pointer' : 'cursor-default'} `}>
                    {/* Kolom Kiri: Ikon, Nama, Desc, Label */}
                     {/* <<< flex flex-col h-full justify-between w-full tetap >>> */}
                    <div className="flex flex-col h-full justify-between w-full ">
                        {/* Ikon Folder/File - Tidak ada padding tambahan */}
                         <div className={`${itemBgColorClass} col-span-1 w-9 h-9 flex items-center justify-center rounded-2xl outline outline-black/5`}>
                            <svg width="20" height="20" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                {isFolder ? (<path d="M5 4.75h1.745c.304 0 .598.11.826.312L8.92 6.25H3.75V6c0-.69.56-1.25 1.25-1.25m6.661 1.5a1.25 1.25 0 0 1-.826-.312L8.562 3.936a2.75 2.75 0 0 0-1.817-.686H5A2.75 2.70 0 0 0 2.25 6v12A2.75 2.75 0 0 0 5 20.75h14A2.75 2.75 0 0 0 21.75 18V9A2.75 2.75 0 0 0 19 6.25z" />)
                                : (<path d="M9 2.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm6 0a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.75 2.25A.75.75 0 0 1 7.5 3v3.5a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 6.75 2.25Zm8.25 0A.75.75 0 0 1 15.75 3v3.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm3 .75v15A2.75 2.75 0 0 1 15.25 20.75H8.75A2.75 2.75 0 0 1 6 18V3A2.75 2.75 0 0 1 8.75.25h4.586a1.25 1.25 0 0 1 .884.366l3.414 3.414a1.25 1.25 0 0 1 .366.884v.836Zm-1.5.836v-.086l-.004-.024a.25.25 0 0 0-.07-.162L12.837.976a.25.25 0 0 0-.162-.07h-.018v4.844c0 .69.56 1.25 1.25 1.25h4.844Z"/>)}
                            </svg>
                        </div>
                         {/* Grup Nama, Desc, Label */}
                        {/* <<< Tambahkan sedikit padding vertikal di sini >>> */}
                        <div className="py-1"> {/* <<< Penyesuaian Padding >>> */}
                            {(() => {
                                const fullDescription = item.metadata?.description || ''; const maxLength = 24; let displayedText = fullDescription; let needsTooltip = false; if (fullDescription.length > maxLength) { displayedText = fullDescription.substring(0, maxLength) + '...'; needsTooltip = true; }
                                return ( <>
                                     {/* <<< Beri margin bawah pada nama >>> */}
                                     <p className="font-semibold truncate text-foreground text-sm mb-1 flex items-center" title={item.name}> {item.name} </p>
                                    {/* Deskripsi atau Badge Add Desc (jika folder) */}
                                    {isFolder && ( fullDescription ? ( <div className="pt-0 h-9 mb-1 overflow-hidden"> {/* Kurangi pt */} <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><span className="font-light text-xs text-gray-500 cursor-default line-clamp-2">{displayedText}</span></TooltipTrigger>{needsTooltip && (<TooltipContent side="top" align="center" className="bg-black text-white text-xs rounded px-2 py-1 max-w-[250px] break-words shadow-lg"><p>{fullDescription}</p></TooltipContent>)}</Tooltip></TooltipProvider></div> )
                                    : ( canPerformAction ? ( <div className="mt-0.5 h-4 mb-1"><Badge variant="outline" className="text-xs px-1.5 py-0.5 border-dashed border-gray-200 text-gray-500 hover:border-gray-600 hover:text-gray-700 cursor-pointer" onClick={(e) => {e.stopPropagation(); onTriggerEditMetadata(item);}} title="Tambahkan deskripsi"><Plus size={10} className="mr-1 text-xs text-gray-400" /> Add Desc</Badge></div> ) : <div className="mt-0.5 h-4 mb-1"></div> )
                                    ) }
                                </> );
                            })()}
                            {/* Label atau Badge Add Labels (jika folder) */}
                            {isFolder && (() => {
                                const labels = item.metadata?.labels || []; if (labels.length === 0) { return ( canPerformAction ? (<div className="mt-1 h-5"><Badge variant="outline" className="text-xs px-1.5 py-0.5 border-dashed border-gray-200 text-gray-500 hover:border-gray-600 hover:text-gray-700 cursor-pointer" onClick={(e) => {e.stopPropagation(); onTriggerEditMetadata(item);}} title="Tambahkan label"><Plus size={10} className="mr-1 text-xs text-gray-400" /> Add Labels</Badge></div>) : <div className="mt-1 h-5"></div> ); }
                                const maxVisibleLabels = 2; const visibleLabels = labels.slice(0, maxVisibleLabels); const hiddenLabelCount = labels.length - maxVisibleLabels; const hasMoreLabels = hiddenLabelCount > 0; const hiddenLabelsTooltip = hasMoreLabels ? labels.slice(maxVisibleLabels).join(', ') : '';
                                return ( <div className="mt-1 h-5 flex flex-wrap items-center gap-1 overflow-hidden"> {visibleLabels.map(label => (<Badge key={label} variant="secondary" className='text-xs px-1.5 py-0 bg-gray-100 text-gray-600'>{label}</Badge>))} {hasMoreLabels && (<TooltipProvider delayDuration={300}><Tooltip><TooltipTrigger asChild><Badge variant="secondary" className='text-xs px-1.5 py-0 bg-gray-200 text-gray-700 cursor-default' aria-label={`Show ${hiddenLabelCount} more labels`}>+{hiddenLabelCount}</Badge></TooltipTrigger><TooltipContent side="top" align="center" className="bg-black text-white text-xs rounded px-2 py-1 max-w-[200px] break-words"><p className="text-xs max-w-xs break-words">{hiddenLabelsTooltip}</p></TooltipContent></Tooltip></TooltipProvider>)} </div> );
                            })()}
                        </div>
                    </div>
                    {/* Kolom Kanan: Tombol Aksi (Hanya untuk Folder) */}
                    {isFolder && (
                         <div className=""> {/* Wrapper tombol aksi */}
                             <TooltipProvider delayDuration={100}>
                                 <Tooltip>
                                     <TooltipTrigger asChild>
                                         {/* Span diperlukan agar tooltip muncul saat button disabled */}
                                         <span tabIndex={!canPerformAction ? 0 : undefined}>
                                             <DropdownMenu>
                                                 {/* <<< Trigger Dropdown Disable jika !canPerformAction >>> */}
                                                 <DropdownMenuTrigger asChild disabled={!canPerformAction || isProcessingFolderAction}>
                                                     <Button
                                                         className={cn("h-4 w-4", !canPerformAction && "cursor-not-allowed opacity-50")} // Style disable
                                                         variant={"outline"}
                                                         onClick={(e) => e.stopPropagation()} // Cegah event bubbling
                                                     >
                                                         <Ellipsis className="text-black/50" />
                                                     </Button>
                                                 </DropdownMenuTrigger>
                                                 {/* <<< Konten menu hanya render jika canPerformAction >>> */}
                                                 {canPerformAction && (
                                                     <DropdownMenuContent align="end" className="w-[180px]">
                                                         {/* Item menu tetap sama */}
                                                         <DropdownMenuItem onClick={() => onTriggerRenameFolder(item)} disabled={isProcessingFolderAction}> <Edit size={14} className="mr-2" /> Rename </DropdownMenuItem>
                                                         <DropdownMenuItem onClick={() => onTriggerEditMetadata(item)} disabled={isProcessingFolderAction}> <Tag size={14} className="mr-2" /> Edit Details </DropdownMenuItem>
                                                         <DropdownMenuSeparator />
                                                         <DropdownMenuItem className=" focus:text-red-700 focus:bg-red-50 text-red-600" onClick={() => onTriggerDeleteFolder(item)} disabled={isProcessingFolderAction}> <Trash2 size={14} className="mr-2" /> Delete Folder </DropdownMenuItem>
                                                     </DropdownMenuContent>
                                                 )}
                                             </DropdownMenu>
                                         </span>
                                     </TooltipTrigger>
                                     {/* <<< Tooltip HANYA muncul jika !canPerformAction >>> */}
                                     {!canPerformAction && (
                                         <TooltipContent side="left" className="bg-black text-white text-xs rounded px-2 py-1 shadow-lg">
                                             <p>{restrictionTooltipMsg}</p>
                                         </TooltipContent>
                                     )}
                                 </Tooltip>
                             </TooltipProvider>
                         </div>
                     )}
                </div>
            </div>
        );
    };

    // Pisahkan Folder dan File - Tidak Diubah
    const folders = itemsInCurrentFolder.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
    const files = itemsInCurrentFolder.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');

    return (
        <TooltipProvider> {/* Pindahkan TooltipProvider ke root */}
            {/* <<< Container SAMA >>> */}
            <div className="container mx-auto">

                 {/* Loading Workspace - Tidak Diubah */}
                {isLoadingWorkspaces && !hasWorkspaces &&
                    <div className='flex items-center justify-center text-sm text-gray-500 py-6'><Loader2 className="inline mr-2 h-5 w-5 animate-spin text-blue-500" /> Memuat daftar workspace...</div>
                }
                 {/* Belum Ada Workspace - Tidak Diubah */}
                {!isLoadingWorkspaces && workspaces.length === 0 && !isAddingWorkspace && (
                    <div className='text-center text-gray-500 my-4'>Belum ada workspace.</div>
                )}

                {/* Workspace List Section - DENGAN BADGE */}
                {workspaces.length > 0 && (
                    // <<< Wrapper div SAMA >>>
                    // <<< Hapus class p-4 dari sini jika ingin padding hanya di item list >>>
                    <div className="bg-muted/50 gap-4 inline-flex overflow-hidden flex-col rounded-xl bg-white mb-6">
                        {/* <<< Header SAMA >>> */}
                         {/* <div className='p-4 pb-0'> Hapus padding bawah agar lebih rapat ke list
                            <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">Pilih Workspace</h2>
                            <p className="text-xs text-gray-500">Pilih workspace untuk melihat atau mengelola isinya.</p>
                        </div> */}
                        {/* <<< UL SAMA >>> */}
                        {/* <<< Tambahkan p-4 di sini jika dihapus dari parent >>> */}
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }} className="p-4">
                            {workspaces.map((ws) => (
                                // <<< LI SAMA >>>
                                <li key={ws.id} className='flex my-2 bg-gray-50 rounded-2xl p-4 items-center justify-between cursor-pointer hover:bg-gray-100' onClick={() => handleSelectWorkspaceForBrowse(ws)}>
                                    {/* <<< div kiri SAMA >>> */}
                                    <div className="flex flex-grow gap-4 items-center mr-2 overflow-hidden">
                                        {/* <<< Avatar SAMA >>> */}
                                        <div className={`flex-shrink-0 flex rounded-2xl text-white justify-center items-center h-10 w-10 ${getBgColorClass(ws.color)}`}> {ws.name.substring(0, 2).toUpperCase()} </div>
                                        {/* <<< div nama & url SAMA >>> */}
                                        <div className='items-center overflow-hidden'>
                                            {/* <<< Wrap Nama dan Badge >>> */}
                                            <div className='flex items-center gap-2'>
                                                 <Label className='font-medium block truncate cursor-pointer' htmlFor={`ws-name-${ws.id}`}>{ws.name}</Label>
                                                 {/* <<< TAMBAHKAN BADGE DI SINI >>> */}
                                                 {!ws.is_self_workspace && (
                                                    <Tooltip>
                                                         <TooltipTrigger className='flex-shrink-0'>
                                                             <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-yellow-400 bg-yellow-50 text-yellow-700 font-medium">
                                                                 <Lock size={10} className='mr-1'/> Dibagikan
                                                             </Badge>
                                                         </TooltipTrigger>
                                                         <TooltipContent side="top" className="bg-black text-white text-xs rounded px-2 py-1 shadow-lg">
                                                             <p>Akses terbatas.</p> {/* << Diringkas */}
                                                         </TooltipContent>
                                                     </Tooltip>
                                                 )}
                                             </div>
                                             {/* <<< Link URL SAMA >>> */}
                                            <div className='mb-1 mt-1 flex gap-2'>
                                                <a href={ws.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                    <Label className='font-regular underline text-xs text-blue-500 hover:text-blue-700 block truncate cursor-pointer' htmlFor={`ws-url-${ws.id}`}>{ws.url.length > 30 ? ws.url.substring(0, 30) + '...' : ws.url}</Label>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                     {/* <<< div kanan (aksi) SAMA >>> */}
                                    <div className="flex gap-1 pr-4 flex-shrink-0">
                                         {/* <<< Tombol Hapus/Keluar + Tooltip SAMA >>> */}
                                         <Tooltip>
                                             <TooltipTrigger asChild>
                                                 {/* <Button variant={"ghost"} size="icon" onClick={(e) => { e.stopPropagation(); handleRemoveWorkspace(ws.id); }} className='h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full'>
                                                     <Trash size={16} />
                                                 </Button> */}
                                             </TooltipTrigger>
                                             <TooltipContent side="top" className="bg-black text-white text-xs rounded px-2 py-1 shadow-lg">
                                                 <p>{ws.is_self_workspace ? "Hapus dari daftar" : "Keluar"}</p> {/* << Diringkas */}
                                             </TooltipContent>
                                         </Tooltip>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Bagian Konten Folder (Expanded) - DENGAN MODIFIKASI HEADER & TOMBOL + */}
                {selectedWorkspaceForBrowse && ( // Tampilkan hanya jika workspace dipilih
                    // <<< Wrapper div SAMA >>>
                    // <<< Hapus p-4 dari sini >>>
                    <div className="bg-muted/50 gap-4 inline-flex overflow-hidden flex-col rounded-xl bg-white">


                        {/* <<< Header "Folder di Workspace" dan tombol + >>> */}
                         {/* <<< Struktur grid SAMA, tambahkan padding horizontal px-4 >>> */}
                         <div className="grid rounded-xl bg-white h-auto gap-4 px-1">
                             {/* <<< Div Judul SAMA >>> */}
                             <div>
                                 <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">
                                     Folder di Workspace
                                      {/* Ikon gembok jika dibagikan */}
                                      {!isOwnerOfSelectedWorkspace && (
                                         <Tooltip>
                                             <TooltipTrigger className='ml-2 inline-block align-middle'> <Lock size={15} className='text-yellow-600'/> </TooltipTrigger>
                                             <TooltipContent side="top" className="bg-black text-white text-xs rounded px-2 py-1 shadow-lg max-w-[200px]"><p>{restrictionTooltipMsg}</p></TooltipContent>
                                         </Tooltip>
                                     )}
                                 </h2>
                                  {/* Deskripsi */}
                                  <p className="text-xs text-gray-500 mt-0.5">
                                      {isOwnerOfSelectedWorkspace ? "Kelola folder Anda di workspace ini." : "Aksi pengelolaan dibatasi pada workspace bersama."}
                                  </p>
                                  {/* Breadcrumbs jika perlu */}
                                  {folderPath.length > 1 && ( <div className='mt-2'> {renderBreadcrumbs()} </div> )}
                             </div>
                              {/* <<< Div Tombol Tambah SAMA strukturnya >>> */}
                             <div className="flex gap-2 items-center">
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          {/* Span agar tooltip muncul saat disabled */}
                                          <span tabIndex={!isOwnerOfSelectedWorkspace ? 0 : undefined}>
                                              <Button variant={"secondary"} onClick={onTriggerAddFolder} className='h-8' disabled={!isOwnerOfSelectedWorkspace || isLoadingFolderContent || isProcessingFolderAction} aria-disabled={!isOwnerOfSelectedWorkspace}>
                                                  <Plus /> {/* Icon tetap */}
                                              </Button>
                                          </span>
                                      </TooltipTrigger>
                                      {/* Tooltip HANYA muncul jika disable */}
                                      {!isOwnerOfSelectedWorkspace && ( <TooltipContent side="bottom" align="start" className="bg-black text-white text-xs rounded px-2 py-1 shadow-lg"><p>{restrictionTooltipMsg}</p></TooltipContent> )}
                                  </Tooltip>
                              </div>

                             {/* Pesan Error Folder - SAMA */}
                             {folderError && !isLoadingFolderContent &&( <div className='text-sm text-red-600 py-2 px-3 mb-3 font-medium bg-red-50 border border-red-200 rounded'><span className="font-bold">Error Folder:</span> {folderError}</div> )}

                             {/* Loading Folder - SAMA */}
                             {isLoadingFolderContent && ( <div className='flex items-center justify-center text-sm text-gray-500 py-6'><Loader2 className="inline mr-2 h-5 w-5 animate-spin text-blue-500" /> Memuat isi folder...</div> )}

                             {/* Daftar Folder & File - SAMA */}
                             {/* <<< Tambahkan padding bawah pb-4 untuk memberi jarak dari bawah card utama >>> */}
                             {!isLoadingFolderContent && (
                                 <div className='pb-4'>
                                     {itemsInCurrentFolder.length === 0 && !folderError && ( <p className="text-sm text-center text-gray-500 italic py-4">Folder ini kosong.</p> )}
                                     {/* Grid Items */}
                                     {itemsInCurrentFolder.length > 0 && (
                                         // <<< Layout grid card SAMA >>>
                                         <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                                              {/* Render Folders */}
                                             {folders.map(folder => renderItem(folder))}
                                              {/* Render Files */}
                                             {files.map(file => renderItem(file))}
                                         </div>
                                     )}
                                 </div>
                             )}
                         </div>
                     </div>
                 )}


                 {/* === DIALOGS === */}
                 {/* Dialog Add, Rename, Edit, Delete tetap sama strukturnya */}
                 {/* Logika disable internal di Dialog Edit & Delete (untuk tombol save/confirm) tetap ada sebagai pengaman */}

                {/* Dialog Add Folder - SAMA */}
                <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]"> {/* ... (Konten Dialog Add seperti sebelumnya) ... */} </DialogContent>
                 </Dialog>

                 {/* Dialog Rename Folder - SAMA */}
                <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                     <DialogContent className="sm:max-w-[425px]"> {/* ... (Konten Dialog Rename seperti sebelumnya) ... */} </DialogContent>
                 </Dialog>

                 {/* Dialog Edit Metadata - SAMA (dengan disable internal) */}
                 <Dialog open={isEditMetadataDialogOpen} onOpenChange={setIsEditMetadataDialogOpen}>
                     <DialogContent className="sm:max-w-md"> {/* ... (Konten Dialog Edit seperti sebelumnya, DENGAN input/tombol save disabled jika !isOwnerOfSelectedWorkspace) ... */} </DialogContent>
                 </Dialog>

                 {/* Dialog Delete Folder - SAMA (dengan disable internal) */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-md"> {/* ... (Konten Dialog Delete seperti sebelumnya, DENGAN tombol confirm disabled jika !isOwnerOfSelectedWorkspace) ... */} </DialogContent>
                 </Dialog>

            </div>
        </TooltipProvider>
    );
};

export default FolderSelectorUI;
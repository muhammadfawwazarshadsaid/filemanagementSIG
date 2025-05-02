// src/components/WorkspaceSelectorUI.tsx
import React, { ChangeEvent, FormEvent } from 'react';
// << Pastikan tipe Workspace di sini sudah ada is_self_workspace >>
import { Workspace } from './workspace-selector';
import { Building2, ChevronRight, Loader2, Pencil, Trash, Lock } from 'lucide-react'; // << Tambah import Lock
import { Label } from '@radix-ui/react-label';
import { Input } from './ui/input';
import { Button } from './ui/button';
// Hapus impor FoldersMenu jika tidak digunakan
// import { FoldersMenu } from './recentfiles/folders-menu';
import { Badge } from './ui/badge';
import { Separator } from '@radix-ui/react-separator';
// << Pastikan path Tooltip benar >>
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';

// Asumsi Workspace sudah punya is_self_workspace dan color (opsional)
// Jika tidak, buat interface ExtendedWorkspace seperti ini:
interface ExtendedWorkspace extends Workspace {
    color?: string | null; // Pastikan ini ada di tipe Workspace atau definisikan di sini
    is_self_workspace: boolean; // << WAJIB ADA >>
}

interface WorkspaceSelectorUIProps {
    error: string | null;
    newWorkspaceLink: string;
    setNewWorkspaceLink: React.Dispatch<React.SetStateAction<string>>;
    // << Gunakan tipe yang sudah ada is_self_workspace >>
    workspaces: ExtendedWorkspace[];
    isLoading: boolean;
    isAdding: boolean;
    accessToken: string | null;
    handleAddWorkspace: (e: FormEvent<HTMLFormElement>) => Promise<void>;
    handleRemoveWorkspace: (idToRemove: string) => Promise<void>;
    handleSelectWorkspace: (workspace: ExtendedWorkspace) => void; // Tetap ada handleSelectWorkspace
    newWorkspaceName: string;
    setNewWorkspaceName: React.Dispatch<React.SetStateAction<string>>;
    newWorkspaceColor: "" | string;
    setNewWorkspaceColor: React.Dispatch<React.SetStateAction<string>>;
    availableColors: {
        [key: string]: string;
    };
}


const WorkspaceSelectorUI: React.FC<WorkspaceSelectorUIProps> = ({
    error,
    newWorkspaceLink,
    setNewWorkspaceLink,
    workspaces,
    isLoading,
    isAdding,
    accessToken,
    handleAddWorkspace,
    handleRemoveWorkspace,
    handleSelectWorkspace, // Terima prop ini
    newWorkspaceName,
    setNewWorkspaceName,
    newWorkspaceColor,
    setNewWorkspaceColor,
    availableColors,
}) => {
    const DEFAULT_BG_COLOR = 'bg-gray-400'; // Diubah ke class Tailwind untuk konsistensi
    const hasWorkspaces = workspaces.length > 0;

    // Helper warna (gunakan bg-[...] jika value adalah hex)
    const getBgColorClass = (colorString?: string | null): string => {
        if (colorString) {
            if (colorString.startsWith('bg-')) return colorString;
            if (colorString.startsWith('#')) return `bg-[${colorString}]`;
            // Jika map availableColors punya key yang cocok
            if (availableColors[colorString]) return availableColors[colorString];
        }
        return DEFAULT_BG_COLOR; // Fallback jika tidak ada atau tidak valid
    };


    return (
        // << Bungkus dengan TooltipProvider >>
        <TooltipProvider>
            <div>

                {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px 0' }}>Error: {error}</p>}

                {/* Form Tambah Workspace (Hanya tampil jika belum ada workspace) - Struktur SAMA */}
                { !isLoading && workspaces.length === 0 && (
                    <form onSubmit={handleAddWorkspace}>
                        <div className="grid gap-4">

                            <Label htmlFor="workspaceName">Nama Workspace</Label>
                            <Input className="h-12"
                                id="workspaceName"
                                type="text"
                                value={newWorkspaceName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewWorkspaceName(e.target.value)}
                                placeholder="Contoh: Semen Tonasa"
                                disabled={isAdding || isLoading || !accessToken}
                                />
                            <Label htmlFor="workspaceLink">Link Workspace</Label>
                            <Input className="h-12"
                                id="workspaceLink"
                                type="url"
                                value={newWorkspaceLink}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewWorkspaceLink(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                                disabled={isAdding || isLoading || !accessToken}
                                required
                                />
                            <Label htmlFor="workspaceColor">Profil Workspace</Label>
                            <div className="flex flex-wrap gap-2">
                                {/* Iterasi warna SAMA */}
                                {Object.entries(availableColors).map(([key, colorValue], index) => ( // Gunakan entries untuk key & value
                                    <div key={key || index} className="flex items-center space-x-2 ">
                                        <Input
                                            type="radio"
                                            id={`color-${key}-${index}`} // Buat ID lebih unik
                                            name="workspaceColor"
                                            value={colorValue} // Value tetap string warna
                                            checked={newWorkspaceColor === colorValue}
                                            onChange={(e) => setNewWorkspaceColor(e.target.value)}
                                            disabled={isAdding || isLoading || !accessToken}
                                            className="sr-only peer" // Gunakan peer class
                                        />
                                         {/* Ganti label agar lebih aksesibel dan styling pakai peer */}
                                        <Label
                                            htmlFor={`color-${key}-${index}`}
                                            className={cn(
                                                "w-6 h-6 rounded-sm border border-gray-300 cursor-pointer transition-all",
                                                getBgColorClass(colorValue), // Terapkan warna background
                                                "peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-blue-500",
                                                "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
                                            )}
                                            title={key} // Tooltip sederhana dengan nama warna
                                         />
                                    </div>
                                ))}
                            </div>

                            {/* Preview Section - Struktur SAMA */}
                            {!newWorkspaceLink.trim() && !newWorkspaceName.trim() && (
                                <div className='flex my-2 bg-gray-50 rounded-2xl p-4 items-center'> <div className="flex w-full gap-4 items-center"> <div className='flex rounded-2xl text-white justify-center items-center h-10 w-10 bg-gray-300'> <Building2 size={20} /> </div> <div className=' items-center'> <div className='bg-gray-200 mb-2 rounded-lg h-4 w-40'></div> <div className='bg-gray-200 rounded-lg h-2 w-20'></div> </div> </div> </div>
                            )}
                            {(newWorkspaceLink.trim() || newWorkspaceName.trim()) && (
                                <div className='flex my-2 bg-gray-50 rounded-2xl p-4 items-center'> <div className="flex w-full gap-4 items-center"> <div className={`flex rounded-2xl text-white justify-center items-center h-10 w-10 ${getBgColorClass(newWorkspaceColor)}`}> {newWorkspaceName.trim() ? newWorkspaceName.substring(0, 2).toUpperCase() : <Building2 size={20}/>} </div> <div className='items-center'> {newWorkspaceName.trim() ? ( <Label className='font-medium' htmlFor="workspaceName">{newWorkspaceName}</Label> ) : ( <div className='bg-gray-200 mb-2 rounded-lg h-4 w-40'></div> )} {newWorkspaceLink.trim() ? ( <div className='mb-2 mt-1 flex gap-2'> <Label className='font-regular underline text-xs text-blue-500' htmlFor="workspaceLink">{newWorkspaceLink.length > 30 ? newWorkspaceLink.substring(0, 30) + '...' : newWorkspaceLink}</Label> </div> ) : ( <div className='bg-gray-200 rounded-lg h-2 w-20'></div> )} </div> </div> </div>
                            )}

                            {/* Tombol Submit - SAMA */}
                            <Button type="submit" className='font-bold' disabled={isAdding || isLoading || !newWorkspaceLink.trim() || !accessToken}>
                                {isAdding ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memverifikasi...</>) : 'Tambah Workspace'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Workspace List Section - DENGAN BADGE */}
                {isLoading &&
                    <div className='flex items-center justify-center text-sm text-gray-500 py-6'><Loader2 className="inline mr-2 h-5 w-5 animate-spin text-blue-500" /> Memuat isi workspace...</div>
                }
                {!isLoading && workspaces.length > 0 && (
                    <div>
                        {/* <h2 className='border-t pt-6 mt-6 text-sm font-medium text-gray-600'>Workspace Dibuat</h2> */}
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {workspaces.map((ws) => (
                                // <<< LI SAMA >>>
                                <li key={ws.id} className='flex my-2 bg-gray-50 rounded-2xl p-4 items-center justify-between cursor-pointer hover:bg-gray-100' onClick={() => handleSelectWorkspace(ws)}> {/* Pastikan onClick memanggil handleSelectWorkspace */}
                                     {/* <<< div kiri SAMA >>> */}
                                    <div className="flex flex-grow gap-4 items-center mr-2 overflow-hidden">
                                        {/* <<< Avatar SAMA >>> */}
                                        <div className={`flex-shrink-0 flex rounded-2xl text-white justify-center items-center h-10 w-10 ${getBgColorClass(ws.color)}`}> {/* Gunakan helper warna */}
                                            {ws.name.substring(0, 2).toUpperCase()}
                                        </div>
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
                                                             <p>Akses terbatas pada workspace ini.</p>
                                                         </TooltipContent>
                                                     </Tooltip>
                                                 )}
                                             </div>
                                             {/* <<< Link URL SAMA >>> */}
                                            <div className='mb-1 mt-1 flex gap-2'>
                                                <a href={ws.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title={`Buka ${ws.name} di Google Drive`}>
                                                    <Label className='font-regular underline text-xs text-blue-500 hover:text-blue-700 block truncate cursor-pointer' htmlFor={`ws-url-${ws.id}`}>{ws.url.length > 30 ? ws.url.substring(0, 30) + '...' : ws.url}</Label>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    {/* <<< div kanan (aksi) SAMA >>> */}
                                    <div className="flex gap-1 flex-shrink-0">
                                         {/* <<< Tombol Hapus/Keluar + Tooltip SAMA >>> */}
                                         <Tooltip>
                                             <TooltipTrigger asChild>
                                                 {/* Tombol hapus tetap ada, logic di parent component */}
                                                 <Button variant={"secondary"} size="icon" onClick={(e) => {e.stopPropagation(); handleRemoveWorkspace(ws.id)}} className='h-8 w-8 bg-gray-200 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-600'>
                                                     <Trash size={16} />
                                                 </Button>
                                             </TooltipTrigger>
                                             <TooltipContent side="top" className="bg-black text-white text-xs rounded px-2 py-1 shadow-lg">
                                                 {/* Copywriting tooltip disesuaikan */}
                                                 <p>{ws.is_self_workspace ? "Hapus dari daftar" : "Keluar dari workspace"}</p>
                                             </TooltipContent>
                                         </Tooltip>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {/* Komentar atau elemen lain di bawah list tetap dipertahankan jika ada */}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};

export default WorkspaceSelectorUI;
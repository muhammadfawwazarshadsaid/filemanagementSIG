// src/components/WorkspaceSelectorUI.tsx
import React, { ChangeEvent, FormEvent } from 'react';
import { Workspace } from './workspace-selector';
import { Building2, ChevronRight, Loader2, Pencil, Trash } from 'lucide-react'; // Simplified imports
import { Label } from '@radix-ui/react-label';
import { Input } from './ui/input';
import { Button } from './ui/button';

// Assuming Workspace type might have an optional color property
interface ExtendedWorkspace extends Workspace {
    color?: string | null; // Make sure color property exists or add it
}

interface WorkspaceSelectorUIProps {
    error: string | null;
    newWorkspaceLink: string;
    setNewWorkspaceLink: React.Dispatch<React.SetStateAction<string>>;
    // Use the extended type here if necessary, or ensure Workspace has 'color'
    workspaces: ExtendedWorkspace[];
    isLoading: boolean;
    isAdding: boolean;
    accessToken: string | null;
    // editingColorId, editColor, etc. are not used in the provided snippet, keep if needed elsewhere
    handleAddWorkspace: (e: FormEvent<HTMLFormElement>) => Promise<void>;
    handleRemoveWorkspace: (idToRemove: string) => Promise<void>;
    handleSelectWorkspace: (workspace: ExtendedWorkspace) => void;
    // handleColorChange, saveWorkspaceColor etc. seem related to editing, keep if needed
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
    handleSelectWorkspace,
    newWorkspaceName,
    setNewWorkspaceName,
    newWorkspaceColor,
    setNewWorkspaceColor,
    availableColors,
}) => {
    const DEFAULT_BG_COLOR = '#CCCCCC'; // Default grey hex for fallbacks
    const hasWorkspaces = workspaces.length > 0;

    return (
        <div>

            {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px 0' }}>Error: {error}</p>}

            {!hasWorkspaces && (
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
                            id="workspaceLink" // Corrected ID
                            type="url"
                            value={newWorkspaceLink}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewWorkspaceLink(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            disabled={isAdding || isLoading || !accessToken}
                            required
                             />
                        <Label htmlFor="workspaceColor">Profil Workspace</Label> {/* Changed htmlFor */}
                        <div className="flex flex-wrap gap-2">
                            {/* FIX 1: Iterate over object VALUES */}
                            {Object.values(availableColors).map((colorValue, index) => (
                                <div key={colorValue || index} className="flex items-center space-x-2 ">
                                    <Input
                                        type="radio"
                                        id={`color-${index}`}
                                        name="workspaceColor"
                                        value={colorValue} // Value is the CSS color string
                                        checked={newWorkspaceColor === colorValue}
                                        onChange={(e) => setNewWorkspaceColor(e.target.value)}
                                        disabled={isAdding || isLoading || !accessToken}
                                        className="sr-only"
                                    />
                                    <label htmlFor={`color-${index}`} className="cursor-pointer">
                                        {/* FIX 2: Use arbitrary value syntax bg-[...] */}
                                        <div
                                            className={`w-6 h-6 rounded-sm border border-gray-300 ${colorValue} ${newWorkspaceColor === colorValue ? 'ring-2 ring-blue-500' : ''}`}
                                        ></div>
                                    </label>
                                </div>
                            ))}
                        </div>

                        {/* Preview Section */}
                        {!newWorkspaceLink.trim() && !newWorkspaceName.trim() && (
                             <div className='flex my-2 bg-gray-50 rounded-2xl p-4 items-center'>
                                 <div className="flex w-full gap-4 items-center">
                                     <div className='flex rounded-2xl text-white justify-center items-center h-10 w-10 bg-gray-300'>
                                         <Building2 size={20} />
                                     </div>
                                     <div className=' items-center'>
                                         <div className='bg-gray-200 mb-2 rounded-lg h-4 w-40'></div>
                                         <div className='bg-gray-200 rounded-lg h-2 w-20'></div>
                                 </div>
                                 </div>
                             </div>
                         )}

                        {(newWorkspaceLink.trim() || newWorkspaceName.trim()) && (
                            <div className='flex my-2 bg-gray-50 rounded-2xl p-4 items-center'>
                                <div className="flex w-full gap-4 items-center">
                                    {/* FIX 3: Use arbitrary value syntax bg-[...] for preview too, with fallback */}
                                    <div className={`flex rounded-2xl text-white justify-center items-center h-10 w-10 ${newWorkspaceColor || DEFAULT_BG_COLOR}`}>
                                        {/* Only show initials if name exists */}
                                        {newWorkspaceName.trim() ? newWorkspaceName.substring(0, 2).toUpperCase() : <Building2 size={20}/>}
                                    </div>
                                    <div className='items-center'>
                                        {newWorkspaceName.trim() ? (
                                            <Label className='font-medium' htmlFor="workspaceName">{newWorkspaceName}</Label> // Use correct ID
                                        ) : (
                                            <div className='bg-gray-200 mb-2 rounded-lg h-4 w-40'></div>
                                        )}
                                        {newWorkspaceLink.trim() ? (
                                            <div className='mb-2 mt-1 flex gap-2'>
                                                {/* Truncate link display */}
                                                <Label className='font-regular underline text-xs text-blue-500' htmlFor="workspaceLink">{newWorkspaceLink.length > 30 ? newWorkspaceLink.substring(0, 30) + '...' : newWorkspaceLink}</Label>
                                            </div>
                                        ) : (
                                            <div className='bg-gray-200 rounded-lg h-2 w-20'></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}


                        <Button type="submit" className='font-bold' disabled={isAdding || isLoading || !newWorkspaceLink.trim() || !accessToken}>
                            {isAdding ? 'Memverifikasi...' : 'Tambah'}
                        </Button>
                    </div>
                </form>
            )}


                {/* Workspace List Section */}
                {isLoading && <div className='flex justify-center items-center my-4'><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Memuat...</div>}
                {!isLoading && workspaces.length === 0 && !isAdding && ( // Show only if not loading and not adding and empty
                     <div className='text-center text-gray-500 my-4'>Belum ada workspace.</div>
                 )}
                {!isLoading && workspaces.length > 0 && (
                <div>
                    <h2 className='mt-6 text-sm font-medium text-gray-600'>Workspace Dibuat</h2> {/* Use h2 for better structure */}
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                        {workspaces.map((ws) => (
                            <li key={ws.id} className='flex my-2 bg-gray-50 rounded-2xl p-4 items-center justify-between'>
                                <div className="flex flex-grow gap-4 items-center mr-2 overflow-hidden"> {/* Added flex-grow and overflow */}
                                     {/* FIX 4: Use arbitrary value syntax bg-[...] for list, with fallback */}
                                    <div className={`flex-shrink-0 flex rounded-2xl text-white justify-center items-center h-10 w-10 ${ws.color || DEFAULT_BG_COLOR}`}> {/* Added flex-shrink-0 */}
                                        {ws.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className='items-center overflow-hidden'> {/* Added overflow */}
                                         {/* Use truncate class for long names */}
                                        <Label className='font-medium block truncate' htmlFor={`ws-name-${ws.id}`}>{ws.name}</Label>
                                        <div className='mb-1 mt-1 flex gap-2'> {/* Reduced margin */}
                                             {/* Truncate URL */}
                                            <Label className='font-regular underline text-xs text-blue-500 block truncate' htmlFor={`ws-url-${ws.id}`}>{ws.url.length > 30 ? ws.url.substring(0, 30) + '...' : ws.url}</Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0"> {/* Added flex-shrink-0 */}
                                    <Button variant={"secondary"} size="icon" onClick={() => handleRemoveWorkspace(ws.id)} className='h-8 w-8 bg-gray-200 rounded-full'><Trash size={16}></Trash></Button> {/* Adjusted size */}
                                    <Button variant={"secondary"} size="icon" onClick={() => handleSelectWorkspace(ws)} className='h-8 w-8 bg-gray-200 rounded-full'><ChevronRight size={16}></ChevronRight></Button> {/* Adjusted size */}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                )}
        </div>
    );
};

export default WorkspaceSelectorUI;

// Note: Ensure the `Workspace` type (imported) or the `ExtendedWorkspace`
// includes the `color: string | null | undefined;` property if you intend to store
// and display colors for existing workspaces.
"use client"

import * as React from "react";
import { ChevronsUpDown, Check, Plus, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils"; // Sesuaikan path
import { Button } from "@/components/ui/button"; // Sesuaikan path
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Sesuaikan path
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"; // Sesuaikan path
// Pastikan impor Dialog lengkap dari lokasi yang benar
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogTrigger } from "@/components/ui/dialog"; // Sesuaikan path
import { Input } from "@/components/ui/input"; // Sesuaikan path
import { Label } from "@/components/ui/label"; // Sesuaikan path
import { useUser } from "@stackframe/stack";
import { supabase } from "@/lib/supabaseClient"; // Sesuaikan path

// --- Tipe Data (Placeholder/Impor) ---
interface Workspace { id: string; user_id: string; url: string; name: string; color?: string | null; }
const getBgColorClass = (colorString?: string | null): string => {
    const DEFAULT = 'bg-gray-500';
    if (!colorString) return DEFAULT;
    if (colorString.startsWith('bg-')) return colorString; // Handle tailwind class directly
    if (colorString.startsWith('#') && (colorString.length === 7 || colorString.length === 4)) {
        // Basic hex handling for arbitrary values
        return `bg-[${colorString}]`;
    }
    // Add specific color name mappings if needed, e.g.,
    // const colorMap: { [key: string]: string } = { blue: 'bg-blue-500', red: 'bg-red-500' };
    // if (colorMap[colorString]) return colorMap[colorString];
    return DEFAULT;
};
const defaultColors: { [key: string]: string } = { "blue": 'bg-blue-500', "green": 'bg-green-500', "red": 'bg-red-500', "yellow": 'bg-yellow-500', "purple": 'bg-purple-500', "pink": 'bg-pink-500', "indigo": 'bg-indigo-500', "gray": 'bg-gray-500' };
const DEFAULT_FOLDER_COLOR_VALUE = defaultColors.gray || 'bg-gray-500';
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
// ------------------------------------

// --- Props Interface ---
interface TeamSwitcherProps {
    workspaces: Workspace[];
    selectedWorkspaceId: string | null;
    onSelectWorkspace: (workspaceId: string) => void;
    isLoading?: boolean; // Loading state from parent (for initial list)
    className?: string;
    // === TAMBAHKAN PROPS CALLBACK ===
    onWorkspaceAdded?: () => void; // Callback to notify parent on success
    // ==============================
}
// ---------------------


export function TeamSwitcher({
    workspaces,
    onSelectWorkspace,
    selectedWorkspaceId,
    isLoading, // This is for the workspace list loading
    className,
    onWorkspaceAdded // <-- Terima prop callback ini
}: TeamSwitcherProps): React.ReactElement {
    const { isMobile } = useSidebar();
    const [open, setOpen] = React.useState(false); // Dropdown open state
    const user = useUser();
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: [
            'https://www.googleapis.com/auth/drive' // Scope ini mencakup readonly, edit, delete, dll.
        ]
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    const selectedWorkspace = workspaces.find(ws => ws.id === selectedWorkspaceId);

    // --- State untuk Dialog & Form Tambah Workspace ---
    const [isAddWorkspaceDialogOpen, setIsAddWorkspaceDialogOpen] = React.useState(false);
    const [isAddingWorkspace, setIsAddingWorkspace] = React.useState<boolean>(false); // Loading specific to the add action
    const [workspaceError, setWorkspaceError] = React.useState<string | null>(null); // Error specific to the add dialog/action
    const [newWorkspaceLink, setNewWorkspaceLink] = React.useState<string>('');
    const [newWorkspaceName, setNewWorkspaceName] = React.useState<string>('');
    const [newWorkspaceColor, setNewWorkspaceColor] = React.useState<string>(DEFAULT_FOLDER_COLOR_VALUE);
    // -------------------------------------------------

    // --- Helper Fetch API Google (Lokal di TeamSwitcher untuk Verifikasi) ---
     const makeApiCall = React.useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null): Promise<T | null> => {
         if (!accessToken) { console.error("makeApiCall (TeamSwitcher): Access Token missing."); setWorkspaceError("Token Google tidak tersedia."); return null; }
         const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}` };
         if (!(body instanceof FormData) && body && method !== 'GET' && method !== 'DELETE') { defaultHeaders['Content-Type'] = 'application/json'; }
         const options: RequestInit = { method, headers: defaultHeaders };
         if (body) { options.body = (body instanceof FormData) ? body : JSON.stringify(body); }
         try {
             const response = await fetch(url, options);
             if (!response.ok) {
                 let errorData: any = {};
                 try { errorData = await response.json(); } catch (e) { /* Ignore json parse error */ }
                 const message = errorData?.error?.message || `HTTP error ${response.status}`;
                 console.error(`Google API Error Response (${response.status}):`, errorData); // Log error response
                 throw new Error(message); // Throw specific message
             }
             if (response.status === 204) { return null; } // Handle No Content
             return response.json() as Promise<T>;
         } catch (err: any) {
             console.error(`TeamSwitcher Gagal ${method} ${url}:`, err);
             // Set workspaceError state to display the error in the dialog
             setWorkspaceError(err.message || 'Terjadi kesalahan saat menghubungi Google Drive.');
             return null; // Return null on failure
         }
     }, [accessToken]); // Dependency: accessToken. setWorkspaceError is stable.
     //----------------------------------------------------------------------

    // --- Handler Tambah Workspace ---
    const handleAddWorkspace = async () => {
        // Reset error spesifik dialog di awal percobaan
        setWorkspaceError(null);
        if (!user?.id || !accessToken || !newWorkspaceLink.trim()) {
            setWorkspaceError("Link Google Drive wajib diisi.");
            return;
        }
        const extractFolderId = (link: string): string | null => {
             // Regex to find folder ID from various Google Drive URL formats
             const m = link.match(/(?:folders|drive\/folders)\/([a-zA-Z0-9_-]+)/);
             return m ? m[1] : null;
         };
        const folderId = extractFolderId(newWorkspaceLink);
        if (!folderId) {
            setWorkspaceError("Format link Google Drive tidak valid atau tidak ditemukan ID folder.");
            return;
        }
        // Cek duplikasi berdasarkan ID folder terhadap daftar workspace yang diterima dari props
        if (workspaces.some(ws => ws.id === folderId)) {
            setWorkspaceError(`Workspace dengan folder ID ini sudah ditambahkan.`);
            return;
        }

        setIsAddingWorkspace(true); // Mulai loading spesifik tombol tambah
        console.log("Attempting to add workspace...");

        try {
            // 1. Verifikasi folder GDrive via makeApiCall
            const verifyUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=id,name,mimeType`;
            console.log("Verifying GDrive folder:", verifyUrl);
            const folderDetails = await makeApiCall<{ id: string, name: string, mimeType: string }>(verifyUrl);

            // Jika makeApiCall gagal, ia akan set workspaceError dan return null
            if (!folderDetails) {
                 console.error("Folder verification failed. Error should be set by makeApiCall.");
                 // Tidak perlu set error lagi di sini jika makeApiCall sudah melakukannya
                 setIsAddingWorkspace(false); // Pastikan loading berhenti
                 return; // Hentikan eksekusi
            }
            console.log("Folder verified:", folderDetails);

            if (folderDetails.mimeType !== 'application/vnd.google-apps.folder') {
                throw new Error("Link yang dimasukkan bukan merupakan folder Google Drive.");
            }

            // 2. Insert ke Supabase
            const workspaceName = newWorkspaceName.trim() || folderDetails.name; // Gunakan nama dari GDrive jika nama kustom kosong
            const newWorkspaceData: Omit<Workspace, 'user_id'> & { id: string; user_id: string } = {
                 id: folderDetails.id, // ID dari Google Drive
                 user_id: user.id,
                 url: newWorkspaceLink,
                 name: workspaceName,
                 color: newWorkspaceColor
             };

            console.log("Inserting workspace to Supabase:", newWorkspaceData);
            const { error: insertError } = await supabase
                .from('workspace')
                .insert([newWorkspaceData]); // insert expects an array

            if (insertError) {
                console.error("Supabase insert error:", insertError);
                if (insertError.code === '23505') { // Unique constraint violation (primary key)
                     throw new Error("Workspace ini sudah ada di database Anda.");
                 }
                throw insertError; // Lemparkan error Supabase lainnya
            }

            // 3. Sukses
            console.log("Workspace added successfully!");
            setIsAddWorkspaceDialogOpen(false); // Tutup dialog jika sukses

            // === PANGGIL CALLBACK REFRESH ===
            if (onWorkspaceAdded) {
                console.log("Calling onWorkspaceAdded callback...");
                onWorkspaceAdded(); // Beri tahu AppSidebar untuk load ulang!
            } else {
                console.warn("onWorkspaceAdded callback not provided.");
            }
            // ================================

            // Reset form fields setelah sukses? Opsional.
            setNewWorkspaceLink('');
            setNewWorkspaceName('');
            setNewWorkspaceColor(DEFAULT_FOLDER_COLOR_VALUE);


        } catch (err: any) {
            console.error("Error caught in handleAddWorkspace:", err);
            // Pastikan error ditampilkan di dialog jika belum di-set oleh makeApiCall
            if (!workspaceError) {
                 setWorkspaceError(err.message || "Gagal menambahkan workspace karena kesalahan tidak terduga.");
            }
        } finally {
            console.log("handleAddWorkspace finished.");
            setIsAddingWorkspace(false); // Pastikan loading selalu berhenti
        }
    }; // Akhir handleAddWorkspace
    // -----------------------------

    // --- Logika Tampilan ---
    const displayIconText = selectedWorkspace?.name.substring(0, 2).toUpperCase() || "?";
    const displayName = selectedWorkspace?.name || (isLoading ? "Memuat..." : (workspaces.length > 0 ? "Pilih Workspace" : "Belum Ada"));
    const displayColorClass = isLoading ? 'bg-gray-400 animate-pulse' : getBgColorClass(selectedWorkspace?.color);
    // ----------------------

    // --- Log state dialog untuk debug ---
     React.useEffect(() => {
         console.log("Dialog open state (TeamSwitcher):", isAddWorkspaceDialogOpen);
         // Reset error spesifik dialog saat dibuka
         if (isAddWorkspaceDialogOpen) {
             setWorkspaceError(null);
             // Reset form fields saat dialog dibuka? Opsional.
             // setNewWorkspaceLink('');
             // setNewWorkspaceName('');
             // setNewWorkspaceColor(DEFAULT_FOLDER_COLOR_VALUE);
         }
     }, [isAddWorkspaceDialogOpen]);
     // ------------------------------------

    return (
        // Komponen Dialog membungkus Dropdown dan Konten Dialog
        <Dialog open={isAddWorkspaceDialogOpen} onOpenChange={setIsAddWorkspaceDialogOpen}>
            <SidebarMenu className={cn("mb-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-md", className)}>
                <SidebarMenuItem>
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground disabled:opacity-60 w-full"
                                disabled={isLoading} // Disable hanya saat list utama loading
                                aria-label={displayName}
                            >
                                {/* Ikon */}
                                <div className={cn("flex aspect-square rounded-xl size-8 items-center justify-center rounded-xl flex-shrink-0", displayColorClass)} >
                                    {/* Tampilkan loader di ikon jika list loading */}
                                    {isLoading ? (<Loader2 className="h-4 w-4 animate-spin text-white" />)
                                        : (<span className="text-sm font-medium text-white">{displayIconText}</span>)}
                                </div>
                                {/* Nama Workspace */}
                                <div className="grid flex-1 text-left text-sm leading-tight mx-2 overflow-hidden">
                                    <span className="truncate font-medium text-gray-800 dark:text-gray-100">{displayName}</span>
                                </div>
                                {/* Chevron (hanya jika tidak loading) */}
                                {!isLoading && <ChevronsUpDown className="ml-auto h-4 w-4 text-gray-500" />}
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-xl"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={4}
                        >
                            {/* Tampilkan daftar hanya jika tidak loading utama dan ada workspace */}
                            {!isLoading && workspaces.length > 0 && (
                                <>
                                    <DropdownMenuLabel className="text-muted-foreground text-xs">
                                        Pilih Workspace
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {workspaces.map((workspace) => (
                                        <DropdownMenuItem
                                            key={workspace.id}
                                            onSelect={() => onSelectWorkspace(workspace.id)}
                                            className={cn("cursor-pointer", selectedWorkspaceId === workspace.id ? "bg-accent" : "")}
                                        >
                                            <div className={cn("flex size-6 items-center justify-center rounded-md mr-2 flex-shrink-0", getBgColorClass(workspace.color))} >
                                                <span className="text-xs font-medium text-white">{workspace.name.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                            <span className="truncate">{workspace.name}</span>
                                            {selectedWorkspaceId === workspace.id && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}
                            {/* Tampilkan pesan jika tidak ada workspace */}
                            {!isLoading && workspaces.length === 0 && (
                                <DropdownMenuLabel className="text-muted-foreground text-xs italic px-2 py-1.5">
                                    Belum ada workspace.
                                </DropdownMenuLabel>
                            )}
                            {/* Tampilkan pesan jika sedang loading list utama */}
                            {isLoading && (
                                <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground ml-2">Memuat workspace...</span>
                                </div>
                            )}

                            {/* Tombol Tambah Workspace (Pemicu Dialog) */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="p-0 focus:bg-transparent cursor-pointer" // Reset padding & focus default
                                onSelect={(e) => {
                                    e.preventDefault(); // Cegah dropdown menutup
                                    // Trigger Dialog akan menangani pembukaan modal
                                }}
                            >
                                <DialogTrigger asChild>
                                     {/* Tombol yang terlihat & diklik user */}
                                    <button className="flex items-center w-full px-2 py-1.5 text-sm rounded-sm gap-2 hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring">
                                        <Plus className="size-4" />
                                        <span>Tambah Workspace</span>
                                    </button>
                                </DialogTrigger>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            {/* Konten Dialog */}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah Workspace Baru</DialogTitle>
                    <DialogDescription>
                        Tempelkan link folder Google Drive yang ingin Anda jadikan workspace.
                    </DialogDescription>
                </DialogHeader>

                {/* Area Tampilan Error Spesifik Dialog */}
                {workspaceError && (
                    <div className="my-3 p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-md">
                         <p className="font-medium">Gagal Menambahkan. Pastikan pemilik tautan sudah membagikan link ke publik.</p>
                         <p>{workspaceError}</p>
                     </div>
                 )}

                {/* Form */}
                <div className="grid gap-4 py-4">
                    {/* Input Link */}
                    <div className="space-y-1.5">
                        <Label htmlFor="ts-add-link">Link Folder Google Drive <span className="text-red-500">*</span></Label>
                        <Input id="ts-add-link" type="url" value={newWorkspaceLink} onChange={(e) => setNewWorkspaceLink(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." required disabled={isAddingWorkspace} />
                    </div>
                    {/* Input Nama */}
                    <div className="space-y-1.5">
                        <Label htmlFor="ts-add-name">Nama Workspace (Opsional)</Label>
                        <Input id="ts-add-name" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="Default: Nama Folder Asli" disabled={isAddingWorkspace} />
                    </div>
                    {/* Color Picker */}
                    <div className="space-y-1.5">
                        <Label>Warna Tema</Label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {Object.entries(defaultColors).map(([key, colorValue]) => {
                                const uniqueId = `ts-add-color-${key}`;
                                return (<div key={uniqueId} className="flex items-center">
                                    <Input type="radio" id={uniqueId} name="addWorkspaceColorRadio" value={colorValue} checked={newWorkspaceColor === colorValue} onChange={(e) => setNewWorkspaceColor(e.target.value)} disabled={isAddingWorkspace} className="sr-only peer" />
                                    <Label htmlFor={uniqueId} className={cn("w-6 h-6 rounded-md border border-gray-300 cursor-pointer transition-all peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-blue-500 hover:opacity-80", colorValue)} aria-label={`Warna ${key}`} />
                                </div>);
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddWorkspaceDialogOpen(false)} disabled={isAddingWorkspace}>Batal</Button>
                    <Button type="button" className="bg-black hover:bg-gray-800" onClick={handleAddWorkspace} disabled={isAddingWorkspace || !newWorkspaceLink.trim()}>
                        {isAddingWorkspace ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<Save size={16} className="mr-2" />)}
                        {isAddingWorkspace ? 'Menambahkan...' : 'Tambah Workspace'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog> // Akhir Wrapper Dialog
    );
}
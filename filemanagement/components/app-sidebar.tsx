"use client"

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { FolderTree, Folder, Loader2, Save } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { supabase } from "@/lib/supabaseClient"; // Sesuaikan path
import { TeamSwitcher } from "@/components/team-switcher"; // Sesuaikan path
import { SemenIndonesia } from "./semenindonesia"; // Sesuaikan path
import { Sidebar, SidebarContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar"; // Sesuaikan path
import { NavItem, NavMain } from "./nav-main"; // Sesuaikan path
import { cn } from "@/lib/utils"; // Sesuaikan path
// Dialog tidak lagi dibutuhkan di sini jika tetap di TeamSwitcher
// import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
// import { DialogHeader, DialogFooter } from "./ui/dialog";
// import { Input } from "./ui/input";
// import { Button } from "./ui/button";
// import { Label } from "./ui/label";

// --- Definisi Tipe Data ---
interface GoogleDriveFile {
    id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string;
}
interface SupabaseItemMetadata {
    id: string; workspace_id: string; user_id: string; description?: string | null;
    color?: string | null; labels?: string[] | null; created_at?: string; updated_at?: string;
}
export interface ManagedItem extends GoogleDriveFile { metadata?: SupabaseItemMetadata | null; }
export interface Workspace { id: string; user_id: string; url: string; name: string; color?: string | null; }
// --------------------------

const defaultColors: { [key: string]: string } = { "blue":'bg-blue-500', "green":'bg-green-500', "red":'bg-red-500', "yellow":'bg-yellow-500', "purple":'bg-purple-500', "pink":'bg-pink-500', "indigo":'bg-indigo-500', "gray":'bg-gray-500' };
const DEFAULT_FOLDER_COLOR_VALUE = defaultColors.gray || 'bg-gray-500';
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const user = useUser();
    const account = user ? user.useConnectedAccount('google', { scopes: ['https://www.googleapis.com/auth/drive.readonly'] }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [foldersInSelectedWorkspace, setFoldersInSelectedWorkspace] = useState<NavItem[]>([]); // State untuk NavItem folder
    const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // State untuk Dialog Tambah Workspace tidak dibutuhkan di sini jika tetap di TeamSwitcher
    // const [isAddWorkspaceDialogOpen, setIsAddWorkspaceDialogOpen] = useState(false);
    // const [isAddingWorkspace, setIsAddingWorkspace] = useState<boolean>(false);
    // const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    // const [newWorkspaceLink, setNewWorkspaceLink] = useState<string>('');
    // const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
    // const [newWorkspaceColor, setNewWorkspaceColor] = useState<string>(DEFAULT_FOLDER_COLOR_VALUE);

    // --- Helper Fetch API Google ---
    const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null): Promise<T | null> => {
        if (!accessToken) {
            console.error("makeApiCall (Sidebar): Access Token missing.");
            setFetchError("Token Google tidak tersedia.");
            return null;
        }
        // ... (rest of makeApiCall implementation)
        const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}` };
        if (!(body instanceof FormData) && body && method !== 'GET' && method !== 'DELETE') { defaultHeaders['Content-Type'] = 'application/json'; }
        const options: RequestInit = { method, headers: defaultHeaders };
        if (body) { options.body = (body instanceof FormData) ? body : JSON.stringify(body); }
        try {
            const response = await fetch(url, options);
            if (!response.ok) { let errorData: any = {}; try { errorData = await response.json(); } catch (e) {} const message = errorData?.error?.message || `HTTP error ${response.status}`; throw new Error(`Google API Error (${response.status}): ${message}`); }
            if (response.status === 204) { return null; }
            return response.json() as Promise<T>;
        } catch (err: any) { console.error(`Sidebar Gagal ${method} ${url}:`, err); setFetchError(err.message); return null; }
    }, [accessToken]); // Dependency: accessToken

    // --- Fungsi Fetch Data ---
    const loadWorkspaces = useCallback(async () => {
        if (!user?.id) return;
        console.log("AppSidebar: Loading workspaces..."); // Log
        setIsLoadingWorkspaces(true);
        setFetchError(null); // Clear previous errors on load
        try {
            const { data, error } = await supabase
                .from('workspace')
                .select('id, user_id, url, name, color')
                .eq('user_id', user.id);

            if (error) throw error;

            const loadedWorkspaces = data || [];
            console.log(`AppSidebar: Loaded ${loadedWorkspaces.length} workspaces.`); // Log
            setWorkspaces(loadedWorkspaces);

            // Logic to select a workspace after loading
            if (!selectedWorkspaceId && loadedWorkspaces.length > 0) {
                console.log(`AppSidebar: Auto-selecting first workspace: ${loadedWorkspaces[0].id}`); // Log
                setSelectedWorkspaceId(loadedWorkspaces[0].id);
            } else if (loadedWorkspaces.length === 0) {
                 console.log("AppSidebar: No workspaces found, setting selectedWorkspaceId to null."); // Log
                setSelectedWorkspaceId(null);
                setFoldersInSelectedWorkspace([]); // Clear folders if no workspace
            } else if (selectedWorkspaceId && !loadedWorkspaces.some(ws => ws.id === selectedWorkspaceId)) {
                 // Handle case where previously selected workspace is gone
                 console.log(`AppSidebar: Previously selected workspace ${selectedWorkspaceId} not found, selecting first available.`); // Log
                 setSelectedWorkspaceId(loadedWorkspaces[0]?.id || null);
            }
            // If selectedWorkspaceId is valid and exists, keep it

        } catch (error: any) {
            console.error("Error loading workspaces:", error);
            setFetchError(`Gagal memuat workspace: ${error.message}`);
            setWorkspaces([]);
            setSelectedWorkspaceId(null);
            setFoldersInSelectedWorkspace([]);
        } finally {
            setIsLoadingWorkspaces(false);
        }
     // Dependencies: user.id and supabase client instance. Avoid selectedWorkspaceId here
     // to prevent reload loops if selection logic changes state during load.
     // Rely on the separate useEffect for fetchFoldersForWorkspace when selectedWorkspaceId changes.
    }, [user?.id, supabase]);


    const fetchFoldersForWorkspace = useCallback(async (workspaceId: string) => {
        if (!accessToken || !user?.id || !workspaceId) return;
        console.log(`Sidebar: Loading folders for workspace ${workspaceId}...`);
        setIsLoadingFolders(true);
        setFetchError(null);
        setFoldersInSelectedWorkspace([]);

        try {
            const subFields = "id, name, mimeType";
            const fieldsParam = `files(${subFields})`;
            const query = `'${workspaceId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsParam)}&orderBy=name`;
            console.log("Requesting GDrive URL:", gDriveUrl);

            // Use the makeApiCall defined within AppSidebar
            const gDriveData = await makeApiCall<{ files?: GoogleDriveFile[] }>(gDriveUrl);

            // Error handling within makeApiCall should set fetchError
            if (!gDriveData && fetchError) {
                 console.error("makeApiCall failed inside fetchFoldersForWorkspace:", fetchError);
                 return;
            }
             if (!gDriveData?.files && !fetchError) {
                 console.warn(`Sidebar: No folders found or empty response for workspace ${workspaceId}.`);
                 // No error, just no files
             }

            const driveFolders = gDriveData?.files || [];
            console.log(`Sidebar: Found ${driveFolders.length} folders.`);

            const navFolders = driveFolders.map(folder => ({
                title: folder.name,
                url: `/app/workspace/${workspaceId}/folder/${folder.id}`, // Sesuaikan URL
                icon: Folder,
                // Add other NavItem properties if needed
            }));
            setFoldersInSelectedWorkspace(navFolders);

        } catch (error: any) {
             // Catch any unexpected error not caught by makeApiCall
            console.error(`Error loading folders for workspace ${workspaceId}:`, error);
            if (!fetchError) { // Set fetchError if not already set by makeApiCall
                 setFetchError(`Gagal memuat folder: ${error.message}`);
            }
            setFoldersInSelectedWorkspace([]);
        } finally {
            setIsLoadingFolders(false);
        }
    // Pass fetchError state to makeApiCall if needed or handle errors locally
    }, [accessToken, user?.id, makeApiCall]); // Removed fetchError from deps here, handled via state check


    // --- Effects ---
    useEffect(() => {
        // Load workspaces when user ID or access token is available/changes
        if (user?.id && accessToken) {
            loadWorkspaces();
        } else {
             // Reset if user logs out or token expires
             setWorkspaces([]);
             setSelectedWorkspaceId(null);
             setIsLoadingWorkspaces(false); // Ensure loading stops
        }
    }, [user?.id, accessToken, loadWorkspaces]); // loadWorkspaces dependency is okay due to useCallback

    useEffect(() => {
        // Fetch folders when a workspace is selected and token/user are valid
        if (selectedWorkspaceId && user?.id && accessToken) {
            fetchFoldersForWorkspace(selectedWorkspaceId);
        } else {
            setFoldersInSelectedWorkspace([]); // Clear folders if no workspace selected or invalid state
        }
    }, [selectedWorkspaceId, user?.id, accessToken, fetchFoldersForWorkspace]); // fetchFoldersForWorkspace dependency is okay

    // --- Handler ---
    const handleWorkspaceSelect = (workspaceId: string) => {
        console.log("AppSidebar: Workspace selected:", workspaceId); // Log
        setSelectedWorkspaceId(workspaceId);
        // fetchFoldersForWorkspace will be triggered by the useEffect above
    };

    // Handler/Dialog logic for adding workspace is removed from here
    // as it's currently handled within TeamSwitcher


    // --- Siapkan Data untuk NavMain ---
    const navMainData: NavItem[] = React.useMemo(() => [ // Memoize NavMain data
        {
            title: "Folder",
            icon: FolderTree,
            url: "#", // Or a relevant base URL
            isActive: true, // Or determine based on current route/state
            items: foldersInSelectedWorkspace, // Data folder dinamis
        },
        // ... (Add other main navigation items here if any) ...
    ], [foldersInSelectedWorkspace]); // Re-calculate only when folders change

    return (
      <>
            <Sidebar collapsible="icon" {...props}>
                <SidebarHeader>
                    <SemenIndonesia /> {/* Pastikan komponen ini ada */}
                    <SidebarGroupLabel className="">Workspace</SidebarGroupLabel>
                    <TeamSwitcher
                        workspaces={workspaces}
                        selectedWorkspaceId={selectedWorkspaceId}
                        onSelectWorkspace={handleWorkspaceSelect}
                        isLoading={isLoadingWorkspaces} // Pass loading state
                        // === TERUSKAN CALLBACK REFRESH ===
                        onWorkspaceAdded={loadWorkspaces}
                        // =================================
                    />
                </SidebarHeader>
                <SidebarContent>
                    {/* Display general fetch errors */}
                    {fetchError && !isLoadingWorkspaces && !isLoadingFolders && (
                         <p className="text-xs text-red-500 p-2">{fetchError}</p>
                     )}
                    <NavMain items={navMainData} isLoadingFolders={isLoadingFolders} />
                </SidebarContent>
                {/* ... (Sidebar Footer if any) ... */}
            </Sidebar>

            {/* Dialog for adding workspace is NOT rendered here (it's in TeamSwitcher) */}
        </>
    );
}
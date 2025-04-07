"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { FolderTree, Folder, Loader2, Save, Home, HomeIcon } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { supabase } from "@/lib/supabaseClient"; // Adjust path as needed
import { TeamSwitcher } from "@/components/team-switcher"; // Adjust path as needed
import { SemenIndonesia } from "./semenindonesia"; // Adjust path as needed
import { Sidebar, SidebarContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar"; // Adjust path as needed
import { NavItem, NavMain } from "./nav-main"; // Adjust path as needed
import { cn } from "@/lib/utils"; // Adjust path as needed

// --- Type Definitions ---
interface GoogleDriveFile {
    id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string;
}

export interface Workspace {
    id: string;
    user_id: string;
    url: string;
    name: string;
    color?: string | null;
}
// --------------------------

const defaultColors: { [key: string]: string } = { "blue":'bg-blue-500', "green":'bg-green-500', "red":'bg-red-500', "yellow":'bg-yellow-500', "purple":'bg-purple-500', "pink":'bg-pink-500', "indigo":'bg-indigo-500', "gray":'bg-gray-500' };
const DEFAULT_FOLDER_COLOR_VALUE = defaultColors.gray || 'bg-gray-500';
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const LOCAL_STORAGE_WORKSPACE_KEY = 'selectedWorkspaceId'; // Key for localStorage

// --- AppSidebar Props Definition ---
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onWorkspaceUpdate?: (workspaceId: string | null, workspaceName: string | null, workspaceUrl: string | null) => void;
}
// ---------------------------------

export function AppSidebar({ onWorkspaceUpdate, ...props }: AppSidebarProps) {
    const user = useUser();
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: [
            // 'https://www.googleapis.com/auth/drive.readonly', // Bisa dihapus jika sudah ada 'drive'
            'https://www.googleapis.com/auth/drive' // Scope ini mencakup readonly, edit, delete, dll.
        ]
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    // Initialize state to null, useEffect will load from localStorage
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    // Track if we have checked localStorage to prevent race conditions
    const [localStorageChecked, setLocalStorageChecked] = useState(false);
    const [foldersInSelectedWorkspace, setFoldersInSelectedWorkspace] = useState<NavItem[]>([]);
    const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    // -----------------------------------

    // --- Helper Fetch API Google --- (No changes needed here)
    const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null): Promise<T | null> => {
        // ... (implementation remains the same as in your provided code)
         if (!accessToken) {
            console.error("makeApiCall (Sidebar): Access Token missing.");
            setFetchError("Token Google tidak tersedia.");
            return null;
        }
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
    }, [accessToken]);
    // -------------------------------

    // --- Function Load Workspaces (Modified Logic) ---
    const loadWorkspaces = useCallback(async () => {
        // Wait for user and localStorage check
        if (!user?.id || !localStorageChecked) {
            // console.log("AppSidebar: Skipping loadWorkspaces, prerequisites not met (user/localStorageCheck).");
            return;
        }
        // console.log("AppSidebar: Loading workspaces...");
        setIsLoadingWorkspaces(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase
                .from('workspace')
                .select('id, user_id, url, name, color')
                .eq('user_id', user.id);

            if (error) throw error;

            const loadedWorkspaces = (data as Workspace[]) || [];
            setWorkspaces(loadedWorkspaces);
            // console.log(`AppSidebar: Loaded ${loadedWorkspaces.length} workspaces.`);

            // --- Refined Auto-Selection Logic ---
            // Check if the currently selected ID (possibly from localStorage) exists in the loaded list
            const currentSelectedIdIsValid = loadedWorkspaces.some(ws => ws.id === selectedWorkspaceId);

            if (selectedWorkspaceId && currentSelectedIdIsValid) {
                // The ID we have (from state/localStorage) is valid, keep it.
                // console.log(`AppSidebar: Kept valid selected workspace: ${selectedWorkspaceId}`);
                // No state change needed, useEffect for onWorkspaceUpdate will handle notification
            } else if (loadedWorkspaces.length > 0) {
                // Either no ID was selected, or the selected ID is invalid (e.g., deleted). Select the first one.
                const firstWorkspaceId = loadedWorkspaces[0].id;
                // console.log(`AppSidebar: Auto-selecting first workspace: ${firstWorkspaceId}`);
                // Update state - this will trigger the save to localStorage effect
                setSelectedWorkspaceId(firstWorkspaceId);
            } else {
                // No workspaces loaded for the user. Clear selection.
                // console.log("AppSidebar: No workspaces found, clearing selection.");
                // Update state - this will trigger the save to localStorage effect (to remove the key)
                setSelectedWorkspaceId(null);
            }
            // --- End Refined Logic ---

        } catch (error: any) {
            console.error("Error loading workspaces:", error);
            setFetchError(`Gagal memuat workspace: ${error.message}`);
            setWorkspaces([]);
            setSelectedWorkspaceId(null); // Clear selection on error
        } finally {
            setIsLoadingWorkspaces(false);
        }
    // Depend on localStorageChecked to ensure it runs AFTER the initial load attempt
    }, [user?.id, supabase, selectedWorkspaceId, localStorageChecked]); // Added selectedWorkspaceId and localStorageChecked

    // --- Function Fetch Folders (No changes needed) ---
    const fetchFoldersForWorkspace = useCallback(async (workspaceId: string) => {
        // ... (implementation remains the same as in your provided code)
        if (!accessToken || !user?.id || !workspaceId) return;
        // console.log(`Sidebar: Loading folders for workspace ${workspaceId}...`);
        setIsLoadingFolders(true);
        setFetchError(null);
        setFoldersInSelectedWorkspace([]);

        try {
            const subFields = "id, name, mimeType";
            const fieldsParam = `files(${subFields})`;
            const query = `'${workspaceId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsParam)}&orderBy=name`;
            // console.log("Requesting GDrive URL:", gDriveUrl);

            const gDriveData = await makeApiCall<{ files?: GoogleDriveFile[] }>(gDriveUrl);

            if (!gDriveData && fetchError) { return; } // Error handled by makeApiCall setting fetchError
            if (!gDriveData?.files && !fetchError) {
                 // console.warn(`Sidebar: No folders found for workspace ${workspaceId} or API call returned no files field.`);
             }

            const driveFolders = gDriveData?.files || [];
            // console.log(`Sidebar: Found ${driveFolders.length} folders.`);

            const navFolders: NavItem[] = driveFolders.map(folder => ({
                title: folder.name,
                url: `/app/workspace/${workspaceId}/folder/${folder.id}`, // Adjust URL as needed
                icon: Folder,
            }));
            setFoldersInSelectedWorkspace(navFolders);

        } catch (error: any) {
             console.error(`Error loading folders for workspace ${workspaceId}:`, error);
             // Avoid overwriting specific Google API errors from makeApiCall
             if (!fetchError) { setFetchError(`Gagal memuat folder: ${error.message}`); }
             setFoldersInSelectedWorkspace([]);
        } finally {
            setIsLoadingFolders(false);
        }
    }, [accessToken, user?.id, makeApiCall, fetchError]); // Added fetchError
    // -------------------------

    // --- Handler Workspace Selection --- (No changes needed)
    const handleWorkspaceSelect = useCallback((workspaceId: string | null) => {
        // console.log("AppSidebar: Workspace selected locally:", workspaceId);
        setSelectedWorkspaceId(workspaceId); // Update state, effect will save to localStorage
    }, []);
    // -----------------------------------

    // --- Effects ---

    // Effect 1: Load initial workspace ID from localStorage ONCE on mount
    useEffect(() => {
        try {
            const storedWorkspaceId = localStorage.getItem(LOCAL_STORAGE_WORKSPACE_KEY);
            if (storedWorkspaceId) {
                // console.log("AppSidebar: Found workspace ID in localStorage:", storedWorkspaceId);
                setSelectedWorkspaceId(storedWorkspaceId);
            } else {
                // console.log("AppSidebar: No workspace ID found in localStorage.");
            }
        } catch (error) {
             console.error("AppSidebar: Error reading from localStorage:", error);
             // Proceed without localStorage value if reading fails
        } finally {
             setLocalStorageChecked(true); // Mark check as complete (critical for loadWorkspaces dependency)
        }
    }, []); // Empty dependency array = runs only once on mount

    // Effect 2: Save selected workspace ID to localStorage whenever it changes
    useEffect(() => {
        // Only attempt to save *after* the initial check is complete
        if (localStorageChecked) {
            try {
                if (selectedWorkspaceId) {
                    localStorage.setItem(LOCAL_STORAGE_WORKSPACE_KEY, selectedWorkspaceId);
                    // console.log("AppSidebar: Saved workspace ID to localStorage:", selectedWorkspaceId);
                } else {
                    localStorage.removeItem(LOCAL_STORAGE_WORKSPACE_KEY);
                    // console.log("AppSidebar: Removed workspace ID from localStorage.");
                }
            } catch (error) {
                 console.error("AppSidebar: Error writing to localStorage:", error);
            }
        }
    }, [selectedWorkspaceId, localStorageChecked]); // Runs when ID or checked status changes

    // Effect 3: Load workspaces list from Supabase (depends on user, token, and localStorage check)
    useEffect(() => {
        // console.log(`AppSidebar: Effect check - User: ${!!user?.id}, Token: ${!!accessToken}, LS Checked: ${localStorageChecked}`);
        if (user?.id && accessToken && localStorageChecked) {
            // console.log("AppSidebar: Triggering loadWorkspaces...");
            loadWorkspaces();
        } else {
             // console.log("AppSidebar: Resetting workspace list (user/token/LS check failed).");
             setWorkspaces([]);
             // Don't reset selectedWorkspaceId here, loadWorkspaces handles logic based on localStorageChecked
             setIsLoadingWorkspaces(false); // Ensure loading state is off if prerequisites fail
        }
    // loadWorkspaces is included as it depends on selectedWorkspaceId and localStorageChecked now
    }, [user?.id, accessToken, localStorageChecked, loadWorkspaces]);

    // Effect 4: Fetch folders when selected workspace ID changes (and is valid)
    useEffect(() => {
        if (selectedWorkspaceId && user?.id && accessToken) {
            // console.log(`AppSidebar: Triggering folder fetch for ${selectedWorkspaceId}`);
            fetchFoldersForWorkspace(selectedWorkspaceId);
        } else {
            // console.log("AppSidebar: Clearing folders (no valid workspace ID).");
            setFoldersInSelectedWorkspace([]); // Clear folders if no workspace is selected
        }
    }, [selectedWorkspaceId, user?.id, accessToken, fetchFoldersForWorkspace]); // fetchFolders dependency

    // Effect 5: Notify Parent Page (onWorkspaceUpdate) when selection changes
    useEffect(() => {
        if (onWorkspaceUpdate) {
            const selectedWS = workspaces.find(ws => ws.id === selectedWorkspaceId);
            // console.log(`AppSidebar: Notifying Page. Selected ID: ${selectedWorkspaceId}, Found WS: ${!!selectedWS}`);
            onWorkspaceUpdate(
                selectedWorkspaceId, // Pass the current ID (could be null)
                selectedWS?.name || null, // Pass name if found, else null
                selectedWS?.url || null // Pass URL if found, else null
            );
        }
        // This effect should run whenever the selected ID changes, OR the list of workspaces changes (to update name/url),
        // OR the callback function itself changes (though unlikely with useCallback).
    }, [selectedWorkspaceId, workspaces, onWorkspaceUpdate]);
    // -----------------------------------------

    // --- Prepare Data for NavMain --- (No changes needed)
    const navMainData: NavItem[] = useMemo(() => [
        {
            title: "Home",
            icon: HomeIcon,
            url: "/",
            isActive: true
        },
        {
            title: "Folder",
            icon: FolderTree,
            url: "#",
            isActive: true,
            items: foldersInSelectedWorkspace,
        },
        // ... other main nav items ...
    ], [foldersInSelectedWorkspace]);
    // ---------------------------------

    return (
      <>
            <Sidebar collapsible="icon" {...props}>
                <SidebarHeader>
                    <SemenIndonesia />
                    <SidebarGroupLabel className="">Workspace</SidebarGroupLabel>
                    <TeamSwitcher
                        className="rounded-2xl"
                        workspaces={workspaces}
                        selectedWorkspaceId={selectedWorkspaceId}
                        onSelectWorkspace={handleWorkspaceSelect} // Use local handler
                        isLoading={isLoadingWorkspaces}
                        onWorkspaceAdded={loadWorkspaces} // Refresh list on add
                    />
                </SidebarHeader>
                <SidebarContent>
                    {fetchError && !isLoadingWorkspaces && !isLoadingFolders && (
                         <p className="text-xs text-red-500 p-2">{fetchError}</p>
                     )}
                    {/* Pass loading state for folders */}
                    <NavMain items={navMainData} isLoadingFolders={isLoadingFolders} />
                </SidebarContent>
                {/* ... Sidebar Footer ... */}
            </Sidebar>
            {/* Add workspace dialog likely lives within TeamSwitcher */}
        </>
    );
}
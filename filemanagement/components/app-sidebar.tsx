"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { FolderTree, Folder, Loader2, Save, Home, HomeIcon, Eye, File, FileAxis3DIcon, FileScanIcon, UserRoundCogIcon, SignatureIcon } from "lucide-react"; // <-- Pastikan Eye diimpor
import { useUser } from "@stackframe/stack";
import { supabase } from "@/lib/supabaseClient"; // Sesuaikan path jika perlu
import { TeamSwitcher } from "@/components/team-switcher"; // Sesuaikan path jika perlu
import { SemenIndonesia } from "./semenindonesia"; // Sesuaikan path jika perlu
import { Sidebar, SidebarContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar"; // Sesuaikan path jika perlu
import { NavItem, NavMain } from "./nav-main"; // Sesuaikan path jika perlu
import { cn } from "@/lib/utils"; // Sesuaikan path jika perlu
import { Badge } from "@/components/ui/badge"; // <-- Impor Badge
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // <-- Impor Tooltip

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
    is_self_workspace?: boolean | null; // <-- Pastikan field ini ada dalam definisi tipe
}
// --------------------------

const defaultColors: { [key: string]: string } = { "blue":'bg-blue-500', "green":'bg-green-500', "red":'bg-red-500', "yellow":'bg-yellow-500', "purple":'bg-purple-500', "pink":'bg-pink-500', "indigo":'bg-indigo-500', "gray":'bg-gray-500' };
const DEFAULT_FOLDER_COLOR_VALUE = defaultColors.gray || 'bg-gray-500';
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const LOCAL_STORAGE_WORKSPACE_KEY = 'selectedWorkspaceId';

// --- AppSidebar Props Definition ---
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  // Modifikasi tipe callback untuk menyertakan isSelf
  onWorkspaceUpdate?: (
      workspaceId: string | null,
      workspaceName: string | null,
      workspaceUrl: string | null,
      isSelf: boolean | null // <-- Tambahkan parameter isSelf di sini
   ) => void;
}
// ---------------------------------

export function AppSidebar({ onWorkspaceUpdate, ...props }: AppSidebarProps) {
    const user = useUser();
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: ['https://www.googleapis.com/auth/drive']
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [localStorageChecked, setLocalStorageChecked] = useState(false);
    const [foldersInSelectedWorkspace, setFoldersInSelectedWorkspace] = useState<NavItem[]>([]);
    const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    // -----------------------------------

    // --- Helper Fetch API Google ---
    const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null): Promise<T | null> => {
        if (!accessToken) { console.error("makeApiCall (Sidebar): Access Token missing."); setFetchError("Token Google tidak tersedia."); return null; }
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
        if (!user?.id || !localStorageChecked) { return; }
        setIsLoadingWorkspaces(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase
                .from('workspace')
                // <-- PERUBAHAN: Tambahkan is_self_workspace ke select
                .select('id, user_id, url, name, color, is_self_workspace')
                .eq('user_id', user.id);

            if (error) throw error;

            const loadedWorkspaces = (data as Workspace[]) || [];
            setWorkspaces(loadedWorkspaces);

            // --- Refined Auto-Selection Logic ---
            const currentSelectedIdIsValid = loadedWorkspaces.some(ws => ws.id === selectedWorkspaceId);
            if (selectedWorkspaceId && currentSelectedIdIsValid) {
                 // Keep valid selection
            } else if (loadedWorkspaces.length > 0) {
                 const firstWorkspaceId = loadedWorkspaces[0].id;
                 setSelectedWorkspaceId(firstWorkspaceId); // Trigger save effect
            } else {
                 setSelectedWorkspaceId(null); // Trigger save effect (remove key)
            }
            // --- End Refined Logic ---

        } catch (error: any) {
            console.error("Error loading workspaces:", error);
            setFetchError(`Gagal memuat workspace: ${error.message}`);
            setWorkspaces([]);
            setSelectedWorkspaceId(null);
        } finally {
            setIsLoadingWorkspaces(false);
        }
    }, [user?.id, supabase, selectedWorkspaceId, localStorageChecked]);
    // -----------------------------------

    // --- Function Fetch Folders ---
    const fetchFoldersForWorkspace = useCallback(async (workspaceId: string) => {
         if (!accessToken || !user?.id || !workspaceId) return;
        setIsLoadingFolders(true);
        setFetchError(null);
        setFoldersInSelectedWorkspace([]);
        try {
            const subFields = "id, name, mimeType";
            const fieldsParam = `files(${subFields})`;
            const query = `'${workspaceId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsParam)}&orderBy=name`;
            const gDriveData = await makeApiCall<{ files?: GoogleDriveFile[] }>(gDriveUrl);
            if (!gDriveData && fetchError) { return; }
            if (!gDriveData?.files && !fetchError) { /* No folders or API issue */ }
            const driveFolders = gDriveData?.files || [];
            const navFolders: NavItem[] = driveFolders.map(folder => ({
                title: folder.name,
                url: `/app/workspace/${workspaceId}/folder/${folder.id}`, // Sesuaikan URL jika perlu
                icon: Folder,
            }));
            setFoldersInSelectedWorkspace(navFolders);
        } catch (error: any) {
             console.error(`Error loading folders for workspace ${workspaceId}:`, error);
             if (!fetchError) { setFetchError(`Gagal memuat folder: ${error.message}`); }
             setFoldersInSelectedWorkspace([]);
        } finally {
            setIsLoadingFolders(false);
        }
    }, [accessToken, user?.id, makeApiCall, fetchError]);
    // -------------------------

    // --- Handler Workspace Selection ---
    const handleWorkspaceSelect = useCallback((workspaceId: string | null) => {
        setSelectedWorkspaceId(workspaceId);
    }, []);
    // -----------------------------------

    // --- Effects ---

    // Effect 1: Load initial workspace ID from localStorage ONCE
    useEffect(() => {
        try {
            const storedWorkspaceId = localStorage.getItem(LOCAL_STORAGE_WORKSPACE_KEY);
            if (storedWorkspaceId) setSelectedWorkspaceId(storedWorkspaceId);
        } catch (error) { console.error("AppSidebar: Error reading from localStorage:", error); }
        finally { setLocalStorageChecked(true); }
    }, []);

    // Effect 2: Save selected workspace ID to localStorage
    useEffect(() => {
        if (localStorageChecked) {
            try {
                if (selectedWorkspaceId) localStorage.setItem(LOCAL_STORAGE_WORKSPACE_KEY, selectedWorkspaceId);
                else localStorage.removeItem(LOCAL_STORAGE_WORKSPACE_KEY);
            } catch (error) { console.error("AppSidebar: Error writing to localStorage:", error); }
        }
    }, [selectedWorkspaceId, localStorageChecked]);

    // Effect 3: Load workspaces list from Supabase
    useEffect(() => {
        if (user?.id && accessToken && localStorageChecked) {
            loadWorkspaces();
        } else {
             setWorkspaces([]);
             setIsLoadingWorkspaces(false);
        }
    }, [user?.id, accessToken, localStorageChecked, loadWorkspaces]);

    // Effect 4: Fetch folders when selected workspace ID changes
    useEffect(() => {
        if (selectedWorkspaceId && user?.id && accessToken) {
            fetchFoldersForWorkspace(selectedWorkspaceId);
        } else {
            setFoldersInSelectedWorkspace([]);
        }
    }, [selectedWorkspaceId, user?.id, accessToken, fetchFoldersForWorkspace]);

    // Effect 5: Notify Parent Page (onWorkspaceUpdate) when selection changes (MODIFIED)
    useEffect(() => {
        if (onWorkspaceUpdate) {
            // Cari workspace yang terpilih dari state 'workspaces'
            const selectedWS = workspaces.find(ws => ws.id === selectedWorkspaceId);
            // Panggil callback dengan data lengkap, termasuk status is_self_workspace
            onWorkspaceUpdate(
                selectedWorkspaceId,
                selectedWS?.name || null,
                selectedWS?.url || null,
                selectedWS?.is_self_workspace ?? null // <-- PERUBAHAN: Kirim status is_self_workspace
            );
        }
        // Jalankan efek ini setiap kali ID terpilih, list workspace, atau callback berubah
    }, [selectedWorkspaceId, workspaces, onWorkspaceUpdate]);
    // -----------------------------------------

    // --- Hitung Status View Only ---
    // Cari objek workspace yang sedang dipilih
    const selectedWorkspace = useMemo(() => {
        return workspaces.find(ws => ws.id === selectedWorkspaceId);
    }, [workspaces, selectedWorkspaceId]);

    // Tentukan apakah statusnya view-only
    const isViewOnly = selectedWorkspace?.is_self_workspace === false;
    // -----------------------------

    // --- Prepare Data for NavMain ---
    const navMainData: NavItem[] = useMemo(() => [
        { title: "Manajemen Berkas", icon: FileScanIcon, url: "/", isActive: true },
        { title: "Folder", icon: FolderTree, url: "#", isActive: true, items: foldersInSelectedWorkspace },
        { title: "Pengajuan Persetujuan", icon: SignatureIcon, url: "/pengajuan-persetujuan", isActive: true },
    ], [foldersInSelectedWorkspace]);
    // ---------------------------------

    return (
        <TooltipProvider delayDuration={200}>
            <Sidebar collapsible="icon" {...props}>
                <SidebarHeader>
                    <SemenIndonesia />
                    {/* Flex Container untuk Label dan Badge */}
                    <div className="flex items-center justify-between w-full mt-2 mb-1">
                        <SidebarGroupLabel className="mb-0">Workspace</SidebarGroupLabel>
                        {/* --- PERUBAHAN: Render Badge jika view-only --- */}
                        {isViewOnly && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="outline"
                                        className="ml-auto mr-1 text-xs font-medium bg-yellow-100 border-yellow-300 text-yellow-800 shrink-0 h-5 px-1.5 flex items-center cursor-default" // Tambah cursor-default
                                    >
                                        <Eye className="h-3 w-3 mr-1"/> View Only
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-xs">
                                    <p>Anda hanya dapat melihat isi workspace ini.</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {/* --- Akhir Badge --- */}
                    </div>
                    <TeamSwitcher
                        className="rounded-2xl"
                        workspaces={workspaces}
                        selectedWorkspaceId={selectedWorkspaceId}
                        onSelectWorkspace={handleWorkspaceSelect}
                        isLoading={isLoadingWorkspaces}
                        onWorkspaceAdded={loadWorkspaces}
                    />
                </SidebarHeader>
                <SidebarContent>
                    {fetchError && !isLoadingWorkspaces && !isLoadingFolders && (
                         <p className="text-xs text-red-500 p-2">{fetchError}</p>
                     )}
                    <NavMain items={navMainData} isLoadingFolders={isLoadingFolders} />
                </SidebarContent>
                {/* ... Sidebar Footer ... */}
            </Sidebar>
        </TooltipProvider>
    );
}
"use client"

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react"; // Ditambahkan useMemo
import { FolderTree, Folder, Loader2, Save } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { supabase } from "@/lib/supabaseClient"; // Sesuaikan path
import { TeamSwitcher } from "@/components/team-switcher"; // Sesuaikan path
import { SemenIndonesia } from "./semenindonesia"; // Sesuaikan path
import { Sidebar, SidebarContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar"; // Sesuaikan path
import { NavItem, NavMain } from "./nav-main"; // Sesuaikan path
import { cn } from "@/lib/utils"; // Sesuaikan path

// --- Definisi Tipe Data ---
interface GoogleDriveFile {
    id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string;
}
// SupabaseItemMetadata tidak digunakan langsung di sini, tapi mungkin di tempat lain
// interface SupabaseItemMetadata { ... }
// ManagedItem tidak digunakan langsung di sini
// export interface ManagedItem extends GoogleDriveFile { ... }

// Definisikan tipe Workspace di sini atau impor dari file terpisah
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

// --- Definisi Props AppSidebar ---
// Tambahkan prop onWorkspaceUpdate
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onWorkspaceUpdate?: (workspaceId: string | null, workspaceName: string | null, workspaceUrl: string | null) => void;
}
// ---------------------------------

export function AppSidebar({ onWorkspaceUpdate, ...props }: AppSidebarProps) { // Terima onWorkspaceUpdate
    const user = useUser();
    const account = user ? user.useConnectedAccount('google', { scopes: ['https://www.googleapis.com/auth/drive.readonly'] }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State (Tetap di AppSidebar) ---
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [foldersInSelectedWorkspace, setFoldersInSelectedWorkspace] = useState<NavItem[]>([]); // State untuk NavItem folder
    const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    // -----------------------------------

    // --- Helper Fetch API Google ---
    const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null): Promise<T | null> => {
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

    // --- Fungsi Fetch Data ---
    const loadWorkspaces = useCallback(async () => {
        if (!user?.id) return;
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
            // console.log(`AppSidebar: Loaded ${loadedWorkspaces.length} workspaces.`);
            setWorkspaces(loadedWorkspaces);

            // Logic pemilihan otomatis workspace pertama JIKA belum ada yang terpilih
            if (!selectedWorkspaceId && loadedWorkspaces.length > 0) {
                // console.log(`AppSidebar: Auto-selecting first workspace: ${loadedWorkspaces[0].id}`);
                setSelectedWorkspaceId(loadedWorkspaces[0].id);
                 // Jangan panggil onWorkspaceUpdate di sini, biarkan useEffect yg tangani
            } else if (loadedWorkspaces.length === 0) {
                setSelectedWorkspaceId(null);
            } // else: biarkan selectedWorkspaceId yang sudah ada jika valid

        } catch (error: any) {
            console.error("Error loading workspaces:", error);
            setFetchError(`Gagal memuat workspace: ${error.message}`);
            setWorkspaces([]);
            setSelectedWorkspaceId(null);
        } finally {
            setIsLoadingWorkspaces(false);
        }
     // Hapus selectedWorkspaceId dari dependensi loadWorkspaces untuk menghindari loop potensial
    }, [user?.id, supabase]);


    const fetchFoldersForWorkspace = useCallback(async (workspaceId: string) => {
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

            if (!gDriveData && fetchError) { return; }
            if (!gDriveData?.files && !fetchError) { /* console.warn(...) */ }

            const driveFolders = gDriveData?.files || [];
            // console.log(`Sidebar: Found ${driveFolders.length} folders.`);

            const navFolders: NavItem[] = driveFolders.map(folder => ({
                title: folder.name,
                url: `/app/workspace/${workspaceId}/folder/${folder.id}`, // Sesuaikan URL jika perlu
                icon: Folder, // Icon dari lucide-react
                // Tambahkan properti lain jika NavItem butuh
            }));
            setFoldersInSelectedWorkspace(navFolders);

        } catch (error: any) {
             console.error(`Error loading folders for workspace ${workspaceId}:`, error);
             if (!fetchError) { setFetchError(`Gagal memuat folder: ${error.message}`); }
             setFoldersInSelectedWorkspace([]);
        } finally {
            setIsLoadingFolders(false);
        }
    }, [accessToken, user?.id, makeApiCall]); // makeApiCall dependency
    // -------------------------

    // --- Handler Pemilihan Workspace ---
    const handleWorkspaceSelect = useCallback((workspaceId: string | null) => {
        // console.log("AppSidebar: Workspace selected locally:", workspaceId);
        setSelectedWorkspaceId(workspaceId); // Update state lokal AppSidebar
        // Pemanggilan callback onWorkspaceUpdate ditangani oleh useEffect di bawah
    }, []); // Tidak butuh dependensi, hanya setter state
    // -----------------------------------

    // --- Effects ---
    useEffect(() => {
        // Load workspaces saat user & token siap
        if (user?.id && accessToken) {
            loadWorkspaces();
        } else {
             setWorkspaces([]);
             setSelectedWorkspaceId(null);
             setIsLoadingWorkspaces(false);
        }
    }, [user?.id, accessToken, loadWorkspaces]); // loadWorkspaces sbg dependensi

    useEffect(() => {
        // Fetch folders saat ID terpilih berubah
        if (selectedWorkspaceId && user?.id && accessToken) {
            fetchFoldersForWorkspace(selectedWorkspaceId);
        } else {
            setFoldersInSelectedWorkspace([]); // Kosongkan jika tidak ada ID terpilih
        }
    }, [selectedWorkspaceId, user?.id, accessToken, fetchFoldersForWorkspace]); // fetchFoldersForWorkspace sbg dependensi

    // --- EFEK BARU: Panggil Callback ke Page ---
    useEffect(() => {
        // Hanya panggil jika fungsi callback diberikan oleh Page
        if (onWorkspaceUpdate) {
            // Cari detail workspace yang terpilih dari state `workspaces`
            const selectedWS = workspaces.find(ws => ws.id === selectedWorkspaceId);
            // Panggil callback dengan ID dan Nama (atau null jika tidak ada)
            onWorkspaceUpdate(selectedWorkspaceId, selectedWS?.name || null, selectedWS?.url || null);
            // console.log("AppSidebar: Notifying Page with:", { selectedWorkspaceId, name: selectedWS?.name });
        }
        // Dijalankan ketika ID terpilih berubah, atau daftar workspace berubah (untuk update nama),
        // atau fungsi callbacknya sendiri berubah (seharusnya tidak jika pakai useCallback di Page)
    }, [selectedWorkspaceId, workspaces, onWorkspaceUpdate]);
    // -----------------------------------------

    // --- Siapkan Data untuk NavMain ---
    const navMainData: NavItem[] = useMemo(() => [
        {
            title: "Folder",
            icon: FolderTree,
            url: "#", // Atau URL dasar yang relevan
            isActive: true, // Tentukan berdasarkan rute/state jika perlu
            items: foldersInSelectedWorkspace, // Data folder dinamis
        },
        // ... item navigasi utama lainnya jika ada ...
    ], [foldersInSelectedWorkspace]);
    // ---------------------------------

    return (
      <>
            <Sidebar collapsible="icon" {...props}>
                <SidebarHeader>
                    <SemenIndonesia /> {/* Pastikan komponen ini ada */}
                    <SidebarGroupLabel className="">Workspace</SidebarGroupLabel>
                    <TeamSwitcher
                        className="rounded-2xl"
                        workspaces={workspaces}
                        selectedWorkspaceId={selectedWorkspaceId}
                        onSelectWorkspace={handleWorkspaceSelect} // Panggil handler lokal sidebar
                        isLoading={isLoadingWorkspaces}
                        // Teruskan callback refresh jika TeamSwitcher punya tombol Add yg butuh refresh
                        onWorkspaceAdded={loadWorkspaces}
                    />
                </SidebarHeader>
                <SidebarContent>
                    {/* Tampilkan error fetch jika ada */}
                    {fetchError && !isLoadingWorkspaces && !isLoadingFolders && (
                         <p className="text-xs text-red-500 p-2">{fetchError}</p>
                     )}
                    <NavMain items={navMainData} isLoadingFolders={isLoadingFolders} />
                </SidebarContent>
                {/* ... Footer Sidebar jika ada ... */}
            </Sidebar>
            {/* Dialog tambah workspace tidak dirender di sini jika ada di TeamSwitcher */}
        </>
    );
}
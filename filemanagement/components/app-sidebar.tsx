// src/components/AppSidebar.tsx
"use client"

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { FolderTree, Folder, Loader2 } from "lucide-react"; // Impor ikon
import { useUser } from "@stackframe/stack"; // Sesuaikan hook auth Anda
import { supabase } from "@/lib/supabaseClient"; // Sesuaikan path
import { TeamSwitcher } from "@/components/team-switcher"; // Komponen workspace switcher Anda
import { SemenIndonesia } from "./semenindonesia"; // Komponen header Anda
import { Sidebar, SidebarContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar"; // Komponen UI Sidebar Anda
import { NavItem, NavMain } from "./nav-main";

// --- Definisi Tipe Data (Bisa dipindah ke file terpisah) ---
interface GoogleDriveFile {
    id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string;
}
interface SupabaseItemMetadata {
    id: string; workspace_id: string; user_id: string; description?: string | null;
    color?: string | null; labels?: string[] | null; created_at?: string; updated_at?: string;
}
export interface ManagedItem extends GoogleDriveFile { metadata?: SupabaseItemMetadata | null; }
export interface Workspace { id: string; user_id: string; url: string; name: string; color?: string | null; }
// ---------------------------------------------------------

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

    // --- Helper Fetch API Google ---
    // **PENTING:** Anda perlu implementasi lengkap fungsi ini,
    // pastikan ia menangani accessToken dan error dengan benar.
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

    // --- Fungsi Fetch Data ---
    const loadWorkspaces = useCallback(async () => {
        if (!user?.id) return;
        setIsLoadingWorkspaces(true); setFetchError(null);
        try {
            const { data, error } = await supabase.from('workspace').select('id, user_id, url, name, color').eq('user_id', user.id);
            if (error) throw error;
            const loadedWorkspaces = data || [];
            setWorkspaces(loadedWorkspaces);
            if (!selectedWorkspaceId && loadedWorkspaces.length > 0) { setSelectedWorkspaceId(loadedWorkspaces[0].id); }
            else if (loadedWorkspaces.length === 0) { setSelectedWorkspaceId(null); }
        } catch (error: any) { console.error("Error loading workspaces:", error); setFetchError(`Gagal load workspace: ${error.message}`); setWorkspaces([]); setSelectedWorkspaceId(null); }
        finally { setIsLoadingWorkspaces(false); }
    }, [user?.id, supabase, selectedWorkspaceId]); // Hapus handleSelectWorkspaceForBrowse dari dep jika tidak ada lagi

    const fetchFoldersForWorkspace = useCallback(async (workspaceId: string) => {
        if (!accessToken || !user?.id) return;
        console.log(`Sidebar: Loading folders for workspace ${workspaceId}...`);
        setIsLoadingFolders(true);
        setFetchError(null);
        setFoldersInSelectedWorkspace([]);

        try {
            // 1. Definisikan SUB-FIELD yang dibutuhkan di dalam objek 'files'
            const subFields = "id, name, mimeType";

            // 2. Buat parameter 'fields' yang BENAR untuk files.list
            // Minta field 'files' di level atas, dan sebutkan sub-field di dalamnya
            const fieldsParam = `files(${subFields})`;
            // Jika Anda mungkin butuh pagination nanti, tambahkan nextPageToken:
            // const fieldsParam = `nextPageToken, files(${subFields})`;

            // Query HANYA folder
            const query = `'${workspaceId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

            // 3. Gunakan fieldsParam yang sudah benar di URL
            const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsParam)}&orderBy=name`;
            console.log("Requesting GDrive URL:", gDriveUrl); // Log URL untuk debug

            const gDriveData = await makeApiCall<{ files?: GoogleDriveFile[] }>(gDriveUrl);

            // Cek apakah makeApiCall menghasilkan error (selain dari throw di dalamnya)
            if (!gDriveData && fetchError) {
                 // Jika makeApiCall null DAN fetchError sudah di-set oleh makeApiCall, jangan proses lanjut
                 console.error("makeApiCall failed:", fetchError);
                 // Tidak perlu throw lagi karena error sudah di state
                 return;
            }

            const driveFolders = gDriveData?.files || [];
             console.log(`Sidebar: Found ${driveFolders.length} folders.`);

            const navFolders = driveFolders.map(folder => ({
                title: folder.name,
                url: `/app/workspace/${workspaceId}/folder/${folder.id}`, // Sesuaikan URL
                icon: Folder,
            }));
            setFoldersInSelectedWorkspace(navFolders);

        } catch (error: any) {
            // Catch error dari makeApiCall atau error lain
            console.error(`Error loading folders for workspace ${workspaceId}:`, error);
            // Pastikan fetchError di-set jika belum di-set oleh makeApiCall
            if (!fetchError) {
                 setFetchError(`Gagal memuat folder: ${error.message}`);
            }
            setFoldersInSelectedWorkspace([]);
        } finally {
            setIsLoadingFolders(false);
        }
    }, [accessToken, user?.id, makeApiCall, fetchError]); // Tambahkan fetchError ke dependency jika ingin re-fetch saat error berubah (opsional)

    // --- Effects ---
    useEffect(() => { if (user?.id && accessToken) { loadWorkspaces(); } }, [user?.id, accessToken, loadWorkspaces]);

    useEffect(() => {
        if (selectedWorkspaceId && user?.id && accessToken) { fetchFoldersForWorkspace(selectedWorkspaceId); }
        else { setFoldersInSelectedWorkspace([]); } // Kosongkan jika tak ada ws terpilih
    }, [selectedWorkspaceId, user?.id, accessToken, fetchFoldersForWorkspace]);

    // --- Handler ---
    const handleWorkspaceSelect = (workspaceId: string) => { setSelectedWorkspaceId(workspaceId); };

    // --- Siapkan Data untuk NavMain ---
    const navMainData = [
        {
            title: "Folder", icon: FolderTree, url: "#", isActive: true, // Selalu aktif/terbuka?
            items: foldersInSelectedWorkspace, // Data folder dinamis
        },
        // ... (Item menu lain jika ada, misal Settings) ...
    ];

  return (
      
    // <Sidebar collapsible="icon" {...props}>
    //   <SidebarHeader>
    //     <SemenIndonesia teams={data.teams} />
    //   </SidebarHeader>
    //   <SidebarContent>
    //     <NavMain items={data.navMain} />
    //     {/* <NavProjects projects={data.projects} /> */}
    //   </SidebarContent>
    //   {/* <SidebarFooter>
    //     <NavUser user={data.user} />
    //   </SidebarFooter> */}
    //   {/* <SidebarRail /> */}
    // </Sidebar>

    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SemenIndonesia />
        <SidebarGroupLabel className="">Workspace</SidebarGroupLabel>
          <TeamSwitcher
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              onSelectWorkspace={handleWorkspaceSelect}
              isLoading={isLoadingWorkspaces}
          />
          {/* Atau komponen header statis Anda */}
      </SidebarHeader>
        <SidebarContent>
              {fetchError && <p className="text-xs text-red-500 p-2">{fetchError}</p>}
              <NavMain items={navMainData} isLoadingFolders={isLoadingFolders} />
        </SidebarContent>
        {/* ... (Footer jika ada) ... */}
    </Sidebar>
    );
}

// components/workspace-view.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react"; // Tambahkan useMemo
import Link from 'next/link';
// Import komponen UI dan hook lain yang diperlukan
import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link2Icon, Search, Loader2, ArrowLeft, RefreshCcw } from "lucide-react"; // Search sudah ada
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/recentfiles/datatable";
import { columns } from "@/components/recentfiles/columns";
import { supabase } from "@/lib/supabaseClient";
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";
import { Schema } from "@/components/recentfiles/schema";
import FolderSelector from "@/components/folder-homepage";
import FileUpload from "@/components/uploadfile"; // Nama komponen disesuaikan
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { z } from "zod";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
// --- Impor untuk Search Dialog ---
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
// ---------------------------------


// --- Tipe Data & Konstanta --- (Tetap sama)
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string; createdTime?: string; modifiedTime?: string; iconLink?: string; /* Tambahkan iconLink jika di-fetch */ }
interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; nextPageToken?: string; }
interface SupabaseFileMetadata { id: string; workspace_id: string; user_id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
type LoadingStatus = 'idle' | 'loading_details' | 'loading_files' | 'ready' | 'error';

// --- Props --- (Tetap sama)
interface WorkspaceViewProps {
    workspaceId: string | null | undefined;
    folderId: string | null | undefined;
}

// ========================================================================
// Helper Functions Baru (Copy dari view-homepage atau impor dari file utilitas)
// Pastikan path ikon (/folder.svg, /file.svg, dll.) benar relatif ke folder public
// ========================================================================
function getFileIcon(mimeType: string | undefined, isFolder: boolean | undefined, iconLink?: string | null): string {
    const effectiveMimeType = mimeType || '';
    const effectiveIsFolder = isFolder || false;

    if (effectiveIsFolder) return iconLink || '/folder.svg'; // Path harus benar
    if (iconLink) return iconLink;
    if (!effectiveMimeType) return '/file.svg'; // Path harus benar

    if (effectiveMimeType.startsWith('image/')) return '/picture.svg';
    if (effectiveMimeType.startsWith('video/')) return '/video.svg';
    if (effectiveMimeType.startsWith('audio/')) return '/music.svg';
    if (effectiveMimeType.startsWith('application/zip')) return '/zip.svg';
    if (effectiveMimeType === 'application/pdf') return '/pdf.svg';
    if (effectiveMimeType.includes('word')) return '/word.svg';
    if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return '/ppt.svg';
    if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return '/xlsx.svg';
    if (effectiveMimeType === 'text/plain') return '/txt.svg';
    if (effectiveMimeType.includes('html')) return '/web.svg';
    if (effectiveMimeType.startsWith('text/')) return '/txt.svg';
    if (effectiveMimeType === 'application/vnd.google-apps.document') return '/gdoc.svg';
    if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg';
    if (effectiveMimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg';
    if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg';

    return '/file.svg'; // Default icon path
}

function getFriendlyFileType(mimeType: string | undefined, isFolder: boolean | undefined): string {
    const effectiveMimeType = mimeType || '';
    const effectiveIsFolder = isFolder || false;

    if (effectiveIsFolder) return 'Folder';
    if (!effectiveMimeType) return 'Tidak Dikenal';

    if (effectiveMimeType.startsWith('image/')) return 'Gambar';
    if (effectiveMimeType.startsWith('video/')) return 'Video';
    if (effectiveMimeType.startsWith('audio/')) return 'Audio';
    if (effectiveMimeType.startsWith('application/zip')) return 'Arsip ZIP';
    if (effectiveMimeType === 'application/pdf') return 'Dokumen PDF';
    if (effectiveMimeType.includes('word')) return 'Dokumen Word';
    if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return 'Presentasi PPT';
    if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return 'Spreadsheet Excel';
    if (effectiveMimeType === 'text/plain') return 'Teks Biasa';
    if (effectiveMimeType.includes('html')) return 'Dokumen Web';
    if (effectiveMimeType.startsWith('text/')) return 'Dokumen Teks';
    if (effectiveMimeType === 'application/vnd.google-apps.folder') return 'Folder Google';
    if (effectiveMimeType === 'application/vnd.google-apps.document') return 'Google Docs';
    if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets';
    if (effectiveMimeType === 'application/vnd.google-apps.presentation') return 'Google Slides';

    if (effectiveMimeType.includes('/')) {
        const sub = effectiveMimeType.split('/')[1]
                      .replace(/^vnd\.|\.|\+xml|x-|google-apps\./g, ' ')
                      .trim();
        return sub.charAt(0).toUpperCase() + sub.slice(1);
    }

    return 'File Lain';
}
// ========================================================================


// ========================================================================
// Komponen WorkspaceView
// ========================================================================
export function WorkspaceView({ workspaceId, folderId }: WorkspaceViewProps) {
    // --- Hook --- (Tetap sama)
    const router = useRouter();
    const app = useStackApp();
    const user = useUser();
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: ['https://www.googleapis.com/auth/drive']
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State --- (Tambahkan state untuk search)
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null | undefined>(workspaceId);
    const [currentFolderId, setCurrentFolderId] = useState<string | null | undefined>(folderId);
    const [isLoadingPageInit, setIsLoadingPageInit] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('idle');
    const [isFetchingItems, setIsFetchingItems] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState<CurrentUser | null>(null);
    const [workspaceFiles, setWorkspaceFiles] = useState<Schema[]>([]); // Data file utama untuk view ini
    const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>(workspaceId ? 'Memuat...' : 'Pilih Workspace');
    const [activeWorkspaceUrl, setActiveWorkspaceUrl] = useState<string>(workspaceId ? 'Memuat...' : '');
    const [uploadError, setUploadError] = useState<string | null>(null);

    // --- State untuk Search ---
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // --------------------------

    // --- Helper API Call --- (Tetap sama)
    const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}): Promise<T | null> => {
        // ... (kode makeApiCall tetap sama) ...
        if (!accessToken) { console.warn("makeApiCall aborted: No access token"); return null; }
         const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
         if (!(body instanceof FormData) && body && method !== 'GET') { defaultHeaders['Content-Type'] = 'application/json'; }
         const options: RequestInit = { method, headers: defaultHeaders };
         if (body) { options.body = (body instanceof FormData) ? body : JSON.stringify(body); }
         try {
             const response = await fetch(url, options);
             if (!response.ok) {
                 let errorData: any = {}; try { errorData = await response.json(); } catch (e) {}
                 const message = errorData?.error?.message || errorData?.error_description || response.statusText || `HTTP error ${response.status}`;
                 console.error("Google API Call Error:", response.status, message, errorData);
                 // Handle 401/403 specifically if needed
                 if (response.status === 401 || response.status === 403) {
                     setError("Sesi Google Anda mungkin telah berakhir atau izin tidak memadai.");
                 }
                 return null;
             }
             if (response.status === 204) return null;
             return response.json() as Promise<T>;
         } catch (err: any) { console.error("makeApiCall fetch error:", err); return null; }
    }, [accessToken]); // Hanya butuh accessToken di sini


    // --- Fetch Detail Workspace --- (Tetap sama)
    const fetchWorkspaceDetails = useCallback(async (idToFetch: string) => {
        // ... (kode fetchWorkspaceDetails tetap sama) ...
        console.log(">>> fetchWorkspaceDetails triggered for:", idToFetch);
        if (!accessToken || !idToFetch) { setError("Token atau ID tidak valid untuk fetch detail."); setLoadingStatus('error'); return; }
        setLoadingStatus('loading_details');
        setActiveWorkspaceName('Memuat...');
        setActiveWorkspaceUrl('Memuat...');
        const fields = "name, webViewLink";
        const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${idToFetch}?fields=${encodeURIComponent(fields)}`;
        try {
            const details = await makeApiCall<{ name: string; webViewLink?: string }>(url);
            if (details) {
                setActiveWorkspaceName(details.name || 'Nama Tidak Ditemukan');
                setActiveWorkspaceUrl(details.webViewLink || 'URL Tidak Tersedia');
                setError('');
                setLoadingStatus('loading_files'); // Siap untuk fetch file
                console.log("<<< fetchWorkspaceDetails SUCCESS, status -> loading_files");
            } else {
                setError(prev => `${prev || ''}Gagal memuat detail workspace (ID: ${idToFetch}). `);
                setActiveWorkspaceName('Error: Gagal Memuat');
                setActiveWorkspaceUrl('Error');
                setLoadingStatus('error');
                console.error("<<< fetchWorkspaceDetails FAILED (API null), status -> error");
            }
        } catch (err: any) {
            setError(prev => `${prev || ''}Error detail workspace: ${err.message} `);
            setActiveWorkspaceName('Error: Exception');
            setActiveWorkspaceUrl('Error');
            setLoadingStatus('error');
            console.error("<<< fetchWorkspaceDetails FAILED (exception), status -> error", err);
        }
    }, [accessToken, makeApiCall]);

    // --- Fetch File Langsung dari Workspace/Folder --- (Tetap sama)
    const fetchWorkspaceFiles = useCallback(async (currentId: string, workspaceName: string) => {
         // ... (kode fetchWorkspaceFiles tetap sama, menggunakan workspaceFiles) ...
         console.log(`>>> fetchWorkspaceFiles triggered for: ${currentId} (Name: ${workspaceName})`);
        const userId = user?.id;
        if (!currentId || !userId || !accessToken || !supabase) { setError("Prasyarat fetch file tidak terpenuhi."); setLoadingStatus('error'); console.warn("fetchWorkspaceFiles aborted: Prerequisites missing."); return; }
        setIsFetchingItems(true);
        setWorkspaceFiles([]); // Reset file sebelum fetch baru
        const workspaceNameForPath = workspaceName && !workspaceName.startsWith('Memuat') && !workspaceName.startsWith('Error') ? workspaceName : 'Folder Ini';
        const allFileIds: string[] = [];
        try {
            // Fetch files directly inside the currentId (which is folderId)
            const fileFields = "files(id, name, mimeType, webViewLink, createdTime, modifiedTime)"; // Add iconLink if needed
            const fileQuery = `'${currentId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`; // Exclude folders
            const fileUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(fileQuery)}&fields=${encodeURIComponent(fileFields)}&orderBy=name`;

            const fileData = await makeApiCall<GoogleDriveFilesListResponse>(fileUrl);
            if (fileData === null) { throw new Error(`Gagal mengambil file dari folder ID: ${currentId}.`); }
            const files = fileData.files || [];

            if (files.length > 0) {
                files.forEach(file => allFileIds.push(file.id));

                // Initial mapping
                const collectedFilesData = files.map(file => {
                     const fileInfo: Omit<Schema, 'description' | 'other'> = {
                         id: file.id,
                         filename: file.name,
                         // Pathname could be just the workspace name for simplicity here,
                         // or you might want to fetch the full path if needed (more complex)
                         pathname: workspaceNameForPath,
                         foldername: workspaceNameForPath, // Folder name is the current workspace/folder name
                         mimeType: file.mimeType,
                         webViewLink: file.webViewLink || undefined,
                         createdat: file.createdTime || undefined,
                         lastmodified: file.modifiedTime || file.createdTime || undefined,
                         isFolder: false, // These are files, not folders
                         // iconLink: file.iconLink || undefined, // Add if fetched
                     };
                     return fileInfo;
                });

                // Fetch Supabase Metadata (chunked)
                let metadataMap: Record<string, SupabaseFileMetadata> = {};
                const chunkSize = 150;
                for (let i = 0; i < allFileIds.length; i += chunkSize) {
                    const chunkIds = allFileIds.slice(i, i + chunkSize);
                    const { data: metadataList, error: metaError } = await supabase.from('file').select('id, description, labels, color')
                       .in('id', chunkIds)
                       // IMPORTANT: Use workspaceId for Supabase query context, folderId might not be the 'workspace' in Supabase
                       .eq('workspace_id', workspaceId ?? currentId) // Fallback to currentId if workspaceId is null
                       .eq('user_id', userId!);
                    if (metaError) { console.warn("Supabase meta fetch warning:", metaError.message); }
                    if (metadataList) { metadataList.forEach((meta: any) => { metadataMap[meta.id] = meta; }); }
                }

                 // Final Mapping
                 const finalFormattedFiles: Schema[] = collectedFilesData.map(fileData => {
                     const metadata = metadataMap[fileData.id];
                     const otherData: { key: string; value: any }[] = [];
                     if (metadata?.color) otherData.push({ key: 'color', value: metadata.color });
                     if (metadata?.labels?.length) otherData.push({ key: 'labels', value: metadata.labels });
                     return {
                         ...fileData,
                         description: metadata?.description ?? undefined,
                         other: otherData.length > 0 ? otherData : undefined
                     };
                 });

                finalFormattedFiles.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));
                setWorkspaceFiles(finalFormattedFiles); // Set the state

            } else {
                 setWorkspaceFiles([]); // No files found
            }
            // Clear general error if fetch was successful, but keep specific detail errors if they existed
            setError(prev => prev?.includes('Gagal memuat detail') ? prev : '');
            setLoadingStatus('ready');
            console.log(`<<< fetchWorkspaceFiles SUCCESS for ${currentId}, status -> ready`);

        } catch (err: any) {
             console.error(">>> Error during fetchWorkspaceFiles:", err);
             if (err instanceof z.ZodError) {
                 console.error(">>> Zod Validation Error:", err.errors);
                 setError(prev => `${prev || ''}Error validasi data: ${err.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')} `);
             } else {
                 setError(prev => `${prev || ''}Gagal memuat file: ${err.message} `);
             }
             setWorkspaceFiles([]);
             setLoadingStatus('error');
             console.error(`<<< fetchWorkspaceFiles FAILED for ${currentId}, status -> error`, err);
         } finally {
             setIsFetchingItems(false);
             console.log(`<<< fetchWorkspaceFiles finished (finally) for: ${currentId}`);
         }
    }, [user?.id, accessToken, supabase, makeApiCall, workspaceId]); // Include workspaceId dependency for Supabase query


    // --- Callbacks for Upload & Refresh --- (Tetap sama)
    const handleUploadSuccess = useCallback(() => {
        console.log("Upload success signal received, refreshing files...");
        if (currentFolderId && activeWorkspaceName && !activeWorkspaceName.startsWith('Memuat') && !activeWorkspaceName.startsWith('Error') ) {
             if (!isFetchingItems) {
                fetchWorkspaceFiles(currentFolderId, activeWorkspaceName);
             } else {
                console.warn("Skipping refresh during an ongoing fetch.");
             }
        } else {
            console.warn("Cannot refresh files: folder ID or workspace name is not ready.");
        }
    }, [currentFolderId, activeWorkspaceName, fetchWorkspaceFiles, isFetchingItems]);

    const handleUploadError = useCallback((fileName: string, error: string) => {
        console.error(`Upload error reported for ${fileName}: ${error}`);
        setUploadError(`Gagal mengunggah ${fileName}: ${error}`);
        toast.error(`Upload Gagal: ${fileName}`, { description: error }); // Show toast notification
    }, []);

    const refreshData = useCallback(() => {
        console.log("Refresh data triggered...");
        if (currentFolderId && activeWorkspaceName && !activeWorkspaceName.startsWith('Memuat') && !activeWorkspaceName.startsWith('Error') ) {
             if (!isFetchingItems) {
                console.log("Executing refresh via fetchWorkspaceFiles...");
                fetchWorkspaceFiles(currentFolderId, activeWorkspaceName);
             } else {
                console.warn("Skipping refresh during an ongoing fetch.");
             }
        } else {
            console.warn("Cannot refresh files: folder ID or workspace name is not ready.");
        }
    }, [currentFolderId, activeWorkspaceName, fetchWorkspaceFiles, isFetchingItems]);

    // --- useEffects ---

    // Inisialisasi User (Tetap sama)
    useEffect(() => {
        if (user) { setUserData(user); setIsLoadingPageInit(false); }
        else { setIsLoadingPageInit(true); }
    }, [user]);

    // Memulai Fetch Detail saat ID/Token berubah (Tetap sama, tapi panggil fetchWorkspaceDetails dgn folderId)
    useEffect(() => {
        console.log(">>> Primary Effect (Detail Trigger): Workspace/Folder ID or Token Changed");
        setCurrentWorkspaceId(workspaceId);
        setCurrentFolderId(folderId); // Update folder ID state
        setWorkspaceFiles([]);
        setError('');
        setUploadError(null);
        setLoadingStatus('idle');
        setIsFetchingItems(false);
        setSearchQuery(''); // Reset search query on navigation

        // **PENTING**: Fetch details of the FOLDER, not necessarily the workspace
        if (folderId && accessToken) {
             console.log(">>> Primary Effect: Calling fetchWorkspaceDetails for FOLDER:", folderId);
             // fetchWorkspaceDetails fetches name/url of a given ID, so use folderId
             fetchWorkspaceDetails(folderId);
        } else if (folderId && !accessToken) {
            setActiveWorkspaceName('Menunggu Autentikasi...');
            setLoadingStatus('error');
            setError('Token autentikasi tidak tersedia.');
        } else if (!folderId && workspaceId) { // Handle case where only workspaceId is present (maybe root?)
            console.log(">>> Primary Effect: Calling fetchWorkspaceDetails for WORKSPACE:", workspaceId);
            fetchWorkspaceDetails(workspaceId); // Fetch workspace details if no specific folder
        } else {
             // Handle case where neither is present (e.g., initial state)
            setActiveWorkspaceName('Pilih Folder'); // Adjust default text maybe
            setActiveWorkspaceUrl('');
            setLoadingStatus('idle'); // No details to fetch
        }
    }, [workspaceId, folderId, accessToken, fetchWorkspaceDetails]); // Depend on folderId too

    // Fetch Files (setelah detail siap) (Tetap sama, tapi cek currentFolderId)
    useEffect(() => {
         console.log(">>> File Fetch Effect triggered. Status:", loadingStatus);
         // Fetch files using currentFolderId
         if (loadingStatus === 'loading_files' && currentFolderId && activeWorkspaceName && user?.id && accessToken && supabase) {
             if (!activeWorkspaceName.startsWith('Error')) {
                if (!isFetchingItems) {
                    console.log(">>> File Fetch Effect: Calling fetchWorkspaceFiles for FOLDER:", currentFolderId);
                    fetchWorkspaceFiles(currentFolderId, activeWorkspaceName); // Use currentFolderId and the fetched name
                } else {
                     console.log(">>> File Fetch Effect: Skipping call (fetch already in progress).");
                }
             } else {
                 console.warn(">>> File Fetch Effect: Skipping file fetch because folder name is in error state.");
                 setLoadingStatus('error');
                 setError(prev => prev || "Tidak bisa memuat file karena detail folder gagal.");
                 setIsFetchingItems(false);
             }
         } else if (loadingStatus === 'loading_files' && !currentFolderId) {
             console.warn(">>> File Fetch Effect: Status is 'loading_files' but no currentFolderId. Setting to ready.");
             setWorkspaceFiles([]); // No folder, no files
             setLoadingStatus('ready'); // Consider it ready if no folder to fetch from
             setIsFetchingItems(false);
         } else if (loadingStatus === 'loading_files') {
             console.warn(">>> File Fetch Effect: Status is 'loading_files' but other prerequisites are missing!");
             setLoadingStatus('error');
             setError(prev => prev || "Gagal memulai fetch file, data tidak lengkap.");
             setIsFetchingItems(false);
         }
    }, [loadingStatus, currentFolderId, activeWorkspaceName, user?.id, accessToken, supabase, fetchWorkspaceFiles, isFetchingItems]);

    // --- useEffect untuk Shortcut Search ---
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setIsSearchOpen((open) => !open);
        }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }, []);
    // --------------------------------------

    // // --- Logika Filter Pencarian --- (Gunakan workspaceFiles)
    // const filteredFiles = useMemo(() => {
    //   if (!searchQuery) {
    //     // Return current files if no query
    //     return workspaceFiles;
    //   }
    //   const lowerCaseQuery = searchQuery.toLowerCase();
    //   // Filter the files currently displayed in the workspace/folder view
    //   return workspaceFiles.filter(file =>
    //     file.filename.toLowerCase().includes(lowerCaseQuery) ||
    //     (file.pathname && file.pathname.toLowerCase().includes(lowerCaseQuery))
    //     // You could add more fields like description or labels if they are part of the 'Schema' and fetched
    //   );
    // }, [workspaceFiles, searchQuery]); // Depend on the current files and the query
    // // ---------------------------------

    // --- Logika Filter Pencarian --- (Gunakan workspaceFiles)
    const filteredFiles = useMemo(() => {
      // Jika tidak ada query pencarian, tampilkan semua file di folder saat ini
      if (!searchQuery) {
        return workspaceFiles;
      }

      // Ubah query pencarian ke huruf kecil untuk pencocokan case-insensitive
      const lowerCaseQuery = searchQuery.toLowerCase();

      // Filter daftar 'workspaceFiles' (file di folder saat ini)
      return workspaceFiles.filter(file => {
        // Cek apakah nama file cocok (case-insensitive)
        const nameMatch = file.filename.toLowerCase().includes(lowerCaseQuery);

        // Cek apakah pathname (jika ada) cocok (case-insensitive)
        // Dalam konteks ini, pathname mungkin hanya nama folder saat ini,
        // tapi kita tetap sertakan untuk fleksibilitas
        const pathMatch = file.pathname && file.pathname.toLowerCase().includes(lowerCaseQuery);

        // Anda bisa menambahkan filter berdasarkan field lain jika perlu, contoh:
        // const descriptionMatch = file.description && file.description.toLowerCase().includes(lowerCaseQuery);
        // const typeMatch = getFriendlyFileType(file.mimeType, file.isFolder).toLowerCase().includes(lowerCaseQuery);

        // Kembalikan true jika salah satu kriteria cocok
        return nameMatch || pathMatch; // Tambahkan || descriptionMatch || typeMatch jika field lain difilter
      });
    }, [workspaceFiles, searchQuery]); // Dependensi: berubah jika daftar file atau query berubah
    // ---------------------------------

    // --- Render Logic --- (Tetap sama)
    if (isLoadingPageInit) { /* ... Loading Init ... */ return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Memuat sesi pengguna...</div>; }
    if (!user || !account) { /* ... Auth Wait ... */ return <div className="flex h-screen items-center justify-center text-gray-600">Menunggu autentikasi Google...</div>; }

    // Variable bantu untuk tampilan
    // Gunakan activeWorkspaceName (yang sekarang merepresentasikan nama folder yang dilihat)
    const displayFolderName = activeWorkspaceName && !activeWorkspaceName.startsWith('Memuat') && !activeWorkspaceName.startsWith('Error')
                                ? activeWorkspaceName
                                : (currentFolderId ? 'Folder Ini' : 'Pilih Folder');
    const isLoadingDetails = loadingStatus === 'loading_details';
    // Overall loading considers detail loading OR file fetching
    const isOverallLoading = isLoadingDetails || isFetchingItems;
    // Disable upload if still loading, no folder selected, or no token
    const isUploadDisabled = isOverallLoading || !currentFolderId || !accessToken;


    return (
        <SidebarProvider>
            <AppSidebar /> {/* Sidebar mungkin perlu diupdate untuk handle folder */}
            <SidebarInset>
                {/* Header */}
                <header className="flex w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex w-full items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        {/* Tampilkan Nama Folder/Workspace yang sedang dilihat */}
                        <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4">
                            <h4 className="scroll-m-20 lg:text-lg text-3xl font-bold tracking-tight mr-2 truncate" title={displayFolderName || ''}>
                                {isLoadingDetails
                                    ? <Loader2 className="h-5 w-5 animate-spin inline-block"/>
                                    : (displayFolderName || 'Pilih Folder')}
                             </h4>
                        </div>
                        {/* --- Tombol Search (Diperbarui) --- */}
                        <div className="flex-1 items-right justify-right md:items-center">
                            <Button
                                className="h-12 md:w-full w-11 h-10 md:justify-between justify-center md:pr-1"
                                variant={"outline"}
                                title="Cari file di folder ini (Ctrl+K)" // Update title
                                onClick={() => setIsSearchOpen(true)} // Buka dialog
                            >
                                <p className="text-gray-600 hidden md:inline text-md text-light">Temukan file...</p>
                                <div className=" sm:w-8 w-2 h-8 rounded-md items-center justify-center flex gap-2 px-2">
                                    <Search className="text-primary h-4 w-4" />
                                </div>
                            </Button>
                         </div>
                        {/* ------------------------------ */}
                        <NavUser/>
                    </div>
                </header>

                {/* Konten Utama */}
                <div className="flex flex-1 flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">
                    {/* Error Display (Tetap sama) */}
                     {error && ( // Show general error if present
                         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                             <span className="block sm:inline">{error}</span>
                             {/* Allow retry if possible */}
                             {(currentFolderId || workspaceId) && (
                                 <Button variant="outline" size="sm" className="ml-4"
                                         onClick={() => {
                                             setError(''); // Clear error
                                             // Retry fetching details for the current folder/workspace
                                             const idToRetry = currentFolderId || workspaceId;
                                             if (accessToken && idToRetry) fetchWorkspaceDetails(idToRetry);
                                         }}
                                         disabled={isOverallLoading || (!currentFolderId && !workspaceId) || !accessToken}>
                                 {isOverallLoading ? <Loader2 className="h-3 w-3 animate-spin"/> : "Coba Lagi"}
                                 </Button>
                             )}
                         </div>
                     )}
                    {/* Upload Error Display */}
                     {uploadError && (
                        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{uploadError}</span>
                             <Button variant="ghost" size="sm" className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setUploadError(null)}>
                                 <span className="text-orange-500">X</span> {/* Simple close */}
                             </Button>
                        </div>
                     )}

                    {/* Breadcrumb (Tetap sama, mungkin perlu penyesuaian link jika ada hierarki folder) */}
                     <div className="flex items-center justify-between mb-0 gap-4 flex-wrap bg-white p-4 rounded-xl">
                          {/* Tombol Kembali ke Home atau level atas */}
                          <Button variant="outline" size="sm" onClick={() => router.push("/")} className="order-1 sm:order-none">
                              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Home
                          </Button>
                         <Breadcrumb className="order-none sm:order-1 flex-1 min-w-0 flex sm:hidden"> {/* <-- Tambahkan 'flex' dan 'sm:hidden' */}
                             <BreadcrumbList>
                                 <BreadcrumbItem>
                                     <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
                                 </BreadcrumbItem>
                                 {/* Tampilkan nama folder saat ini sebagai breadcrumb terakhir */}
                                 {(currentFolderId || workspaceId) && ( // Tampilkan jika ada folder atau workspace ID
                                     <>
                                         <BreadcrumbSeparator />
                                         <BreadcrumbItem>
                                             {/* Kelas truncate di BreadcrumbPage sudah responsif, jadi tidak perlu diubah */}
                                             <BreadcrumbPage className="truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm" title={isLoadingDetails ? 'Memuat...' : displayFolderName}>
                                                 {isLoadingDetails ? <Loader2 className="h-4 w-4 animate-spin inline-block mr-1"/> : null}
                                                 {displayFolderName}
                                             </BreadcrumbPage>
                                         </BreadcrumbItem>
                                     </>
                                 )}
                             </BreadcrumbList>
                         </Breadcrumb>
                         {/* Placeholder to balance flex layout */}
                         <div className="order-2 sm:order-none h-9 w-24 hidden sm:block"></div>
                     </div>

                    {/* === Konten Spesifik Folder === */}
                    {(currentFolderId || (workspaceId && !currentFolderId)) && loadingStatus !== 'error' && ( // Tampilkan jika ada ID dan tidak error
                        <>
                            {/* Bagian Unggah Berkas (Gunakan currentFolderId) */}
                            <div className="bg-muted/50 col-span-2 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
                                <div>
                                    <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md mb-4">
                                        Unggah Berkas ke "{isLoadingDetails ? '...' : displayFolderName}"
                                    </h2>
                                     {/* Pastikan FileUpload menerima folderId yang benar */}
                                    <FileUpload
                                        folderId={currentFolderId ?? workspaceId} // Target upload adalah folder saat ini (atau workspace jika folder null)
                                        accessToken={accessToken}
                                        onUploadSuccess={handleUploadSuccess}
                                        onUploadError={handleUploadError}
                                        disabled={isUploadDisabled}
                                     />
                                     {isUploadDisabled && !isOverallLoading && !accessToken && <p className="text-xs text-red-600 mt-1">Autentikasi Google diperlukan.</p>}
                                     {isUploadDisabled && !isOverallLoading && accessToken && !currentFolderId && !workspaceId && <p className="text-xs text-orange-600 mt-1">Pilih folder tujuan terlebih dahulu.</p>}
                                     {isUploadDisabled && isOverallLoading && <p className="text-xs text-gray-500 mt-1">Menunggu data folder...</p>}
                                </div>
                            </div>

                            {/* Tabel File (Tetap sama, gunakan workspaceFiles) */}
                            <div className="bg-muted/50 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <h2 className="scroll-m-20 text-lg font-semibold tracking-tight lg:text-md truncate" title={`File di ${displayFolderName}`}>
                                            File di "{isLoadingDetails ? '...' : displayFolderName}"
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Daftar file yang berada langsung di dalam folder ini.
                                        </p>
                                    </div>
                                     {/* Tombol Refresh Manual (opsional) */}
                                     <Button variant="outline" size="icon" onClick={refreshData} disabled={isFetchingItems || !currentFolderId} title="Muat ulang daftar file">
                                        {isFetchingItems ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCcw className="h-4 w-4"/> /* Ganti icon refresh jika ada */}
                                     </Button>
                                </div>
                                {/* Kondisi Loading / Kosong / Tabel */}
                                {isFetchingItems ? (
                                     <div className="flex flex-col justify-center items-center p-6 text-gray-600"><Loader2 className="mb-2 h-6 w-6 animate-spin" /> Memuat file...</div>
                                 ) : loadingStatus === 'ready' && workspaceFiles.length === 0 ? (
                                     <div className="text-center p-6 text-gray-500">
                                         Folder ini kosong.
                                     </div>
                                 ) : loadingStatus === 'ready' && workspaceFiles.length > 0 ? (
                                    <DataTable<Schema, unknown>
                                        data={workspaceFiles} // Data dari state workspaceFiles
                                        columns={columns}
                                        meta={{
                                            accessToken: accessToken,
                                            onActionComplete: refreshData,
                                            supabase: supabase as SupabaseClient,
                                            userId: user?.id ?? "",
                                            // Kirim workspaceId asli dan folderId saat ini ke meta
                                            workspaceOrFolderId: workspaceId ?? currentFolderId ?? "", // ID Konteks Supabase
                                        }}
                                    />
                                 ) :  ( // Jika tidak error dan tidak fetching (misal masih loading detail)
                                     <div className="text-center p-6 text-gray-500">Menunggu detail folder...</div>
                                 )
                                }
                            </div>
                        </>
                    )}

                    {/* Tampilan jika tidak ada workspace/folder dipilih ATAU error awal */}
                    {(!currentFolderId && !workspaceId && !isLoadingPageInit) && loadingStatus !== 'error' && (
                         <div className="flex flex-col items-center justify-center flex-1 bg-white rounded-xl p-6 mt-4">
                             <h2 className="text-xl font-semibold text-gray-700 mb-2">Pilih Folder</h2>
                             <p className="text-gray-500 text-center">
                                 Pilih folder dari sidebar atau hubungkan folder baru di halaman Home.
                             </p>
                         </div>
                    )}
                    {/* Tampilan jika error sebelum ID ada */}
                     {loadingStatus === 'error' && (!currentFolderId && !workspaceId) && (
                         <div className="flex flex-col items-center justify-center flex-1 bg-red-50 rounded-xl p-6 mt-4 border border-red-200">
                              <h2 className="text-xl font-semibold text-red-700 mb-2">Terjadi Kesalahan</h2>
                              <p className="text-red-600 text-center">
                                 {error || "Tidak dapat memuat data awal."}
                              </p>
                         </div>
                     )}

                </div>

                {/* --- Dialog Pencarian (Tambahkan ini) --- */}
                <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <CommandInput
                    placeholder="Cari nama atau lokasi file..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>Tidak ada file yang cocok ditemukan di folder ini.</CommandEmpty>
                    {/* Filter berdasarkan filteredFiles */}
                    {filteredFiles.length > 0 && (
                        <CommandGroup heading={`Hasil Pencarian (${filteredFiles.length})`}>
                          {filteredFiles.map((file) => {
                            // Dapatkan path ikon dan tipe file friendly
                            const iconPath = getFileIcon(file.mimeType, file.isFolder /*, file.iconLink */);
                            const friendlyType = getFriendlyFileType(file.mimeType, file.isFolder);

                            return (
                                <CommandItem
                                  key={file.id}
                                  // Value untuk filtering internal CommandInput
                                  value={`${file.filename} ${friendlyType}`}
                                  onSelect={() => {
                                    if (file.webViewLink) {
                                      window.open(file.webViewLink, "_blank");
                                    } else {
                                        toast.warning("Tidak ada link pratinjau untuk file ini.");
                                    }
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                  }}
                                  className="cursor-pointer flex items-start gap-2" // Gunakan flexbox & gap
                                  title={`${file.filename} (${friendlyType})`}
                                >
                                  {/* Gunakan <img> untuk menampilkan ikon SVG */}
                                  <img
                                      src={iconPath}
                                      alt={friendlyType} // Alt text deskriptif
                                      className="h-4 w-4 flex-shrink-0 mt-1" // Sesuaikan ukuran & margin
                                      aria-hidden="true"
                                  />
                                  <div className="flex flex-col overflow-hidden">
                                     <span className="truncate font-medium">{file.filename}</span>
                                     {/* Tampilkan tipe file */}
                                     <span className="text-xs text-gray-500 truncate italic">
                                       {friendlyType}
                                     </span>
                                     {/* Opsional: Tampilkan path jika relevan dan tersedia */}
                                     {/* <span className="text-xs text-gray-400 truncate">{file.pathname}</span> */}
                                  </div>
                                </CommandItem>
                            );
                          })}
                        </CommandGroup>
                    )}
                  </CommandList>
                </CommandDialog>
                {/* ------------------------------------------ */}

            </SidebarInset>
        </SidebarProvider>
    );
}
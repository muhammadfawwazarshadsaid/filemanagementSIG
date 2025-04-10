// components/workspace-view.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from 'next/link';
// Import komponen UI dan hook lain yang diperlukan
import { AppSidebar } from "@/components/app-sidebar"; // Sesuaikan path jika perlu
import { NavUser } from "@/components/nav-user";       // Sesuaikan path jika perlu
import { Button } from "@/components/ui/button";       // Sesuaikan path jika perlu
import { Separator } from "@/components/ui/separator";   // Sesuaikan path jika perlu
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Sesuaikan path jika perlu
import { Link2Icon, Search, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/recentfiles/datatable"; // Sesuaikan path jika perlu
import { columns } from "@/components/recentfiles/columns";   // Sesuaikan path jika perlu
import { supabase } from "@/lib/supabaseClient";             // Sesuaikan path jika perlu
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack"; // Asumsi @stackframe/stack terinstall
import { Schema } from "@/components/recentfiles/schema"; // Sesuaikan path jika perlu
import FolderSelector from "@/components/folder-homepage"; // Sesuaikan path jika perlu
import ImageUpload from "@/components/uploadfile"; // <-- Pastikan path ini benar
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // <-- Pastikan path ini benar
import { z } from "zod";
import FileUpload from "@/components/uploadfile";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";

// --- Tipe Data & Konstanta ---
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string; createdTime?: string; modifiedTime?: string; }
interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; nextPageToken?: string; }
interface SupabaseFileMetadata { id: string; workspace_id: string; user_id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
type LoadingStatus = 'idle' | 'loading_details' | 'loading_files' | 'ready' | 'error';

// --- Props ---
interface WorkspaceViewProps {
    workspaceId: string | null | undefined;
    folderId: string | null | undefined;
}

// ========================================================================
// Komponen Reusable WorkspaceView (Final dengan perbaikan loop & scope)
// ========================================================================
export function WorkspaceView({ workspaceId,folderId }: WorkspaceViewProps) {
    // --- Hook ---
    const router = useRouter();
    const app = useStackApp();
    const user = useUser();
    // Scope drive penuh diperlukan untuk upload ke folder mana saja
    const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: [
            'https://www.googleapis.com/auth/drive' // Scope ini mencakup readonly, edit, delete, dll.
        ]
    }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };
    // Fungsi untuk menangani error izin dari komponen upload


    // --- State ---
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null | undefined>(workspaceId);
    const [currentFolderId, setCurrentFolderId] = useState<string | null | undefined>(folderId);
    const [isLoadingPageInit, setIsLoadingPageInit] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('idle');
    const [isFetchingItems, setIsFetchingItems] = useState(false); // Untuk UI loading file
    const [error, setError] = useState('');
    const [userData, setUserData] = useState<CurrentUser | null>(null);
    const [workspaceFiles, setWorkspaceFiles] = useState<Schema[]>([]);
    const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>(workspaceId ? 'Memuat...' : 'Pilih Workspace');
    const [activeWorkspaceUrl, setActiveWorkspaceUrl] = useState<string>(workspaceId ? 'Memuat...' : '');
     // PINDAHKAN STATE INI KE ATAS BERSAMA STATE LAINNYA
    const [uploadError, setUploadError] = useState<string | null>(null);


    // --- Helper API Call ---
     const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}): Promise<T | null> => {
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
                 return null;
             }
             if (response.status === 204) return null;
             return response.json() as Promise<T>;
         } catch (err: any) { console.error("makeApiCall fetch error:", err); return null; }
     }, [accessToken]);

    // --- Fetch Detail Workspace ---
    const fetchWorkspaceDetails = useCallback(async (idToFetch: string) => {
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
                setLoadingStatus('loading_files');
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

    // --- Fetch File Langsung dari Workspace (DENGAN PERBAIKAN foldername) ---
    const fetchWorkspaceFiles = useCallback(async (currentId: string, workspaceName: string) => {
        console.log(`>>> fetchWorkspaceFiles triggered for: ${currentId} (Name: ${workspaceName})`);
        const userId = user?.id;
        if (!currentId || !userId || !accessToken || !supabase) { setError("Prasyarat fetch file tidak terpenuhi."); setLoadingStatus('error'); console.warn("fetchWorkspaceFiles aborted: Prerequisites missing."); return; }
        setIsFetchingItems(true);
        setWorkspaceFiles([]);
        // Gunakan nama workspace yang sudah valid (bukan 'Memuat...' atau 'Error')
        const workspaceNameForPath = workspaceName && !workspaceName.startsWith('Memuat') && !workspaceName.startsWith('Error') ? workspaceName : 'Workspace';
        const allFileIds: string[] = [];
        try {
            const fileFields = "files(id, name, mimeType, webViewLink, createdTime, modifiedTime)";
            const fileQuery = `'${currentId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`;
            const fileUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(fileQuery)}&fields=${encodeURIComponent(fileFields)}&orderBy=name`;
            const fileData = await makeApiCall<GoogleDriveFilesListResponse>(fileUrl);
            if (fileData === null) { throw new Error("Gagal mengambil data file dari API."); }
            const files = fileData.files || [];

            if (files.length > 0) {
                files.forEach(file => allFileIds.push(file.id));

                // Pemetaan Awal (termasuk foldername)
                const collectedFilesData = files.map(file => {
                     const currentPathname = workspaceNameForPath; // Path bisa sama dengan nama folder untuk level ini
                     // Langsung buat objek yang lebih lengkap, Omit hanya jika perlu
                     const fileInfo: Omit<Schema, 'description' | 'other'> = {
                         id: file.id,
                         filename: file.name,
                         pathname: currentPathname,
                         // **** TAMBAHKAN foldername DI SINI ****
                         foldername: workspaceNameForPath, // Gunakan nama workspace sebagai nama folder
                         // *************************************
                         mimeType: file.mimeType,
                         webViewLink: file.webViewLink || undefined,
                         createdat: file.createdTime || undefined,
                         lastmodified: file.modifiedTime || file.createdTime || undefined,
                         isFolder: false
                     };
                     return fileInfo;
                });

                // Ambil Metadata Supabase (tidak perlu diubah)
                let metadataMap: Record<string, SupabaseFileMetadata> = {};
                if (allFileIds.length > 0) {
                     const chunkSize = 150;
                     for (let i = 0; i < allFileIds.length; i += chunkSize) {
                         const chunkIds = allFileIds.slice(i, i + chunkSize);
                         const { data: metadataList, error: metaError } = await supabase.from('file').select('id, description, labels, color').in('id', chunkIds).eq('workspace_id', currentId).eq('user_id', userId!);
                         if (metaError) { console.warn("Supabase meta fetch warning:", metaError.message); }
                         if (metadataList) { metadataList.forEach((meta: any) => { metadataMap[meta.id] = meta; }); }
                     }
                }

                 // Pemetaan Final (gabungkan dengan metadata)
                 const finalFormattedFiles: Schema[] = collectedFilesData.map(fileData => {
                     const metadata = metadataMap[fileData.id];
                     const otherData: { key: string; value: any }[] = [];
                     if (metadata?.color) otherData.push({ key: 'color', value: metadata.color });
                     if (metadata?.labels?.length) otherData.push({ key: 'labels', value: metadata.labels });
                     // Objek akhir sekarang akan memiliki foldername dari fileData
                     return {
                         ...fileData,
                         description: metadata?.description ?? undefined,
                         other: otherData.length > 0 ? otherData : undefined
                     };
                 });

                finalFormattedFiles.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));
                // *** DEBUGGING: Cetak satu objek untuk diperiksa ***
                if (finalFormattedFiles.length > 0) {
                    console.log("Contoh objek data final:", finalFormattedFiles[0]);
                }
                // **************************************************
                setWorkspaceFiles(finalFormattedFiles);

            } else {
                 setWorkspaceFiles([]);
            }
            setError(prev => prev?.includes('Gagal memuat detail') ? prev : '');
            setLoadingStatus('ready');
            console.log(`<<< fetchWorkspaceFiles SUCCESS, status -> ready`);
        } catch (err: any) {
            console.error(">>> Error during fetchWorkspaceFiles:", err);
            // *** DEBUGGING: Cetak error spesifik ***
            if (err instanceof z.ZodError) {
                console.error(">>> Zod Validation Error:", err.errors);
                setError(prev => `${prev || ''}Error validasi data: ${err.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')} `);
            } else {
                setError(prev => `${prev || ''}Gagal memuat file: ${err.message} `);
            }
            // ***************************************
            setWorkspaceFiles([]);
            setLoadingStatus('error');
            console.error(`<<< fetchWorkspaceFiles FAILED, status -> error`, err);
        } finally {
            setIsFetchingItems(false);
            console.log(`<<< fetchWorkspaceFiles finished (finally) for: ${currentId}`);
        }
    }, [user?.id, accessToken, supabase, makeApiCall]); // Pastikan dependensi sudah benar


    // --- Callback untuk Refresh File Setelah Upload ---
    const handleUploadSuccess = useCallback(() => {
        console.log("Upload success signal received, refreshing files...");
        // Memicu fetch ulang dengan cara yang sama seperti sebelumnya
        // Memastikan activeWorkspaceName sudah benar sebelum fetch ulang
        if (currentFolderId && activeWorkspaceName && !activeWorkspaceName.startsWith('Memuat') && !activeWorkspaceName.startsWith('Error') ) {
            // Jangan set status ke loading_files, cukup panggil fetch langsung
            // Ini akan menampilkan loader di dalam tabel saja
             if (!isFetchingItems) { // Hanya fetch jika tidak sedang fetch
                fetchWorkspaceFiles(currentFolderId, activeWorkspaceName);
             } else {
                console.warn("Skipping refresh during an ongoing fetch.");
                // Mungkin jadwalkan refresh setelah fetch saat ini selesai?
             }
        } else {
            console.warn("Cannot refresh files: folder ID or workspace name is not ready.");
            
        }
    }, [currentFolderId, activeWorkspaceName, fetchWorkspaceFiles, isFetchingItems]); // Tambahkan isFetchingItems

    // --- Callback untuk Error Upload ---
    const handleUploadError = useCallback((fileName: string, error: string) => {
        console.error(`Upload error reported for ${fileName}: ${error}`);
        setUploadError(`Gagal mengunggah ${fileName}: ${error}`); // Simpan error terakhir
        
    }, []);

    const refreshData = useCallback(() => {
        console.log("Refresh data triggered...");
        // Panggil ulang fungsi fetch data Anda
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
    }, [currentFolderId, activeWorkspaceName, fetchWorkspaceFiles, isFetchingItems]); // Dependensi untuk refresh

  // =======================================================
    // useEffect Hooks (setelah state dan callback didefinisikan)
    // =======================================================
    useEffect(() => { // Inisialisasi User
        if (user) { setUserData(user); setIsLoadingPageInit(false); }
        else { setIsLoadingPageInit(true); }
    }, [user]);

    useEffect(() => { // Memulai Fetch Detail saat ID/Token berubah
        console.log(">>> Primary Effect (Detail Trigger): Workspace ID or Token Changed");
        setCurrentWorkspaceId(workspaceId);
        // Reset folderId juga jika workspaceId berubah? Tergantung logika aplikasi Anda
        setCurrentFolderId(folderId);
        setWorkspaceFiles([]);
        setError('');
        setUploadError(null); // Reset error upload juga
        setLoadingStatus('idle');
        setIsFetchingItems(false);
        if (workspaceId && accessToken) {
             console.log(">>> Primary Effect: Calling fetchWorkspaceDetails");
             fetchWorkspaceDetails(workspaceId);
        } else if (workspaceId && !accessToken) {
            setActiveWorkspaceName('Menunggu Autentikasi...');
            setLoadingStatus('error');
            setError('Token autentikasi tidak tersedia.');
        } else {
            setActiveWorkspaceName('Pilih Workspace');
            setActiveWorkspaceUrl('');
            setLoadingStatus('idle');
        }
    // }, [workspaceId, accessToken, fetchWorkspaceDetails]); // ORIGINAL
    }, [workspaceId, folderId, accessToken, fetchWorkspaceDetails]); // Tambahkan folderId jika reset diperlukan saat berubah

    useEffect(() => { // Fetch Files (setelah detail siap)
         console.log(">>> File Fetch Effect triggered. Status:", loadingStatus);
          // Gunakan currentFolderId untuk fetch file
         if (loadingStatus === 'loading_files' && currentFolderId && activeWorkspaceName && user?.id && accessToken && supabase) {
             if (!activeWorkspaceName.startsWith('Error')) {
                if (!isFetchingItems) {
                    console.log(">>> File Fetch Effect: Calling fetchWorkspaceFiles");
                    fetchWorkspaceFiles(currentFolderId, activeWorkspaceName);
                } else {
                     console.log(">>> File Fetch Effect: Skipping call (fetch already in progress).");
                }
             } else {
                 console.warn(">>> File Fetch Effect: Skipping file fetch because workspace name is in error state.");
                 setLoadingStatus('error');
                 setError(prev => prev || "Tidak bisa memuat file karena detail workspace gagal.");
                 setIsFetchingItems(false);
             }
         } else if (loadingStatus === 'loading_files') {
             console.warn(">>> File Fetch Effect: Status is 'loading_files' but prerequisites are missing! (Folder ID?)");
             // Jika tidak ada folderId, mungkin tidak perlu fetch file? Atau set ke 'ready'?
             // Tergantung logika Anda jika tidak ada folderId
             if (!currentFolderId) {
                 console.log(">>> File Fetch Effect: No folderId, setting status to ready (no files to fetch).");
                 setWorkspaceFiles([]); // Kosongkan file jika tidak ada folder ID
                 setLoadingStatus('ready');
             } else {
                 // Jika ada folderId tapi prasyarat lain kurang
                 setLoadingStatus('error');
                 setError(prev => prev || "Gagal memulai fetch file, data tidak lengkap.");
             }
             setIsFetchingItems(false);
         }
    }, [loadingStatus, currentFolderId, activeWorkspaceName, user?.id, accessToken, supabase, fetchWorkspaceFiles, isFetchingItems]);

    // =======================================================
    // Logika Render (termasuk early returns) SEKARANG BOLEH DI SINI
    // =======================================================
    if (isLoadingPageInit) {
        return ( <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Memuat sesi...</p></div> );
    }
    if (!user || !account) {
         return ( <div className="flex h-screen items-center justify-center"><p className="text-gray-600">Menunggu autentikasi...</p></div> );
     }


    // --- Render Logic ---
    if (isLoadingPageInit) {
        return ( <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Memuat sesi...</p></div> );
    }
    if (!user || !account) {
         return ( <div className="flex h-screen items-center justify-center"><p className="text-gray-600">Menunggu autentikasi...</p></div> );
     }
    const displayWorkspaceName = activeWorkspaceName && !activeWorkspaceName.startsWith('Memuat') && !activeWorkspaceName.startsWith('Error') ? activeWorkspaceName : 'Folder Ini';
    const isLoadingDetails = loadingStatus === 'loading_details';
    const isOverallLoading = isLoadingDetails || isFetchingItems;
    const isUploadDisabled = isOverallLoading || !currentFolderId || !accessToken;



    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {/* Header */}
                <header className="flex w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex w-full items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4">
                            <h4 className="scroll-m-20 lg:text-lg text-3xl font-bold tracking-tight mr-2 truncate" title={activeWorkspaceName || ''}>
                                {(isLoadingDetails || (currentWorkspaceId && activeWorkspaceName === 'Memuat...'))
                                    ? <Loader2 className="h-5 w-5 animate-spin inline-block"/>
                                    : (activeWorkspaceName || 'Pilih Workspace')}
                             </h4>
                        </div>
                        <div className="flex-1 items-right justify-right md:items-center">
                            <Button className="h-12 md:w-full w-11 h-10 md:justify-between justify-center md:pr-1" variant={"outline"} title="Cari file (belum implementasi)">
                                 <p className="text-gray-600 hidden md:inline text-md text-light">Temukan file...</p>
                                 <div className="md:bg-black sm:w-24 w-2 h-8 rounded-full items-center justify-center flex gap-2"><Search className="text-primary"></Search><p className="hidden md:inline text-white text-xs font-bold">Search</p></div>
                             </Button>
                         </div>
                        <NavUser/>
                    </div>
                </header>

                {/* Konten Utama */}
                <div className="flex flex-1 flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">
                    {/* Error Display */}
                    {error && loadingStatus === 'error' && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                            {currentWorkspaceId && (
                                <Button variant="outline" size="sm" className="ml-4"
                                        onClick={() => {
                                            setError('');
                                            if (accessToken && currentWorkspaceId) fetchWorkspaceDetails(currentWorkspaceId);
                                        }}
                                        disabled={isOverallLoading || !currentWorkspaceId || !accessToken}>
                                {isOverallLoading ? <Loader2 className="h-3 w-3 animate-spin"/> : "Coba Lagi"}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Breadcrumb */}
                    <div className="flex items-center justify-between mb-0 gap-4 flex-wrap bg-white p-4 rounded-xl">
                         {currentWorkspaceId ? (
                            <Button variant="outline" size="sm" onClick={() => router.push("/")} className="order-1 sm:order-none">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Button>
                        ) : ( <div className="order-1 sm:order-none h-9"></div> )}
                        <Breadcrumb className="order-none sm:order-1 flex-1 min-w-0">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    {currentWorkspaceId ? (<BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>) : (<BreadcrumbPage>Home</BreadcrumbPage>)}
                                </BreadcrumbItem>
                                {currentWorkspaceId && (
                                    <>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage className="truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm" title={isLoadingDetails ? 'Memuat...' : displayWorkspaceName}>
                                                {isLoadingDetails ? 'Memuat...' : displayWorkspaceName}
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* === Konten Spesifik Workspace === */}
                    {currentWorkspaceId && loadingStatus !== 'error' && (
                        <>
                            {/* Bagian Unggah Berkas */}
                            <div className="bg-muted/50 col-span-2 gap-4 p-4 inline-flex flex-col rounded-xl bg-white mt-4">
                                <div>
                                    <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md mb-4">
                                        Unggah Berkas ke "{isLoadingDetails ? '...' : displayWorkspaceName}"
                                    </h2>
                                    <FileUpload
                                        folderId={currentFolderId} // ** PENTING: Gunakan currentFolderId **
                                        accessToken={accessToken}
                                        onUploadSuccess={handleUploadSuccess}
                                        onUploadError={handleUploadError} // Teruskan callback error
                                        disabled={isUploadDisabled} // Set disable berdasarkan kondisi
                                     />
                                </div>
                            </div>

                            {/* Tabel File */}
                            <div className="bg-muted/50 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <h2 className="scroll-m-20 text-lg font-semibold tracking-tight lg:text-md truncate" title={`File di ${displayWorkspaceName}`}>
                                            File di "{isLoadingDetails ? '...' : displayWorkspaceName}"
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Daftar file yang berada langsung di dalam folder ini.
                                        </p>
                                    </div>
                                </div>
                                {/* Kondisi Loading / Kosong / Tabel (Gunakan isFetchingItems) */}
                                {isFetchingItems ? ( // Gunakan state isFetchingItems
                                     <div className="flex flex-col justify-center items-center p-6 text-gray-600"><Loader2 className="mb-2 h-6 w-6 animate-spin" /> Memuat file...</div>
                                 ) : loadingStatus === 'ready' && workspaceFiles.length === 0 ? (
                                     <div className="text-center p-6 text-gray-500">
                                         Tidak ada file ditemukan di folder ini.
                                     </div>
                                 ) : loadingStatus === 'ready' && workspaceFiles.length > 0 ? (
                                    <DataTable<Schema, unknown>
                                        data={workspaceFiles}
                                        columns={columns}
                                        // --- >>>>> INILAH PERBAIKAN UTAMA <<<<< ---
                                        meta={{ // Teruskan meta ke DataTable
                                            accessToken: accessToken,
                                            onActionComplete: refreshData, // Gunakan callback refreshData
                                            supabase: supabase as SupabaseClient, // <-- Klien Supabase
                                            userId: user?.id ?? "",       // <-- ID User
                                            workspaceOrFolderId: currentFolderId ?? "", // <-- ID Folder ini untuk Supabase
                                        }}
                                        // --- >>>>> AKHIR PERBAIKAN UTAMA <<<<< ---
                                    />
                                 ) : ( // Jika tidak error dan tidak fetching file (mungkin masih loading detail)
                                     <div className="text-center p-6 text-gray-500">Menunggu data detail...</div>
                                 )
                                }
                            </div>
                        </>
                    )}

                    {/* === Konten Root === */}
                    {/* {!currentWorkspaceId && loadingStatus !== 'error' && (
                         <div className="flex flex-col items-center justify-center flex-1 bg-white rounded-xl p-6 mt-4">
                             <h2 className="text-xl font-semibold text-gray-700 mb-2">Selamat Datang di Home</h2>
                             <p className="text-gray-500 text-center">
                                 Pilih workspace dari sidebar untuk melihat file.
                             </p>
                            <div className="mt-6 w-full max-w-md border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3 text-center">Atau Hubungkan Folder Utama Baru</h3>
                                <FolderSelector initialTargetWorkspaceId={null} />
                            </div>
                         </div>
                    )} */}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
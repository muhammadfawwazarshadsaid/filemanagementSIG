"use client";

// --- Impor ---
import React, { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar"; // Sesuaikan path
import { NavUser } from "@/components/nav-user";       // Sesuaikan path
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link2Icon, Search, Loader2 } from "lucide-react"; // Impor ikon relevan
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/recentfiles/datatable"; // Sesuaikan path
import { columns } from "@/components/recentfiles/columns";   // Impor columns yang sesuai
import { supabase } from "@/lib/supabaseClient";             // Sesuaikan path
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";
// Gunakan Schema dari schema.ts
import { Schema } from "@/components/recentfiles/schema"; // Sesuaikan path
import FolderSelector from "@/components/folder-homepage";
import { SupabaseClient } from "@supabase/supabase-js";
// FolderSelector mungkin tidak relevan lagi
// import FolderSelector from "@/components/folder-homepage";

// --- Tipe Data ---
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string; createdTime?: string; modifiedTime?: string; }
interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; nextPageToken?: string; }
interface SupabaseFileMetadata { id: string; workspace_id: string; user_id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
// FolderPathItem tidak perlu

// Konstanta
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

// ========================================================================
// Komponen Utama Page
// ========================================================================
export default function Page() {
  // --- State ---
  const router = useRouter();
  const app = useStackApp();
  const user = useUser();
 const account = user ? user.useConnectedAccount('google', {
        or: 'redirect',
        scopes: [
            'https://www.googleapis.com/auth/drive' // Scope ini mencakup readonly, edit, delete, dll.
        ]
    }) : null;
  // Hapus isLoadingToken
  const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

  const [isLoadingPageInit, setIsLoadingPageInit] = useState(true);
  const [isFetchingItems, setIsFetchingItems] = useState(false); // Loading fetch semua file
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [allFormattedFiles, setAllFormattedFiles] = useState<Schema[]>([]); // State untuk semua file

  // State Workspace
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>('Memuat...');
  const [activeWorkspaceUrl, setActiveWorkspaceUrl] = useState<string>('Memuat...');
  // State navigasi folder tidak diperlukan lagi
  // ----------------------

  // --- Helper API Call ---
  const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}): Promise<T | null> => {
      if (!accessToken) {
          setError("Akses token Google tidak tersedia."); setIsFetchingItems(false); return null;
      }
      const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
      if (!(body instanceof FormData) && body && method !== 'GET') { defaultHeaders['Content-Type'] = 'application/json'; }
      const options: RequestInit = { method, headers: defaultHeaders };
      if (body) { options.body = (body instanceof FormData) ? body : JSON.stringify(body); }
      try {
          const response = await fetch(url, options);
          if (!response.ok) {
              let errorData: any = {}; try { errorData = await response.json(); } catch (e) {}
              const message = errorData?.error?.message || errorData?.error_description || response.statusText || `HTTP error ${response.status}`;
              if (response.status === 401) { setError("Sesi Google Anda mungkin telah berakhir."); }
              else { setError(`Google API Error (${response.status}): ${message}`); }
              console.error("Google API Call Error:", response.status, message, errorData);
              return null;
          }
          if (response.status === 204) return null;
          return response.json() as Promise<T>;
      } catch (err: any) { setError(`Gagal menghubungi Google Drive API: ${err.message}`); return null; }
  }, [accessToken]);
  // --------------------------------------------------

  // --- Callback Update Workspace ---
  const handleWorkspaceUpdate = useCallback((workspaceId: string | null, workspaceName: string | null, workspaceUrl: string | null) => {
    console.log(">>> Page: handleWorkspaceUpdate called with ID:", workspaceId);
    if (activeWorkspaceId !== workspaceId) {
      setActiveWorkspaceId(workspaceId);
      setActiveWorkspaceName(workspaceName || (workspaceId ? 'Memuat Nama...' : 'Pilih Workspace'));
      setActiveWorkspaceUrl(workspaceUrl || (workspaceId ? 'Memuat URL...' : 'Menampilkan URL...'));
      setAllFormattedFiles([]); // Kosongkan file lama
      setIsFetchingItems(workspaceId ? true : false); // Mulai loading jika ID baru valid
      setError('');
    } else if (workspaceId) { // Update nama/url jika ID sama
        setActiveWorkspaceName(workspaceName || 'Nama Workspace?');
        setActiveWorkspaceUrl(workspaceUrl || 'URL Workspace?');
    }
  }, [activeWorkspaceId]);
  // ------------------------------------------------------

  // --- Fungsi Fetch SEMUA FILE DARI SUBFOLDER LEVEL 1 --- (Logika Baru)
  const fetchWorkspaceSubfolderFiles = useCallback(async () => {
      // Validasi prasyarat
      if (!activeWorkspaceId || !activeWorkspaceName || !user?.id || !accessToken || !supabase) {
          console.warn(">>> Page: fetchWorkspaceSubfolderFiles aborted, prerequisites missing.");
          setAllFormattedFiles([]); setIsFetchingItems(false);
          if (!activeWorkspaceId) setError("Silakan pilih workspace terlebih dahulu.");
          else if (!accessToken) setError("Token Google tidak tersedia.");
          return;
      }

      setIsFetchingItems(true); setError('');
      // Tampung data GDrive dulu, metadata ditambahkan nanti
      const collectedFilesData: Omit<Schema, 'description' | 'other'>[] = [];
      const allFileIds: string[] = []; // Kumpulkan ID untuk fetch metadata

      try {
          // === Tahap 1: Cari Folder Level 1 di dalam Workspace ===
          console.log("Fetching Level 1 Folders in:", activeWorkspaceId);
          const folderFields = "files(id, name)";
          const folderQuery = `'${activeWorkspaceId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`;
          const folderUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(folderQuery)}&fields=${encodeURIComponent(folderFields)}&orderBy=name`;

          const folderData = await makeApiCall<GoogleDriveFilesListResponse>(folderUrl);
          if (folderData === null) {
              // Jika gagal fetch folder, mungkin set error atau anggap tidak ada subfolder
              console.error(`Gagal mengambil daftar folder di ${activeWorkspaceName}.`);
              setError(`Gagal mengambil daftar folder di ${activeWorkspaceName}.`);
              setAllFormattedFiles([]);
              setIsFetchingItems(false);
              return;
          }

          const subfoldersLevel1 = folderData.files || [];
          console.log(`Found ${subfoldersLevel1.length} level 1 folders.`);

          // Jika tidak ada subfolder, tampilkan pesan (atau tabel kosong)
          if (subfoldersLevel1.length === 0) {
               console.log("No subfolders found in this workspace.");
               setAllFormattedFiles([]); // Pastikan kosong
               // Tidak perlu set error, cukup tampilkan tabel kosong nanti
               setIsFetchingItems(false);
               return;
          }

          // === Tahap 2: Ambil HANYA FILE di dalam setiap Folder Level 1 ===
          const fileFetchPromises = subfoldersLevel1.map(async (subfolder) => {
              // Pastikan subfolder valid sebelum fetch
              if (!subfolder?.id || !subfolder?.name) {
                   console.warn("Invalid subfolder data found:", subfolder);
                   return []; // Kembalikan array kosong jika data subfolder tidak valid
              }

              console.log(`Workspaceing files inside subfolder: ${subfolder.name} (${subfolder.id})`);
              // Delay kecil opsional untuk menghindari rate limit jika banyak subfolder
              // await new Promise(resolve => setTimeout(resolve, 50));

              const fileFields = "files(id, name, mimeType, webViewLink, createdTime, modifiedTime)";
              const fileQuery = `'${subfolder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`;
              const fileUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(fileQuery)}&fields=${encodeURIComponent(fileFields)}&orderBy=name`;

              const fileData = await makeApiCall<GoogleDriveFilesListResponse>(fileUrl);
              if (fileData === null) {
                  console.warn(`Failed to fetch files for subfolder ${subfolder.name}. Skipping.`);
                  // Bisa set error minor di sini jika perlu
                  setError(prev => `${prev || ''} Gagal load folder "${subfolder.name}".`.trim());
                  return []; // Kembalikan array kosong jika gagal fetch
              }

              const filesInSubfolder = fileData.files || [];
              const currentPathname = `${activeWorkspaceName} / ${subfolder.name}`; // Path folder ini

              // Map file yang ditemukan
              // Map file yang ditemukan
              return filesInSubfolder.map(file => {
                  allFileIds.push(file.id); // Kumpulkan ID untuk metadata

                  // Beri tipe annotation (Omit) dan buat objek literal
                  // Pastikan tipe Schema masih memiliki isFolder jika error ini muncul
                  const fileInfo: Omit<Schema, 'description' | 'other'> = {
                      id: file.id,
                      filename: file.name,
                      pathname: currentPathname, // Path folder ini
                      mimeType: file.mimeType,
                      webViewLink: file.webViewLink || undefined,
                      createdat: file.createdTime || undefined,
                      lastmodified: file.modifiedTime || file.createdTime || undefined,
                      isFolder: false, // <-- **** TAMBAHKAN BARIS INI ****
                      // foldername mungkin tidak perlu jika Schema tidak memilikinya lagi
                      // foldername: subfolder.name || undefined,
                  };
                  return fileInfo;
              });
          });

          // Tunggu semua fetch file selesai, lalu gabungkan hasilnya
          const filesFromSubfoldersArrays = await Promise.all(fileFetchPromises);
          const collectedFilesData = filesFromSubfoldersArrays.flat(); // Gabungkan array hasil
          console.log(`Total files collected from subfolders (before metadata): ${collectedFilesData.length}`);

          // Jika tidak ada file sama sekali setelah cek semua subfolder
          if (collectedFilesData.length === 0) {
              console.log("No files found inside any of the subfolders.");
              setAllFormattedFiles([]);
              // Tidak perlu set error, cukup tabel kosong
              setIsFetchingItems(false);
              return;
          }

          // === Tahap 3: Fetch Metadata Supabase ===
          let metadataMap: Record<string, SupabaseFileMetadata> = {};
          if (allFileIds.length > 0) {
              console.log(`Workspaceing Supabase metadata for ${allFileIds.length} files.`);
              const chunkSize = 150; // Batas aman? Sesuaikan jika perlu
              for (let i = 0; i < allFileIds.length; i += chunkSize) {
                  const chunkIds = allFileIds.slice(i, i + chunkSize);
                   const { data: metadataList, error: metaError } = await supabase
                      .from('file').select('id, description, labels, color')
                      .in('id', chunkIds).eq('workspace_id', activeWorkspaceId).eq('user_id', user.id);
                  if (metaError) { console.warn("Supabase meta fetch warning:", metaError.message); setError(prev => prev ? `${prev} | Gagal load metadata.` : `Warning: Gagal memuat sebagian metadata.`); }
                  if (metadataList) { metadataList.forEach((meta: any) => { metadataMap[meta.id] = meta; }); }
              }
          }

          // === Tahap 4: Gabungkan Metadata ===
          const finalFormattedFiles: Schema[] = collectedFilesData.map(fileData => {
              const metadata = metadataMap[fileData.id];
              const otherData: { key: string; value: any }[] = [];
              if (metadata?.color) otherData.push({ key: 'color', value: metadata.color });
              if (metadata?.labels?.length) otherData.push({ key: 'labels', value: metadata.labels });

              // Buat objek akhir sesuai tipe Schema
              return {
                  ...fileData, // Sebar data GDrive (id, filename, pathname, mimeType, dll)
                  description: metadata?.description ?? undefined, // Tambah metadata
                  other: otherData.length > 0 ? otherData : undefined, // Tambah metadata
                  // Pastikan semua properti dari Schema ada
              };
          });

          // === Tahap 5: Urutkan & Set State ===
          finalFormattedFiles.sort((a, b) => {
             if (a.filename.toLowerCase() < b.filename.toLowerCase()) return -1; // Sort nama case-insensitive
             if (a.filename.toLowerCase() > b.filename.toLowerCase()) return 1;
             return 0;
          });
          setAllFormattedFiles(finalFormattedFiles);

      } catch (err: any) {
          console.error(">>> Error during workspace subfolder file fetching:", err);
          setError(`Gagal memuat file dari subfolder: ${err.message}`);
          setAllFormattedFiles([]); // Kosongkan jika error
      } finally {
          setIsFetchingItems(false); // Selesai loading (baik sukses maupun gagal)
      }
  }, [activeWorkspaceId, activeWorkspaceName, user?.id, accessToken, supabase, makeApiCall, setError]); // Dependensi fetch
  // --------------------------------------------------------

  // --- useEffect Inisialisasi Halaman --- (Sama)
  // --- useEffect Inisialisasi Halaman ---
  useEffect(() => {
    const checkOnboardingAndRedirect = async () => {
      if (!user || !supabase || !router) {
        console.log("Waiting for user, supabase, or router...");
        return;
      }

      const userId = user.id;
      console.log("Checking or initiating onboarding for user:", userId);

      // Coba ambil status onboarding
      const { data: statusData, error: statusError } = await supabase
          .from('onboarding_status')
          .select('is_completed')
          .eq('user_id', userId)
          .maybeSingle(); // Gunakan maybeSingle() agar error 'PGRST116' tidak muncul, tapi data bisa null

      // Handle error selain 'tidak ditemukan'
      if (statusError) {
           console.error("Error fetching onboarding status:", statusError);
           // Tampilkan pesan error atau coba lagi?
           return;
      }

      // --- Logika Inti yang Diperbarui ---

      // Kasus 1: Record ditemukan dan onboarding SUDAH selesai
      if (statusData && statusData.is_completed) {
          console.log("User onboarding complete.");
          // Tandai inisialisasi selesai jika perlu (misal: setIsLoadingPageInit(false))

      // Kasus 2: Record ditemukan TAPI onboarding BELUM selesai
      } else if (statusData && !statusData.is_completed) {
          console.log("User onboarding record exists but not complete. Redirecting...");
          router.push('/selesaikanpendaftaran'); // Redirect

      // Kasus 3: Record TIDAK ditemukan (statusData adalah null) -> Ini pengguna baru untuk check ini!
      } else if (!statusData) {
          console.log("Onboarding status not found for user. Creating record and redirecting...");

          // Buat record baru dengan is_completed = false
          const { error: insertError } = await supabase
              .from('onboarding_status')
              .insert({ user_id: userId, is_completed: false }); // Insert user ID dan set false

          if (insertError) {
              console.error("Error creating onboarding status record:", insertError);
              // Bagaimana menangani error ini? Tetap redirect? Tampilkan pesan?
              // Untuk sekarang, kita tetap redirect karena user belum onboard.
          } else {
              console.log("Onboarding record created successfully for user:", userId);
          }

          // Tetap redirect karena mereka perlu menyelesaikan onboarding
          router.push('/selesaikanpendaftaran');
      }
    };

    checkOnboardingAndRedirect();

  }, [app, supabase, router, user]); // Pastikan user ada di dependencies
  // --- useEffect Fetch SEMUA File --- (Trigger fetchWorkspaceSubfolderFiles)
  useEffect(() => {
      // Panggil fetch jika workspace ada DAN user+token siap
      if (activeWorkspaceId && activeWorkspaceName && user?.id && accessToken) {
          console.log(`>>> Page UseEffect [Files]: Triggering fetchWorkspaceSubfolderFiles for ${activeWorkspaceId}.`);
          fetchWorkspaceSubfolderFiles();
      } else {
          // Reset jika prasyarat tidak terpenuhi
          setAllFormattedFiles([]);
          setIsFetchingItems(false);
          let reason = [];
          if (!activeWorkspaceId || !activeWorkspaceName) reason.push("Workspace not ready");
          if (!user?.id) reason.push("User not loaded");
          if (!accessToken) reason.push("Access token not ready");
          console.log(`>>> Page UseEffect [Files]: Skipping fetch. Reason(s): ${reason.join(', ')}`);
      }
  // Dependensi: fungsi fetch, ID & nama workspace, user, token
  }, [fetchWorkspaceSubfolderFiles, activeWorkspaceId, activeWorkspaceName, user?.id, accessToken]);
  // ----------------------------------------------------------------

  // --- Fungsi Navigasi Dihapus ---

  // --- Render ---
  if (isLoadingPageInit || !user || !account) { /* ... return loading init ... */ }
  if (error && !activeWorkspaceId && !isLoadingPageInit) { /* ... return error init ... */ }

   // Variabel bantu (hanya nama workspace)
   const currentPathDisplay = activeWorkspaceName || '...';

   return (
    <SidebarProvider>
      <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdate} />
      <SidebarInset>
        
        <header className="flex w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            {/* Header content */}
            <div className="flex w-full items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4">
                    <h4 className="scroll-m-20 lg:text-lg text-3xl font-bold tracking-tight mr-2 truncate" title={activeWorkspaceName || ''}>
                      {activeWorkspaceName || 'Pilih Workspace'}
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
        <div className="flex flex-1 flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">

           {error && ( /* ... alert error (tombol coba lagi trigger fetchWorkspaceSubfolderFiles) ... */
               <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                   <span className="block sm:inline">{error}</span>
                   <Button variant="outline" size="sm" className="ml-4" onClick={fetchWorkspaceSubfolderFiles} disabled={isFetchingItems || !activeWorkspaceId}>
                     {isFetchingItems ? <Loader2 className="h-3 w-3 animate-spin"/> : "Coba Lagi"}
                   </Button>
               </div>
           )}

           {/* Info Workspace (Tanpa Breadcrumbs) */}
           <div className="bg-muted/50 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
             <div>
               <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">Lokasi Workspace</h2>
               <p className="text-xs text-gray-500">Workspace Aktif: {activeWorkspaceName || '...'}</p>
             </div>
             {/* Link ke GDrive (sama) */}
             {activeWorkspaceUrl && activeWorkspaceUrl !== 'Memuat...' && activeWorkspaceUrl !== 'Menampilkan URL...' ? (
                <>
                 <div className="flex items-center gap-2 bg-[oklch(0.971_0.014_246.32)] border-2 border-[oklch(0.55_0.2408_261.8)] p-2 rounded-md overflow-hidden">
                    <Link2Icon className="text-gray-500 flex-shrink-0" size={20} color="#095FF9"></Link2Icon>
                    <h1 className="break-words whitespace-normal flex-1 font-semibold underline text-[oklch(0.55_0.2408_261.8)] text-sm">
                       <a href={activeWorkspaceUrl} target="_blank" rel="noopener noreferrer" title={`Buka ${activeWorkspaceName} di Google Drive`}>{activeWorkspaceUrl}</a>
                    </h1>
                 </div>
                 <Button variant={"outline"} size="sm" className="w-fit mt-1"><a href={activeWorkspaceUrl} target="_blank" rel="noopener noreferrer">Kunjungi di Drive</a></Button>
                </>
             ) : ( <p className="text-sm text-gray-500">{activeWorkspaceId ? 'Memuat URL...' : 'Pilih workspace.'}</p> )}
             {/* Breadcrumbs Dihapus */}
           </div>

           <FolderSelector initialTargetWorkspaceId={activeWorkspaceId} />

           {/* Tabel HANYA FILE */}
           <div className="bg-muted/50 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
             <div className="flex justify-between items-center mb-2">
               <div>
                 {/* Judul diubah */}
                 <h2 className="scroll-m-20 text-lg font-semibold tracking-tight lg:text-md truncate" title={`Semua file di Subfolder ${activeWorkspaceName}`}>
                    Semua File di Folder
                 </h2>
                 <p className="text-xs text-gray-500">Semua file yang berada pada folder suatu workspace ditampilkan di sini.</p>
               </div>
             </div>
             {/* Kondisi Loading / Kosong / Tabel */}
             {isFetchingItems ? (
                <div className="flex flex-col justify-center items-center p-6 text-gray-600"><Loader2 className="mb-2 h-6 w-6 animate-spin" /> Memuat semua file dari subfolder...</div>
             ) : !activeWorkspaceId ? (
                  <div className="text-center p-6 text-gray-500">Pilih workspace untuk memulai.</div>
             // Gunakan state allFormattedFiles
             ) : allFormattedFiles.length === 0 && !isFetchingItems ? (
                 <div className="text-center p-6 text-gray-500">Tidak ada file ditemukan di dalam subfolder workspace ini.</div>
             ) : (
                 <DataTable<Schema, unknown>
                      data={allFormattedFiles}
                      columns={columns}
                      // --- >>>>> INILAH PERBAIKAN UNTUK ROOT <<<<< ---
                      meta={{ // Teruskan meta ke DataTable
                        accessToken: accessToken,
                        onActionComplete: fetchWorkspaceSubfolderFiles,
                        supabase: supabase as SupabaseClient, // <-- Klien Supabase
                        userId: user?.id ?? "",       // <-- ID User
                        workspaceOrFolderId: activeWorkspaceId,
                          // userId: user?.id, // Jika diperlukan
                      }}
                      // --- >>>>> AKHIR PERBAIKAN UNTUK ROOT <<<<< ---
                  />
             )}
           </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
   )
}
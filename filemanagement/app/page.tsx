"use client";

// --- Impor ---
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// Hapus impor ikon file dari lucide-react jika tidak digunakan di tempat lain
// import { Link2Icon, Search, Loader2, FileText, FileSpreadsheet, FileImage, FileArchive, FileQuestion, FileVideo, FileAudio, FileCode } from "lucide-react";
import { Link2Icon, Search, Loader2 } from "lucide-react"; // Hanya impor yang masih digunakan
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/recentfiles/datatable";
import { columns } from "@/components/recentfiles/columns";
import { supabase } from "@/lib/supabaseClient";
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";
import { Schema } from "@/components/recentfiles/schema";
import FolderSelector from "@/components/folder-homepage";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  // CommandSeparator, // Hapus jika tidak dipakai
  // CommandShortcut, // Hapus jika tidak dipakai
} from "@/components/ui/command";

// --- Tipe Data --- (Tetap sama, pastikan Schema memiliki isFolder: boolean)
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string; createdTime?: string; modifiedTime?: string; iconLink?: string; /* Tambahkan iconLink jika di-fetch */ }
interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; nextPageToken?: string; }
interface SupabaseFileMetadata { id: string; workspace_id: string; user_id: string; description?: string | null; color?: string | null; labels?: string[] | null; }

// Konstanta (Tetap sama)
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

// ========================================================================
// Helper Functions Baru
// ========================================================================

// Fungsi untuk mendapatkan path ikon SVG
function getFileIcon(mimeType: string | undefined, isFolder: boolean | undefined, iconLink?: string | null): string {
    // Beri nilai default jika undefined
    const effectiveMimeType = mimeType || '';
    const effectiveIsFolder = isFolder || false;

    if (effectiveIsFolder) return iconLink || '/folder.svg'; // Asumsi path /public/icons/
    if (iconLink) return iconLink; // Gunakan iconLink jika ada (meski saat ini tidak di-fetch)
    if (!effectiveMimeType) return '/file.svg';

    // Logika pemetaan mimeType ke ikon SVG
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
    if (effectiveMimeType.startsWith('text/')) return '/txt.svg'; // Fallback untuk tipe teks lain
    if (effectiveMimeType === 'application/vnd.google-apps.document') return '/gdoc.svg';
    if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg';
    if (effectiveMimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg';
    // Tambahkan mimeType folder Google jika perlu dibedakan dari folder biasa
    if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg'; // Contoh

    return '/icons/file.svg'; // Ikon default
}

// Fungsi untuk mendapatkan nama tipe file yang ramah pengguna
function getFriendlyFileType(mimeType: string | undefined, isFolder: boolean | undefined): string {
    // Beri nilai default jika undefined
    const effectiveMimeType = mimeType || '';
    const effectiveIsFolder = isFolder || false;

    if (effectiveIsFolder) return 'Folder';
    if (!effectiveMimeType) return 'Tidak Dikenal';

    // Logika pemetaan mimeType ke nama tipe
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
    if (effectiveMimeType.startsWith('text/')) return 'Dokumen Teks'; // Fallback
    if (effectiveMimeType === 'application/vnd.google-apps.folder') return 'Folder Google'; // Harus sebelum 'includes('/')'
    if (effectiveMimeType === 'application/vnd.google-apps.document') return 'Google Docs';
    if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets';
    if (effectiveMimeType === 'application/vnd.google-apps.presentation') return 'Google Slides';

    // Coba ekstrak dari mimeType jika tidak ada yang cocok di atas
    if (effectiveMimeType.includes('/')) {
        const sub = effectiveMimeType.split('/')[1]
                      .replace(/^vnd\.|\.|\+xml|x-|google-apps\./g, ' ') // Bersihkan prefix umum
                      .trim();
        // Capitalize huruf pertama
        return sub.charAt(0).toUpperCase() + sub.slice(1);
    }

    return 'File Lain'; // Default jika tidak ada yang cocok
}


// ========================================================================
// Komponen Utama Page
// ========================================================================
export default function Page() {
  // --- State --- (Sama seperti sebelumnya)
  const router = useRouter();
  const app = useStackApp();
  const user = useUser();
  const account = user ? user.useConnectedAccount('google', { or: 'redirect', scopes: ['https://www.googleapis.com/auth/drive'] }) : null;
  const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

  const [isLoadingPageInit, setIsLoadingPageInit] = useState(true);
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [allFormattedFiles, setAllFormattedFiles] = useState<Schema[]>([]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>('Memuat...');
  const [activeWorkspaceUrl, setActiveWorkspaceUrl] = useState<string>('Memuat...');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Helper API Call --- (Tetap sama)
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

  // --- Callback Update Workspace --- (Tetap sama)
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

  // --- Fungsi Fetch SEMUA FILE DARI SUBFOLDER LEVEL 1 --- (Tetap sama)
  // Pastikan 'isFolder' ada dalam tipe Schema dan di-set false saat mapping file
  const fetchWorkspaceSubfolderFiles = useCallback(async () => {
      if (!activeWorkspaceId || !activeWorkspaceName || !user?.id || !accessToken || !supabase) { /* ... */ return; }
      setIsFetchingItems(true); setError('');
      const collectedFilesData: Omit<Schema, 'description' | 'other'>[] = [];
      const allFileIds: string[] = [];

      try {
          // Tahap 1: Cari Folder Level 1
          const folderFields = "files(id, name)"; // Hanya butuh id & name folder
          const folderQuery = `'${activeWorkspaceId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`;
          const folderUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(folderQuery)}&fields=${encodeURIComponent(folderFields)}&orderBy=name`;
          const folderData = await makeApiCall<GoogleDriveFilesListResponse>(folderUrl);
          if (folderData === null) { /* handle error */ setError(`Gagal mengambil folder di ${activeWorkspaceName}.`); setAllFormattedFiles([]); setIsFetchingItems(false); return; }
          const subfoldersLevel1 = folderData.files || [];
          if (subfoldersLevel1.length === 0) { /* handle no subfolders */ setAllFormattedFiles([]); setIsFetchingItems(false); return; }

          // Tahap 2: Ambil FILE di dalam setiap Folder Level 1
          const fileFetchPromises = subfoldersLevel1.map(async (subfolder) => {
              if (!subfolder?.id || !subfolder?.name) return [];
              // **PENTING**: Tambahkan 'iconLink' jika ingin menggunakannya di getFileIcon
              // const fileFields = "files(id, name, mimeType, webViewLink, createdTime, modifiedTime, iconLink)"; // Tambahkan iconLink
              const fileFields = "files(id, name, mimeType, webViewLink, createdTime, modifiedTime)"; // Tanpa iconLink (sesuai kode sebelumnya)
              const fileQuery = `'${subfolder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`;
              const fileUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(fileQuery)}&fields=${encodeURIComponent(fileFields)}&orderBy=name`;
              const fileData = await makeApiCall<GoogleDriveFilesListResponse>(fileUrl);
              if (fileData === null) { /* handle error */ setError(prev => `${prev || ''} Gagal load folder "${subfolder.name}".`.trim()); return []; }
              const filesInSubfolder = fileData.files || [];
              const currentPathname = `${activeWorkspaceName} / ${subfolder.name}`;

              return filesInSubfolder.map(file => {
                  allFileIds.push(file.id);
                  const fileInfo: Omit<Schema, 'description' | 'other'> = {
                      id: file.id,
                      filename: file.name,
                      pathname: currentPathname,
                      mimeType: file.mimeType,
                      webViewLink: file.webViewLink || undefined,
                      createdat: file.createdTime || undefined,
                      lastmodified: file.modifiedTime || file.createdTime || undefined,
                      isFolder: false, // <-- Penting: file di sini bukan folder
                      // iconLink: file.iconLink || undefined, // <-- Tambahkan jika field di-fetch
                  };
                  return fileInfo;
              });
          });

          const filesFromSubfoldersArrays = await Promise.all(fileFetchPromises);
          const collectedFilesData = filesFromSubfoldersArrays.flat();
          if (collectedFilesData.length === 0) { /* handle no files */ setAllFormattedFiles([]); setIsFetchingItems(false); return; }

          // Tahap 3 & 4: Fetch Metadata Supabase & Gabungkan
          let metadataMap: Record<string, SupabaseFileMetadata> = {};
          if (allFileIds.length > 0) { /* ... kode fetch metadata ... */
              const chunkSize = 150;
              for (let i = 0; i < allFileIds.length; i += chunkSize) {
                  const chunkIds = allFileIds.slice(i, i + chunkSize);
                   const { data: metadataList, error: metaError } = await supabase
                      .from('file').select('id, description, labels, color')
                      .in('id', chunkIds).eq('workspace_id', activeWorkspaceId).eq('user_id', user.id);
                  if (metaError) { console.warn("Supabase meta fetch warning:", metaError.message); setError(prev => prev ? `${prev} | Gagal load metadata.` : `Warning: Gagal memuat sebagian metadata.`); }
                  if (metadataList) { metadataList.forEach((meta: any) => { metadataMap[meta.id] = meta; }); }
              }
          }

          const finalFormattedFiles: Schema[] = collectedFilesData.map(fileData => {
              const metadata = metadataMap[fileData.id];
              const otherData: { key: string; value: any }[] = [];
              if (metadata?.color) otherData.push({ key: 'color', value: metadata.color });
              if (metadata?.labels?.length) otherData.push({ key: 'labels', value: metadata.labels });
              return {
                  ...fileData, // Pastikan fileData punya isFolder dan iconLink (jika ada)
                  description: metadata?.description ?? undefined,
                  other: otherData.length > 0 ? otherData : undefined,
              };
          });

          // Tahap 5: Urutkan & Set State
          finalFormattedFiles.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));
          setAllFormattedFiles(finalFormattedFiles);

      } catch (err: any) {
          console.error(">>> Error during workspace subfolder file fetching:", err);
          setError(`Gagal memuat file dari subfolder: ${err.message}`);
          setAllFormattedFiles([]);
      } finally {
          setIsFetchingItems(false);
      }
  }, [activeWorkspaceId, activeWorkspaceName, user?.id, accessToken, supabase, makeApiCall, setError]);

  // --- useEffects --- (Inisialisasi, Fetch Files, Shortcut - Tetap sama)
  useEffect(() => { /* ... Check Onboarding ... */
      const checkOnboardingAndRedirect = async () => {
        if (!user || !supabase || !router) return;
        const userId = user.id;
        const { data: statusData, error: statusError } = await supabase
            .from('onboarding_status').select('is_completed').eq('user_id', userId).maybeSingle();
        if (statusError) { console.error("Error fetching onboarding status:", statusError); return; }
        if (statusData && statusData.is_completed) { /* User onboarded */ }
        else if (statusData && !statusData.is_completed) { router.push('/selesaikanpendaftaran'); }
        else if (!statusData) {
            const { error: insertError } = await supabase.from('onboarding_status').insert({ user_id: userId, is_completed: false });
            if (insertError) console.error("Error creating onboarding status record:", insertError);
            router.push('/selesaikanpendaftaran');
        }
      };
      checkOnboardingAndRedirect();
      setIsLoadingPageInit(false);
  }, [app, supabase, router, user]);

  useEffect(() => { /* ... Trigger Fetch Files ... */
      if (activeWorkspaceId && activeWorkspaceName && user?.id && accessToken) {
          fetchWorkspaceSubfolderFiles();
      } else { setAllFormattedFiles([]); setIsFetchingItems(false); /* ... logging ... */ }
  }, [fetchWorkspaceSubfolderFiles, activeWorkspaceId, activeWorkspaceName, user?.id, accessToken]);

  useEffect(() => { /* ... Shortcut Listener ... */
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

   // --- Logika Filter Pencarian --- (Tetap sama)
   const filteredFiles = useMemo(() => {
    if (!searchQuery) {
      return allFormattedFiles;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allFormattedFiles.filter(file =>
      file.filename.toLowerCase().includes(lowerCaseQuery) ||
      file.pathname?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [allFormattedFiles, searchQuery]);

  // --- Render ---
  if (isLoadingPageInit || !user || !account) { /* ... Loading Init ... */ return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Memuat data pengguna...</div>; }
  if (error && !activeWorkspaceId && !isLoadingPageInit) { /* ... Error Init ... */ return <div className="flex h-screen items-center justify-center text-red-600">Terjadi Kesalahan Awal: {error}</div>; }


   return (
    <SidebarProvider>
      <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdate} />
      <SidebarInset>
        {/* --- Header --- (Sama seperti sebelumnya) */}
        <header className="flex w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              {/* Tampilkan Nama Folder/Workspace yang sedang dilihat */}
              <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4">
                  <h4 className="scroll-m-20 lg:text-lg text-3xl font-bold tracking-tight mr-2 truncate" title={activeWorkspaceName || ''}>
                      {(activeWorkspaceName || 'Pilih Folder')}
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

        {/* --- Konten Utama --- (Sama seperti sebelumnya) */}
        <div className="flex flex-1 flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">
           {/* Alert Error */}
           {error && ( /* ... kode alert error ... */
               <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                   <span className="block sm:inline">{error}</span>
                   <Button variant="outline" size="sm" className="ml-4" onClick={fetchWorkspaceSubfolderFiles} disabled={isFetchingItems || !activeWorkspaceId}>
                     {isFetchingItems ? <Loader2 className="h-3 w-3 animate-spin"/> : "Coba Lagi"}
                   </Button>
               </div>
           )}
           {/* Info Workspace */}
           <div className="bg-muted/50 gap-4 p-4 inline-flex overflow-hidden flex-col rounded-xl bg-white">
            {/* ... kode info workspace ... */}
              <div>
               <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">Lokasi Workspace</h2>
               <p className="text-xs text-gray-500">Workspace Aktif: {activeWorkspaceName || '...'}</p>
             </div>
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
           </div>
           {/* Folder Selector */}
           <FolderSelector initialTargetWorkspaceId={activeWorkspaceId} />
           {/* Tabel File */}
           <div className="bg-muted/50 gap-4 p-4 inline-flex overflow-hidden flex-col rounded-xl bg-white">
            {/* ... judul dan kondisi loading/kosong/tabel ... */}
            <div className="flex justify-between items-center mb-2">
               <div>
                 <h2 className="scroll-m-20 text-lg font-semibold tracking-tight lg:text-md truncate" title={`Semua file di Subfolder ${activeWorkspaceName}`}>
                    Semua File di Folder
                 </h2>
                 <p className="text-xs text-gray-500">Semua file yang berada pada folder suatu workspace ditampilkan di sini.</p>
               </div>
             </div>
             {isFetchingItems ? ( /* ... loading ... */ <div className="flex flex-col justify-center items-center p-6 text-gray-600"><Loader2 className="mb-2 h-6 w-6 animate-spin" /> Memuat semua file dari subfolder...</div>
             ) : !activeWorkspaceId ? ( /* ... pilih workspace ... */ <div className="text-center p-6 text-gray-500">Pilih workspace untuk memulai.</div>
             ) : allFormattedFiles.length === 0 && !isFetchingItems ? ( /* ... tidak ada file ... */ <div className="text-center p-6 text-gray-500">Tidak ada file ditemukan di dalam subfolder workspace ini.</div>
             ) : ( /* ... tabel ... */
                 <DataTable<Schema, unknown>
                      data={allFormattedFiles}
                      columns={columns}
                      meta={{ /* ... meta ... */
                        accessToken: accessToken,
                        onActionComplete: fetchWorkspaceSubfolderFiles,
                        supabase: supabase as SupabaseClient,
                        userId: user?.id ?? "",
                        workspaceOrFolderId: activeWorkspaceId,
                      }}
                  />
             )}
           </div>
        </div>

        {/* --- Dialog Pencarian (Diperbarui) --- */}
        <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <CommandInput
            placeholder="Cari nama atau lokasi file..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>Tidak ada file yang cocok ditemukan.</CommandEmpty>
            {filteredFiles.length > 0 && (
                <CommandGroup heading={`Hasil Pencarian (${filteredFiles.length})`}>
                  {filteredFiles.map((file) => {
                    // Dapatkan path ikon dan tipe file friendly
                    const iconPath = getFileIcon(file.mimeType, file.isFolder /*, file.iconLink */); // iconLink masih belum di-fetch
                    const friendlyType = getFriendlyFileType(file.mimeType, file.isFolder);

                    return (
                        <CommandItem
                          key={file.id}
                          value={`${file.filename} ${file.pathname} ${friendlyType}`} // Sertakan tipe dalam value pencarian
                          onSelect={() => {
                            if (file.webViewLink) {
                              window.open(file.webViewLink, "_blank");
                            }
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="cursor-pointer flex items-start" // Gunakan flexbox untuk alignment
                          title={`${file.filename} (${friendlyType})`} // Tooltip
                        >
                          {/* Gunakan <img> untuk menampilkan ikon SVG */}
                          <img
                              src={iconPath}
                              alt={friendlyType} // Alt text deskriptif
                              className="mr-2 h-4 w-4 flex-shrink-0 mt-1" // Sesuaikan margin/padding jika perlu
                              aria-hidden="true" // Sembunyikan dari screen reader jika alt text sudah cukup
                          />
                          <div className="flex flex-col overflow-hidden">
                             <span className="truncate font-medium">{file.filename}</span>
                             {/* Tampilkan pathname dan friendly type */}
                             <span className="text-xs text-gray-500 truncate">
                               {file.pathname} - <span className="italic">{friendlyType}</span>
                             </span>
                          </div>
                        </CommandItem>
                    );
                  })}
                </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
        {/* ---------------------- */}

      </SidebarInset>
    </SidebarProvider>
   )
}
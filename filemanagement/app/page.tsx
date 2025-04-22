"use client";
// page.tsx
// --- Impor ---
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link2Icon, Search, Loader2, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/recentfiles/datatable";
import { columns } from "@/components/recentfiles/columns";
import { supabase } from "@/lib/supabaseClient";
import { useStackApp, useUser } from "@stackframe/stack";
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
} from "@/components/ui/command";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// --- IMPOR react-pdf dengan ALIAS ---
import { Document, Page as PdfPage } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// --- Interface --- (Tetap sama)
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string; createdTime?: string; modifiedTime?: string; iconLink?: string; }
interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; nextPageToken?: string; }
interface SupabaseFileMetadata { id: string; workspace_id: string; user_id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
interface MyTableMeta {
    accessToken: string | null;
    onActionComplete: () => void;
    supabase: SupabaseClient | null;
    userId: string | undefined | null;
    workspaceOrFolderId: string | null | undefined;
    onSelectFileForPreview?: (file: Schema) => void;
    onOpenPreviewSheet?: () => void;
}

// --- Konstanta ---
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const PDF_MAX_SCALE = 3.0;
const PDF_MIN_SCALE = 0.4;
const PDF_SCALE_STEP = 0.2;
const INTERSECTION_THRESHOLD = 0.2; // Seberapa banyak halaman harus terlihat untuk dianggap aktif
const INTERSECTION_ROOT_MARGIN = "-35% 0px -35% 0px"; // Target area tengah viewport PDF

// ========================================================================
// Helper Functions (getFileIcon, getFriendlyFileType) (Tetap sama)
// ========================================================================
function getFileIcon(mimeType: string | undefined, isFolder: boolean | undefined, iconLink?: string | null): string { const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false; if (effectiveIsFolder) return iconLink || '/folder.svg'; if (iconLink) return iconLink; if (!effectiveMimeType) return '/file.svg'; if (effectiveMimeType.startsWith('image/')) return '/picture.svg'; if (effectiveMimeType.startsWith('video/')) return '/video.svg'; if (effectiveMimeType.startsWith('audio/')) return '/music.svg'; if (effectiveMimeType.startsWith('application/zip')) return '/zip.svg'; if (effectiveMimeType === 'application/pdf') return '/pdf.svg'; if (effectiveMimeType.includes('word')) return '/word.svg'; if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return '/ppt.svg'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return '/xlsx.svg'; if (effectiveMimeType === 'text/plain') return '/txt.svg'; if (effectiveMimeType.includes('html')) return '/web.svg'; if (effectiveMimeType.startsWith('text/')) return '/txt.svg'; if (effectiveMimeType === 'application/vnd.google-apps.document') return '/gdoc.svg'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg'; if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg'; return '/file.svg'; }
function getFriendlyFileType(mimeType: string | undefined, isFolder: boolean | undefined): string { const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false; if (effectiveIsFolder) return 'Folder'; if (!effectiveMimeType) return 'Tidak Dikenal'; if (effectiveMimeType.startsWith('image/')) return 'Gambar'; if (effectiveMimeType.startsWith('video/')) return 'Video'; if (effectiveMimeType.startsWith('audio/')) return 'Audio'; if (effectiveMimeType.startsWith('application/zip')) return 'Arsip ZIP'; if (effectiveMimeType === 'application/pdf') return 'Dokumen PDF'; if (effectiveMimeType.includes('word')) return 'Dokumen Word'; if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return 'Presentasi PPT'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return 'Spreadsheet Excel'; if (effectiveMimeType === 'text/plain') return 'Teks Biasa'; if (effectiveMimeType.includes('html')) return 'Dokumen Web'; if (effectiveMimeType.startsWith('text/')) return 'Dokumen Teks'; if (effectiveMimeType === 'application/vnd.google-apps.folder') return 'Folder Google'; if (effectiveMimeType === 'application/vnd.google-apps.document') return 'Google Docs'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return 'Google Slides'; if (effectiveMimeType.includes('/')) { const sub = effectiveMimeType.split('/')[1].replace(/^vnd\.|\.|\+xml|x-|google-apps\./g, ' ').trim(); return sub.charAt(0).toUpperCase() + sub.slice(1); } return 'File Lain'; }

// ========================================================================
// Komponen Utama Page
// ========================================================================
export default function Page() {
    // --- State ---
    const router = useRouter(); const app = useStackApp(); const user = useUser(); const account = user ? user.useConnectedAccount('google', { or: 'redirect', scopes: ['https://www.googleapis.com/auth/drive'] }) : null; const { accessToken } = account ? account.useAccessToken() : { accessToken: null };
    const [isLoadingPageInit, setIsLoadingPageInit] = useState(true); const [isFetchingItems, setIsFetchingItems] = useState(false); const [error, setError] = useState(''); const [allFormattedFiles, setAllFormattedFiles] = useState<Schema[]>([]); const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null); const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>('Memuat...'); const [activeWorkspaceUrl, setActiveWorkspaceUrl] = useState<string>('Memuat...'); const [isSearchOpen, setIsSearchOpen] = useState(false); const [searchQuery, setSearchQuery] = useState('');
    const [selectedFileForPreview, setSelectedFileForPreview] = useState<Schema | null>(null); const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState<boolean>(false);
    const [pdfFile, setPdfFile] = useState<Blob | string | null>(null); const [pdfLoading, setPdfLoading] = useState<boolean>(false); const [pdfError, setPdfError] = useState<string | null>(null); const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1); // Untuk display & target navigasi
    const [pdfScale, setPdfScale] = useState(1.0);

    // --- Refs ---
    const pdfContainerRef = useRef<HTMLDivElement>(null); // Ref untuk div scroll PDF
    const pdfPreviewAreaRef = useRef<HTMLDivElement>(null); // Ref area preview utama (termasuk kontrol)
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]); // Ref untuk setiap elemen halaman PDF
    const pageObserver = useRef<IntersectionObserver | null>(null); // Ref untuk Intersection Observer
    const [pdfContainerWidth, setPdfContainerWidth] = useState<number | null>(null); // Lebar kontainer PDF

    // --- Helper API Call --- (Tetap sama)
    const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}): Promise<T | null> => { if (!accessToken) { setError("Akses token Google tidak tersedia."); setIsFetchingItems(false); return null; } const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers }; if (!(body instanceof FormData) && body && method !== 'GET') { defaultHeaders['Content-Type'] = 'application/json'; } const options: RequestInit = { method, headers: defaultHeaders }; if (body) { options.body = (body instanceof FormData) ? body : JSON.stringify(body); } try { const response = await fetch(url, options); if (!response.ok) { let d = {}; try { d = await response.json(); } catch (e) {} const m = (d as any)?.error?.message || (d as any)?.error_description || response.statusText || `HTTP error ${response.status}`; if (response.status === 401) setError("Sesi Google mungkin berakhir."); else setError(`Google API Error (${response.status}): ${m}`); return null; } if (response.status === 204) return null; return response.json() as Promise<T>; } catch (err: any) { setError(`Gagal hubungi Google API: ${err.message}`); return null; } }, [accessToken]);

    // --- Callback Update Workspace --- (Tetap sama)
    const handleWorkspaceUpdate = useCallback((workspaceId: string | null, workspaceName: string | null, workspaceUrl: string | null) => { if (activeWorkspaceId !== workspaceId) { setActiveWorkspaceId(workspaceId); setActiveWorkspaceName(workspaceName || '...'); setActiveWorkspaceUrl(workspaceUrl || '...'); setAllFormattedFiles([]); setIsFetchingItems(!!workspaceId); setError(''); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); } else if (workspaceId) { setActiveWorkspaceName(workspaceName || '?'); setActiveWorkspaceUrl(workspaceUrl || '?'); } }, [activeWorkspaceId]);

    // --- Fungsi Fetch SEMUA FILE --- (Tetap sama)
     const fetchWorkspaceSubfolderFiles = useCallback(async () => { if (!activeWorkspaceId || !activeWorkspaceName || !user?.id || !accessToken || !supabase) { setAllFormattedFiles([]); setIsFetchingItems(false); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); return; } setIsFetchingItems(true); setError(''); let collectedFilesData: Omit<Schema, 'description' | 'other' | 'foldername'>[] = []; const allFileIds: string[] = []; try { const folderFields = "files(id, name)"; const folderQuery = `'${activeWorkspaceId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`; const folderUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(folderQuery)}&fields=${encodeURIComponent(folderFields)}&orderBy=name`; const folderData = await makeApiCall<GoogleDriveFilesListResponse>(folderUrl); if (folderData === null) { throw new Error(error || `Gagal ambil folder.`); } const subfoldersLevel1 = folderData.files || []; if (subfoldersLevel1.length === 0) { setAllFormattedFiles([]); setIsFetchingItems(false); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); return; } const fileFetchPromises = subfoldersLevel1.map(async (subfolder) => { if (!subfolder?.id || !subfolder?.name) return []; const fileFields = "files(id, name, mimeType, webViewLink, createdTime, modifiedTime)"; const fileQuery = `'${subfolder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`; const fileUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(fileQuery)}&fields=${encodeURIComponent(fileFields)}&orderBy=name`; const fileData = await makeApiCall<GoogleDriveFilesListResponse>(fileUrl); if (fileData === null) { setError(prev => `${prev || ''} Gagal load folder "${subfolder.name}".`.trim()); return []; } const filesInSubfolder = fileData.files || []; const currentPathname = `${activeWorkspaceName} / ${subfolder.name}`; return filesInSubfolder.map(file => { allFileIds.push(file.id); return { id: file.id, filename: file.name, pathname: currentPathname, mimeType: file.mimeType, webViewLink: file.webViewLink || undefined, createdat: file.createdTime || undefined, lastmodified: file.modifiedTime || file.createdTime || undefined, isFolder: false, iconLink: undefined, }; }); }); const filesFromSubfoldersArrays = await Promise.all(fileFetchPromises); collectedFilesData = filesFromSubfoldersArrays.flat(); if (collectedFilesData.length === 0) { setAllFormattedFiles([]); setIsFetchingItems(false); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); return; } let metadataMap: Record<string, SupabaseFileMetadata> = {}; if (allFileIds.length > 0 && user?.id) { const chunkSize = 150; for (let i = 0; i < allFileIds.length; i += chunkSize) { const chunkIds = allFileIds.slice(i, i + chunkSize); const { data: metadataList, error: metaError } = await supabase.from('file').select('id, description, labels, color').in('id', chunkIds).eq('workspace_id', activeWorkspaceId).eq('user_id', user.id); if (metaError) { console.warn("Supabase meta fetch warning:", metaError.message); setError(prev => prev ? `${prev} | Gagal load metadata.` : `Warning: Gagal memuat sebagian metadata.`); } if (metadataList) { metadataList.forEach((meta: any) => { metadataMap[meta.id] = meta; }); } } } const finalFormattedFiles: Schema[] = collectedFilesData.map(fileData => ({ ...fileData, isFolder: false, foldername: null, description: metadataMap[fileData.id]?.description ?? undefined, })); finalFormattedFiles.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase())); setAllFormattedFiles(finalFormattedFiles); if (selectedFileForPreview && !finalFormattedFiles.some(f => f.id === selectedFileForPreview.id)) { setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); } } catch (err: any) { console.error(">>> Error fetching:", err); setError(err.message || "Gagal memuat file."); setAllFormattedFiles([]); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); } finally { setIsFetchingItems(false); } }, [activeWorkspaceId, activeWorkspaceName, user?.id, accessToken, supabase, makeApiCall, setError, selectedFileForPreview, error]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- Fungsi Fetch Konten PDF --- (Reset state terkait PDF)
    const fetchPdfContent = useCallback(async (fileId: string) => {
        if (!accessToken || !fileId) return;
        setPdfLoading(true); setPdfError(null); setPdfFile(null); setNumPages(null); setPageNumber(1);
        setPdfScale(1.0); setPdfContainerWidth(null);
        pageRefs.current = [];
        pageObserver.current?.disconnect();

        const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${fileId}?alt=media`;
        try { const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } }); if (!response.ok) { let eMsg = `Gagal ambil PDF (${response.status})`; try { const eData = await response.json(); eMsg += `: ${eData?.error?.message||'?'}`; } catch (e) {} throw new Error(eMsg); } const blob = await response.blob(); const objectUrl = URL.createObjectURL(blob); setPdfFile(objectUrl);
        } catch (err: any) { console.error("Error fetching PDF:", err); setPdfError(err.message || "Gagal memuat preview PDF.");
        } finally { setPdfLoading(false); }
    }, [accessToken]);

    // --- Trigger fetch PDF --- (Sama)
    useEffect(() => {
        let objectUrlToRevoke: string | null = null;
        if (selectedFileForPreview?.mimeType === 'application/pdf' && selectedFileForPreview.id && isPreviewSheetOpen) { if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) { URL.revokeObjectURL(pdfFile); setPdfFile(null); } fetchPdfContent(selectedFileForPreview.id); } else { if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) { objectUrlToRevoke = pdfFile; } setPdfFile(null); setPdfLoading(false); setPdfError(null); setNumPages(null); setPageNumber(1); setPdfScale(1.0); pageRefs.current = []; pageObserver.current?.disconnect(); }
        return () => { if (objectUrlToRevoke) { URL.revokeObjectURL(objectUrlToRevoke); } pageObserver.current?.disconnect(); };
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFileForPreview, isPreviewSheetOpen]);

    // --- Callback react-pdf: onDocumentLoadSuccess ---
     function onDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }): void {
         setNumPages(loadedNumPages);
         setPageNumber(1);
         setPdfScale(1.0);
         if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0;

         // Pastikan array ref sesuai dengan jumlah halaman baru
         pageRefs.current = Array(loadedNumPages).fill(null);

         // Tunda pengukuran lebar sedikit untuk memastikan layout stabil
         setTimeout(() => {
             if (pdfPreviewAreaRef.current) {
                 const width = pdfPreviewAreaRef.current.offsetWidth;
                 // Beri ruang untuk scrollbar (sekitar 17px) + sedikit padding
                 setPdfContainerWidth(width > 30 ? width - 20 : null);
             }
         }, 100); // Penundaan kecil
     }

    // --- Fungsi Handler Zoom --- (Tetap sama)
    const handleZoomIn = () => { setPdfScale(prev => Math.min(prev + PDF_SCALE_STEP, PDF_MAX_SCALE)); };
    const handleZoomOut = () => { setPdfScale(prev => Math.max(prev - PDF_SCALE_STEP, PDF_MIN_SCALE)); };
    const handleResetZoom = () => { setPdfScale(1.0); if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0; };

    // --- Fungsi Handler Navigasi Halaman (Button Click -> Scroll Into View) ---
    const goToPage = (targetPage: number) => {
        if (targetPage >= 1 && targetPage <= (numPages ?? 0)) {
            const pageElement = pageRefs.current[targetPage - 1];
            if (pageElement) {
                // Scroll kontainer agar elemen halaman target ada di atas
                pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Kita tidak set pageNumber di sini, biarkan observer yang handle
                // Namun, kita bisa set sementara agar UI tombol update cepat
                setPageNumber(targetPage);
            } else {
                setPageNumber(targetPage); // Fallback
                console.warn(`goToPage: Ref for page ${targetPage} not found or not ready.`);
                // Mungkin scroll manual container jika ref belum ada?
                 if (pdfContainerRef.current && numPages) {
                    // Estimasi posisi scroll (kurang akurat)
                    const approxPageHeight = pdfContainerRef.current.scrollHeight / numPages;
                    pdfContainerRef.current.scrollTo({ top: approxPageHeight * (targetPage - 1), behavior: 'smooth' });
                 }
            }
        }
    };
    const goToPrevPage = () => goToPage(pageNumber - 1);
    const goToNextPage = () => goToPage(pageNumber + 1);

    // --- useEffects Lainnya (Onboarding, Fetch Files, Shortcut) --- (Tetap sama)
    useEffect(() => { const checkOnboarding = async () => { if (!user || !supabase || !router) return; try { const { data, error: fetchError } = await supabase.from('onboarding_status').select('is_completed').eq('user_id', user.id).maybeSingle(); if (fetchError) { console.error("Error checking onboarding status:", fetchError); setError("Gagal memeriksa status pendaftaran."); setIsLoadingPageInit(false); return; } if (!data || !data.is_completed) { router.push('/selesaikanpendaftaran'); } else { setIsLoadingPageInit(false); } } catch (err) { console.error("Error in checkOnboarding:", err); setError("Terjadi kesalahan saat memeriksa status pendaftaran."); setIsLoadingPageInit(false); } }; if(user && supabase) checkOnboarding(); else if (!user) setIsLoadingPageInit(true); }, [user, supabase, router, setError]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (activeWorkspaceId && activeWorkspaceName && user?.id && accessToken && !isLoadingPageInit) fetchWorkspaceSubfolderFiles(); else if (!activeWorkspaceId && !isLoadingPageInit) { setAllFormattedFiles([]); setIsFetchingItems(false); setSelectedFileForPreview(null); setIsPreviewSheetOpen(false); } }, [activeWorkspaceId, activeWorkspaceName, user?.id, accessToken, fetchWorkspaceSubfolderFiles, isLoadingPageInit]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { const down = (e: KeyboardEvent) => { if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsSearchOpen((open) => !open); } }; document.addEventListener("keydown", down); return () => document.removeEventListener("keydown", down); }, []);

    // --- useEffect untuk mengukur lebar kontainer PDF --- (Penyesuaian dependensi & timing)
     useEffect(() => {
         const container = pdfPreviewAreaRef.current;
         let resizeObserver: ResizeObserver | null = null;

         const updateWidth = () => {
             if (container && isPreviewSheetOpen && selectedFileForPreview?.mimeType === 'application/pdf') {
                 const width = container.offsetWidth;
                 const effectiveWidth = width > 30 ? width - 20 : null; // Recalculate based on current container width
                 // Hanya update jika berbeda untuk menghindari loop
                 setPdfContainerWidth(currentWidth => {
                     if (currentWidth !== effectiveWidth) return effectiveWidth;
                     return currentWidth;
                 });
             } else {
                 // Reset jika tidak relevan
                 setPdfContainerWidth(null);
             }
         };

         if (container && isPreviewSheetOpen && selectedFileForPreview?.mimeType === 'application/pdf') {
             // Panggil sekali setelah render awal atau saat sheet/file berubah
             const timeoutId = setTimeout(updateWidth, 50); // Sedikit delay untuk layout

             // Amati perubahan ukuran
             resizeObserver = new ResizeObserver(updateWidth);
             resizeObserver.observe(container);

             // Cleanup
             return () => {
                 clearTimeout(timeoutId);
                 if (container) resizeObserver?.unobserve(container);
                 resizeObserver?.disconnect();
             };
         } else {
             // Reset jika sheet ditutup atau bukan PDF
              setPdfContainerWidth(null);
         }
         // Dependensi: sheet state, file terpilih (untuk tipe), file PDF aktual (untuk trigger setelah load)
     }, [isPreviewSheetOpen, selectedFileForPreview, pdfFile]);

     // --- useEffect untuk Setup Intersection Observer --- (Disesuaikan)
      useEffect(() => {
         if (!pdfFile || !numPages || numPages <= 0 || !pdfContainerRef.current) {
             pageObserver.current?.disconnect(); // Pastikan observer lama dihentikan
             return;
         }

         const scrollContainer = pdfContainerRef.current;
         pageObserver.current?.disconnect(); // Hentikan observer sebelumnya

         const options = {
             root: scrollContainer,
             rootMargin: INTERSECTION_ROOT_MARGIN,
             threshold: INTERSECTION_THRESHOLD
         };

         // Callback IntersectionObserver
         const observerCallback = (entries: IntersectionObserverEntry[]) => {
             let topVisiblePage = -1;
             let maxIntersectionRatio = -1;

             entries.forEach((entry) => {
                 if (entry.isIntersecting) {
                     const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '0', 10);
                      // Cari halaman yang paling banyak terlihat atau paling atas jika rasio sama
                     if (entry.intersectionRatio > maxIntersectionRatio) {
                         maxIntersectionRatio = entry.intersectionRatio;
                         topVisiblePage = pageNum;
                     } else if (entry.intersectionRatio === maxIntersectionRatio) {
                        // Jika rasio sama, ambil halaman dengan nomor lebih kecil (yang muncul lebih dulu di DOM)
                        if (topVisiblePage === -1 || pageNum < topVisiblePage) {
                             topVisiblePage = pageNum;
                        }
                     }
                 }
             });

             if (topVisiblePage > 0) {
                 setPageNumber(currentPN => currentPN !== topVisiblePage ? topVisiblePage : currentPN);
             }
         };

         pageObserver.current = new IntersectionObserver(observerCallback, options);
         const observer = pageObserver.current;

         // Observe elemen halaman setelah di-render
         // Butuh sedikit delay agar ref terisi setelah load document
         const observeTimeout = setTimeout(() => {
             pageRefs.current.forEach((pageEl) => {
                 if (pageEl) {
                     observer.observe(pageEl);
                 }
             });
         }, 150); // Delay sedikit untuk memastikan ref ada


         // Cleanup
         return () => {
             clearTimeout(observeTimeout);
             observer.disconnect();
         };
      // Dependensi: dijalankan saat PDF, numPages berubah, atau komponen mount/unmount
     }, [pdfFile, numPages]);
     // -----------------------------------------------------

    // --- Logika Filter Pencarian --- (Tetap sama)
    const filteredFiles = useMemo(() => { if (!searchQuery) return allFormattedFiles; const lcq = searchQuery.toLowerCase(); return allFormattedFiles.filter(f => f.filename.toLowerCase().includes(lcq) || f.pathname?.toLowerCase().includes(lcq) || getFriendlyFileType(f.mimeType, f.isFolder).toLowerCase().includes(lcq) || f.description?.toLowerCase().includes(lcq)); }, [allFormattedFiles, searchQuery]);

    // --- Render ---
    if (isLoadingPageInit || !user || !account) { return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Memuat data pengguna...</div>; }

    return (
        <TooltipProvider delayDuration={200}>
            <SidebarProvider>
                <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdate} />
                <SidebarInset>
                    {/* --- Header --- (Tetap sama) */}
                     <header className="flex w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"> <div className="flex w-full items-center gap-2 px-4"> <SidebarTrigger className="-ml-1" /> <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" /> <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4"> <h4 className="scroll-m-20 lg:text-lg text-3xl font-bold tracking-tight mr-2 truncate" title={activeWorkspaceName || ''}>{(activeWorkspaceName || 'Pilih Folder')}</h4> </div> <div className="flex-1 items-right justify-right md:items-center"> <Button className="h-12 md:w-full w-11 h-10 md:justify-between justify-center md:pr-1" variant={"outline"} title="Cari file di folder ini (Ctrl+K)" onClick={() => setIsSearchOpen(true)}> <p className="text-gray-600 hidden md:inline text-md text-light">Temukan file...</p> <div className=" sm:w-8 w-2 h-8 rounded-md items-center justify-center flex gap-2 px-2"><Search className="text-primary h-4 w-4" /></div> </Button> </div> <NavUser /> </div> </header>

                    {/* --- KONTEN UTAMA (luar sheet) --- (Tetap sama) */}
                     <div className="flex-1 h-[calc(100vh-theme(space.12))] overflow-y-auto">
                        <div className="flex flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">
                            {/* Alert Error */}
                            {error && activeWorkspaceId && ( <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><span className="block sm:inline">{error}</span><Button variant="outline" size="sm" className="ml-4" onClick={fetchWorkspaceSubfolderFiles} disabled={isFetchingItems || !activeWorkspaceId}>{isFetchingItems ? <Loader2 className="h-3 w-3 animate-spin" /> : "Coba Lagi"}</Button></div> )}
                            {/* Info Workspace */}
                            <div className="bg-muted/50 gap-4 p-4 inline-flex overflow-hidden flex-col rounded-xl bg-white"> <div><h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">Lokasi Workspace</h2><p className="text-xs text-gray-500">Workspace Aktif: {activeWorkspaceName || '...'}</p></div> {activeWorkspaceUrl && activeWorkspaceUrl !== 'Memuat...' && activeWorkspaceUrl !== 'Menampilkan URL...' ? ( <> <div className="flex items-center gap-2 bg-[oklch(0.971_0.014_246.32)] border-2 border-[oklch(0.55_0.2408_261.8)] p-2 rounded-md overflow-hidden"><Link2Icon className="text-gray-500 flex-shrink-0" size={20} color="#095FF9"></Link2Icon><h1 className="break-words whitespace-normal flex-1 font-semibold underline text-[oklch(0.55_0.2408_261.8)] text-sm"><a href={activeWorkspaceUrl} target="_blank" rel="noopener noreferrer" title={`Buka ${activeWorkspaceName} di Google Drive`}>{activeWorkspaceUrl}</a></h1></div> <Button variant={"outline"} size="sm" className="w-fit mt-1"><a href={activeWorkspaceUrl} target="_blank" rel="noopener noreferrer">Kunjungi di Drive</a></Button> </> ) : ( <p className="text-sm text-gray-500">{activeWorkspaceId ? 'Memuat URL...' : 'Pilih workspace.'}</p> )} </div>
                            {/* Folder Selector */}
                            <FolderSelector initialTargetWorkspaceId={activeWorkspaceId} />
                            {/* Tabel File */}
                             <div className="bg-muted/50 gap-4 p-4 inline-flex overflow-hidden flex-col rounded-xl bg-white"> <div className="flex justify-between items-center mb-2"><div><h2 className="scroll-m-20 text-lg font-semibold tracking-tight lg:text-md truncate" title={`Semua file di Subfolder ${activeWorkspaceName}`}>Semua File di Folder</h2><p className="text-xs text-gray-500">Semua file yang berada pada folder suatu workspace ditampilkan di sini.</p></div></div> {isFetchingItems ? ( <div className="flex flex-col justify-center items-center p-6 text-gray-600"><Loader2 className="mb-2 h-6 w-6 animate-spin" /> Memuat semua file...</div> ) : !activeWorkspaceId ? ( <div className="text-center p-6 text-gray-500">Pilih workspace untuk menampilkan file.</div> ) : allFormattedFiles.length === 0 && !isFetchingItems && !error ? ( <div className="text-center p-6 text-gray-500">Tidak ada file ditemukan.</div> ) : error && allFormattedFiles.length === 0 ? ( <div className="text-center p-6 text-red-500">Gagal memuat file.</div> ) : ( allFormattedFiles.length > 0 && <DataTable<Schema, unknown, MyTableMeta> data={allFormattedFiles} columns={columns} meta={{ accessToken: accessToken, onActionComplete: fetchWorkspaceSubfolderFiles, supabase: supabase as SupabaseClient, userId: user?.id ?? null, workspaceOrFolderId: activeWorkspaceId, onSelectFileForPreview: setSelectedFileForPreview, onOpenPreviewSheet: () => setIsPreviewSheetOpen(true), }} /> )} </div>
                        </div>
                    </div>

                    {/* --- Dialog Pencarian --- (Tetap sama) */}
                     <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}> <CommandInput placeholder="Cari..." value={searchQuery} onValueChange={setSearchQuery} /> <CommandList> <CommandEmpty>Tidak ditemukan.</CommandEmpty> {filteredFiles.length > 0 && ( <CommandGroup heading={`Hasil (${filteredFiles.length})`}> {filteredFiles.map((file) => { const icon = getFileIcon(file.mimeType, file.isFolder, file.iconLink); const type = getFriendlyFileType(file.mimeType, file.isFolder); return ( <CommandItem key={file.id} value={`${file.filename} ${file.pathname} ${type} ${file.description}`} onSelect={() => { setSelectedFileForPreview(file); setIsPreviewSheetOpen(true); setIsSearchOpen(false); setSearchQuery(''); }} className="cursor-pointer flex items-start gap-2" title={`${file.filename} (${type})`} > <img src={icon} alt={type} className="mr-2 h-4 w-4 flex-shrink-0 mt-1" aria-hidden="true"/> <div className="flex flex-col overflow-hidden"><span className="truncate font-medium">{file.filename}</span><span className="text-xs text-gray-500 truncate">{file.pathname} - <span className="italic">{type}</span></span></div> </CommandItem> ); })} </CommandGroup> )} </CommandList> </CommandDialog>

                    {/* --- SHEET PREVIEW (RESTRUCTURED LAYOUT) --- */}
                    <Sheet open={isPreviewSheetOpen} onOpenChange={setIsPreviewSheetOpen}>
                        <SheetContent side="right" className="w-full sm:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[1000px] flex flex-col p-0 h-screen overflow-hidden">
                            {/* 1. Header (Fixed) */}
                            <SheetHeader className="px-6 pt-6 pb-4 border-b relative shrink-0">
                                <SheetTitle>Detail File</SheetTitle>
                                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 rounded-full" onClick={() => setIsPreviewSheetOpen(false)}> <X className="h-5 w-5" /><span className="sr-only">Tutup</span> </Button>
                            </SheetHeader>

                            {/* 3. Detail File Section (Fixed height / shrink-0) */}
                            <div className="px-6 py-5 space-y-4 border-b shrink-0"> {/* Reduced space-y */}
                                {selectedFileForPreview ? (
                                    <>
                                        <div className="flex items-center space-x-3"> <img src={getFileIcon(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder, selectedFileForPreview.iconLink)} alt={getFriendlyFileType(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder)} className="h-9 w-9 flex-shrink-0" /> <span className="font-semibold break-all text-base" title={selectedFileForPreview.filename}>{selectedFileForPreview.filename}</span> </div>
                                        <div className="flex gap-2 flex-wrap"> {selectedFileForPreview.webViewLink && <Button variant="default" size="sm" asChild className="text-xs px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white"><a href={selectedFileForPreview.webViewLink} target="_blank" rel="noopener noreferrer">Buka di Drive</a></Button>} </div>
                                        <Separator />
                                        <div className="space-y-1 text-sm text-gray-800"> {/* Reduced space-y */}
                                            <p><strong>Tipe:</strong> <span className="text-gray-600">{getFriendlyFileType(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder)}</span></p>
                                            {selectedFileForPreview.pathname && <p><strong>Lokasi:</strong> <span className="break-words text-gray-600">{selectedFileForPreview.pathname}</span></p>}
                                            {selectedFileForPreview.description && <p><strong>Deskripsi:</strong> <span className="break-words whitespace-pre-wrap text-gray-600">{selectedFileForPreview.description}</span></p>}
                                            {/* Dates and ID can be hidden if too much space */}
                                            {/* {selectedFileForPreview.createdat && <p><strong>Dibuat:</strong> <span className="text-gray-600">{new Date(selectedFileForPreview.createdat).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span></p>} */}
                                            {/* {selectedFileForPreview.lastmodified && <p><strong>Diubah:</strong> <span className="text-gray-600">{new Date(selectedFileForPreview.lastmodified).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span></p>} */}
                                            {/* <p><strong>ID File:</strong> <span className="text-gray-500 text-xs break-all">{selectedFileForPreview.id}</span></p> */}
                                        </div>
                                    </>
                                ) : ( <div className="flex items-center justify-center h-20 text-gray-500"> Memuat detail file... </div> )}
                            </div>

                             {/* 4. Preview Area (Takes remaining space, internal scroll ONLY for PDF) */}
                            <div ref={pdfPreviewAreaRef} className="preview-content-area flex-1 min-h-0 flex flex-col bg-gray-200"> {/* Outer preview bg */}
                                {/* Judul Preview (jika perlu) */}
                                {/* <h4 className="font-medium text-base px-6 pt-4 pb-2 shrink-0 border-b bg-white">Preview</h4> */}

                                {/* Kontainer Konten Preview (mengisi sisa area) */}
                                <div className="flex-1 min-h-0 overflow-hidden">
                                     {/* Kondisi untuk PDF (Internal Scroll) */}
                                     {selectedFileForPreview?.mimeType === 'application/pdf' && (
                                        <div className="flex-1 flex flex-col min-h-0 h-full">
                                            {pdfLoading && ( <div className="flex-1 flex items-center justify-center text-gray-500 p-4"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat preview...</div> )}
                                            {pdfError && ( <div className="flex-1 flex items-center justify-center text-red-600 bg-red-50 p-4 text-center text-sm">Error: {pdfError}</div> )}
                                            {pdfFile && !pdfLoading && !pdfError && (
                                                // Kontainer Scrollable KHUSUS PDF
                                                <div ref={pdfContainerRef} className="react-pdf-scroll-container flex-1 overflow-auto bg-gray-300"> {/* <<< SCROLL PDF DI SINI */}
                                                    <Document
                                                        file={pdfFile}
                                                        onLoadSuccess={onDocumentLoadSuccess}
                                                        onLoadError={(error) => setPdfError(`Gagal load PDF: ${error.message}`)}
                                                        loading={null} // Loading utama di luar
                                                        error={<div className="p-4 text-center text-red-500 text-sm">Gagal memuat struktur dokumen PDF.</div>}
                                                        className="flex flex-col items-center py-4 pdf-document" // Padding atas/bawah
                                                    >
                                                        {Array.from(new Array(numPages ?? 0), (el, index) => (
                                                            // Wrapper div untuk ref, styling, dan indikator nomor halaman
                                                            <div
                                                                key={`page_wrap_${index + 1}`}
                                                                ref={(el) => { pageRefs.current[index] = el; }}
                                                                data-page-number={index + 1}
                                                                className="relative mb-4 bg-white shadow-lg" // Shadow lebih tebal
                                                            >
                                                                <PdfPage
                                                                    pageNumber={index + 1}
                                                                    scale={pdfScale}
                                                                    width={pdfContainerWidth ? pdfContainerWidth : undefined}
                                                                    renderTextLayer={true}
                                                                    renderAnnotationLayer={false} // Nonaktifkan anotasi jika tidak perlu
                                                                    loading={<div className={`bg-gray-200 animate-pulse mx-auto`} style={{height: pdfContainerWidth ? (pdfContainerWidth*1.414) : 800, width: pdfContainerWidth ?? 'auto'}}></div>}
                                                                    error={<div className="my-2 p-2 text-red-500 text-xs text-center">Gagal load hal {index + 1}.</div>}
                                                                    className="pdf-page-render"
                                                                />
                                                                {/* --- BARU: Indikator Nomor Halaman Visual --- */}
                                                                <div className="absolute bottom-2 right-2 z-10">
                                                                    <span className="bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded-sm shadow">
                                                                        {index + 1}
                                                                    </span>
                                                                </div>
                                                                {/* ------------------------------------------- */}
                                                            </div>
                                                        ))}
                                                    </Document>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* Kondisi Lainnya (Non-PDF, dalam area non-scrollable) */}
                                    {selectedFileForPreview && selectedFileForPreview.mimeType !== 'application/pdf' && (
                                        <div className="flex-1 flex items-center justify-center p-4 h-full"> {/* h-full agar mengisi */}
                                            {selectedFileForPreview.mimeType?.includes('google-apps') && !selectedFileForPreview.mimeType.includes('folder') && selectedFileForPreview.webViewLink ? (
                                                <iframe src={selectedFileForPreview.webViewLink.replace('/edit', '/preview').replace('/view', '/preview')} className="w-full h-full border-0" title={`Preview ${selectedFileForPreview.filename}`} sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>
                                            ): selectedFileForPreview.mimeType?.startsWith('image/') ? (
                                                // Implementasi preview gambar jika diinginkan
                                                <div className="w-full h-full flex items-center justify-center">
                                                  {/* <img src={imageUrl} alt={`Preview ${selectedFileForPreview.filename}`} className="max-w-full max-h-full object-contain"/> */}
                                                  <p className="text-sm text-gray-500 italic">(Preview gambar belum ada)</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">Preview tidak tersedia untuk tipe file ini.</p>
                                            )}
                                        </div>
                                    )}
                                    {!selectedFileForPreview && (
                                         <div className="flex-1 flex items-center justify-center text-gray-500"> Memuat detail file... </div>
                                    )}
                                </div>
                            {/* 2. Kontrol PDF (Fixed / Sticky relative to SheetContent) */}
                            {selectedFileForPreview?.mimeType === 'application/pdf' && pdfFile && !pdfLoading && !pdfError && (
                                <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b bg-gray-100 shrink-0"> {/* bg-gray-100 for contrast */}
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={pdfScale <= PDF_MIN_SCALE}><ZoomOut className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Perkecil</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetZoom} disabled={pdfScale === 1.0}><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Reset Zoom (100%)</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={pdfScale >= PDF_MAX_SCALE}><ZoomIn className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Perbesar</TooltipContent></Tooltip>
                                    <span className="text-xs font-medium text-gray-600 w-12 text-center tabular-nums">{(pdfScale * 100).toFixed(0)}%</span>
                                    <Separator orientation="vertical" className="h-5 mx-1 sm:mx-2" />
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-8 px-3" onClick={goToPrevPage} disabled={pageNumber <= 1}>Prev</Button></TooltipTrigger><TooltipContent>Halaman Sebelumnya</TooltipContent></Tooltip>
                                    <span className="text-xs font-medium px-2 min-w-[70px] text-center justify-center"> Hal {pageNumber} dari {numPages ?? '?'} </span>
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-8 px-3" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages}>Next</Button></TooltipTrigger><TooltipContent>Halaman Berikutnya</TooltipContent></Tooltip>
                                </div>
                            )}
                </div>
                        </SheetContent>
                    </Sheet>
                    {/* --- Akhir Sheet Preview --- */}

                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
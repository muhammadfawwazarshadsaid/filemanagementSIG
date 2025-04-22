"use client";
// components/workspace-view.tsx

// --- Impor ---
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from 'next/link';
import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link2Icon, Search, Loader2, ArrowLeft, RefreshCcw, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/recentfiles/datatable";
import { columns } from "@/components/recentfiles/columns"; // Pastikan columns diupdate jika perlu
import { supabase } from "@/lib/supabaseClient";
import { useStackApp, useUser } from "@stackframe/stack";
import { Schema } from "@/components/recentfiles/schema";
import FileUpload from "@/components/uploadfile";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { z } from "zod";
import { toast } from "sonner";
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

// --- IMPOR react-pdf ---
import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';


// --- Tipe Data & Konstanta ---
// (Definisi interface dan konstanta tetap sama...)
interface GoogleDriveFile { id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string; createdTime?: string; modifiedTime?: string; iconLink?: string; }
interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; nextPageToken?: string; }
interface SupabaseFileMetadata { id: string; workspace_id: string; user_id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
type LoadingStatus = 'idle' | 'loading_details' | 'loading_files' | 'ready' | 'error';

// --- Props ---
interface WorkspaceViewProps {
    workspaceId: string | null | undefined;
    folderId: string | null | undefined;
}

// --- Interface untuk Meta DataTable (Tambahkan callback preview) ---
interface MyTableMeta {
    accessToken: string | null;
    onActionComplete: () => void;
    supabase: SupabaseClient | null;
    userId: string | undefined | null;
    workspaceOrFolderId: string | null | undefined;
    // Callback untuk preview
    onSelectFileForPreview?: (file: Schema) => void;
    onOpenPreviewSheet?: () => void;
}

// --- Konstanta PDF Preview ---
const PDF_MAX_SCALE = 3.0;
const PDF_MIN_SCALE = 0.4;
const PDF_SCALE_STEP = 0.2;
const INTERSECTION_THRESHOLD = 0.2;
const INTERSECTION_ROOT_MARGIN = "-35% 0px -35% 0px";

// ========================================================================
// Helper Functions (getFileIcon, getFriendlyFileType) (Pastikan ada & benar)
// ========================================================================
// (Kode helper function getFileIcon dan getFriendlyFileType tetap sama...)
function getFileIcon(mimeType: string | undefined, isFolder: boolean | undefined, iconLink?: string | null): string { const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false; if (effectiveIsFolder) return iconLink || '/folder.svg'; if (iconLink) return iconLink; if (!effectiveMimeType) return '/file.svg'; if (effectiveMimeType.startsWith('image/')) return '/picture.svg'; if (effectiveMimeType.startsWith('video/')) return '/video.svg'; if (effectiveMimeType.startsWith('audio/')) return '/music.svg'; if (effectiveMimeType.startsWith('application/zip')) return '/zip.svg'; if (effectiveMimeType === 'application/pdf') return '/pdf.svg'; if (effectiveMimeType.includes('word')) return '/word.svg'; if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return '/ppt.svg'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return '/xlsx.svg'; if (effectiveMimeType === 'text/plain') return '/txt.svg'; if (effectiveMimeType.includes('html')) return '/web.svg'; if (effectiveMimeType.startsWith('text/')) return '/txt.svg'; if (effectiveMimeType === 'application/vnd.google-apps.document') return '/gdoc.svg'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg'; if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg'; return '/file.svg'; }
function getFriendlyFileType(mimeType: string | undefined, isFolder: boolean | undefined): string { const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false; if (effectiveIsFolder) return 'Folder'; if (!effectiveMimeType) return 'Tidak Dikenal'; if (effectiveMimeType.startsWith('image/')) return 'Gambar'; if (effectiveMimeType.startsWith('video/')) return 'Video'; if (effectiveMimeType.startsWith('audio/')) return 'Audio'; if (effectiveMimeType.startsWith('application/zip')) return 'Arsip ZIP'; if (effectiveMimeType === 'application/pdf') return 'Dokumen PDF'; if (effectiveMimeType.includes('word')) return 'Dokumen Word'; if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return 'Presentasi PPT'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return 'Spreadsheet Excel'; if (effectiveMimeType === 'text/plain') return 'Teks Biasa'; if (effectiveMimeType.includes('html')) return 'Dokumen Web'; if (effectiveMimeType.startsWith('text/')) return 'Dokumen Teks'; if (effectiveMimeType === 'application/vnd.google-apps.folder') return 'Folder Google'; if (effectiveMimeType === 'application/vnd.google-apps.document') return 'Google Docs'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return 'Google Slides'; if (effectiveMimeType.includes('/')) { const sub = effectiveMimeType.split('/')[1].replace(/^vnd\.|\.|\+xml|x-|google-apps\./g, ' ').trim(); return sub.charAt(0).toUpperCase() + sub.slice(1); } return 'File Lain'; }
// ========================================================================


// ========================================================================
// Komponen WorkspaceView
// ========================================================================
export function WorkspaceView({ workspaceId, folderId }: WorkspaceViewProps) {
    // --- Hook ---
    const router = useRouter();
    const app = useStackApp();
    const user = useUser();
    const account = user ? user.useConnectedAccount('google', { or: 'redirect', scopes: ['https://www.googleapis.com/auth/drive'] }) : null;
    const { accessToken } = account ? account.useAccessToken() : { accessToken: null };

    // --- State Utama Komponen ---
    // (State utama lainnya tetap sama...)
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null | undefined>(workspaceId);
    const [currentFolderId, setCurrentFolderId] = useState<string | null | undefined>(folderId);
    const [isLoadingPageInit, setIsLoadingPageInit] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('idle');
    const [isFetchingItems, setIsFetchingItems] = useState(false);
    const [error, setError] = useState('');
    const [workspaceFiles, setWorkspaceFiles] = useState<Schema[]>([]);
    const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>(folderId || workspaceId ? 'Memuat...' : 'Pilih Folder');
    const [activeWorkspaceUrl, setActiveWorkspaceUrl] = useState<string>(folderId || workspaceId ? 'Memuat...' : '');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --- State & Ref untuk Preview PDF ---
    const [selectedFileForPreview, setSelectedFileForPreview] = useState<Schema | null>(null);
    const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState<boolean>(false);
    const [pdfFile, setPdfFile] = useState<Blob | string | null>(null);
    const [pdfLoading, setPdfLoading] = useState<boolean>(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfScale, setPdfScale] = useState(1.0);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pdfPreviewAreaRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const pageObserver = useRef<IntersectionObserver | null>(null);
    const [pdfContainerWidth, setPdfContainerWidth] = useState<number | null>(null);
    // --------------------------------------

    // --- Helper API Call --- (Sama)
    const makeApiCall = useCallback(async <T = any>(url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}): Promise<T | null> => { /* ... kode ... */ if (!accessToken) { console.warn("makeApiCall aborted: No access token"); return null; } const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers }; if (!(body instanceof FormData) && body && method !== 'GET') { defaultHeaders['Content-Type'] = 'application/json'; } const options: RequestInit = { method, headers: defaultHeaders }; if (body) { options.body = (body instanceof FormData) ? body : JSON.stringify(body); } try { const response = await fetch(url, options); if (!response.ok) { let errorData: any = {}; try { errorData = await response.json(); } catch (e) {} const message = errorData?.error?.message || errorData?.error_description || response.statusText || `HTTP error ${response.status}`; console.error("Google API Call Error:", response.status, message, errorData); if (response.status === 401 || response.status === 403) { setError("Sesi Google Anda mungkin telah berakhir atau izin tidak memadai."); } return null; } if (response.status === 204) return null; return response.json() as Promise<T>; } catch (err: any) { console.error("makeApiCall fetch error:", err); return null; } }, [accessToken]);

    // --- Fetch Detail Folder/Workspace --- (Sama)
    const fetchWorkspaceDetails = useCallback(async (idToFetch: string) => { /* ... kode ... */ console.log(">>> fetchWorkspaceDetails triggered for:", idToFetch); if (!accessToken || !idToFetch) { setError("Token atau ID tidak valid untuk fetch detail."); setLoadingStatus('error'); return; } setLoadingStatus('loading_details'); setActiveWorkspaceName('Memuat...'); setActiveWorkspaceUrl('Memuat...'); const fields = "name, webViewLink"; const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${idToFetch}?fields=${encodeURIComponent(fields)}`; try { const details = await makeApiCall<{ name: string; webViewLink?: string }>(url); if (details) { setActiveWorkspaceName(details.name || 'Nama Tidak Ditemukan'); setActiveWorkspaceUrl(details.webViewLink || 'URL Tidak Tersedia'); setError(''); setLoadingStatus('loading_files'); console.log("<<< fetchWorkspaceDetails SUCCESS, status -> loading_files"); } else { setError(prev => `${prev || ''}Gagal memuat detail (ID: ${idToFetch}). `); setActiveWorkspaceName('Error: Gagal Memuat'); setActiveWorkspaceUrl('Error'); setLoadingStatus('error'); console.error("<<< fetchWorkspaceDetails FAILED (API null), status -> error"); } } catch (err: any) { setError(prev => `${prev || ''}Error detail: ${err.message} `); setActiveWorkspaceName('Error: Exception'); setActiveWorkspaceUrl('Error'); setLoadingStatus('error'); console.error("<<< fetchWorkspaceDetails FAILED (exception), status -> error", err); } }, [accessToken, makeApiCall]);

    // --- Fetch File Langsung dari Folder --- (Sama)
    const fetchWorkspaceFiles = useCallback(async (currentId: string, workspaceName: string) => { /* ... kode ... */ console.log(`>>> fetchWorkspaceFiles triggered for: ${currentId} (Name: ${workspaceName})`); const userId = user?.id; if (!currentId || !userId || !accessToken || !supabase) { setError("Prasyarat fetch file tidak terpenuhi."); setLoadingStatus('error'); console.warn("fetchWorkspaceFiles aborted: Prerequisites missing."); return; } setIsFetchingItems(true); setWorkspaceFiles([]); const workspaceNameForPath = workspaceName && !workspaceName.startsWith('Memuat') && !workspaceName.startsWith('Error') ? workspaceName : 'Folder Ini'; const allFileIds: string[] = []; try { const fileFields = "files(id, name, mimeType, webViewLink, createdTime, modifiedTime)"; const fileQuery = `'${currentId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`; const fileUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(fileQuery)}&fields=${encodeURIComponent(fileFields)}&orderBy=name`; const fileData = await makeApiCall<GoogleDriveFilesListResponse>(fileUrl); if (fileData === null) { throw new Error(`Gagal mengambil file dari folder ID: ${currentId}.`); } const files = fileData.files || []; if (files.length > 0) { files.forEach(file => allFileIds.push(file.id)); const collectedFilesData = files.map(file => ({ id: file.id, filename: file.name, pathname: workspaceNameForPath, foldername: workspaceNameForPath, mimeType: file.mimeType, webViewLink: file.webViewLink || undefined, createdat: file.createdTime || undefined, lastmodified: file.modifiedTime || file.createdTime || undefined, isFolder: false, })); let metadataMap: Record<string, SupabaseFileMetadata> = {}; const chunkSize = 150; for (let i = 0; i < allFileIds.length; i += chunkSize) { const chunkIds = allFileIds.slice(i, i + chunkSize); const { data: metadataList, error: metaError } = await supabase.from('file').select('id, description, labels, color').in('id', chunkIds).eq('workspace_id', workspaceId ?? currentId).eq('user_id', userId!); if (metaError) console.warn("Supabase meta fetch warning:", metaError.message); if (metadataList) metadataList.forEach((meta: any) => { metadataMap[meta.id] = meta; }); } const finalFormattedFiles: Schema[] = collectedFilesData.map(fileData => { const metadata = metadataMap[fileData.id]; const otherData: { key: string; value: any }[] = []; if (metadata?.color) otherData.push({ key: 'color', value: metadata.color }); if (metadata?.labels?.length) otherData.push({ key: 'labels', value: metadata.labels }); return { ...fileData, description: metadata?.description ?? undefined, other: otherData.length > 0 ? otherData : undefined }; }); finalFormattedFiles.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase())); setWorkspaceFiles(finalFormattedFiles); } else { setWorkspaceFiles([]); } setError(prev => prev?.includes('Gagal memuat detail') ? prev : ''); setLoadingStatus('ready'); console.log(`<<< fetchWorkspaceFiles SUCCESS for ${currentId}, status -> ready`); } catch (err: any) { console.error(">>> Error during fetchWorkspaceFiles:", err); if (err instanceof z.ZodError) { console.error(">>> Zod Validation Error:", err.errors); setError(prev => `${prev || ''}Error validasi data: ${err.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')} `); } else { setError(prev => `${prev || ''}Gagal memuat file: ${err.message} `); } setWorkspaceFiles([]); setLoadingStatus('error'); console.error(`<<< fetchWorkspaceFiles FAILED for ${currentId}, status -> error`, err); } finally { setIsFetchingItems(false); console.log(`<<< fetchWorkspaceFiles finished (finally) for: ${currentId}`); } }, [user?.id, accessToken, supabase, makeApiCall, workspaceId]);

    // --- Callbacks for Upload & Refresh --- (Sama)
    const handleUploadSuccess = useCallback(() => { /* ... kode ... */ console.log("Upload success signal received, refreshing files..."); if (currentFolderId && activeWorkspaceName && !activeWorkspaceName.startsWith('Memuat') && !activeWorkspaceName.startsWith('Error') ) { if (!isFetchingItems) fetchWorkspaceFiles(currentFolderId, activeWorkspaceName); else console.warn("Skipping refresh during an ongoing fetch."); } else console.warn("Cannot refresh files: folder ID or workspace name is not ready."); }, [currentFolderId, activeWorkspaceName, fetchWorkspaceFiles, isFetchingItems]);
    const handleUploadError = useCallback((fileName: string, error: string) => { /* ... kode ... */ console.error(`Upload error reported for ${fileName}: ${error}`); setUploadError(`Gagal mengunggah ${fileName}: ${error}`); toast.error(`Upload Gagal: ${fileName}`, { description: error }); }, []);
    const refreshData = useCallback(() => { /* ... kode ... */ console.log("Refresh data triggered..."); if (currentFolderId && activeWorkspaceName && !activeWorkspaceName.startsWith('Memuat') && !activeWorkspaceName.startsWith('Error') ) { if (!isFetchingItems) { console.log("Executing refresh via fetchWorkspaceFiles..."); fetchWorkspaceFiles(currentFolderId, activeWorkspaceName); } else console.warn("Skipping refresh during an ongoing fetch."); } else console.warn("Cannot refresh files: folder ID or workspace name is not ready."); }, [currentFolderId, activeWorkspaceName, fetchWorkspaceFiles, isFetchingItems]);

    // --- Fungsi PDF Handling (Pindahkan dari page.tsx) ---
    const fetchPdfContent = useCallback(async (fileId: string) => {
        console.log(`[DEBUG] fetchPdfContent called for ID: ${fileId}`); // DEBUG
        if (!accessToken) {
            console.error("[DEBUG] fetchPdfContent aborted: No access token"); // DEBUG
            setPdfError("Akses token tidak tersedia.");
            return;
        }
        if (!fileId) {
            console.error("[DEBUG] fetchPdfContent aborted: No file ID"); // DEBUG
            return;
        }
        setPdfLoading(true); setPdfError(null); setPdfFile(null); setNumPages(null); setPageNumber(1); setPdfScale(1.0); setPdfContainerWidth(null); pageRefs.current = []; pageObserver.current?.disconnect();
        const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${fileId}?alt=media`;
        console.log(`[DEBUG] Fetching PDF from: ${url}`); // DEBUG
        try {
             const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } });
             console.log(`[DEBUG] PDF Fetch Response Status: ${response.status}`); // DEBUG
             if (!response.ok) {
                 let eMsg = `Gagal ambil PDF (${response.status})`;
                 try { const eData = await response.json(); eMsg += `: ${eData?.error?.message || 'Error tidak diketahui'}`; } catch (e) {}
                 console.error(`[DEBUG] PDF Fetch Error: ${eMsg}`); // DEBUG
                 throw new Error(eMsg);
             }
             const blob = await response.blob();
             const objectUrl = URL.createObjectURL(blob);
             console.log(`[DEBUG] PDF Blob URL created: ${objectUrl}`); // DEBUG
             setPdfFile(objectUrl); // <-- Pastikan state ini terupdate
        } catch (err: any) {
             console.error("[DEBUG] Error fetching/processing PDF:", err); // DEBUG
             setPdfError(err.message || "Gagal memuat preview PDF.");
        } finally {
             console.log("[DEBUG] fetchPdfContent finished loading."); // DEBUG
             setPdfLoading(false);
        }
    }, [accessToken]); // Hanya accessToken dependency utama

    function onDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }): void {
        console.log(`[DEBUG] onDocumentLoadSuccess: ${loadedNumPages} pages`); // DEBUG
        setNumPages(loadedNumPages); setPageNumber(1); setPdfScale(1.0);
        if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0;
        pageRefs.current = Array(loadedNumPages).fill(null);
        setTimeout(() => { if (pdfPreviewAreaRef.current) { const width = pdfPreviewAreaRef.current.offsetWidth; setPdfContainerWidth(width > 30 ? width - 20 : null); } }, 100);
    }
    const handleZoomIn = () => { setPdfScale(prev => Math.min(prev + PDF_SCALE_STEP, PDF_MAX_SCALE)); };
    const handleZoomOut = () => { setPdfScale(prev => Math.max(prev - PDF_SCALE_STEP, PDF_MIN_SCALE)); };
    const handleResetZoom = () => { setPdfScale(1.0); if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0; };
    const goToPage = (targetPage: number) => { if (targetPage >= 1 && targetPage <= (numPages ?? 0)) { const pageElement = pageRefs.current[targetPage - 1]; if (pageElement) { pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' }); setPageNumber(targetPage); } else { setPageNumber(targetPage); console.warn(`goToPage: Ref for page ${targetPage} not found or not ready.`); if (pdfContainerRef.current && numPages) { const approxPageHeight = pdfContainerRef.current.scrollHeight / numPages; pdfContainerRef.current.scrollTo({ top: approxPageHeight * (targetPage - 1), behavior: 'smooth' }); } } } };
    const goToPrevPage = () => goToPage(pageNumber - 1);
    const goToNextPage = () => goToPage(pageNumber + 1);
    // ----------------------------------------------------

    // --- useEffects ---

    // Inisialisasi User (Sama)
    useEffect(() => { if (user) { setIsLoadingPageInit(false); } else { setIsLoadingPageInit(true); } }, [user]);

    // Memulai Fetch Detail (Sama)
    useEffect(() => { /* ... kode fetch details ... */ console.log(">>> Primary Effect (Detail Trigger): Workspace/Folder ID or Token Changed"); setCurrentWorkspaceId(workspaceId); setCurrentFolderId(folderId); setWorkspaceFiles([]); setError(''); setUploadError(null); setLoadingStatus('idle'); setIsFetchingItems(false); setSearchQuery(''); const idToFetch = folderId || workspaceId; if (idToFetch && accessToken) { console.log(`>>> Primary Effect: Calling fetchWorkspaceDetails for ID: ${idToFetch}`); fetchWorkspaceDetails(idToFetch); } else if (idToFetch && !accessToken) { setActiveWorkspaceName('Menunggu Autentikasi...'); setLoadingStatus('error'); setError('Token autentikasi tidak tersedia.'); } else { setActiveWorkspaceName('Pilih Folder'); setActiveWorkspaceUrl(''); setLoadingStatus('idle'); } }, [workspaceId, folderId, accessToken, fetchWorkspaceDetails]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch Files (Sama)
    useEffect(() => { /* ... kode fetch files ... */ console.log(">>> File Fetch Effect triggered. Status:", loadingStatus); const idToFetchFilesFrom = currentFolderId || workspaceId; if (loadingStatus === 'loading_files' && idToFetchFilesFrom && activeWorkspaceName && user?.id && accessToken && supabase) { if (!activeWorkspaceName.startsWith('Error')) { if (!isFetchingItems) { console.log(`>>> File Fetch Effect: Calling fetchWorkspaceFiles for ID: ${idToFetchFilesFrom}`); fetchWorkspaceFiles(idToFetchFilesFrom, activeWorkspaceName); } else console.log(">>> File Fetch Effect: Skipping call (fetch already in progress)."); } else { console.warn(">>> File Fetch Effect: Skipping file fetch because folder name is in error state."); setLoadingStatus('error'); setError(prev => prev || "Tidak bisa memuat file karena detail folder gagal."); setIsFetchingItems(false); } } else if (loadingStatus === 'loading_files' && !idToFetchFilesFrom) { console.warn(">>> File Fetch Effect: Status is 'loading_files' but no ID to fetch from. Setting to ready."); setWorkspaceFiles([]); setLoadingStatus('ready'); setIsFetchingItems(false); } else if (loadingStatus === 'loading_files') { console.warn(">>> File Fetch Effect: Status is 'loading_files' but other prerequisites are missing!"); setLoadingStatus('error'); setError(prev => prev || "Gagal memulai fetch file, data tidak lengkap."); setIsFetchingItems(false); } }, [loadingStatus, currentFolderId, workspaceId, activeWorkspaceName, user?.id, accessToken, supabase, fetchWorkspaceFiles, isFetchingItems]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- useEffects untuk PDF Preview (Pindahkan dari page.tsx) ---
    // 1. Trigger fetch PDF content
    useEffect(() => {
        console.log("[DEBUG] PDF Fetch Trigger Effect:", { file: selectedFileForPreview?.id, isOpen: isPreviewSheetOpen, mime: selectedFileForPreview?.mimeType }); // DEBUG
        let objectUrlToRevoke: string | null = null;
        if (selectedFileForPreview?.mimeType === 'application/pdf' && selectedFileForPreview.id && isPreviewSheetOpen) {
             console.log("[DEBUG] Conditions met, attempting to fetch PDF content."); // DEBUG
             if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) {
                 console.log(`[DEBUG] Revoking old blob URL: ${pdfFile}`); // DEBUG
                 URL.revokeObjectURL(pdfFile); setPdfFile(null);
             }
             fetchPdfContent(selectedFileForPreview.id); // Panggil fetch
        } else {
             console.log("[DEBUG] Conditions NOT met, cleaning up PDF state."); // DEBUG
             if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) {
                 objectUrlToRevoke = pdfFile;
                 console.log(`[DEBUG] Will revoke blob URL on cleanup: ${objectUrlToRevoke}`); // DEBUG
             }
             setPdfFile(null); setPdfLoading(false); setPdfError(null); setNumPages(null); setPageNumber(1); setPdfScale(1.0); pageRefs.current = []; pageObserver.current?.disconnect();
        }
        return () => {
             if (objectUrlToRevoke) {
                 console.log(`[DEBUG] Cleanup: Revoking blob URL: ${objectUrlToRevoke}`); // DEBUG
                 URL.revokeObjectURL(objectUrlToRevoke);
             }
             // Pastikan observer di-disconnect saat sheet ditutup atau file berubah
             pageObserver.current?.disconnect();
             console.log("[DEBUG] PDF Fetch Trigger Effect cleanup ran."); // DEBUG
        };
     }, [selectedFileForPreview, isPreviewSheetOpen, fetchPdfContent]); // fetchPdfContent sbg dependency

    // 2. Ukur lebar kontainer PDF
    useEffect(() => { /* ... kode ukur lebar ... */ const container = pdfPreviewAreaRef.current; let resizeObserver: ResizeObserver | null = null; const updateWidth = () => { if (container && isPreviewSheetOpen && selectedFileForPreview?.mimeType === 'application/pdf') { const width = container.offsetWidth; const effectiveWidth = width > 30 ? width - 20 : null; setPdfContainerWidth(currentWidth => currentWidth !== effectiveWidth ? effectiveWidth : currentWidth); } else setPdfContainerWidth(null); }; if (container && isPreviewSheetOpen && selectedFileForPreview?.mimeType === 'application/pdf') { const timeoutId = setTimeout(updateWidth, 50); resizeObserver = new ResizeObserver(updateWidth); resizeObserver.observe(container); return () => { clearTimeout(timeoutId); if (container) resizeObserver?.unobserve(container); resizeObserver?.disconnect(); }; } else setPdfContainerWidth(null); }, [isPreviewSheetOpen, selectedFileForPreview, pdfFile]);
    // 3. Setup Intersection Observer
    useEffect(() => { /* ... kode observer ... */ if (!pdfFile || !numPages || numPages <= 0 || !pdfContainerRef.current) { pageObserver.current?.disconnect(); return; } const scrollContainer = pdfContainerRef.current; pageObserver.current?.disconnect(); const options = { root: scrollContainer, rootMargin: INTERSECTION_ROOT_MARGIN, threshold: INTERSECTION_THRESHOLD }; const observerCallback = (entries: IntersectionObserverEntry[]) => { let topVisiblePage = -1; let maxIntersectionRatio = -1; entries.forEach((entry) => { if (entry.isIntersecting) { const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '0', 10); if (entry.intersectionRatio > maxIntersectionRatio) { maxIntersectionRatio = entry.intersectionRatio; topVisiblePage = pageNum; } else if (entry.intersectionRatio === maxIntersectionRatio) { if (topVisiblePage === -1 || pageNum < topVisiblePage) topVisiblePage = pageNum; } } }); if (topVisiblePage > 0) setPageNumber(currentPN => currentPN !== topVisiblePage ? topVisiblePage : currentPN); }; pageObserver.current = new IntersectionObserver(observerCallback, options); const observer = pageObserver.current; const observeTimeout = setTimeout(() => { pageRefs.current.forEach((pageEl) => { if (pageEl) observer.observe(pageEl); }); }, 150); return () => { clearTimeout(observeTimeout); observer.disconnect(); }; }, [pdfFile, numPages]);
    // -----------------------------------------------------------

    // useEffect untuk Shortcut Search (Sama)
    useEffect(() => { /* ... kode shortcut ... */ const down = (e: KeyboardEvent) => { if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsSearchOpen((open) => !open); } }; document.addEventListener("keydown", down); return () => document.removeEventListener("keydown", down); }, []);

    // --- Logika Filter Pencarian --- (Sama, gunakan workspaceFiles)
    const filteredFiles = useMemo(() => { if (!searchQuery) return workspaceFiles; const lowerCaseQuery = searchQuery.toLowerCase(); return workspaceFiles.filter(file => file.filename.toLowerCase().includes(lowerCaseQuery) || (file.pathname && file.pathname.toLowerCase().includes(lowerCaseQuery)) ); }, [workspaceFiles, searchQuery]);

    // --- Buat objek Meta untuk DataTable ---
    const tableMeta: MyTableMeta = useMemo(() => ({
        accessToken: accessToken,
        onActionComplete: refreshData, // Gunakan refreshData atau handleUploadSuccess sesuai kebutuhan
        supabase: supabase as SupabaseClient,
        userId: user?.id ?? "", // Pastikan string, bukan null/undefined
        workspaceOrFolderId: workspaceId ?? currentFolderId ?? "", // ID Konteks Supabase
        // Callback untuk preview
        onSelectFileForPreview: (file) => {
             console.log("[DEBUG] onSelectFileForPreview called with:", file.filename); // DEBUG
             setSelectedFileForPreview(file);
        },
        onOpenPreviewSheet: () => {
             console.log("[DEBUG] onOpenPreviewSheet called"); // DEBUG
             setIsPreviewSheetOpen(true);
        },
    }), [accessToken, refreshData, supabase, user?.id, workspaceId, currentFolderId]); // Sertakan dependensi yang relevan

    // --- Render Logic ---
    if (isLoadingPageInit) { return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Memuat sesi pengguna...</div>; }
    if (!user || !account) { return <div className="flex h-screen items-center justify-center text-gray-600">Menunggu autentikasi Google...</div>; }

    const displayFolderName = activeWorkspaceName && !activeWorkspaceName.startsWith('Memuat') && !activeWorkspaceName.startsWith('Error') ? activeWorkspaceName : (currentFolderId || workspaceId ? 'Folder Ini' : 'Pilih Folder');
    const isLoadingDetails = loadingStatus === 'loading_details';
    const isOverallLoading = isLoadingDetails || isFetchingItems;
    const isUploadDisabled = isOverallLoading || !(currentFolderId || workspaceId) || !accessToken;

    return (
        <TooltipProvider delayDuration={200}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    {/* Header */}
                    <header className="flex w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        {/* ... kode header ... */}
                        <div className="flex w-full items-center gap-2 px-4"> <SidebarTrigger className="-ml-1" /> <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" /> <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4"> <h4 className="scroll-m-20 lg:text-lg text-3xl font-bold tracking-tight mr-2 truncate" title={displayFolderName || ''}>{isLoadingDetails ? <Loader2 className="h-5 w-5 animate-spin inline-block"/> : (displayFolderName || 'Pilih Folder')}</h4> </div> <div className="flex-1 items-right justify-right md:items-center"> <Button className="h-12 md:w-full w-11 h-10 md:justify-between justify-center md:pr-1" variant={"outline"} title="Cari file di folder ini (Ctrl+K)" onClick={() => setIsSearchOpen(true)}> <p className="text-gray-600 hidden md:inline text-md text-light">Temukan file...</p> <div className=" sm:w-8 w-2 h-8 rounded-md items-center justify-center flex gap-2 px-2"><Search className="text-primary h-4 w-4" /></div> </Button> </div> <NavUser/> </div>
                    </header>

                    {/* Konten Utama */}
                    <div className="flex flex-1 flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">
                        {/* Error & Upload Error Display */}
                        {/* ... kode error display ... */}
                        {error && ( <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"> <span className="block sm:inline">{error}</span> {(currentFolderId || workspaceId) && ( <Button variant="outline" size="sm" className="ml-4" onClick={() => { setError(''); const idToRetry = currentFolderId || workspaceId; if (accessToken && idToRetry) fetchWorkspaceDetails(idToRetry); }} disabled={isOverallLoading || (!currentFolderId && !workspaceId) || !accessToken}>{isOverallLoading ? <Loader2 className="h-3 w-3 animate-spin"/> : "Coba Lagi"}</Button> )} </div> )} {uploadError && ( <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded relative" role="alert"> <span className="block sm:inline">{uploadError}</span> <Button variant="ghost" size="sm" className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setUploadError(null)}><span className="text-orange-500">X</span></Button> </div> )}

                        {/* Breadcrumb */}
                        {/* ... kode breadcrumb ... */}
                         <div className="flex items-center justify-between mb-0 gap-4 flex-wrap bg-white p-4 rounded-xl"> <Button variant="outline" size="sm" onClick={() => router.push("/")} className="order-1 sm:order-none"> <ArrowLeft className="mr-2 h-4 w-4" /> Kembali </Button> <Breadcrumb className="order-none sm:order-1 flex-1 min-w-0 flex"> <BreadcrumbList> <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink></BreadcrumbItem> {(currentFolderId || workspaceId) && ( <> <BreadcrumbSeparator /> <BreadcrumbItem> <BreadcrumbPage className="truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm" title={isLoadingDetails ? 'Memuat...' : displayFolderName}>{isLoadingDetails ? <Loader2 className="h-4 w-4 animate-spin inline-block mr-1"/> : null} {displayFolderName}</BreadcrumbPage> </BreadcrumbItem> </> )} </BreadcrumbList> </Breadcrumb> <div className="order-2 sm:order-none h-9 w-24 hidden sm:block"></div> </div>

                        {/* === Konten Spesifik Folder === */}
                        {(currentFolderId || (workspaceId && !currentFolderId)) && loadingStatus !== 'error' && (
                            <>
                                {/* Upload */}
                                <div className="bg-muted/50 col-span-2 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
                                    {/* ... kode upload ... */}
                                    <div> <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md mb-4"> Unggah Berkas ke "{isLoadingDetails ? '...' : displayFolderName}" </h2> <FileUpload folderId={currentFolderId ?? workspaceId} accessToken={accessToken} onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} disabled={isUploadDisabled} /> {isUploadDisabled && !isOverallLoading && !accessToken && <p className="text-xs text-red-600 mt-1">Autentikasi Google diperlukan.</p>} {isUploadDisabled && !isOverallLoading && accessToken && !(currentFolderId || workspaceId) && <p className="text-xs text-orange-600 mt-1">Pilih folder tujuan terlebih dahulu.</p>} {isUploadDisabled && isOverallLoading && <p className="text-xs text-gray-500 mt-1">Menunggu data folder...</p>} </div>
                                </div>

                                {/* Tabel File */}
                                <div className="bg-muted/50 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
                                    {/* ... kode header tabel ... */}
                                    <div className="flex justify-between items-center mb-2"> <div> <h2 className="scroll-m-20 text-lg font-semibold tracking-tight lg:text-md truncate" title={`File di ${displayFolderName}`}> File di "{isLoadingDetails ? '...' : displayFolderName}" </h2> <p className="text-xs text-gray-500"> Daftar file yang berada langsung di dalam folder ini. </p> </div> <Button variant="outline" size="icon" onClick={refreshData} disabled={isFetchingItems || !(currentFolderId || workspaceId)} title="Muat ulang daftar file">{isFetchingItems ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCcw className="h-4 w-4"/>}</Button> </div>
                                    {/* Render DataTable dengan meta yang sudah dibuat */}
                                    {isFetchingItems ? (
                                         <div className="flex flex-col justify-center items-center p-6 text-gray-600"><Loader2 className="mb-2 h-6 w-6 animate-spin" /> Memuat file...</div>
                                     ) : loadingStatus === 'ready' && workspaceFiles.length === 0 ? (
                                         <div className="text-center p-6 text-gray-500"> Folder ini kosong. </div>
                                     ) : loadingStatus === 'ready' && workspaceFiles.length > 0 ? (
                                        <DataTable<Schema, unknown, MyTableMeta> // Tentukan tipe meta di sini
                                            data={workspaceFiles}
                                            columns={columns}
                                            meta={tableMeta} // <-- Gunakan objek meta yang sudah di-memoize
                                        />
                                     ) : (
                                         <div className="text-center p-6 text-gray-500">Menunggu detail folder...</div>
                                     )
                                    }
                                </div>
                            </>
                        )}

                        {/* Placeholder jika tidak ada ID */}
                        {/* ... kode placeholder ... */}
                        {(!currentFolderId && !workspaceId && !isLoadingPageInit) && loadingStatus !== 'error' && ( <div className="flex flex-col items-center justify-center flex-1 bg-white rounded-xl p-6 mt-4"> <h2 className="text-xl font-semibold text-gray-700 mb-2">Pilih Folder</h2> <p className="text-gray-500 text-center"> Pilih folder dari sidebar atau hubungkan folder baru di halaman Home. </p> </div> )} {loadingStatus === 'error' && (!currentFolderId && !workspaceId) && ( <div className="flex flex-col items-center justify-center flex-1 bg-red-50 rounded-xl p-6 mt-4 border border-red-200"> <h2 className="text-xl font-semibold text-red-700 mb-2">Terjadi Kesalahan</h2> <p className="text-red-600 text-center"> {error || "Tidak dapat memuat data awal."} </p> </div> )}
                    </div>

                    {/* --- Dialog Pencarian --- */}
                    {/* ... kode command dialog ... */}
                     <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}> <CommandInput placeholder="Cari nama file di folder ini..." value={searchQuery} onValueChange={setSearchQuery} /> <CommandList> <CommandEmpty>Tidak ada file yang cocok ditemukan.</CommandEmpty> {filteredFiles.length > 0 && ( <CommandGroup heading={`Hasil Pencarian (${filteredFiles.length})`}> {filteredFiles.map((file) => { const iconPath = getFileIcon(file.mimeType, file.isFolder); const friendlyType = getFriendlyFileType(file.mimeType, file.isFolder); return ( <CommandItem key={file.id} value={`${file.filename} ${friendlyType}`} onSelect={() => { setSelectedFileForPreview(file); setIsPreviewSheetOpen(true); setIsSearchOpen(false); setSearchQuery(''); }} className="cursor-pointer flex items-start gap-2" title={`${file.filename} (${friendlyType})`} > <img src={iconPath} alt={friendlyType} className="h-4 w-4 flex-shrink-0 mt-1" aria-hidden="true" /> <div className="flex flex-col overflow-hidden"> <span className="truncate font-medium">{file.filename}</span> <span className="text-xs text-gray-500 truncate italic">{friendlyType}</span> </div> </CommandItem> ); })} </CommandGroup> )} </CommandList> </CommandDialog>

                    {/* --- SHEET PREVIEW (Kode dari page.tsx) --- */}
                    <Sheet open={isPreviewSheetOpen} onOpenChange={setIsPreviewSheetOpen}>
                        <SheetContent side="right" className="w-full sm:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[1000px] flex flex-col p-0 h-screen overflow-hidden">
                            {/* 1. Header */}
                            <SheetHeader className="px-6 pt-6 pb-4 border-b relative shrink-0">
                                <SheetTitle>Detail File</SheetTitle>
                                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 rounded-full" onClick={() => setIsPreviewSheetOpen(false)}> <X className="h-5 w-5" /><span className="sr-only">Tutup</span> </Button>
                            </SheetHeader>

                            {/* 3. Detail File Section */}
                             <div className="px-6 py-5 space-y-4 border-b shrink-0">
                                {selectedFileForPreview ? (
                                    <>
                                        {/* ... detail file ... */}
                                        <div className="flex items-center space-x-3"> <img src={getFileIcon(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder, selectedFileForPreview.iconLink)} alt={getFriendlyFileType(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder)} className="h-9 w-9 flex-shrink-0" /> <span className="font-semibold break-all text-base" title={selectedFileForPreview.filename}>{selectedFileForPreview.filename}</span> </div> <div className="flex gap-2 flex-wrap"> {selectedFileForPreview.webViewLink && <Button variant="default" size="sm" asChild className="text-xs px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white"><a href={selectedFileForPreview.webViewLink} target="_blank" rel="noopener noreferrer">Buka di Drive</a></Button>} </div> <Separator /> <div className="space-y-1 text-sm text-gray-800"> <p><strong>Tipe:</strong> <span className="text-gray-600">{getFriendlyFileType(selectedFileForPreview.mimeType, selectedFileForPreview.isFolder)}</span></p> {selectedFileForPreview.pathname && <p><strong>Lokasi:</strong> <span className="break-words text-gray-600">{selectedFileForPreview.pathname}</span></p>} {selectedFileForPreview.description && <p><strong>Deskripsi:</strong> <span className="break-words whitespace-pre-wrap text-gray-600">{selectedFileForPreview.description}</span></p>} </div>
                                    </>
                                ) : ( <div className="flex items-center justify-center h-20 text-gray-500"> Memuat detail file... </div> )}
                            </div>

                             {/* 4. Preview Area */}
                            <div ref={pdfPreviewAreaRef} className="preview-content-area flex-1 min-h-0 flex flex-col bg-gray-200">
                                <div className="flex-1 min-h-0 overflow-hidden">
                                     {/* ----- DEBUG AREA ----- */}
                                     {/* Tambahkan log ini untuk melihat state kunci */}
                                     {/*
                                     <div className="absolute top-0 left-0 bg-yellow-200 text-black text-xs p-1 z-50 opacity-80">
                                        <p>Sheet Open: {isPreviewSheetOpen.toString()}</p>
                                        <p>File Selected: {selectedFileForPreview?.id ?? 'None'}</p>
                                        <p>MimeType: {selectedFileForPreview?.mimeType ?? 'N/A'}</p>
                                        <p>pdfFile State: {pdfFile ? (typeof pdfFile === 'string' ? pdfFile.substring(0, 30) + '...' : 'Blob') : 'null'}</p>
                                        <p>pdfLoading: {pdfLoading.toString()}</p>
                                        <p>pdfError: {pdfError ?? 'None'}</p>
                                     </div>
                                     */}
                                     {/* ----- AKHIR DEBUG AREA ----- */}

                                     {/* Kondisi untuk PDF (Internal Scroll) */}
                                     {selectedFileForPreview?.mimeType === 'application/pdf' && (
                                        <div className="flex-1 flex flex-col min-h-0 h-full">
                                            {pdfLoading && ( <div className="flex-1 flex items-center justify-center text-gray-500 p-4"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat preview...</div> )}
                                            {pdfError && ( <div className="flex-1 flex items-center justify-center text-red-600 bg-red-50 p-4 text-center text-sm">Error: {pdfError}</div> )}
                                            {/* Penting: Render Document HANYA jika pdfFile ada & tidak loading/error */}
                                            {pdfFile && !pdfLoading && !pdfError && (
                                                <div ref={pdfContainerRef} className="react-pdf-scroll-container flex-1 overflow-auto bg-gray-300">
                                                    <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess} onLoadError={(error) => setPdfError(`Gagal load PDF Doc: ${error.message}`)} loading={null} error={<div className="p-4 text-center text-red-500 text-sm">Gagal load PDF Document.</div>} className="flex flex-col items-center py-4 pdf-document" >
                                                        {Array.from(new Array(numPages ?? 0), (el, index) => (
                                                            <div key={`page_wrap_${index + 1}`} ref={(elRef) => { pageRefs.current[index] = elRef; }} data-page-number={index + 1} className="relative mb-4 bg-white shadow-lg" >
                                                                <PdfPage pageNumber={index + 1} scale={pdfScale} width={pdfContainerWidth ? pdfContainerWidth : undefined} renderTextLayer={true} renderAnnotationLayer={false} loading={<div className={`bg-gray-200 animate-pulse mx-auto`} style={{height: pdfContainerWidth ? (pdfContainerWidth*1.414) : 800, width: pdfContainerWidth ?? 'auto'}}></div>} error={<div className="my-2 p-2 text-red-500 text-xs text-center">Gagal load hal {index + 1}.</div>} className="pdf-page-render" />
                                                                <div className="absolute bottom-2 right-2 z-10"> <span className="bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded-sm shadow"> {index + 1} </span> </div>
                                                            </div>
                                                        ))}
                                                    </Document>
                                                </div>
                                            )}
                                            {/* Tampilkan pesan jika file PDF tapi belum ada data (misal error fetch) */}
                                             {!pdfFile && !pdfLoading && selectedFileForPreview?.mimeType === 'application/pdf' && !pdfError && (
                                                <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
                                                    Menunggu data PDF...
                                                </div>
                                             )}
                                        </div>
                                    )}
                                    {/* Kondisi Lainnya */}
                                    {selectedFileForPreview && selectedFileForPreview.mimeType !== 'application/pdf' && (
                                        <div className="flex-1 flex items-center justify-center p-4 h-full">
                                            {/* ... iframe atau placeholder lain ... */}
                                            {selectedFileForPreview.mimeType?.includes('google-apps') && !selectedFileForPreview.mimeType.includes('folder') && selectedFileForPreview.webViewLink ? ( <iframe src={selectedFileForPreview.webViewLink.replace('/edit', '/preview').replace('/view', '/preview')} className="w-full h-full border-0" title={`Preview ${selectedFileForPreview.filename}`} sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe> ) : selectedFileForPreview.mimeType?.startsWith('image/') ? ( <div className="w-full h-full flex items-center justify-center"><p className="text-sm text-gray-500 italic">(Preview gambar belum ada)</p></div> ) : ( <p className="text-sm text-gray-500 italic">Preview tidak tersedia untuk tipe file ini.</p> )}
                                        </div>
                                    )}
                                    {/* Placeholder jika belum ada file dipilih */}
                                    {!selectedFileForPreview && ( <div className="flex-1 flex items-center justify-center text-gray-500"> Pilih file untuk melihat preview. </div> )}
                                </div>
                            {/* 2. Kontrol PDF */}
                            {selectedFileForPreview?.mimeType === 'application/pdf' && pdfFile && !pdfLoading && !pdfError && (
                                <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b bg-gray-100 shrink-0">
                                    {/* ... tombol zoom dan navigasi ... */}
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={pdfScale <= PDF_MIN_SCALE}><ZoomOut className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Perkecil</TooltipContent></Tooltip> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetZoom} disabled={pdfScale === 1.0}><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Reset Zoom (100%)</TooltipContent></Tooltip> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={pdfScale >= PDF_MAX_SCALE}><ZoomIn className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Perbesar</TooltipContent></Tooltip> <span className="text-xs font-medium text-gray-600 w-12 text-center tabular-nums">{(pdfScale * 100).toFixed(0)}%</span> <Separator orientation="vertical" className="h-5 mx-1 sm:mx-2" /> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-8 px-3" onClick={goToPrevPage} disabled={pageNumber <= 1}>Prev</Button></TooltipTrigger><TooltipContent>Halaman Sebelumnya</TooltipContent></Tooltip> <span className="text-xs font-medium px-2 min-w-[70px] text-center justify-center"> Hal {pageNumber} dari {numPages ?? '?'} </span> <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-8 px-3" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages}>Next</Button></TooltipTrigger><TooltipContent>Halaman Berikutnya</TooltipContent></Tooltip>
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
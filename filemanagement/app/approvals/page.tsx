"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2, X, ZoomIn, ZoomOut, RotateCcw, FilePlus2, UploadCloud, FileArchive, Users, Search as SearchIcon, Info, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser as useStackframeUserHook, useUser } from "@stackframe/stack";
import { SupabaseClient } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

import {
    Approval,
    ProcessedApprovalRequest,
    ApprovalFile,
    WorkspaceFolder,
    SelectableUser,
    ExistingFileInWorkspace,
    IndividualApprovalStatusKey,
    OverallApprovalStatusKey
} from "@/components/approvals/schema";
import { columns as approvalsColumnsDefinition, ApprovalsTableMeta } from "@/components/approvals/columns";
import { ApprovalDataTable } from "@/components/approvals/datatable";

import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Schema as RecentFileSchema } from "@/components/recentfiles/schema";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// --- Konfigurasi Worker PDF.js ---
try {
  const pdfjsVersion = pdfjs.version;
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
} catch (error) {
  console.error("Gagal mengkonfigurasi worker pdf.js via unpkg:", error);
  const detectedVersion = (pdfjs as any).version || '3.11.174';
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${detectedVersion}/pdf.worker.min.js`;
}

interface AppSupabaseUser { id: string; displayname: string | null; primaryemail: string | null; is_admin: boolean | null; }

interface DisplayableApprover extends SelectableUser {
    isAlreadyActiveForFile?: boolean;
}

const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const PDF_MAX_SCALE = 3.0; const PDF_MIN_SCALE = 0.4; const PDF_SCALE_STEP = 0.2;

// Helper functions (Asumsikan sudah benar dari kode Anda sebelumnya)
function getFileIcon(mimeType?: string | null, isFolder?: boolean, iconLink?: string | null): string {
  const effectiveMimeType = mimeType || '';
  const effectiveIsFolder = isFolder || false;
  if (effectiveIsFolder) return iconLink || '/folder.svg';
  if (iconLink && !effectiveMimeType.includes('google-apps')) return iconLink;
  if (!effectiveMimeType) return '/file.svg';
  if (effectiveMimeType.startsWith('image/')) return '/picture.svg';
  if (effectiveMimeType.startsWith('video/')) return '/video.svg';
  if (effectiveMimeType.startsWith('audio/')) return '/music.svg';
  if (effectiveMimeType.startsWith('application/zip') || effectiveMimeType.startsWith('application/x-rar-compressed')) return '/zip.svg';
  if (effectiveMimeType === 'application/pdf') return '/pdf.svg';
  if (effectiveMimeType.includes('word') || effectiveMimeType.includes('opendocument.text')) return '/word.svg';
  if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('opendocument.presentation')) return '/ppt.svg';
  if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('opendocument.spreadsheet')) return '/xlsx.svg';
  if (effectiveMimeType === 'text/plain') return '/txt.svg';
  if (effectiveMimeType.includes('html')) return '/web.svg';
  if (effectiveMimeType.startsWith('text/')) return '/txt.svg';
  if (effectiveMimeType === 'application/vnd.google-apps.document') return '/gdoc.svg';
  if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg';
  if (effectiveMimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg';
  if (effectiveMimeType === 'application/vnd.google-apps.form') return '/gform.svg';
  if (effectiveMimeType === 'application/vnd.google-apps.drawing') return '/gdraw.svg';
  if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg';
  return '/file.svg';
}

function getFriendlyFileType(mimeType?: string | null, isFolder?: boolean): string {
  if (isFolder) return 'Folder';
  if (!mimeType) return 'Tidak Dikenal';
  if (mimeType.startsWith('image/')) return 'Gambar';
  if (mimeType === 'application/pdf') return 'Dokumen PDF';
  if (mimeType.includes('word')) return 'Dokumen Word';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'Spreadsheet Excel';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Presentasi PowerPoint';
  if (mimeType === 'application/vnd.google-apps.document') return 'Google Docs';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets';
  if (mimeType === 'application/vnd.google-apps.presentation') return 'Google Slides';
  return mimeType;
}

const getIndividualStatusKey = (status: string): IndividualApprovalStatusKey => {
  const sLower = status?.toLowerCase() || 'unknown';
  if (['approved', 'disetujui', 'sah', 'setuju'].includes(sLower)) return 'approved';
  if (['rejected', 'ditolak'].includes(sLower)) return 'rejected';
  if (['revised', 'perlu revisi', 'revisi'].includes(sLower)) return 'revised';
  if (['pending', 'menunggu', 'belum ditinjau'].includes(sLower)) return 'pending';
  return 'unknown';
};

const processRawApprovals = (
  rawApprovalsData: Approval[],
  currentUserId?: string | null,
): ProcessedApprovalRequest[] => {
  if (!rawApprovalsData || rawApprovalsData.length === 0) {
    return [];
  }
  type AccumulatorType = Record<string, Omit<ProcessedApprovalRequest, 'overallStatus'>>;
  const groupedByFile = rawApprovalsData.reduce((acc, approval) => {
    const fileId = approval.file_id_ref;
    if (!fileId || !approval.id) {
        console.warn("Approval record skipped due to missing file_id_ref or CUID (process ID):", approval);
        return acc;
    }
      const assignerData = approval.assigner;
    const processedAssigner = assignerData ? {
        id: assignerData.id,
        displayname: assignerData.id === currentUserId
            ? "Anda (pengaju)"
            : (assignerData.displayname || `Pengaju (${assignerData.id.substring(0,6)})`),
        primaryemail: assignerData.primaryemail
    } : null;

    if (!acc[fileId]) {
      acc[fileId] = {
        id: fileId,
        sharedApprovalProcessCuid: approval.id,
        fileIdRef: fileId,
        fileWorkspaceIdRef: approval.file_workspace_id_ref,
        fileUserIdRef: approval.file_user_id_ref,
        file: approval.file ? {
            ...(approval.file as any),
            filename: (approval.file as any).filename || approval.file.description || `File (${approval.file.id.substring(0,6)})`,
        } : null,
        assigner: processedAssigner,
        createdAt: approval.created_at,
        approverActions: [],
      };
    }
    const approverData = approval.approver;
    acc[fileId].approverActions.push({
      individualApprovalId: `${approval.id}-${approval.approver_user_id}`,
      approverId: approval.approver_user_id,
      approverName: approval.approver_user_id === currentUserId ? "Anda (pemberi persetujuan)" : (approverData?.displayname || `Approver (${approval.approver_user_id.substring(0,6)})`),
      approverEmail: approverData?.primaryemail || undefined,
      statusKey: getIndividualStatusKey(approval.status),
      statusDisplay: approval.status || "Tidak Diketahui",
      actioned_at: approval.actioned_at || null,
      remarks: approval.remarks || null,
    });
    if (new Date(approval.created_at) < new Date(acc[fileId].createdAt)) {
      acc[fileId].createdAt = approval.created_at;
    }
    return acc;
  }, {} as AccumulatorType);

  return Object.values(groupedByFile).map(group => {
    let overallStatus: OverallApprovalStatusKey = 'Belum Ada Tindakan';
    const actions = group.approverActions;
    if (actions.length > 0) {
      const hasRevision = actions.some(act => act.statusKey === 'revised');
      const allActioned = actions.every(act => act.statusKey !== 'pending' && act.statusKey !== 'unknown');
      const allApproved = actions.every(act => act.statusKey === 'approved');
      const anyPending = actions.some(act => act.statusKey === 'pending' || act.statusKey === 'unknown');

      if (hasRevision) overallStatus = 'Perlu Revisi';
      else if (allActioned && allApproved) overallStatus = 'Sah';
      else if (anyPending) overallStatus = 'Menunggu Persetujuan';
      else if (allActioned && !allApproved) overallStatus = 'Menunggu Persetujuan';
    }
    return { ...group, overallStatus } as ProcessedApprovalRequest;
  }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

async function fetchSelfWorkspaceFolders(
    makeApiCall: <T = any>(url: string, method?: string, body?: any, customHeaders?: Record<string, string>) => Promise<T | null>,
    activeWorkspaceId: string
): Promise<WorkspaceFolder[]> {
    if (!activeWorkspaceId) return [];
    try {
        const response = await makeApiCall<WorkspaceFolder[]>(`/api/gdrive/folders?workspaceId=${activeWorkspaceId}`);
        return response || [];
    } catch (error) {
        console.error("Error fetching self workspace folders via API:", error);
        toast.error("Gagal memuat folder workspace", { description: (error as Error).message });
        return [];
    }
}

async function fetchFilesFromFolder(
    makeApiCall: <T = any>(url: string, method?: string, body?: any, customHeaders?: Record<string, string>) => Promise<T | null>,
    folderId: string,
    selectedWorkspaceName: string | null
): Promise<ExistingFileInWorkspace[]> {
    if (!folderId) return [];
      try {
        const query = `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`;
        const fields = "files(id, name, mimeType, webViewLink, iconLink, description, createdTime, modifiedTime)";
        const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name`;
        const response = await makeApiCall<{ files: any[] }>(url);

        return (response?.files || []).map(file => ({
            id: file.id,
            filename: file.name,
            mimeType: file.mimeType,
            webViewLink: file.webViewLink,
            iconLink: file.iconLink,
            description: file.description,
            pathname: `${selectedWorkspaceName || 'Workspace'} / ${file.name}`,
        }));
    } catch (error) {
        console.error("Error fetching files from GDrive folder:", error);
        toast.error("Gagal memuat file dari folder", { description: (error as Error).message });
        return [];
    }
}

async function fetchWorkspaceUsers(
    supabaseClient: SupabaseClient | null,
    currentUserId?: string | null
): Promise<SelectableUser[]> {
    if (!supabaseClient || !currentUserId) return [];
    const { data, error } = await supabaseClient
        .from('user')
        .select('id, displayname, primaryemail, is_admin')
        .neq('id', currentUserId);

    if (error) {
        console.error("Gagal mengambil daftar pengguna:", error);
        return [];
    }
    return (data || []).map(u => ({ ...u, selected: false }));
}


export default function ApprovalsPage() {
  const router = useRouter();
  const appUser = useStackframeUserHook();
  const user = useUser();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppSupabaseUser | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true); // Loading untuk data user & init page
  const [pageError, setPageError] = useState<string | null>(null); // Error umum halaman atau fetch approval

  const [rawApprovals, setRawApprovals] = useState<Approval[]>([]);
  const [isFetchingApprovals, setIsFetchingApprovals] = useState(false); // Loading spesifik untuk data approval
  const [approvalsCurrentPage, setApprovalsCurrentPage] = useState(1);
  const [approvalsTotalPages, setApprovalsTotalPages] = useState(1);
  const [approvalsItemsPerPage, setApprovalsItemsPerPage] = useState(25);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string | null>("Semua Approval");
  const [isSelfWorkspaceActive, setIsSelfWorkspaceActive] = useState<boolean>(false);
  const [approvalSearchTerm, setApprovalSearchTerm] = useState("");

  const [selectedFileForPreview, setSelectedFileForPreview] = useState<RecentFileSchema | ApprovalFile | ExistingFileInWorkspace | null>(null);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState<boolean>(false);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
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

  const [isCreateApprovalModalOpen, setIsCreateApprovalModalOpen] = useState(false);
  const [newApprovalTab, setNewApprovalTab] = useState<'upload' | 'existing'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileRealDescription, setFileRealDescription] = useState("");
  const [selectedFolderForUpload, setSelectedFolderForUpload] = useState<string | null>(null);
  const [availableFolders, setAvailableFolders] = useState<WorkspaceFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [availableUsersForApproval, setAvailableUsersForApproval] = useState<SelectableUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [searchTermApprover, setSearchTermApprover] = useState("");
  const [filesInSelectedFolder, setFilesInSelectedFolder] = useState<ExistingFileInWorkspace[]>([]);
  const [isLoadingFilesFromFolder, setIsLoadingFilesFromFolder] = useState(false);
  const [selectedFolderForExisting, setSelectedFolderForExisting] = useState<string | null>(null);
  const [selectedFileToApproveId, setSelectedFileToApproveId] = useState<string | null>(null);
  const [activeApproverIdsForSelectedFile, setActiveApproverIdsForSelectedFile] = useState<Set<string>>(new Set());
  const [isLoadingActiveApprovers, setIsLoadingActiveApprovers] = useState(false);


  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
        setAccessToken(storedToken);
    } else {
        toast.error("Sesi tidak valid.", { description: "Token tidak ditemukan. Silakan login kembali." });
        user?.signOut();
        router.push('/masuk');
    }
  }, [router, user]);

  const makeApiCall = useCallback(async <T = any>(
    url: string, method: string = 'GET', body: any = null, customHeaders: Record<string, string> = {}
  ): Promise<T | null> => {
    if (!accessToken) {
      toast.error("Akses token tidak tersedia untuk panggilan API.");
      return null;
    }
    const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...customHeaders };
    if (!(body instanceof FormData) && body && method !== 'GET') { defaultHeaders['Content-Type'] = 'application/json';}

    const options: RequestInit = { method, headers: defaultHeaders, body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        let errorData: any = {};
        try { errorData = await response.json(); } catch (e) { /* ignore */ }
        const errorMsg = errorData?.error?.message || errorData?.error || errorData?.details || response.statusText || `Error ${response.status}`;
        if (response.status === 401) {
          toast.error("Sesi Anda berakhir atau tidak valid.", { description: "Harap login kembali untuk melanjutkan." });
          if(appUser?.signOut) await appUser.signOut();
          router.push('/masuk');
          return null;
        }
        throw new Error(errorMsg); // Ini akan ditangkap oleh catch di fetchApprovalsData
      }
      if (response.status === 204) return null;
      return response.json() as Promise<T>;
    } catch (err: any) {
      console.error(`API Call Error to ${url}:`, err);
      throw err; // Lempar error agar ditangkap oleh pemanggil (fetchApprovalsData)
    }
  }, [accessToken, router, appUser]);

  useEffect(() => {
    const fetchInitialUserData = async () => {
      // setIsLoadingPage(true); // Tidak perlu di set di sini, sudah true defaultnya
      setPageError(null); // Reset pageError jika ada dari load sebelumnya
      if (appUser?.id && supabase) {
        try {
          const { data: userData, error: userError } = await supabase.from('user').select('id, displayname, primaryemail, is_admin').eq('id', appUser.id).single();
          if (userError) throw userError;
          setCurrentUser(userData as AppSupabaseUser);
        } catch (error: any) {
          toast.error("Gagal memuat data pengguna.", { description: error.message });
          // setPageError(error.message); // Error pengguna bisa jadi tidak perlu blok render halaman
        }
      }
      setIsLoadingPage(false); // Selesai loading data pengguna
    };
    if (accessToken) {
        fetchInitialUserData();
    } else if (!localStorage.getItem("accessToken")) {
        setIsLoadingPage(false); // Tidak ada token, tidak perlu loading user
    }
  }, [appUser?.id, accessToken, supabase]);

  const fetchApprovalsData = useCallback(async (
    pageToFetch = approvalsCurrentPage,
    limitToFetch = approvalsItemsPerPage,
    wsIdToFetch = activeWorkspaceId,
    searchTermToFetch = approvalSearchTerm
  ) => {
    if (!accessToken || !currentUser) {
        setIsFetchingApprovals(false);
        return;
    }
    // `pageError` akan di-reset oleh useEffect pemanggil atau tombol retry
    setIsFetchingApprovals(true);

    try {
        const params = new URLSearchParams();
        if (wsIdToFetch) params.append('workspaceId', wsIdToFetch);
        params.append('page', pageToFetch.toString());
        params.append('limit', limitToFetch.toString());
        if (searchTermToFetch && searchTermToFetch.trim() !== "") {
            params.append('search', searchTermToFetch.trim());
        }
        console.log(`[ApprovalsPage] Fetching approvals with params: ${params.toString()}`);
        const result = await makeApiCall<{ message: string; data: Approval[]; pagination: any }>(
            `/api/approvals/getall?${params.toString()}`
        );

        if (result?.data) {
            setRawApprovals(result.data);
            if (result.pagination) {
                setApprovalsCurrentPage(result.pagination.currentPage);
                setApprovalsTotalPages(result.pagination.totalPages);
            }
            setPageError(null); // Data berhasil dimuat, hapus error jika ada
        } else if (result === null && !pageError) {
            // Jika API mengembalikan null (misal 204 atau auth error yang sudah ditangani makeApiCall)
            // dan tidak ada pageError sebelumnya (untuk menghindari reset jika error sudah ada)
            setRawApprovals([]);
            setApprovalsCurrentPage(1);
            setApprovalsTotalPages(1);
            // setPageError(null); // Bisa jadi tidak perlu jika sudah null
        }
        // Jika makeApiCall melempar error, akan ditangkap oleh catch block di bawah
    } catch (err: any) {
        console.error("[ApprovalsPage] Error in fetchApprovalsData catch block:", err);
        const errorMessage = err.message || "Terjadi kesalahan saat mengambil approval.";
        if (!err.message?.includes("aborted")) { // Jangan toast jika fetch di-abort
            toast.error("Gagal mengambil data approval.", { description: errorMessage });
        }
        setPageError(errorMessage);
        setRawApprovals([]); // Kosongkan data jika error
    } finally {
        setIsFetchingApprovals(false);
    }
  }, [accessToken, currentUser, makeApiCall, activeWorkspaceId, approvalSearchTerm, approvalsItemsPerPage, approvalsCurrentPage, pageError]); // pageError ditambahkan agar bisa reset rawApprovals jika API return null TAPI pageError sudah ada

  const handleWorkspaceUpdate = useCallback(async (
      wsId: string | null,
      wsName?: string | null,
      _wsUrl?: string | null,
      wsIsSelf?: boolean | null
    ) => {
    setActiveWorkspaceId(wsId);
    setActiveWorkspaceName(wsName || (wsId ? "Detail Workspace" : "Semua Approval"));
    setIsSelfWorkspaceActive(wsIsSelf || false);
    setAvailableFolders([]);
    setFilesInSelectedFolder([]);
    setSelectedFolderForUpload(null);
    setSelectedFolderForExisting(null);
    setSelectedFileToApproveId(null);
    setRawApprovals([]); // Reset data approval saat workspace berubah
    setPageError(null); // Reset error juga

    if (wsIsSelf && wsId) {
        setIsLoadingFolders(true);
        fetchSelfWorkspaceFolders(makeApiCall, wsId)
            .then(setAvailableFolders)
            .finally(() => setIsLoadingFolders(false));
    }
    // Fetch data approval akan dipicu oleh useEffect yang memantau activeWorkspaceId
  }, [makeApiCall]);

  // useEffect untuk memuat data saat filter/workspace/search term/items per page berubah
  useEffect(() => {
    if (accessToken && currentUser && !isLoadingPage) { // Pastikan isLoadingPage (untuk data user) sudah false
      console.log("[ApprovalsPage] EFFECT 1 (Filter/Context Change): Triggering fetch.");
      setPageError(null); // Selalu reset pageError sebelum fetch baru karena filter/konteks
      
      // Jika halaman saat ini bukan 1, set ke 1, yang akan memicu EFFECT 2.
      // Jika sudah halaman 1, fetch langsung.
      if (approvalsCurrentPage !== 1) {
        setApprovalsCurrentPage(1);
      } else {
        // Langsung fetch jika sudah di page 1 (misal, search term berubah di page 1)
        // Atur isFetchingApprovals sebelum memanggil fetch
        if (activeWorkspaceId) { // Hanya fetch jika ada workspace aktif
            setIsFetchingApprovals(true);
            fetchApprovalsData(1, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm);
        } else {
            setRawApprovals([]); // Tidak ada workspace, kosongkan data
            setIsFetchingApprovals(false); // Pastikan tidak ada loading
        }
      }
    } else if (!activeWorkspaceId && !isLoadingPage) {
        // Jika tidak ada workspaceId aktif dan halaman tidak sedang loading user, kosongkan data
        setRawApprovals([]);
        setIsFetchingApprovals(false);
        setPageError(null);
    }
  }, [accessToken, currentUser, isLoadingPage, activeWorkspaceId, approvalSearchTerm, approvalsItemsPerPage]);
  // fetchApprovalsData DIHAPUS dari dependency array EFFECT 1 untuk menghindari re-trigger yang tidak perlu
  // karena fetchApprovalsData sendiri bergantung pada approvalsCurrentPage.
  // Perubahan approvalsCurrentPage akan ditangani oleh EFFECT 2.

  // useEffect untuk memuat data saat halaman (approvalsCurrentPage) berubah.
  useEffect(() => {
    // Hanya fetch jika bukan bagian dari perubahan filter/konteks yang sudah di-handle EFFECT 1
    // dan jika accessToken, currentUser, dan activeWorkspaceId sudah siap.
    if (accessToken && currentUser && !isLoadingPage && activeWorkspaceId) {
      console.log(`[ApprovalsPage] EFFECT 2 (Page Change): Fetching data for page ${approvalsCurrentPage}.`);
      // Tidak perlu reset pageError di sini karena EFFECT 1 atau tombol retry yang akan menanganinya.
      setIsFetchingApprovals(true); // Set loading sebelum fetch
      fetchApprovalsData(approvalsCurrentPage, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm);
    }
  }, [approvalsCurrentPage, accessToken, currentUser, isLoadingPage, activeWorkspaceId]);
  // fetchApprovalsData DIHAPUS dari dependency array EFFECT 2.
  // Penambahan activeWorkspaceId sebagai dependensi memastikan effect ini hanya jalan jika workspace sudah dipilih.

  useEffect(() => {
    if (isCreateApprovalModalOpen && isSelfWorkspaceActive && supabase && currentUser?.id) {
        setIsLoadingUsers(true);
        fetchWorkspaceUsers(supabase, currentUser.id)
            .then(users => setAvailableUsersForApproval(users.map(u => ({...u, selected: false}))))
            .catch(err => toast.error("Gagal load pengguna workspace", { description: err.message }))
            .finally(() => setIsLoadingUsers(false));
    }
  }, [isCreateApprovalModalOpen, isSelfWorkspaceActive, supabase, currentUser?.id]);

    useEffect(() => {
    if (newApprovalTab === 'existing' && selectedFileToApproveId && makeApiCall) {
        setIsLoadingActiveApprovers(true);
        setActiveApproverIdsForSelectedFile(new Set());
        makeApiCall<string[]>(`/api/approvals/active-approvers?fileId=${selectedFileToApproveId}`)
            .then(ids => {
                if (ids) {
                    setActiveApproverIdsForSelectedFile(new Set(ids));
                }
            })
            .catch(err => {
                console.error("Gagal mengambil approver aktif untuk file:", err);
            })
            .finally(() => {
                setIsLoadingActiveApprovers(false);
            });
    } else {
        setActiveApproverIdsForSelectedFile(new Set());
    }
  }, [newApprovalTab, selectedFileToApproveId, makeApiCall]);


  useEffect(() => {
    if (newApprovalTab === 'existing' && selectedFolderForExisting && isSelfWorkspaceActive && activeWorkspaceId) {
        setIsLoadingFilesFromFolder(true);
        setFilesInSelectedFolder([]);
        setSelectedFileToApproveId(null);
        fetchFilesFromFolder(makeApiCall, selectedFolderForExisting, activeWorkspaceName)
            .then(setFilesInSelectedFolder)
            .finally(() => setIsLoadingFilesFromFolder(false));
    } else if (newApprovalTab !== 'existing') {
        setFilesInSelectedFolder([]);
        setSelectedFileToApproveId(null);
    }
  }, [newApprovalTab, selectedFolderForExisting, isSelfWorkspaceActive, activeWorkspaceId, makeApiCall, activeWorkspaceName]);


  const resetCreateApprovalForm = () => {
    setNewApprovalTab('upload');
    setUploadedFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setFileRealDescription("");
    setSelectedFolderForUpload(null);
    setSearchTermApprover("");
    setAvailableUsersForApproval(prev => prev.map(u => ({ ...u, selected: false })));
    setSelectedFolderForExisting(null);
    setFilesInSelectedFolder([]);
    setSelectedFileToApproveId(null);
    setActiveApproverIdsForSelectedFile(new Set());
  };

  const handleCreateApproval = async () => {
    if (!currentUser?.id || !activeWorkspaceId || !isSelfWorkspaceActive) {
        toast.error("Aksi tidak diizinkan atau informasi workspace tidak lengkap.");
        return;
    }
    const selectedApproversRaw = availableUsersForApproval
        .filter(u => u.selected)
        .filter(u => !(newApprovalTab === 'existing' && activeApproverIdsForSelectedFile.has(u.id)))
        .map(u => u.id);
    const uniqueSelectedApprovers = [...new Set(selectedApproversRaw)];
    if (uniqueSelectedApprovers.length === 0) {
        toast.error("Pilih minimal satu approver yang belum ditugaskan aktif ke file ini.");
        return;
    }
    setIsSubmittingApproval(true);
    const formData = new FormData();
    formData.append('assignerUserId', currentUser.id);
    formData.append('targetWorkspaceId', activeWorkspaceId);
    formData.append('approverUserIds', JSON.stringify(uniqueSelectedApprovers));
    formData.append('fileRealDescription', fileRealDescription);

    let apiEndpoint = "/api/approvals/create-with-upload";
    let successMessage = "Approval untuk file baru berhasil dibuat.";

    if (newApprovalTab === 'upload') {
        if (!uploadedFile) {
            toast.error("File unggahan wajib diisi."); setIsSubmittingApproval(false); return;
        }
        if (availableFolders.length > 0 && !selectedFolderForUpload && isSelfWorkspaceActive) {
              toast.error("Folder tujuan wajib dipilih jika tersedia di workspace Anda."); setIsSubmittingApproval(false); return;
        }
        formData.append('file', uploadedFile);
        if (selectedFolderForUpload) { formData.append('targetFolderId', selectedFolderForUpload); }
        successMessage = `Approval untuk "${uploadedFile.name}" telah dikirim.`;
    } else {
        if (!selectedFileToApproveId || !selectedFolderForExisting) {
            toast.error("Folder dan file yang sudah ada wajib dipilih."); setIsSubmittingApproval(false); return;
        }
        apiEndpoint = "/api/approvals/create-for-existing-file";
        formData.append('existingFileId', selectedFileToApproveId);
        const existingFileName = filesInSelectedFolder.find(f => f.id === selectedFileToApproveId)?.filename || `File ID ${selectedFileToApproveId.substring(0,6)}`;
        successMessage = `Approval untuk "${existingFileName}" telah dikirim.`;
    }

    try {
        const result = await makeApiCall<{success: boolean; message: string; error?: string; fileId?: string}>(apiEndpoint, 'POST', formData);
        if (result?.success) {
            toast.success("Permintaan Approval Dibuat", { description: successMessage });
            setIsCreateApprovalModalOpen(false);
            resetCreateApprovalForm();
            // Panggil fetchApprovalsData, reset ke page 1 dan hapus search term
            setApprovalSearchTerm(""); // Reset search term
            if (approvalsCurrentPage === 1) {
                fetchApprovalsData(1, approvalsItemsPerPage, activeWorkspaceId, "");
            } else {
                setApprovalsCurrentPage(1); // Ini akan memicu EFFECT 2 untuk fetch
            }
        } else {
            throw new Error(result?.error || result?.message || "Gagal membuat approval.");
        }
    } catch (err: any) {
        toast.error("Gagal Membuat Approval", { description: err.message });
    } finally {
        setIsSubmittingApproval(false);
    }
  };

  const displayableApproversList = useMemo((): DisplayableApprover[] => {
    let listToFilter = availableUsersForApproval;
    if (searchTermApprover) {
        const lowerSearch = searchTermApprover.toLowerCase();
        listToFilter = listToFilter.filter(user =>
            user.displayname?.toLowerCase().includes(lowerSearch) ||
            user.primaryemail?.toLowerCase().includes(lowerSearch)
        );
    }
    return listToFilter.map(user => ({
        ...user,
        isAlreadyActiveForFile: newApprovalTab === 'existing' && selectedFileToApproveId ? activeApproverIdsForSelectedFile.has(user.id) : false,
    }));
  }, [availableUsersForApproval, searchTermApprover, newApprovalTab, selectedFileToApproveId, activeApproverIdsForSelectedFile]);


  const toggleApproverSelection = (userId: string) => {
    setAvailableUsersForApproval(prevUsers =>
        prevUsers.map(user =>
            user.id === userId ? { ...user, selected: !user.selected } : user
        )
    );
  };

  const processedDataForTable = useMemo(() => {
    if (!currentUser?.id) return [];
    return processRawApprovals(rawApprovals, currentUser.id);
  }, [rawApprovals, currentUser?.id]);


  // --- PDF PREVIEW LOGIC ---
  const fetchPdfContent = useCallback(async (fileId: string) => {
    if (!accessToken || !fileId) {
        setPdfLoading(false);
        return;
    }
    setPdfLoading(true);
    setPdfError(null);
    setNumPages(null);
    setPageNumber(1);
    if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0;
    pageRefs.current = [];
    if (pageObserver.current) pageObserver.current.disconnect();

    const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${fileId}?alt=media`;
    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!response.ok) {
        let eMsg = `Gagal ambil PDF (${response.status})`;
        try { const eData = await response.json(); eMsg += `: ${eData?.error?.message || 'Unknown API error'}`; } catch (e) {/* ignore */}
        throw new Error(eMsg);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfFile(objectUrl);
    } catch (err: any) {
      console.error("Error fetching PDF:", err);
      setPdfError(err.message || "Gagal memuat preview PDF.");
      setPdfFile(null);
    } finally {
      setPdfLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    let objectUrlToRevokeOnCleanup: string | null = null;

    if (selectedFileForPreview?.mimeType === 'application/pdf' && typeof selectedFileForPreview.id === 'string' && selectedFileForPreview.id.length > 0 && isPreviewSheetOpen) {
      if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) {
        URL.revokeObjectURL(pdfFile);
      }
      setPdfFile(null);
      setPdfLoading(true);
      setPdfError(null);
      fetchPdfContent(selectedFileForPreview.id);
    } else {
      if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) {
        objectUrlToRevokeOnCleanup = pdfFile;
      }
      setPdfFile(null);
      setPdfLoading(false);
      setPdfError(null);
      setNumPages(null);
      setPageNumber(1);
      setPdfScale(1.0);
      pageRefs.current = [];
      if (pageObserver.current) {
        pageObserver.current.disconnect();
      }
    }
    return () => {
      if (objectUrlToRevokeOnCleanup) {
        URL.revokeObjectURL(objectUrlToRevokeOnCleanup);
      }
      if (pageObserver.current) {
        pageObserver.current.disconnect();
      }
    };
  }, [selectedFileForPreview, isPreviewSheetOpen, fetchPdfContent]); // fetchPdfContent adalah useCallback, pdfFile tidak ada di sini

  function onDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }): void {
    setNumPages(loadedNumPages);
    setPageNumber(1);
    setPdfScale(1.0);
    if (pdfContainerRef.current) {
        pdfContainerRef.current.scrollTop = 0;
    }
    pageRefs.current = Array(loadedNumPages).fill(null);
    setTimeout(() => {
      if (pdfPreviewAreaRef.current) {
        const width = pdfPreviewAreaRef.current.offsetWidth;
        setPdfContainerWidth(width > 30 ? width - 20 : 580);
      } else {
        setPdfContainerWidth(580);
      }
    }, 100);
  }

  const handleZoomIn = () => setPdfScale(prev => Math.min(prev + PDF_SCALE_STEP, PDF_MAX_SCALE));
  const handleZoomOut = () => setPdfScale(prev => Math.max(prev - PDF_SCALE_STEP, PDF_MIN_SCALE));
  const handleResetZoom = () => { setPdfScale(1.0); if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0; };

  const goToPage = (targetPage: number) => {
    if (targetPage >= 1 && targetPage <= (numPages ?? 0)) {
        const pageElement = pageRefs.current[targetPage - 1];
        if (pageElement && 'scrollIntoView' in pageElement && typeof pageElement.scrollIntoView === 'function') {
            (pageElement as HTMLDivElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
            setPageNumber(targetPage);
        } else {
            setPageNumber(targetPage);
            if (pdfContainerRef.current && numPages) {
                const approxPageHeight = pdfContainerRef.current.scrollHeight / numPages;
                pdfContainerRef.current.scrollTo({ top: approxPageHeight * (targetPage - 1), behavior: 'smooth' });
            }
        }
    }
  };
  const goToPrevPage = () => goToPage(pageNumber - 1);
  const goToNextPage = () => goToPage(pageNumber + 1);

  useEffect(() => {
    if (!pdfFile || !numPages || numPages <= 0 || !pdfContainerRef.current || !isPreviewSheetOpen) {
      if (pageObserver.current) {
        pageObserver.current.disconnect();
      }
      return;
    }
    const scrollContainer = pdfContainerRef.current;
    if (pageObserver.current) {
      pageObserver.current.disconnect();
    }
    const options = { root: scrollContainer, rootMargin: "-40% 0px -60% 0px", threshold: 0.01 };
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      let topVisiblePage = -1;
      let maxIntersectionRatio = -1;
      entries.forEach((entry) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          const pageNumAttr = entry.target.getAttribute('data-page-number');
          if (pageNumAttr) {
            const pageNum = parseInt(pageNumAttr, 10);
            if (entry.intersectionRatio > maxIntersectionRatio) {
              maxIntersectionRatio = entry.intersectionRatio;
              topVisiblePage = pageNum;
            } else if (entry.intersectionRatio === maxIntersectionRatio) {
              if (topVisiblePage === -1 || pageNum < topVisiblePage) { topVisiblePage = pageNum; }
            }
          }
        }
      });
      if (topVisiblePage > 0) {
        setPageNumber(prevPageNumber => prevPageNumber !== topVisiblePage ? topVisiblePage : prevPageNumber);
      }
    };
    pageObserver.current = new IntersectionObserver(observerCallback, options);
    const currentObserver = pageObserver.current;
    const timeoutId = setTimeout(() => {
      pageRefs.current.forEach((pageEl) => {
        if (pageEl) {
          currentObserver.observe(pageEl);
        }
      });
    }, 300);
    return () => {
      clearTimeout(timeoutId);
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [pdfFile, numPages, isPreviewSheetOpen]);
  // --- AKHIR PDF PREVIEW LOGIC ---

  const memoizedApprovalsColumns = useMemo(() => approvalsColumnsDefinition(), []);

  const tableMeta = useMemo((): ApprovalsTableMeta => ({
    accessToken: accessToken,
    onActionComplete: () => { // Setelah aksi di tabel, fetch ulang dari halaman 1
        setApprovalSearchTerm(""); // Reset search term juga
        if (approvalsCurrentPage === 1) {
            fetchApprovalsData(1, approvalsItemsPerPage, activeWorkspaceId, "");
        } else {
            setApprovalsCurrentPage(1);
        }
    },
    supabase: supabase as SupabaseClient,
    userId: currentUser?.id ?? undefined,
    workspaceOrFolderId: activeWorkspaceId,
    onSelectFileForPreview: (fileToPreview) => {
      setSelectedFileForPreview(fileToPreview as RecentFileSchema | ApprovalFile | ExistingFileInWorkspace);
    },
    onOpenPreviewSheet: () => {
      if (selectedFileForPreview && selectedFileForPreview.id) {
        setIsPreviewSheetOpen(true);
      } else {
        toast.info("Pilih file yang valid untuk ditampilkan detailnya.");
      }
    },
    makeApiCall: makeApiCall,
  }), [accessToken, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm, currentUser?.id, fetchApprovalsData, selectedFileForPreview, makeApiCall, approvalsCurrentPage]);


  // Kondisi render awal halaman
  if (isLoadingPage && !currentUser && !accessToken) {
    return <div className="flex h-screen items-center justify-center text-lg"><Loader2 className="h-8 w-8 animate-spin mr-3" /> Memuat Halaman Approval...</div>;
  }
  if (isLoadingPage && !currentUser && accessToken) { // Ada token, tapi data user belum selesai load
    return <div className="flex h-screen items-center justify-center text-lg"><Loader2 className="h-8 w-8 animate-spin mr-3" /> Memverifikasi pengguna...</div>;
  }
  // Jika tidak ada token sama sekali dan loading page sudah selesai (misal gagal load token)
  if (!isLoadingPage && !accessToken && !currentUser) {
    return (
        <div className="flex h-screen items-center justify-center text-lg flex-col gap-4">
            <p>Sesi tidak valid atau token tidak ditemukan.</p>
            <Button onClick={() => router.push('/masuk')}>Kembali ke Halaman Masuk</Button>
        </div>
    );
  }


  return (
    <TooltipProvider delayDuration={100}>
      <SidebarProvider>
        <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdate} />
        <SidebarInset>
          <header className="flex w-full shrink-0 items-center gap-2 h-12">
            <div className="flex w-full items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <div className="flex flex-col items-left justify-start">
                <h4
                    className="scroll-m-20 text-lg font-semibold tracking-tight truncate max-w-[calc(100vw-350px)]"
                    title={activeWorkspaceName ?? "Daftar Approval"}
                >
                  {activeWorkspaceName ? `Approval: ${activeWorkspaceName}` : "Daftar Approval"}
                </h4>
              </div>
              <div className="flex-1" />
              <NavUser />
            </div>
          </header>

          <div className="flex-1 h-[calc(100vh-theme('space.12'))] overflow-y-auto">
            <div className="flex flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)] dark:bg-slate-900 min-h-full">
              {/* Tombol Coba Lagi dan Pesan Error Utama */}
              {pageError && !isFetchingApprovals && (
                <div className="bg-destructive/10 border border-destructive text-destructive-foreground p-3 rounded-md" role="alert">
                  <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold">Terjadi Kesalahan</p>
                        <p className="text-sm">{pageError}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPageError(null);
                          setIsFetchingApprovals(true); // Set loading untuk retry
                          // Panggil fetchApprovalsData dengan parameter saat ini atau reset ke halaman 1
                          fetchApprovalsData(approvalsCurrentPage, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm);
                        }}
                        className="text-xs"
                    >
                        Coba Lagi
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-card p-4 sm:p-6 rounded-lg">
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div>
                        <h2 className="scroll-m-20 text-xl font-semibold tracking-tight lg:text-2xl">
                        Daftar Persetujuan
                        </h2>
                        <p className="text-sm text-muted-foreground">
                        {activeWorkspaceName && activeWorkspaceName !== "Semua Approval" ? `Untuk ${activeWorkspaceName}` : 'Semua Workspace Anda'}
                        </p>
                    </div>
                  </div>
                   <p className="text-xs text-muted-foreground mb-4">
                    Kelola semua permintaan persetujuan. Status keseluruhan dihitung berdasarkan tindakan semua approver.
                  </p>
                    {isSelfWorkspaceActive && currentUser?.is_admin && (
                        <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            resetCreateApprovalForm();
                            setIsCreateApprovalModalOpen(true);
                        }}
                        disabled={!activeWorkspaceId || isLoadingFolders || !isSelfWorkspaceActive}
                        >
                        <FilePlus2 className="mr-2 h-4 w-4" /> Buat Approval Baru
                        </Button>
                    )}
                </div>

                {/* Kondisi Loading Utama untuk tabel */}
                {isLoadingPage && !currentUser ? ( // Loading awal halaman, data user belum ada
                    <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin mr-3" /> Memverifikasi pengguna dan memuat halaman...
                    </div>
                ) : isFetchingApprovals && rawApprovals.length === 0 && !pageError ? (
                    <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin mr-3" /> Memuat data approval...
                    </div>
                ) : !isFetchingApprovals && rawApprovals.length === 0 && pageError ? (
                    <div className="flex items-center justify-center h-64">
                        {/* Pesan error sudah ditampilkan di atas */}
                    </div>
                ) : !activeWorkspaceId && !isLoadingPage && !isFetchingApprovals && !pageError ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Pilih workspace untuk melihat data approval.</p>
                    </div>
                ) : !isFetchingApprovals && rawApprovals.length === 0 && !pageError && activeWorkspaceId ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Tidak ada data approval untuk workspace ini.</p>
                    </div>
                ) : (
                    <ApprovalDataTable
                        columns={memoizedApprovalsColumns}
                        data={processedDataForTable}
                        isLoading={isFetchingApprovals && processedDataForTable.length === 0 && !pageError} // Hanya full loading jika belum ada data & tidak error
                        isRefreshing={isFetchingApprovals && processedDataForTable.length > 0} // Indikator refresh jika sudah ada data
                        onRefresh={() => {
                            setApprovalSearchTerm("");
                            setPageError(null); // Reset error sebelum refresh
                            if (approvalsCurrentPage === 1) {
                                setIsFetchingApprovals(true);
                                fetchApprovalsData(1, approvalsItemsPerPage, activeWorkspaceId, "");
                            } else {
                                setApprovalsCurrentPage(1); // Akan memicu EFFECT 2
                            }
                        }}
                        currentPage={approvalsCurrentPage}
                        totalPages={approvalsTotalPages}
                        onPageChange={(page) => { setApprovalsCurrentPage(page); }}
                        itemsPerPage={approvalsItemsPerPage}
                        setItemsPerPage={(size) => { setApprovalsItemsPerPage(size); setApprovalsCurrentPage(1);}}
                        externalGlobalFilter={approvalSearchTerm}
                        onExternalGlobalFilterChange={setApprovalSearchTerm}
                        meta={tableMeta}
                    />
                )}
              </div>
            </div>
          </div>

        {/* Modal Create Approval (Tidak diubah) */}
        <Dialog open={isCreateApprovalModalOpen} onOpenChange={(isOpen) => {
            if (!isOpen && !isSubmittingApproval) resetCreateApprovalForm();
            setIsCreateApprovalModalOpen(isOpen);
        }}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Buat Permintaan Persetujuan Baru</DialogTitle>
                    <DialogDescription>
                        Untuk workspace: <strong>{activeWorkspaceName || "Tidak Diketahui"}</strong>
                        {isSelfWorkspaceActive ? "" : " (Workspace Dibagikan - hanya bisa pilih file yang sudah ada)"}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2 custom-scrollbar">
                    <Tabs value={newApprovalTab} onValueChange={(value: string) => {
                        const newTabValue = value as 'upload' | 'existing';
                        setNewApprovalTab(newTabValue);
                        setFileRealDescription("");
                        if (newTabValue === 'existing' && selectedFileToApproveId) {
                            // const fileMeta = filesInSelectedFolder.find(f => f.id === selectedFileToApproveId);
                        } else if (newTabValue === 'upload') {
                            setActiveApproverIdsForSelectedFile(new Set());
                            setSelectedFolderForExisting(null);
                            setFilesInSelectedFolder([]);
                            setSelectedFileToApproveId(null);
                        }
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload" disabled={!isSelfWorkspaceActive} title={!isSelfWorkspaceActive ? "Unggah hanya bisa untuk workspace milik sendiri" : undefined}>
                                <UploadCloud className="mr-2 h-4 w-4 inline-block"/> Unggah Berkas Baru
                            </TabsTrigger>
                            <TabsTrigger value="existing">
                                <FileArchive className="mr-2 h-4 w-4 inline-block"/> Gunakan Berkas Ada
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="mt-4 space-y-4">
                            <div>
                                <Label htmlFor="file-upload">Pilih Berkas <span className="text-red-500">*</span></Label>
                                <Input id="file-upload" type="file" ref={fileInputRef} onChange={(e) => setUploadedFile(e.target.files ? e.target.files[0] : null)} className="mt-1 text-sm" disabled={isSubmittingApproval} />
                                {uploadedFile && <p className="text-xs text-muted-foreground mt-1">Terpilih: {uploadedFile.name} ({(uploadedFile.size / (1024*1024)).toFixed(2)} MB)</p>}
                            </div>
                            <div>
                                <Label htmlFor="folder-for-upload">Folder Tujuan di Workspace Ini</Label>
                                {isLoadingFolders ? ( <div className="flex items-center text-sm text-muted-foreground mt-1"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat folder...</div>
                                ) : availableFolders.length > 0 ? (
                                    <Select value={selectedFolderForUpload || undefined} onValueChange={setSelectedFolderForUpload} disabled={isSubmittingApproval} >
                                        <SelectTrigger className="w-full mt-1 text-sm"> <SelectValue placeholder="Pilih folder tujuan (opsional)..." /> </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ROOT">Root Workspace</SelectItem>
                                            {availableFolders.map(folder => (<SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                ) : ( <p className="text-sm text-muted-foreground mt-1 italic flex items-center"><Info className="h-4 w-4 mr-1"/> Tidak ada sub-folder. File akan diunggah ke root workspace.</p> )}
                            </div>
                              <div>
                                <Label htmlFor="file-real-description-upload">Deskripsi Dokumen (Opsional)</Label>
                                <Textarea
                                    id="file-real-description-upload"
                                    value={fileRealDescription}
                                    onChange={(e) => setFileRealDescription(e.target.value)}
                                    placeholder="Jelaskan isi atau tujuan utama dokumen ini..."
                                    className="mt-1 min-h-[60px] text-sm"
                                    disabled={isSubmittingApproval}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Deskripsi ini akan disimpan bersama file.</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="existing" className="mt-4 space-y-4">
                            <div>
                                <Label htmlFor="folder-for-existing">Pilih Folder di Workspace Ini <span className="text-red-500">*</span></Label>
                                {isLoadingFolders ? ( <div className="flex items-center text-sm text-muted-foreground mt-1"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat folder...</div>
                                ) : availableFolders.length > 0 ? (
                                    <Select value={selectedFolderForExisting || undefined} onValueChange={setSelectedFolderForExisting} disabled={isSubmittingApproval || isLoadingFilesFromFolder} >
                                        <SelectTrigger className="w-full mt-1 text-sm"> <SelectValue placeholder="Pilih folder untuk melihat berkas..." /> </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ROOT">Root Workspace</SelectItem>
                                            {availableFolders.map(folder => (<SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                ) : ( <p className="text-sm text-muted-foreground mt-1 italic">Tidak ada folder ditemukan atau gagal memuat. Pilih "Root Workspace" untuk file di root.</p> )}
                            </div>
                            {selectedFolderForExisting && (
                                <div>
                                    <Label htmlFor="select-existing-file">Pilih Berkas dari Folder Terpilih <span className="text-red-500">*</span></Label>
                                    {isLoadingFilesFromFolder ? ( <div className="flex items-center text-sm text-muted-foreground mt-1"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat berkas...</div>
                                    ) : filesInSelectedFolder.length > 0 ? (
                                        <Select value={selectedFileToApproveId || undefined}
                                            onValueChange={(value) => {
                                                setSelectedFileToApproveId(value);
                                                const fileMeta = filesInSelectedFolder.find(f => f.id === value);
                                                setFileRealDescription(fileMeta?.description || "");
                                            }}
                                            disabled={isSubmittingApproval} >
                                            <SelectTrigger className="w-full mt-1 text-sm"> <SelectValue placeholder="Pilih berkas..." /> </SelectTrigger>
                                            <SelectContent> {filesInSelectedFolder.map(file => (
                                                <SelectItem key={file.id} value={file.id} className="text-sm">
                                                    <div className="flex items-center">
                                                        <img src={getFileIcon(file.mimeType, false, file.iconLink)} alt="" className="h-4 w-4 mr-2 flex-shrink-0"/>
                                                        {file.filename}
                                                    </div>
                                                </SelectItem>
                                            ))} </SelectContent>
                                        </Select>
                                    ) : ( <p className="text-sm text-muted-foreground mt-1 italic">Tidak ada berkas di folder ini.</p> )}
                                </div>
                            )}
                              {newApprovalTab === 'existing' && selectedFileToApproveId && (
                                <div className="mt-2 p-3 bg-muted/50 rounded-md">
                                    <Label className="text-xs font-semibold text-foreground">Deskripsi Dokumen Saat Ini (Read-only):</Label>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                        {fileRealDescription || "- Tidak ada deskripsi -"}
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div>
                        <Label>Pilih Approver <span className="text-red-500">*</span></Label>
                        <div className="mt-1 relative">
                            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Cari nama atau email approver..." value={searchTermApprover} onChange={(e) => setSearchTermApprover(e.target.value)} className="pl-8 w-full mb-2 text-sm" disabled={isLoadingUsers || isSubmittingApproval || isLoadingActiveApprovers}/>
                        </div>
                        {isLoadingUsers || isLoadingActiveApprovers ? ( <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat daftar pengguna...</div>
                        ) : displayableApproversList.length > 0 ? (
                            <ScrollArea className="h-[150px] w-full rounded-md border p-2">
                                <div className="space-y-1">
                                    {displayableApproversList.map(user => (
                                    <div key={user.id} className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${user.isAlreadyActiveForFile ? 'opacity-50 bg-slate-50 dark:bg-slate-800' : 'hover:bg-accent/50'}`}>
                                        <Checkbox
                                            id={`approver-${user.id}`}
                                            checked={!!user.selected && !user.isAlreadyActiveForFile}
                                            onCheckedChange={() => !user.isAlreadyActiveForFile && toggleApproverSelection(user.id)}
                                            disabled={isSubmittingApproval || user.isAlreadyActiveForFile}
                                            aria-label={user.isAlreadyActiveForFile ? `${user.displayname || user.primaryemail} sudah menjadi approver aktif untuk file ini` : `Pilih ${user.displayname || user.primaryemail}`}
                                        />
                                        <Label htmlFor={`approver-${user.id}`} className={`flex-1 text-sm ${user.isAlreadyActiveForFile ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <span className="font-medium">{user.displayname || "Tanpa Nama"}</span>
                                            <span className="block text-xs text-muted-foreground">{user.primaryemail}</span>
                                        </Label>
                                        {user.isAlreadyActiveForFile && (
                                            <Badge variant="outline" className="text-xs font-normal h-5 px-1.5 bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-800/30 dark:text-amber-300 dark:border-amber-700">
                                                <Info className="h-3 w-3 mr-1"/> Aktif
                                            </Badge>
                                        )}
                                    </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : ( <p className="text-sm text-muted-foreground italic py-4 text-center"> {searchTermApprover ? "Tidak ada pengguna cocok." : (currentUser?.is_admin ? "Tidak ada pengguna lain di sistem." : "Gagal memuat pengguna.")} </p> )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateApprovalModalOpen(false)} disabled={isSubmittingApproval}> Batal </Button>
                    <Button onClick={handleCreateApproval}
                        disabled={
                            isSubmittingApproval || isLoadingFolders || isLoadingUsers || isLoadingActiveApprovers ||
                            (newApprovalTab === 'upload' && (!uploadedFile || (isSelfWorkspaceActive && availableFolders.length > 0 && !selectedFolderForUpload) )) ||
                            (newApprovalTab === 'existing' && (!selectedFileToApproveId || !selectedFolderForExisting)) ||
                            availableUsersForApproval.filter(u => u.selected && !(newApprovalTab === 'existing' && activeApproverIdsForSelectedFile.has(u.id))).length === 0
                        } >
                        {isSubmittingApproval && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Permintaan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

          {/* Sheet untuk Preview File (Tidak diubah) */}
          <Sheet open={isPreviewSheetOpen} onOpenChange={setIsPreviewSheetOpen}>
            <SheetContent side="right" className="w-full sm:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[1000px] flex flex-col p-0 h-screen overflow-hidden">
              <SheetHeader className="px-6 pt-6 pb-4 relative shrink-0 border-b">
                <SheetTitle className="truncate pr-10">{selectedFileForPreview?.filename || "Detail File"}</SheetTitle>
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 rounded-full" onClick={() => setIsPreviewSheetOpen(false)}> <X className="h-5 w-5" /><span className="sr-only">Tutup</span></Button>
              </SheetHeader>
              <div className="px-6 py-4 space-y-3 shrink-0 border-b">
                {selectedFileForPreview ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <img
                        src={getFileIcon(selectedFileForPreview.mimeType, false, (selectedFileForPreview as any).iconLink)}
                        alt={getFriendlyFileType(selectedFileForPreview.mimeType, false)}
                        className="h-8 w-8 flex-shrink-0"
                      />
                      <span className="font-semibold break-all text-base" title={selectedFileForPreview.filename ?? undefined}>
                        {selectedFileForPreview.filename}
                      </span>
                    </div>
                    {(selectedFileForPreview as ExistingFileInWorkspace).webViewLink && (
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="default" size="sm" asChild className="text-xs px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white">
                          <a href={(selectedFileForPreview as ExistingFileInWorkspace).webViewLink ?? undefined} target="_blank" rel="noopener noreferrer">
                            Buka di Drive
                          </a>
                        </Button>
                      </div>
                    )}
                    <Separator className="my-3"/>
                    <div className="space-y-1 text-sm">
                      <p><strong>Tipe:</strong> <span className="text-muted-foreground">{getFriendlyFileType(selectedFileForPreview.mimeType, false)}</span></p>
                      {(selectedFileForPreview as any).pathname && <p><strong>Info Lokasi:</strong> <span className="break-words text-muted-foreground">{(selectedFileForPreview as any).pathname}</span></p>}
                      {selectedFileForPreview.description && <p><strong>Deskripsi File:</strong> <span className="break-words whitespace-pre-wrap text-muted-foreground">{selectedFileForPreview.description}</span></p>}
                    </div>
                  </>
                ) : ( <div className="flex items-center justify-center h-20 text-muted-foreground"> Memuat detail... </div> )}
              </div>

              <div ref={pdfPreviewAreaRef} className="preview-content-area flex-1 min-h-0 flex flex-col bg-slate-100 dark:bg-slate-900">
                <div className="flex-1 min-h-0 overflow-hidden">
                  {selectedFileForPreview?.mimeType === 'application/pdf' ? (
                    <div className="flex-1 flex flex-col min-h-0 h-full">
                      {pdfLoading && ( <div className="flex-1 flex items-center justify-center text-muted-foreground p-4"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat PDF...</div> )}
                      {pdfError && ( <div className="flex-1 flex items-center justify-center text-destructive bg-red-50 dark:bg-red-900/30 p-4 text-center text-sm">Error: {pdfError}</div> )}
                      {pdfFile && !pdfLoading && !pdfError && (
                        <div ref={pdfContainerRef} className="react-pdf-scroll-container flex-1 overflow-auto bg-slate-200 dark:bg-slate-800">
                          <Document
                            file={pdfFile}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={(error) => setPdfError(`Gagal memuat PDF: ${error.message}. Coba buka di Drive.`)}
                            loading={null}
                            error={<div className="p-4 text-center text-destructive text-sm">Gagal memuat PDF dokumen. Coba buka di Drive.</div>}
                            className="flex flex-col items-center py-4 pdf-document"
                          >
                            {Array.from(new Array(numPages ?? 0), (el, index) => (
                              <div
                                key={`page_wrap_${index + 1}`}
                                ref={pageElement => { pageRefs.current[index] = pageElement; }}
                                data-page-number={index + 1}
                                className="relative mb-4 bg-white dark:bg-slate-800 shadow-lg"
                              >
                                <PdfPage
                                  pageNumber={index + 1}
                                  scale={pdfScale}
                                  width={pdfContainerWidth || undefined}
                                  renderTextLayer={true}
                                  renderAnnotationLayer={true}
                                  loading={<div className={`bg-slate-300 dark:bg-slate-700 animate-pulse mx-auto`} style={{height: pdfContainerWidth ? (pdfContainerWidth*1.414) : 800, width: pdfContainerWidth ? pdfContainerWidth -10 : 590}}></div>}
                                  error={<div className="my-2 p-2 text-destructive text-xs text-center">Gagal render hal {index + 1}.</div>}
                                  className="pdf-page-render"
                                />
                                <div className="absolute bottom-2 right-2 z-10">
                                  <span className="bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                    {index + 1} / {numPages}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </Document>
                        </div>
                      )}
                    </div>
                  ) : selectedFileForPreview && selectedFileForPreview.id ? (
                      <div className="flex-1 flex items-center justify-center p-1 h-full bg-slate-50 dark:bg-slate-800">
                        { (selectedFileForPreview.mimeType?.includes('google-apps') ||
                            selectedFileForPreview.mimeType?.includes('officedocument') ||
                            selectedFileForPreview.mimeType?.startsWith('text/'))
                            && !selectedFileForPreview.mimeType.includes('folder')
                            && (selectedFileForPreview as ExistingFileInWorkspace).webViewLink ? (
                          <iframe
                            src={(selectedFileForPreview as ExistingFileInWorkspace).webViewLink?.replace('/edit','/preview').replace('/pub','/embed') + '?embedded=true'}
                            className="w-full h-full border-0"
                            title={`Preview ${selectedFileForPreview.filename}`}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            loading="lazy"
                          ></iframe>
                        ) : selectedFileForPreview.mimeType?.startsWith('image/') && accessToken ? (
                          <div className="w-full h-full flex items-center justify-center p-2">
                              <img
                                  src={`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${selectedFileForPreview.id}?alt=media&access_token=${accessToken}`}
                                  style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}}
                                  alt={`Preview ${selectedFileForPreview.filename}`}
                                  onError={(e) => {
                                      (e.target as HTMLImageElement).style.display='none';
                                      setPdfError("Gagal memuat gambar preview. File mungkin tidak publik atau memerlukan izin khusus.");
                                  }}
                              />
                              {pdfError && <p className="text-sm text-destructive text-center p-4">{pdfError}</p>}
                          </div>
                          ) : (
                          <div className="flex flex-col items-center justify-center text-center p-6">
                              <FolderOpen size={48} className="text-muted-foreground mb-3"/>
                              <p className="text-sm text-muted-foreground italic">
                                  Preview tidak tersedia untuk tipe file ini ({getFriendlyFileType(selectedFileForPreview.mimeType, false)}).
                              </p>
                              {(selectedFileForPreview as ExistingFileInWorkspace).webViewLink &&
                                  <Button variant="link" asChild className="mt-2 text-sm">
                                      <a href={(selectedFileForPreview as ExistingFileInWorkspace).webViewLink!} target="_blank" rel="noopener noreferrer">Buka di Google Drive</a>
                                  </Button>
                              }
                          </div>
                        )}
                      </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      {isPreviewSheetOpen ? "Tidak ada file dipilih atau format tidak didukung." : "Memuat detail..."}
                    </div>
                  )}
                </div>

                {selectedFileForPreview?.mimeType === 'application/pdf' && pdfFile && !pdfLoading && !pdfError && numPages && numPages > 0 && (
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-700 shrink-0">
                    <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleZoomOut} disabled={pdfScale <= PDF_MIN_SCALE}><ZoomOut className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleResetZoom} disabled={pdfScale === 1.0}><RotateCcw className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleZoomIn} disabled={pdfScale >= PDF_MAX_SCALE}><ZoomIn className="h-4 w-4" /></Button>
                    <span className="text-xs font-medium text-muted-foreground w-10 text-center tabular-nums">{(pdfScale * 100).toFixed(0)}%</span>
                    <Separator orientation="vertical" className="h-5 mx-0.5 sm:mx-1.5" />
                    <Button variant="outline" size="sm" className="h-7 px-2 sm:h-8 sm:px-3 text-xs" onClick={goToPrevPage} disabled={pageNumber <= 1}>Prev</Button>
                    <span className="text-xs font-medium px-1 sm:px-2 min-w-[60px] text-center justify-center">
                      Hal <Input type="number" value={pageNumber} onChange={(e) => goToPage(parseInt(e.target.value))} min={1} max={numPages} className="inline-block w-10 h-6 p-1 text-center mx-1 text-xs border-border" disabled={!numPages || numPages <=0}/> / {numPages ?? '?'}
                    </span>
                    <Button variant="outline" size="sm" className="h-7 px-2 sm:h-8 sm:px-3 text-xs" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages}>Next</Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
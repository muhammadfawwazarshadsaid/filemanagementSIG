"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2, X, ZoomIn, ZoomOut, RotateCcw, RefreshCwIcon, Check, Edit, Send } from "lucide-react"; // Tambahkan ikon jika perlu
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser as useStackframeUserHook, useUser } from "@stackframe/stack";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

import {
  Approval,
  ApprovalFile,
  ApprovalUser,
  ProcessedApprovalRequest,
  IndividualApproverAction,
  OverallApprovalStatusKey,
  IndividualApprovalStatusKey
} from "@/components/approvals/schema";

import { columns as approvalsColumnsDefinition, ApprovalsTableMeta } from "@/components/approvals/columns";
import { ApprovalDataTable } from "@/components/approvals/datatable";

import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Schema as RecentFileSchema } from "@/components/recentfiles/schema";

try {
  const pdfjsVersion = pdfjs.version;
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
} catch (error) {
  console.error("Gagal mengkonfigurasi worker pdf.js via unpkg:", error);
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface AppSupabaseUser { id: string; displayname: string | null; primaryemail: string | null; is_admin: boolean | null; }

const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const PDF_MAX_SCALE = 3.0; const PDF_MIN_SCALE = 0.4; const PDF_SCALE_STEP = 0.2;

function getFileIcon(mimeType?: string | null, isFolder?: boolean, iconLink?: string | null): string {
  const effectiveMimeType = mimeType || '';
  const effectiveIsFolder = isFolder || false;
  if (effectiveIsFolder) return iconLink || '/folder.svg';
  if (iconLink && !effectiveMimeType.includes('google-apps')) return iconLink; // Gunakan iconLink jika ada dan bukan gDocs
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
  if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg'; // Biasanya tidak untuk approval file
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

// --- FUNGSI UNTUK MEMPROSES DATA APPROVAL ---
const processRawApprovals = (
  rawApprovalsData: Approval[],
  currentUserId?: string | null,
  // currentUserDisplayName?: string | null // Tidak lagi diperlukan di sini, nama "Anda" dihandle di UI jika perlu atau sudah di sini
): ProcessedApprovalRequest[] => {
  if (!rawApprovalsData || rawApprovalsData.length === 0) {
    return [];
  }

  const groupedByFile = rawApprovalsData.reduce((acc, approval) => {
    const fileId = approval.file_id_ref;
    if (!fileId) return acc;

    if (!acc[fileId]) {
      acc[fileId] = {
        id: fileId,
        fileIdRef: fileId,
        fileWorkspaceIdRef: approval.file_workspace_id_ref, // Ditambahkan
        fileUserIdRef: approval.file_user_id_ref,       // Ditambahkan
        file: approval.file ? { // Pastikan semua properti ApprovalFile ada
            id: approval.file.id,
            filename: approval.file.filename,
            description: approval.file.description,
            workspace_id: approval.file.workspace_id,
            user_id: approval.file.user_id,
            mimeType: approval.file.mimeType,
            iconLink: approval.file.iconLink,
        } : null,
        assigner: approval.assigner ? {
            id: approval.assigner.id,
            displayname: approval.assigner.id === currentUserId ? "Anda" : (approval.assigner.displayname || 'Pengaju N/A'),
            primaryemail: approval.assigner.primaryemail
        } : null,
        createdAt: approval.created_at,
        approverActions: [],
      };
    }

    acc[fileId].approverActions.push({
      individualApprovalId: approval.id, // ID unik dari record approval
      approverId: approval.approver_user_id,
      approverName: approval.approver_user_id === currentUserId ? "Anda" : (approval.approver?.displayname || 'Approver N/A'),
      approverEmail: approval.approver?.primaryemail || undefined,
      statusKey: getIndividualStatusKey(approval.status),
      statusDisplay: approval.status || "Tidak Diketahui",
      actioned_at: approval.actioned_at || null,
      remarks: approval.remarks || null,
    });

    // Pastikan created_at adalah yang paling awal jika ada beberapa entri untuk file yang sama (seharusnya tidak terjadi jika grouping benar)
    if (new Date(approval.created_at) < new Date(acc[fileId].createdAt)) {
      acc[fileId].createdAt = approval.created_at;
    }
    return acc;
  }, {} as Record<string, Omit<ProcessedApprovalRequest, 'overallStatus'>>);

  return Object.values(groupedByFile).map(group => {
    let overallStatus: OverallApprovalStatusKey = 'Belum Ada Tindakan';
    const actions = group.approverActions;

    if (actions.length > 0) {
      const hasRevision = actions.some(act => act.statusKey === 'revised');
      const hasRejected = actions.some(act => act.statusKey === 'rejected'); // Anda belum mendefinisikan 'rejected' di Overall, tapi penting untuk individu
      const allActioned = actions.every(act => act.statusKey !== 'pending' && act.statusKey !== 'unknown');
      const allApproved = actions.every(act => act.statusKey === 'approved');
      const anyPending = actions.some(act => act.statusKey === 'pending' || act.statusKey === 'unknown');

      if (hasRevision) {
        overallStatus = 'Perlu Revisi';
      } else if (hasRejected) { // Jika ada yang reject, keseluruhan ditolak (sesuaikan jika logika berbeda)
        overallStatus = 'Ditolak';
      } else if (allActioned && allApproved) {
        overallStatus = 'Sah';
      } else if (anyPending) {
        overallStatus = 'Menunggu Persetujuan';
      } else if (allActioned && !allApproved) {
        overallStatus = 'Menunggu Persetujuan'; // Atau 'Sebagian Disetujui' jika perlu status itu
      }
    }
    // Pastikan assigner.displayname juga "Anda" jika sesuai
    const finalAssigner = group.assigner;
    if (finalAssigner && finalAssigner.id === currentUserId && finalAssigner.displayname !== "Anda") {
        finalAssigner.displayname = "Anda";
    }

    return { ...group, assigner: finalAssigner, overallStatus } as ProcessedApprovalRequest;
  });
};
// --- END FUNGSI PEMROSESAN ---

export default function ApprovalsPage() {
  const router = useRouter();
  const appUser = useStackframeUserHook();
  const user = useUser();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppSupabaseUser | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [rawApprovals, setRawApprovals] = useState<Approval[]>([]);

  const [isFetchingApprovals, setIsFetchingApprovals] = useState(false);
  const [approvalsCurrentPage, setApprovalsCurrentPage] = useState(1);
  const [approvalsTotalPages, setApprovalsTotalPages] = useState(1);
  const [approvalsItemsPerPage, setApprovalsItemsPerPage] = useState(25);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string | null>("Semua Approval");

  const [approvalSearchTerm, setApprovalSearchTerm] = useState("");

  const [selectedFileForPreview, setSelectedFileForPreview] = useState<RecentFileSchema | null>(null);
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

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) setAccessToken(storedToken);
    else {
        toast.error("Sesi tidak valid.", { description: "Token tidak ditemukan." });
        user?.signOut();
        router.push('/masuk');
    }
  }, [router]);

  const makeApiCall = useCallback(async <T = any>(
    url: string, method: string = 'GET', body: any = null, customHeaders: Record<string, string> = {}
  ): Promise<T | null> => {
    if (!accessToken) {
      // toast.error("Akses token tidak tersedia untuk panggilan API."); // Sudah dihandle per panggilan
      return null;
    }
    const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...customHeaders };
    if (!(body instanceof FormData) && body && method !== 'GET') { defaultHeaders['Content-Type'] = 'application/json';}
    const options: RequestInit = { method, headers: defaultHeaders, body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined };
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        let errorData: any = {}; try { errorData = await response.json(); } catch (e) {}
        const errorMsg = errorData?.error?.message || errorData?.error || errorData?.details || response.statusText || `Error ${response.status}`;
        if (response.status === 401) {
          toast.error("Sesi berakhir.", { description: "Harap login kembali." });
          if(appUser?.signOut) await appUser.signOut(); router.push('/masuk'); return null;
        }
        throw new Error(errorMsg);
      }
      if (response.status === 204) return null;
      return response.json() as Promise<T>;
    } catch (err: any) {
      console.error(`API Call Error to ${url}:`, err);
      // toast.error("Gagal melakukan panggilan API.", { description: err.message }); // Dihandle per panggilan
      throw err; // Rethrow agar bisa ditangkap oleh pemanggil
    }
  }, [accessToken, router, appUser]);

  useEffect(() => {
    const fetchInitialUserData = async () => {
      setIsLoadingPage(true);
      if (appUser?.id && supabase) {
        try {
          const { data: userData, error: userError } = await supabase.from('user').select('id, displayname, primaryemail, is_admin').eq('id', appUser.id).single();
          if (userError) throw userError;
          setCurrentUser(userData as AppSupabaseUser);
        } catch (error: any) {
          toast.error("Gagal memuat data pengguna.", { description: error.message });
          setPageError(error.message);
        }
      }
      setIsLoadingPage(false);
    };
    if (accessToken) fetchInitialUserData();
    else if (!localStorage.getItem("accessToken")) setIsLoadingPage(false);
  }, [appUser?.id, accessToken]);


  const fetchApprovalsData = useCallback(async (
    page = 1,
    limit = approvalsItemsPerPage,
    workspaceId = activeWorkspaceId,
    searchTerm = approvalSearchTerm
  ) => {
    if (!accessToken || !currentUser) { // currentUser dibutuhkan untuk proses penggantian nama "Anda"
      setIsFetchingApprovals(false);
      return;
    }
    setIsFetchingApprovals(true);
    setPageError(null);
    try {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (searchTerm && searchTerm.trim() !== "") {
        params.append('search', searchTerm.trim());
      }

      const result = await makeApiCall<{ message: string; data: Approval[]; pagination: any }>(
        `/api/approvals/getall?${params.toString()}`
      );

      if (result?.data) {
        setRawApprovals(result.data);
        if (result.pagination) {
          setApprovalsCurrentPage(result.pagination.currentPage);
          setApprovalsTotalPages(result.pagination.totalPages);
          setApprovalsItemsPerPage(result.pagination.itemsPerPage);
        }
      } else if (result === null && !pageError) { // Hanya reset jika tidak ada error sebelumnya dari makeApiCall
        setRawApprovals([]);
        setApprovalsCurrentPage(1); setApprovalsTotalPages(1);
      }
    } catch (err: any) {
      toast.error("Gagal mengambil data approval.", { description: err.message });
      setPageError(err.message || "Terjadi kesalahan saat mengambil approval.");
      setRawApprovals([]); // Kosongkan data jika error
    } finally {
      setIsFetchingApprovals(false);
    }
  }, [accessToken, currentUser, makeApiCall, activeWorkspaceId, approvalSearchTerm, approvalsItemsPerPage, pageError]); // pageError ditambahkan

  const processedDataForTable = useMemo(() => {
    if (!currentUser?.id) return []; // Jangan proses jika user ID belum ada
    return processRawApprovals(rawApprovals, currentUser.id);
  }, [rawApprovals, currentUser?.id]); // currentUser.id ditambahkan

  useEffect(() => {
    if (accessToken && currentUser && !isLoadingPage) {
      fetchApprovalsData(1, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm);
      if(approvalsCurrentPage !== 1) setApprovalsCurrentPage(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, currentUser, isLoadingPage, activeWorkspaceId, approvalSearchTerm]); // fetchApprovalsData dihilangkan krn sudah jadi useCallback dg deps yg benar

  useEffect(() => {
    if (accessToken && currentUser && !isLoadingPage) {
      // Hanya fetch jika currentPage atau itemsPerPage berubah secara eksplisit (oleh user)
      // dan bukan merupakan fetch awal atau karena perubahan filter.
      // Ini untuk menghindari double fetch.
      // Namun, deps di sini akan memicu fetchApprovalsData setiap kali salah satunya berubah.
      // Logika fetchApprovalsData sendiri sudah menangani parameter ini.
      fetchApprovalsData(approvalsCurrentPage, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalsCurrentPage, approvalsItemsPerPage]);


  const handleWorkspaceUpdate = useCallback((wsId: string | null, wsName?: string | null) => {
    setActiveWorkspaceId(wsId);
    setActiveWorkspaceName(wsName || (wsId ? "Detail Workspace" : "Semua Approval"));
  }, []);

  const fetchPdfContent = useCallback(async (fileId: string) => { /* ... implementasi Anda ... */
    if (!accessToken || !fileId) return;
    setPdfLoading(true); setPdfError(null); setPdfFile(null); setNumPages(null); setPageNumber(1); setPdfScale(1.0);
    if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0;
    pageRefs.current = []; if (pageObserver.current) pageObserver.current.disconnect();

    const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${fileId}?alt=media`;
    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!response.ok) {
        let eMsg = `Gagal ambil PDF (${response.status})`;
        try { const eData = await response.json(); eMsg += `: ${eData?.error?.message || 'Unknown API error'}`; } catch (e) {}
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

  useEffect(() => { /* ... PDF Preview Logic Anda ... */
    let objectUrlToRevoke: string | null = null;
    if (selectedFileForPreview?.mimeType === 'application/pdf' && typeof selectedFileForPreview.id === 'string' && selectedFileForPreview.id.length > 0 && isPreviewSheetOpen) {
      if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) {
        objectUrlToRevoke = pdfFile;
        // URL.revokeObjectURL(pdfFile); // Jangan revoke di sini, tapi di cleanup atau sebelum fetch baru
        setPdfFile(null);
      }
      fetchPdfContent(selectedFileForPreview.id);
    } else {
      if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) {
        objectUrlToRevoke = pdfFile; // Tandai untuk di-revoke saat cleanup
      }
      setPdfFile(null); setPdfLoading(false); setPdfError(null); setNumPages(null); setPageNumber(1); setPdfScale(1.0);
      if (pageObserver.current) pageObserver.current.disconnect(); pageRefs.current = [];
    }
    return () => { if (objectUrlToRevoke) { URL.revokeObjectURL(objectUrlToRevoke); }};
  }, [selectedFileForPreview, isPreviewSheetOpen, fetchPdfContent]);


  function onDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }): void { /* ... implementasi Anda ... */
    setNumPages(loadedNumPages); setPageNumber(1); setPdfScale(1.0);
    if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0;
    pageRefs.current = Array(loadedNumPages).fill(null).map((_, i) => pageRefs.current[i] || React.createRef<HTMLDivElement>() as any);
    setTimeout(() => { if (pdfPreviewAreaRef.current) { const width = pdfPreviewAreaRef.current.offsetWidth; setPdfContainerWidth(width > 30 ? width - 20 : 580); } }, 100);
  }
  const handleZoomIn = () => setPdfScale(prev => Math.min(prev + PDF_SCALE_STEP, PDF_MAX_SCALE));
  const handleZoomOut = () => setPdfScale(prev => Math.max(prev - PDF_SCALE_STEP, PDF_MIN_SCALE));
  const handleResetZoom = () => { setPdfScale(1.0); if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0; };
  const goToPage = (targetPage: number) => { /* ... implementasi Anda ... */
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

  useEffect(() => { /* ... PDF Page Intersection Observer Anda ... */
    if (!pdfFile || !numPages || numPages <= 0 || !pdfContainerRef.current) { if(pageObserver.current) pageObserver.current.disconnect(); return; }
    const scrollContainer = pdfContainerRef.current;
    if(pageObserver.current) pageObserver.current.disconnect();

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
              if (topVisiblePage === -1 || pageNum < topVisiblePage) {
                topVisiblePage = pageNum;
              }
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
      pageRefs.current.forEach((pageEl) => { if (pageEl) { currentObserver.observe(pageEl as unknown as Element); } });
    }, 200);
    return () => { clearTimeout(timeoutId); if (currentObserver) currentObserver.disconnect(); };
  }, [pdfFile, numPages]);


  const memoizedApprovalsColumns = useMemo(() => approvalsColumnsDefinition(), []);

  const tableMeta = useMemo((): ApprovalsTableMeta => ({
    accessToken: accessToken,
    onActionComplete: () => fetchApprovalsData(approvalsCurrentPage, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm),
    supabase: supabase as SupabaseClient,
    userId: currentUser?.id ?? undefined,
    workspaceOrFolderId: activeWorkspaceId,
    onSelectFileForPreview: (fileToPreview) => {
      if (fileToPreview.mimeType === 'application/pdf' && fileToPreview.id) {
        setSelectedFileForPreview(fileToPreview);
      } else if (fileToPreview.id) {
        setSelectedFileForPreview(fileToPreview);
      }
      else {
        setSelectedFileForPreview(null);
        toast.info("Tipe file tidak didukung untuk preview ini atau ID file tidak valid.");
      }
    },
    onOpenPreviewSheet: () => {
      if (selectedFileForPreview && selectedFileForPreview.id) {
        setIsPreviewSheetOpen(true);
      } else {
        toast.info("Pilih file yang valid untuk ditampilkan detailnya.");
      }
    },
    makeApiCall: makeApiCall, // Teruskan makeApiCall ke meta
  }), [accessToken, approvalsCurrentPage, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm, currentUser?.id, fetchApprovalsData, selectedFileForPreview, makeApiCall]);


  if (isLoadingPage && !currentUser && !accessToken) {
    return <div className="flex h-screen items-center justify-center text-lg"><Loader2 className="h-8 w-8 animate-spin mr-3" /> Memuat Halaman Approval...</div>;
  }
  if (isLoadingPage && !currentUser && accessToken) { // Menunggu data currentUser dari Supabase
    return <div className="flex h-screen items-center justify-center text-lg"><Loader2 className="h-8 w-8 animate-spin mr-3" /> Memverifikasi pengguna...</div>;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <SidebarProvider>
        <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdate} />
        <SidebarInset>
          <header className="flex w-full shrink-0 items-center gap-2 h-12">
            {/* ... Header Anda ... */}
            <div className="flex w-full items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <div className="flex flex-col items-left justify-start">
                <h4 className="scroll-m-20 text-lg font-semibold tracking-tight truncate max-w-[calc(100vw-250px)]" title={activeWorkspaceName || "Daftar Approval"}>
                  {activeWorkspaceName ? `Approval: ${activeWorkspaceName}` : "Daftar Approval"}
                </h4>
              </div>
              <div className="flex-1" />
              <NavUser />
            </div>
          </header>

          <div className="flex-1 h-[calc(100vh-theme('space.12'))] overflow-y-auto">
            <div className="flex flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)] dark:bg-slate-900 min-h-full">

              {pageError && !isFetchingApprovals && (
                <div className="bg-destructive/10 border-destructive text-destructive-foreground p-3 rounded-md" role="alert">
                  <p className="font-bold">Terjadi Kesalahan</p>
                  <p className="text-sm">{pageError}</p>
                  <Button variant="ghost" size="sm" onClick={() => { setPageError(null); fetchApprovalsData(1, approvalsItemsPerPage, activeWorkspaceId, approvalSearchTerm);}} className="mt-2 text-xs">Coba Lagi</Button>
                </div>
              )}

              <div className="bg-card p-4 sm:p-6 rounded-lg">
                <div>
                  <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">
                    Daftar Persetujuan {activeWorkspaceName && activeWorkspaceName !== "Semua Approval" ? `untuk ${activeWorkspaceName}` : ''}
                  </h2>
                  <p className="text-xs text-muted-foreground pb-4">
                    Kelola semua permintaan persetujuan. Status keseluruhan dihitung berdasarkan tindakan semua approver.
                  </p>
                </div>
                {isLoadingPage && !currentUser ? ( // Kondisi saat data user belum ada tapi token ada
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin mr-3" /> Memuat data pengguna dan approval...
                  </div>
                ) : !currentUser && !accessToken && !isLoadingPage ? ( // Kondisi jika tidak ada sesi
                  <div className="flex items-center justify-center h-64">
                    <p>Sesi tidak valid. Silakan masuk kembali.</p>
                  </div>
                ) : (
                  <ApprovalDataTable
                    columns={memoizedApprovalsColumns}
                    data={processedDataForTable} // Ini sudah di-memoized
                    isLoading={isLoadingPage || (isFetchingApprovals && processedDataForTable.length === 0 && rawApprovals.length === 0 && !pageError)}
                    isRefreshing={isFetchingApprovals}
                    onRefresh={() => {
                      setApprovalSearchTerm("");
                      setApprovalsCurrentPage(1);
                      fetchApprovalsData(1, approvalsItemsPerPage, activeWorkspaceId, "");
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

          <Sheet open={isPreviewSheetOpen} onOpenChange={setIsPreviewSheetOpen}>
            {/* ... Sheet Content Anda ... */}
            <SheetContent side="right" className="w-full sm:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[1000px] flex flex-col p-0 h-screen overflow-hidden">
              <SheetHeader className="px-6 pt-6 pb-4 relative shrink-0">
                <SheetTitle>{selectedFileForPreview?.filename || "Detail File"}</SheetTitle>
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 rounded-full" onClick={() => setIsPreviewSheetOpen(false)}> <X className="h-5 w-5" /><span className="sr-only">Tutup</span></Button>
              </SheetHeader>
              <div className="px-6 py-5 space-y-4 shrink-0">
                {selectedFileForPreview ? ( <> <div className="flex items-center space-x-3"> <img src={getFileIcon(selectedFileForPreview.mimeType, false, selectedFileForPreview.iconLink)} alt={getFriendlyFileType(selectedFileForPreview.mimeType, false)} className="h-9 w-9 flex-shrink-0" /> <span className="font-semibold break-all text-base" title={selectedFileForPreview.filename}>{selectedFileForPreview.filename}</span> </div> {selectedFileForPreview.id && (<div className="flex gap-2 flex-wrap"> <Button variant="default" size="sm" asChild className="text-xs px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white"><a href={`https://drive.google.com/file/d/${selectedFileForPreview.id}/view?usp=sharing`} target="_blank" rel="noopener noreferrer">Buka di Drive</a></Button> </div> )} <Separator /> <div className="space-y-1 text-sm text-gray-800 dark:text-gray-300"> <p><strong>Tipe:</strong> <span className="text-muted-foreground">{getFriendlyFileType(selectedFileForPreview.mimeType, false)}</span></p> {selectedFileForPreview.pathname && <p><strong>Info Lokasi:</strong> <span className="break-words text-muted-foreground">{selectedFileForPreview.pathname}</span></p>} {selectedFileForPreview.description && <p><strong>Deskripsi File:</strong> <span className="break-words whitespace-pre-wrap text-muted-foreground">{selectedFileForPreview.description}</span></p>} </div> </> ) : ( <div className="flex items-center justify-center h-20 text-muted-foreground"> Memuat detail... </div> )}
              </div>
              <div ref={pdfPreviewAreaRef} className="preview-content-area flex-1 min-h-0 flex flex-col bg-slate-200 dark:bg-slate-800">
                <div className="flex-1 min-h-0 overflow-hidden">
                  {selectedFileForPreview?.mimeType === 'application/pdf' ? ( <div className="flex-1 flex flex-col min-h-0 h-full"> {pdfLoading && ( <div className="flex-1 flex items-center justify-center text-muted-foreground p-4"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat PDF...</div> )} {pdfError && ( <div className="flex-1 flex items-center justify-center text-destructive bg-red-50 dark:bg-red-900/30 p-4 text-center text-sm">Error: {pdfError}</div> )} {pdfFile && !pdfLoading && !pdfError && ( <div ref={pdfContainerRef} className="react-pdf-scroll-container flex-1 overflow-auto bg-slate-300 dark:bg-slate-700"> <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess} onLoadError={(error) => setPdfError(`Gagal memuat PDF: ${error.message}`)} loading={null} error={<div className="p-4 text-center text-destructive text-sm">Gagal memuat PDF dokumen.</div>} className="flex flex-col items-center py-4 pdf-document" > {Array.from(new Array(numPages ?? 0), (el, index) => ( <div key={`page_wrap_${index + 1}`} ref={(el) => { pageRefs.current[index] = el as HTMLDivElement | null; }} data-page-number={index + 1} className="relative mb-4 bg-white dark:bg-slate-800" > <PdfPage pageNumber={index + 1} scale={pdfScale} width={pdfContainerWidth || undefined} renderTextLayer={true} renderAnnotationLayer={true} loading={<div className={`bg-slate-200 dark:bg-slate-700 animate-pulse mx-auto`} style={{height: pdfContainerWidth ? (pdfContainerWidth*1.414) : 800, width: pdfContainerWidth ?? 'auto'}}></div>} error={<div className="my-2 p-2 text-destructive text-xs text-center">Gagal load hal {index + 1}.</div>} className="pdf-page-render" /> <div className="absolute bottom-2 right-2 z-10"> <span className="bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded-sm"> {index + 1} </span> </div> </div> ))} </Document> </div> )} </div> )
                  : selectedFileForPreview && selectedFileForPreview.id ? ( <div className="flex-1 flex items-center justify-center p-4 h-full"> { (selectedFileForPreview.mimeType?.includes('google-apps') || selectedFileForPreview.mimeType?.includes('officedocument')) && !selectedFileForPreview.mimeType.includes('folder') ? ( <iframe src={`https://docs.google.com/gview?url=https://drive.google.com/uc?id=${selectedFileForPreview.id}&embedded=true`} className="w-full h-full " title={`Preview ${selectedFileForPreview.filename}`} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" loading="lazy"></iframe> ) : selectedFileForPreview.mimeType?.startsWith('image/') && accessToken ? ( <div className="w-full h-full flex items-center justify-center p-2"><img src={`${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${selectedFileForPreview.id}?alt=media&access_token=${accessToken}`} style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}} alt={`Preview ${selectedFileForPreview.filename}`} onError={(e) => { (e.target as HTMLImageElement).src=''; (e.target as HTMLImageElement).alt='Gagal memuat gambar'; toast.error("Gagal memuat gambar preview.");}} /></div> ) : ( <p className="text-sm text-muted-foreground italic">Preview tidak tersedia untuk tipe file ini.</p> )} </div> )
                  : ( <div className="flex-1 flex items-center justify-center text-muted-foreground"> {isPreviewSheetOpen ? "Tidak ada file dipilih atau format tidak didukung." : "Memuat detail..."} </div> )}
                </div>
                {selectedFileForPreview?.mimeType === 'application/pdf' && pdfFile && !pdfLoading && !pdfError && numPages && numPages > 0 && ( <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shrink-0"> <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={pdfScale <= PDF_MIN_SCALE}><ZoomOut className="h-4 w-4" /></Button> <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetZoom} disabled={pdfScale === 1.0}><RotateCcw className="h-4 w-4" /></Button> <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={pdfScale >= PDF_MAX_SCALE}><ZoomIn className="h-4 w-4" /></Button> <span className="text-xs font-medium text-muted-foreground w-12 text-center tabular-nums">{(pdfScale * 100).toFixed(0)}%</span> <Separator orientation="vertical" className="h-5 mx-1 sm:mx-2" /> <Button variant="outline" size="sm" className="h-8 px-3" onClick={goToPrevPage} disabled={pageNumber <= 1}>Prev</Button> <span className="text-xs font-medium px-2 min-w-[70px] text-center justify-center"> Hal {pageNumber} / {numPages ?? '?'} </span> <Button variant="outline" size="sm" className="h-8 px-3" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages}>Next</Button> </div> )}
              </div>
            </SheetContent>
          </Sheet>

        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
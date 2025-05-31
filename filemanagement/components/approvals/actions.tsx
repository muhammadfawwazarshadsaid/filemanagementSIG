// components/approvals/actions.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { Row } from "@tanstack/react-table";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  FileText as FileTextIcon,
  Edit3,
  MessageSquareWarning,
  Send,
  Info,
  ShieldAlert,
  History,
  Loader2,
  PenTool,
  X as XIcon,
  ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Save,
  UploadCloud,
  MinusCircle,
  PlusCircle,
  Maximize,
  Download,
  FileUp,
  Eye // <-- Pastikan ikon Eye diimpor
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import { ProcessedApprovalRequest, ApprovalFile } from "./schema";
import { ApprovalsTableMeta } from "./columns";

import SignatureCanvas from 'react-signature-canvas';
import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// --- TAMBAHKAN IMPOR useRouter ---
import { useRouter } from "next/navigation";

try {
  const pdfjsVersion = pdfjs.version;
  if (pdfjsVersion) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  } else {
    console.warn("Versi pdfjs tidak terdeteksi, menggunakan fallback worker URL.");
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
} catch (error) {
  console.error("Gagal mengkonfigurasi worker pdf.js via unpkg:", error);
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
}

const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const PDF_MAX_SCALE_SIGN = 2.0; const PDF_MIN_SCALE_SIGN = 0.5; const PDF_SCALE_STEP_SIGN = 0.1;
const SIGNATURE_DEFAULT_BASE_WIDTH_PX = 120;
const SIGNATURE_DEFAULT_ASPECT_RATIO = 2/1;
const SIGNATURE_MIN_SCALE_FACTOR = 0.5;
const SIGNATURE_MAX_SCALE_FACTOR = 1.5;
const SIGNATURE_SCALE_FACTOR_STEP = 0.1;
const ALLOWED_SIGNATURE_IMPORT_TYPES = ['image/png', 'image/jpeg'];
const MAX_SIGNATURE_IMPORT_SIZE_MB = 1;


interface ProcessedApprovalActionsProps {
  row: Row<ProcessedApprovalRequest>;
  meta?: ApprovalsTableMeta;
}

export function ProcessedApprovalDataTableRowActions({ row, meta }: ProcessedApprovalActionsProps) {
  const approvalRequest = row.original;
  const currentUserId = meta?.userId;
  const router = useRouter(); // <-- Inisialisasi useRouter

  useEffect(() => {
    console.log("[Actions.tsx] Approval Request Data for this row:", JSON.stringify(approvalRequest, null, 2));
    console.log("[Actions.tsx] Current User ID:", currentUserId);
    const relevantApproverAction = approvalRequest.approverActions.find(action => action.approverId === currentUserId);
    console.log("[Actions.tsx] Relevant Approver Action for current user:", JSON.stringify(relevantApproverAction, null, 2));
  }, [approvalRequest, currentUserId]);


  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState("");
  const [showResubmitDialog, setShowResubmitDialog] = useState(false);
  const [newRevisionFile, setNewRevisionFile] = useState<File | null>(null);
  const [showViewMyActionDialog, setShowViewMyActionDialog] = useState(false);
  const [showUniversalLoadingModal, setShowUniversalLoadingModal] = useState(false);
  const [universalLoadingMessage, setUniversalLoadingMessage] = useState("Sedang memproses...");
  const [showUpdateDocDialog, setShowUpdateDocDialog] = useState(false);
  const [updateDocFile, setUpdateDocFile] = useState<File | null>(null);

  const [showSigningModal, setShowSigningModal] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState<{ pageIndex: number; xPercent: number; yPercent: number; pageWidthSnapshot: number; pageHeightSnapshot: number;} | null>(null);
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const pdfSignContainerRef = useRef<HTMLDivElement>(null);
  const pdfSignPageRenderRef = useRef<HTMLDivElement>(null);
  const [pdfSignFile, setPdfSignFile] = useState<string | null>(null);
  const [pdfSignLoading, setPdfSignLoading] = useState<boolean>(false);
  const [pdfSignError, setPdfSignError] = useState<string | null>(null);
  const [numSignPages, setNumSignPages] = useState<number | null>(null);
  const [currentSignPage, setCurrentSignPage] = useState(1);
  const [pdfSignScale, setPdfSignScale] = useState(1.0);
  const [placedSignatureDataUrl, setPlacedSignatureDataUrl] = useState<string | null>(null);
  const [signaturePreviewStyle, setSignaturePreviewStyle] = useState<React.CSSProperties | null>(null);
  const [signatureScaleFactor, setSignatureScaleFactor] = useState(1.0);
  const signatureWrapperRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 300, height: 150 });
  const [importedSignatureUrl, setImportedSignatureUrl] = useState<string | null>(null);
  const signatureImportInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (showSigningModal && signatureWrapperRef.current) {
        const parent = signatureWrapperRef.current;
        const setDim = () => {
            if (parent.offsetWidth > 0 && parent.offsetHeight > 0) {
                const newWidth = Math.max(10, parent.offsetWidth - 2);
                const newHeight = Math.max(10, parent.offsetHeight - 2);
                setCanvasDimensions({ width: newWidth, height: newHeight });
            }
        };
        const timeoutId = setTimeout(setDim, 50);
        const resizeObserver = new ResizeObserver(setDim);
        resizeObserver.observe(parent);
        setDim();
        return () => { clearTimeout(timeoutId); resizeObserver.disconnect(); };
    }
  }, [showSigningModal]);

  useEffect(() => {
    if (showSigningModal && signaturePosition && placedSignatureDataUrl && pdfSignPageRenderRef.current && currentSignPage - 1 === signaturePosition.pageIndex) {
        const pageWrapperElement = pdfSignPageRenderRef.current;
        const renderedPageWidth = pageWrapperElement.offsetWidth;
        const renderedPageHeight = pageWrapperElement.offsetHeight;
        if (renderedPageWidth > 0 && renderedPageHeight > 0) {
            const signatureBaseWidthOnPdf = SIGNATURE_DEFAULT_BASE_WIDTH_PX;
            const signatureBaseHeightOnPdf = signatureBaseWidthOnPdf / SIGNATURE_DEFAULT_ASPECT_RATIO;
            const sigDisplayWidth = signatureBaseWidthOnPdf * signatureScaleFactor * pdfSignScale;
            const sigDisplayHeight = signatureBaseHeightOnPdf * signatureScaleFactor * pdfSignScale;
            const newXpx = (signaturePosition.xPercent / 100) * renderedPageWidth - (sigDisplayWidth / 2);
            const newYpx = (signaturePosition.yPercent / 100) * renderedPageHeight - (sigDisplayHeight / 2);
            setSignaturePreviewStyle({
                position: 'absolute', left: `${newXpx}px`, top: `${newYpx}px`,
                width: `${sigDisplayWidth}px`, height: `${sigDisplayHeight}px`,
                border: '1px dashed rgba(0,0,255,0.7)', pointerEvents: 'none', opacity: 0.7,
                backgroundImage: `url(${placedSignatureDataUrl})`, backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
            });
        } else { setSignaturePreviewStyle(null); }
    } else { setSignaturePreviewStyle(null); }
  }, [showSigningModal, signaturePosition, placedSignatureDataUrl, pdfSignScale, signatureScaleFactor, currentSignPage]);

  const fetchPdfForSigning = useCallback(async (fileId: string) => {
    if (!meta?.accessToken || !fileId) { toast.error("Informasi tidak lengkap untuk memuat PDF tanda tangan."); return; }
    setPdfSignLoading(true); setPdfSignError(null); setPdfSignFile(null);
    setNumSignPages(null); setCurrentSignPage(1); setPdfSignScale(1.0);
    setSignaturePosition(null); setPlacedSignatureDataUrl(null);
    setSignaturePreviewStyle(null); setSignatureScaleFactor(1.0);
    setImportedSignatureUrl(null);
    if (signatureImportInputRef.current) signatureImportInputRef.current.value = "";
    signaturePadRef.current?.clear();
    const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${fileId}?alt=media`;
    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${meta.accessToken}` } });
      if (!response.ok) {
        let eMsg = `Gagal ambil PDF (${response.status})`;
        try { const eData = await response.json(); eMsg += `: ${eData?.error?.message || 'Error API'}`; } catch (e) {/* ignore */}
        throw new Error(eMsg);
      }
      const blob = await response.blob();
      if (blob.type !== 'application/pdf') { throw new Error("File bukan PDF."); }
      const objectUrl = URL.createObjectURL(blob);
      setPdfSignFile(objectUrl);
    } catch (err: any) {
      setPdfSignError(err.message || "Gagal memuat PDF.");
      setPdfSignFile(null); setShowSigningModal(false);
      toast.error("Gagal Memuat PDF", { description: err.message });
    } finally { setPdfSignLoading(false); }
  }, [meta?.accessToken]);

  const currentUserAsApproverAction = approvalRequest.approverActions.find(action => action.approverId === currentUserId);
  const isCurrentUserAnApprover = !!currentUserAsApproverAction;
  const canCurrentUserPerformInitialAction = currentUserAsApproverAction && (currentUserAsApproverAction.statusKey === 'pending' || currentUserAsApproverAction.statusKey === 'unknown');
  const hasCurrentUserActioned = currentUserAsApproverAction && (currentUserAsApproverAction.statusKey === 'approved' || currentUserAsApproverAction.statusKey === 'revised' || currentUserAsApproverAction.statusKey === 'rejected');
  const isCurrentUserAssigner = approvalRequest.assigner?.id === currentUserId;
  const canAssignerSubmitRevision = isCurrentUserAssigner && approvalRequest.overallStatus === 'Perlu Revisi';
  const canAssignerUpdateDocAndReapprove = isCurrentUserAssigner &&
    (approvalRequest.overallStatus === 'Menunggu Persetujuan' ||
     approvalRequest.overallStatus === 'Belum Ada Tindakan' ||
     approvalRequest.overallStatus === 'Sah');

  const handleOpenSignModal = () => {
    if (!approvalRequest.file?.id) { toast.error("File tidak valid untuk ditandatangani."); return; }
    if (approvalRequest.file.mimeType !== 'application/pdf') { toast.error("Hanya PDF yang bisa ditandatangani digital."); return; }
    fetchPdfForSigning(approvalRequest.file.id);
    setShowSigningModal(true);
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    setPlacedSignatureDataUrl(null); setSignaturePosition(null);
    setSignaturePreviewStyle(null); setImportedSignatureUrl(null);
    if (signatureImportInputRef.current) signatureImportInputRef.current.value = "";
  };
  const handleDownloadSignature = () => {
    if (placedSignatureDataUrl) {
        const link = document.createElement('a'); link.href = placedSignatureDataUrl;
        link.download = 'tanda-tangan.png'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link);
        toast.success("TTD aktif diunduh.");
    } else { toast.error("Tidak ada TTD aktif."); }
  };
  const handleImportSignatureClick = () => { signatureImportInputRef.current?.click(); };
  const handleSignatureFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!ALLOWED_SIGNATURE_IMPORT_TYPES.includes(file.type)) {
            toast.error(`Tipe file tidak valid. Pilih ${ALLOWED_SIGNATURE_IMPORT_TYPES.join('/')}.`);
            if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; return;
        }
        if (file.size > MAX_SIGNATURE_IMPORT_SIZE_MB * 1024 * 1024) {
            toast.error(`Ukuran file maks ${MAX_SIGNATURE_IMPORT_SIZE_MB}MB.`);
            if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setImportedSignatureUrl(dataUrl); setPlacedSignatureDataUrl(dataUrl);
            signaturePadRef.current?.clear();
            toast.success("TTD diimpor.");
        };
        reader.onerror = () => toast.error("Gagal baca file TTD.");
        reader.readAsDataURL(file);
    }
    if (signatureImportInputRef.current) signatureImportInputRef.current.value = "";
  };

  const handlePdfPageClick = (event: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    if (isActionLoading) return;
    let activeSignatureForPdf = placedSignatureDataUrl;
    if (!activeSignatureForPdf && signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      activeSignatureForPdf = signaturePadRef.current.toDataURL('image/png');
      setPlacedSignatureDataUrl(activeSignatureForPdf); setImportedSignatureUrl(null);
      if (signatureImportInputRef.current) signatureImportInputRef.current.value = "";
    }
    if (!activeSignatureForPdf) { toast.info("Tidak ada TTD aktif. Gambar/Impor dulu."); return; }
    const pageWrapperElement = event.currentTarget;
    if (pageWrapperElement?.offsetParent) {
      const rect = pageWrapperElement.getBoundingClientRect();
      const clickXInWrapper = event.clientX - rect.left;
      const clickYInWrapper = event.clientY - rect.top;
      const renderedWidth = pageWrapperElement.offsetWidth;
      const renderedHeight = pageWrapperElement.offsetHeight;
      if (renderedWidth === 0 || renderedHeight === 0) { toast.info("Dimensi PDF tidak terdeteksi."); return; }
      const xPercent = (clickXInWrapper / renderedWidth) * 100;
      const yPercent = (clickYInWrapper / renderedHeight) * 100;
      const naturalPageWidthSnapshot = renderedWidth / pdfSignScale;
      const naturalPageHeightSnapshot = renderedHeight / pdfSignScale;
      setSignaturePosition({
        pageIndex: pageIndex,
        xPercent: Math.max(0, Math.min(100, xPercent)),
        yPercent: Math.max(0, Math.min(100, yPercent)),
        pageWidthSnapshot: naturalPageWidthSnapshot,
        pageHeightSnapshot: naturalPageHeightSnapshot,
      });
      toast.success(`TTD akan ditempatkan di halaman ${pageIndex + 1}.`);
    }
  };

  const handleFinalizeSignatureAndApprove = async () => {
    console.log("[Actions.tsx] handleFinalizeSignatureAndApprove called.");
    console.log("[Actions.tsx] currentUserAsApproverAction:", JSON.stringify(currentUserAsApproverAction, null, 2));
    console.log("[Actions.tsx] approvalRequest.file:", JSON.stringify(approvalRequest.file, null, 2));
    console.log("[Actions.tsx] approvalRequest.sharedApprovalProcessCuid:", approvalRequest.sharedApprovalProcessCuid);
    console.log("[Actions.tsx] currentUserId:", currentUserId);

    if (!currentUserAsApproverAction || !meta?.makeApiCall || !currentUserId) {
        toast.error("Info pengguna tidak lengkap untuk menandatangani.");
        console.error("[Actions.tsx] Validation failed: User/meta info missing.");
        return;
    }
    if (!approvalRequest.file || !approvalRequest.file.id || !approvalRequest.fileWorkspaceIdRef || !approvalRequest.fileUserIdRef) {
        toast.error("Informasi file tidak lengkap untuk proses penandatanganan.");
        console.error("[Actions.tsx] Validation failed: File info missing.", approvalRequest.file);
        return;
    }
    if (!placedSignatureDataUrl) { toast.error("Tanda tangan belum dibuat atau diimpor."); return; }
    if (!signaturePosition) { toast.error("Posisi tanda tangan belum ditentukan pada PDF."); return; }

    setIsActionLoading(true);
    setUniversalLoadingMessage("Memproses penandatanganan...");
    setShowUniversalLoadingModal(true);

    const apiUrl = `/api/approvals/sign-and-approve`;
    const payload = {
      originalFileId: approvalRequest.file.id,
      originalFileWorkspaceIdRef: approvalRequest.fileWorkspaceIdRef,
      originalFileUserIdRef: approvalRequest.fileUserIdRef,
      signatureImageBase64: placedSignatureDataUrl,
      signaturePlacement: { ...signaturePosition, scaleFactor: signatureScaleFactor },
      sharedApprovalProcessCuid: approvalRequest.sharedApprovalProcessCuid,
      actioned_by_user_id: currentUserId,
    };

    console.log("[Actions.tsx] Payload to /api/approvals/sign-and-approve:", JSON.stringify(payload, null, 2));

    try {
        const res = await meta.makeApiCall(apiUrl, 'POST', payload);
        if (res === undefined || res === null) {
             throw new Error("Respons server tidak terduga atau kosong.");
        }
        toast.success((res as any)?.message || "Dokumen berhasil ditandatangani dan disahkan.");
        setShowSigningModal(false);
        meta.onActionComplete?.();
        clearSignature();
        if (pdfSignFile?.startsWith('blob:')) URL.revokeObjectURL(pdfSignFile);
        setPdfSignFile(null);
        setShowViewMyActionDialog(true);
    } catch (err: any) {
        console.error("[Actions.tsx] Error finalize signature:", err);
        toast.error(err.message || "Gagal memproses penandatanganan.");
    } finally {
        setIsActionLoading(false);
        setShowUniversalLoadingModal(false);
    }
  };

  const submitRevisionRequest = async () => {
    console.log("[Actions.tsx] submitRevisionRequest called.");
    console.log("[Actions.tsx] currentUserAsApproverAction:", JSON.stringify(currentUserAsApproverAction, null, 2));
    console.log("[Actions.tsx] approvalRequest.sharedApprovalProcessCuid:", approvalRequest.sharedApprovalProcessCuid);

    if (!currentUserAsApproverAction || !meta?.makeApiCall || !currentUserId || !revisionRemarks.trim()) {
      toast.error("Catatan revisi wajib diisi atau info pengguna tidak lengkap.");
      console.error("[Actions.tsx] Validation failed for revision request.");
      return;
    }
    setIsActionLoading(true);
    setUniversalLoadingMessage("Mengirim permintaan revisi...");
    setShowUniversalLoadingModal(true);

    const apiUrl = `/api/approvals/updatestatus`;
    const payload = {
        sharedApprovalProcessCuid: approvalRequest.sharedApprovalProcessCuid,
        approverUserId: currentUserAsApproverAction.approverId,
        status: "Perlu Revisi",
        remarks: revisionRemarks,
    };
    console.log("[Actions.tsx] Payload to /api/approvals/updatestatus (revisi):", JSON.stringify(payload, null, 2));

    try {
        const res = await meta.makeApiCall(apiUrl, 'PUT', payload);
        if (res === undefined || res === null) {
            throw new Error("Respons server tidak terduga atau kosong.");
        }
        toast.success((res as any)?.message || "Permintaan revisi berhasil dikirim.");
        setShowRevisionDialog(false);
        meta.onActionComplete?.();
        setRevisionRemarks("");
        setShowViewMyActionDialog(true);
    } catch (err: any) {
        console.error("[Actions.tsx] Error submit revision:", err);
        toast.error(err.message || "Gagal mengirim permintaan revisi.");
    } finally {
        setIsActionLoading(false);
        setShowUniversalLoadingModal(false);
    }
  };

  const submitResubmissionForRevision = async () => {
    if (!meta?.makeApiCall || !currentUserId) { toast.error("Info pengguna tidak lengkap."); return; }
    if (!approvalRequest.fileIdRef || !approvalRequest.fileWorkspaceIdRef || !approvalRequest.sharedApprovalProcessCuid) {
      toast.error("Info file/proses approval tidak lengkap."); console.error("Missing IDs for resubmission (revision):", approvalRequest); return;
    }

    setIsActionLoading(true); setShowResubmitDialog(false);
    setUniversalLoadingMessage("Mengirim ulang approval...");
    setShowUniversalLoadingModal(true);

    const formData = new FormData();
    formData.append('old_file_id_ref', approvalRequest.fileIdRef);
    formData.append('old_file_workspace_id_ref', approvalRequest.fileWorkspaceIdRef);
    formData.append('approval_process_id', approvalRequest.sharedApprovalProcessCuid);
    formData.append('requested_by_user_id', currentUserId);
    if (newRevisionFile) {
        formData.append('new_file', newRevisionFile, newRevisionFile.name);
    } else {
        formData.append('new_revision_notes', "Dokumen diajukan ulang untuk persetujuan.");
    }

    const apiUrl = `/api/approvals/resubmit-with-new-file`;
    const promise = meta.makeApiCall(apiUrl, 'POST', formData).then(res => { if (res === undefined) throw new Error("Respons server tidak terduga."); return res; });

    toast.promise(promise, {
      loading: "Memproses...",
      success: (res: any) => { meta.onActionComplete?.(); setNewRevisionFile(null); return res?.message || "Approval berhasil disubmit ulang."; },
      error: (err) => err.message || "Gagal submit ulang approval.",
      finally: () => { setIsActionLoading(false); setShowUniversalLoadingModal(false); }
    });
  };

  const handleOpenUpdateDocDialog = () => {
    if (!canAssignerUpdateDocAndReapprove) { toast.warning("Aksi tidak diizinkan."); return; }
    setUpdateDocFile(null);
    setShowUpdateDocDialog(true);
  };

  const submitUpdateDocAndReapprove = async () => {
    if (!meta?.makeApiCall || !currentUserId) { toast.error("Info pengguna tidak lengkap."); return; }
    if (!approvalRequest.fileIdRef || !approvalRequest.fileWorkspaceIdRef || !approvalRequest.fileUserIdRef || !approvalRequest.sharedApprovalProcessCuid) {
      toast.error("Informasi pengajuan tidak lengkap."); console.error("Missing critical IDs for updateDoc & re-approve:", approvalRequest); return;
    }
    if (!updateDocFile) { toast.error("File dokumen baru wajib diunggah."); return; }
    const originalApproverIds = approvalRequest.approverActions.map(a => a.approverId);
    if (originalApproverIds.length === 0) { toast.error("Tidak ada approver asli."); return; }

    setIsActionLoading(true); setShowUpdateDocDialog(false);
    setUniversalLoadingMessage("Memperbarui dokumen dan mengirim ulang persetujuan...");
    setShowUniversalLoadingModal(true);

    const jsonDataPayload = {
      currentApprovalProcessCuidToCancel: approvalRequest.sharedApprovalProcessCuid,
      fileIdRef: approvalRequest.fileIdRef,
      fileWorkspaceIdRef: approvalRequest.fileWorkspaceIdRef,
      fileUserIdRef: approvalRequest.fileUserIdRef,
      assignerUserId: currentUserId,
      approverUserIds: originalApproverIds,
    };
    const formData = new FormData();
    formData.append('jsonData', JSON.stringify(jsonDataPayload));
    formData.append('newDocumentFile', updateDocFile, updateDocFile.name);

    const apiUrl = `/api/approvals/update-document-and-reapprove`;
    const promise = meta.makeApiCall(apiUrl, 'POST', formData).then(res => { if (res === undefined) throw new Error("Respons server tidak terduga."); return res; });

    toast.promise(promise, {
      loading: "Memproses...",
      success: (res: any) => { meta.onActionComplete?.(); setUpdateDocFile(null); return res?.message || "Dokumen diperbarui & persetujuan ulang dikirim."; },
      error: (err) => err.message || "Gagal memperbarui dokumen & meminta persetujuan ulang.",
      finally: () => { setIsActionLoading(false); setShowUniversalLoadingModal(false); }
    });
  };

  function onSignDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }): void {
    setNumSignPages(loadedNumPages); setCurrentSignPage(1); setPdfSignScale(1.0);
    if(pdfSignContainerRef.current) pdfSignContainerRef.current.scrollTop = 0;
    clearSignature();
  }
  const handleSignZoomIn = () => setPdfSignScale(prev => Math.min(prev + PDF_SCALE_STEP_SIGN, PDF_MAX_SCALE_SIGN));
  const handleSignZoomOut = () => setPdfSignScale(prev => Math.max(prev - PDF_SCALE_STEP_SIGN, PDF_MIN_SCALE_SIGN));
  const handleSignResetZoom = () => { setPdfSignScale(1.0); if(pdfSignContainerRef.current) pdfSignContainerRef.current.scrollTop = 0;};
  const goToSignPrevPage = () => { setSignaturePosition(null); setSignaturePreviewStyle(null); setCurrentSignPage(prev => Math.max(1, prev - 1)); };
  const goToSignNextPage = () => { setSignaturePosition(null); setSignaturePreviewStyle(null); setCurrentSignPage(prev => Math.min(numSignPages || prev, prev + 1)); };
  const handleDecreaseSignatureSize = () => setSignatureScaleFactor(prev => Math.max(SIGNATURE_MIN_SCALE_FACTOR, parseFloat((prev - SIGNATURE_SCALE_FACTOR_STEP).toFixed(2)) ));
  const handleIncreaseSignatureSize = () => setSignatureScaleFactor(prev => Math.min(SIGNATURE_MAX_SCALE_FACTOR, parseFloat((prev + SIGNATURE_SCALE_FACTOR_STEP).toFixed(2)) ));
  const handleResetSignatureSize = () => setSignatureScaleFactor(1.0);

  useEffect(() => {
    const currentPdfSignFile = pdfSignFile;
    return () => {
      if (currentPdfSignFile?.startsWith('blob:')) {
        URL.revokeObjectURL(currentPdfSignFile);
      }
    };
  }, [pdfSignFile]);


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DotsHorizontalIcon className="h-4 w-4" />}
                <span className="sr-only">Menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <DropdownMenuLabel>Opsi: {approvalRequest.file?.filename || approvalRequest.fileIdRef}</DropdownMenuLabel>
            {/* --- Tombol Lihat Detail --- */}
            <DropdownMenuItem
                onClick={() => {
                    if (approvalRequest.fileIdRef && approvalRequest.sharedApprovalProcessCuid) {
                        router.push(`/approvals/detail/${approvalRequest.fileIdRef}?processId=${approvalRequest.sharedApprovalProcessCuid}`);
                    } else if (approvalRequest.fileIdRef) { // Fallback jika processCuid tidak ada (seharusnya selalu ada)
                        router.push(`/approvals/detail/${approvalRequest.fileIdRef}`);
                    } else {
                        toast.error("Tidak dapat membuka detail, ID file atau proses tidak ditemukan pada data baris ini.");
                        console.error("Missing fileIdRef or sharedApprovalProcessCuid in approvalRequest:", approvalRequest);
                    }
                }}
                disabled={isActionLoading || !approvalRequest.fileIdRef}
            >
                <Eye className="mr-2 h-4 w-4" /> Lihat Detail & Log
            </DropdownMenuItem>
          {/* --- Akhir Tombol Lihat Detail --- */}

          {isCurrentUserAnApprover && (
            <><DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center text-sm font-medium">
                    {hasCurrentUserActioned ? <History className="mr-2 h-4 w-4 text-gray-500" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                    {hasCurrentUserActioned ? "Tindakan Anda" : "Lakukan Tindakan"}
                </DropdownMenuLabel>
                {canCurrentUserPerformInitialAction && (
                <>
                    <DropdownMenuItem onClick={() => setShowRevisionDialog(true)} disabled={isActionLoading}>
                        <MessageSquareWarning className="mr-2 h-4 w-4 text-orange-500" /> Minta Revisi
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenSignModal} disabled={isActionLoading}>
                        <PenTool className="mr-2 h-4 w-4 text-green-500" /> Tandatangani Pengesahan
                    </DropdownMenuItem>
                </>
                )}
                {hasCurrentUserActioned && (
                <DropdownMenuItem onClick={() => setShowViewMyActionDialog(true)} disabled={isActionLoading}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Lihat Detail Tindakan Saya
                </DropdownMenuItem>
                )}
            </DropdownMenuGroup></>
          )}
          {isCurrentUserAssigner && (
            <><DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center text-sm font-medium">
                    <Edit3 className="mr-2 h-4 w-4 text-purple-500"/> Aksi Sebagai Pengaju
                </DropdownMenuLabel>
                {canAssignerSubmitRevision && (
                  <DropdownMenuItem onClick={() => {setNewRevisionFile(null); /*setResubmitNotes("");*/ setShowResubmitDialog(true);}} disabled={isActionLoading}>
                      <Send className="mr-2 h-4 w-4" /> Submit Ulang Approval (Revisi)
                  </DropdownMenuItem>
                )}
                {canAssignerUpdateDocAndReapprove && (
                    <DropdownMenuItem
                      onClick={handleOpenUpdateDocDialog}
                      disabled={isActionLoading}
                    >
                      <FileUp className="mr-2 h-4 w-4" /> Ubah Dokumen & Minta Persetujuan Ulang
                    </DropdownMenuItem>
                )}
                {!canAssignerSubmitRevision && !canAssignerUpdateDocAndReapprove && (
                  <DropdownMenuItem disabled>
                    <Info className="mr-2 h-4 w-4" /> Tidak ada aksi pengelolaan
                  </DropdownMenuItem>
                )}
            </DropdownMenuGroup></>
          )}
          {!isCurrentUserAnApprover && !isCurrentUserAssigner && (
            <><DropdownMenuSeparator />
            <DropdownMenuItem disabled>
                <Info className="mr-2 h-4 w-4" /> Tidak ada aksi untuk Anda
            </DropdownMenuItem></>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ... (sisa JSX untuk semua Dialog seperti sebelumnya) ... */}
      <AlertDialog open={showRevisionDialog} onOpenChange={(isOpen) => { if (!isOpen && !isActionLoading) setRevisionRemarks(""); setShowRevisionDialog(isOpen); }}>
          <AlertDialogContent>
              <AlertDialogHeader> <AlertDialogTitle>Minta Revisi</AlertDialogTitle> <AlertDialogDescription> File: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong>. Tulis catatan revisi.</AlertDialogDescription> </AlertDialogHeader>
              <div className="grid gap-4 py-4"> <Textarea id="revision-remarks" value={revisionRemarks} onChange={(e) => setRevisionRemarks(e.target.value)} className="min-h-[100px]" placeholder="Contoh: Perbaiki Bab X..." disabled={isActionLoading}/> </div>
              <AlertDialogFooter> <AlertDialogCancel onClick={() => setShowRevisionDialog(false)} disabled={isActionLoading}>Batal</AlertDialogCancel> <AlertDialogAction onClick={submitRevisionRequest} disabled={!revisionRemarks.trim() || isActionLoading}> {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Revisi </AlertDialogAction> </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResubmitDialog} onOpenChange={(isOpen) => { if(!isOpen && !isActionLoading) { setNewRevisionFile(null); /*setResubmitNotes("");*/} setShowResubmitDialog(isOpen); }}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Submit Ulang Approval (Revisi)</AlertDialogTitle><AlertDialogDescription>File: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong>. Anda dapat mengunggah file revisi baru jika ada.</AlertDialogDescription></AlertDialogHeader>
            <div className="grid gap-4 py-4">
                <div>
                    <Label htmlFor="new-revision-file-revisi">Unggah File Revisi Baru (Opsional)</Label>
                    <Input id="new-revision-file-revisi" type="file" className="mt-1" onChange={(e) => setNewRevisionFile(e.target.files ? e.target.files[0] : null)} disabled={isActionLoading}/>
                    {newRevisionFile && (<p className="mt-2 text-xs text-muted-foreground">File: {newRevisionFile.name} ({(newRevisionFile.size / 1024).toFixed(1)} KB)</p>)}
                </div>
            </div>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setShowResubmitDialog(false)} disabled={isActionLoading}>Batal</AlertDialogCancel><AlertDialogAction onClick={submitResubmissionForRevision} disabled={isActionLoading}>{isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Ulang</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUpdateDocDialog} onOpenChange={(isOpen) => { if (!isOpen && !isActionLoading) { setUpdateDocFile(null); /*setUpdateDocRemarks("");*/ } setShowUpdateDocDialog(isOpen); }}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Ubah Dokumen & Minta Persetujuan Ulang</AlertDialogTitle>
                <AlertDialogDescription>
                    File <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong> akan diganti. Proses approval lama akan dibatalkan & permintaan baru dikirim.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
                <div>
                    <Label htmlFor="update-doc-file">Unggah Dokumen Baru <span className="text-red-500">*</span></Label>
                    <Input id="update-doc-file" type="file" className="mt-1" onChange={(e) => setUpdateDocFile(e.target.files ? e.target.files[0] : null)} disabled={isActionLoading} required />
                    {updateDocFile && (<p className="mt-2 text-xs text-muted-foreground">File baru: {updateDocFile.name} ({(updateDocFile.size / 1024).toFixed(1)} KB)</p>)}
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowUpdateDocDialog(false)} disabled={isActionLoading}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={submitUpdateDocAndReapprove} disabled={isActionLoading || !updateDocFile} className="bg-primary hover:bg-primary focus-visible:primary">
                    {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ubah & Kirim Ulang
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showUniversalLoadingModal} onOpenChange={setShowUniversalLoadingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle className="text-center text-lg">Sedang Memproses</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-muted-foreground">{universalLoadingMessage}</p>
            <p className="text-sm text-muted-foreground">Mohon tunggu sebentar.</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showViewMyActionDialog} onOpenChange={setShowViewMyActionDialog}>
        <AlertDialogContent>
            <AlertDialogHeader> <AlertDialogTitle>Detail Tindakan Anda</AlertDialogTitle> {currentUserAsApproverAction && ( <AlertDialogDescription> Untuk file: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong> </AlertDialogDescription> )} </AlertDialogHeader>
            {currentUserAsApproverAction && ( <div className="space-y-2 py-4 text-sm"> <div className="flex items-start"> <strong className="w-28 shrink-0">Status Anda:</strong> <span className={`font-semibold ${ currentUserAsApproverAction.statusKey === 'approved' ? 'text-green-600' : currentUserAsApproverAction.statusKey === 'revised' ? 'text-orange-600' : currentUserAsApproverAction.statusKey === 'rejected' ? 'text-red-600' : 'text-muted-foreground'}`}> {currentUserAsApproverAction.statusDisplay} </span> </div> {currentUserAsApproverAction.remarks && ( <div className="flex items-start"> <strong className="w-28 shrink-0">Catatan Anda:</strong> <p className="break-words whitespace-pre-wrap flex-1">{currentUserAsApproverAction.remarks}</p> </div> )} {currentUserAsApproverAction.actioned_at && ( <div className="flex items-start"> <strong className="w-28 shrink-0">Ditindak pada:</strong> <span>{new Date(currentUserAsApproverAction.actioned_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span> </div> )} </div> )}
            <AlertDialogFooter> <AlertDialogAction onClick={() => setShowViewMyActionDialog(false)}>Tutup</AlertDialogAction> </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSigningModal} onOpenChange={(isOpen) => {
            if (!isOpen) {
                if (pdfSignFile?.startsWith('blob:')) URL.revokeObjectURL(pdfSignFile);
                setPdfSignFile(null); setPdfSignLoading(false); setPdfSignError(null);
                setNumSignPages(null); setCurrentSignPage(1); setSignaturePosition(null);
                setPlacedSignatureDataUrl(null); setSignaturePreviewStyle(null);
                setSignatureScaleFactor(1.0); setImportedSignatureUrl(null);
                if (signatureImportInputRef.current) signatureImportInputRef.current.value = "";
                signaturePadRef.current?.clear();
            }
            setShowSigningModal(isOpen);
        }}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[95vh] flex flex-col p-0 overflow-y-auto">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
                <DialogTitle>Tandatangani: {approvalRequest.file?.filename || "Dokumen"}</DialogTitle>
                <DialogDescription>1. Gambar/Impor TTD. 2. Klik PDF untuk posisi. 3. Atur ukuran TTD (ops.). 4. Sahkan.</DialogDescription>
                <DialogClose asChild><Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 rounded-full" disabled={isActionLoading}> <XIcon className="h-5 w-5" /> </Button></DialogClose>
            </DialogHeader>
            <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 pb-1 space-y-3">
                <div className="shrink-0">
                    <Label htmlFor="signature-pad" className="mb-1 text-sm font-medium">Panel Tanda Tangan:</Label>
                    <input type="file" ref={signatureImportInputRef} onChange={handleSignatureFileChange} accept={ALLOWED_SIGNATURE_IMPORT_TYPES.join(',')} style={{ display: 'none' }} disabled={isActionLoading} />
                    <div ref={signatureWrapperRef} className="w-full h-40 sm:h-48 border rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden shadow relative" >
                        {(canvasDimensions.width > 0 && canvasDimensions.height > 0) ? (
                            <SignatureCanvas ref={signaturePadRef} penColor="black" backgroundColor="rgba(248, 250, 252, 0)" canvasProps={{ width: canvasDimensions.width, height: canvasDimensions.height, className: 'signature-pad-canvas' }} minWidth={0.7} maxWidth={2.0} onEnd={() => { if (signaturePadRef.current && !signaturePadRef.current.isEmpty()){ const dataUrl = signaturePadRef.current.toDataURL('image/png'); setPlacedSignatureDataUrl(dataUrl); setImportedSignatureUrl(null); if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; } else { if (!importedSignatureUrl) { setPlacedSignatureDataUrl(null);}}}} />
                        ) : ( <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Memuat...</div> )}
                    </div>
                    {importedSignatureUrl && ( <div className="mt-2 p-2 border rounded-md bg-slate-50 dark:bg-slate-800"> <Label className="text-xs font-medium text-muted-foreground">TTD Impor Aktif:</Label> <img src={importedSignatureUrl} alt="TTD Impor" className="border rounded max-w-[200px] max-h-[60px] mt-1 object-contain bg-white" /> </div> )}
                    <div className="flex flex-wrap justify-between items-center mt-2 gap-y-2">
                        <div className="flex items-center gap-1">
                            <Button variant="outline" onClick={clearSignature} size="sm" className="text-xs px-2 h-7" disabled={isActionLoading}> Bersihkan </Button>
                            <Button variant="outline" onClick={handleDownloadSignature} size="icon" className="h-7 w-7" title="Unduh TTD Aktif" disabled={!placedSignatureDataUrl || isActionLoading} > <Download className="h-4 w-4" /> </Button>
                            <Button variant="outline" onClick={handleImportSignatureClick} size="icon" className="h-7 w-7" title="Impor Gambar TTD" disabled={isActionLoading} > <UploadCloud className="h-4 w-4" /> </Button>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleDecreaseSignatureSize} disabled={!signaturePosition || signatureScaleFactor <= SIGNATURE_MIN_SCALE_FACTOR || isActionLoading} title="Perkecil TTD"> <MinusCircle className="h-4 w-4" /> </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleResetSignatureSize} disabled={!signaturePosition || signatureScaleFactor === 1.0 || isActionLoading} title="Reset Ukuran TTD"> <Maximize className="h-3 w-3" /> </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleIncreaseSignatureSize} disabled={!signaturePosition || signatureScaleFactor >= SIGNATURE_MAX_SCALE_FACTOR || isActionLoading} title="Perbesar TTD"> <PlusCircle className="h-4 w-4" /> </Button>
                            <span className="text-xs tabular-nums w-10 text-center" title="Skala TTD">{(signatureScaleFactor * 100).toFixed(0)}%</span>
                        </div>
                        {signaturePosition && ( <div className="text-xs text-green-700 dark:text-green-400 text-right truncate" title="Posisi TTD"> Hal {signaturePosition.pageIndex + 1} (X:{signaturePosition.xPercent.toFixed(0)}% Y:{signaturePosition.yPercent.toFixed(0)}%) </div> )}
                        {!signaturePosition && ( <div className="text-xs text-amber-700 dark:text-amber-400 text-right"> {(placedSignatureDataUrl || (signaturePadRef.current && !signaturePadRef.current.isEmpty())) ? "Klik PDF." : "Gambar/Impor TTD."} </div> )}
                    </div>
                </div>
                <Separator className="my-1" />
                <div className="flex-1 flex flex-col border rounded-lg min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    {pdfSignLoading && <div className="flex-1 flex items-center justify-center text-muted-foreground p-4"><Loader2 className="h-6 w-6 animate-spin mr-2" />Memuat PDF...</div>}
                    {pdfSignError && <div className="flex-1 flex items-center justify-center text-destructive bg-red-50 dark:bg-red-900/30 p-4 text-center">Error: {pdfSignError}</div>}
                    {pdfSignFile && !pdfSignLoading && !pdfSignError && (
                        <>
                            <div ref={pdfSignContainerRef} className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-700 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
                                <Document file={pdfSignFile} onLoadSuccess={onSignDocumentLoadSuccess} onLoadError={(error) => { console.error("react-pdf onLoadError (signing):", error); setPdfSignError(`Gagal muat PDF: ${error.message}`); }} loading={<div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" />Muat dokumen...</div>} error={<div className="p-4 text-center text-destructive">Gagal tampil PDF.</div>} className="flex justify-center py-4" >
                                    {numSignPages && currentSignPage > 0 && currentSignPage <= numSignPages && (
                                        <div ref={pdfSignPageRenderRef} onClick={(e) => {!isActionLoading && handlePdfPageClick(e, currentSignPage - 1)}} className={`relative shadow-lg bg-white dark:bg-gray-800 ${isActionLoading ? 'cursor-default' : 'cursor-crosshair'}`} style={{ width: 'fit-content', margin: 'auto' }} >
                                            <PdfPage pageNumber={currentSignPage} scale={pdfSignScale} renderTextLayer={false} renderAnnotationLayer={false} className="pdf-page-signing" onRenderSuccess={() => { if (signaturePosition && placedSignatureDataUrl) { setSignaturePosition(sp => sp ? {...sp} : null); }}} onRenderError={(error) => console.error(`Error render hal ${currentSignPage} (signing):`, error)} />
                                            {signaturePreviewStyle && placedSignatureDataUrl && currentSignPage -1 === signaturePosition?.pageIndex && ( <div style={signaturePreviewStyle} /> )}
                                        </div>
                                    )}
                                </Document>
                            </div>
                            {numSignPages && numSignPages > 0 && (
                                <div className="flex items-center justify-center gap-1 sm:gap-2 p-2 border-t bg-background shrink-0">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleSignZoomOut} disabled={pdfSignScale <= PDF_MIN_SCALE_SIGN || isActionLoading}><ZoomOut className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleSignResetZoom} disabled={pdfSignScale === 1.0 || isActionLoading}><RotateCcw className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleSignZoomIn} disabled={pdfSignScale >= PDF_MAX_SCALE_SIGN || isActionLoading}><ZoomIn className="h-4 w-4" /></Button>
                                    <span className="text-xs w-12 text-center tabular-nums">{(pdfSignScale * 100).toFixed(0)}%</span>
                                    <Separator orientation="vertical" className="h-5 mx-0.5 sm:mx-1" />
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToSignPrevPage} disabled={currentSignPage <= 1 || isActionLoading}><ChevronLeft className="h-4 w-4" /></Button>
                                    <span className="text-xs px-1 min-w-[60px] text-center">Hal {currentSignPage}/{numSignPages}</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToSignNextPage} disabled={!numSignPages || currentSignPage >= numSignPages || isActionLoading}><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </>
                    )}
                    {(!pdfSignFile && !pdfSignLoading && !pdfSignError) && ( <div className="flex-1 flex items-center justify-center text-muted-foreground p-4"> <FileTextIcon className="h-10 w-10 mr-2 text-gray-400" /> <span>Menunggu file PDF...</span> </div> )}
                </div>
            </div>
            <DialogFooter className="px-4 sm:px-6 pt-3 pb-4 sm:pb-6 border-t mt-auto shrink-0">
                <Button variant="outline" onClick={() => setShowSigningModal(false)} disabled={isActionLoading}>Batal</Button>
                <Button onClick={handleFinalizeSignatureAndApprove} disabled={isActionLoading || !signaturePosition || !placedSignatureDataUrl } className="min-w-[200px]" >
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Sematkan & Sahkan
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

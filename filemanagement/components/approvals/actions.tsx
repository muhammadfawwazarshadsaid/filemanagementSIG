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
  Eye,
  Brush,
  Type,
  Undo2,
  Redo2,
  Trash2,
  MousePointer2,
  ImagePlus
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { toast } from "sonner";
import { ProcessedApprovalRequest } from "./schema";
import { ApprovalsTableMeta } from "./columns";

import SignatureCanvas from 'react-signature-canvas';
import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { useRouter } from "next/navigation";

// Konfigurasi Worker PDF.js
try {
  const pdfjsVersion = pdfjs.version;
  if (pdfjsVersion) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  } else {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
} catch (error) {
  console.error("Gagal mengkonfigurasi worker pdf.js:", error);
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
}

// Konstanta
const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const PDF_MAX_SCALE_SIGN = 2.0; const PDF_MIN_SCALE_SIGN = 0.5; const PDF_SCALE_STEP_SIGN = 0.1;
const SIGNATURE_DEFAULT_BASE_WIDTH_PX = 120;
const SIGNATURE_DEFAULT_ASPECT_RATIO = 2/1;
const SIGNATURE_MIN_SCALE_FACTOR = 0.5;
const SIGNATURE_MAX_SCALE_FACTOR = 1.5;
const SIGNATURE_SCALE_FACTOR_STEP = 0.1;
const ALLOWED_SIGNATURE_IMPORT_TYPES = ['image/png', 'image/jpeg'];
const MAX_SIGNATURE_IMPORT_SIZE_MB = 1;

// Tipe dan Antarmuka untuk Anotasi
type AnnotationTool = 'draw' | 'text' | 'select' | 'image';
type InteractionType = 'moving' | 'resizing';
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface AnnotationBase { id: string; pageIndex: number; color: string; x: number; y: number; width: number; height: number; }
interface PathAnnotation extends AnnotationBase { type: 'draw'; path: { x: number; y: number }[]; strokeWidth: number; }
interface TextAnnotation extends AnnotationBase { type: 'text'; text: string; fontSize: number; }
interface ImageAnnotation extends AnnotationBase { type: 'image'; imageUrl: string; }
type Annotation = PathAnnotation | TextAnnotation | ImageAnnotation;

interface InteractionState { type: InteractionType; handle?: ResizeHandle; initialAnnotation: Annotation; startPoint: { x: number; y: number }; }

interface ProcessedApprovalActionsProps {
  row: Row<ProcessedApprovalRequest>;
  meta?: ApprovalsTableMeta;
}

export function ProcessedApprovalDataTableRowActions({ row, meta }: ProcessedApprovalActionsProps) {
  const approvalRequest = row.original;
  const currentUserId = meta?.userId;
  const router = useRouter();

  // --- State Management ---
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

  // State Tanda Tangan
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

  // State Anotasi
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [pdfAnnotationFile, setPdfAnnotationFile] = useState<string | null>(null);
  const [pdfAnnotationLoading, setPdfAnnotationLoading] = useState<boolean>(false);
  const [pdfAnnotationError, setPdfAnnotationError] = useState<string | null>(null);
  const [numAnnotationPages, setNumAnnotationPages] = useState<number | null>(null);
  const [currentAnnotationPage, setCurrentAnnotationPage] = useState(1);
  const [pdfAnnotationScale, setPdfAnnotationScale] = useState(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('select');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(14);
  const [isDrawing, setIsDrawing] = useState(false);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const annotationContainerRef = useRef<HTMLDivElement>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  // --- Hooks ---

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

  useEffect(() => {
    if (!showAnnotationModal || !annotationCanvasRef.current) return;
    const canvas = annotationCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawAnnotations = annotations.filter(
      (ann): ann is PathAnnotation => ann.pageIndex === currentAnnotationPage - 1 && ann.type === 'draw'
    );
    drawAnnotations.forEach((ann) => {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.strokeWidth * pdfAnnotationScale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const transformedPath = ann.path.map(p => ({
          x: (ann.x + p.x * ann.width) * canvas.width,
          y: (ann.y + p.y * ann.height) * canvas.height
      }));
      transformedPath.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  }, [annotations, currentAnnotationPage, showAnnotationModal, pdfAnnotationScale]);

  useEffect(() => {
    if (!selectedAnnotationId) return;
    setAnnotations(prev => prev.map(ann => {
        if (ann.id === selectedAnnotationId) {
          if (ann.type === 'draw') return { ...ann, color: currentColor, strokeWidth };
          if (ann.type === 'text') return { ...ann, color: currentColor, fontSize };
        }
        return ann;
      })
    );
  }, [currentColor, strokeWidth, fontSize, selectedAnnotationId]);
  
  useEffect(() => {
    const selectedAnn = annotations.find(a => a.id === selectedAnnotationId);
    if (selectedAnn) {
      setCurrentColor(selectedAnn.color);
      if (selectedAnn.type === 'draw') setStrokeWidth(selectedAnn.strokeWidth);
      if (selectedAnn.type === 'text') setFontSize(selectedAnn.fontSize);
    }
  }, [selectedAnnotationId, annotations]);
  
  useEffect(() => {
    if (isDrawing || interaction) return;
    const lastHistoryState = history[historyStep];
    if (annotations !== lastHistoryState && JSON.stringify(annotations) !== JSON.stringify(lastHistoryState)) {
      updateHistory(annotations);
    }
  }, [isDrawing, interaction, annotations]);
  
  const fetchPdf = useCallback(async (fileId: string, setPdfFunc: (url: string | null) => void, setLoadingFunc: (loading: boolean) => void, setNumPagesFunc: (pages: number | null) => void, setErrorFunc: (error: string | null) => void) => {
    if (!meta?.accessToken) { toast.error("Token akses tidak valid."); return; }
    setLoadingFunc(true);
    setErrorFunc(null);
    setPdfFunc(null);
    if(setNumPagesFunc) setNumPagesFunc(null);
    const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${fileId}?alt=media`;
    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${meta.accessToken}` } });
        if (!response.ok) throw new Error("Gagal mengambil PDF dari Google Drive.");
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPdfFunc(objectUrl);
    } catch (err: any) {
        setErrorFunc(err.message);
        toast.error("Gagal Memuat PDF", { description: err.message });
    } finally {
        setLoadingFunc(false);
    }
  }, [meta?.accessToken]);

  const currentUserAsApproverAction = approvalRequest.approverActions.find(action => action.approverId === currentUserId);
  const isCurrentUserAnApprover = !!currentUserAsApproverAction;
  const canCurrentUserPerformInitialAction = currentUserAsApproverAction && (currentUserAsApproverAction.statusKey === 'pending' || currentUserAsApproverAction.statusKey === 'unknown');
  const hasCurrentUserActioned = currentUserAsApproverAction && (currentUserAsApproverAction.statusKey === 'approved' || currentUserAsApproverAction.statusKey === 'revised' || currentUserAsApproverAction.statusKey === 'rejected');
  const isCurrentUserAssigner = approvalRequest.assigner?.id === currentUserId;
  const canAssignerSubmitRevision = isCurrentUserAssigner && approvalRequest.overallStatus === 'Perlu Revisi';
  const canAssignerUpdateDocAndReapprove = isCurrentUserAssigner && (approvalRequest.overallStatus === 'Menunggu Persetujuan' || approvalRequest.overallStatus === 'Belum Ada Tindakan' || approvalRequest.overallStatus === 'Sah');
  
  const didCurrentUserApprove = currentUserAsApproverAction?.statusKey === 'approved';

  const handleOpenSignModal = () => {
    if (!approvalRequest.file?.id || approvalRequest.file.mimeType !== 'application/pdf') {
        toast.error("Hanya file PDF yang bisa ditandatangani."); return;
    }
    fetchPdf(approvalRequest.file.id, setPdfSignFile, setPdfSignLoading, setNumSignPages, setPdfSignError);
    setShowSigningModal(true);
  };
  
  const handleFinalizeSignatureAndApprove = async () => {
    if (!currentUserAsApproverAction || !meta?.makeApiCall || !currentUserId) {
        toast.error("Info pengguna tidak lengkap untuk menandatangani.");
        return;
    }
    if (!approvalRequest.file || !approvalRequest.file.id || !approvalRequest.fileWorkspaceIdRef || !approvalRequest.fileUserIdRef) {
        toast.error("Informasi file tidak lengkap untuk proses penandatanganan.");
        return;
    }
    if (!placedSignatureDataUrl) { toast.error("Tanda tangan belum dibuat atau diimpor."); return; }
    if (!signaturePosition) { toast.error("Posisi tanda tangan belum ditentukan pada PDF."); return; }

    setIsActionLoading(true);
    setUniversalLoadingMessage("Memproses penandatanganan...");
    setShowUniversalLoadingModal(true);

    const payload = {
      originalFileId: approvalRequest.file.id,
      originalFileWorkspaceIdRef: approvalRequest.fileWorkspaceIdRef,
      originalFileUserIdRef: approvalRequest.fileUserIdRef,
      signatureImageBase64: placedSignatureDataUrl,
      signaturePlacement: { ...signaturePosition, scaleFactor: signatureScaleFactor },
      sharedApprovalProcessCuid: approvalRequest.sharedApprovalProcessCuid,
      actioned_by_user_id: currentUserId,
    };

    try {
        await meta.makeApiCall(`/api/approvals/sign-and-approve`, 'POST', payload);
        toast.success("Dokumen berhasil ditandatangani dan disahkan.");
        setShowSigningModal(false);
        meta.onActionComplete?.();
    } catch (err: any) {
        toast.error(err.message || "Gagal memproses penandatanganan.");
    } finally {
        setIsActionLoading(false);
        setShowUniversalLoadingModal(false);
    }
  };
  
  const submitRevisionRequest = async () => {
    if (!currentUserAsApproverAction || !meta?.makeApiCall || !currentUserId || !revisionRemarks.trim()) {
      toast.error("Catatan revisi wajib diisi atau info pengguna tidak lengkap.");
      return;
    }
    setIsActionLoading(true);
    setUniversalLoadingMessage("Mengirim permintaan revisi...");
    setShowUniversalLoadingModal(true);

    const payload = {
        sharedApprovalProcessCuid: approvalRequest.sharedApprovalProcessCuid,
        approverUserId: currentUserAsApproverAction.approverId,
        status: "Perlu Revisi",
        remarks: revisionRemarks,
    };

    try {
        await meta.makeApiCall(`/api/approvals/updatestatus`, 'PUT', payload);
        toast.success("Permintaan revisi berhasil dikirim.");
      setShowRevisionDialog(false);
      setShowUpdateDocDialog(false);
        meta.onActionComplete?.();
    } catch (err: any) {
        toast.error(err.message || "Gagal mengirim permintaan revisi.");
    } finally {
        setIsActionLoading(false);
        setShowUniversalLoadingModal(false);
    }
  };

  const submitResubmissionForRevision = async () => {
    if (!meta?.makeApiCall || !currentUserId) { toast.error("Info pengguna tidak lengkap."); return; }
    if (!approvalRequest.fileIdRef || !approvalRequest.fileWorkspaceIdRef || !approvalRequest.sharedApprovalProcessCuid) {
      toast.error("Info file/proses approval tidak lengkap."); return;
    }

    setIsActionLoading(true); setShowResubmitDialog(false); setShowUpdateDocDialog(false);
    setUniversalLoadingMessage("Mengirim ulang approval...");
    setShowUniversalLoadingModal(true);

    const formData = new FormData();
    formData.append('old_file_id_ref', approvalRequest.fileIdRef);
    formData.append('old_file_workspace_id_ref', approvalRequest.fileWorkspaceIdRef);
    formData.append('approval_process_id', approvalRequest.sharedApprovalProcessCuid);
    formData.append('requested_by_user_id', currentUserId);
    if (newRevisionFile) {
        formData.append('new_file', newRevisionFile, newRevisionFile.name);
    }

    try {
        await meta.makeApiCall(`/api/approvals/resubmit-with-new-file`, 'POST', formData);
        toast.success("Approval berhasil disubmit ulang.");
        meta.onActionComplete?.();
    } catch (err: any) {
        toast.error(err.message || "Gagal submit ulang approval.");
    } finally {
        setIsActionLoading(false);
        setShowUniversalLoadingModal(false);
    }
  };

  const submitUpdateDocAndReapprove = async () => {
    if (!meta?.makeApiCall || !currentUserId) { toast.error("Info pengguna tidak lengkap."); return; }
    if (!approvalRequest.fileIdRef || !approvalRequest.fileWorkspaceIdRef || !approvalRequest.fileUserIdRef || !approvalRequest.sharedApprovalProcessCuid) {
      toast.error("Informasi pengajuan tidak lengkap."); return;
    }
    if (!updateDocFile) { toast.error("File dokumen baru wajib diunggah."); return; }
    const originalApproverIds = approvalRequest.approverActions.map(a => a.approverId);
    if (originalApproverIds.length === 0) { toast.error("Tidak ada approver asli."); return; }

    setIsActionLoading(true); setShowUpdateDocDialog(false);
    setUniversalLoadingMessage("Memperbarui dokumen...");
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

    try {
        await meta.makeApiCall(`/api/approvals/update-document-and-reapprove`, 'POST', formData);
        toast.success("Dokumen berhasil diperbarui & permintaan baru dikirim.");
        meta.onActionComplete?.();
    } catch (err: any) {
        toast.error(err.message || "Gagal memperbarui dokumen.");
    } finally {
        setIsActionLoading(false);
        setShowUniversalLoadingModal(false);
    }
  };
  
  const handleOpenAnnotationModal = () => {
    if (!approvalRequest.file?.id) {
        toast.error("File tidak valid untuk dianotasi."); return;
    }
    setAnnotations([]);
    setHistory([[]]);
    setHistoryStep(0);
    setSelectedAnnotationId(null);
    setCurrentTool('select');
    fetchPdf(approvalRequest.file.id, setPdfAnnotationFile, setPdfAnnotationLoading, setNumAnnotationPages, setPdfAnnotationError);
    setShowAnnotationModal(true);
  };
  
  const handleSaveAnnotationsAndFinish = async () => {
    if (!meta?.makeApiCall) {
      toast.error("Fungsi API tidak tersedia.");
      return;
    }
    if (!approvalRequest.file?.id) {
      toast.error("ID file tidak ditemukan untuk menyimpan anotasi.");
      return;
    }
    if (annotations.length === 0) {
      toast.info("Tidak ada anotasi untuk disimpan. Menutup editor.");
      setShowAnnotationModal(false);
      return;
    }

    setIsActionLoading(true);

    // Payload yang akan dikirim ke backend
    const payload = {
      fileId: approvalRequest.file.id,
      annotations: annotations,
    };

    try {
      // Panggil API endpoint baru
      await meta.makeApiCall('/api/approvals/save-annotation', 'POST', payload);
      
      toast.success("Anotasi berhasil disimpan!", {
        description: "File PDF di Google Drive telah diperbarui.",
      });
      setShowAnnotationModal(false); // Tutup modal setelah sukses
      // Tidak perlu memanggil meta.onActionComplete() karena status tidak berubah

    } catch (err: any) {
      toast.error("Gagal Menyimpan Anotasi", {
        description: err.message || "Terjadi kesalahan saat berkomunikasi dengan server.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };
    
  const getCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    const container = annotationContainerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const updateHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    setHistory([...newHistory, newAnnotations]);
    setHistoryStep(newHistory.length);
  };
  
  const handleUndo = () => {
    if (historyStep >= 1) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setAnnotations(history[newStep] || []);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setAnnotations(history[newStep]);
    }
  };
  
  const getAnnotationAtPoint = (point: {x: number, y: number}): Annotation | null => {
      const pageAnnotations = annotations.filter(a => a.pageIndex === currentAnnotationPage - 1).reverse();
      for (const ann of pageAnnotations) {
          if (point.x >= ann.x && point.x <= ann.x + ann.width && point.y >= ann.y && point.y <= ann.y + ann.height) {
              return ann;
          }
      }
      return null;
  };

  const handleAnnotationMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-control-button]')) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();
    const startPoint = getCoords(e);
    if (!startPoint) return;
    
    const interactionTargetId = target.getAttribute('data-ann-id');
    const interactionType = target.getAttribute('data-interaction');
    const resizeHandle = target.getAttribute('data-handle') as ResizeHandle;

    if (selectedAnnotationId && interactionTargetId === selectedAnnotationId && (interactionType === 'resize')) {
      const initialAnnotation = annotations.find(a => a.id === selectedAnnotationId);
      if (initialAnnotation) {
        setInteraction({ type: 'resizing', handle: resizeHandle, initialAnnotation, startPoint });
      }
      return;
    }
    
    switch (currentTool) {
      case 'select': {
        const clickedAnnotation = getAnnotationAtPoint(startPoint);
        setSelectedAnnotationId(clickedAnnotation?.id || null);
        if (clickedAnnotation) {
          setInteraction({ type: 'moving', initialAnnotation: clickedAnnotation, startPoint });
        }
        break;
      }
      case 'draw': {
        setIsDrawing(true);
        const newId = `draw-${Date.now()}`;
        const newAnn: PathAnnotation = {
          id: newId, type: 'draw', pageIndex: currentAnnotationPage - 1,
          color: currentColor, strokeWidth, path: [{ x: 0.5, y: 0.5 }],
          x: startPoint.x, y: startPoint.y, width: 0, height: 0,
        };
        setAnnotations(prev => [...prev, newAnn]);
        setSelectedAnnotationId(newId);
        break;
      }
      case 'text': {
        const newId = `text-${Date.now()}`;
        const newAnn: TextAnnotation = {
          id: newId, type: 'text', pageIndex: currentAnnotationPage - 1,
          color: currentColor, fontSize, text: 'Teks baru',
          x: startPoint.x - 0.1, y: startPoint.y - 0.05,
          width: 0.2, height: 0.1,
        };
        setAnnotations(prev => [...prev, newAnn]);
        setSelectedAnnotationId(newId);
        setCurrentTool('select');
        break;
      }
    }
  };

  const handleAnnotationMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const currentPoint = getCoords(e);
    if (!currentPoint) return;

    if (isDrawing) {
      setAnnotations(prev => prev.map(ann => {
        if (ann.id === selectedAnnotationId && ann.type === 'draw') {
          const rawPath = ann.path.map(p => ({
            x: ann.x + p.x * ann.width,
            y: ann.y + p.y * ann.height,
          }));
          rawPath.push({ x: currentPoint.x, y: currentPoint.y });

          const minX = Math.min(...rawPath.map(p => p.x));
          const minY = Math.min(...rawPath.map(p => p.y));
          const maxX = Math.max(...rawPath.map(p => p.x));
          const maxY = Math.max(...rawPath.map(p => p.y));
          
          const finalWidth = maxX - minX;
          const finalHeight = maxY - minY;

          const normalizedPath = rawPath.map(p => ({
            x: (p.x - minX) / (finalWidth || 1),
            y: (p.y - minY) / (finalHeight || 1),
          }));
          
          return { ...ann, x: minX, y: minY, width: finalWidth, height: finalHeight, path: normalizedPath };
        }
        return ann;
      }));
    } else if (interaction) {
      const dx = currentPoint.x - interaction.startPoint.x;
      const dy = currentPoint.y - interaction.startPoint.y;

      setAnnotations(prevAnns => prevAnns.map(ann => {
        if (ann.id !== interaction.initialAnnotation.id) return ann;
            
        if (interaction.type === 'moving') {
          return { ...ann, x: interaction.initialAnnotation.x + dx, y: interaction.initialAnnotation.y + dy };
        }

        if (interaction.type === 'resizing') {
          const { initialAnnotation: initial } = interaction;
          let { x, y, width, height } = initial;
                
          switch (interaction.handle) {
            case 'bottom-right':
              width = initial.width + dx;
              height = initial.height + dy;
              break;
            case 'bottom-left':
              x = initial.x + dx;
              width = initial.width - dx;
              height = initial.height + dy;
              break;
            case 'top-right':
              y = initial.y + dy;
              width = initial.width + dx;
              height = initial.height - dy;
              break;
            case 'top-left':
              x = initial.x + dx;
              y = initial.y + dy;
              width = initial.width - dx;
              height = initial.height - dy;
              break;
          }
          const newWidth = Math.max(width, 0.02);
          const newHeight = Math.max(height, 0.02);

          if (ann.type === 'text') {
            const newFontSize = Math.max(8, newHeight * 120);
            return { ...ann, x, y, width: newWidth, height: newHeight, fontSize: newFontSize };
          }
          return { ...ann, x, y, width: newWidth, height: newHeight };
        }
        return ann;
      }));
    }
  };

  const handleAnnotationMouseUp = () => {
    if (isDrawing) setIsDrawing(false);
    if (interaction) setInteraction(null);
  };
  
  const handleDeleteAnnotation = (id: string) => {
    const newAnnotations = annotations.filter(ann => ann.id !== id);
    setAnnotations(newAnnotations);
    updateHistory(newAnnotations);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newAnn: ImageAnnotation = {
          id: `image-${Date.now()}`,
          type: 'image',
          pageIndex: currentAnnotationPage - 1,
          imageUrl,
          x: 0.1,
          y: 0.1,
          width: 0.2,
          height: 0.2 / aspectRatio,
          color: '' // tidak relevan untuk gambar
        };
        const newAnnotations = [...annotations, newAnn];
        setAnnotations(newAnnotations);
        updateHistory(newAnnotations);
        setSelectedAnnotationId(newAnn.id);
        setCurrentTool('select');
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };
  
  const handleDownloadAnnotation = async (annotation: Annotation) => {
    if (annotation.type !== 'draw' && annotation.type !== 'image') return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      toast.error("Gagal membuat canvas untuk download.");
      return;
    }

    const container = annotationContainerRef.current;
    if (!container) return;

    const canvasWidth = annotation.width * container.offsetWidth;
    const canvasHeight = annotation.height * container.offsetHeight;
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    
    let dataUrl = '';

    if (annotation.type === 'draw') {
      tempCtx.strokeStyle = annotation.color;
      tempCtx.lineWidth = annotation.strokeWidth * pdfAnnotationScale;
      tempCtx.lineCap = 'round';
      tempCtx.lineJoin = 'round';
      tempCtx.beginPath();
      const transformedPath = annotation.path.map(p => ({
        x: p.x * canvasWidth,
        y: p.y * canvasHeight
      }));
      transformedPath.forEach((point, index) => {
        if (index === 0) tempCtx.moveTo(point.x, point.y);
        else tempCtx.lineTo(point.x, point.y);
      });
      tempCtx.stroke();
      dataUrl = tempCanvas.toDataURL('image/png');
    } else if (annotation.type === 'image') {
      dataUrl = annotation.imageUrl;
    }

    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `anotasi-${annotation.type}-${annotation.id.slice(-4)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Anotasi diunduh.");
    }
  };
  
  const AnnotationRenderer = ({ annotation }: { annotation: Annotation }) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${annotation.x * 100}%`,
      top: `${annotation.y * 100}%`,
      width: `${annotation.width * 100}%`,
      height: `${annotation.height * 100}%`,
      transformOrigin: 'top left',
    };
    if (annotation.type === 'text') {
      return (
      <div
        style={baseStyle}
        data-ann-id={annotation.id}
        onClick={(e) => {
        e.stopPropagation(); // Prevent triggering other events
        setSelectedAnnotationId(annotation.id); // Set the selected annotation
        }}
      >
        <Textarea
        value={annotation.text}
        autoFocus={selectedAnnotationId === annotation.id}
        onFocus={(e) => {
          const target = e.target;
          target.setSelectionRange(target.value.length, target.value.length); // Move cursor to the end
        }}
        onChange={(e) => {
          const newText = e.target.value;
          setAnnotations((prev) =>
          prev.map((a) =>
            a.id === annotation.id ? { ...a, text: newText } as TextAnnotation : a
          )
          );
        }}
        onBlur={() => {
          setSelectedAnnotationId(null); // Exit edit mode
          updateHistory(annotations);
        }}
        className="w-full h-full p-1 resize-none"
        style={{
          color: annotation.color,
          fontSize: `${annotation.fontSize * pdfAnnotationScale}px`,
          border: 'none',
          outline: 'none',
          pointerEvents: 'auto', // Ensure the text is always editable
          direction: 'ltr', // Force left-to-right text direction
        }}
        />
      </div>
      );
    }

    if (annotation.type === 'draw') {
      return <div style={baseStyle} data-ann-id={annotation.id}></div>;
    }

    if (annotation.type === 'image') {
      return <img src={annotation.imageUrl} style={{ ...baseStyle, objectFit: 'contain' }} data-ann-id={annotation.id} alt="Anotasi Gambar" />;
    }

    return null;
  };

  const SelectionBox = ({ annotation }: { annotation: Annotation | null }) => {
    if (!annotation || currentTool !== 'select') return null;

    const boxStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${annotation.x * 100}%`,
      top: `${annotation.y * 100}%`,
      width: `${annotation.width * 100}%`,
      height: `${annotation.height * 100}%`,
      border: '2px solid #3b82f6',
      pointerEvents: 'none',
      zIndex: 20
    };

    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: '2px solid white',
      backgroundColor: '#3b82f6',
      borderRadius: '50%',
      pointerEvents: 'auto',
      zIndex: 21,
    };

    return (
      <div style={boxStyle} data-ann-id={annotation.id}>
        {annotation.type === 'draw' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDownloadAnnotation(annotation); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute -top-3 -left-8 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer pointer-events-auto"
            title="Download Anotasi"
          >
            <Download size={16} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteAnnotation(annotation.id); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-3 -right-8 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer pointer-events-auto"
          title="Hapus Anotasi"
        >
          <XIcon size={16} />
        </button>
        <div style={{ ...handleStyle, top: '-6px', left: '-6px', cursor: 'nwse-resize' }} data-ann-id={annotation.id} data-interaction="resize" data-handle="top-left" />
        <div style={{ ...handleStyle, top: '-6px', right: '-6px', cursor: 'nesw-resize' }} data-ann-id={annotation.id} data-interaction="resize" data-handle="top-right" />
        <div style={{ ...handleStyle, bottom: '-6px', left: '-6px', cursor: 'nesw-resize' }} data-ann-id={annotation.id} data-interaction="resize" data-handle="bottom-left" />
        <div style={{ ...handleStyle, bottom: '-6px', right: '-6px', cursor: 'nwse-resize' }} data-ann-id={annotation.id} data-interaction="resize" data-handle="bottom-right" />
      </div>
    );
  };
  
  const clearSignature = () => { signaturePadRef.current?.clear(); setPlacedSignatureDataUrl(null); setSignaturePosition(null); setSignaturePreviewStyle(null); setImportedSignatureUrl(null); if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; };
  const handleDownloadSignature = () => { if (placedSignatureDataUrl) { const link = document.createElement('a'); link.href = placedSignatureDataUrl; link.download = 'tanda-tangan.png'; document.body.appendChild(link); link.click(); document.body.removeChild(link); toast.success("TTD aktif diunduh."); } else { toast.error("Tidak ada TTD aktif."); } };
  const handleImportSignatureClick = () => { signatureImportInputRef.current?.click(); };
  const handleSignatureFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { if (!ALLOWED_SIGNATURE_IMPORT_TYPES.includes(file.type)) { toast.error(`Tipe file tidak valid. Pilih ${ALLOWED_SIGNATURE_IMPORT_TYPES.join('/')}.`); if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; return; } if (file.size > MAX_SIGNATURE_IMPORT_SIZE_MB * 1024 * 1024) { toast.error(`Ukuran file maks ${MAX_SIGNATURE_IMPORT_SIZE_MB}MB.`); if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; return; } const reader = new FileReader(); reader.onloadend = () => { const dataUrl = reader.result as string; setImportedSignatureUrl(dataUrl); setPlacedSignatureDataUrl(dataUrl); signaturePadRef.current?.clear(); toast.success("TTD diimpor."); }; reader.onerror = () => toast.error("Gagal baca file TTD."); reader.readAsDataURL(file); } if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; };
  const handlePdfPageClick = (event: React.MouseEvent<HTMLDivElement>, pageIndex: number) => { if (isActionLoading) return; let activeSignatureForPdf = placedSignatureDataUrl; if (!activeSignatureForPdf && signaturePadRef.current && !signaturePadRef.current.isEmpty()) { activeSignatureForPdf = signaturePadRef.current.toDataURL('image/png'); setPlacedSignatureDataUrl(activeSignatureForPdf); setImportedSignatureUrl(null); if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; } if (!activeSignatureForPdf) { toast.info("Tidak ada TTD aktif. Gambar/Impor dulu."); return; } const pageWrapperElement = event.currentTarget; if (pageWrapperElement?.offsetParent) { const rect = pageWrapperElement.getBoundingClientRect(); const xPercent = ((event.clientX - rect.left) / rect.width) * 100; const yPercent = ((event.clientY - rect.top) / rect.height) * 100; setSignaturePosition({ pageIndex, xPercent, yPercent, pageWidthSnapshot: rect.width / pdfSignScale, pageHeightSnapshot: rect.height / pdfSignScale, }); toast.success(`TTD akan ditempatkan di halaman ${pageIndex + 1}.`); } };
  function onSignDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }): void { setNumSignPages(loadedNumPages); }
  const handleSignZoomIn = () => setPdfSignScale(prev => Math.min(prev + PDF_SCALE_STEP_SIGN, PDF_MAX_SCALE_SIGN));
  const handleSignZoomOut = () => setPdfSignScale(prev => Math.max(prev - PDF_SCALE_STEP_SIGN, PDF_MIN_SCALE_SIGN));
  const handleSignResetZoom = () => { setPdfSignScale(1.0); if (pdfSignContainerRef.current) pdfSignContainerRef.current.scrollTop = 0; };
  const goToSignPrevPage = () => { setSignaturePosition(null); setSignaturePreviewStyle(null); setCurrentSignPage(prev => Math.max(1, prev - 1)); };
  const goToSignNextPage = () => { setSignaturePosition(null); setSignaturePreviewStyle(null); setCurrentSignPage(prev => Math.min(numSignPages || prev, prev + 1)); };
  const handleDecreaseSignatureSize = () => setSignatureScaleFactor(prev => Math.max(SIGNATURE_MIN_SCALE_FACTOR, parseFloat((prev - SIGNATURE_SCALE_FACTOR_STEP).toFixed(2))));
  const handleIncreaseSignatureSize = () => setSignatureScaleFactor(prev => Math.min(SIGNATURE_MAX_SCALE_FACTOR, parseFloat((prev + SIGNATURE_SCALE_FACTOR_STEP).toFixed(2))));
  const handleResetSignatureSize = () => setSignatureScaleFactor(1.0);
  
  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted" disabled={isActionLoading}>
            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DotsHorizontalIcon className="h-4 w-4" />}
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <DropdownMenuLabel>Opsi: {approvalRequest.file?.filename || approvalRequest.fileIdRef}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => router.push(`/approvals/detail/${approvalRequest.fileIdRef}?processId=${approvalRequest.sharedApprovalProcessCuid}`)}
            disabled={isActionLoading || !approvalRequest.fileIdRef}
          >
            <Eye className="mr-2 h-4 w-4" /> Lihat Detail & Log
          </DropdownMenuItem>
            
          {didCurrentUserApprove && (
            <DropdownMenuItem onClick={handleOpenAnnotationModal} disabled={isActionLoading}>
              <Brush className="mr-2 h-4 w-4 text-blue-500" /> Anotasi Dokumen
            </DropdownMenuItem>
          )}

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
                  <Edit3 className="mr-2 h-4 w-4 text-purple-500" /> Aksi Sebagai Pengaju
                </DropdownMenuLabel>
                {canAssignerSubmitRevision && (
                  <DropdownMenuItem onClick={() => { setNewRevisionFile(null); setShowResubmitDialog(true); }} disabled={isActionLoading}>
                    <Send className="mr-2 h-4 w-4" /> Submit Ulang Approval (Revisi)
                  </DropdownMenuItem>
                )}
                {canAssignerUpdateDocAndReapprove && (
                  // <DropdownMenuItem onClick={submitUpdateDocAndReapprove} disabled={isActionLoading}>
                    <DropdownMenuItem onClick={() => { setUpdateDocFile(null); setShowUpdateDocDialog(true); }} disabled={isActionLoading}>
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
          
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showAnnotationModal} onOpenChange={setShowAnnotationModal}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-2 border-b flex flex-row items-center justify-between">
            <DialogTitle className="ml-2">Editor Anotasi</DialogTitle>
            <DialogClose asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><XIcon className="h-5 w-5" /></Button></DialogClose>
          </DialogHeader>
          <div className="p-2 border-b flex items-center gap-2 flex-wrap">
            <Tooltip><TooltipTrigger asChild><Button variant={currentTool === 'select' ? 'secondary' : 'ghost'} size="icon" onClick={() => setCurrentTool('select')}><MousePointer2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Pilih & Pindahkan</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant={currentTool === 'draw' ? 'secondary' : 'ghost'} size="icon" onClick={() => setCurrentTool('draw')}><Brush className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Gambar Bebas</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant={currentTool === 'text' ? 'secondary' : 'ghost'} size="icon" onClick={() => setCurrentTool('text')}><Type className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Tambah Teks</TooltipContent></Tooltip>
            <input type="file" ref={imageUploadInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => imageUploadInputRef.current?.click()}><ImagePlus className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Upload Gambar</TooltipContent></Tooltip>
            <div className="flex items-center gap-2">
            <Input type="color" value={currentColor} onChange={e => setCurrentColor(e.target.value)} className="p-1 h-8 w-10 cursor-pointer" />
            </div>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleUndo} disabled={historyStep < 1}><Undo2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Undo</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleRedo} disabled={historyStep >= history.length - 1}><Redo2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Redo</TooltipContent></Tooltip>
            <div className="flex-grow" />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPdfAnnotationScale(s => Math.max(0.5, s - 0.1))}><ZoomOut className="h-5 w-5" /></Button>
              <span className="text-sm w-16 text-center tabular-nums">{(pdfAnnotationScale * 100).toFixed(0)}%</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPdfAnnotationScale(s => Math.min(2.5, s + 0.1))}><ZoomIn className="h-5 w-5" /></Button>
            </div>
            {(currentTool === 'draw' || (selectedAnnotationId && annotations.find(a => a.id === selectedAnnotationId)?.type === 'draw')) && (
              <div className="flex items-center gap-2">
                <Label>Stroke:</Label>
                <Input type="range" min="1" max="20" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-24" />
              </div>
            )}
          </div>
            
          <div
            className="flex-1 min-h-0 bg-slate-200 dark:bg-slate-800 overflow-auto"
            onMouseMove={handleAnnotationMouseMove}
            onMouseUp={handleAnnotationMouseUp}
            onMouseLeave={handleAnnotationMouseUp}
          >
            {pdfAnnotationLoading ? <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> :
              pdfAnnotationFile && (
                <Document file={pdfAnnotationFile} onLoadSuccess={({ numPages }) => { setNumAnnotationPages(numPages); setHistory([[]]); }} onLoadError={(e) => setPdfAnnotationError(e.message)}>
                  {pdfAnnotationError ? <div className="p-4 text-destructive">{pdfAnnotationError}</div> :
                    <div
                      ref={annotationContainerRef}
                      className="relative mx-auto my-4 w-max shadow-lg"
                      onMouseDown={handleAnnotationMouseDown}
                      style={{ cursor: currentTool === 'draw' ? 'crosshair' : (currentTool === 'text' ? 'text' : 'default') }}
                    >
                      <PdfPage pageNumber={currentAnnotationPage} scale={pdfAnnotationScale} renderAnnotationLayer={false} renderTextLayer={false} />
                      <canvas ref={annotationCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                      <div className="absolute top-0 left-0 w-full h-full">
                        {annotations.filter(a => a.pageIndex === currentAnnotationPage - 1).map(ann => (
                          <AnnotationRenderer key={ann.id} annotation={ann} />
                        ))}
                        <SelectionBox annotation={annotations.find(a => a.id === selectedAnnotationId) || null} />
                      </div>
                    </div>}
                </Document>
              )}
          </div>
          <DialogFooter className="p-2 border-t shrink-0 flex justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentAnnotationPage(p => Math.max(1, p - 1))} disabled={currentAnnotationPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span>Halaman {currentAnnotationPage} dari {numAnnotationPages || '?'}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentAnnotationPage(p => Math.min(numAnnotationPages!, p + 1))} disabled={!numAnnotationPages || currentAnnotationPage >= numAnnotationPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowAnnotationModal(false)}>Batal</Button>
              <Button onClick={handleSaveAnnotationsAndFinish} disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Anotasi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showSigningModal} onOpenChange={setShowSigningModal}>
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
                  <SignatureCanvas ref={signaturePadRef} penColor="black" backgroundColor="rgba(248, 250, 252, 0)" canvasProps={{ width: canvasDimensions.width, height: canvasDimensions.height, className: 'signature-pad-canvas' }} minWidth={0.7} maxWidth={2.0} onEnd={() => { if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) { const dataUrl = signaturePadRef.current.toDataURL('image/png'); setPlacedSignatureDataUrl(dataUrl); setImportedSignatureUrl(null); if (signatureImportInputRef.current) signatureImportInputRef.current.value = ""; } else { if (!importedSignatureUrl) { setPlacedSignatureDataUrl(null); } } }} />
                ) : (<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Memuat...</div>)}
              </div>
              {importedSignatureUrl && (<div className="mt-2 p-2 border rounded-md bg-slate-50 dark:bg-slate-800"> <Label className="text-xs font-medium text-muted-foreground">TTD Impor Aktif:</Label> <img src={importedSignatureUrl} alt="TTD Impor" className="border rounded max-w-[200px] max-h-[60px] mt-1 object-contain bg-white" /> </div>)}
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
              </div>
            </div>
            <Separator className="my-1" />
            <div className="flex-1 flex flex-col border rounded-lg min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-900">
              {pdfSignLoading && <div className="flex-1 flex items-center justify-center text-muted-foreground p-4"><Loader2 className="h-6 w-6 animate-spin mr-2" />Memuat PDF...</div>}
              {pdfSignError && <div className="flex-1 flex items-center justify-center text-destructive bg-red-50 dark:bg-red-900/30 p-4 text-center">Error: {pdfSignError}</div>}
              {pdfSignFile && !pdfSignLoading && !pdfSignError && (
                <>
                  <div ref={pdfSignContainerRef} className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-700 relative">
                    <Document file={pdfSignFile} onLoadSuccess={onSignDocumentLoadSuccess} loading={<div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>} className="flex justify-center py-4" >
                      {numSignPages && currentSignPage > 0 && currentSignPage <= numSignPages && (
                        <div ref={pdfSignPageRenderRef} onClick={(e) => { !isActionLoading && handlePdfPageClick(e, currentSignPage - 1) }} className={`relative bg-white dark:bg-gray-800 ${isActionLoading ? 'cursor-default' : 'cursor-crosshair'}`} >
                          <PdfPage pageNumber={currentSignPage} scale={pdfSignScale} />
                          {signaturePreviewStyle && placedSignatureDataUrl && currentSignPage - 1 === signaturePosition?.pageIndex && (<div style={signaturePreviewStyle} />)}
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
            </div>
          </div>
          <DialogFooter className="px-4 sm:px-6 pt-3 pb-4 sm:pb-6 border-t mt-auto shrink-0">
            <Button variant="outline" onClick={() => setShowSigningModal(false)} disabled={isActionLoading}>Batal</Button>
            <Button onClick={handleFinalizeSignatureAndApprove} disabled={isActionLoading || !signaturePosition || !placedSignatureDataUrl} className="min-w-[200px]" >
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Sematkan & Sahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader> <AlertDialogTitle>Minta Revisi</AlertDialogTitle> <AlertDialogDescription> File: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong>. Tulis catatan revisi.</AlertDialogDescription> </AlertDialogHeader>
          <div className="grid gap-4 py-4"> <Textarea id="revision-remarks" value={revisionRemarks} onChange={(e) => setRevisionRemarks(e.target.value)} className="min-h-[100px]" placeholder="Contoh: Perbaiki Bab X..." disabled={isActionLoading} /> </div>
          <AlertDialogFooter> <AlertDialogCancel onClick={() => setShowRevisionDialog(false)} disabled={isActionLoading}>Batal</AlertDialogCancel> <AlertDialogAction onClick={submitRevisionRequest} disabled={!revisionRemarks.trim() || isActionLoading}> {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Revisi </AlertDialogAction> </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showResubmitDialog} onOpenChange={setShowResubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Submit Ulang Approval (Revisi)</AlertDialogTitle><AlertDialogDescription>File: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong>. Anda dapat mengunggah file revisi baru jika ada.</AlertDialogDescription></AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="new-revision-file-revisi">Unggah File Revisi Baru (Opsional)</Label>
              <Input id="new-revision-file-revisi" type="file" className="mt-1" onChange={(e) => setNewRevisionFile(e.target.files ? e.target.files[0] : null)} disabled={isActionLoading} />
              {newRevisionFile && (<p className="mt-2 text-xs text-muted-foreground">File: {newRevisionFile.name} ({(newRevisionFile.size / 1024).toFixed(1)} KB)</p>)}
            </div>
          </div>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setShowResubmitDialog(false)} disabled={isActionLoading}>Batal</AlertDialogCancel><AlertDialogAction onClick={submitResubmissionForRevision} disabled={isActionLoading}>{isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Ulang</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      
      <AlertDialog open={showUpdateDocDialog} onOpenChange={setShowUpdateDocDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Ubah Dokumen & Minta Persetujuan Ulang</AlertDialogTitle><AlertDialogDescription>
              File <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong> akan diganti. Proses approval lama akan dibatalkan & permintaan baru dikirim.</AlertDialogDescription></AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="new-revision-file-revisi">Unggah Dokumen Baru</Label>
              <Input id="new-revision-file-revisi" type="file" className="mt-1" onChange={(e) => setNewRevisionFile(e.target.files ? e.target.files[0] : null)} disabled={isActionLoading} />
              {newRevisionFile && (<p className="mt-2 text-xs text-muted-foreground">File: {newRevisionFile.name} ({(newRevisionFile.size / 1024).toFixed(1)} KB)</p>)}
            </div>
          </div>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setShowUpdateDocDialog(false)} disabled={isActionLoading}>Batal</AlertDialogCancel><AlertDialogAction onClick={submitResubmissionForRevision} disabled={isActionLoading}>{isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Ulang</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* <AlertDialog open={showUpdateDocDialog} onOpenChange={setShowUpdateDocDialog}>
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
      </AlertDialog> */}

      <AlertDialog open={showViewMyActionDialog} onOpenChange={setShowViewMyActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader> <AlertDialogTitle>Detail Tindakan Anda</AlertDialogTitle> {currentUserAsApproverAction && (<AlertDialogDescription> Untuk file: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong> </AlertDialogDescription>)} </AlertDialogHeader>
          {currentUserAsApproverAction && (<div className="space-y-2 py-4 text-sm"> <div className="flex items-start"> <strong className="w-28 shrink-0">Status Anda:</strong> <span className={`font-semibold ${currentUserAsApproverAction.statusKey === 'approved' ? 'text-green-600' : currentUserAsApproverAction.statusKey === 'revised' ? 'text-orange-600' : currentUserAsApproverAction.statusKey === 'rejected' ? 'text-red-600' : 'text-muted-foreground'}`}> {currentUserAsApproverAction.statusDisplay} </span> </div> {currentUserAsApproverAction.remarks && (<div className="flex items-start"> <strong className="w-28 shrink-0">Catatan Anda:</strong> <p className="break-words whitespace-pre-wrap flex-1">{currentUserAsApproverAction.remarks}</p> </div>)} {currentUserAsApproverAction.actioned_at && (<div className="flex items-start"> <strong className="w-28 shrink-0">Ditindak pada:</strong> <span>{new Date(currentUserAsApproverAction.actioned_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span> </div>)} </div>)}
          <AlertDialogFooter> <AlertDialogAction onClick={() => setShowViewMyActionDialog(false)}>Tutup</AlertDialogAction> </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </TooltipProvider>
  )
}

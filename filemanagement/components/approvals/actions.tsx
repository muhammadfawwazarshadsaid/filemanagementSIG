// File: components/approvals/actions.tsx
"use client";

import React, { useState } from "react";
import { Row } from "@tanstack/react-table";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { 
  FileText as FileTextIcon, 
  Edit3, 
  CheckCircle, 
  MessageSquareWarning, 
  Send, 
  Info, 
  Undo2, 
  ShieldAlert, 
  History, 
  Loader2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { ProcessedApprovalRequest } from "./schema";
import { ApprovalsTableMeta } from "./columns";
import { Schema as RecentFileSchema } from "@/components/recentfiles/schema";


interface ProcessedApprovalActionsProps {
  row: Row<ProcessedApprovalRequest>;
  meta?: ApprovalsTableMeta;
}

export function ProcessedApprovalDataTableRowActions({ row, meta }: ProcessedApprovalActionsProps) {
  const approvalRequest = row.original;
  const currentUserId = meta?.userId;

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState("");
  const [showResubmitDialog, setShowResubmitDialog] = useState(false);
  const [resubmitNotes, setResubmitNotes] = useState("");
  const [showViewMyActionDialog, setShowViewMyActionDialog] = useState(false);

  const handlePreviewFile = () => {
    if (approvalRequest.file && approvalRequest.file.id && meta?.onSelectFileForPreview && meta?.onOpenPreviewSheet) {
      const fileForPreview: RecentFileSchema = {
        id: approvalRequest.file.id!,
        filename: approvalRequest.file.filename!,
        isFolder: false,
        mimeType: approvalRequest.file.mimeType || 'application/octet-stream',
        createdat: approvalRequest.createdAt,
        description: approvalRequest.file.description,
        pathname: `File ID: ${approvalRequest.fileIdRef}`,
        iconLink: approvalRequest.file.iconLink,
        lastmodified: approvalRequest.createdAt,
        pengesahan_pada: null,
        is_self_file: null,
        webViewLink: null,
      };
      meta.onSelectFileForPreview(fileForPreview);
      meta.onOpenPreviewSheet();
    } else {
      toast.info(`Preview file tidak tersedia untuk: ${approvalRequest.file?.filename || approvalRequest.fileIdRef}`);
    }
  };

  // --- LOGIKA APPROVER ---
  // Variabel currentUserAsApproverAction akan diperbarui ketika `row.original` diperbarui setelah `meta.onActionComplete()`
  const currentUserAsApproverAction = approvalRequest.approverActions.find(
    action => action.approverId === currentUserId
  );
  const isCurrentUserAnApprover = !!currentUserAsApproverAction;
  
  const canCurrentUserPerformInitialAction =
    currentUserAsApproverAction &&
    (currentUserAsApproverAction.statusKey === 'pending' ||
     currentUserAsApproverAction.statusKey === 'unknown');
  
  const hasCurrentUserActioned =
    currentUserAsApproverAction &&
    (currentUserAsApproverAction.statusKey === 'approved' ||
     currentUserAsApproverAction.statusKey === 'revised' ||
     currentUserAsApproverAction.statusKey === 'rejected');


  const handleSignEndorsementAction = async () => {
    if (!currentUserAsApproverAction || !meta?.makeApiCall || !currentUserId) {
      toast.error("Tidak dapat memproses: Informasi tidak lengkap."); return;
    }
    
    setIsActionLoading(true);
    const apiUrl = `/api/approvals/updatestatus?approvalId=${currentUserAsApproverAction.individualApprovalId}`;
    const payload = { status: "Sah", actioned_by_user_id: currentUserId };

    const promise = meta.makeApiCall(apiUrl, 'PUT', payload)
      .then(response => {
        if (response === undefined) {
          throw new Error("Respons tidak terduga dari server.");
        }
        return response;
      });

    toast.promise(promise, {
      loading: "Menandatangani pengesahan...",
      success: (response) => {
        meta.onActionComplete?.(); // Refresh data tabel
        // Setelah data di-refresh, currentUserAsApproverAction akan terupdate
        // Kita butuh sedikit delay atau cara untuk memastikan data sudah update sebelum dialog muncul
        // atau dialog membaca data yang mungkin belum terupdate.
        // Namun, seringkali re-render dari onActionComplete cukup cepat.
        setShowViewMyActionDialog(true); // Langsung tampilkan dialog
        return response === null ? "Pengesahan berhasil (tanpa konten balasan)." : "Pengesahan berhasil ditandatangani.";
      },
      error: (error) => error.message || "Gagal menandatangani pengesahan.",
      finally: () => setIsActionLoading(false)
    });
  };

  const submitRevisionRequest = async () => {
    if (!currentUserAsApproverAction || !meta?.makeApiCall || !currentUserId || !revisionRemarks.trim()) {
      toast.error("Catatan revisi wajib diisi."); return;
    }

    setIsActionLoading(true); 
    setShowRevisionDialog(false);
    const apiUrl = `/api/approvals/updatestatus?approvalId=${currentUserAsApproverAction.individualApprovalId}`;
    const payload = { status: "Perlu Revisi", remarks: revisionRemarks, actioned_by_user_id: currentUserId };

    const promise = meta.makeApiCall(apiUrl, 'PUT', payload)
      .then(response => {
        if (response === undefined) {
          throw new Error("Respons tidak terduga dari server.");
        }
        return response;
      });

    toast.promise(promise, {
      loading: "Mengirim permintaan revisi...",
      success: (response) => {
        meta.onActionComplete?.(); // Refresh data tabel
        setRevisionRemarks(""); 
        setShowViewMyActionDialog(true); // Langsung tampilkan dialog
        return response === null ? "Permintaan revisi berhasil diproses (tanpa konten balasan)." : "Permintaan revisi berhasil dikirim.";
      },
      error: (error) => {
        setRevisionRemarks(""); 
        return error.message || "Gagal mengirim permintaan revisi.";
      },
      finally: () => setIsActionLoading(false)
    });
  };


  // --- LOGIKA PENGAJU (ASSIGNER) ---
  const isCurrentUserAssigner = approvalRequest.assigner?.id === currentUserId;
  const canAssignerResubmit = isCurrentUserAssigner && approvalRequest.overallStatus === 'Perlu Revisi';
  const canAssignerManage = isCurrentUserAssigner &&
                           (approvalRequest.overallStatus === 'Menunggu Persetujuan' ||
                            approvalRequest.overallStatus === 'Perlu Revisi' ||
                            approvalRequest.overallStatus === 'Belum Ada Tindakan');

  const submitResubmission = async () => {
    if (!meta?.makeApiCall || !currentUserId ) {
        toast.error("Tidak dapat memproses: Informasi pengguna tidak lengkap."); return;
    }
     if (!approvalRequest.fileIdRef || !approvalRequest.fileWorkspaceIdRef || !approvalRequest.fileUserIdRef) {
        toast.error("Tidak dapat memproses: Informasi referensi file inti tidak lengkap."); return;
    }

    setIsActionLoading(true); 
    setShowResubmitDialog(false);
    const apiUrl = `/api/approvals/revisefile`;
    const payload = {
        file_id_ref: approvalRequest.fileIdRef,
        file_workspace_id_ref: approvalRequest.fileWorkspaceIdRef,
        file_user_id_ref: approvalRequest.fileUserIdRef,
        requested_by_user_id: currentUserId,
        new_revision_notes: resubmitNotes.trim() || `Berkas direvisi dan diajukan ulang.`,
    };

    const promise = meta.makeApiCall(apiUrl, 'POST', payload)
      .then(response => {
        if (response === undefined) {
            throw new Error("Respons tidak terduga dari server.");
        }
        return response;
      });

    toast.promise(promise, {
        loading: "Mengirim ulang approval...",
        success: (response) => {
            meta.onActionComplete?.();
            setResubmitNotes("");
            // Tidak menampilkan dialog "Lihat Tindakan Saya" untuk pengaju, karena ini aksi pengaju
            return response === null ? "Approval berhasil disubmit ulang (tanpa konten balasan)." : "Approval berhasil disubmit ulang.";
        },
        error: (error) => {
            setResubmitNotes("");
            return error.message || "Gagal submit ulang approval.";
        },
        finally: () => setIsActionLoading(false)
    });
  };

  const handleEditRequest = () => {
    toast.info(`Fitur "Ubah Pengajuan" untuk file ID: ${approvalRequest.fileIdRef} belum diimplementasikan.`);
  };
  const handleCancelRequest = async () => {
    toast.warning(`Fitur "Batalkan Pengajuan" untuk file ID: ${approvalRequest.fileIdRef} belum diimplementasikan.`);
  };


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted" disabled={isActionLoading}>
            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DotsHorizontalIcon className="h-4 w-4" />}
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[260px]">
          <DropdownMenuLabel>Opsi: {approvalRequest.file?.filename || approvalRequest.fileIdRef}</DropdownMenuLabel>
          
          {isCurrentUserAnApprover && (
            <>
              <DropdownMenuSeparator /> 
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center text-sm font-medium">
                  {hasCurrentUserActioned 
                    ? <History className="mr-2 h-4 w-4 text-gray-500" /> 
                    : <ShieldAlert className="mr-2 h-4 w-4 text-blue-500" />
                  }
                  {hasCurrentUserActioned ? "Tindakan Anda" : "Lakukan Tindakan"}
                </DropdownMenuLabel>
                
                {canCurrentUserPerformInitialAction && (
                  <>
                    <DropdownMenuItem onClick={() => setShowRevisionDialog(true)} disabled={isActionLoading}>
                      <MessageSquareWarning className="mr-2 h-4 w-4 text-orange-500" /> Minta Revisi
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignEndorsementAction} disabled={isActionLoading}>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Tandatangani Pengesahan
                    </DropdownMenuItem>
                  </>
                )}

                {hasCurrentUserActioned && (
                  <DropdownMenuItem onClick={() => setShowViewMyActionDialog(true)}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Lihat Detail Tindakan Saya
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </>
          )}

          {isCurrentUserAssigner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center text-sm font-medium">
                    <Edit3 className="mr-2 h-4 w-4 text-purple-500"/> Aksi Sebagai Pengaju
                </DropdownMenuLabel>
                {canAssignerResubmit && (
                    <DropdownMenuItem onClick={() => setShowResubmitDialog(true)} disabled={isActionLoading}>
                    <Send className="mr-2 h-4 w-4" /> Submit Ulang Approval
                    </DropdownMenuItem>
                )}
                {canAssignerManage && (
                    <>
                    <DropdownMenuItem onClick={handleEditRequest} disabled={isActionLoading}>
                        <Edit3 className="mr-2 h-4 w-4" /> Ubah Pengajuan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCancelRequest} className="text-red-600 focus:text-red-600 focus:bg-red-50/50 dark:focus:bg-red-700/30" disabled={isActionLoading}>
                        <Undo2 className="mr-2 h-4 w-4" /> Batalkan Pengajuan
                    </DropdownMenuItem>
                    </>
                )}
                {!canAssignerResubmit && !canAssignerManage && approvalRequest.overallStatus !== 'Menunggu Persetujuan' && approvalRequest.overallStatus !== 'Belum Ada Tindakan' && (
                     <DropdownMenuItem disabled>
                        <Info className="mr-2 h-4 w-4" /> Tidak ada aksi pengelolaan
                    </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </>
          )}

          {!isCurrentUserAnApprover && !isCurrentUserAssigner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Info className="mr-2 h-4 w-4" /> Tidak ada aksi untuk Anda
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog Minta Revisi */}
      <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Minta Revisi untuk File</AlertDialogTitle>
            <AlertDialogDescription>
              File: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong>
              <br/>
              Tuliskan catatan mengapa file ini memerlukan revisi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="revision-remarks" className="sr-only">Catatan Revisi</Label>
            <Textarea
              id="revision-remarks" value={revisionRemarks} onChange={(e) => setRevisionRemarks(e.target.value)}
              className="min-h-[100px]" placeholder="Contoh: Bagian X perlu diperjelas, data Y belum lengkap."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRevisionRemarks(""); setShowRevisionDialog(false); }}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={submitRevisionRequest} disabled={!revisionRemarks.trim() || isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Revisi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Submit Ulang Approval */}
       <AlertDialog open={showResubmitDialog} onOpenChange={setShowResubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Ulang Approval</AlertDialogTitle>
            <AlertDialogDescription>
              File: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong>
              <br/>
              Tambahkan catatan untuk pengajuan ulang ini (opsional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="resubmit-notes" className="sr-only">Catatan Pengajuan Ulang</Label>
            <Textarea
              id="resubmit-notes" value={resubmitNotes} onChange={(e) => setResubmitNotes(e.target.value)}
              className="min-h-[80px]" placeholder="Contoh: Revisi telah dilakukan sesuai permintaan."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setResubmitNotes(""); setShowResubmitDialog(false); }}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={submitResubmission} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Ulang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Lihat Tindakan Saya (Approver) */}
      <AlertDialog open={showViewMyActionDialog} onOpenChange={setShowViewMyActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Detail Tindakan Anda</AlertDialogTitle>
            {/* Konten dialog akan menggunakan currentUserAsApproverAction yang terbaru setelah data di-refresh */}
            {currentUserAsApproverAction && ( 
              <AlertDialogDescription>
                Untuk file: <strong>{approvalRequest.file?.filename || approvalRequest.fileIdRef}</strong>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {currentUserAsApproverAction && (
            <div className="space-y-2 py-4 text-sm">
              <div className="flex items-start">
                <strong className="w-28 shrink-0">Status Anda:</strong>
                <span className={`font-semibold ${
                    currentUserAsApproverAction.statusKey === 'approved' ? 'text-green-600' :
                    currentUserAsApproverAction.statusKey === 'revised' ? 'text-orange-600' :
                    currentUserAsApproverAction.statusKey === 'rejected' ? 'text-red-600' :
                    'text-muted-foreground'}`}>
                  {currentUserAsApproverAction.statusDisplay}
                </span>
              </div>
              {currentUserAsApproverAction.remarks && (
                <div className="flex items-start">
                  <strong className="w-28 shrink-0">Catatan Anda:</strong>
                  <p className="break-words whitespace-pre-wrap flex-1">{currentUserAsApproverAction.remarks}</p>
                </div>
              )}
              {currentUserAsApproverAction.actioned_at && (
                <div className="flex items-start">
                  <strong className="w-28 shrink-0">Ditindak pada:</strong>
                  <span>{new Date(currentUserAsApproverAction.actioned_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowViewMyActionDialog(false)}>Tutup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
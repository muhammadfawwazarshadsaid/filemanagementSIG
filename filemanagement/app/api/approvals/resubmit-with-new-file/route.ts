// File: app/api/approvals/resubmit-with-new-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { approval as ApprovalModel, file as FileModelPrisma, user as UserModelPrisma } from '@/lib/generated/prisma/client';
import { notifyApproverOnUpdate, NotificationType } from '@/lib/notifications'; // Pastikan path ini benar

export const dynamic = 'force-dynamic';

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function updateGoogleDriveFileWithNewContent(
  fileId: string,
  accessToken: string,
  newFile: File,
  gdriveFileName?: string,
  gdriveFileDescription?: string
): Promise<any> {
  console.log(`[API Resubmit] GDrive Resubmit: Requesting to update content for file ${fileId} with new file ${newFile.name}`);
  const metadata: { name: string; description?: string; mimeType: string } = {
    mimeType: newFile.type || 'application/octet-stream',
    name: gdriveFileName || newFile.name,
  };

  if (gdriveFileDescription !== undefined && gdriveFileDescription.trim() !== "") {
    metadata.description = gdriveFileDescription;
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', newFile);

  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,name,mimeType,description,webViewLink,iconLink`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: form,
  });

  console.log(`[API Resubmit] GDrive Resubmit: Status ${response.status} for file ${fileId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    console.error(`[API Resubmit] GDrive Resubmit Error Data:`, errorData);
    throw new Error(`Gagal update file di GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
  }
  return response.json();
}


export async function POST(request: NextRequest) {
  console.log("API /api/approvals/resubmit-with-new-file dipanggil");
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    console.warn("API Resubmit: Access token tidak ditemukan.");
    return NextResponse.json({ error: "Unauthorized: Access token tidak ditemukan." }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    console.error("API Resubmit: Gagal parse FormData:", e);
    return NextResponse.json({ error: "Request body tidak valid (harus FormData)." }, { status: 400 });
  }

  const oldFileIdRef = formData.get('old_file_id_ref') as string;
  const oldFileWorkspaceIdRef = formData.get('old_file_workspace_id_ref') as string;
  const approvalProcessId = formData.get('approval_process_id') as string; // Ini adalah sharedApprovalProcessCuid
  const requestedByUserId = formData.get('requested_by_user_id') as string;
  const newFile = formData.get('new_file') as File | null;
  // new_revision_notes dari formData tidak digunakan untuk remarks DB, hanya untuk notifikasi jika ada
  const explicitNotificationMessagePart = formData.get('new_revision_notes') as string | null;


  if (!oldFileIdRef || !oldFileWorkspaceIdRef || !approvalProcessId || !requestedByUserId) {
    return NextResponse.json({ error: "Data referensi file atau approval tidak lengkap." }, { status: 400 });
  }

  if (newFile && !(newFile instanceof File)) {
    return NextResponse.json({ error: "Format 'new_file' tidak valid." }, { status: 400 });
  }

  try {
    const firstApprovalOfProcess = await prisma.approval.findFirst({
      where: { id: approvalProcessId },
      include: {
        file: { select: { description: true, user_id: true /*, filename: true */ } }, // Ambil deskripsi file yang ada
        assigner: { select: { displayname: true, id: true } } // Ambil info assigner
      }
    });

    if (!firstApprovalOfProcess) {
      console.warn(`API Resubmit: Approval process ID ${approvalProcessId} tidak ditemukan.`);
      return NextResponse.json({ error: "Proses approval tidak ditemukan atau Anda tidak berhak." }, { status: 404 });
    }
    if (firstApprovalOfProcess.file_id_ref !== oldFileIdRef) {
        return NextResponse.json({ error: "File ID pada approval tidak cocok dengan file yang coba di-resubmit." }, { status: 400 });
    }
    if (firstApprovalOfProcess.assigned_by_user_id !== requestedByUserId) {
         return NextResponse.json({ error: "Anda tidak berhak mengirim ulang approval ini." }, { status: 403 });
    }

    let actualGdriveFileName: string = (firstApprovalOfProcess.file as any)?.filename || firstApprovalOfProcess.file?.description || oldFileIdRef; // Fallback
    let finalFileDescriptionForGdrive: string | undefined = firstApprovalOfProcess.file?.description || undefined;


    if (newFile) {
      console.log(`API Resubmit: Mengupdate konten GDrive file ID ${oldFileIdRef} dengan file baru: ${newFile.name}`);
      const gDriveUpdateResponse = await updateGoogleDriveFileWithNewContent(
        oldFileIdRef,
        accessToken,
        newFile,
        newFile.name, 
        finalFileDescriptionForGdrive
      );
      actualGdriveFileName = gDriveUpdateResponse.name || newFile.name;
      finalFileDescriptionForGdrive = gDriveUpdateResponse.description;
      console.log(`API Resubmit: File GDrive ID ${oldFileIdRef} berhasil diupdate. Nama baru di GDrive: ${actualGdriveFileName}`);
      
      if (finalFileDescriptionForGdrive !== undefined && finalFileDescriptionForGdrive !== firstApprovalOfProcess.file?.description) {
        await prisma.file.updateMany({
            where: { id: oldFileIdRef, workspace_id: oldFileWorkspaceIdRef },
            data: { description: finalFileDescriptionForGdrive, updated_at: new Date() },
        });
      }

    } else {
      if (firstApprovalOfProcess.file && accessToken) {
        try {
            const gDriveInfo = await fetch(`https://www.googleapis.com/drive/v3/files/${oldFileIdRef}?fields=name`, { headers: { 'Authorization': `Bearer ${accessToken}`}}).then(res => res.json());
            if (gDriveInfo.name) actualGdriveFileName = gDriveInfo.name;
        } catch (e) { console.warn("Gagal fetch nama file GDrive saat resubmit tanpa file baru"); }
      }
      console.log(`API Resubmit: Tidak ada file baru. Nama referensi file: ${actualGdriveFileName}`);
    }
    
    await prisma.file.updateMany({
        where: { id: oldFileIdRef, workspace_id: oldFileWorkspaceIdRef, user_id: firstApprovalOfProcess.file_user_id_ref },
        data: { updated_at: new Date(), pengesahan_pada: null },
    });

    const updatedApprovalsCount = await prisma.approval.updateMany({
      where: {
        id: approvalProcessId,
      },
      data: {
        status: "Belum Ditinjau",
        remarks: null, // Remarks direset menjadi null
        actioned_at: null,
        updated_at: new Date(),
      },
    });
    console.log(`API Resubmit: ${updatedApprovalsCount.count} approval terkait (ID Proses: ${approvalProcessId}) telah direset statusnya menjadi "Belum Ditinjau".`);

    if (updatedApprovalsCount.count > 0) {
        const approvalsToNotify = await prisma.approval.findMany({
            where: { id: approvalProcessId },
            include: { approver: true, assigner: true, file: true }
        });
        
        const assignerName = firstApprovalOfProcess.assigner?.displayname || `Pengaju (${requestedByUserId.substring(0,6)})`;

        for (const approval of approvalsToNotify) {
          if (approval.approver && approval.assigner && approval.file) {
              const fileIdentifierForNotif = actualGdriveFileName;
              const notificationMessage = explicitNotificationMessagePart || 
                (newFile 
                    ? `File telah direvisi oleh ${assignerName} yang sekarang bernama "${fileIdentifierForNotif}" dan menunggu tinjauan ulang Anda.`
                    : `File telah diajukan ulang oleh ${assignerName} yang sekarang bernama "${fileIdentifierForNotif}" dan menunggu tinjauan Anda.`);
              
              await notifyApproverOnUpdate(
                  approval as ApprovalModel & { assigner: UserModelPrisma; file: FileModelPrisma; approver: UserModelPrisma; },
                  fileIdentifierForNotif,
                  NotificationType.APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER,
                  notificationMessage
              );
          }
        }
    }

    return NextResponse.json({
      message: `Approval untuk file "${actualGdriveFileName}" berhasil dikirim ulang dan status approval telah direset.`,
      gdriveFileId: oldFileIdRef,
      updatedFileName: actualGdriveFileName,
    }, { status: 200 });

  } catch (error: any) {
    console.error("API Error /api/approvals/resubmit-with-new-file:", error.message, "\nSTACK:", error.stack);
    const clientErrorMessage = error.message.includes("GDrive") || error.message.includes("Prisma")
      ? error.message
      : "Terjadi kesalahan internal server saat memproses pengiriman ulang approval.";
    return NextResponse.json({ error: "Gagal memproses submit ulang approval.", details: clientErrorMessage }, { status: 500 });
  }
}
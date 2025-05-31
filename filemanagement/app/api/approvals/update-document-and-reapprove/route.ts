// File: app/api/approvals/update-document-and-reapprove/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import cuid from 'cuid';
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
  console.log(`[API UpdateDoc] GDrive Update: Updating content for file ${fileId} with ${newFile.name}`);
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
    method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("[API UpdateDoc] GDrive Update Error Data:", errorData);
    throw new Error(`Gagal update file di GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
  }
  return response.json();
}

interface UpdateDocAndReapproveBody {
  currentApprovalProcessCuidToCancel: string;
  fileIdRef: string;
  fileWorkspaceIdRef: string;
  fileUserIdRef: string;
  assignerUserId: string;
  approverUserIds: string[];
}

export async function POST(request: NextRequest) {
  console.log("API /api/approvals/update-document-and-reapprove dipanggil");
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized: Access token tidak ditemukan." }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    console.error("API UpdateDoc: Gagal parse FormData:", e);
    return NextResponse.json({ error: "Request body tidak valid (FormData diharapkan)." }, { status: 400 });
  }

  const jsonDataString = formData.get('jsonData') as string | null;
  if (!jsonDataString) {
    return NextResponse.json({ error: "Data JSON (jsonData) tidak ditemukan dalam FormData." }, { status: 400 });
  }
  
  let body: UpdateDocAndReapproveBody;
  try {
    body = JSON.parse(jsonDataString);
  } catch (e) {
    console.error("API UpdateDoc: Gagal parse jsonData:", e);
    return NextResponse.json({ error: "Format jsonData tidak valid." }, { status: 400 });
  }

  const newDocumentFile = formData.get('newDocumentFile') as File | null;

  const {
    currentApprovalProcessCuidToCancel,
    fileIdRef,
    fileWorkspaceIdRef,
    fileUserIdRef,
    assignerUserId,
    approverUserIds,
  } = body;

  if (!currentApprovalProcessCuidToCancel || !fileIdRef || !fileWorkspaceIdRef || !fileUserIdRef || !assignerUserId || !approverUserIds || approverUserIds.length === 0) {
    return NextResponse.json({ error: "Data JSON tidak lengkap." }, { status: 400 });
  }
  if (!newDocumentFile || !(newDocumentFile instanceof File)) {
    return NextResponse.json({ error: "File dokumen baru (newDocumentFile) wajib ada di FormData." }, { status: 400 });
  }

  try {
    const originalApprovalProcess = await prisma.approval.findFirst({
        where: { id: currentApprovalProcessCuidToCancel, assigned_by_user_id: assignerUserId },
    });
    if (!originalApprovalProcess) {
        return NextResponse.json({ error: "Proses approval asli tidak ditemukan atau Anda bukan pengaju asli." }, { status: 403 });
    }
    
    const existingFileRecord = await prisma.file.findUnique({
        where: { id_workspace_id_user_id: { id: fileIdRef, workspace_id: fileWorkspaceIdRef, user_id: fileUserIdRef }},
        select: { description: true }
    });

    console.log(`API UpdateDoc: Mengupdate GDrive file ID ${fileIdRef} dengan file ${newDocumentFile.name}`);
    const gDriveUpdateResponse = await updateGoogleDriveFileWithNewContent(
      fileIdRef, accessToken, newDocumentFile, undefined, existingFileRecord?.description || undefined
    );
    const updatedGdriveFileName = gDriveUpdateResponse.name || newDocumentFile.name;
    const updatedGdriveFileDescription = gDriveUpdateResponse.description;
    console.log(`API UpdateDoc: GDrive file ${fileIdRef} diupdate. Nama baru: ${updatedGdriveFileName}`);

    const fileUpdateData: { updated_at: Date; pengesahan_pada: null; description?: string | null } = {
      updated_at: new Date(),
      pengesahan_pada: null,
    };
    if (updatedGdriveFileDescription !== undefined && updatedGdriveFileDescription !== existingFileRecord?.description) {
      fileUpdateData.description = updatedGdriveFileDescription;
    } else if (updatedGdriveFileDescription === null && existingFileRecord?.description !== null) {
      fileUpdateData.description = null;
    }

    await prisma.file.updateMany({
      where: { id: fileIdRef, workspace_id: fileWorkspaceIdRef, user_id: fileUserIdRef },
      data: fileUpdateData,
    });
    console.log(`API UpdateDoc: Metadata file ${fileIdRef} di Prisma diupdate.`);

    const cancelledApprovals = await prisma.approval.updateMany({
      where: { id: currentApprovalProcessCuidToCancel },
      data: {
        status: "Dibatalkan (Digantikan)",
        remarks: "Proses approval digantikan oleh pengajuan baru dengan dokumen terupdate.",
        updated_at: new Date(),
        actioned_at: new Date(),
      },
    });
    console.log(`API UpdateDoc: ${cancelledApprovals.count} approval lama (CUID: ${currentApprovalProcessCuidToCancel}) dibatalkan.`);

    const newSharedApprovalProcessId = cuid();
    const approvalCreationData = approverUserIds.map(approverId => ({
      id: newSharedApprovalProcessId,
      file_id_ref: fileIdRef,
      file_workspace_id_ref: fileWorkspaceIdRef,
      file_user_id_ref: fileUserIdRef,
      approver_user_id: approverId,
      assigned_by_user_id: assignerUserId,
      status: "Belum Ditinjau",
      remarks: null, // Remarks awal di-set null
    }));

    const createdNewApprovals = await prisma.approval.createMany({
      data: approvalCreationData,
      skipDuplicates: true,
    });
    console.log(`API UpdateDoc: ${createdNewApprovals.count} approval baru dibuat dengan CUID proses ${newSharedApprovalProcessId}.`);

    if (createdNewApprovals.count > 0) {
        const newApprovalsForNotif = await prisma.approval.findMany({
            where: { id: newSharedApprovalProcessId },
            include: { assigner: true, file: true, approver: true }
        });
        for (const newApproval of newApprovalsForNotif) {
            if (newApproval.assigner && newApproval.file && newApproval.approver) {
                await notifyApproverOnUpdate(
                    newApproval as ApprovalModel & { assigner: UserModelPrisma; file: FileModelPrisma; approver: UserModelPrisma; },
                    updatedGdriveFileName,
                    NotificationType.APPROVAL_FILE_UPDATED_BY_ASSIGNER,
                    `Dokumen telah diperbarui oleh ${newApproval.assigner.displayname} yang sekarang bernama "${updatedGdriveFileName}" dan membutuhkan persetujuan ulang Anda.`
                );
            }
        }
    }

    return NextResponse.json({
      message: `Dokumen '${updatedGdriveFileName}' berhasil diperbarui. Permintaan persetujuan ulang telah dikirim.`,
      newApprovalProcessId: newSharedApprovalProcessId,
      updatedGdriveFileName: updatedGdriveFileName,
    }, { status: 200 });

  } catch (error: any) {
    console.error("API Error /update-document-and-reapprove:", error.message, "\nSTACK:", error.stack);
    const clientErrorMessage = error.message.includes("GDrive") || error.message.includes("Prisma")
      ? error.message : "Kesalahan server saat memperbarui dokumen dan meminta persetujuan ulang.";
    return NextResponse.json({ error: "Gagal memproses permintaan.", details: clientErrorMessage }, { status: 500 });
  }
}
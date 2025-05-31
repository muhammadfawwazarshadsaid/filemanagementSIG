// File: app/api/approvals/update-document-and-reapprove/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import cuid from 'cuid';
import type { approval as ApprovalModel, file as FileModelPrisma, user as UserModelPrisma } from '@/lib/generated/prisma/client';

export const dynamic = 'force-dynamic';

// --- Helper: Get Access Token ---
function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// --- Helper: Update Google Drive File Content & Metadata ---
async function updateGoogleDriveFileWithNewContent(
  fileId: string, // GDrive File ID yang akan diupdate
  accessToken: string,
  newFile: File, // File baru dari FormData
  // Nama dan deskripsi baru bisa diambil dari newFile.name atau parameter eksplisit
  gdriveFileName?: string,
  gdriveFileDescription?: string
): Promise<any> {
  console.log(`GDrive UpdateDoc: Updating content for file ${fileId} with ${newFile.name}`);
  const metadata: { name: string; description?: string; mimeType: string } = {
    mimeType: newFile.type || 'application/octet-stream',
    name: gdriveFileName || newFile.name,
  };
  if (gdriveFileDescription !== undefined) {
    metadata.description = gdriveFileDescription;
  }
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', newFile);
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`GDrive UpdateDoc Error:`, errorData);
    throw new Error(`Gagal update file di GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
  }
  return response.json();
}

// --- Placeholder Notifikasi ---
async function notifyApproverForReview(
    approval: ApprovalModel & { assigner: UserModelPrisma; file: FileModelPrisma; approver: UserModelPrisma; },
    fileIdentifier: string, isRevision: boolean, customMessage?: string
): Promise<void> {
    console.log(`NOTIFY (UpdateDoc & Re-approve): Approver ${approval.approver_user_id} for file ${fileIdentifier}. Message: "${customMessage}"`);
}

interface UpdateDocAndReapproveBody {
  currentApprovalProcessCuidToCancel: string;
  fileIdRef: string; // GDrive ID of the file to update
  fileWorkspaceIdRef: string;
  fileUserIdRef: string; // Original uploader/owner of the file record in 'file' table
  assignerUserId: string; // User performing this action
  approverUserIds: string[];
  newInitialRemarks?: string;
  // File baru akan ada di FormData, bukan di JSON body
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

  // Ambil data JSON dari field 'jsonData' (atau nama lain yang disepakati)
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
    fileIdRef, // Ini adalah GDrive ID
    fileWorkspaceIdRef,
    fileUserIdRef,
    assignerUserId,
    approverUserIds,
    newInitialRemarks,
  } = body;

  // Validasi Input
  if (!currentApprovalProcessCuidToCancel || !fileIdRef || !fileWorkspaceIdRef || !fileUserIdRef || !assignerUserId || !approverUserIds || approverUserIds.length === 0) {
    return NextResponse.json({ error: "Data JSON tidak lengkap." }, { status: 400 });
  }
  if (!newDocumentFile || !(newDocumentFile instanceof File)) {
    return NextResponse.json({ error: "File dokumen baru (newDocumentFile) wajib ada di FormData." }, { status: 400 });
  }

  try {
    // Validasi assigner (misalnya, pastikan dia adalah assigner asli dari proses yang dibatalkan)
    const originalApprovalProcess = await prisma.approval.findFirst({
        where: { id: currentApprovalProcessCuidToCancel, assigned_by_user_id: assignerUserId },
    });
    if (!originalApprovalProcess) {
        return NextResponse.json({ error: "Proses approval asli tidak ditemukan atau Anda bukan pengaju asli." }, { status: 403 });
    }

    // 1. Update File di Google Drive
    console.log(`API UpdateDoc: Mengupdate GDrive file ID ${fileIdRef} dengan file ${newDocumentFile.name}`);
    const gDriveUpdateResponse = await updateGoogleDriveFileWithNewContent(
      fileIdRef, accessToken, newDocumentFile
    );
    const updatedGdriveFileName = gDriveUpdateResponse.name || newDocumentFile.name;
    const updatedGdriveFileDescription = gDriveUpdateResponse.description; // Bisa null
    console.log(`API UpdateDoc: GDrive file ${fileIdRef} diupdate. Nama baru: ${updatedGdriveFileName}`);

    // 2. Update Metadata File di Prisma
    // Hanya update deskripsi, karena 'filename' tidak ada di model 'file' Anda
    // Nama file yang sebenarnya ada di GDrive dan bisa diambil dari sana jika perlu ditampilkan.
    const fileUpdateData: { updated_at: Date; pengesahan_pada: null; description?: string | null } = {
      updated_at: new Date(),
      pengesahan_pada: null, // Reset tanggal pengesahan
    };
    if (updatedGdriveFileDescription !== undefined) { // Hanya update jika ada nilai (termasuk null atau string kosong)
      fileUpdateData.description = updatedGdriveFileDescription;
    }
    await prisma.file.updateMany({
      where: { id: fileIdRef, workspace_id: fileWorkspaceIdRef }, // Update semua record file terkait GDrive ID ini di workspace
      data: fileUpdateData,
    });
    console.log(`API UpdateDoc: Metadata file ${fileIdRef} di Prisma diupdate.`);

    // 3. Batalkan Proses Approval Lama
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

    // 4. Buat Proses Approval Baru
    const newSharedApprovalProcessId = cuid();
    const approvalCreationData = approverUserIds.map(approverId => ({
      id: newSharedApprovalProcessId,
      file_id_ref: fileIdRef, // Tetap GDrive ID yang sama (kontennya sudah baru)
      file_workspace_id_ref: fileWorkspaceIdRef,
      file_user_id_ref: fileUserIdRef, // Owner asli dari file record
      approver_user_id: approverId,
      assigned_by_user_id: assignerUserId,
      status: "Belum Ditinjau",
      remarks: null,
    }));

    const createdNewApprovals = await prisma.approval.createMany({
      data: approvalCreationData,
      skipDuplicates: true, // Jaga-jaga jika ada kombinasi id-approver_user_id yang sama (seharusnya tidak karena CUID baru)
    });
    console.log(`API UpdateDoc: ${createdNewApprovals.count} approval baru dibuat dengan CUID proses ${newSharedApprovalProcessId}.`);


    // 5. Kirim Notifikasi
    if (createdNewApprovals.count > 0) {
        const newApprovalsForNotif = await prisma.approval.findMany({
            where: { id: newSharedApprovalProcessId },
            include: { assigner: true, file: true, approver: true }
        });
        for (const newApproval of newApprovalsForNotif) {
            if (newApproval.assigner && newApproval.file && newApproval.approver) {
                await notifyApproverForReview(
                    newApproval as ApprovalModel & { assigner: UserModelPrisma; file: FileModelPrisma; approver: UserModelPrisma; },
                    updatedGdriveFileName, false,
                    newInitialRemarks || `Dokumen ${updatedGdriveFileName} telah diperbarui. Mohon persetujuan ulang.`
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
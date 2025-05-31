import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { notifyApproverForReview } from '@/lib/notifications'; // Sesuaikan path
import type { approval as ApprovalModel, file as FileModelPrisma, user as UserModelPrisma } from '@/lib/generated/prisma/client'; // Sesuaikan path jika perlu

export const dynamic = 'force-dynamic';

// --- Fungsi Helper: Dapatkan Access Token ---
function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// --- Fungsi Helper: Update Konten & Metadata File Google Drive ---
async function updateGoogleDriveFileWithNewContent(
  fileId: string,
  accessToken: string,
  newFile: File,
  gdriveFileName?: string,
  gdriveFileDescription?: string
): Promise<any> {
  console.log(`GDrive Resubmit: Requesting to update content for file ${fileId} with new file ${newFile.name}`);

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
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: form,
  });

  console.log(`GDrive Resubmit: Status ${response.status} for file ${fileId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    console.error(`GDrive Resubmit Error Data:`, errorData); // Log error data
    throw new Error(`Gagal update file di GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
  }
  return response.json();
}

// Placeholder untuk fungsi notifikasi
async function notifyApproverForReview(
    approval: ApprovalModel & { assigner: UserModelPrisma; file: FileModelPrisma; approver: UserModelPrisma; },
    fileIdentifier: string,
    isRevision: boolean,
    customMessage?: string
): Promise<void> {
    console.log(`Placeholder: Notifying approver ${approval.approver_user_id} for file ${fileIdentifier}. Message: ${customMessage}`);
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
  const approvalProcessId = formData.get('approval_process_id') as string;
  const requestedByUserId = formData.get('requested_by_user_id') as string;
  const newRevisionNotes = formData.get('new_revision_notes') as string | null;
  const newFile = formData.get('new_file') as File | null;

  if (!oldFileIdRef || !oldFileWorkspaceIdRef || !approvalProcessId || !requestedByUserId) {
    return NextResponse.json({ error: "Data referensi file atau approval tidak lengkap." }, { status: 400 });
  }
  if (!newFile && (!newRevisionNotes || newRevisionNotes.trim() === "")) {
    return NextResponse.json({ error: "File revisi baru atau catatan revisi wajib diisi." }, { status: 400 });
  }
  if (newFile && !(newFile instanceof File)) {
    return NextResponse.json({ error: "Format 'new_file' tidak valid." }, { status: 400 });
  }

  try {
    const firstApprovalOfProcess = await prisma.approval.findFirst({
      where: { id: approvalProcessId },
      include: {
        file: {
            select: {
                // filename: true, // Hanya jika 'filename' ada di model Prisma 'file' Anda
                description: true,
                // Sertakan field lain yang mungkin Anda perlukan untuk fallback nama
            }
        }
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

    let actualGdriveFileName: string; // Nama file yang akan digunakan untuk notifikasi dan pesan sukses
    let actualGdriveFileDescription: string | undefined | null = firstApprovalOfProcess.file?.description;

    if (newFile) {
      console.log(`API Resubmit: Mengupdate konten GDrive file ID ${oldFileIdRef} dengan file baru: ${newFile.name}`);
      const gDriveUpdateResponse = await updateGoogleDriveFileWithNewContent(
        oldFileIdRef,
        accessToken,
        newFile
      );
      actualGdriveFileName = gDriveUpdateResponse.name || newFile.name;
      actualGdriveFileDescription = gDriveUpdateResponse.description;
      console.log(`API Resubmit: File GDrive ID ${oldFileIdRef} berhasil diupdate. Nama baru di GDrive: ${actualGdriveFileName}`);
    } else {
      // Tidak ada file baru, nama file di GDrive tidak berubah. Gunakan nama yang ada untuk referensi.
      // Jika Anda menyimpan nama file di DB 'file.filename', ambil dari sana. Jika tidak, gunakan deskripsi atau ID.
      actualGdriveFileName = // firstApprovalOfProcess.file?.filename || // Jika ada 'filename' di model Anda
                           firstApprovalOfProcess.file?.description ||
                           oldFileIdRef;
      console.log(`API Resubmit: Tidak ada file baru. Nama referensi file: ${actualGdriveFileName}`);
    }

    // --- MODIFIED SECTION START ---
    // Update metadata file di Prisma. HANYA sertakan field yang ADA di model Prisma 'file' Anda.
    const updateFilePayload: {
        updated_at: Date;
        pengesahan_pada: null;
        description?: string | null; // 'description' ada di skema Anda
        // 'filename' DIHAPUS dari sini jika tidak ada di model Prisma 'file'
    } = {
      updated_at: new Date(),
      pengesahan_pada: null,
    };

    // Hanya update deskripsi jika ada nilai baru (bisa string kosong atau null untuk menghapus)
    if (actualGdriveFileDescription !== undefined) {
        updateFilePayload.description = actualGdriveFileDescription;
    }
    // --- MODIFIED SECTION END ---

    await prisma.file.updateMany({
        where: {
            id: oldFileIdRef,
            workspace_id: oldFileWorkspaceIdRef,
        },
        data: updateFilePayload,
    });
    console.log(`API Resubmit: Metadata file (ID: ${oldFileIdRef}, Workspace: ${oldFileWorkspaceIdRef}) di Prisma diupdate.`);

    const updatedApprovalsCount = await prisma.approval.updateMany({
      where: {
        id: approvalProcessId,
      },
      data: {
        status: "Belum Ditinjau",
        remarks: newRevisionNotes || "File telah diperbarui oleh pengaju. Mohon tinjau ulang.",
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

        for (const approval of approvalsToNotify) {
          if (approval.approver && approval.assigner && approval.file) {
              const fileIdentifier = actualGdriveFileName; // Gunakan nama file dari GDrive
              const typedApproval = approval as ApprovalModel & {
                  assigner: UserModelPrisma;
                  file: FileModelPrisma;
                  approver: UserModelPrisma;
              };
              await notifyApproverForReview(
                  typedApproval,
                  fileIdentifier,
                  true,
                  newRevisionNotes || "File telah diperbarui. Mohon tinjau ulang."
              );
          }
        }
    }

    return NextResponse.json({
      message: `Approval untuk file "${actualGdriveFileName}" berhasil dikirim ulang dan status approval telah direset.`,
      gdriveFileId: oldFileIdRef,
      updatedFileName: actualGdriveFileName, // Nama file yang berhasil diupdate di GDrive
    }, { status: 200 });

  } catch (error: any) {
    console.error("API Error /api/approvals/resubmit-with-new-file:", error.message, "\nSTACK:", error.stack); // Cetak stack trace!
    const clientErrorMessage = error.message.includes("GDrive") || error.message.includes("Prisma")
      ? error.message
      : "Terjadi kesalahan internal server saat memproses pengiriman ulang approval."; // Pesan lebih spesifik
    return NextResponse.json({ error: "Gagal memproses submit ulang approval.", details: clientErrorMessage }, { status: 500 });
  }
}
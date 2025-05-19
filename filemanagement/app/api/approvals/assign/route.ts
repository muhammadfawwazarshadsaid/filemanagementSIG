// File: app/api/approvals/assign/route.ts
// Endpoint ini membuat record approval BARU.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Menggunakan instance Prisma shared
import type { approval as ApprovalModel, file as FileModel, user as UserModel } from '@/lib/generated/prisma/client'; // Tipe dari Prisma Client
import { notifyApproverForReview } from '@/lib/notifications'; // Pastikan path ini benar
import cuid from 'cuid'; // Import cuid untuk menghasilkan ID

interface AssignRequestBody {
  file_id_ref: string;
  file_workspace_id_ref: string;
  file_user_id_ref: string;
  approverUserIds: string[];
  assigned_by_user_id: string;
  initial_remarks?: string;
  is_revision_cycle?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AssignRequestBody;
    const {
      file_id_ref,
      file_workspace_id_ref,
      file_user_id_ref,
      approverUserIds,
      assigned_by_user_id,
      initial_remarks,
      is_revision_cycle
    } = body;

    // --- Validasi Input Dasar ---
    if (!file_id_ref || !file_workspace_id_ref || !file_user_id_ref) {
      return NextResponse.json({ error: "Identifikasi file (file_id_ref, file_workspace_id_ref, file_user_id_ref) wajib diisi." }, { status: 400 });
    }
    if (!assigned_by_user_id) {
      return NextResponse.json({ error: "assigned_by_user_id wajib diisi." }, { status: 400 });
    }
    if (!Array.isArray(approverUserIds) || approverUserIds.length === 0) {
      return NextResponse.json({ error: "approverUserIds harus berupa array yang tidak kosong." }, { status: 400 });
    }
    if (approverUserIds.some(id => typeof id !== 'string' || !id.trim())) {
      return NextResponse.json({ error: "Setiap ID dalam approverUserIds harus berupa string yang valid." }, { status: 400 });
    }

    // --- Validasi Admin yang menugaskan ---
    const assigner = await prisma.user.findUnique({
      where: { id: assigned_by_user_id },
    });
    if (!assigner || !assigner.is_admin) {
      return NextResponse.json({ error: "Hanya admin yang dapat menugaskan approval." }, { status: 403 });
    }

    // --- Validasi File ---
    const fileExists = await prisma.file.findUnique({
      where: {
        id_workspace_id_user_id: {
          id: file_id_ref,
          workspace_id: file_workspace_id_ref,
          user_id: file_user_id_ref
        }
      }
    });
    if (!fileExists) {
      return NextResponse.json({ error: "File yang akan diapprove tidak ditemukan." }, { status: 404 });
    }

    const fileIdentifier = fileExists.description || `Berkas ID: ${fileExists.id}`;
    const sharedApprovalProcessId = cuid();

    const approvalCreationData = approverUserIds.map((approverId: string) => ({
      id: sharedApprovalProcessId,
      file_id_ref,
      file_workspace_id_ref,
      file_user_id_ref,
      approver_user_id: approverId,
      assigned_by_user_id,
      status: "Belum Ditinjau",
      remarks: initial_remarks || null, // Pastikan remarks adalah string atau null
    }));

    // Mendefinisikan tipe untuk hasil yang sukses dengan lebih akurat
    type SuccessfulAssignment = ApprovalModel & {
        assigner: UserModel; // Asumsikan assigner selalu ada jika validasi lolos
        file: FileModel;   // Asumsikan file selalu ada jika validasi lolos
    };

    const successfulAssignments: SuccessfulAssignment[] = [];
    const failedAssignments: { approverId: string; error: string; details?: string }[] = [];

    for (const data of approvalCreationData) {
        try {
            const newApproval = await prisma.approval.create({
                data,
                include: {
                    assigner: true, // include untuk mendapatkan data assigner
                    file: true      // include untuk mendapatkan data file
                }
            });
            // Cast tipe setelah memastikan include berhasil
            successfulAssignments.push(newApproval as SuccessfulAssignment);
        } catch (error: any) {
            const approverIdForFailed = data.approver_user_id;
            console.error(`Gagal menugaskan approver ${approverIdForFailed} untuk approval process ID ${sharedApprovalProcessId}:`, error);
            let errorMessage = `Gagal menugaskan approver ID: ${approverIdForFailed} untuk approval process ID: ${sharedApprovalProcessId}.`;
            if (error?.code === 'P2002') {
              errorMessage = `Terjadi duplikasi saat menugaskan approver ID: ${approverIdForFailed} (Constraint PK (id, approver_user_id) terlanggar).`;
            } else if (error?.code === 'P2003') {
              errorMessage = `Approver ID: ${approverIdForFailed} atau Assigner ID tidak valid atau referensi file tidak ditemukan.`;
            }
            failedAssignments.push({
              approverId: approverIdForFailed,
              error: errorMessage,
              details: error?.message,
            });
        }
    }

    for (const newApproval of successfulAssignments) {
      const isRevision = is_revision_cycle === true || (!!initial_remarks && initial_remarks.length > 0);
      // Pastikan newApproval.assigner dan newApproval.file ada sebelum mengirim notifikasi
      if (newApproval.assigner && newApproval.file) {
        await notifyApproverForReview(newApproval, fileIdentifier, isRevision);
      } else {
        console.warn(`Tidak bisa mengirim notifikasi untuk approval ID ${newApproval.id} karena data assigner atau file tidak lengkap.`);
      }
    }
    
    const responseBase = {
      workspace_id: file_workspace_id_ref,
      file_id: file_id_ref,
      requested_by: assigned_by_user_id,
      approval_process_id: sharedApprovalProcessId,
    };

    if (failedAssignments.length > 0 && successfulAssignments.length === 0) {
      return NextResponse.json({
        ...responseBase,
        message: "Gagal menugaskan semua approver yang diminta.",
        approvers_assigned: [],
        failed_assignments: failedAssignments
      }, { status: 400 });
    }
    if (failedAssignments.length > 0) {
      return NextResponse.json({
        ...responseBase,
        message: `Berhasil menugaskan ${successfulAssignments.length} approver. Namun, ${failedAssignments.length} penugasan gagal.`,
        approvers_assigned: successfulAssignments.map(sa => ({
          approval_id: sa.id,
          approver_user_id: sa.approver_user_id,
          status: sa.status
        })),
        failed_assignments: failedAssignments
      }, { status: 207 }); // Partial success
    }

    return NextResponse.json({
      ...responseBase,
      message: `Berhasil menugaskan ${successfulAssignments.length} approver.`,
      approvers_assigned: successfulAssignments.map(sa => ({
        approval_id: sa.id,
        approver_user_id: sa.approver_user_id,
        status: sa.status
      })),
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error di API endpoint /api/approvals/assign:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Request body tidak valid (bukan JSON).' }, { status: 400 });
    }
    // Hindari mengirim error.message secara langsung ke client di produksi kecuali untuk debugging
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: "Terjadi kesalahan tak terduga di server.", details: errorMessage }, { status: 500 });
  }
  // Dengan instance Prisma shared dari lib/prisma.ts (pola global),
  // pemanggilan $disconnect() di sini mungkin tidak diperlukan atau bahkan kontraproduktif
  // karena Anda ingin instance tersebut tetap ada untuk request berikutnya (terutama di development).
  // Prisma dan Vercel biasanya mengelola siklus hidup koneksi.
  // finally {
  //   await prisma.$disconnect();
  // }
}
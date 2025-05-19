// File: app/api/approvals/assign/route.ts
// Endpoint ini membuat record approval BARU.
// Cocok untuk penugasan awal atau untuk memulai siklus approval baru untuk file yang direvisi.

import { notifyApproverForReview } from '@/lib/notifications'; // Pastikan path ini benar
import { NextRequest, NextResponse } from 'next/server'; // Menggunakan NextRequest
import { PrismaClient, type approval as ApprovalModel, type file as FileModel, type user as UserModel } from '@/lib/generated/prisma/client';
import cuid from 'cuid'; // Import cuid untuk menghasilkan ID

interface AssignRequestBody {
  file_id_ref: string;
  file_workspace_id_ref: string;
  file_user_id_ref: string;
  approverUserIds: string[];
  assigned_by_user_id: string;
  initial_remarks?: string; // Opsional: Catatan dari admin saat menugaskan (terutama untuk revisi)
  is_revision_cycle?: boolean; // Opsional: Flag eksplisit dari client jika ini adalah siklus revisi
}

const prisma = new PrismaClient(); // Pastikan PrismaClient diimport dengan benar
export async function POST(request: NextRequest) { // Menggunakan NextRequest
  try {
    const body = await request.json() as AssignRequestBody;
    const {
      file_id_ref,
      file_workspace_id_ref,
      file_user_id_ref,
      approverUserIds,
      assigned_by_user_id,
      initial_remarks,
      is_revision_cycle // Mengambil flag dari body
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

    // Hasilkan SATU ID yang akan digunakan bersama untuk semua entri approval dalam batch ini.
    // ID ini akan menjadi bagian 'id' dari composite primary key @@id([id, approver_user_id]).
    const sharedApprovalProcessId = cuid(); // <-- Perubahan: Hasilkan ID di sini

    // Membuat data untuk setiap approval baru
    const approvalCreationData = approverUserIds.map((approverId: string) => ({
      id: sharedApprovalProcessId, // <-- Perubahan: Gunakan ID yang sama
      file_id_ref,
      file_workspace_id_ref,
      file_user_id_ref,
      approver_user_id: approverId, // Ini akan membedakan record dalam composite PK
      assigned_by_user_id,
      status: "Belum Ditinjau",
      remarks: initial_remarks || null,
    }));

    const successfulAssignments: Array<ApprovalModel & { assigner: UserModel | null, file: FileModel | null }> = [];
    const failedAssignments: { approverId: string; error: string; details?: string }[] = [];

    for (const data of approvalCreationData) {
        try {
            // 'data' sekarang menyertakan 'id' yang sudah dihasilkan sebelumnya (sharedApprovalProcessId)
            const newApproval = await prisma.approval.create({
                data,
                include: { assigner: true, file: true }
            });
            successfulAssignments.push(newApproval as ApprovalModel & { assigner: UserModel; file: FileModel });
        } catch (error: any) {
            const approverIdForFailed = data.approver_user_id;
            console.error(`Gagal menugaskan approver ${approverIdForFailed} untuk approval process ID ${sharedApprovalProcessId}:`, error);
            let errorMessage = `Gagal menugaskan approver ID: ${approverIdForFailed} untuk approval process ID: ${sharedApprovalProcessId}.`;
            if (error?.code === 'P2002') { // Pelanggaran unique constraint
              errorMessage = `Terjadi duplikasi saat menugaskan approver ID: ${approverIdForFailed} untuk approval process ID: ${sharedApprovalProcessId}. Constraint PK (id, approver_user_id) terlanggar.`;
            } else if (error?.code === 'P2003') { // Pelanggaran foreign key constraint
              errorMessage = `Approver ID: ${approverIdForFailed} atau Assigner ID tidak valid atau tidak ditemukan.`;
            }
            failedAssignments.push({
              approverId: approverIdForFailed,
              error: errorMessage,
              details: error?.message,
            });
        }
    }

    for (const newApproval of successfulAssignments) {
      // 'newApproval.id' sekarang akan menjadi sharedApprovalProcessId
      const isRevision = is_revision_cycle === true || (!!initial_remarks && initial_remarks.length > 0);
      await notifyApproverForReview(newApproval, fileIdentifier, isRevision);
    }
    
    const responseBase = {
      workspace_id: file_workspace_id_ref,
      file_id: file_id_ref,
      requested_by: assigned_by_user_id,
      // Anda bisa juga mengembalikan shared ID ini di level atas jika berguna untuk client
      // approval_process_id: sharedApprovalProcessId, 
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
          approval_id: sa.id, // Ini sekarang akan menjadi sharedApprovalProcessId
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
        approval_id: sa.id, // Ini sekarang akan menjadi sharedApprovalProcessId
        approver_user_id: sa.approver_user_id,
        status: sa.status
      })),
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error di API endpoint /approvals/assign:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Request body tidak valid (bukan JSON).' }, { status: 400 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan tak terduga di server.", details: error.message }, { status: 500 });
  }
}
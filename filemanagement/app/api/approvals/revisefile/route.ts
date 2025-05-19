// File: app/api/approvals/revisefile/route.ts
// Endpoint ini bertujuan untuk MERESET record approval yang sudah ada (yang statusnya "Perlu Revisi")
// kembali ke "Belum Ditinjau". Ini akan MENIMPA remarks dan actioned_at pada record approval tersebut.

import { notifyApproverForReview } from '@/lib/notifications'; // Pastikan path ini benar
import { NextResponse } from 'next/server';
import { PrismaClient, type approval as ApprovalModel, type file as FileModel, type user as UserModel } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

interface ResetApprovalRequestBody {
  file_id_ref: string;
  file_workspace_id_ref: string;
  file_user_id_ref: string;
  requested_by_user_id: string;
  new_revision_notes?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ResetApprovalRequestBody;
    const {
      file_id_ref,
      file_workspace_id_ref,
      file_user_id_ref,
      requested_by_user_id,
      new_revision_notes
    } = body;

    // --- Validasi Input Dasar ---
    if (!file_id_ref || !file_workspace_id_ref || !file_user_id_ref || !requested_by_user_id) {
      return NextResponse.json({ error: "file_id_ref, file_workspace_id_ref, file_user_id_ref, dan requested_by_user_id wajib diisi." }, { status: 400 });
    }

    // --- Validasi Admin ---
    const requester = await prisma.user.findUnique({
      where: { id: requested_by_user_id },
    });
    if (!requester || !requester.is_admin) {
      return NextResponse.json({ error: "Hanya admin yang dapat mereset approval." }, { status: 403 });
    }

    // --- Dapatkan file untuk info ---
    const fileToUpdate = await prisma.file.findUnique({ // Nama variabel tetap, tapi tidak ada update revision_count
        where: {
            id_workspace_id_user_id: {
                id: file_id_ref,
                workspace_id: file_workspace_id_ref,
                user_id: file_user_id_ref,
            }
        }
    });

    if (!fileToUpdate) {
        return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
    }
    const fileIdentifier = fileToUpdate.description || `Berkas ID: ${fileToUpdate.id}`;


    // --- Cari semua approval untuk file ini yang statusnya "Perlu Revisi" ---
    const approvalsToReset = await prisma.approval.findMany({
      where: {
        file_id_ref,
        file_workspace_id_ref,
        file_user_id_ref,
        status: "Perlu Revisi",
      },
      include: {
        assigner: true,
        approver: true,
        file: true,
      }
    });

    if (approvalsToReset.length === 0) {
      return NextResponse.json({ message: "Tidak ada approval yang perlu direset (status 'Perlu Revisi') untuk berkas ini.", approvals_reset: [] }, { status: 200 });
    }

    const resetPromises = approvalsToReset.map(approval =>
      prisma.approval.update({
        where: {
        id_approver_user_id: { // Menggunakan format compound key
          id: approval.id,
          approver_user_id: approval.approver_user_id
        }
      },
        data: {
          status: "Belum Ditinjau",
          remarks: new_revision_notes || `Berkas telah direvisi oleh ${requester.displayname || requester.id}. Mohon ditinjau kembali.`,
          actioned_at: null,
        },
        include: { assigner: true, approver: true, file: true }
      })
    );

    const updatedApprovals = (await prisma.$transaction(resetPromises)) as Array<ApprovalModel & { assigner: UserModel; approver: UserModel; file: FileModel }>;

    for (const updatedApproval of updatedApprovals) {
      await notifyApproverForReview(updatedApproval, fileIdentifier, true); // isRevision = true
    }

    // --- HAPUS BAGIAN UPDATE REVISION_COUNT ---
    // await prisma.file.update({
    //     where: {
    //         id_workspace_id_user_id: {
    //             id: file_id_ref,
    //             workspace_id: file_workspace_id_ref,
    //             user_id: file_user_id_ref,
    //         }
    //     },
    //     data: {
    //         revision_count: { increment: 1 } // INI DIHAPUS
    //     }
    // });


    return NextResponse.json({
      message: `${updatedApprovals.length} approval berhasil direset ke status 'Belum Ditinjau' untuk berkas ${file_id_ref}. Notifikasi telah dikirim ke approver.`,
      approvals_reset: updatedApprovals.map(a => ({ id: a.id, approver_user_id: a.approver_user_id, new_status: a.status })),
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error saat mereset approval:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Request body tidak valid (bukan JSON).' }, { status: 400 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan tak terduga di server saat mereset approval.", details: error.message }, { status: 500 });
  }
}

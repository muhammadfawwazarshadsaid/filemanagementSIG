// File: app/api/approvals/updatestatus/route.ts
// PASTIKAN FILE INI BERADA DI PATH: app/api/approvals/updatestatus/route.ts
// (BUKAN di dalam folder [approvalId])

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Pastikan path ini benar
import { notifyAssignerOnApprovalAction } from '@/lib/notifications'; // Pastikan path ini benar

interface UpdateStatusRequestBody {
  sharedApprovalProcessCuid: string; // ID proses approval bersama
  approverUserId: string;            // ID user yang melakukan aksi (approver)
  status: string;                    // Status baru: "Sah" atau "Perlu Revisi"
  remarks?: string;                   // Remarks, wajib jika status "Perlu Revisi"
}

const ALLOWED_ACTION_STATUSES = ["Sah", "Perlu Revisi"];

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as UpdateStatusRequestBody;
    const { sharedApprovalProcessCuid, approverUserId, status, remarks } = body;

    if (!sharedApprovalProcessCuid || !approverUserId || !status) {
      return NextResponse.json({ error: "sharedApprovalProcessCuid, approverUserId, dan status wajib diisi." }, { status: 400 });
    }

    if (!ALLOWED_ACTION_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status tidak valid. Status yang diizinkan: ${ALLOWED_ACTION_STATUSES.join(', ')}.` }, { status: 400 });
    }

    if (status === "Perlu Revisi" && (!remarks || remarks.trim() === "")) {
      return NextResponse.json({ error: "Remarks wajib diisi jika status adalah 'Perlu Revisi'." }, { status: 400 });
    }

    // Cari approval berdasarkan CUID proses dan ID approver
    const existingApproval = await prisma.approval.findUnique({
      where: {
        id_approver_user_id: { // Menggunakan compound key dari skema Prisma
          id: sharedApprovalProcessCuid,       // Ini adalah CUID proses approval
          approver_user_id: approverUserId,  // Ini adalah ID user approver
        }
      },
      include: { file: true, approver: true, assigner: true } // Include assigner untuk notifikasi
    });

    if (!existingApproval) {
      return NextResponse.json({ error: "Approval tidak ditemukan atau Anda tidak memiliki akses ke approval ini." }, { status: 404 });
    }

    // Validasi tambahan jika diperlukan (misalnya, tidak bisa mengubah status jika sudah final)
    if (existingApproval.status === "Sah" && status !== "Sah") { // Contoh: tidak bisa diubah dari Sah ke Perlu Revisi
      return NextResponse.json({ error: `Approval sudah dalam status final ('Sah') dan tidak dapat diubah ke '${status}'.` }, { status: 400 });
    }
    // Anda bisa menambahkan lebih banyak logika transisi status di sini jika perlu

    const updatedApproval = await prisma.approval.update({
      where: {
        id_approver_user_id: {
          id: sharedApprovalProcessCuid,
          approver_user_id: approverUserId,
        }
      },
      data: {
        status,
        remarks: status === "Perlu Revisi" ? remarks : (status === "Sah" ? (remarks || existingApproval.remarks || "Disetujui") : null), // Simpan remarks jika Sah dan ada, atau default
        actioned_at: new Date(),
      },
      include: {
        file: true,
        approver: true,
        assigner: true, // Pastikan assigner di-include untuk notifikasi
      }
    });

    // Kirim notifikasi ke assigner (pembuat permintaan)
    if (updatedApproval.assigner && updatedApproval.file && updatedApproval.approver) {
        const fileIdentifier = (updatedApproval.file as any).filename || updatedApproval.file.description || `File ID: ${updatedApproval.file_id_ref}`;
        // Pastikan fungsi notifyAssignerOnApprovalAction ada dan diimplementasikan
        await notifyAssignerOnApprovalAction(updatedApproval, fileIdentifier);
    }


    // Cek apakah semua approver untuk PROSES yang sama sudah "Sah"
    if (updatedApproval.status === "Sah") {
      const allApprovalsForThisProcess = await prisma.approval.findMany({
        where: {
          id: sharedApprovalProcessCuid, // Filter berdasarkan CUID proses yang sama
        }
      });

      const allApproved = allApprovalsForThisProcess.every(appr => appr.status === "Sah");

      if (allApproved) {
        await prisma.file.update({
          where: {
            id_workspace_id_user_id: { // Kunci unik untuk tabel file
              id: updatedApproval.file_id_ref,
              workspace_id: updatedApproval.file_workspace_id_ref,
              user_id: updatedApproval.file_user_id_ref, // User ID dari record file
            }
          },
          data: { pengesahan_pada: new Date() }
        });
        console.log(`File ${updatedApproval.file_id_ref} (proses ${sharedApprovalProcessCuid}) telah disahkan sepenuhnya.`);
      }
    }

    return NextResponse.json({ message: `Status approval berhasil diubah menjadi '${status}'.`, data: updatedApproval }, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating approval status:`, error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Request body tidak valid (bukan JSON).' }, { status: 400 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan tak terduga di server.", details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  } finally {
    // await prisma.$disconnect(); // Tidak perlu jika menggunakan instance Prisma global
  }
}

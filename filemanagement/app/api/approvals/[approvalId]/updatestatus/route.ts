// File: app/api/approvals/[approvalId]/updatestatus/route.ts

import { PrismaClient } from '@/lib/generated/prisma/client';
import { notifyAssignerOnApprovalAction } from '@/lib/notifications';
import { NextResponse } from 'next/server';

interface ActionRequestBody {
  status: string; // Hanya "Sah" atau "Perlu Revisi"
  remarks?: string;
  actioned_by_user_id: string;
}

// Hanya status ini yang diizinkan dari sisi approver
const ALLOWED_ACTION_STATUSES = ["Sah", "Perlu Revisi"];

export async function PUT(
  request: Request,
  { params }: { params: { approvalId: string } }
) {
  const prisma = new PrismaClient();
  try {
    const { approvalId } = params; // Tidak perlu 'await' karena params bukan Promise
    if (!approvalId) {
        return NextResponse.json({ error: "Approval ID wajib diisi." }, { status: 400 });
    }

    const body = await request.json() as ActionRequestBody;
    const { status, remarks, actioned_by_user_id } = body;

    if (!status || !actioned_by_user_id) {
      return NextResponse.json({ error: "Status dan actioned_by_user_id wajib diisi." }, { status: 400 });
    }

    if (!ALLOWED_ACTION_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status tidak valid. Status yang diizinkan: ${ALLOWED_ACTION_STATUSES.join(', ')}.` }, { status: 400 });
    }
    // Jika status "Perlu Revisi", remarks wajib diisi
    if (status === "Perlu Revisi" && (!remarks || remarks.trim() === "")) {
        return NextResponse.json({ error: "Remarks wajib diisi jika status adalah 'Perlu Revisi'." }, { status: 400 });
    }

    // --- PERBAIKAN DI SINI ---
    const existingApproval = await prisma.approval.findUnique({
      where: {
        id_approver_user_id: { // Menggunakan format compound key
          id: approvalId,
          approver_user_id: actioned_by_user_id
        }
      },
      include: { file: true, approver: true }
    });

    if (!existingApproval) {
      // Karena kita mencari berdasarkan approver_user_id juga, jika tidak ketemu,
      // bisa jadi approval ID-nya ada tapi bukan untuk approver ini,
      // atau approval ID-nya memang tidak ada.
      // Pesan error "Approval tidak ditemukan." cukup generik dan bisa diterima.
      // Jika ingin lebih spesifik, bisa cek dulu apakah approvalId ada tanpa approver_user_id
      // lalu beri pesan 403 jika ada tapi bukan untuk user itu.
      // Tapi untuk saat ini, 404 sudah cukup.
      return NextResponse.json({ error: "Approval tidak ditemukan atau Anda tidak memiliki akses ke approval ini." }, { status: 404 });
    }

    // Validasi di bawah ini menjadi redundant karena kita sudah menyertakan approver_user_id dalam findUnique.
    // Jika record ditemukan, berarti approver_user_id sudah cocok.
    // if (existingApproval.approver_user_id !== actioned_by_user_id) {
    //   return NextResponse.json({ error: "Anda tidak berhak melakukan aksi pada approval ini." }, { status: 403 });
    // }

    if (existingApproval.status === "Sah") { // Tidak bisa diubah jika sudah Sah
      return NextResponse.json({ error: `Approval sudah dalam status final ('Sah') dan tidak dapat diubah.` }, { status: 400 });
    }
    // Jika status saat ini "Perlu Revisi" dan status baru juga "Perlu Revisi", izinkan untuk update remarks
    if (existingApproval.status === "Perlu Revisi" && status === "Perlu Revisi") {
        // Lanjutkan untuk update remarks
    } else if (existingApproval.status === "Perlu Revisi" && status === "Sah") {
        // Lanjutkan, approver menyetujui setelah sebelumnya minta revisi
    } else if (existingApproval.status === "Belum Ditinjau" && (status === "Sah" || status === "Perlu Revisi")) {
        // Lanjutkan, ini aksi pertama
    } else {
        // Kasus transisi status yang tidak diizinkan secara eksplisit bisa diblok di sini jika perlu
        // Untuk saat ini, validasi di atas sudah cukup ketat
        // Contoh: Jika status "Belum Ditinjau" dan user mengirim status yang tidak valid (sudah dicek di atas)
        // atau jika dari "Sah" mau diubah (sudah dicek di atas)
    }

    // --- PERBAIKAN DI SINI ---
    const updatedApproval = await prisma.approval.update({
      where: {
        id_approver_user_id: { // Menggunakan format compound key
          id: approvalId,
          approver_user_id: actioned_by_user_id
        }
      },
      data: {
        status,
        remarks: status === "Perlu Revisi" ? remarks : null, // Hanya simpan remarks jika statusnya Perlu Revisi
        actioned_at: new Date(),
      },
      include: {
        file: true,
        approver: true,
        assigner: true,
      }
    });

    const fileIdentifier = `File ID: ${updatedApproval.file_id_ref}`;
    // Jalankan notifikasi secara asynchronous tanpa menunggu (fire and forget) jika memungkinkan
    // atau jika penting, biarkan await.
    await notifyAssignerOnApprovalAction(updatedApproval, fileIdentifier);

    if (updatedApproval.status === "Sah") {
      const allApprovalsForFile = await prisma.approval.findMany({
        where: {
          file_id_ref: updatedApproval.file_id_ref,
          file_workspace_id_ref: updatedApproval.file_workspace_id_ref,
          file_user_id_ref: updatedApproval.file_user_id_ref,
        }
      });
      const allApproved = allApprovalsForFile.every(appr => appr.status === "Sah");
      if (allApproved) {
        await prisma.file.update({
          where: {
            id_workspace_id_user_id: {
              id: updatedApproval.file_id_ref,
              workspace_id: updatedApproval.file_workspace_id_ref,
              user_id: updatedApproval.file_user_id_ref,
            }
          },
          data: { pengesahan_pada: new Date() }
        });
        console.log(`File ${updatedApproval.file_id_ref} telah disahkan sepenuhnya.`);
      }
    }

    return NextResponse.json(updatedApproval, { status: 200 });

  } catch (error: any) {
    console.error(`Error saat approver mengambil tindakan untuk approval ${params?.approvalId || 'ID tidak tersedia'}:`, error); // Tambahkan nullish coalescing untuk params.approvalId
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Request body tidak valid (bukan JSON).' }, { status: 400 });
    }
    // Memberikan detail error Prisma ke client mungkin tidak aman untuk produksi.
    // Sebaiknya log detail error di server dan kirim pesan generik ke client.
    // Untuk development, `error.message` bisa berguna.
    // if (error.code && error.meta) { // Contoh deteksi error Prisma
    //     console.error("Prisma error code:", error.code, "Meta:", error.meta);
    // }
    return NextResponse.json({ error: "Terjadi kesalahan tak terduga di server.", details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
// File: app/api/approvals/revisefile/route.ts
// Endpoint ini bertujuan untuk MERESET record approval yang sudah ada (yang statusnya "Perlu Revisi")
// kembali ke "Belum Ditinjau". Ini akan MENIMPA remarks dan actioned_at pada record approval tersebut.

// --- PERUBAHAN: Impor fungsi dan tipe yang benar ---
import { notifyApproverOnUpdate, NotificationType } from '@/lib/notifications'; // Impor fungsi yang benar dan NotificationType
import { NextResponse, type NextRequest } from 'next/server'; // Impor NextRequest jika ingin menggunakan tipe request Next.js 13+
import { type approval as ApprovalModel, type file as FileModel, type user as UserModel } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

interface ResetApprovalRequestBody {
  file_id_ref: string;
  file_workspace_id_ref: string;
  file_user_id_ref: string;
  requested_by_user_id: string;
  new_revision_notes?: string; // Catatan revisi baru dari pengaju
}

// Gunakan NextRequest untuk tipe request yang lebih modern jika Anda mau
export async function POST(request: NextRequest) {
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

    // --- Validasi Admin/Pengaju ---
    // Di sini, requester bisa jadi adalah admin atau pengaju asli file.
    // Jika hanya admin yang boleh, validasi di bawah sudah benar.
    // Jika pengaju asli juga boleh, Anda perlu logika tambahan untuk memeriksa kepemilikan atau peran.
    const requester = await prisma.user.findUnique({
      where: { id: requested_by_user_id },
    });
    // Untuk endpoint ini, mungkin lebih tepat jika yang merevisi adalah assigner asli atau admin.
    // Kita asumsikan validasi requester sudah sesuai kebutuhan (misalnya, dia adalah admin atau assigner asli dari salah satu approval)
    if (!requester) { // Minimal requester harus ada
        return NextResponse.json({ error: "Pengguna yang meminta revisi tidak ditemukan." }, { status: 403 });
    }
    // Jika Anda ingin hanya admin yang bisa, uncomment ini:
    // if (!requester.is_admin) {
    //   return NextResponse.json({ error: "Hanya admin yang dapat mereset approval dengan cara ini." }, { status: 403 });
    // }


    // --- Dapatkan file untuk info notifikasi ---
    const fileRecord = await prisma.file.findUnique({
        where: {
            id_workspace_id_user_id: {
                id: file_id_ref,
                workspace_id: file_workspace_id_ref,
                user_id: file_user_id_ref, // Seharusnya ini user_id pemilik file, bukan requester
            }
        }
    });

    if (!fileRecord) {
        return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
    }
    const fileIdentifier = fileRecord.description || `Berkas ID: ${fileRecord.id.substring(0,10)}...`;


    // --- Cari semua approval untuk file ini yang statusnya "Perlu Revisi" ---
    // Atau bisa juga semua approval aktif untuk proses ID tertentu jika Anda punya sharedApprovalProcessId di sini
    const approvalsToReset = await prisma.approval.findMany({
      where: {
        file_id_ref,
        file_workspace_id_ref,
        file_user_id_ref,
        // Anda mungkin ingin memfilter berdasarkan sharedApprovalProcessId jika ada,
        // agar hanya mereset approval dalam satu siklus tertentu.
        // Untuk saat ini, kita reset semua yang 'Perlu Revisi' untuk file tersebut.
        status: "Perlu Revisi",
      },
      include: { // Include relasi yang dibutuhkan oleh fungsi notifikasi
        assigner: true,
        approver: true, // Meskipun tidak langsung dipakai notifyApproverOnUpdate, baik untuk konteks
        file: true,
      }
    });

    if (approvalsToReset.length === 0) {
      return NextResponse.json({ message: "Tidak ada approval yang perlu direset (status 'Perlu Revisi') untuk berkas ini.", approvals_reset: [] }, { status: 200 });
    }

    const resetPromises = approvalsToReset.map(approval =>
      prisma.approval.update({
        where: {
        id_approver_user_id: {
          id: approval.id, // ID dari CUID proses approval bersama
          approver_user_id: approval.approver_user_id
        }
      },
        data: {
          status: "Belum Ditinjau", // Status baru
          remarks: new_revision_notes || `Berkas telah direvisi oleh ${requester.displayname || requester.id}. Mohon ditinjau kembali.`,
          actioned_at: null, // Reset tanggal aksi
        },
        include: { assigner: true, approver: true, file: true } // Include lagi untuk data terbaru
      })
    );

    // Jalankan semua update dalam satu transaksi
    const updatedApprovals = (await prisma.$transaction(resetPromises)) as Array<ApprovalModel & { assigner: UserModel | null; approver: UserModel | null; file: FileModel | null }>;

    // --- PERUBAHAN: Kirim notifikasi untuk setiap approval yang direset ---
    for (const updatedApproval of updatedApprovals) {
        // Pastikan data yang dibutuhkan untuk notifikasi ada
        if (updatedApproval.assigner && updatedApproval.file && updatedApproval.approver_user_id) {
            await notifyApproverOnUpdate(
                updatedApproval, // Objek approval yang sudah di-update dan di-include
                fileIdentifier,  // Nama file atau identifier
                NotificationType.APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER // Tipe notifikasi
            );
        } else {
            console.warn(`Tidak bisa mengirim notifikasi untuk approval ID ${updatedApproval.id} (approver: ${updatedApproval.approver_user_id}) karena data assigner atau file tidak lengkap setelah direset.`);
        }
    }
    // --- AKHIR PERUBAHAN NOTIFIKASI ---

    return NextResponse.json({
      message: `${updatedApprovals.length} approval berhasil direset ke status 'Belum Ditinjau' untuk berkas ${file_id_ref}. Notifikasi telah dikirim ke approver terkait.`,
      approvals_reset: updatedApprovals.map(a => ({
        approval_process_id: a.id,
        approver_user_id: a.approver_user_id,
        new_status: a.status
      })),
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error saat mereset approval di /api/approvals/revisefile:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Request body tidak valid (bukan JSON).' }, { status: 400 });
    }
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: "Terjadi kesalahan tak terduga di server saat mereset approval.", details: errorMessage }, { status: 500 });
  }
}
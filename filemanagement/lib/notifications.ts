// File: lib/notifications.ts

import { PrismaClient, type user as UserModel, type file as FileModel, type approval as ApprovalModel } from '@/lib/generated/prisma/client';


// NotificationType yang disesuaikan (menghilangkan REJECTED, menambahkan untuk revisi ke approver)
export const NotificationType = {
  NEW_APPROVAL_ASSIGNMENT: "NEW_APPROVAL_ASSIGNMENT",                 // Untuk approver saat baru ditugaskan
  APPROVAL_REVISED_AWAITING_REVIEW: "APPROVAL_REVISED_AWAITING_REVIEW", // Untuk approver saat file direvisi & butuh review ulang
  APPROVAL_ACTIONED_APPROVED: "APPROVAL_ACTIONED_APPROVED",             // Untuk assigner saat disetujui
  APPROVAL_ACTIONED_REVISION_REQUESTED: "APPROVAL_ACTIONED_REVISION_REQUESTED", // Untuk assigner saat approver minta revisi
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

interface CreateNotificationParams {
  userId: string;
  message: string;
  type: NotificationTypeValue;
  link?: string;
}

async function createNotification(params: CreateNotificationParams) {
  const prisma = new PrismaClient();
  try {
    // Pastikan 'prisma' di sini merujuk ke instance yang diinisialisasi di atas
    if (!prisma || !prisma.notification) {
      console.error("FATAL: Instance Prisma atau prisma.notification tidak terdefinisi di createNotification!");
      // Anda bisa throw error di sini atau return null untuk menghentikan eksekusi lebih lanjut
      throw new Error("Prisma client tidak terinisialisasi dengan benar.");
    }

    const notification = await prisma.notification.create({ // 'await' di sini BENAR karena .create() adalah operasi async
      data: {
        user_id: params.userId,
        message: params.message,
        type: params.type,
        link: params.link,
      },
    });
    console.log(`Notifikasi berhasil dibuat untuk user ${params.userId}: "${params.message}" (Tipe: ${params.type})`);
    return notification;
  } catch (error: any) {
    console.error("Gagal membuat record notifikasi di createNotification:", error);
    // Log lebih detail jika perlu
    if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'create')")) {
        console.error("Detail TypeError: 'prisma' atau 'prisma.notification' kemungkinan undefined.");
        console.error("Nilai 'prisma' saat error:", prisma); // Untuk melihat apa nilai prisma sebenarnya
    }
    return null;
  }
}

// FUNGSI INI DIPERBARUI (sebelumnya mungkin notifyApproverOnNewAssignment)
// Notifikasi untuk Approver ketika approval baru ditugaskan ATAU file direvisi
export async function notifyApproverForReview(
    approval: ApprovalModel & { assigner?: UserModel | null, file?: FileModel | null },
    fileIdentifier: string, // Misalnya "File ID: XYZ" atau nama file jika ada
    isRevision: boolean = false // Flag untuk menandakan apakah ini karena revisi
) {

  const prisma = new PrismaClient();
  if (!approval.approver_user_id) return;

  // Kita butuh info assigner dari relasi, pastikan di-include saat memanggil fungsi ini
  const assigner = approval.assigner || await prisma.user.findUnique({ where: { id: approval.assigned_by_user_id } });
  const assignerName = assigner?.displayname || approval.assigned_by_user_id;

  let message: string;
  let notificationType: NotificationTypeValue;

  if (isRevision) {
    message = `${fileIdentifier} yang sebelumnya Anda minta untuk direvisi, telah diperbarui oleh ${assignerName} dan menunggu tinjauan ulang Anda. Status: ${approval.status}.`;
    notificationType = NotificationType.APPROVAL_REVISED_AWAITING_REVIEW;
  } else {
    message = `Anda telah ditugaskan oleh ${assignerName} untuk meninjau ${fileIdentifier}. Status saat ini: ${approval.status}.`;
    notificationType = NotificationType.NEW_APPROVAL_ASSIGNMENT;
  }

  // Ganti dengan link yang sesuai di aplikasi Anda
  const link = `/approvals/pending/${approval.id}`; // Contoh link ke detail approval untuk ditindaklanjuti

  await createNotification({
    userId: approval.approver_user_id,
    message,
    type: notificationType,
    link,
  });
}

// Notifikasi untuk Assigner ketika approver mengambil tindakan
export async function notifyAssignerOnApprovalAction(
    approval: ApprovalModel & { approver?: UserModel | null, file?: FileModel | null },
    fileIdentifier: string // Misalnya "File ID: XYZ" atau nama file jika ada
) {

  const prisma = new PrismaClient();
  if (!approval.assigned_by_user_id) return;

  // Kita butuh info approver dari relasi, pastikan di-include
  const approver = approval.approver || await prisma.user.findUnique({ where: { id: approval.approver_user_id } });
  const approverName = approver?.displayname || approval.approver_user_id;

  let message = `${approverName} telah mengambil tindakan pada ${fileIdentifier}. Status baru: ${approval.status}.`;
  if (approval.remarks && approval.status === "Perlu Revisi") {
    message += ` Catatan dari ${approverName}: "${approval.remarks}"`;
  }

  let notificationType: NotificationTypeValue;
  switch (approval.status) {
    case "Sah":
      notificationType = NotificationType.APPROVAL_ACTIONED_APPROVED;
      break;
    case "Perlu Revisi":
      notificationType = NotificationType.APPROVAL_ACTIONED_REVISION_REQUESTED;
      break;
    default:
      console.warn(`Status approval ('${approval.status}') tidak dikenal untuk notifikasi kepada assigner.`);
      return;
  }
  // Ganti dengan link yang sesuai di aplikasi Anda
  const link = `/approvals/view/${approval.id}`; // Contoh link ke detail approval untuk dilihat statusnya

  await createNotification({
    userId: approval.assigned_by_user_id,
    message,
    type: notificationType,
    link,
  });
}
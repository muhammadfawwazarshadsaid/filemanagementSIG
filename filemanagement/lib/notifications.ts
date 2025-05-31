// File: lib/notifications.ts

import { PrismaClient, type user as UserModel, type file as FileModel, type approval as ApprovalModel } from '@/lib/generated/prisma/client'; // Sesuaikan path Prisma Client Anda

// Dianjurkan menggunakan instance Prisma global yang diimpor, bukan membuat instance baru di setiap fungsi
// import { prisma } from '@/lib/prisma'; // Jika Anda sudah punya instance global
const prisma = new PrismaClient(); // Untuk contoh ini, kita buat instance baru

export const NotificationType = {
  // Untuk Approver
  NEW_APPROVAL_ASSIGNMENT: "NEW_APPROVAL_ASSIGNMENT",                 // Saat baru ditugaskan
  APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER: "APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER", // Saat pengaju submit ulang file (setelah revisi diminta approver)
  APPROVAL_FILE_UPDATED_BY_ASSIGNER: "APPROVAL_FILE_UPDATED_BY_ASSIGNER", // Saat pengaju ubah dokumen & minta persetujuan ulang

  // Untuk Assigner (Pengaju)
  APPROVAL_ACTIONED_APPROVED: "APPROVAL_ACTIONED_APPROVED",             // Saat approver menyetujui
  APPROVAL_ACTIONED_REVISION_REQUESTED: "APPROVAL_ACTIONED_REVISION_REQUESTED", // Saat approver minta revisi
  // APPROVAL_ACTIONED_REJECTED: "APPROVAL_ACTIONED_REJECTED", // Jika ada status ditolak
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

interface CreateNotificationParams {
  userId: string; // ID user penerima notifikasi
  message: string;
  type: NotificationTypeValue;
  link?: string;
  related_approval_process_cuid?: string | null; // ID CUID dari proses approval terkait
  // related_file_id?: string | null; // Opsional, jika ingin link juga ke file GDrive ID
}

async function createNotification(params: CreateNotificationParams) {
  try {
    if (!prisma || !prisma.notification) {
      console.error("FATAL: Instance Prisma atau prisma.notification tidak terdefinisi di createNotification!");
      throw new Error("Prisma client tidak terinisialisasi dengan benar.");
    }

    const notification = await prisma.notification.create({
      data: {
        user_id: params.userId,
        message: params.message,
        type: params.type,
        link: params.link,
        related_approval_process_cuid: params.related_approval_process_cuid,
        // related_file_id: params.related_file_id,
      },
    });
    console.log(`Notifikasi berhasil dibuat untuk user ${params.userId}: "${params.message}" (Tipe: ${params.type}, Link: ${params.link}, Proses CUID: ${params.related_approval_process_cuid})`);
    return notification;
  } catch (error: any) {
    console.error("Gagal membuat record notifikasi di createNotification:", error);
    if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'create')")) {
        console.error("Detail TypeError: 'prisma' atau 'prisma.notification' kemungkinan undefined.");
    }
    return null;
  }
}

/**
 * Mengirim notifikasi kepada approver.
 * @param approval - Objek approval yang sudah di-include dengan 'assigner' dan 'file'.
 * @param fileIdentifier - Nama file atau ID file untuk ditampilkan di notifikasi.
 * @param notificationType - Tipe notifikasi yang sesuai.
 * @param customMessageOverride - Pesan custom jika ada (opsional).
 */
export async function notifyApproverOnUpdate(
    approval: ApprovalModel & { assigner?: UserModel | null, file?: FileModel | null, approver?: UserModel | null },
    fileIdentifier: string,
    notificationType: Extract<NotificationTypeValue,
        | typeof NotificationType.NEW_APPROVAL_ASSIGNMENT
        | typeof NotificationType.APPROVAL_FILE_UPDATED_BY_ASSIGNER
        | typeof NotificationType.APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER
    >,
    customMessageOverride?: string | null
) {
  if (!approval.approver_user_id || !approval.assigned_by_user_id || !approval.id) {
      console.warn("[Notification] Gagal kirim notifikasi ke approver: data approval tidak lengkap.", approval);
      return;
  }

  const assigner = approval.assigner;
  const assignerName = assigner?.displayname || `Pengaju (${approval.assigned_by_user_id.substring(0,6)})`;
  const fileName = (approval.file as any)?.filename || fileIdentifier; // Asumsikan file mungkin punya properti filename
  let message: string;

  if (customMessageOverride) {
    message = customMessageOverride;
  } else {
    switch (notificationType) {
        case NotificationType.NEW_APPROVAL_ASSIGNMENT:
            message = `Anda telah ditugaskan oleh ${assignerName} untuk meninjau file "${fileName}".`;
            break;
        case NotificationType.APPROVAL_FILE_UPDATED_BY_ASSIGNER:
            message = `Dokumen baru saja diubah oleh ${fileName} yang sekarang bernama "${assignerName}" dan membutuhkan persetujuan ulang Anda.`
            break;
        case NotificationType.APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER:
             message = `File "${fileName}" yang sebelumnya diminta revisi, telah diajukan ulang oleh ${assignerName} dan menunggu tinjauan Anda.`;
            break;
        default:
            console.warn(`[Notification] Tipe notifikasi tidak dikenal untuk notifyApproverOnUpdate: ${notificationType}`);
            message = `Ada pembaruan terkait file "${fileName}" dari ${assignerName} yang memerlukan perhatian Anda.`;
    }
  }
  
  const link = `/approvals/detail/${approval.file_id_ref}?processId=${approval.id}`; 

  await createNotification({
    userId: approval.approver_user_id,
    message,
    type: notificationType,
    link,
    related_approval_process_cuid: approval.id,
  });
}

/**
 * Mengirim notifikasi kepada assigner (pengaju) ketika seorang approver mengambil tindakan.
 * @param approval - Objek approval yang sudah di-include dengan 'approver' dan 'file'.
 * @param fileIdentifier - Nama file atau ID file.
 */
export async function notifyAssignerOnApprovalAction(
    approval: ApprovalModel & { approver?: UserModel | null, file?: FileModel | null, assigner?: UserModel | null },
    fileIdentifier: string
) {
  if (!approval.assigned_by_user_id || !approval.approver_user_id || !approval.id) {
    console.warn("[Notification] Gagal kirim notifikasi ke assigner: data approval tidak lengkap.", approval);
    return;
  }

  const approver = approval.approver;
  const approverName = approver?.displayname || `Approver (${approval.approver_user_id.substring(0,6)})`;
  const fileName = (approval.file as any)?.filename || fileIdentifier;

  let message = `${approverName} telah mengambil tindakan pada file. Status baru: ${approval.status}.`;
  if (approval.remarks && (approval.status === "Perlu Revisi" || approval.status === "Sah")) {
    message += ` Catatan: "${approval.remarks}"`;
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
      console.warn(`[Notification] Status approval ('${approval.status}') tidak dikenal untuk notifikasi kepada assigner.`);
      return;
  }
  
  const link = `/approvals/detail/${approval.file_id_ref}?processId=${approval.id}`;

  await createNotification({
    userId: approval.assigned_by_user_id,
    message,
    type: notificationType,
    link,
    related_approval_process_cuid: approval.id,
  });
}
// File: lib/notifications.ts

import { PrismaClient, type user as UserModel, type file as FileModel, type approval as ApprovalModel } from '@/lib/generated/prisma/client'; // Pastikan path Prisma Client benar

// Instance Prisma global (jika belum ada, jika sudah ada di lib/prisma.ts, impor dari sana)
const prisma = new PrismaClient();

export const NotificationType = {
  NEW_APPROVAL_ASSIGNMENT: "NEW_APPROVAL_ASSIGNMENT",                 // Untuk approver saat baru ditugaskan
  APPROVAL_REVISED_AWAITING_REVIEW: "APPROVAL_REVISED_AWAITING_REVIEW", // Untuk approver saat file direvisi & butuh review ulang (bisa juga oleh pengaju)
  APPROVAL_ACTIONED_APPROVED: "APPROVAL_ACTIONED_APPROVED",             // Untuk assigner saat disetujui
  APPROVAL_ACTIONED_REVISION_REQUESTED: "APPROVAL_ACTIONED_REVISION_REQUESTED", // Untuk assigner saat approver minta revisi
  // --- TIPE NOTIFIKASI BARU ---
  APPROVAL_FILE_UPDATED_BY_ASSIGNER: "APPROVAL_FILE_UPDATED_BY_ASSIGNER", // Untuk approver saat pengaju mengubah file (dan meminta persetujuan ulang)
  APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER: "APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER", // Untuk approver saat pengaju submit ulang file setelah revisi
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

interface CreateNotificationParams {
  userId: string;
  message: string;
  type: NotificationTypeValue;
  link?: string;
  // Tambahkan field opsional untuk menyimpan ID terkait jika perlu untuk query yang lebih mudah
  // related_approval_process_cuid?: string;
  // related_file_id?: string;
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
        // related_approval_process_cuid: params.related_approval_process_cuid, // Jika ditambahkan
        // related_file_id: params.related_file_id, // Jika ditambahkan
      },
    });
    console.log(`Notifikasi berhasil dibuat untuk user ${params.userId}: "${params.message}" (Tipe: ${params.type}, Link: ${params.link})`);
    return notification;
  } catch (error: any) {
    console.error("Gagal membuat record notifikasi di createNotification:", error);
    if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'create')")) {
        console.error("Detail TypeError: 'prisma' atau 'prisma.notification' kemungkinan undefined.");
    }
    return null;
  }
}

// Notifikasi untuk Approver ketika approval baru ditugaskan ATAU file direvisi/diupdate oleh pengaju
export async function notifyApproverForReview(
    approval: ApprovalModel & { assigner?: UserModel | null, file?: FileModel | null }, // Pastikan relasi assigner dan file di-load
    fileIdentifier: string,
    notificationType: Extract<NotificationTypeValue, 
        | typeof NotificationType.NEW_APPROVAL_ASSIGNMENT 
        | typeof NotificationType.APPROVAL_REVISED_AWAITING_REVIEW 
        | typeof NotificationType.APPROVAL_FILE_UPDATED_BY_ASSIGNER
        | typeof NotificationType.APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER
    >,
    customMessage?: string | null // Pesan spesifik jika ada
) {
  if (!approval.approver_user_id || !approval.assigned_by_user_id) {
      console.warn("notifyApproverForReview: approver_user_id atau assigned_by_user_id tidak ada pada approval object.");
      return;
  }

  const assigner = approval.assigner || await prisma.user.findUnique({ where: { id: approval.assigned_by_user_id } });
  const assignerName = assigner?.displayname || `Pengaju (${approval.assigned_by_user_id.substring(0,6)})`;
  const fileName = (approval.file as any)?.filename || fileIdentifier; // Prefer filename jika ada

  let message: string;

  if (customMessage) {
    message = customMessage;
  } else {
    switch (notificationType) {
        case NotificationType.NEW_APPROVAL_ASSIGNMENT:
            message = `Anda telah ditugaskan oleh ${assignerName} untuk meninjau file "${fileName}".`;
            break;
        case NotificationType.APPROVAL_FILE_UPDATED_BY_ASSIGNER:
            message = `File "${fileName}" telah diperbarui oleh ${assignerName} dan membutuhkan persetujuan ulang dari Anda.`;
            break;
        case NotificationType.APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER:
             message = `File "${fileName}" yang sebelumnya diminta revisi, telah diajukan ulang oleh ${assignerName} dan menunggu tinjauan Anda.`;
            break;
        case NotificationType.APPROVAL_REVISED_AWAITING_REVIEW: // Ini bisa jadi redundant jika sudah dicakup oleh di atas
            message = `File "${fileName}" telah direvisi dan menunggu tinjauan ulang Anda dari ${assignerName}.`;
            break;
        default:
            message = `Ada pembaruan terkait file "${fileName}" dari ${assignerName} yang memerlukan perhatian Anda.`;
    }
  }
  
  // Link ke halaman di mana approver bisa langsung menindaklanjuti
  // approval.id di sini adalah sharedApprovalProcessCuid
  const link = `/approvals/pending/${approval.id}?fileId=${approval.file_id_ref}`; 

  await createNotification({
    userId: approval.approver_user_id,
    message,
    type: notificationType,
    link,
    // related_approval_process_cuid: approval.id, // Jika ditambahkan ke schema
    // related_file_id: approval.file_id_ref, // Jika ditambahkan ke schema
  });
}

// Notifikasi untuk Assigner ketika approver mengambil tindakan
export async function notifyAssignerOnApprovalAction(
    approval: ApprovalModel & { approver?: UserModel | null, file?: FileModel | null }, // Pastikan relasi approver dan file di-load
    fileIdentifier: string
) {
  if (!approval.assigned_by_user_id || !approval.approver_user_id) {
    console.warn("notifyAssignerOnApprovalAction: assigned_by_user_id atau approver_user_id tidak ada pada approval object.");
    return;
  }

  const approver = approval.approver || await prisma.user.findUnique({ where: { id: approval.approver_user_id } });
  const approverName = approver?.displayname || `Approver (${approval.approver_user_id.substring(0,6)})`;
  const fileName = (approval.file as any)?.filename || fileIdentifier;

  let message = `${approverName} telah mengambil tindakan pada file "${fileName}". Status baru: ${approval.status}.`;
  if (approval.remarks && (approval.status === "Perlu Revisi" || approval.status === "Sah")) { // Tampilkan remarks jika ada, untuk Sah atau Perlu Revisi
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
    // Tambahkan case untuk 'Ditolak' jika ada
    default:
      console.warn(`Status approval ('${approval.status}') tidak dikenal untuk notifikasi kepada assigner.`);
      return;
  }
  
  // Link ke halaman detail approval
  // approval.id di sini adalah sharedApprovalProcessCuid
  const link = `/approvals/detail/${approval.file_id_ref}?processId=${approval.id}`; 

  await createNotification({
    userId: approval.assigned_by_user_id,
    message,
    type: notificationType,
    link,
    // related_approval_process_cuid: approval.id,
    // related_file_id: approval.file_id_ref,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO } from 'date-fns';

import type {
    ApprovalFile,
    ApprovalUser,
    IndividualApproverAction,
    OverallApprovalStatusKey,
    IndividualApprovalStatusKey,
    // Jika tipe Approval didefinisikan di schema.ts dan menyertakan relasi yang dibutuhkan
    // kita bisa gunakan itu, atau tipe Prisma langsung
} from '@/components/approvals/schema'; // Sesuaikan path jika perlu
import { type approval as PrismaApprovalWithRelations, type user as PrismaUser, type file as PrismaFileWithRelations, type notification as PrismaNotification } from '@/lib/generated/prisma/client';

// Tipe untuk data file dalam respons
type FileDetailInResponse = {
    id: string; filename: string | null; mimeType: string | null; description: string | null;
    workspace_id: string | null; user_id: string | null; gdrive_fetch_error?: string | null;
    db_created_at?: Date | string | null; db_updated_at?: Date | string | null;
    pengesahan_pada?: Date | string | null; color?: string | null; labels?: string[];
};

// Tipe untuk respons detail approval request
interface ApprovalRequestDetail {
    fileIdRef: string;
    file: FileDetailInResponse | null;
    assigner: ApprovalUser | null;
    createdAt: string;
    updatedAt?: string;
    overallStatus: OverallApprovalStatusKey;
    approvers: IndividualApproverAction[];
    activityLog: Array<{
        id: string; // Bisa dari approval.id atau notification.id
        actorName: string;
        actorType: 'assigner' | 'approver' | 'system' | 'notification_recipient'; // Tambah tipe baru
        actionDescription: string;
        details?: string;
        timestamp: string;
        statusKey?: IndividualApprovalStatusKey;
        remarks?: string;
        isNotification?: boolean; // Flag untuk membedakan sumber log
    }>;
}

// Helper (getIndividualStatusKey, calculateOverallStatus - asumsikan sudah ada)
const getIndividualStatusKey = (status: string | null | undefined): IndividualApprovalStatusKey => { /* ... implementasi ... */
    const sLower = status?.toLowerCase() || 'unknown';
    if (['approved', 'disetujui', 'sah'].includes(sLower)) return 'approved';
    if (['rejected', 'ditolak'].includes(sLower)) return 'rejected';
    if (['revised', 'perlu revisi', 'revisi'].includes(sLower)) return 'revised';
    if (['pending', 'menunggu', 'belum ditinjau'].includes(sLower)) return 'pending';
    return 'unknown';
};
const calculateOverallStatus = (approvers: IndividualApproverAction[]): OverallApprovalStatusKey => { /* ... implementasi ... */
    if (!approvers || approvers.length === 0) return 'Belum Ada Tindakan';
    const hasRevision = approvers.some(act => act.statusKey === 'revised');
    const hasRejected = approvers.some(act => act.statusKey === 'rejected');
    const allActioned = approvers.every(act => act.statusKey !== 'pending' && act.statusKey !== 'unknown');
    const allApproved = approvers.every(act => act.statusKey === 'approved');
    const anyPending = approvers.some(act => act.statusKey === 'pending' || act.statusKey === 'unknown');
    if (hasRevision) return 'Perlu Revisi'; if (hasRejected) return 'Ditolak'; if (allActioned && allApproved) return 'Sah'; if (anyPending) return 'Menunggu Persetujuan'; if (allActioned && !allApproved) return 'Menunggu Persetujuan'; return 'Belum Ada Tindakan';
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileIdRef = searchParams.get('fileIdRef');

  if (!fileIdRef) {
    return NextResponse.json({ error: "Parameter fileIdRef wajib diisi." }, { status: 400 });
  }

  const authHeader = request.headers.get('Authorization');
  let googleAccessToken: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    googleAccessToken = authHeader.substring(7);
  }

  try {
    const approvalActionsFromDb = await prisma.approval.findMany({
      where: { file_id_ref: fileIdRef },
      include: {
        approver: { select: { id: true, displayname: true, primaryemail: true } },
        assigner: { select: { id: true, displayname: true, primaryemail: true } },
      },
      orderBy: [{ created_at: 'asc' }, { updated_at: 'asc' }],
    });

    if (!approvalActionsFromDb || approvalActionsFromDb.length === 0) {
      return NextResponse.json({ error: `Tidak ada data approval untuk file ID ${fileIdRef}` }, { status: 404 });
    }

    const firstApprovalAction = approvalActionsFromDb[0];
    const latestApprovalAction = approvalActionsFromDb[approvalActionsFromDb.length - 1];

    // Ambil detail file (DB & GDrive) - sama seperti sebelumnya
    let dbFileRecord: PrismaFileWithRelations | null = null;
    if (firstApprovalAction.file_workspace_id_ref && firstApprovalAction.file_user_id_ref) {
        dbFileRecord = await prisma.file.findUnique({ where: { id_workspace_id_user_id: { id: fileIdRef, workspace_id: firstApprovalAction.file_workspace_id_ref, user_id: firstApprovalAction.file_user_id_ref, } } });
    }
    let gDriveFileName: string | null = dbFileRecord?.id ? `[${dbFileRecord.id.substring(0,5)}...]` : `[${fileIdRef.substring(0,5)}...]`;
    let gDriveMimeType: string | null = (dbFileRecord as any)?.mimeType || null;
    let gDriveDescription: string | null = dbFileRecord?.description || null;
    let gDriveFetchError: string | null = null;
    if (googleAccessToken) {
      try { /* ... logika fetch GDrive ... */
        const gDriveApiUrl = `https://www.googleapis.com/drive/v3/files/${fileIdRef}?fields=id,name,mimeType,description`;
        const response = await fetch(gDriveApiUrl, { headers: { 'Authorization': `Bearer ${googleAccessToken}` } });
        if (response.ok) {
          const gDriveData = await response.json(); gDriveFileName = gDriveData.name || gDriveFileName; gDriveMimeType = gDriveData.mimeType || gDriveMimeType; gDriveDescription = gDriveData.description || gDriveDescription; gDriveFetchError = null;
        } else { const errorData = await response.json().catch(() => ({})); gDriveFetchError = `GDrive API Error ${response.status}: ${errorData?.error?.message || response.statusText}`; console.warn(`API GetInfo: Gagal ambil info GDrive untuk file ID ${fileIdRef}: ${gDriveFetchError}`); }
      } catch (e: any) { gDriveFetchError = `Exception GDrive: ${e.message}`; console.error(`API GetInfo Exception GDrive: file ID ${fileIdRef}:`, e); }
    } else { gDriveFetchError = "Token Google tidak tersedia."; }
    const fileInfoForResponse: FileDetailInResponse = { id: fileIdRef, filename: gDriveFileName, mimeType: gDriveMimeType, description: gDriveDescription, workspace_id: firstApprovalAction.file_workspace_id_ref, user_id: firstApprovalAction.file_user_id_ref, gdrive_fetch_error: gDriveFetchError, db_created_at: dbFileRecord?.created_at, db_updated_at: dbFileRecord?.updated_at, pengesahan_pada: dbFileRecord?.pengesahan_pada, color: dbFileRecord?.color, labels: dbFileRecord?.labels || [], };

    // Susun daftar approvers (status terakhir per approver) - sama seperti sebelumnya
    const uniqueApproversMap = new Map<string, IndividualApproverAction>();
    approvalActionsFromDb.forEach(action => { /* ... logika uniqueApproversMap ... */
        const existing = uniqueApproversMap.get(action.approver_user_id);
        const currentActionTimestamp = action.actioned_at || action.updated_at;
        let existingActionDate = new Date(0);
        if(existing?.actioned_at) existingActionDate = parseISO(existing.actioned_at);
        else if (existing && action.updated_at) existingActionDate = parseISO(action.updated_at.toISOString());
        if (!existing || (currentActionTimestamp && parseISO(currentActionTimestamp.toISOString()) >= existingActionDate)) {
            uniqueApproversMap.set(action.approver_user_id, { approverId: action.approver_user_id, approverName: action.approver.displayname, approverEmail: action.approver.primaryemail || undefined, statusKey: getIndividualStatusKey(action.status), statusDisplay: action.status, actioned_at: action.actioned_at?.toISOString() || null, remarks: action.remarks, });
        }
    });
    const approversList = Array.from(uniqueApproversMap.values());

    // --- MODIFIKASI: Susun Activity Log dengan data dari tabel `approval` DAN `notification` ---
    const activityLog: ApprovalRequestDetail['activityLog'] = [];

    // 1. Tambahkan log dari `approvalActionsFromDb` (aksi utama)
    activityLog.push({
        id: `submit-${fileIdRef}-${firstApprovalAction.id}`,
        actorName: firstApprovalAction.assigner.displayname || 'Pengaju Sistem',
        actorType: 'assigner',
        actionDescription: `mengajukan persetujuan untuk file`,
        details: fileInfoForResponse.filename || fileIdRef,
        timestamp: firstApprovalAction.created_at.toISOString(),
        isNotification: false,
    });

    approvalActionsFromDb.forEach(action => {
        if (action.actioned_at) {
            activityLog.push({
                id: `action-${action.id}-${action.actioned_at?.toISOString()}`,
                actorName: action.approver.displayname || 'Approver Sistem',
                actorType: 'approver',
                actionDescription: `memberikan status "${action.status}"`,
                details: action.remarks || undefined,
                timestamp: action.actioned_at.toISOString(),
                statusKey: getIndividualStatusKey(action.status),
                remarks: action.remarks || undefined,
                isNotification: false,
            });
        } else if (action.remarks && action.updated_at) {
             activityLog.push({
                id: `comment-${action.id}-${action.updated_at.toISOString()}`,
                actorName: action.approver.displayname || 'Approver Sistem',
                actorType: 'approver',
                actionDescription: `memberikan komentar`,
                details: action.remarks,
                timestamp: action.updated_at.toISOString(),
                remarks: action.remarks,
                isNotification: false,
            });
        }
    });

    // 2. Ambil dan tambahkan log dari tabel `notification`
    const relatedApprovalIds = approvalActionsFromDb.map(a => a.id);
    const involvedUserIds = new Set<string>([
        firstApprovalAction.assigned_by_user_id,
        ...approvalActionsFromDb.map(a => a.approver_user_id)
    ]);

    if (relatedApprovalIds.length > 0) {
        const notifications = await prisma.notification.findMany({
            where: {
                // Mencari notifikasi yang link-nya mengandung salah satu ID approval terkait,
                // ATAU user_id-nya adalah salah satu user yang terlibat DAN tipe notifikasinya relevan
                OR: [
                    { link: { in: relatedApprovalIds.map(id => `/approvals/pending/${id}`) } }, // Sesuaikan pola link
                    { link: { in: relatedApprovalIds.map(id => `/approvals/view/${id}`) } },    // Sesuaikan pola link
                    {
                        user_id: { in: Array.from(involvedUserIds) },
                        // Tambahkan filter berdasarkan `type` notifikasi jika perlu untuk lebih spesifik
                        // Misalnya, jika pesan notifikasi tidak selalu mengandung nama file/ID yang bisa diparsing
                        // message: { contains: fileIdRef } // Ini bisa jadi terlalu luas atau tidak akurat
                    }
                ]
            },
            include: {
                user: { select: { id: true, displayname: true } } // Untuk nama penerima notifikasi
            },
            orderBy: { created_at: 'asc' } // Ambil dari terlama untuk diproses
        });

        notifications.forEach(notif => {
            // Coba ekstrak aktor dari pesan jika mungkin, atau default ke 'Sistem'
            // Ini bagian yang paling tricky dan bergantung pada format pesan notifikasi Anda
            let actorNameInNotif = 'Sistem Notifikasi';
            let actorTypeInNotif : ApprovalRequestDetail['activityLog'][0]['actorType'] = 'system';

            // Contoh parsing sederhana (PERLU DISESUAIKAN DENGAN FORMAT PESAN ANDA)
            const assignerMatch = notif.message.match(/ditugaskan oleh (.*?)\s+untuk meninjau/);
            const approverMatch = notif.message.match(/^(.*?)\s+telah mengambil tindakan/);

            if (assignerMatch && assignerMatch[1]) {
                actorNameInNotif = assignerMatch[1];
                actorTypeInNotif = 'assigner';
            } else if (approverMatch && approverMatch[1]) {
                actorNameInNotif = approverMatch[1];
                actorTypeInNotif = 'approver';
            }
            // Jika notifikasi adalah untuk user yang melakukan aksi, maka actorName bisa diambil dari notif.user.displayname jika logikanya begitu
            // Misalnya: Jika notif.type adalah "APPROVAL_ACTION_TAKEN_BY_YOU" (contoh tipe baru)
            // if (notif.type === "...") actorNameInNotif = notif.user.displayname || 'User';

            activityLog.push({
                id: `notif-${notif.id}`,
                actorName: actorNameInNotif,
                actorType: actorTypeInNotif,
                actionDescription: notif.message, // Pesan notifikasi sebagai deskripsi aksi
                timestamp: notif.created_at.toISOString(),
                // statusKey bisa coba diparsing dari message atau type notifikasi jika ada
                isNotification: true,
            });
        });
    }
    // --- Akhir Integrasi Notifikasi ---

    activityLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const overallStatusCalculated = calculateOverallStatus(approversList);

    const responseData: ApprovalRequestDetail = {
        fileIdRef: fileIdRef,
        file: fileInfoForResponse,
        assigner: firstApprovalAction.assigner,
        createdAt: firstApprovalAction.created_at.toISOString(),
        updatedAt: latestApprovalAction.updated_at.toISOString(),
        overallStatus: overallStatusCalculated,
        approvers: approversList,
        activityLog: activityLog,
    };

    return NextResponse.json({ message: "Detail approval berhasil diambil.", data: responseData });

  } catch (error: any) {
    // ... (Error handling seperti sebelumnya, dengan path API yang benar di log) ...
    const fileIdParam = fileIdRef || "UNKNOWN_FILE_ID_IN_CATCH";
    console.error(`================================================================`);
    console.error(`API ERROR: /api/approvals/getinfo?fileIdRef=${fileIdParam}`);
    console.error(`Timestamp: ${new Date().toISOString()}`); console.error(`Error Message: ${error.message}`); console.error(`Error Code (Prisma): ${error.code}`); console.error(`Error Stack: ${error.stack}`);
    console.error(`================================================================`);
    let errorMessage = "Terjadi kesalahan internal server saat mengambil detail approval."; let errorStatus = 500;
    if (error.code === 'P2025' || error.message?.includes("Tidak ada data approval untuk file ID")) { errorMessage = `Data approval untuk file ID ${fileIdParam} tidak ditemukan.`; errorStatus = 404; }
    return NextResponse.json({ error: errorMessage, details: error.message || "Tidak ada detail tambahan." }, { status: errorStatus });
  }
}
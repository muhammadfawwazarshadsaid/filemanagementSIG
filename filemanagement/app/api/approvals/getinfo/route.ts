// File: app/api/approvals/getinfo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

import type {
    ApprovalUser,
    IndividualApproverAction,
    OverallApprovalStatusKey,
    IndividualApprovalStatusKey,
} from '@/components/approvals/schema';
import { type approval as PrismaApproval, type user as PrismaUser, type file as PrismaFile, type notification as PrismaNotification } from '@/lib/generated/prisma/client';
import { NotificationType } from '@/lib/notifications'; // Impor NotificationType

type FileDetailInResponse = {
    id: string; filename: string | null; mimeType: string | null; description: string | null;
    workspace_id: string | null; user_id: string | null; gdrive_fetch_error?: string | null;
    db_created_at?: string | null; db_updated_at?: string | null;
    pengesahan_pada?: string | null; color?: string | null; labels?: string[];
};

interface ApprovalRequestDetail {
    sharedApprovalProcessCuid: string;
    fileIdRef: string;
    file: FileDetailInResponse | null;
    assigner: ApprovalUser | null;
    createdAt: string; // ISO string
    updatedAt?: string; // ISO string
    overallStatus: OverallApprovalStatusKey;
    approvers: IndividualApproverAction[];
    activityLog: Array<{
        id: string;
        actorName: string;
        actorType: 'assigner' | 'approver' | 'system' | 'notification_recipient';
        actionDescription: string;
        details?: string | null; // Allow null for details
        timestamp: string; // ISO string
        formattedTimestamp?: string;
        statusKey?: IndividualApprovalStatusKey;
        remarks?: string | null;
        isNotification?: boolean;
    }>;
}

const getIndividualStatusKeyInternal = (status: string | null | undefined): IndividualApprovalStatusKey => {
    const sLower = status?.toLowerCase() || 'unknown';
    if (['approved', 'disetujui', 'sah'].includes(sLower)) return 'approved';
    if (['rejected', 'ditolak'].includes(sLower)) return 'rejected';
    if (['revised', 'perlu revisi', 'revisi'].includes(sLower)) return 'revised';
    if (['pending', 'menunggu', 'belum ditinjau'].includes(sLower)) return 'pending';
    return 'unknown';
};

const calculateOverallStatusInternal = (approvers: IndividualApproverAction[]): OverallApprovalStatusKey => {
    if (!approvers || approvers.length === 0) return 'Belum Ada Tindakan';
    const hasRevision = approvers.some((act: IndividualApproverAction) => act.statusKey === 'revised');
    // const hasRejected = approvers.some((act: IndividualApproverAction) => act.statusKey === 'rejected'); // Jika status ditolak diimplementasikan
    const allActioned = approvers.every((act: IndividualApproverAction) => act.statusKey !== 'pending' && act.statusKey !== 'unknown');
    // --- PERBAIKAN TYPO: 'actions' menjadi 'approvers' ---
    const allApproved = approvers.every((act: IndividualApproverAction) => act.statusKey === 'approved');
    const anyPending = approvers.some((act: IndividualApproverAction) => act.statusKey === 'pending' || act.statusKey === 'unknown');
    // --- AKHIR PERBAIKAN TYPO ---

    if (hasRevision) return 'Perlu Revisi';
    // if (hasRejected) return 'Ditolak'; // Jika status ditolak diimplementasikan
    if (allActioned && allApproved) return 'Sah';
    if (anyPending) return 'Menunggu Persetujuan';
    if (allActioned && !allApproved) return 'Menunggu Persetujuan'; // Atau status lain jika ada yang tidak setuju tapi bukan revisi
    return 'Belum Ada Tindakan';
};

const formatTimestampForDisplay = (isoTimestamp: string): string => {
    try {
        return format(parseISO(isoTimestamp), "d MMM yyyy, HH:mm", { locale: localeID });
    } catch (e) {
        console.warn(`Failed to parse timestamp for formatting: ${isoTimestamp}`, e);
        return isoTimestamp;
    }
};


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileIdRefFromQuery = searchParams.get('fileIdRef');
  const processCuidFromQuery = searchParams.get('processId');

  console.log(`[API GetInfo] Received fileIdRef: ${fileIdRefFromQuery}, processCuid: ${processCuidFromQuery}`);


  if (!fileIdRefFromQuery && !processCuidFromQuery) {
    return NextResponse.json({ error: "Parameter fileIdRef atau processId wajib diisi." }, { status: 400 });
  }

  const authHeader = request.headers.get('Authorization');
  let googleAccessToken: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    googleAccessToken = authHeader.substring(7);
  }

  try {
    let approvalActionsFromDb: (PrismaApproval & { approver: PrismaUser, assigner: PrismaUser, file: PrismaFile | null })[] = [];
    let targetProcessCuid: string | null = processCuidFromQuery;
    let actualFileIdRef: string | null = fileIdRefFromQuery;


    if (targetProcessCuid) {
        approvalActionsFromDb = await prisma.approval.findMany({
            where: { id: targetProcessCuid },
            include: {
                approver: true,
                assigner: true,
                file: true,
            },
            orderBy: [{ created_at: 'asc' }, { updated_at: 'asc' }],
        });
        if (approvalActionsFromDb.length > 0) {
            actualFileIdRef = approvalActionsFromDb[0].file_id_ref;
        } else {
            if (actualFileIdRef) {
                console.warn(`[API GetInfo] No approval actions found for processCuid ${targetProcessCuid}, attempting fallback with fileIdRef ${actualFileIdRef}`);
                const allProcessesForFile = await prisma.approval.findMany({
                    where: { file_id_ref: actualFileIdRef },
                    distinct: ['id'], 
                    orderBy: { created_at: 'desc' },
                    take: 1,
                });
                if (allProcessesForFile.length > 0) {
                    targetProcessCuid = allProcessesForFile[0].id;
                    approvalActionsFromDb = await prisma.approval.findMany({
                        where: { id: targetProcessCuid },
                        include: { approver: true, assigner: true, file: true },
                        orderBy: [{ created_at: 'asc' }, { updated_at: 'asc' }],
                    });
                }
            }
        }
    } else if (actualFileIdRef) {
        const allProcessesForFile = await prisma.approval.findMany({
            where: { file_id_ref: actualFileIdRef },
            distinct: ['id'],
            orderBy: { created_at: 'desc' },
            take: 1,
        });
        if (allProcessesForFile.length > 0) {
            targetProcessCuid = allProcessesForFile[0].id;
            approvalActionsFromDb = await prisma.approval.findMany({
                where: { id: targetProcessCuid },
                include: { approver: true, assigner: true, file: true },
                orderBy: [{ created_at: 'asc' }, { updated_at: 'asc' }],
            });
        }
    }

    if (!approvalActionsFromDb || approvalActionsFromDb.length === 0 || !targetProcessCuid) {
      const identifier = processCuidFromQuery || fileIdRefFromQuery;
      return NextResponse.json({ error: `Tidak ada data approval untuk identifier ${identifier}` }, { status: 404 });
    }
    
    const firstApprovalAction = approvalActionsFromDb[0];
    const latestApprovalAction = approvalActionsFromDb[approvalActionsFromDb.length - 1];
    actualFileIdRef = firstApprovalAction.file_id_ref;
    const dbFileRecord = firstApprovalAction.file;

    let gDriveFileName: string | null = (dbFileRecord as any)?.filename || (dbFileRecord?.description ? `[Deskripsi] ${dbFileRecord.description.substring(0,10)}...` : (actualFileIdRef ? `[ID] ${actualFileIdRef.substring(0,5)}...` : "Nama File Tidak Ada"));
    let gDriveMimeType: string | null = (dbFileRecord as any)?.mimeType || null;
    let gDriveDescriptionFromAPI: string | null = null;
    let gDriveFetchError: string | null = null;

    if (googleAccessToken && actualFileIdRef) {
      try {
        const gDriveApiUrl = `https://www.googleapis.com/drive/v3/files/${actualFileIdRef}?fields=id,name,mimeType,description`;
        const response = await fetch(gDriveApiUrl, { headers: { 'Authorization': `Bearer ${googleAccessToken}` } });
        if (response.ok) {
          const gDriveData = await response.json();
          gDriveFileName = gDriveData.name || gDriveFileName;
          gDriveMimeType = gDriveData.mimeType || gDriveMimeType;
          gDriveDescriptionFromAPI = gDriveData.description || null;
        } else {
          const errorData = await response.json().catch(() => ({}));
          gDriveFetchError = `GDrive API Error ${response.status}: ${errorData?.error?.message || response.statusText}`;
          console.warn(`API GetInfo: Gagal ambil info GDrive untuk file ID ${actualFileIdRef}: ${gDriveFetchError}`);
        }
      } catch (e: any) {
        gDriveFetchError = `Exception GDrive: ${e.message}`;
        console.error(`API GetInfo Exception GDrive: file ID ${actualFileIdRef}:`, e);
      }
    } else if (!actualFileIdRef) {
        gDriveFetchError = "File ID Ref tidak ditemukan pada approval record.";
    } else {
        gDriveFetchError = "Token Google tidak tersedia untuk mengambil detail file dari GDrive.";
    }

    const fileInfoForResponse: FileDetailInResponse = {
        id: actualFileIdRef || "UNKNOWN_FILE_ID",
        filename: gDriveFileName,
        mimeType: gDriveMimeType,
        description: gDriveDescriptionFromAPI ?? dbFileRecord?.description ?? null,
        workspace_id: dbFileRecord?.workspace_id || null,
        user_id: dbFileRecord?.user_id || null,
        gdrive_fetch_error: gDriveFetchError,
        db_created_at: dbFileRecord?.created_at?.toISOString() || null,
        db_updated_at: dbFileRecord?.updated_at?.toISOString() || null,
        pengesahan_pada: dbFileRecord?.pengesahan_pada?.toISOString() || null,
        color: dbFileRecord?.color || null,
        labels: (dbFileRecord?.labels as string[] | undefined) || [],
    };

    const uniqueApproversMap = new Map<string, IndividualApproverAction>();
    approvalActionsFromDb.forEach(action => {
        uniqueApproversMap.set(action.approver_user_id, {
            individualApprovalId: `${action.id}-${action.approver_user_id}`,
            approverId: action.approver_user_id,
            approverName: action.approver.displayname,
            approverEmail: action.approver.primaryemail || undefined,
            statusKey: getIndividualStatusKeyInternal(action.status),
            statusDisplay: action.status,
            actioned_at: action.actioned_at?.toISOString() || null,
            remarks: action.remarks,
        });
    });
    const approversList = Array.from(uniqueApproversMap.values());

    const activityLog: ApprovalRequestDetail['activityLog'] = [];

    activityLog.push({
        id: `submit-${targetProcessCuid}-${firstApprovalAction.created_at.toISOString()}`,
        actorName: firstApprovalAction.assigner.displayname || `Pengaju (${firstApprovalAction.assigned_by_user_id.substring(0,6)})`,
        actorType: 'assigner',
        actionDescription: `mengajukan persetujuan untuk file`,
        details: fileInfoForResponse.filename || actualFileIdRef || "File tidak diketahui",
        timestamp: firstApprovalAction.created_at.toISOString(),
        formattedTimestamp: formatTimestampForDisplay(firstApprovalAction.created_at.toISOString()),
        isNotification: false,
    });

    approvalActionsFromDb.forEach(action => {
        if (action.actioned_at) {
            activityLog.push({
                id: `action-${action.id}-${action.approver_user_id}-${action.actioned_at?.toISOString()}`,
                actorName: action.approver.displayname || `Approver (${action.approver_user_id.substring(0,6)})`,
                actorType: 'approver',
                actionDescription: `memberikan status "${action.status}"`,
                details: action.remarks || undefined,
                timestamp: action.actioned_at.toISOString(),
                formattedTimestamp: formatTimestampForDisplay(action.actioned_at.toISOString()),
                statusKey: getIndividualStatusKeyInternal(action.status),
                remarks: action.remarks,
                isNotification: false,
            });
        }
    });

    const involvedUserIds = new Set<string>([
        firstApprovalAction.assigned_by_user_id,
        ...approvalActionsFromDb.map(a => a.approver_user_id)
    ]);

    if (targetProcessCuid) {
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { link: { contains: targetProcessCuid } },
                    {
                        user_id: { in: Array.from(involvedUserIds) },
                        type: { in: Object.values(NotificationType) },
                    }
                ]
            },
            include: {
                user: { select: { id: true, displayname: true } }
            },
            orderBy: { created_at: 'asc' }
        });

        notifications.forEach(notif => {
            const messageContainsFileIdentifier = (actualFileIdRef && notif.message.includes(actualFileIdRef)) ||
                                                 (fileInfoForResponse.filename && notif.message.includes(fileInfoForResponse.filename));

            if (!notif.link?.includes(targetProcessCuid!) && !messageContainsFileIdentifier) {
                 // return; // Aktifkan jika ingin lebih ketat
            }

            let actorNameInNotif = notif.user?.displayname || 'Sistem Notifikasi';
            let actorTypeInNotif : ApprovalRequestDetail['activityLog'][0]['actorType'] = 'notification_recipient';

            const assignerMatch = notif.message.match(/oleh (.*?)\s+untuk meninjau|oleh (.*?)\s+dan menunggu|diperbarui oleh (.*?)\s+dan membutuhkan|diajukan ulang oleh (.*?)\s+dan menunggu/i);
            const approverMatch = notif.message.match(/^(.*?)\s+telah mengambil tindakan/i);

            if (assignerMatch) {
                actorNameInNotif = assignerMatch[1] || assignerMatch[2] || assignerMatch[3] || assignerMatch[4] || actorNameInNotif;
                actorTypeInNotif = 'assigner';
            } else if (approverMatch && approverMatch[1]) {
                actorNameInNotif = approverMatch[1];
                actorTypeInNotif = 'approver';
            } else if (
                notif.type === NotificationType.NEW_APPROVAL_ASSIGNMENT ||
                notif.type === NotificationType.APPROVAL_FILE_UPDATED_BY_ASSIGNER ||
                notif.type === NotificationType.APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER ||
                notif.type === NotificationType.APPROVAL_REVISED_AWAITING_REVIEW
            ) {
                actorNameInNotif = firstApprovalAction.assigner.displayname || `Pengaju (${firstApprovalAction.assigned_by_user_id.substring(0,6)})`;
                actorTypeInNotif = 'assigner';
            } else if (
                notif.type === NotificationType.APPROVAL_ACTIONED_APPROVED ||
                notif.type === NotificationType.APPROVAL_ACTIONED_REVISION_REQUESTED
            ) {
                actorNameInNotif = "Approver (dari notifikasi)";
                actorTypeInNotif = 'approver';
            } else if (notif.user?.displayname) {
                actorNameInNotif = notif.user.displayname;
                actorTypeInNotif = 'notification_recipient';
            }

            activityLog.push({
                id: `notif-${notif.id}`,
                actorName: actorNameInNotif,
                actorType: actorTypeInNotif,
                actionDescription: notif.message,
                timestamp: notif.created_at.toISOString(),
                formattedTimestamp: formatTimestampForDisplay(notif.created_at.toISOString()),
                isNotification: true,
            });
        });
    }

    activityLog.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const overallStatusCalculated = calculateOverallStatusInternal(approversList);

    const responseData: ApprovalRequestDetail = {
        sharedApprovalProcessCuid: targetProcessCuid!,
        fileIdRef: actualFileIdRef!,
        file: fileInfoForResponse,
        assigner: firstApprovalAction.assigner ? {
            id: firstApprovalAction.assigner.id,
            displayname: firstApprovalAction.assigner.displayname,
            primaryemail: firstApprovalAction.assigner.primaryemail
        } : null,
        createdAt: firstApprovalAction.created_at.toISOString(),
        updatedAt: latestApprovalAction.updated_at.toISOString(),
        overallStatus: overallStatusCalculated,
        approvers: approversList,
        activityLog: activityLog,
    };

    return NextResponse.json({ message: "Detail approval berhasil diambil.", data: responseData });

  } catch (error: any) {
    const identifierInfo = processCuidFromQuery || fileIdRefFromQuery || "UNKNOWN_IDENTIFIER_IN_CATCH";
    console.error(`================================================================`);
    console.error(`API ERROR: /api/approvals/getinfo?identifier=${identifierInfo}`);
    console.error(`Timestamp: ${new Date().toISOString()}`); console.error(`Error Message: ${error.message}`); console.error(`Error Code (Prisma): ${error.code}`); console.error(`Error Stack: ${error.stack}`);
    console.error(`================================================================`);
    let errorMessage = "Terjadi kesalahan internal server saat mengambil detail approval."; let errorStatus = 500;
    if (error.code === 'P2025' || error.message?.includes("Tidak ada data approval untuk identifier")) { errorMessage = `Data approval untuk identifier ${identifierInfo} tidak ditemukan.`; errorStatus = 404; }
    return NextResponse.json({ error: errorMessage, details: error.message || "Tidak ada detail tambahan." }, { status: errorStatus });
  }
}

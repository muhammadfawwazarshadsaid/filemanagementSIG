// File: app/api/approvals/getinfo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, format, isValid as isValidDateFn } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

import type {
    ApprovalUser,
    IndividualApproverAction,
    OverallApprovalStatusKey,
    IndividualApprovalStatusKey,
} from '@/components/approvals/schema';
import { type approval as PrismaApproval, type user as PrismaUser, type file as PrismaFile, type notification as PrismaNotification } from '@/lib/generated/prisma/client';
import { NotificationType } from '@/lib/notifications';

type FileDetailInResponse = {
    id: string; filename: string | null; mimeType: string | null; description: string | null;
    workspace_id: string | null; user_id: string | null; gdrive_fetch_error?: string | null;
    db_created_at?: string | null; db_updated_at?: string | null;
    pengesahan_pada?: string | null; color?: string | null; labels?: string[];
    webViewLink?: string | null;
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
        details?: string | null;
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
    const allActioned = approvers.every((act: IndividualApproverAction) => act.statusKey !== 'pending' && act.statusKey !== 'unknown');
    const allApproved = approvers.every((act: IndividualApproverAction) => act.statusKey === 'approved');
    const anyPending = approvers.some((act: IndividualApproverAction) => act.statusKey === 'pending' || act.statusKey === 'unknown');

    if (hasRevision) return 'Perlu Revisi';
    if (allActioned && allApproved) return 'Sah';
    if (anyPending) return 'Menunggu Persetujuan';
    // Revisi: Kondisi ini mungkin lebih akurat jika ada yang ditolak/revisi tapi tidak semua approved
    if (allActioned && !allApproved) return 'Menunggu Persetujuan'; // Atau mungkin 'Ditolak Sebagian'/'Tindakan Selesai, Tidak Sah'? Tergantung logika bisnis.
    return 'Belum Ada Tindakan';
};

const formatTimestampForDisplayInternal = (isoTimestamp?: string | Date | null): string => {
    if (!isoTimestamp) return "N/A";
    try {
        const date = typeof isoTimestamp === 'string' ? parseISO(isoTimestamp) : isoTimestamp;
        if (!isValidDateFn(date)) { // isValidDateFn adalah alias dari date-fns isValid
             console.warn("[API GetInfo] Invalid date object for formatDate:", date, "Original ISO/Date:", isoTimestamp);
             return "Tanggal Tidak Valid";
        }
        return format(date, "d MMM yy, HH:mm", { locale: localeID });
    } catch (e: any) {
        console.warn(`[API GetInfo] Error formatting date: ${String(isoTimestamp)}`, e);
        return typeof isoTimestamp === 'string' ? isoTimestamp : "Format Tanggal Salah";
    }
};


export async function GET(request: NextRequest) {// Log untuk memastikan fungsi ini terpanggil
  console.log(`[${new Date().toISOString()}] ===> API /api/approvals/getinfo ROUTE HANDLER ENTERED <===`);

  const searchParams = request.nextUrl.searchParams;
  const fileIdRefFromQuery = searchParams.get('fileIdRef');
  const processCuidFromQuery = searchParams.get('processId');

  console.log(`[API GetInfo V3] Received fileIdRef: ${fileIdRefFromQuery}, processCuid: ${processCuidFromQuery}`);

  if (!processCuidFromQuery && !fileIdRefFromQuery) {
    return NextResponse.json({ error: "Parameter processId atau fileIdRef wajib diisi." }, { status: 400 });
  }

  const authHeader = request.headers.get('Authorization');
  let googleAccessToken: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    googleAccessToken = authHeader.substring(7);
  }

  try {console.log(`[${new Date().toISOString()}] === SERVER LOG: API /api/approvals/getinfo TRY BLOCK ENDING, preparing response ===`); // <--- LOG SEBELUM SUKSES
    
    let approvalActionsFromDb: (PrismaApproval & { approver: PrismaUser | null, assigner: PrismaUser | null, file: PrismaFile | null })[] = [];
    let targetProcessCuid: string | null = processCuidFromQuery;
    let actualFileIdRef: string | null = fileIdRefFromQuery;

    if (targetProcessCuid) {
        approvalActionsFromDb = await prisma.approval.findMany({
            where: { id: targetProcessCuid },
            include: { approver: true, assigner: true, file: true },
            orderBy: [{ created_at: 'asc' }],
        });
        if (approvalActionsFromDb.length > 0) {
            actualFileIdRef = approvalActionsFromDb[0].file_id_ref; // file_id_ref dijamin ada oleh schema
        } else if (actualFileIdRef) { // Jika processCuid tidak ditemukan, coba cari process terbaru berdasarkan fileIdRef
            console.warn(`[API GetInfo] No approval actions for processCuid ${targetProcessCuid}, fallback to fileIdRef ${actualFileIdRef}`);
            const latestProcessForFile = await prisma.approval.findFirst({
                where: { file_id_ref: actualFileIdRef },
                orderBy: { created_at: 'desc'},
                select: {id: true}
            });
            if(latestProcessForFile){
                targetProcessCuid = latestProcessForFile.id;
                 approvalActionsFromDb = await prisma.approval.findMany({
                    where: { id: targetProcessCuid },
                    include: { approver: true, assigner: true, file: true },
                    orderBy: [{ created_at: 'asc' }],
                });
                 if (approvalActionsFromDb.length > 0 && !actualFileIdRef) { // Pastikan actualFileIdRef terisi jika sebelumnya null
                    actualFileIdRef = approvalActionsFromDb[0].file_id_ref;
                 }
            }
        }
    } else if (actualFileIdRef) { // Hanya fileIdRef yang diberikan
        const latestProcessForFile = await prisma.approval.findFirst({
            where: { file_id_ref: actualFileIdRef },
            orderBy: { created_at: 'desc'},
            select: {id: true}
        });
        if(latestProcessForFile){
            targetProcessCuid = latestProcessForFile.id;
            approvalActionsFromDb = await prisma.approval.findMany({
                where: { id: targetProcessCuid },
                include: { approver: true, assigner: true, file: true },
                orderBy: [{ created_at: 'asc' }],
            });
        }
    }

    if (!approvalActionsFromDb || approvalActionsFromDb.length === 0 || !targetProcessCuid || !actualFileIdRef) {
      const identifier = processCuidFromQuery || fileIdRefFromQuery || "Tidak ada identifier";
      console.warn(`[API GetInfo] No approval data found for identifier: ${identifier}. approvalActionsFromDb count: ${approvalActionsFromDb?.length}, targetProcessCuid: ${targetProcessCuid}, actualFileIdRef: ${actualFileIdRef}`);
      return NextResponse.json({ error: `Tidak ada data approval untuk identifier ${identifier}` }, { status: 404 });
    }
    
    const firstApprovalAction = approvalActionsFromDb[0];
    const latestApprovalAction = approvalActionsFromDb.reduce((latest, current) => 
        new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest, 
        approvalActionsFromDb[0]
    );
    
    const dbFileRecord = firstApprovalAction.file;

    // Fallback untuk gDriveFileName, pastikan actualFileIdRef ada sebelum substring
    let gDriveFileName: string | null = (dbFileRecord as any)?.filename || dbFileRecord?.description?.substring(0,30) || (actualFileIdRef ? `[ID] ${actualFileIdRef.substring(0,5)}...` : "ID File Tidak Tersedia");
    let gDriveMimeType: string | null = (dbFileRecord as any)?.mimeType || null;
    let gDriveDescriptionFromAPI: string | null = null;
    let gDriveFetchError: string | null = null;
    let gDriveWebViewLink: string | null = (dbFileRecord as any)?.webViewLink || null;

    // --- AWAL PERUBAHAN: Peningkatan Error Handling untuk Google Drive API Call ---
    if (googleAccessToken && actualFileIdRef) {
      try {
        const gDriveApiUrl = `https://www.googleapis.com/drive/v3/files/${actualFileIdRef}?fields=id,name,mimeType,description,webViewLink`;
        const response = await fetch(gDriveApiUrl, { headers: { 'Authorization': `Bearer ${googleAccessToken}` } });
        
        if (response.ok) {
          try {
            const gDriveData = await response.json();
            gDriveFileName = gDriveData.name || gDriveFileName; // Gunakan fallback jika gDriveData.name null
            gDriveMimeType = gDriveData.mimeType || gDriveMimeType;
            gDriveDescriptionFromAPI = gDriveData.description || null;
            gDriveWebViewLink = gDriveData.webViewLink || gDriveWebViewLink;
          } catch (parseError: any) {
            console.error(`[API GetInfo] GDrive JSON parse error for fileId ${actualFileIdRef} (Status ${response.status}):`, parseError);
            gDriveFetchError = `GDrive API Error: Gagal memparsing respons JSON. Status: ${response.status}. Pesan: ${parseError.message}`;
          }
        } else {
          let errorDataMessage = response.statusText;
          try {
            // Coba parsing error response dari GDrive jika ada
            const errorData = await response.json();
            errorDataMessage = errorData?.error?.message || errorDataMessage;
          } catch (e) {
            // Abaikan jika error response itu sendiri bukan JSON
            console.warn(`[API GetInfo] GDrive error response (Status ${response.status}) for fileId ${actualFileIdRef} was not JSON.`);
          }
          gDriveFetchError = `GDrive API Error ${response.status}: ${errorDataMessage}`;
        }
      } catch (fetchException: any) { // Menangkap error network atau fetch lainnya
        console.error(`[API GetInfo] GDrive fetch exception for fileId ${actualFileIdRef}:`, fetchException);
        gDriveFetchError = `Exception saat mengambil data GDrive: ${fetchException.message}`;
      }
    } else if (!actualFileIdRef) {
        gDriveFetchError = "File ID Ref tidak ditemukan pada approval record, tidak bisa fetch GDrive.";
    } else { // !googleAccessToken
        gDriveFetchError = "Token Google tidak tersedia untuk mengambil detail file dari GDrive.";
    }
    // --- AKHIR PERUBAHAN ---

    const fileInfoForResponse: FileDetailInResponse = {
        id: actualFileIdRef, // actualFileIdRef dijamin non-null di sini oleh check di atas
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
        webViewLink: gDriveWebViewLink
    };

    const uniqueApproversMap = new Map<string, IndividualApproverAction>();
    approvalActionsFromDb.forEach(action => {
        // approver_user_id dijamin ada oleh schema
        uniqueApproversMap.set(action.approver_user_id, {
            individualApprovalId: `${action.id}-${action.approver_user_id}`, // id (CUID) dijamin ada
            approverId: action.approver_user_id,
            approverName: action.approver?.displayname || `User (${action.approver_user_id.substring(0,6)})`,
            approverEmail: action.approver?.primaryemail || undefined,
            statusKey: getIndividualStatusKeyInternal(action.status),
            statusDisplay: action.status || "N/A",
            actioned_at: action.actioned_at?.toISOString() || null,
            remarks: action.remarks,
        });
    });
    const approversList = Array.from(uniqueApproversMap.values());

    const activityLog: ApprovalRequestDetail['activityLog'] = [];

    // 1. Tambahkan log dari aksi approval (assigner & approver actions)
    // Log pengajuan awal
    if (firstApprovalAction) { // Pastikan firstApprovalAction ada
        activityLog.push({
            id: `submit-${targetProcessCuid}-${firstApprovalAction.created_at.toISOString()}`,
            actorName: firstApprovalAction.assigner?.displayname || `Pengaju (${firstApprovalAction.assigned_by_user_id.substring(0,6)})`,
            actorType: 'assigner',
            actionDescription: `mengajukan persetujuan untuk file "${fileInfoForResponse.filename || actualFileIdRef}"`,
            timestamp: firstApprovalAction.created_at.toISOString(),
            formattedTimestamp: formatTimestampForDisplayInternal(firstApprovalAction.created_at),
            isNotification: false,
        });
    }

    // Log tindakan dari approver
    approvalActionsFromDb.forEach(action => {
        if (action.actioned_at && action.approver) {
            activityLog.push({
                id: `action-${action.id}-${action.approver_user_id}-${action.actioned_at.toISOString()}`,
                actorName: action.approver.displayname || `Approver (${action.approver_user_id.substring(0,6)})`,
                actorType: 'approver',
                actionDescription: `memberikan status "${action.status || 'N/A'}"`,
                details: action.remarks || undefined,
                timestamp: action.actioned_at.toISOString(),
                formattedTimestamp: formatTimestampForDisplayInternal(action.actioned_at),
                statusKey: getIndividualStatusKeyInternal(action.status),
                remarks: action.remarks,
                isNotification: false,
            });
        }
        // PERHATIAN: Jika ada aksi assigner yang juga menghasilkan notifikasi "dokumen diperbarui",
        // kita mungkin perlu cara yang lebih canggih untuk menandainya agar tidak duplikat dengan notifikasi.
        // Untuk saat ini, kita fokus pada de-duplikasi notifikasi spesifik.
    });
    
    // 2. Ambil Notifikasi
    const notifications = await prisma.notification.findMany({
        where: {
            // GANTI INI DENGAN NAMA FIELD YANG BENAR DARI SCHEMA.PRISMA ANDA JIKA MASIH SALAH
            related_approval_process_cuid: targetProcessCuid,
        },
        include: {
            user: { select: { id: true, displayname: true } }
        },
        orderBy: { created_at: 'asc' }
    });

    // --- AWAL PERUBAHAN DE-DUPLIKASI ---
    const processedNotificationSignatures = new Set<string>(); // Ganti nama Set

    notifications.forEach(notif => {
        let actorNameInNotif = 'Sistem Notifikasi';
        let actorTypeInNotif : ApprovalRequestDetail['activityLog'][0]['actorType'] = 'system';

        // Logika penentuan actorNameInNotif dan actorTypeInNotif tetap sama...
        if (notif.type === NotificationType.APPROVAL_FILE_UPDATED_BY_ASSIGNER || 
            notif.type === NotificationType.APPROVAL_FILE_RESUBMITTED_BY_ASSIGNER) {
            actorNameInNotif = firstApprovalAction.assigner?.displayname || `Pengaju (${firstApprovalAction.assigned_by_user_id.substring(0,6)})`;
            actorTypeInNotif = 'assigner';
        } else if (notif.type === NotificationType.NEW_APPROVAL_ASSIGNMENT) {
            actorNameInNotif = firstApprovalAction.assigner?.displayname || `Pengaju (${firstApprovalAction.assigned_by_user_id.substring(0,6)})`;
            actorTypeInNotif = 'assigner';
        } else if (notif.type === NotificationType.APPROVAL_ACTIONED_APPROVED ||
                   notif.type === NotificationType.APPROVAL_ACTIONED_REVISION_REQUESTED) {
            const approverInMessage = approversList.find(appr => notif.message.includes(appr.approverName || ''));
            actorNameInNotif = approverInMessage?.approverName || "Approver (Info Aksi)";
            actorTypeInNotif = 'approver';
        } else if (notif.user?.displayname) {
             actorNameInNotif = notif.user.displayname;
             actorTypeInNotif = 'notification_recipient';
        }

        const formattedNotifTimestamp = formatTimestampForDisplayInternal(notif.created_at);

        // Logika de-duplikasi yang lebih umum
        const isPotentiallyDuplicatedMessage =
            notif.message.includes("Dokumen telah diperbarui oleh") || // Pola 1 (dari sebelumnya)
            (notif.message.includes("telah direvisi oleh") && notif.message.includes("menunggu tinjauan ulang Anda")); // Pola 2 (baru)
            // Anda bisa menambahkan || notif.message.includes("pola lain") di sini jika ada

        if (isPotentiallyDuplicatedMessage) {
            const timestampMinuteKey = format(parseISO(notif.created_at.toISOString()), "yyyy-MM-dd HH:mm");
            // Signature: Actor Name + Seluruh Pesan + Timestamp (presisi menit)
            // Ini akan men-de-duplikasi jika aktor, seluruh pesan, dan menitnya identik.
            const notificationSignature = `${actorNameInNotif}#${notif.message}#${timestampMinuteKey}`;

            if (processedNotificationSignatures.has(notificationSignature)) {
                console.log(`[API GetInfo] Skipping duplicate notification: "${notif.message.substring(0, 40)}..." by ${actorNameInNotif} at ${formattedNotifTimestamp}`);
                return; // Lewati penambahan notifikasi duplikat ini
            }
            processedNotificationSignatures.add(notificationSignature);
        }
        // --- AKHIR PERUBAHAN DE-DUPLIKASI ---


        activityLog.push({
            id: `notif-${notif.id}`,
            actorName: actorNameInNotif,
            actorType: actorTypeInNotif,
            actionDescription: notif.message,
            timestamp: notif.created_at.toISOString(),
            formattedTimestamp: formattedNotifTimestamp,
            isNotification: true,
        });
    });

    // 3. Urutkan semua log berdasarkan timestamp
    activityLog.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const overallStatusCalculated = calculateOverallStatusInternal(approversList);
    const responseData: ApprovalRequestDetail = {
        sharedApprovalProcessCuid: targetProcessCuid, // targetProcessCuid dijamin non-null
        fileIdRef: actualFileIdRef, // actualFileIdRef dijamin non-null
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
    console.error(`[${new Date().toISOString()}] === SERVER LOG: API /api/approvals/getinfo CATCH BLOCK ENTERED ===`); // <--- LOG PENTING 2
    const identifierInfo = processCuidFromQuery || fileIdRefFromQuery || "UNKNOWN_IDENTIFIER_IN_CATCH";
    // Log error ke server console untuk debugging
    console.error(`================================================================`);
    console.error(`API ERROR: /api/approvals/getinfo?identifier=${identifierInfo}`);
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Error Type: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`Error Code (Prisma): ${error.code}`);
    console.error(`Error Stack: ${error.stack}`);
    console.error(`================================================================`);
    
    let errorMessage = "Terjadi kesalahan internal server saat mengambil detail approval.";
    let errorStatus = 500;
    
    const detailsForClient = process.env.NODE_ENV === 'development' ? error.message : "Silakan cek log server untuk detail.";

    // P2025 adalah error Prisma "Record to update not found" atau sejenisnya, bisa jadi 404.
    if (error.code === 'P2025' || error.message?.includes("Tidak ada data approval untuk identifier")) { 
        errorMessage = `Data approval untuk identifier ${identifierInfo} tidak ditemukan.`; 
        errorStatus = 404; 
    }
    // Tambahkan penanganan untuk error spesifik lainnya jika perlu

    return NextResponse.json({ error: errorMessage, details: detailsForClient }, { status: errorStatus });
  }
}
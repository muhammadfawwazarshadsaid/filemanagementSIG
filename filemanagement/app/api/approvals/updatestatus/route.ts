// File: app/api/approvals/updatestatus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyAssignerOnApprovalAction } from '@/lib/notifications'; // Pastikan path ini benar
import type { approval as PrismaApproval, user as PrismaUser, file as PrismaFile } from '@/lib/generated/prisma/client';


interface UpdateStatusRequestBody {
  sharedApprovalProcessCuid: string;
  approverUserId: string;
  status: string;
  remarks?: string;
}

const ALLOWED_ACTION_STATUSES = ["Sah", "Perlu Revisi"];

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as UpdateStatusRequestBody;
    const { sharedApprovalProcessCuid, approverUserId, status, remarks } = body;

    console.log("[API updatestatus] Request body diterima:", JSON.stringify(body, null, 2));

    if (!sharedApprovalProcessCuid || !approverUserId || !status) {
      return NextResponse.json({ error: "sharedApprovalProcessCuid, approverUserId, dan status wajib diisi." }, { status: 400 });
    }

    if (!ALLOWED_ACTION_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status tidak valid. Status yang diizinkan: ${ALLOWED_ACTION_STATUSES.join(', ')}.` }, { status: 400 });
    }

    if (status === "Perlu Revisi" && (!remarks || remarks.trim() === "")) {
      return NextResponse.json({ error: "Remarks wajib diisi jika status adalah 'Perlu Revisi'." }, { status: 400 });
    }

    const existingApproval = await prisma.approval.findUnique({
      where: {
        id_approver_user_id: {
          id: sharedApprovalProcessCuid,
          approver_user_id: approverUserId,
        }
      },
      include: { file: true, approver: true, assigner: true }
    });

    if (!existingApproval) {
      console.warn(`[API updatestatus] Approval tidak ditemukan untuk CUID ${sharedApprovalProcessCuid} dan approver ${approverUserId}`);
      return NextResponse.json({ error: "Approval tidak ditemukan atau Anda tidak memiliki akses ke approval ini." }, { status: 404 });
    }

    if (existingApproval.status === "Sah" && status !== "Sah") {
      return NextResponse.json({ error: `Approval sudah dalam status final ('Sah') dan tidak dapat diubah ke '${status}'.` }, { status: 400 });
    }
    
    const updatedApproval = await prisma.approval.update({
      where: {
        id_approver_user_id: {
          id: sharedApprovalProcessCuid,
          approver_user_id: approverUserId,
        }
      },
      data: {
        status,
        remarks: status === "Perlu Revisi" ? remarks : (status === "Sah" ? (remarks || existingApproval.remarks || null) : null),
        actioned_at: new Date(),
      },
      include: {
        file: true,
        approver: true,
        assigner: true,
      }
    });

    if (updatedApproval.assigner && updatedApproval.file && updatedApproval.approver) {
        const fileIdentifier = (updatedApproval.file as any)?.filename || (updatedApproval.file as any)?.description || `File ID: ${updatedApproval.file_id_ref}`;
        await notifyAssignerOnApprovalAction(
            updatedApproval as PrismaApproval & { assigner: PrismaUser, approver: PrismaUser, file: PrismaFile }, 
            fileIdentifier
        );
    }

    if (updatedApproval.status === "Sah") {
      const allApprovalsForThisProcess = await prisma.approval.findMany({
        where: {
          id: sharedApprovalProcessCuid,
        }
      });
      const allApproved = allApprovalsForThisProcess.every(appr => appr.status === "Sah");
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
  }
}